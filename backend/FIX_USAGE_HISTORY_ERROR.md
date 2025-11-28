# 🔧 Fix Lỗi Usage History API

## ❌ Lỗi Gặp Phải

```json
{
    "success": false,
    "message": "Failed to get usage history",
    "error": "Unknown column 'UsageHistory.usageDate' in 'order clause'"
}
```

## 🔍 Nguyên Nhân

Model `UsageHistory.js` thiếu các trường mà API routes đang sử dụng:
- ❌ `usageDate` 
- ❌ `deviceType`
- ❌ `energyConsumed`

## ✅ Đã Sửa

### 1. Cập Nhật Model
File: `models/UsageHistory.js`

**Đã thêm các trường:**
- ✅ `deviceType` - VARCHAR(50), NOT NULL
- ✅ `energyConsumed` - FLOAT, default 0
- ✅ `usageDate` - DATETIME, NOT NULL

### 2. Tạo Migration Files

Đã tạo 3 files trong thư mục `migrations/`:

#### a) `update-usagehistory-table.sql` (Full version)
- Thêm đầy đủ các cột
- Tạo indexes cho performance
- Có comments chi tiết

#### b) `quick-fix-usagehistory.sql` (Quick version)
- Version ngắn gọn, chạy nhanh
- Chỉ thêm các cột cần thiết

#### c) `HUONG_DAN_UPDATE_USAGEHISTORY.md`
- Hướng dẫn chi tiết cách chạy migration
- Các options khác nhau
- Troubleshooting guide

## 🚀 Cách Khắc Phục (3 bước)

### Bước 1: Chạy Migration

#### ⭐ Option A - Quick Fix (Khuyến nghị)
```bash
mysql -u root -p smart_home < migrations/quick-fix-usagehistory.sql
```

**Lưu ý**: Nếu cột đã tồn tại sẽ báo lỗi, nhưng không sao, bỏ qua và tiếp tục bước 2.

#### 🛡️ Option B - Safe Migration (An toàn nhất)
```bash
mysql -u root -p smart_home < migrations/safe-update-usagehistory.sql
```

File này sẽ check trước khi add, không báo lỗi nếu cột đã có.

#### 💻 Option C - Từ MySQL Client
```sql
USE smart_home;

ALTER TABLE usagehistory ADD COLUMN deviceType VARCHAR(50) NOT NULL DEFAULT 'Sensor';
ALTER TABLE usagehistory ADD COLUMN energyConsumed FLOAT DEFAULT 0;
ALTER TABLE usagehistory ADD COLUMN usageDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

#### 🖥️ Option D - MySQL Workbench
1. Mở file `migrations/quick-fix-usagehistory.sql` hoặc `migrations/safe-update-usagehistory.sql`
2. Execute (Ctrl + Shift + Enter)

### Bước 2: Verify Migration

```sql
DESCRIBE usagehistory;
```

**Kết quả mong đợi:**
```
+----------------+--------------+------+-----+-------------------+
| Field          | Type         | Null | Key | Default           |
+----------------+--------------+------+-----+-------------------+
| id             | int          | NO   | PRI | NULL              |
| deviceType     | varchar(50)  | NO   |     | Sensor            |
| duration       | int          | NO   |     | NULL              |
| energyConsumed | float        | YES  |     | 0                 |
| usageDate      | datetime     | NO   | MUL | CURRENT_TIMESTAMP |
| startTime      | datetime     | YES  |     | NULL              |
| endTime        | datetime     | YES  |     | NULL              |
| room_id        | int          | NO   | MUL | NULL              |
| user_id        | varchar(50)  | NO   | MUL | NULL              |
+----------------+--------------+------+-----+-------------------+
```

### Bước 3: Restart Backend Server

```bash
# Stop server (Ctrl + C)

# Start lại
npm run dev
```

## 🧪 Test Lại với Postman

Sau khi restart server, test các endpoints:

### 1. GET - Lấy danh sách
```
GET http://localhost:5000/api/usage-history
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "usageHistory": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "total": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 2. POST - Tạo entry mới
```
POST http://localhost:5000/api/usage-history
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "room_id": 1,
  "deviceType": "Sensor",
  "duration": 3600,
  "energyConsumed": 0.5
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Usage history created successfully",
  "data": {
    "usageHistory": {
      "id": 1,
      "deviceType": "Sensor",
      "duration": 3600,
      "energyConsumed": 0.5,
      "usageDate": "2025-11-28T12:28:00.000Z",
      "room_id": 1,
      "user_id": "U123456ABC"
    }
  }
}
```

### 3. GET - Xem lại danh sách
```
GET http://localhost:5000/api/usage-history?page=1&limit=10
```

### 4. GET - Thống kê
```
GET http://localhost:5000/api/usage-history/stats?period=7d
```

## 📊 Cấu Trúc Mới

### UsageHistory Object

```json
{
  "id": 1,
  "deviceType": "Sensor",
  "duration": 3600,
  "energyConsumed": 0.5,
  "usageDate": "2025-11-28T12:00:00.000Z",
  "room_id": 1,
  "user_id": "U123456ABC",
  "room": {
    "id": 1,
    "name": "Living Room"
  }
}
```

### Các Field Quan Trọng

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| deviceType | String | Yes | Loại thiết bị (Sensor, Light, AC, etc.) |
| duration | Integer | Yes | Thời gian sử dụng (giây) |
| energyConsumed | Float | No | Điện năng tiêu thụ (kWh) |
| usageDate | DateTime | Yes | Ngày giờ sử dụng |
| room_id | Integer | Yes | ID của phòng |

## 📝 Lưu Ý

### Duration Unit Changed
- ⚠️ **Trước**: duration tính theo **phút** (minutes)
- ✅ **Bây giờ**: duration tính theo **giây** (seconds)

**Ví dụ:**
- 1 giờ = 3600 giây
- 2 giờ = 7200 giây
- 3 giờ = 10800 giây

### Device Types Mẫu

```javascript
const deviceTypes = [
  'Sensor',    // Cảm biến - 0.5 kWh
  'Light',     // Đèn - 1.2 kWh
  'AC',        // Điều hòa - 3.5 kWh
  'Fan',       // Quạt - 0.8 kWh
  'TV',        // Tivi - 1.5 kWh
  'Others'     // Khác
];
```

## 🔄 Nếu Vẫn Gặp Lỗi

### 1. Check Database Connection
```sql
-- Test connection
SELECT 'Database Connected!' as Status;
```

### 2. Check Table Structure
```sql
DESCRIBE usagehistory;
```

### 3. Check User Permissions
```sql
SHOW GRANTS FOR 'your_mysql_user'@'localhost';
```

### 4. Check Backend Logs
```bash
# Terminal window running server
# Look for error messages
```

### 5. Clear Node Cache
```bash
# Stop server
rm -rf node_modules/.cache
npm start
```

## 📚 Files Created/Modified

### Modified:
- ✏️ `models/UsageHistory.js` - Thêm các fields mới

### Created:
- ➕ `migrations/update-usagehistory-table.sql` - Migration đầy đủ
- ➕ `migrations/quick-fix-usagehistory.sql` - Migration nhanh
- ➕ `migrations/HUONG_DAN_UPDATE_USAGEHISTORY.md` - Hướng dẫn chi tiết
- ➕ `FIX_USAGE_HISTORY_ERROR.md` - File này (summary)

## ✅ Checklist

Hoàn thành các bước sau:

- [ ] Chạy migration SQL
- [ ] Verify cấu trúc bảng (DESCRIBE usagehistory)
- [ ] Restart backend server
- [ ] Test GET /api/usage-history
- [ ] Test POST /api/usage-history
- [ ] Test GET /api/usage-history/stats
- [ ] Import Postman collection để test đầy đủ

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành:
- ✅ API không còn lỗi "Unknown column"
- ✅ Có thể GET usage history
- ✅ Có thể POST usage history mới
- ✅ Có thể xem statistics
- ✅ Postman tests chạy thành công

## 💡 Tips

1. **Backup Database**: Luôn backup trước khi chạy migration
2. **Test Environment**: Test trên dev environment trước
3. **Postman Collection**: Sử dụng collection đã tạo để test
4. **Logs**: Theo dõi backend logs khi test

## 📞 Support

Nếu gặp vấn đề:
1. Check file `migrations/HUONG_DAN_UPDATE_USAGEHISTORY.md`
2. Xem backend logs
3. Verify database connection
4. Check MySQL user permissions
