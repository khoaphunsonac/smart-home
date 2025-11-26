# Hardware Mapping - Adafruit IO Feeds

Mapping giữa phần cứng Yolobit/AIoT Kit và Adafruit IO feeds.

## 📊 Sensors (Read-only)

| Feed | Tên | Loại | Mô tả | Hardware Pin |
|------|-----|------|-------|--------------|
| **V1** | Temperature | Sensor | Nhiệt độ (°C) | DHT20 sensor |
| **V2** | Humidity | Sensor | Độ ẩm (%) | DHT20 sensor |
| **V3** | Light Level | Sensor | Ánh sáng (lux) | pin1 (analog) |

**Chu kỳ cập nhật:** 10 giây

---

## 🎮 Actuators (Control)

### Thiết bị chính

| Feed | Tên | Loại | Mô tả | Hardware Pin |
|------|-----|------|-------|--------------|
| **V10** | Sprayer/Humidifier | Actuator | Máy phun/tạo ẩm | pin10 (PWM) |
| **V11** | Main Light | Light | Đèn chính | RGB LED 0 |
| **V12** | Fan | Fan | Quạt | pin2 (PWM) |
| **V13** | Auto Mode | System | Chế độ tự động | System flag |

### Điều khiển cường độ/tốc độ

| Feed | Tên | Mô tả | Giá trị | Liên kết |
|------|-----|-------|---------|----------|
| **V14** | Fan Speed | Tốc độ quạt | 0-100% | Điều khiển V12 |
| **V15** | Sprayer Intensity | Cường độ máy phun | 0-100% | Điều khiển V10 |

### RGB LEDs phụ

| Feed | Tên | Màu | Hardware |
|------|-----|-----|----------|
| **V16** | RGB LED 1 | Đỏ (#ff0000) | RGB LED 1 |
| **V17** | RGB LED 2 | Tím (#800080) | RGB LED 2 |
| **V18** | RGB LED 3 | Cam (#ffa500) | RGB LED 3 |
| **V19** | RGB LED 4 | Xanh dương (#0000ff) | RGB LED 4 |

---

## 🤖 Chế độ tự động (Auto Mode - V13)

Khi `V13 = 1` (Auto Mode bật):

### Logic nhiệt độ:
- **RT < 26°C**: Bật đèn (V11 = 1) nếu LUX < 30
- **RT > 32°C**: Bật máy phun (V10 = 1)
- **RT > 28°C**: Bật quạt ở mức 70% (V12 = 1, V14 = 70)

### Logic ánh sáng:
- **LUX < 30**: Bật đèn (V11 = 1)

---

## 📡 MQTT Connection

```python
Server: io.adafruit.com
Port: 1883
Username: <your_adafruit_username>
Key: <your_adafruit_key>
```

> ⚠️ **Lưu ý**: Thay thế `<your_adafruit_username>` và `<your_adafruit_key>` bằng thông tin Adafruit IO của bạn.
> Credentials thực tế được lưu trong database (bảng `users`) và không được commit vào Git.

---

## 🔌 Hardware Pins

| Pin | Chức năng | Loại | Thiết bị |
|-----|-----------|------|----------|
| pin1 | Light sensor input | Analog Read | Cảm biến ánh sáng |
| pin2 | Fan control | PWM Output | Quạt |
| pin10 | Sprayer control | PWM Output | Máy phun |
| RGB LED 0-4 | Status/Control LEDs | Digital Output | 5 RGB LEDs |
| I2C | DHT20 sensor | I2C | Cảm biến nhiệt độ & độ ẩm |
| I2C | LCD1602 | I2C | Màn hình LCD |

---

## 🎯 Frontend Device Type Mapping

```typescript
feedKey → Device Icon & Type:
- v1 → Thermometer (Temperature sensor)
- v2 → Droplets (Humidity sensor)
- v3 → Sun (Light sensor)
- v10 → Droplets (Sprayer/Humidifier)
- v11 → Lightbulb (Main light)
- v12 → Wind (Fan)
- v16-v19 → Lightbulb (RGB LEDs)
```

---

## 📝 Notes

1. **Sensors (V1-V3)**: Read-only, không có switch điều khiển
2. **Auto Mode (V13)**: Khi bật, hệ thống tự động điều khiển devices dựa trên sensors
3. **PWM Control**: V14 và V15 dùng để điều khiển cường độ/tốc độ (0-100%)
4. **RGB LEDs**: Mỗi LED có màu cố định theo thiết kế phần cứng
5. **Update Rate**: Sensors cập nhật mỗi 10 giây lên Adafruit IO

---

## 🔄 Data Flow

```
Hardware → Adafruit IO → Backend → Frontend
   ↑                                    ↓
   └────────────── Control ─────────────┘
```

1. **Hardware đẩy data lên**: V1, V2, V3 (mỗi 10s)
2. **Frontend điều khiển xuống**: V10, V11, V12, V13, V14, V15, V16, V17, V18, V19
3. **Backend sync**: Lấy feeds từ Adafruit IO → Tạo devices trong DB
4. **Frontend toggle**: Gửi lệnh qua backend → Adafruit IO → Hardware nhận

---

## 🚀 Quick Start

### Sau khi tạo phòng mới:
1. ✅ Phòng tự động sync tất cả feeds từ Adafruit IO
2. ✅ Sensors (V1-V3) hiển thị giá trị real-time
3. ✅ Actuators (V10-V19) có thể điều khiển bằng switch
4. ✅ Fan và Sprayer có slider điều chỉnh cường độ
5. ✅ RGB LEDs hiển thị màu sắc theo thiết kế

### Để refresh devices:
- Click button "Đồng bộ từ Adafruit IO" trên room detail page
