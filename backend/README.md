# Smart Home Backend API

Backend API cho hệ thống quản lý nhà thông minh được xây dựng với Node.js, Express.js và MongoDB.

## 🚀 Tính năng

- **Xác thực & Phân quyền**: JWT authentication, role-based access control
- **Quản lý người dùng**: Đăng ký, đăng nhập, cập nhật thông tin
- **Quản lý phòng**: Tạo, cập nhật, xóa phòng thông minh
- **Quản lý thiết bị**: Điều khiển các thiết bị IoT trong nhà
- **Thống kê**: Báo cáo thống kê về phòng và thiết bị
- **Bảo mật**: Rate limiting, input validation, error handling

## 🛠️ Công nghệ sử dụng

- **Framework**: Express.js
- **Database**: MySQL với Sequelize ORM
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest, Supertest
- **Development**: Nodemon

## 📁 Cấu trúc dự án

```
backend/
├── config/
│   └── database.js          # Cấu hình kết nối database
├── controllers/             # Controllers (tùy chọn mở rộng)
├── middleware/
│   ├── auth.js             # Middleware xác thực
│   ├── errorHandler.js     # Xử lý lỗi
│   └── validation.js       # Validation rules
├── models/
│   ├── User.js             # Model người dùng
│   ├── Room.js             # Model phòng
│   └── Device.js           # Model thiết bị
├── routes/
│   ├── auth.js             # Routes xác thực
│   ├── users.js            # Routes người dùng
│   ├── rooms.js            # Routes phòng
│   └── devices.js          # Routes thiết bị
├── tests/
│   └── app.test.js         # Test cases
├── utils/
│   ├── jwt.js              # JWT utilities
│   ├── response.js         # Response helpers
│   └── pagination.js       # Pagination helpers
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies và scripts
└── server.js               # Entry point
```

## 🚦 Cài đặt và chạy

### 1. Clone và cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình environment variables

```bash
cp .env.example .env
```

Cập nhật các biến trong file `.env`:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_home
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### 3. Khởi động MySQL

Đảm bảo MySQL đang chạy trên máy của bạn và tạo database:

```bash
# Đăng nhập vào MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE smart_home;

# Thoát MySQL
exit
```

### 4. Chạy server

```bash
# Development mode với hot reload
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:5000`

## 📚 API Documentation

### Authentication

#### Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123",
  "name": "John Doe",
  "birthday": "1990-01-01"
}
```

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "Password123"
}
```

### Users

#### Lấy thông tin profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Cập nhật profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "birthday": "1990-01-01"
}
```

### Rooms

#### Lấy danh sách phòng
```http
GET /api/rooms?page=1&limit=10
Authorization: Bearer <token>
```

#### Tạo phòng mới
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Living Room",
  "description": "Main living area",
  "adaUsername": "ada_living"
}
```

#### Cập nhật phòng
```http
PUT /api/rooms/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Living Room",
  "isOccupied": true,
  "temperature": {
    "target": 24
  }
}
```

### Devices

#### Lấy danh sách thiết bị
```http
GET /api/devices?page=1&limit=10&type=light&room=<room_id>
Authorization: Bearer <token>
```

#### Tạo thiết bị mới
```http
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Smart Light",
  "type": "light",
  "brand": "Philips",
  "model": "Hue",
  "room": "<room_id>",
  "properties": {
    "brightness": 80,
    "color": "#ffffff"
  }
}
```

#### Bật/tắt thiết bị
```http
PUT /api/devices/:id/toggle
Authorization: Bearer <token>
```

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch
```

## 🔒 Bảo mật

- **JWT Authentication**: Xác thực người dùng với JWT tokens
- **Password Hashing**: Mật khẩu được hash với bcrypt
- **Input Validation**: Validation dữ liệu đầu vào với express-validator
- **Rate Limiting**: Giới hạn số lượng requests từ mỗi IP
- **CORS**: Cấu hình CORS cho phép frontend truy cập
- **Helmet**: Bảo vệ với các HTTP headers an toàn

## 📈 Monitoring

- **Health Check**: `GET /health` - Kiểm tra trạng thái server
- **Logging**: Morgan middleware cho access logs
- **Error Handling**: Centralized error handling

## 🚀 Deployment

### Environment Variables cho Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-mysql-server.com
DB_PORT=3306
DB_NAME=smart_home
DB_USER=your_username
DB_PASSWORD=your_secure_password
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### PM2 (Process Manager)

```bash
# Cài đặt PM2
npm install -g pm2

# Start với PM2
pm2 start server.js --name "smart-home-api"

# Monitor
pm2 monit

# Logs
pm2 logs smart-home-api
```

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License.

## 📞 Liên hệ

- Email: your-email@example.com
- Project Link: [https://github.com/yourusername/smart-home](https://github.com/yourusername/smart-home)