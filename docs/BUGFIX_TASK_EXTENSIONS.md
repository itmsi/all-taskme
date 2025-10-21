# Bug Fix: Task Extensions Error 500

## Masalah
Error 500 terjadi saat melakukan PUT request ke endpoint `/api/tasks/:id/extensions` dengan pesan error:
```
Query error: numeric field overflow
Update task extensions error: error: numeric field overflow
detail: 'A field with precision 10, scale 8 must round to an absolute value less than 10^2.'
```

## Root Cause
1. **Database Schema Issue**: Definisi kolom `latitude` dan `longitude` menggunakan `DECIMAL(10,8)` dan `DECIMAL(11,8)` yang terlalu kecil untuk nilai koordinat geografis yang valid.

2. **Input Validation**: Tidak ada validasi yang memadai untuk memastikan nilai koordinat dalam range yang valid.

## Solusi yang Diterapkan

### 1. Perbaikan Database Schema
```sql
-- File: backend/database/fix_task_extensions_columns.sql
ALTER TABLE task_extensions 
ALTER COLUMN latitude TYPE DECIMAL(12, 8),
ALTER COLUMN longitude TYPE DECIMAL(12, 8);
```

**Penjelasan:**
- Mengubah precision dari 10/11 menjadi 12 untuk mendukung range koordinat yang lebih besar
- Scale tetap 8 untuk akurasi yang baik
- Range yang didukung: latitude (-90.00000000 sampai 90.00000000), longitude (-180.00000000 sampai 180.00000000)

### 2. Penambahan Validasi Koordinat
```javascript
// Helper function untuk validasi koordinat
const validateCoordinate = (value, type) => {
  if (value === null || value === undefined || value === '') return null;
  
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  
  // Validasi range koordinat geografis
  if (type === 'latitude') {
    return (num >= -90 && num <= 90) ? num : null;
  } else if (type === 'longitude') {
    return (num >= -180 && num <= 180) ? num : null;
  }
  
  return num;
};
```

**Penjelasan:**
- Memvalidasi input untuk memastikan nilai dalam range geografis yang valid
- Mengembalikan `null` untuk nilai yang tidak valid
- Mencegah overflow dengan validasi sebelum menyimpan ke database

### 3. Update Controller Logic
Mengganti semua penggunaan `parseFloat()` dengan `validateCoordinate()` di:
- `createTask` function
- `updateTask` function  
- `updateTaskExtensions` function

## Testing

### Test Case 1: Koordinat Valid
```json
{
  "latitude": -6.200000,
  "longitude": 106.816666
}
```
**Expected**: Berhasil disimpan

### Test Case 2: Koordinat Invalid
```json
{
  "latitude": 999.999999,
  "longitude": 999.999999
}
```
**Expected**: Nilai disimpan sebagai `null`

### Test Case 3: String Invalid
```json
{
  "latitude": "invalid",
  "longitude": "not_a_number"
}
```
**Expected**: Nilai disimpan sebagai `null`

## Files Modified

1. **Database:**
   - `backend/database/fix_task_extensions_columns.sql` (new)
   - `backend/database/add_task_extensions.sql` (reference)

2. **Backend:**
   - `backend/src/controllers/taskController.js`

## Verification

Untuk memverifikasi perbaikan:

1. **Test API Endpoint:**
   ```bash
   curl -X PUT http://localhost:9561/api/tasks/{task_id}/extensions \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{
       "latitude": -6.200000,
       "longitude": 106.816666,
       "sales_name": "John Doe"
     }'
   ```

2. **Check Database:**
   ```sql
   SELECT latitude, longitude FROM task_extensions WHERE task_id = '{task_id}';
   ```

3. **Frontend Test:**
   - Buka task detail page
   - Edit task extensions
   - Input koordinat valid dan invalid
   - Verify data tersimpan dengan benar

## Prevention

Untuk mencegah masalah serupa di masa depan:

1. **Database Design:**
   - Selalu pertimbangkan range nilai yang mungkin untuk tipe data numeric
   - Gunakan precision yang cukup untuk koordinat geografis

2. **Input Validation:**
   - Implementasi validasi di level controller
   - Validasi range nilai sebelum menyimpan ke database

3. **Error Handling:**
   - Tambahkan try-catch untuk operasi database
   - Log error dengan detail yang informatif

## Status
✅ **FIXED** - Error 500 sudah teratasi dan endpoint berfungsi normal.
