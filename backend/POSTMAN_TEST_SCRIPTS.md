# Smart Home API Test Scripts for Postman

## Base URL

```
http://localhost:5000
```

## 1. Test Connection

### GET Health Check

```
GET {{baseUrl}}/
```

## 2. Authentication APIs

### POST Register User

```
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "birthday": "1990-01-01"
}
```

### POST Login User

```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### POST Login with Demo Account 1

```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "khoa123",
  "password": "123456"
}
```

### POST Login with Demo Account 2

```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "duynguyen",
  "password": "abcdef"
}
```

## 3. User APIs (Requires Authentication)

### GET User Profile

```
GET {{baseUrl}}/api/users/profile
Authorization: Bearer {{token}}
```

### PUT Update User Profile

```
PUT {{baseUrl}}/api/users/profile
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Name",
  "birthday": "1995-05-15"
}
```

## 4. Rooms APIs (Requires Authentication)

### GET All Rooms

```
GET {{baseUrl}}/api/rooms
Authorization: Bearer {{token}}
```

### GET Rooms with Pagination

```
GET {{baseUrl}}/api/rooms?page=1&limit=10
Authorization: Bearer {{token}}
```

### GET Single Room

```
GET {{baseUrl}}/api/rooms/:roomId
Authorization: Bearer {{token}}
```

### POST Create Room

```
POST {{baseUrl}}/api/rooms
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Living Room",
  "description": "Main living area",
  "adaUsername": "ada_living"
}
```

### PUT Update Room

```
PUT {{baseUrl}}/api/rooms/:roomId
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Living Room",
  "description": "Updated description",
  "isOccupied": true,
  "temperature": {
    "target": 24
  }
}
```

### DELETE Room

```
DELETE {{baseUrl}}/api/rooms/:roomId
Authorization: Bearer {{token}}
```

## 5. Devices APIs (Requires Authentication)

### GET All Devices

```
GET {{baseUrl}}/api/devices
Authorization: Bearer {{token}}
```

### GET Devices with Filters

```
GET {{baseUrl}}/api/devices?page=1&limit=10&type=light&room=:roomId
Authorization: Bearer {{token}}
```

### GET Single Device

```
GET {{baseUrl}}/api/devices/:deviceId
Authorization: Bearer {{token}}
```

### POST Create Device

```
POST {{baseUrl}}/api/devices
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Smart Light",
  "type": "light",
  "brand": "Philips",
  "model": "Hue",
  "room": ":roomId",
  "properties": {
    "brightness": 80,
    "color": "#ffffff"
  }
}
```

### PUT Update Device

```
PUT {{baseUrl}}/api/devices/:deviceId
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Smart Light",
  "properties": {
    "brightness": 100,
    "color": "#ff0000"
  },
  "isOn": true
}
```

### PUT Toggle Device

```
PUT {{baseUrl}}/api/devices/:deviceId/toggle
Authorization: Bearer {{token}}
```

### DELETE Device

```
DELETE {{baseUrl}}/api/devices/:deviceId
Authorization: Bearer {{token}}
```

## 6. Environment Variables for Postman

Tạo Environment trong Postman với các biến:

-   `baseUrl`: http://localhost:5000
-   `token`: (sẽ được set sau khi login thành công)

## 7. Scripts để tự động set token

### Thêm vào Test tab của Login request:

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.success && jsonData.data && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
        console.log("Token saved:", jsonData.data.token);
    }
}
```

## 8. Pre-request Scripts cho authenticated requests:

```javascript
if (!pm.environment.get("token")) {
    throw new Error("No token found. Please login first.");
}
```

## 9. Test Examples Response Format

### Successful Login Response:

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "user_id",
            "username": "username",
            "email": "email@example.com",
            "name": "User Name"
        },
        "token": "jwt_token_here"
    }
}
```

### Error Response:

```json
{
    "success": false,
    "message": "Error message",
    "error": "Detailed error (only in development)"
}
```
