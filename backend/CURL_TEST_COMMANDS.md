# Quick Test Commands

## Test Backend Health

```bash
curl -X GET http://localhost:5000/
```

## Test Database Connection

```bash
curl -X GET http://localhost:5000/api/health
```

## Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "birthday": "1990-01-01"
  }'
```

## Test User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## Test Demo Account Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "khoa123",
    "password": "123456"
  }'
```

## Test Protected Route (Replace TOKEN with actual token)

```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Test Get Rooms

```bash
curl -X GET http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
