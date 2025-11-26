# 🧪 Testing Without Hardware - Mock Data Guide

## Vấn đề

Khi test hệ thống mà **chưa cắm thiết bị phần cứng** (Yolobit/AIoT Kit), các gauges và charts không hiển thị dữ liệu môi trường (nhiệt độ, độ ẩm, ánh sáng) vì không có sensors thật đang gửi data.

## ✅ Giải pháp: Mock Data Generation

Chúng tôi đã thêm tính năng **tạo dữ liệu mẫu** để test UI và các tính năng mà không cần phần cứng thật.

---

## 🚀 Cách sử dụng

### **Bước 1: Truy cập Room Detail Page**

Vào phòng bạn muốn test:
```
/dashboard/room/[id]
```

### **Bước 2: Click "Tạo dữ liệu mẫu"**

Trong phần **Điều khiển thiết bị**, bạn sẽ thấy 2 buttons:
- 🧪 **Tạo dữ liệu mẫu** (màu cam) - Tạo mock data
- 🔄 **Đồng bộ từ Adafruit IO** (màu xanh) - Sync devices

Click vào button **"Tạo dữ liệu mẫu"**

### **Bước 3: Xem kết quả**

Sau khi click, hệ thống sẽ:
1. ✅ Tạo 20 bản ghi environment data mẫu
2. ✅ Gauges sẽ hiển thị giá trị mới nhất
3. ✅ Charts sẽ hiển thị lịch sử dữ liệu
4. ✅ Thông báo thành công hiện lên

---

## 📊 Dữ liệu mẫu được tạo

### **Giá trị thực tế:**
- **Temperature**: 22-28°C (dao động tự nhiên)
- **Humidity**: 50-70% (dao động tự nhiên)
- **Light Level**: 20-80 lux (dao động tự nhiên)

### **Chu kỳ:**
- Mỗi bản ghi cách nhau **10 giây**
- Tổng cộng **20 bản ghi** = ~3 phút data
- Timestamps ngược thời gian (mới nhất → cũ nhất)

### **Pattern:**
Dữ liệu sử dụng hàm **sin wave** để mô phỏng sự thay đổi tự nhiên của môi trường:
```javascript
temperature = 25 + sin(i/3) * 3 + random(-1, 1)
humidity = 60 + sin(i/4) * 10 + random(-2.5, 2.5)
lightLevel = 50 + sin(i/2) * 30 + random(-5, 5)
```

---

## 🔧 Backend API

### **Endpoint:**
```
POST /api/environment/:roomId/mock
```

### **Request Body:**
```json
{
  "count": 20  // Số lượng bản ghi muốn tạo (mặc định: 20)
}
```

### **Response:**
```json
{
  "success": true,
  "message": "Successfully generated 20 mock environment data records",
  "data": {
    "count": 20,
    "latest": {
      "id": 123,
      "temperature": 26.5,
      "humidity": 62.3,
      "lightLevel": 54,
      "timestamp": "2025-11-26T17:30:00.000Z",
      "room_id": 1
    }
  }
}
```

---

## 💻 Frontend Integration

### **Button trong UI:**
```tsx
<Button 
  onClick={handleGenerateMockData} 
  disabled={generating}
  variant="outline"
  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
>
  <Beaker className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
  {generating ? 'Đang tạo...' : 'Tạo dữ liệu mẫu'}
</Button>
```

### **Handler Function:**
```tsx
const handleGenerateMockData = async () => {
  setGenerating(true)
  
  try {
    const response = await environmentAPI.generateMockData(roomId.toString(), 20)
    
    if (response.success) {
      // Reload latest data
      const envResponse = await environmentAPI.getLatestEnvironmentData(roomId.toString())
      setEnvironmentData(envResponse.data.environmentData)
      
      // Show success message
      setSyncMessage({
        type: 'success',
        text: `Đã tạo ${response.data.count} bản ghi dữ liệu môi trường mẫu!`
      })
    }
  } catch (error) {
    console.error("Error generating mock data:", error)
  }
  
  setGenerating(false)
}
```

---

## 🎯 Use Cases

### **1. Development Testing**
Khi phát triển UI mà chưa có hardware:
```bash
# Start backend
cd backend && npm run dev

# Start frontend  
cd smart-workplace && npm run dev

# Vào room → Click "Tạo dữ liệu mẫu"
```

### **2. Demo cho Client**
Khi demo project mà không mang hardware:
- Tạo mock data trước
- Gauges và charts sẽ hiển thị đẹp
- Client thấy được full tính năng

### **3. Load Testing**
Tạo nhiều data để test performance:
```javascript
// Tạo 100 bản ghi
await environmentAPI.generateMockData(roomId, 100)
```

---

## ⚠️ Lưu ý quan trọng

### **1. Mock data ≠ Real data**
- Mock data chỉ dùng để **test UI**
- Không thay thế được **real sensor data**
- Khi có hardware thật, data sẽ đến từ Adafruit IO

### **2. Database storage**
- Mock data được lưu vào database
- Có thể xóa bằng cách xóa phòng hoặc trực tiếp vào DB

### **3. Không gửi lên Adafruit IO**
- Mock data chỉ tạo trong local database
- Không push lên Adafruit IO
- Backend đã remove hardcoded credentials

---

## 📈 Workflow hoàn chỉnh

### **Development (không có hardware):**
```
1. Register user với Adafruit credentials
   ↓
2. Create room
   ↓
3. Sync devices từ Adafruit IO
   ↓
4. Click "Tạo dữ liệu mẫu" ⭐
   ↓
5. Xem gauges & charts hoạt động
   ↓
6. Test toggle devices
```

### **Production (có hardware):**
```
1. Register user với Adafruit credentials
   ↓
2. Create room
   ↓
3. Sync devices từ Adafruit IO
   ↓
4. Hardware tự động gửi data lên Adafruit IO ⭐
   ↓
5. Frontend auto-refresh mỗi 10s
   ↓
6. Gauges & charts hiển thị real-time data
```

---

## 🔒 Security Updates

Đồng thời với feature này, chúng tôi đã:
1. ✅ Xóa hardcoded Adafruit credentials trong `environment.js`
2. ✅ Chỉ sử dụng credentials của user
3. ✅ Skip sync nếu user không có credentials
4. ✅ Không có default fallback credentials

---

## 📝 Files Changed

### Backend:
```
backend/routes/environment.js
  - Removed: DEFAULT_ADA_USERNAME & DEFAULT_ADA_KEY
  - Added: POST /api/environment/:roomId/mock
  - Added: Mock data generation logic
```

### Frontend:
```
smart-workplace/lib/api.ts
  - Added: environmentAPI.generateMockData()

smart-workplace/app/dashboard/room/[id]/page.tsx
  - Added: handleGenerateMockData() function
  - Added: "Tạo dữ liệu mẫu" button
  - Added: generating state
  - Fixed: Missing icon imports (Snowflake, Tv, Beaker)
```

---

## 🚀 Quick Start

### **Test ngay:**
```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend (terminal mới)
cd smart-workplace
npm run dev

# 3. Truy cập
http://localhost:3000/dashboard/room/1

# 4. Click "Tạo dữ liệu mẫu"
# 5. Xem gauges & charts hoạt động!
```

---

## ✨ Benefits

1. **Fast Development** - Test UI without waiting for hardware
2. **Client Demos** - Show full functionality without physical setup
3. **Realistic Data** - Sin wave patterns mimic natural environment changes
4. **Easy Testing** - One-click to generate data
5. **No Hardware Required** - Perfect for remote development

---

## 📚 Related Documentation

- [HARDWARE_MAPPING.md](./HARDWARE_MAPPING.md) - Hardware configuration
- [REGISTER_SECURITY.md](./REGISTER_SECURITY.md) - Security updates
- [API_ENDPOINTS.md](./backend/API_ENDPOINTS.md) - API documentation

---

**Updated**: Nov 26, 2025  
**Feature**: Mock Data Generation  
**Status**: ✅ READY FOR TESTING
