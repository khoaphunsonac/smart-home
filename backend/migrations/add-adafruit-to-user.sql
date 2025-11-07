-- ============================================
-- Migration: Thêm Adafruit IO credentials vào bảng user
-- ============================================
-- Hướng dẫn: Copy toàn bộ nội dung file này và chạy trong MySQL Workbench hoặc MySQL CLI
-- ============================================

-- Chọn database (thay 'smart_home' bằng tên database của bạn nếu khác)
USE smart_home;

-- Thêm cột adaUsername sau cột birthday
ALTER TABLE `user`
ADD COLUMN `adaUsername` VARCHAR(100) NULL AFTER `birthday`;

-- Thêm cột adakey sau cột adaUsername
ALTER TABLE `user`
ADD COLUMN `adakey` VARCHAR(100) NULL AFTER `adaUsername`;

-- Kiểm tra kết quả
DESCRIBE `user`;

-- Hoặc xem tất cả các cột có tên bắt đầu bằng 'ada'
-- SHOW COLUMNS FROM `user` LIKE 'ada%';
