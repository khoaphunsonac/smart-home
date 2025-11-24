# Hướng dẫn thêm cột Adafruit IO vào bảng `user`

## Cách 1: Sử dụng SQL Command (Khuyến nghị)

### Bước 1: Mở MySQL Workbench hoặc MySQL Client

### Bước 2: Chọn database `smart_home` (hoặc database của bạn)

```sql
USE smart_home;
```

### Bước 3: Chạy lệnh ALTER TABLE để thêm các cột

```sql
ALTER TABLE `user`
ADD COLUMN `adaUsername` VARCHAR(100) NULL AFTER `birthday`,
ADD COLUMN `adakey` VARCHAR(100) NULL AFTER `adaUsername`;
```

### Bước 4: Kiểm tra kết quả

```sql
DESCRIBE `user`;
```

Hoặc:

```sql
SHOW COLUMNS FROM `user`;
```

Bạn sẽ thấy các cột mới:

-   `adaUsername` (VARCHAR(100), NULL)
-   `adakey` (VARCHAR(100), NULL)

---

## Cách 2: Sử dụng giao diện MySQL Workbench

### Bước 1: Mở MySQL Workbench và kết nối database

### Bước 2: Tìm bảng `user` trong danh sách bảng bên trái

1. Mở rộng database `smart_home` (hoặc database của bạn)
2. Mở rộng thư mục "Tables"
3. Tìm và **click chuột phải** vào bảng `user`
4. Chọn **"Alter Table"** (hoặc **"Modify Table"**)

### Bước 3: Thêm cột `adaUsername`

1. Trong tab **"Fields"**, scroll xuống cuối danh sách các cột
2. Click vào nút **"Add Field"** (nút có dấu + màu xanh)
3. Điền thông tin:
    - **Name:** `adaUsername`
    - **Type:** `VARCHAR`
    - **Length:** `100`
    - **Not null:** **BỎ CHỌN** (để cho phép NULL)
    - **Key:** (để trống)
    - **Comment:** (có thể để trống hoặc ghi "Adafruit IO Username")
4. Nếu muốn đặt sau cột `birthday`, có thể dùng nút **"Move Up"** hoặc **"Move Down"** để sắp xếp

### Bước 4: Thêm cột `adakey`

1. Click vào nút **"Add Field"** một lần nữa
2. Điền thông tin:
    - **Name:** `adakey`
    - **Type:** `VARCHAR`
    - **Length:** `100`
    - **Not null:** **BỎ CHỌN** (để cho phép NULL)
    - **Key:** (để trống)
    - **Comment:** (có thể để trống hoặc ghi "Adafruit IO API Key")
3. Đảm bảo cột này nằm sau `adaUsername`

### Bước 5: Lưu thay đổi

1. Click nút **"Save"** (biểu tượng đĩa mềm) ở thanh toolbar phía trên
2. Hoặc nhấn `Ctrl + S` (Windows) hoặc `Cmd + S` (Mac)

### Bước 6: Xác nhận

Bạn sẽ thấy thông báo xác nhận. Click **"OK"** hoặc **"Apply"**.

---

## Cách 3: Sử dụng Command Line (MySQL CLI)

### Bước 1: Mở Terminal/Command Prompt

### Bước 2: Kết nối MySQL

```bash
mysql -u your_username -p
```

Nhập password khi được yêu cầu.

### Bước 3: Chọn database

```sql
USE smart_home;
```

### Bước 4: Chạy lệnh ALTER TABLE

```sql
ALTER TABLE `user`
ADD COLUMN `adaUsername` VARCHAR(100) NULL AFTER `birthday`,
ADD COLUMN `adakey` VARCHAR(100) NULL AFTER `adaUsername`;
```

### Bước 5: Kiểm tra

```sql
DESCRIBE `user`;
```

---

## Kiểm tra kết quả

Sau khi thêm xong, chạy lệnh sau để xem cấu trúc bảng:

```sql
DESCRIBE `user`;
```

Bạn sẽ thấy các cột mới trong danh sách:

```
+-------------+--------------+------+-----+---------+-------+
| Field       | Type         | Null | Key | Default | Extra |
+-------------+--------------+------+-----+---------+-------+
| id          | varchar(50)  | NO   | PRI | NULL    |       |
| username    | varchar(100) | NO   | UNI | NULL    |       |
| pass        | varchar(255) | NO   |     | NULL    |       |
| name        | varchar(100) | NO   |     | NULL    |       |
| birthday    | date         | YES  |     | NULL    |       |
| adaUsername | varchar(100) | YES  |     | NULL    |       |  ← MỚI
| adakey      | varchar(100) | YES  |     | NULL    |       |  ← MỚI
+-------------+--------------+------+-----+---------+-------+
```

---

## Lưu ý

1. **NULL được phép:** Cả hai cột đều cho phép NULL vì không phải tất cả user đều có Adafruit IO credentials ngay từ đầu.

2. **VARCHAR(100):** Độ dài 100 ký tự đủ cho username và API key của Adafruit IO.

3. **Sau khi thêm xong:** Bạn có thể:
    - Đăng ký user mới với Adafruit credentials
    - Cập nhật user hiện tại với Adafruit credentials qua API:
        ```
        PUT /api/users/profile
        Body: { "adaUsername": "Tusla", "adakey": "aio_kciA19Izj8kkk1lIKvZ6Mm0yvDu1" }
        ```

---

## Xử lý lỗi

### Lỗi: "Duplicate column name 'adaUsername'"

Nghĩa là cột đã tồn tại. Bạn có thể bỏ qua bước này hoặc kiểm tra lại:

```sql
SHOW COLUMNS FROM `user` LIKE 'ada%';
```

### Lỗi: "Table 'user' doesn't exist"

Kiểm tra tên bảng có đúng không. Một số database có thể dùng tên khác. Kiểm tra:

```sql
SHOW TABLES;
```

---

## Hoàn tất!

Sau khi thêm xong các cột, bạn có thể:

1. Khởi động lại backend server
2. Test đăng ký user mới với Adafruit credentials
3. Test cập nhật profile user với Adafruit credentials
4. Test các API Adafruit IO (sync-devices, feeds, etc.)
