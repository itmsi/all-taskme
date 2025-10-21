# Fitur Add Task Page

## Deskripsi
Halaman baru untuk membuat task/tugas yang bukan modal, melainkan halaman terpisah dengan form lengkap.

## Fitur Utama

### 1. Navigasi ke Halaman Add Task
- **Dari TasksPage**: Tombol "Buat Tugas" mengarah ke `/tasks/add`
- **Dari ProjectDetailPage**: Tombol "Buat Tugas" mengarah ke `/tasks/add/{projectId}` dengan state project

### 2. Logika Project Selection
- **Jika dari ProjectDetailPage**: Dropdown project disabled dan menampilkan nama project
- **Jika dari TasksPage**: Dropdown project aktif untuk memilih project

### 3. Form Lengkap
- Judul tugas (required)
- Deskripsi dengan RichTextEditor
- Prioritas (low, medium, high, urgent)
- Deadline
- Estimasi jam
- Status (berdasarkan project yang dipilih)
- Lokasi dengan LocationInput
- Assignment ke user (multiple selection)
- Task Extensions (opsional)

### 4. Preview Sidebar
- Menampilkan preview task yang akan dibuat
- Status, prioritas, deadline, estimasi jam, lokasi

### 5. Task Extensions
- Modal terpisah untuk mengisi data extensions
- Nomor telepon, nama sales, nama PT, IUP
- Koordinat latitude/longitude
- Link foto dan jumlah foto
- Link voice dan jumlah voice
- Transkrip suara
- Status completion

## Routing
```
/tasks/add - Halaman add task umum
/tasks/add/:projectId - Halaman add task untuk project tertentu
```

## Integrasi API
- Menggunakan `tasksAPI.createTask(projectId, taskData)`
- Menyertakan task extensions jika ada
- Redirect ke halaman detail task setelah berhasil dibuat

## Komponen yang Digunakan
- `RichTextEditor` - untuk deskripsi
- `LocationInput` - untuk input lokasi
- `TaskExtensionsModal` - untuk extensions
- `Button`, `Input` - komponen UI dasar

## Error Handling
- Validasi form (judul required, project required)
- Error handling untuk API calls
- Toast notifications untuk feedback
- Loading states

## Responsive Design
- Layout grid responsive (lg:grid-cols-3)
- Form responsive dengan grid layout
- Sidebar preview di desktop, full width di mobile
