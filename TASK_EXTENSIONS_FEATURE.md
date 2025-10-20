# Task Extensions Feature

## Overview
Fitur Task Extensions telah ditambahkan untuk menampung field-field tambahan yang diminta:

- Number_Phone
- Sales_Name  
- Name_PT
- IUP
- Latitude
- Longitude
- Photo_Link
- Count_Photo
- Voice_Link
- Count_Voice
- Voice_Transcript
- IsCompleted

## Database Changes

### Tabel Baru: task_extensions
```sql
CREATE TABLE task_extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    number_phone VARCHAR(20),
    sales_name VARCHAR(100),
    name_pt VARCHAR(200),
    iup VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    photo_link TEXT,
    count_photo INTEGER DEFAULT 0,
    voice_link TEXT,
    count_voice INTEGER DEFAULT 0,
    voice_transcript TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id)
);
```

## Backend Changes

### 1. Controller Updates (taskController.js)
- `createTask`: Menambahkan logika untuk membuat task_extensions
- `getTaskById`: Mengambil data extensions bersama dengan task
- `updateTask`: Menambahkan logika untuk update extensions
- `deleteTask`: Menghapus extensions saat task dihapus
- `getTaskExtensions`: Endpoint baru untuk mengambil extensions
- `updateTaskExtensions`: Endpoint baru untuk update extensions

### 2. Routes (tasks.js)
- `GET /api/tasks/:id/extensions` - Ambil task extensions
- `PUT /api/tasks/:id/extensions` - Update task extensions

### 3. Validation (validation.js)
- Menambahkan schema validation untuk field-field extensions
- Semua field dibuat nullable sesuai permintaan

## Frontend Changes

### 1. Komponen Baru
- `TaskExtensionsModal.jsx`: Modal untuk mengedit task extensions
- `TaskExtensionsDisplay.jsx`: Komponen untuk menampilkan task extensions

### 2. Updates
- `TaskDetailPage.jsx`: Menambahkan tampilan dan edit extensions
- `TaskModal.jsx`: Menambahkan section extensions (collapsible)
- `api.js`: Menambahkan API functions untuk extensions

## API Endpoints

### Get Task Extensions
```
GET /api/tasks/:id/extensions
Authorization: Bearer <token>
```

### Update Task Extensions
```
PUT /api/tasks/:id/extensions
Authorization: Bearer <token>
Content-Type: application/json

{
  "number_phone": "+6281234567890",
  "sales_name": "John Doe",
  "name_pt": "PT. Contoh Perusahaan",
  "iup": "IUP-001",
  "latitude": -6.200000,
  "longitude": 106.816666,
  "photo_link": "https://example.com/photo.jpg",
  "count_photo": 5,
  "voice_link": "https://example.com/voice.mp3",
  "count_voice": 2,
  "voice_transcript": "Transkrip percakapan...",
  "is_completed": true
}
```

## Cara Penggunaan

### 1. Melalui Task Detail Page
1. Buka task detail
2. Scroll ke bagian "Task Extensions"
3. Klik "Edit" untuk mengedit data extensions
4. Isi form yang muncul di modal
5. Klik "Simpan"

### 2. Melalui Task Modal (Create/Edit Task)
1. Buka modal create/edit task
2. Scroll ke bagian "Task Extensions (Opsional)"
3. Klik untuk expand section
4. Isi field-field yang diperlukan
5. Simpan task

## Fitur Tambahan

### 1. Validasi
- Semua field bersifat optional (nullable)
- Validasi format URL untuk photo_link dan voice_link
- Validasi angka untuk count_photo, count_voice, latitude, longitude

### 2. UI/UX
- Section extensions dapat di-collapse/expand
- Icons yang sesuai untuk setiap kategori field
- Link eksternal untuk Google Maps (jika ada latitude/longitude)
- Preview link untuk foto dan audio

### 3. Responsive Design
- Grid layout yang responsive
- Form yang mobile-friendly

## Testing

Untuk testing fitur ini:

1. **Create Task dengan Extensions:**
   - Buka modal create task
   - Isi data dasar task
   - Expand section "Task Extensions"
   - Isi beberapa field extensions
   - Simpan task

2. **Edit Extensions:**
   - Buka task detail
   - Klik "Edit" di section Task Extensions
   - Modifikasi data
   - Simpan perubahan

3. **View Extensions:**
   - Buka task detail
   - Lihat data extensions yang ditampilkan
   - Test link ke Google Maps dan media files

## Catatan Penting

- Semua field extensions bersifat nullable (opsional)
- Tabel terpisah untuk menghindari impact pada fitur existing
- Data extensions akan otomatis terhapus jika task dihapus
- Backward compatibility terjaga dengan fitur existing
