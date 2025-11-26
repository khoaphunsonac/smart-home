    # Smart Home Backend - API Endpoints Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
1. [Health Check](#health-check)
2. [Authentication](#authentication-endpoints)
3. [Users](#users-endpoints)
4. [Rooms](#rooms-endpoints)
5. [Devices](#devices-endpoints)
6. [Environment Data](#environment-data-endpoints)
7. [Notifications](#notifications-endpoints)
8. [Usage History](#usage-history-endpoints)
9. [Adafruit IO Integration](#adafruit-io-endpoints)

---

## Health Check

### GET /health
Check server health status
- **Access**: Public
- **Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-11-26T08:00:00.000Z",
  "uptime": 3600.5
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user
- **Access**: Public
- **Request Body**:
```json
{
  "username": "johndoe",
  "password": "password123",
  "name": "John Doe",
  "birthday": "1990-01-01",
  "adaUsername": "optional_adafruit_username",
  "adakey": "optional_adafruit_key"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "U123456ABC",
      "username": "johndoe",
      "name": "John Doe",
      "birthday": "1990-01-01",
      "adaUsername": "Tusla",
      "adakey": "aio_xxx..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/login
Login user
- **Access**: Public
- **Request Body**:
```json
{
  "username": "johndoe",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /api/auth/verify
Verify JWT token
- **Access**: Private
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": { /* user object */ }
  }
}
```

---

## Users Endpoints

### GET /api/users/profile
Get current user profile
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "U123456ABC",
      "username": "johndoe",
      "name": "John Doe",
      "birthday": "1990-01-01",
      "adaUsername": "Tusla",
      "adakey": "aio_xxx...",
      "isActive": true,
      "lastLogin": "2025-11-26T08:00:00.000Z"
    }
  }
}
```

### PUT /api/users/profile
Update current user profile
- **Access**: Private
- **Request Body**:
```json
{
  "name": "John Doe Updated",
  "birthday": "1990-01-01",
  "avatar": "https://example.com/avatar.jpg",
  "adaUsername": "MyAdafruitUsername",
  "adakey": "aio_newkey123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

### PUT /api/users/change-password
Change user password
- **Access**: Private
- **Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### GET /api/users
Get all users (Admin only)
- **Access**: Private/Admin
- **Query Parameters**: `page`, `limit`
- **Response**: Paginated list of users

### GET /api/users/:id
Get user by ID (Admin only)
- **Access**: Private/Admin
- **Response**: User details

### PUT /api/users/:id/status
Update user status (Admin only)
- **Access**: Private/Admin
- **Request Body**:
```json
{
  "isActive": true
}
```

---

## Rooms Endpoints

### GET /api/rooms
Get all rooms for current user
- **Access**: Private
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response**:
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": 1,
        "name": "Living Room",
        "isOccupied": false,
        "user_id": "U123456ABC",
        "createdAt": "2025-11-26T08:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 42
    }
  }
}
```

### GET /api/rooms/:id
Get room by ID
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "data": {
    "room": {
      "id": 1,
      "name": "Living Room",
      "isOccupied": false,
      "devices": [ /* array of devices */ ],
      "owner": {
        "id": "U123456ABC",
        "name": "John Doe",
        "username": "johndoe"
      }
    }
  }
}
```

### POST /api/rooms
Create new room
- **Access**: Private
- **Request Body**:
```json
{
  "name": "Bedroom"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": { /* created room object */ }
  }
}
```

### PUT /api/rooms/:id
Update room
- **Access**: Private
- **Request Body**:
```json
{
  "name": "Master Bedroom",
  "isOccupied": true
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "room": { /* updated room object */ }
  }
}
```

### DELETE /api/rooms/:id
Delete room (also deletes all devices in the room)
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

### GET /api/rooms/:id/stats
Get room statistics
- **Access**: Private
- **Response**: Room statistics including device counts and power consumption

---

## Devices Endpoints

### GET /api/devices
Get all devices for current user
- **Access**: Private
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `type` (filter by device type)
  - `room` (filter by room ID)
- **Response**:
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 1,
        "name": "Smart Light",
        "type": "Sensor",
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

### GET /api/devices/:id
Get device by ID
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "data": {
    "device": {
      "id": 1,
      "name": "Smart Light",
      "type": "Sensor",
      "isOn": false,
      "room": { /* room object */ }
    }
  }
}
```

### POST /api/devices
Create new device
- **Access**: Private
- **Request Body**:
```json
{
  "name": "Smart Light",
  "type": "Sensor",
  "room_id": 1
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Device created successfully",
  "data": {
    "device": { /* created device object */ }
  }
}
```

### PUT /api/devices/:id/toggle
Toggle device on/off
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "message": "Device turned on successfully",
  "data": {
    "device": {
      "id": 1,
      "name": "Smart Light",
      "isOn": true,
      "room": { /* room object */ }
    }
  }
}
```

---

## Environment Data Endpoints

### GET /api/environment/:roomId
Get environment data for a room
- **Access**: Private
- **Query Parameters**: `limit` (default: 10)
- **Response**:
```json
{
  "success": true,
  "data": {
    "environmentData": [
      {
        "id": 1,
        "temperature": 25.5,
        "humidity": 60.0,
        "lightLevel": 300,
        "room_id": 1,
        "timestamp": "2025-11-26T08:00:00.000Z"
      }
    ]
  }
}
```

### GET /api/environment/:roomId/latest
Get latest environment data for a room
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "data": {
    "environmentData": {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.0,
      "lightLevel": 300,
      "room_id": 1,
      "timestamp": "2025-11-26T08:00:00.000Z"
    }
  }
}
```

### POST /api/environment/:roomId
Create new environment data (also syncs to Adafruit IO)
- **Access**: Private
- **Request Body**:
```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "lightLevel": 300
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Environment data created successfully",
  "data": {
    "environmentData": { /* created data object */ }
  }
}
```

---

## Notifications Endpoints

### GET /api/notifications
Get all notifications for current user
- **Access**: Private
- **Query Parameters**: `page`, `limit`
- **Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "Temperature Alert",
        "message": "Temperature in Living Room is too high",
        "type": "warning",
        "isRead": false,
        "user_id": "U123456ABC",
        "createdAt": "2025-11-26T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "total": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### PUT /api/notifications/:id/read
Mark notification as read
- **Access**: Private
- **Response**:
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": { /* updated notification */ }
  }
}
```

### POST /api/notifications
Create new notification
- **Access**: Private
- **Request Body**:
```json
{
  "title": "Alert Title",
  "message": "Alert message content",
  "type": "info"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notification": { /* created notification */ }
  }
}
```

---

## Usage History Endpoints

### GET /api/usage-history
Get usage history for current user
- **Access**: Private
- **Query Parameters**:
  - `page`, `limit`
  - `room_id` (filter by room)
  - `device_type` (filter by device type)
- **Response**:
```json
{
  "success": true,
  "data": {
    "usageHistory": [
      {
        "id": 1,
        "deviceType": "Sensor",
        "duration": 3600,
        "energyConsumed": 0.5,
        "usageDate": "2025-11-26T08:00:00.000Z",
        "room": {
          "id": 1,
          "name": "Living Room"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 45,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /api/usage-history/stats
Get usage statistics
- **Access**: Private
- **Query Parameters**: `period` (24h, 7d, 30d - default: 7d)
- **Response**:
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "deviceType": "Sensor",
        "totalDuration": 86400,
        "totalSessions": 24
      }
    ]
  }
}
```

### POST /api/usage-history
Create new usage history entry
- **Access**: Private
- **Request Body**:
```json
{
  "room_id": 1,
  "deviceType": "Sensor",
  "duration": 3600,
  "energyConsumed": 0.5
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Usage history created successfully",
  "data": {
    "usageHistory": { /* created entry */ }
  }
}
```

---

## Adafruit IO Endpoints

### POST /api/adafruit/verify
Verify Adafruit IO credentials
- **Access**: Private
- **Request Body**:
```json
{
  "adakey": "aio_xxx...",
  "adaUsername": "optional_username"
}
```
- **Response**:
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

### GET /api/adafruit/:roomId/feeds
Get all feeds (devices) from Adafruit IO
- **Access**: Private
- **Response**:
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
        "unit_type": "Temperature"
      }
    ],
    "count": 5
  }
}
```

### GET /api/adafruit/:roomId/feeds/:feedKey
Get data from a specific Adafruit IO feed
- **Access**: Private
- **Query Parameters**: `limit` (default: 10)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "0123456789",
      "value": "25.5",
      "feed_id": 123,
      "created_at": "2025-11-26T08:00:00.000Z"
    }
  ]
}
```

### GET /api/adafruit/:roomId/feeds/:feedKey/info
Get feed information
- **Access**: Private
- **Response**: Feed details from Adafruit IO

### POST /api/adafruit/:roomId/send
Send data directly to Adafruit IO
- **Access**: Private
- **Request Body**:
```json
{
  "feedKey": "temperature",
  "value": "25.5"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Data sent to Adafruit IO successfully",
  "data": { /* Adafruit response */ }
}
```

### POST /api/adafruit/sync/:roomId
Sync environment data from database to Adafruit IO
- **Access**: Private
- **Query Parameters**: `limit` (default: 10)
- **Response**:
```json
{
  "success": true,
  "message": "Data synced to Adafruit IO successfully",
  "data": {
    "syncedData": { /* environment data */ },
    "adafruitResults": [ /* sync results */ ]
  }
}
```

### POST /api/adafruit/:roomId/sync-devices
Sync devices from Adafruit IO feeds to database
- **Access**: Private
- **Description**: Deletes existing devices in the room and creates new ones from Adafruit IO feeds
- **Response**:
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
        "type": "Sensor",
        "isOn": true,
        "feedKey": "temperature",
        "feedName": "Temperature Sensor"
      }
    ],
    "errors": []
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message description",
  "error": "Detailed error (only in development mode)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting
- Window: 15 minutes
- Max Requests: 100 per IP address
- Exceeding limit returns: `429 Too Many Requests`

---

## CORS Configuration
- Allowed Origin: `http://localhost:3000` (configurable via `FRONTEND_URL`)
- Allowed Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Allowed Headers: `Content-Type`, `Authorization`, `X-Requested-With`
- Credentials: Enabled
