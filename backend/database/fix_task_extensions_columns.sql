-- Fix task_extensions table untuk mengatasi numeric field overflow
-- Perbaiki definisi kolom latitude dan longitude

-- Ubah tipe data latitude dan longitude untuk mendukung range koordinat yang lebih besar
ALTER TABLE task_extensions 
ALTER COLUMN latitude TYPE DECIMAL(12, 8),
ALTER COLUMN longitude TYPE DECIMAL(12, 8);
