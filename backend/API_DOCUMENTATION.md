# Smart Home API Documentation

## Tổng quan

API cho hệ thống Smart Home với tích hợp Adafruit IO, hỗ trợ quản lý user, rooms, devices và đồng bộ dữ liệu IoT.

**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication APIs

### 1. Đăng ký User

**Endpoint:** `POST /auth/register`  
**Access:** Public  
**Mô tả:** Đăng ký user mới với Adafruit IO credentials

**Request Body:**

```json
{
    "username": "string (required, 3-100 chars)",
    "password": "string (required, min 6 chars)",
    "name": "string (required, 2-100 chars)",
    "birthday": "string (optional, YYYY-MM-DD format)",
    "adaUsername": "string (optional, Adafruit IO username)",
    "adakey": "string (optional, Adafruit IO API key)"
}
```

**Response:**

```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": "U123456",
            "username": "testuser",
            "name": "Test User",
            "adaUsername": "Tusla",
            "adakey": "aio_xxx..."
        },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### 2. Đăng nhập

**Endpoint:** `POST /auth/login`  
**Access:** Public

**Request Body:**

```json
{
    "username": "string (required)",
    "password": "string (required)"
}
```

### 3. Verify Token

**Endpoint:** `GET /auth/verify`  
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

---

## 👤 User Management APIs

### 1. Lấy thông tin User

**Endpoint:** `GET /users/profile`  
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

### 2. Cập nhật thông tin User

**Endpoint:** `PUT /users/profile`  
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
    "name": "string (optional)",
    "birthday": "string (optional, YYYY-MM-DD)",
    "avatar": "string (optional)",
    "adaUsername": "string (optional, Adafruit IO username)",
    "adakey": "string (optional, Adafruit IO API key)"
}
```

**Lưu ý:** Adafruit credentials được ưu tiên theo thứ tự: User > Default

### 3. Đổi mật khẩu

**Endpoint:** `PUT /users/change-password`  
**Access:** Private

**Request Body:**

```json
{
    "currentPassword": "string (required)",
    "newPassword": "string (required, min 6 chars)"
}
```

---

## 🏠 Room Management APIs

### 1. Lấy danh sách Rooms

**Endpoint:** `GET /rooms`  
**Access:** Private  
**Query Parameters:**

-   `page`: số trang (default: 1)
-   `limit`: số lượng/trang (default: 10)

### 2. Lấy thông tin Room

**Endpoint:** `GET /rooms/:id`  
**Access:** Private

**Response:**

```json
{
    "success": true,
    "data": {
        "room": {
            "id": 1,
            "name": "Phòng khách",
            "isOccupied": false,
            "user_id": "U123456",
            "devices": [
                {
                    "id": 1,
                    "name": "Welcome Feed",
                    "type": "Sensor",
                    "isOn": false,
                    "room_id": 1
                }
            ]
        }
    }
}
```

### 3. Tạo Room mới

**Endpoint:** `POST /rooms`  
**Access:** Private

**Request Body:**

```json
{
    "name": "string (required, 1-100 chars)"
}
```

**Lưu ý:** Room sẽ tự động sử dụng Adafruit credentials từ User profile

### 4. Cập nhật Room

**Endpoint:** `PUT /rooms/:id`  
**Access:** Private

**Request Body:**

```json
{
    "name": "string (optional)",
    "isOccupied": "boolean (optional)"
}
```

### 5. Xóa Room

**Endpoint:** `DELETE /rooms/:id`  
**Access:** Private

---

## 🌡️ Environment Data APIs

### 1. Lấy dữ liệu môi trường

**Endpoint:** `GET /environment/:roomId`  
**Access:** Private  
**Query Parameters:**

-   `limit`: số lượng records (default: 10)

### 2. Lấy dữ liệu mới nhất

**Endpoint:** `GET /environment/:roomId/latest`  
**Access:** Private

### 3. Tạo dữ liệu môi trường

**Endpoint:** `POST /environment/:roomId`  
**Access:** Private

**Request Body:**

```json
{
    "temperature": "number (optional)",
    "humidity": "number (optional)",
    "lightLevel": "number (optional)"
}
```

**Lưu ý:** Dữ liệu sẽ tự động được gửi lên Adafruit IO feeds tương ứng

---

## 🔌 Adafruit IO Integration APIs

### 1. Verify Adafruit Credentials

**Endpoint:** `POST /adafruit/verify`  
**Access:** Private

**Request Body:**

```json
{
    "adaUsername": "string (optional)",
    "adakey": "string (required)"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Credentials are valid",
    "data": {
        "username": "Tusla",
        "name": "User Name",
        "id": 1224225,
        "created_at": "2025-01-01T00:00:00Z"
    }
}
```

### 2. Gửi dữ liệu lên Adafruit IO

**Endpoint:** `POST /adafruit/:roomId/send`  
**Access:** Private

**Request Body:**

```json
{
    "feedKey": "string (required, feed name)",
    "value": "number|string (required)"
}
```

### 3. Đồng bộ dữ liệu môi trường

**Endpoint:** `POST /adafruit/sync/:roomId`  
**Access:** Private  
**Mô tả:** Gửi dữ liệu môi trường mới nhất từ DB lên Adafruit IO

### 4. Lấy danh sách Feeds

**Endpoint:** `GET /adafruit/:roomId/feeds`  
**Access:** Private

**Response:**

```json
{
    "success": true,
    "message": "Feeds retrieved successfully",
    "data": {
        "feeds": [
            {
                "id": 3200125,
                "name": "Welcome Feed",
                "key": "welcome-feed",
                "last_value": "OFF",
                "status": "offline",
                "owner": {
                    "id": 1224225,
                    "username": "Tusla"
                }
            }
        ],
        "count": 8
    }
}
```

### 5. Đồng bộ Devices từ Adafruit IO

**Endpoint:** `POST /adafruit/:roomId/sync-devices`  
**Access:** Private  
**Mô tả:** Xóa devices cũ và tạo mới từ Adafruit IO feeds

**Response:**

```json
{
    "success": true,
    "message": "Devices synced successfully",
    "data": {
        "deletedDevices": 0,
        "createdDevices": 8,
        "totalFeeds": 8,
        "devices": [
            {
                "id": 1,
                "name": "Welcome Feed",
                "type": "Sensor",
                "isOn": false,
                "feedKey": "welcome-feed",
                "feedName": "Welcome Feed"
            },
            {
                "id": 2,
                "name": "V1",
                "type": "Sensor",
                "isOn": true,
                "feedKey": "v1",
                "feedName": "V1"
            }
        ]
    }
}
```

### 6. Lấy thông tin Feed

**Endpoint:** `GET /adafruit/:roomId/feeds/:feedKey/info`  
**Access:** Private

### 7. Lấy dữ liệu từ Feed

**Endpoint:** `GET /adafruit/:roomId/feeds/:feedKey`  
**Access:** Private  
**Query Parameters:**

-   `limit`: số lượng records (default: 10)

---

## 🔧 Device Management APIs

### 1. Lấy danh sách Devices

**Endpoint:** `GET /devices`  
**Access:** Private  
**Query Parameters:**

-   `roomId`: filter theo room (optional)

### 2. Cập nhật Device

**Endpoint:** `PUT /devices/:id`  
**Access:** Private

**Request Body:**

```json
{
    "name": "string (optional)",
    "type": "string (optional)",
    "isOn": "boolean (optional)"
}
```

### 3. Xóa Device

**Endpoint:** `DELETE /devices/:id`  
**Access:** Private

---

## 🔄 Credential Priority Logic

Hệ thống sử dụng Adafruit IO credentials theo thứ tự ưu tiên:

1. **User credentials** (cao nhất) - từ `users.adaUsername` và `users.adakey`
2. **Default credentials** (fallback) - hardcoded trong code

**Lưu ý:** Room-level credentials đã được loại bỏ để đơn giản hóa

---

## 🛠️ Technical Features

### Authentication

-   JWT-based authentication
-   Token expiration: 7 days (configurable)
-   Automatic token refresh

### Adafruit IO Integration

-   **Fallback verification:** Nếu user endpoint fail, tự động thử feeds endpoint
-   **Auto username detection:** Tự động lấy username từ feeds owner
-   **Credential validation:** Verify trước khi thực hiện operations
-   **Error handling:** Chi tiết error messages với suggestions

### Database

-   MySQL với Sequelize ORM
-   Auto-generated unique IDs
-   Relationship management (User → Room → Device)
-   Environment data với timestamps

### Error Handling

-   Standardized error responses
-   Development vs Production error details
-   Validation errors với specific field messages
-   Network timeout handling (10s)

---

## 📝 Usage Examples

### Complete Flow Example

```bash
# 1. Đăng ký với Adafruit credentials
POST /api/auth/register
{
  "username": "testuser",
  "password": "password123",
  "name": "Test User",
  "adaUsername": "Tusla",
  "adakey": "aio_kciA19Izj8kkk1lIKvZ6Mm0yvDu1"
}

# 2. Tạo room
POST /api/rooms
Authorization: Bearer <token>
{
  "name": "Phòng khách"
}

# 3. Đồng bộ devices từ Adafruit IO
POST /api/adafruit/1/sync-devices
Authorization: Bearer <token>

# 4. Lấy danh sách devices
GET /api/rooms/1
Authorization: Bearer <token>

# 5. Gửi dữ liệu môi trường
POST /api/environment/1
Authorization: Bearer <token>
{
  "temperature": 25.5,
  "humidity": 60.2,
  "lightLevel": 450
}
```

---

## 🚨 Error Codes

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Success                        |
| 201         | Created                        |
| 400         | Bad Request / Validation Error |
| 401         | Unauthorized / Invalid Token   |
| 403         | Forbidden                      |
| 404         | Not Found                      |
| 500         | Internal Server Error          |

### Common Error Responses

```json
{
    "success": false,
    "message": "Error description",
    "error": {
        "message": "Detailed error message",
        "suggestion": "How to fix the error"
    }
}
```

---

## 🔧 Configuration

### Environment Variables

```env
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development|production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_home
DB_USER=your_db_user
DB_PASS=your_db_password
```

### Default Adafruit Credentials

```javascript
const DEFAULT_ADA_USERNAME = "Tusla";
const DEFAULT_ADA_KEY = "aio_kciA19Izj8kkk1lIKvZ6Mm0yvDu1";
```

---

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE user (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  pass VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  birthday DATE,
  adaUsername VARCHAR(100),
  adakey VARCHAR(100)
);
```

### Rooms Table

```sql
CREATE TABLE room (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  isOccupied TINYINT(1) DEFAULT 0,
  user_id VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### Devices Table

```sql
CREATE TABLE device (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  isOn TINYINT(1) DEFAULT 0,
  room_id INT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES room(id)
);
```

### Environment Data Table

```sql
CREATE TABLE environment_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  lightLevel DECIMAL(8,2),
  timestamp DATETIME NOT NULL,
  room_id INT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES room(id)
);
```

---

_Tài liệu được cập nhật: November 2024_
