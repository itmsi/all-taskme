# Manual Location Columns Fix

Jika Anda mengalami error 500 Internal Server Error saat mengakses detail task, ini kemungkinan karena kolom lokasi belum ditambahkan ke database.

## Solusi 1: Menggunakan Docker (Recommended)

Jika Docker sudah berjalan:

```bash
./start-with-location-fix.sh
```

## Solusi 2: Manual Database Fix

Jika Docker tidak berjalan, ikuti langkah-langkah berikut:

### 1. Start Database Server
Pastikan PostgreSQL server Anda berjalan di port 9563 (atau port yang sesuai dengan konfigurasi Anda).

### 2. Connect ke Database
Gunakan tool database favorit Anda (psql, pgAdmin, dll) untuk connect ke database `taskme_db`.

### 3. Run Migration SQL
Jalankan perintah SQL berikut:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_address TEXT;
```

### 4. Restart Backend
Setelah migration selesai, restart backend server:

```bash
cd backend && npm run dev
```

## Solusi 3: Menggunakan Script Migration

Jika Anda memiliki akses ke database dengan kredensial yang berbeda:

```bash
node fix-location-columns.js --host=localhost --port=5432 --database=taskme_db --user=your_user --password=your_password
```

## Verifikasi

Setelah migration selesai, Anda dapat memverifikasi dengan:

1. Akses halaman detail task - seharusnya tidak ada error 500 lagi
2. Field lokasi akan muncul di form edit task
3. Anda dapat menggunakan fitur Auto GPS atau Manual input untuk lokasi

## Fitur Lokasi yang Tersedia

- **Auto GPS**: Deteksi lokasi otomatis menggunakan GPS perangkat
- **Manual Input**: Input manual koordinat dan nama lokasi
- **Reverse Geocoding**: Otomatis mendapatkan nama dan alamat dari koordinat
- **Display**: Tampilan lokasi yang user-friendly

Jika masih ada masalah, silakan cek log backend untuk error yang lebih detail.
