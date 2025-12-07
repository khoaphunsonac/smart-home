# Hướng dẫn cấu hình Azure MySQL Database

## Tổng quan

Backend đã được cấu hình sẵn để hỗ trợ Azure MySQL Database với SSL connection. Bạn chỉ cần cập nhật file `.env` với thông tin Azure của bạn.

## Điều kiện tiên quyết

### 1. Tạo Azure MySQL Database
1. Truy cập [Azure Portal](https://portal.azure.com)
2. Tạo **Azure Database for MySQL - Flexible Server** hoặc **Single Server**
3. Ghi lại thông tin:
   - **Server name**: `your-server-name.mysql.database.azure.com`
   - **Admin username**: `your-admin-username`
   - **Password**: Mật khẩu bạn đã tạo
   - **Database name**: `smart_home` (tạo database này sau khi server ready)

### 2. Cấu hình Firewall
Trong Azure Portal, mở tab **Connection security** hoặc **Networking**:
- Thêm địa chỉ IP của máy bạn vào whitelist
- Hoặc bật "Allow access to Azure services" (cho development)

### 3. Tạo Database
Kết nối vào Azure MySQL bằng MySQL Workbench hoặc Azure Cloud Shell:
```sql
CREATE DATABASE smart_home;
```

## Cấu hình Backend

### Bước 1: Cập nhật file .env

Mở file `backend/.env` và cập nhật các thông tin sau:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000

# Azure MySQL Database Configuration
DB_HOST=your-server-name.mysql.database.azure.com
DB_PORT=3306
DB_NAME=smart_home
DB_USER=your-admin-username@your-server-name
DB_PASSWORD=your-azure-mysql-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Ví dụ cấu hình thực tế:

```env
# Ví dụ nếu Azure server của bạn là: smarthome-db.mysql.database.azure.com
# Admin username: smarthome_admin

DB_HOST=smarthome-db.mysql.database.azure.com
DB_PORT=3306
DB_NAME=smart_home
DB_USER=smarthome_admin@smarthome-db
DB_PASSWORD=YourSecurePassword123!
```

**Lưu ý quan trọng:**
- Username phải có format: `username@servername`
- VD: Nếu server là `smarthome-db` và username là `admin`, thì DB_USER phải là `admin@smarthome-db`

### Bước 2: Kiểm tra SSL Connection

Code trong `backend/config/database.js` đã tự động bật SSL khi phát hiện Azure:

```javascript
ssl: process.env.DB_HOST && process.env.DB_HOST.includes("azure.com")
    ? {
          require: true,
          rejectUnauthorized: false,
      }
    : false,
```

Bạn **KHÔNG CẦN** thay đổi gì ở file này.

### Bước 3: Khởi tạo Database

```bash
cd backend
npm install
npm run init-data
```

Bạn sẽ thấy:
```
🔄 Initializing database...
✅ Database connection established
✅ Admin user created (username: admin, password: admin123)
✅ Sample data created
🎉 Database initialization completed
```

### Bước 4: Chạy Backend

```bash
npm run dev
```

Nếu kết nối thành công, bạn sẽ thấy:
```
🚀 Server is running on port 5000 in development mode
📦 MySQL Connected successfully
```

## Xử lý lỗi thường gặp

### Lỗi: "ER_ACCESS_DENIED_ERROR"
**Nguyên nhân:** Username hoặc password sai

**Giải pháp:**
1. Kiểm tra username có đúng format `username@servername` không
2. Kiểm tra password có đúng không
3. Trong Azure Portal, vào **Settings > Reset password** nếu cần

### Lỗi: "ER_DBACCESS_DENIED_ERROR"
**Nguyên nhân:** User không có quyền truy cập database

**Giải pháp:**
```sql
-- Kết nối với admin user, sau đó chạy:
GRANT ALL PRIVILEGES ON smart_home.* TO 'your-username'@'%';
FLUSH PRIVILEGES;
```

### Lỗi: "connect ETIMEDOUT"
**Nguyên nhân:** Firewall chặn kết nối

**Giải pháp:**
1. Vào Azure Portal > Your MySQL Server > **Connection security**
2. Thêm IP hiện tại của bạn vào whitelist
3. Hoặc tạm thời bật "Allow access to Azure services"

### Lỗi: "SSL connection is required"
**Nguyên nhân:** Azure yêu cầu SSL nhưng config chưa đúng

**Giải pháp:**
Code đã tự động bật SSL cho Azure. Nếu vẫn lỗi:
1. Kiểm tra `DB_HOST` có chứa `azure.com` không
2. Kiểm tra Azure MySQL Server có enforce SSL không (Settings > Connection security)

### Lỗi: "Unknown database 'smart_home'"
**Nguyên nhân:** Database chưa được tạo

**Giải pháp:**
```sql
-- Kết nối vào Azure MySQL và chạy:
CREATE DATABASE smart_home CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Kiểm tra kết nối

### Cách 1: Sử dụng MySQL Workbench
1. Mở MySQL Workbench
2. Tạo kết nối mới với thông tin:
   - Hostname: `your-server-name.mysql.database.azure.com`
   - Port: `3306`
   - Username: `your-admin-username@your-server-name`
   - Password: `your-password`
   - SSL: Use SSL (required)

### Cách 2: Sử dụng Azure Cloud Shell
```bash
mysql -h your-server-name.mysql.database.azure.com -u your-admin-username@your-server-name -p
```

### Cách 3: Test với Backend
```bash
cd backend
node -e "require('./config/database').connectDB()"
```

Nếu thành công, bạn sẽ thấy: `📦 MySQL Connected successfully`

## So sánh Local vs Azure

| Khía cạnh | Local MySQL | Azure MySQL |
|-----------|-------------|-------------|
| **DB_HOST** | `localhost` | `servername.mysql.database.azure.com` |
| **DB_USER** | `root` | `username@servername` |
| **DB_PASSWORD** | Thường để trống | Bắt buộc có password |
| **SSL** | Không cần | Bắt buộc |
| **Firewall** | Không cần config | Phải whitelist IP |
| **Cost** | Free | Tính phí theo usage |

## Checklist

- [ ] Đã tạo Azure MySQL Server
- [ ] Đã tạo database `smart_home`
- [ ] Đã thêm IP vào firewall whitelist
- [ ] File `backend/.env` đã cập nhật với thông tin Azure
- [ ] `DB_USER` có format `username@servername`
- [ ] `DB_HOST` có đuôi `.mysql.database.azure.com`
- [ ] Đã test kết nối với MySQL Workbench
- [ ] Chạy `npm run init-data` thành công
- [ ] Backend khởi động không lỗi

## Tips

### 1. Connection String Format
Azure MySQL connection string đầy đủ:
```
mysql://username@servername:password@servername.mysql.database.azure.com:3306/smart_home?ssl-mode=REQUIRED
```

### 2. Performance Optimization
Trong Azure Portal, configure:
- **Compute tier**: Chọn tier phù hợp với nhu cầu
- **Storage**: Tối thiểu 20GB
- **Backup**: Enable automatic backups
- **High Availability**: Enable nếu cần

### 3. Security Best Practices
- Không hardcode password trong code
- Sử dụng Azure Key Vault để lưu credentials
- Enable "Enforce SSL connection" trong Azure
- Giới hạn firewall rules chỉ cho IP cần thiết
- Đổi password admin định kỳ

### 4. Monitoring
Trong Azure Portal, theo dõi:
- **Metrics**: CPU, Memory, Connection count
- **Logs**: Query logs, Error logs
- **Alerts**: Tạo alerts cho high CPU/Memory

## Kết nối từ Azure App Service

Nếu bạn deploy backend lên Azure App Service:

1. Trong App Service, vào **Configuration > Application settings**
2. Thêm các biến môi trường:
   ```
   DB_HOST=your-server-name.mysql.database.azure.com
   DB_USER=username@servername
   DB_PASSWORD=your-password
   DB_NAME=smart_home
   DB_PORT=3306
   ```

3. Trong MySQL Server, vào **Networking**:
   - Bật "Allow access to Azure services"
   - Hoặc thêm App Service outbound IP vào whitelist

## Tài liệu tham khảo

- [Azure Database for MySQL Documentation](https://docs.microsoft.com/en-us/azure/mysql/)
- [Connection Libraries for Azure MySQL](https://docs.microsoft.com/en-us/azure/mysql/single-server/concepts-connection-libraries)
- [SSL Configuration](https://docs.microsoft.com/en-us/azure/mysql/single-server/concepts-ssl-connection-security)

## Cần hỗ trợ?

Nếu gặp vấn đề:
1. Kiểm tra Azure Portal > Activity Log để xem lỗi
2. Kiểm tra backend logs trong terminal
3. Test kết nối bằng MySQL Workbench trước
4. Đảm bảo firewall đã mở cho IP của bạn
