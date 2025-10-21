# 🧱 Task Management System

Sistem manajemen tugas yang lengkap dengan fitur kolaborasi tim, real-time chat, dan analytics.

## 🚀 Teknologi yang Digunakan

### Backend
- **Express.js** - Framework web Node.js
- **PostgreSQL** - Database relasional
- **JWT** - Autentikasi token
- **Socket.io** - Real-time communication
- **Swagger** - Dokumentasi API

### Frontend
- **React.js** - Library UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling framework
- **Socket.io Client** - Real-time communication

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📋 Fitur Utama

### ✅ Autentikasi & User Management
- Registrasi dan login pengguna
- JWT token authentication
- Role-based access control (Leader, Member, Viewer)

### 👥 Team Management
- CRUD tim dan anggota tim
- Manajemen role dalam tim
- Validasi akses berdasarkan role

### 📁 Project Management
- CRUD proyek
- Assign proyek ke tim
- Kolaborasi lintas tim
- Progress tracking otomatis

### 📝 Task Management
- CRUD task dengan status dinamis
- Assign member ke task
- Upload file attachment
- View mode Kanban dan List

### 💬 Real-time Chat & Notifikasi
- Chat real-time per task
- Notifikasi in-app
- Event-based notifications

### 📊 Analytics & Timeline
- Dashboard analytics proyek
- Statistik kontribusi member
- Timeline dan Gantt chart

## 🛠️ Setup Development

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL (opsional, untuk development mode)

### Quick Start

1. **Clone repository**
```bash
git clone <repository-url>
cd taskme
```

2. **Start dengan Docker (Recommended)**
```bash
./scripts/start.sh
```

3. **Atau start development mode**
```bash
./scripts/dev.sh
```

4. **Setup database terpisah (opsional)**
```bash
./scripts/setup-db.sh
```

### Akses Aplikasi
- **Frontend**: http://localhost:9562
- **Backend API**: http://localhost:9561
- **API Documentation**: http://localhost:9561/api-docs
- **Database**: localhost:9563

### Scripts Available
- `./scripts/start.sh` - Start semua services dengan Docker
- `./scripts/dev.sh` - Start development mode
- `./scripts/stop.sh` - Stop semua services
- `./scripts/setup-db.sh` - Setup database saja

## 📁 Struktur Proyek

```
taskme/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── database/           # Database migrations & seeds
│   └── Dockerfile
├── frontend/               # React.js App
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   └── Dockerfile
├── docs/                   # Dokumentasi project
├── scripts/                # Script deployment dan maintenance
├── docker/                 # Konfigurasi Docker
├── config/                 # File konfigurasi environment
├── tests/                  # File testing
├── nginx/                  # Konfigurasi Nginx
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://taskme_user:taskme_password@localhost:9563/taskme
JWT_SECRET=your-super-secret-jwt-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:9561/api
```

## 📚 API Documentation

Setelah menjalankan backend, dokumentasi API tersedia di:
- **Swagger UI**: http://localhost:9561/api-docs

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
