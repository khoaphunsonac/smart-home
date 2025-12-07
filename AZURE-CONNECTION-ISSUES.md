# Giải quyết vấn đề kết nối Azure MySQL không ổn định

## Vấn đề: Đăng nhập lúc được lúc không

Đây là vấn đề phổ biến khi sử dụng Azure MySQL Database do nhiều nguyên nhân:

### Nguyên nhân chính

1. **Network latency** - Khoảng cách địa lý đến Azure datacenter
2. **Connection pool quá nhỏ** - Không đủ connections để xử lý requests
3. **Idle timeout** - Azure đóng connections idle quá lâu
4. **Firewall rules** - IP thay đổi hoặc chưa được whitelist
5. **SSL handshake timeout** - Kết nối SSL mất thời gian
6. **Azure MySQL cold start** - Database tier thấp bị sleep

## ✅ Giải pháp đã áp dụng

### 1. Tối ưu Connection Pool (Backend)

Đã cập nhật trong `backend/config/database.js`:

```javascript
pool: {
    max: 5,        // Giảm max connections tránh quá tải
    min: 1,        // Giữ ít nhất 1 connection active
    acquire: 60000, // Tăng timeout lấy connection lên 60s
    idle: 20000,   // Tăng idle time lên 20s
    evict: 30000,  // Check idle connections mỗi 30s
}
```

**Tác dụng:**
- Giữ 1 connection luôn active → tránh cold start
- Timeout dài hơn → chờ Azure response thay vì fail ngay
- Evict định kỳ → loại bỏ dead connections

### 2. Retry Logic (Backend)

```javascript
retry: {
    max: 3,  // Thử lại tối đa 3 lần
    match: [
        /ETIMEDOUT/,
        /ECONNRESET/,
        /SequelizeConnectionError/,
        ...
    ],
}
```

**Tác dụng:**
- Tự động retry khi gặp network error
- Không fail ngay lập tức

### 3. Retry trên Frontend

Đã cập nhật trong `smart-workplace/lib/api.ts`:

```typescript
// Retry tối đa 3 lần với delay 1 giây
const retryRequest = async (fn, retries = 3) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && shouldRetry(error)) {
            await delay(1000);
            return retryRequest(fn, retries - 1);
        }
        throw error;
    }
};
```

**Tác dụng:**
- Nếu login fail, tự động retry 3 lần
- Delay 1s giữa các lần retry
- User không cần bấm lại

### 4. Tăng Timeout

- Backend: `connectTimeout: 60000` (60s)
- Frontend API: `timeout: 30000` (30s)

**Tác dụng:**
- Đủ thời gian cho Azure response
- Tránh timeout sớm khi network chậm

## 🔧 Cấu hình Azure bổ sung

### 1. Tăng Connection Limit trong Azure

1. Mở **Azure Portal** > Your MySQL Server
2. Vào **Settings** > **Server parameters**
3. Tìm và tăng các parameters:
   ```
   max_connections: 100 → 150
   connect_timeout: 10 → 30
   wait_timeout: 28800 (8 hours)
   interactive_timeout: 28800
   ```

### 2. Chọn Compute Tier phù hợp

Azure MySQL có 3 tiers:
- **Basic** - Rẻ nhưng dễ sleep, không HA
- **General Purpose** - Cân bằng, khuyến nghị cho production
- **Memory Optimized** - Hiệu năng cao nhất

**Khuyến nghị:** Ít nhất **General Purpose** với:
- vCores: 2-4
- Storage: 32GB+
- Backup retention: 7 days

### 3. Enable High Availability

Nếu budget cho phép:
1. Azure Portal > MySQL Server > **High availability**
2. Bật **Zone redundant high availability**

**Tác dụng:**
- Failover tự động khi server chính down
- Uptime 99.99%

### 4. Kiểm tra Firewall Rules

```bash
# Kiểm tra IP hiện tại
curl ifconfig.me

# Thêm vào Azure Portal:
# Settings > Connection security > Firewall rules
# Hoặc allow all Azure services
```

### 5. Connection String tối ưu

Đảm bảo trong `.env`:
```env
DB_HOST=your-server.mysql.database.azure.com
DB_USER=username@servername  # Đúng format!
DB_PASSWORD=strong_password
DB_PORT=3306
DB_NAME=smart_home

# Optional cho connection tốt hơn
MYSQL_ATTR_SSL_CA=/path/to/BaltimoreCyberTrustRoot.crt.pem
```

## 🔍 Debugging kết nối không ổn định

### 1. Kiểm tra log Backend

Khi backend start, bạn sẽ thấy:
```
📦 MySQL Connected successfully
   Host: your-server.mysql.database.azure.com
   Database: smart_home
   SSL: Enabled (Azure)
```

Nếu có lỗi:
```
❌ Database connection error: ...
💡 Troubleshooting tips:
   - Check Azure MySQL firewall rules
   - Verify username format: username@servername
   ...
```

### 2. Monitor trong Azure Portal

1. **Metrics** tab:
   - CPU usage
   - Memory usage
   - Active connections
   - Failed connections

2. **Query Performance Insight**:
   - Slow queries
   - Connection errors

3. **Alerts**:
   Tạo alert khi:
   - Connection count > 80% max
   - CPU > 80%
   - Failed connections > 10/min

### 3. Test kết nối trực tiếp

```bash
# Windows PowerShell
cd backend
node -e "require('./config/database').connectDB()"
```

Nếu thành công → Backend config OK
Nếu fail → Vấn đề ở Azure hoặc network

## 📊 Monitoring & Logging

### 1. Bật Query Logging trong Azure

Azure Portal > Settings > Server logs:
```
slow_query_log: ON
long_query_time: 2  # Log queries > 2 seconds
```

### 2. Thêm logging trong code

Backend đã có logging tự động:
- Mỗi kết nối thành công
- Mỗi lỗi connection với troubleshooting tips

Frontend sẽ log:
```
Retrying request... (1/3)
Retrying request... (2/3)
Retrying request... (3/3)
```

### 3. Sử dụng Azure Application Insights

Nếu deploy lên Azure App Service:
1. Enable Application Insights
2. Track custom events:
   - Login success/failure
   - Connection errors
   - Response times

## ⚡ Performance Tips

### 1. Sử dụng Connection Pooling đúng cách

❌ **KHÔNG NÊN:**
```javascript
// Tạo connection mới mỗi request
const connection = await mysql.createConnection(...)
```

✅ **NÊN:**
```javascript
// Sử dụng pool có sẵn (đã config)
await sequelize.query(...)
```

### 2. Giảm số lượng queries

❌ **KHÔNG NÊN:**
```javascript
for (let device of devices) {
    await Device.findByPk(device.id);  // N+1 queries
}
```

✅ **NÊN:**
```javascript
await Device.findAll({
    where: { id: deviceIds },
    include: [Room]  // Eager loading
});
```

### 3. Sử dụng Redis Cache (Optional)

Nếu vẫn chậm, thêm Redis:
```javascript
// Cache profile data 5 phút
const cachedUser = await redis.get(`user:${userId}`);
if (cachedUser) return cachedUser;

const user = await User.findByPk(userId);
await redis.set(`user:${userId}`, user, 'EX', 300);
```

## 🚨 Xử lý lỗi cụ thể

### Lỗi: "ETIMEDOUT"
**Nguyên nhân:** Network chậm hoặc Azure đang quá tải

**Giải pháp:**
- ✅ Đã có retry tự động
- Check Azure metrics
- Nếu thường xuyên → upgrade tier

### Lỗi: "ECONNRESET"
**Nguyên nhân:** Connection bị đóng bất ngờ

**Giải pháp:**
- ✅ Đã có retry tự động
- Tăng `wait_timeout` trong Azure
- Kiểm tra firewall không block

### Lỗi: "Too many connections"
**Nguyên nhân:** Quá nhiều connections đồng thời

**Giải pháp:**
- Tăng `max_connections` trong Azure
- Giảm `pool.max` trong config
- Check memory leaks

### Lỗi: "SSL connection error"
**Nguyên nhân:** SSL handshake fail

**Giải pháp:**
```javascript
// Đã config tự động:
ssl: {
    require: true,
    rejectUnauthorized: false
}
```

## 📈 Checklist tối ưu

- [x] Connection pool đã được tối ưu (min=1, max=5)
- [x] Retry logic đã enable (3 lần, delay 1s)
- [x] Timeout đã tăng (60s backend, 30s frontend)
- [ ] Azure tier phù hợp (General Purpose recommended)
- [ ] Firewall rules đã thêm IP
- [ ] High Availability đã bật (nếu cần)
- [ ] Monitoring & alerts đã setup
- [ ] Connection parameters đã tối ưu
- [ ] Query performance đã optimize

## 💡 Khuyến nghị cuối cùng

### Nếu budget hạn chế:
1. Giữ **Basic tier** nhưng:
   - Tăng storage lên 32GB
   - Enable backup retention
   - Sử dụng retry logic (đã có)

### Nếu muốn production-ready:
1. Upgrade lên **General Purpose** (2 vCores)
2. Enable High Availability
3. Setup Application Insights
4. Thêm Redis cache cho frequently accessed data

### Nếu vẫn không ổn định:
1. Check IP có thay đổi không → add vào firewall
2. Test từ Azure Cloud Shell → loại trừ network local
3. Contact Azure Support → có thể server đang có vấn đề

## 🔗 Tài liệu tham khảo

- [Azure MySQL Best Practices](https://docs.microsoft.com/en-us/azure/mysql/concepts-best-practices)
- [Connection Pooling](https://docs.microsoft.com/en-us/azure/mysql/concepts-connectivity)
- [Performance Recommendations](https://docs.microsoft.com/en-us/azure/mysql/concepts-performance-recommendations)

## ❓ Still having issues?

Nếu sau khi áp dụng tất cả vẫn gặp vấn đề:

1. **Export logs:**
   ```bash
   # Backend logs
   npm run dev > backend.log 2>&1
   
   # Frontend console (F12 > Console > Save as...)
   ```

2. **Test network:**
   ```bash
   ping your-server.mysql.database.azure.com
   telnet your-server.mysql.database.azure.com 3306
   ```

3. **Check Azure status:**
   - https://status.azure.com/

4. **Liên hệ Azure Support** với thông tin:
   - Server name
   - Thời gian xảy ra lỗi
   - Error messages
   - Backend logs
