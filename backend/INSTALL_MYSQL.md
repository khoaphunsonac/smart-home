# Hướng dẫn cài đặt MySQL cho Smart Home Backend

## 1. Cài đặt MySQL

### Windows:
1. Tải MySQL Community Server từ: https://dev.mysql.com/downloads/mysql/
2. Chạy file installer và làm theo hướng dẫn
3. Ghi nhớ mật khẩu root bạn đã đặt

### macOS (với Homebrew):
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

## 2. Tạo Database

### Cách 1: Sử dụng MySQL Command Line
```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE smart_home CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Tạo user riêng (tùy chọn)
CREATE USER 'smarthome'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_home.* TO 'smarthome'@'localhost';
FLUSH PRIVILEGES;

# Thoát
exit
```

### Cách 2: Sử dụng SQL script có sẵn
```bash
mysql -u root -p < database/schema.sql
```

## 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục backend:

```env
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_home
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## 4. Khởi tạo Database với Sequelize

```bash
# Cài đặt dependencies
npm install

# Khởi tạo database và tạo bảng
npm run init-db

# Hoặc chỉ sync models (không tạo dữ liệu mẫu)
npm run db:sync
```

## 5. Chạy Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 6. Kiểm tra kết nối

Truy cập: http://localhost:5000/health

Bạn sẽ thấy:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1.234
}
```

## 7. Test API

### Đăng ký user mới:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User",
    "birthday": "1990-01-01"
  }'
```

### Đăng nhập:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'
```

## Troubleshooting

### Lỗi kết nối database:
1. Kiểm tra MySQL service đang chạy
2. Kiểm tra thông tin trong file `.env`
3. Kiểm tra firewall không block port 3306

### Lỗi authentication:
```sql
-- Nếu gặp lỗi authentication, chạy:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Reset database:
```bash
# Xóa tất cả bảng và tạo lại
npm run db:sync -- --force
```