# 📡 Smart Home Backend - Feed Control APIs Documentation

## 🔗 Base URL
```
http://localhost:5000
```

## 🔐 Authentication
Tất cả các API đều yêu cầu JWT authentication. Thêm token vào header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
1. [Adafruit IO Integration APIs](#-adafruit-io-integration-apis)
2. [Device Control APIs](#-device-control-apis)
3. [Environment Data APIs](#️-environment-data-apis)
4. [AdafruitService Utilities](#-adafruitservice-utilities)
5. [Control Workflows](#-control-workflows)
6. [Credentials Configuration](#-credentials-configuration)
7. [Response Format](#-response-format)

---

## 🌐 Adafruit IO Integration APIs

### 1. 🔑 Verify Credentials
```http
POST /api/adafruit/verify
```
**Mục đích**: Xác thực thông tin Adafruit IO (username + API key)

**Request Body**:
```json
{
  "adakey": "aio_xxx...",
  "adaUsername": "optional_username"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Credentials are valid",
  "data": {
    "username": "YourUsername",
    "name": "Your Name",
    "id": 12345,
    "created_at": "2020-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 📤 Gửi dữ liệu lên Feed
```http
POST /api/adafruit/:roomId/send
```
**Mục đích**: Gửi dữ liệu điều khiển trực tiếp lên Adafruit IO feed

**Request Body**:
```json
{
  "feedKey": "light-control",    // Tên feed (ví dụ: light, fan, temperature)
  "value": "1"                   // Giá trị điều khiển (0/1, on/off, số...)
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Data sent to Adafruit IO successfully",
  "data": {
    "id": "0123456789",
    "value": "1",
    "feed_id": 123,
    "created_at": "2025-12-03T08:00:00.000Z"
  }
}
```

**Ví dụ sử dụng**:
```javascript
// Bật đèn
{
  "feedKey": "light",
  "value": "1"
}

// Điều chỉnh nhiệt độ
{
  "feedKey": "temperature-set",
  "value": "25.5"
}

// Bật quạt với tốc độ
{
  "feedKey": "fan-speed",
  "value": "75"
}
```

---

### 3. 📋 Lấy danh sách Feeds
```http
GET /api/adafruit/:roomId/feeds
```
**Mục đích**: Lấy tất cả feeds (thiết bị) từ Adafruit IO

**Response Success**:
```json
{
  "success": true,
  "message": "Feeds retrieved successfully",
  "data": {
    "feeds": [
      {
        "id": 123,
        "name": "Temperature Sensor",
        "key": "temperature",
        "status": "online",
        "unit_type": "Temperature",
        "owner": {
          "username": "YourUsername"
        }
      },
      {
        "id": 124,
        "name": "Light Control",
        "key": "light",
        "status": "online",
        "unit_type": "Digital"
      }
    ],
    "count": 2
  }
}
```

---

### 4. 📊 Lấy dữ liệu từ Feed
```http
GET /api/adafruit/:roomId/feeds/:feedKey?limit=10
```
**Mục đích**: Đọc dữ liệu từ một feed cụ thể

**Query Parameters**:
- `limit` (optional): Số lượng bản ghi muốn lấy (default: 10)

**Response Success**:
```json
{
  "success": true,
  "data": [
    {
      "id": "0123456789",
      "value": "25.5",
      "feed_id": 123,
      "created_at": "2025-12-03T08:00:00.000Z"
    },
    {
      "id": "0123456788",
      "value": "25.3",
      "feed_id": 123,
      "created_at": "2025-12-03T07:55:00.000Z"
    }
  ]
}
```

---

### 5. ℹ️ Thông tin chi tiết Feed
```http
GET /api/adafruit/:roomId/feeds/:feedKey/info
```
**Mục đích**: Lấy metadata của feed (status, type, description...)

**Response Success**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Temperature Sensor",
    "key": "temperature",
    "description": "Room temperature monitoring",
    "unit_type": "Temperature",
    "unit_symbol": "°C",
    "status": "online",
    "visibility": "private",
    "license": null,
    "enabled": true,
    "last_value": "25.5",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-12-03T08:00:00.000Z"
  }
}
```

---

### 6. 🔄 Đồng bộ Feeds → Devices
```http
POST /api/adafruit/:roomId/sync-devices
```
**Mục đích**: Đồng bộ feeds từ Adafruit IO thành devices trong database

**Lưu ý**: API này sẽ xóa tất cả devices cũ trong room và tạo mới từ feeds

**Response Success**:
```json
{
  "success": true,
  "message": "Devices synced successfully",
  "data": {
    "deletedDevices": 3,
    "createdDevices": 5,
    "totalFeeds": 5,
    "devices": [
      {
        "id": 1,
        "name": "Temperature Sensor",
        "type": "Temperature",
        "isOn": true,
        "feedKey": "temperature",
        "feedName": "Temperature Sensor"
      },
      {
        "id": 2,
        "name": "Light Control",
        "type": "Digital",
        "isOn": false,
        "feedKey": "light",
        "feedName": "Light Control"
      }
    ],
    "errors": []
  }
}
```

---

### 7. 📤 Đồng bộ DB → Adafruit IO
```http
POST /api/adafruit/sync/:roomId
```
**Mục đích**: Đẩy dữ liệu environment từ database lên Adafruit IO

**Query Parameters**:
- `limit` (optional): Số lượng bản ghi muốn sync (default: 10)

**Response Success**:
```json
{
  "success": true,
  "message": "Data synced to Adafruit IO successfully",
  "data": {
    "syncedData": {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.0,
      "lightLevel": 300,
      "room_id": 1,
      "timestamp": "2025-12-03T08:00:00.000Z"
    },
    "adafruitResults": [
      {
        "success": true,
        "data": { "feedKey": "temperature", "value": 25.5 }
      },
      {
        "success": true,
        "data": { "feedKey": "humidity", "value": 60.0 }
      },
      {
        "success": true,
        "data": { "feedKey": "lightlevel", "value": 300 }
      }
    ]
  }
}
```

---

### 8. 📥 Pull dữ liệu Environment
```http
POST /api/adafruit/:roomId/pull-environment
```
**Mục đích**: Lấy dữ liệu sensor từ Adafruit IO về database

**Feeds mapping**:
- `v1` → `temperature`
- `v2` → `humidity`  
- `v3` → `lightLevel`

**Response Success**:
```json
{
  "success": true,
  "message": "Environment data pulled and saved successfully",
  "data": {
    "environmentData": {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.0,
      "lightLevel": 300,
      "room_id": 1,
      "timestamp": "2025-12-03T08:00:00.000Z"
    },
    "source": "Adafruit IO",
    "feedData": {
      "v1": 25.5,
      "v2": 60.0,
      "v3": 300
    }
  }
}
```

---

## 🔧 Device Control APIs

### 1. 🔄 Toggle Device
```http
PUT /api/devices/:id/toggle
```
**Mục đích**: Bật/tắt thiết bị (chỉ thay đổi trạng thái trong database)

**Response Success**:
```json
{
  "success": true,
  "message": "Device turned on successfully",
  "data": {
    "device": {
      "id": 1,
      "name": "Smart Light",
      "type": "light",
      "isOn": true,
      "room_id": 1,
      "room": {
        "id": 1,
        "name": "Living Room",
        "isOccupied": false
      }
    }
  }
}
```

---

### 2. 📱 Tạo Device mới
```http
POST /api/devices
```
**Request Body**:
```json
{
  "name": "Smart Light",
  "type": "light",
  "room_id": 1
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Device created successfully",
  "data": {
    "device": {
      "id": 1,
      "name": "Smart Light",
      "type": "light",
      "isOn": false,
      "room_id": 1,
      "room": {
        "id": 1,
        "name": "Living Room",
        "isOccupied": false
      }
    }
  }
}
```

---

### 3. 📑 Danh sách Devices
```http
GET /api/devices?type=light&room=1&page=1&limit=10
```
**Query Parameters**:
- `type` (optional): Lọc theo loại thiết bị
- `room` (optional): Lọc theo room ID
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số lượng mỗi trang (default: 10)

**Response Success**:
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 1,
        "name": "Smart Light",
        "type": "light",
        "isOn": false,
        "room_id": 1,
        "room": {
          "id": 1,
          "name": "Living Room",
          "isOccupied": false
        }
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25
    }
  }
}
```

---

## 🌡️ Environment Data APIs

### 1. 📊 Gửi dữ liệu Environment
```http
POST /api/environment/:roomId
```
**Mục đích**: Tạo dữ liệu environment mới và tự động sync lên Adafruit IO

**Request Body**:
```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "lightLevel": 300
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Environment data created successfully",
  "data": {
    "environmentData": {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.0,
      "lightLevel": 300,
      "room_id": 1,
      "timestamp": "2025-12-03T08:00:00.000Z"
    }
  }
}
```

---

### 2. 📈 Lấy dữ liệu Environment
```http
GET /api/environment/:roomId?limit=10
```
**Query Parameters**:
- `limit` (optional): Số lượng bản ghi muốn lấy (default: 10)

---

### 3. 📊 Dữ liệu Environment mới nhất
```http
GET /api/environment/:roomId/latest
```
**Mục đích**: Lấy dữ liệu environment mới nhất của room

---

## ⚙️ AdafruitService Utilities

**Class**: `AdafruitService` (trong `utils/adafruit.js`)

### Khởi tạo
```javascript
const AdafruitService = require('../utils/adafruit');
const adafruit = new AdafruitService(username, apiKey);
```

### Các phương thức chính

#### 1. sendData(feedKey, value)
Gửi một giá trị lên feed
```javascript
const result = await adafruit.sendData('light', '1');
```

#### 2. sendMultipleData(data)
Gửi nhiều feed cùng lúc
```javascript
const data = {
  'temperature': 25.5,
  'humidity': 60.0,
  'light': 1
};
const results = await adafruit.sendMultipleData(data);
```

#### 3. getData(feedKey, limit)
Đọc dữ liệu từ feed
```javascript
const result = await adafruit.getData('temperature', 10);
```

#### 4. getAllFeeds()
Lấy tất cả feeds
```javascript
const result = await adafruit.getAllFeeds();
```

#### 5. createFeed(feedKey, description)
Tạo feed mới
```javascript
const result = await adafruit.createFeed('new-sensor', 'New sensor feed');
```

#### 6. verifyCredentials()
Xác thực credentials
```javascript
const result = await adafruit.verifyCredentials();
```

#### 7. getUserInfo()
Lấy thông tin user từ API key
```javascript
const result = await adafruit.getUserInfo();
```

---

## 🎯 Control Workflows

### Scenario 1: Điều khiển đèn
```javascript
// Bước 1: Gửi lệnh điều khiển lên Adafruit IO
POST /api/adafruit/123/send
{
  "feedKey": "light-control",
  "value": "1"
}

// Bước 2: Cập nhật trạng thái device trong database
PUT /api/devices/456/toggle
```

### Scenario 2: Đồng bộ toàn bộ hệ thống
```javascript
// Bước 1: Lấy tất cả feeds từ Adafruit IO
GET /api/adafruit/123/feeds

// Bước 2: Tạo devices từ feeds
POST /api/adafruit/123/sync-devices

// Bước 3: Kiểm tra danh sách devices mới
GET /api/devices?room=123
```

### Scenario 3: Gửi dữ liệu sensor
```javascript
// Cách 1: Tạo environment data (tự động sync)
POST /api/environment/123
{
  "temperature": 25.5,
  "humidity": 60.0,
  "lightLevel": 300
}

// Cách 2: Sync thủ công từ database
POST /api/adafruit/sync/123

// Cách 3: Pull từ Adafruit IO về database
POST /api/adafruit/123/pull-environment
```

### Scenario 4: Điều khiển thiết bị thông minh
```javascript
// Điều khiển quạt với nhiều mức tốc độ
POST /api/adafruit/123/send
{
  "feedKey": "fan-speed",
  "value": "75"  // 0-100%
}

// Điều chỉnh độ sáng đèn
POST /api/adafruit/123/send
{
  "feedKey": "light-brightness",
  "value": "80"  // 0-100%
}

// Cài đặt nhiệt độ điều hòa
POST /api/adafruit/123/send
{
  "feedKey": "ac-temperature",
  "value": "24"  // Độ C
}
```

---

## 🔐 Credentials Configuration

### Thứ tự ưu tiên credentials
1. **User credentials**: `user.adaUsername` + `user.adakey` (Ưu tiên cao nhất)
2. **Room credentials**: `room.adaUsername` + `room.adakey` 
3. **Default credentials**: `DEFAULT_ADA_USERNAME` + `DEFAULT_ADA_KEY` (Fallback)

### Cập nhật User credentials
```http
PUT /api/users/profile
```
**Request Body**:
```json
{
  "adaUsername": "my_ada_username",
  "adakey": "aio_xxx...",
  "name": "John Doe"
}
```

### Lấy thông tin User
```http
GET /api/users/profile
```
**Response** (bao gồm credentials nếu có):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "U123456ABC",
      "username": "johndoe",
      "name": "John Doe",
      "adaUsername": "my_ada_username",
      "adakey": "aio_xxx...",
      "isActive": true
    }
  }
}
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description for user",
  "error": {
    "message": "Detailed error message",
    "suggestion": "How to fix the error",
    "details": "Additional error details (development mode only)"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (No permission)
- `404` - Not Found (Resource doesn't exist)
- `500` - Internal Server Error

---

## 🚨 Error Handling Examples

### Adafruit IO Credential Errors
```json
{
  "success": false,
  "message": "Invalid Adafruit IO API key",
  "error": {
    "message": "API key is incorrect or invalid",
    "suggestion": "Please check your API key on https://io.adafruit.com/ → Settings → View AIO Key"
  }
}
```

### Feed Not Found
```json
{
  "success": false,
  "message": "Failed to send data to Adafruit IO",
  "error": {
    "message": "Feed 'non-existent-feed' not found",
    "suggestion": "Check feed name or create the feed first"
  }
}
```

### Room Access Denied
```json
{
  "success": false,
  "message": "Room not found",
  "error": {
    "message": "You don't have access to this room or it doesn't exist"
  }
}
```

---

## 📚 Feed Naming Conventions

### Recommended Feed Keys
- **Sensors**: `temperature`, `humidity`, `light-level`, `motion`
- **Lights**: `light`, `light-brightness`, `light-color`
- **Fans**: `fan`, `fan-speed`
- **AC**: `ac-power`, `ac-temperature`, `ac-mode`
- **Security**: `door-lock`, `window-sensor`, `alarm`
- **General**: `power`, `status`, `mode`

### Value Formats
- **Digital**: `0` (OFF), `1` (ON)
- **Percentage**: `0-100` (brightness, fan speed)
- **Temperature**: Số thập phân (ví dụ: `25.5`)
- **Text**: String values (ví dụ: `"auto"`, `"heat"`, `"cool"`)

---

## 🔄 Rate Limiting
- **Global**: 100 requests/15 phút mỗi IP
- **Adafruit IO**: Tuân theo giới hạn của Adafruit IO (30 requests/phút cho free plan)

---

## 🌐 CORS Configuration
- **Allowed Origin**: `http://localhost:3000` (hoặc `FRONTEND_URL`)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Credentials**: Enabled

---

*Tài liệu này cung cấp đầy đủ thông tin để tích hợp và điều khiển các thiết bị IoT thông qua Smart Home Backend API.*