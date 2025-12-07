# Quick Fix: Azure MySQL không ổn định

## ⚡ TL;DR - Sửa nhanh trong 5 phút

### Bước 1: Restart Backend
```bash
cd backend
# Ctrl+C để stop
npm run dev
```

### Bước 2: Kiểm tra log khi start
Bạn phải thấy:
```
📦 MySQL Connected successfully
   Host: your-server.mysql.database.azure.com
   Database: smart_home
   SSL: Enabled (Azure)
```

### Bước 3: Test đăng nhập
- Mở http://localhost:3000/login
- Đăng nhập với: admin / admin123
- Nếu thấy "Retrying..." trong console → Đang tự động retry
- Chờ tối đa 3 lần retry (3 giây)

## ✅ Đã sửa xong!

Code đã được cập nhật với:
- ✅ Connection pool tối ưu cho Azure
- ✅ Auto retry 3 lần khi timeout
- ✅ Timeout tăng lên 60s
- ✅ Giữ 1 connection luôn active

## 🔧 Nếu vẫn lỗi

### Lỗi: "ETIMEDOUT" hoặc "ECONNRESET"
**→ Thêm IP vào Azure Firewall:**
1. Lấy IP: https://ifconfig.me
2. Azure Portal > MySQL Server > Connection security
3. Add firewall rule với IP của bạn

### Lỗi: "Too many connections"
**→ Giảm connections trong code:**

Mở `backend/config/database.js`, sửa:
```javascript
pool: {
    max: 3,  // Giảm từ 5 xuống 3
    min: 1,
}
```

### Lỗi: Chậm lắm (>10s mới login)
**→ Upgrade Azure tier:**
1. Azure Portal > Your MySQL Server
2. Pricing tier > General Purpose
3. vCores: 2 (minimum)

## 📊 Check Azure Status

1. **Metrics** trong Azure Portal:
   - CPU < 80%: OK
   - CPU > 80%: Cần upgrade
   
2. **Active connections**:
   - < 50: OK
   - > 50: Cần tăng max_connections

## 🚀 Khuyến nghị

### Ngay lập tức:
- [x] Restart backend → áp dụng config mới
- [x] Test đăng nhập vài lần
- [ ] Add IP vào firewall nếu chưa có

### Trong tuần:
- [ ] Upgrade lên General Purpose tier (nếu budget cho phép)
- [ ] Enable High Availability
- [ ] Setup monitoring alerts

### Tùy chọn:
- [ ] Thêm Redis cache
- [ ] Setup CDN cho frontend
- [ ] Use Azure Application Insights

## 💬 Liên hệ

Nếu vẫn gặp vấn đề sau khi làm theo các bước trên:
- Đọc: `AZURE-CONNECTION-ISSUES.md` (chi tiết hơn)
- Check: Azure status page
- Contact: Azure Support

---

**Ghi chú:** Code đã được tối ưu tự động. Bạn chỉ cần restart backend là xong!
