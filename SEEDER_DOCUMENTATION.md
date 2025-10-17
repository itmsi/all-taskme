# 🌱 TaskMe Database Seeder Documentation

## 📋 Overview

Seeder ini mengisi database dengan dummy data yang realistis untuk testing dan development. Seeder ini mencakup semua module yang ada di TaskMe.

## 🚀 Cara Menjalankan Seeder

### **Opsi 1: Menggunakan Script (Recommended)**
```bash
./seed-db.sh
```

### **Opsi 2: Manual Docker Command**
```bash
docker-compose exec backend npm run seed
```

### **Opsi 3: Local Development**
```bash
cd backend
npm run seed
```

## 📊 Data yang Dihasilkan

### **👥 Users (10 users)**
- **Username**: john_doe, jane_smith, mike_johnson, sarah_wilson, david_brown, lisa_davis, tom_anderson, emma_taylor, alex_martin, sophie_clark
- **Email**: [username]@example.com
- **Password**: `password123` (untuk semua user)
- **Role**: user (semua user biasa)

### **👥 Teams (5 teams)**
1. **Development Team** - Frontend and Backend Development
2. **Design Team** - UI/UX Design and Graphics
3. **Marketing Team** - Digital Marketing and Content
4. **QA Team** - Quality Assurance and Testing
5. **DevOps Team** - Infrastructure and Deployment

### **📁 Projects (8 projects)**
1. **E-commerce Website** - Build modern e-commerce platform
2. **Mobile App Development** - iOS and Android mobile application
3. **Company Website Redesign** - Complete website redesign project
4. **API Integration** - Third-party API integration project
5. **Database Migration** - Migrate to new database system
6. **Security Audit** - Comprehensive security assessment
7. **Performance Optimization** - Optimize application performance
8. **User Authentication System** - Implement JWT-based authentication

### **📝 Tasks (68 tasks total)**
- **5-12 tasks per project** dengan variasi:
  - Setup development environment
  - Design user interface mockups
  - Implement user authentication
  - Create database schema
  - Write unit tests
  - Setup CI/CD pipeline
  - Implement API endpoints
  - Create documentation
  - Performance testing
  - Security audit
  - Bug fixes and optimization
  - Deploy to production
  - User acceptance testing
  - Code review and refactoring
  - Setup monitoring and logging

### **📊 Task Statuses**
- **Default statuses**: To Do, In Progress, Review, Done
- **Custom statuses per project**: Planning, In Development, Code Review, Testing, Deployed

### **💬 Task Comments (272 comments)**
- **2-6 comments per task** dengan template:
  - "Great progress on this task!"
  - "I need some clarification on the requirements."
  - "The implementation looks good, ready for review."
  - "Found a bug, will fix it soon."
  - "This task is almost complete."
  - "Need help with the API integration."
  - "Updated the documentation."
  - "Ready for testing phase."
  - "Deployed to staging environment."
  - "All tests are passing now."

### **🔔 Notifications (60 notifications)**
- **3-10 notifications per user** dengan tipe:
  - Task Assigned
  - Project Update
  - New Comment
  - Deadline Approaching
  - Project Collaboration

## 🔧 Fitur Seeder

### **✅ Data Relationships**
- **Teams** memiliki leader dan members
- **Projects** dimiliki oleh teams dan memiliki collaborators
- **Tasks** dimiliki oleh projects dan memiliki assigned members
- **Comments** terkait dengan tasks
- **Notifications** terkait dengan users dan tasks

### **✅ Realistic Data**
- **Random dates** untuk start/end dates
- **Random progress** percentages
- **Random priorities** (low, medium, high, urgent)
- **Random estimated/actual hours**
- **Mixed read/unread** notifications
- **Varied task statuses**

### **✅ Data Integrity**
- **Foreign key constraints** dihormati
- **Unique constraints** dihormati
- **Check constraints** dihormati
- **Cascade deletes** dihandle dengan benar

## 🧹 Data Cleanup

Seeder akan membersihkan data existing sebelum menambahkan data baru:
1. Menghapus task comments
2. Menghapus task attachments
3. Menghapus task members
4. Menghapus notifications
5. Menghapus tasks
6. Menghapus custom task statuses
7. Menghapus project collaborators
8. Menghapus projects
9. Menghapus team members
10. Menghapus teams
11. Menghapus users (kecuali admin)

## 🔑 Login Credentials

Setelah seeder dijalankan, Anda bisa login dengan:

| Username | Email | Password |
|----------|-------|----------|
| john_doe | john@example.com | password123 |
| jane_smith | jane@example.com | password123 |
| mike_johnson | mike@example.com | password123 |
| sarah_wilson | sarah@example.com | password123 |
| david_brown | david@example.com | password123 |
| lisa_davis | lisa@example.com | password123 |
| tom_anderson | tom@example.com | password123 |
| emma_taylor | emma@example.com | password123 |
| alex_martin | alex@example.com | password123 |
| sophie_clark | sophie@example.com | password123 |

## 🎯 Testing Scenarios

Dengan data seeder ini, Anda bisa test:

### **👥 Team Management**
- Melihat daftar teams
- Melihat team members
- Membuat project baru
- Menambah team members

### **📁 Project Management**
- Melihat daftar projects
- Melihat project details
- Melihat project collaborators
- Melihat project analytics

### **📝 Task Management**
- Melihat daftar tasks per project
- Melihat task details
- Melihat task members
- Melihat task comments (chat)
- Update task status
- Assign/unassign members

### **💬 Real-time Chat**
- Join task rooms
- Send/receive messages
- Melihat chat history

### **🔔 Notifications**
- Melihat daftar notifications
- Mark as read/unread
- Melihat unread count
- Real-time notifications

### **📊 Analytics**
- Project analytics
- Member analytics
- Team analytics
- Dashboard analytics

## 🚨 Troubleshooting

### **Error: Container not running**
```bash
docker-compose up -d
```

### **Error: Permission denied**
```bash
chmod +x seed-db.sh
```

### **Error: Database connection**
Pastikan PostgreSQL container berjalan:
```bash
docker-compose ps
```

### **Error: Seeder failed**
Cek logs untuk detail error:
```bash
docker-compose logs backend
```

## 📈 Performance

Seeder ini menghasilkan:
- **~10 users**
- **~5 teams**
- **~8 projects**
- **~68 tasks**
- **~272 comments**
- **~60 notifications**

Total waktu eksekusi: **~30-60 detik** tergantung spesifikasi server.

## 🔄 Re-running Seeder

Seeder bisa dijalankan berulang kali. Data lama akan dihapus dan diganti dengan data baru setiap kali seeder dijalankan.

```bash
./seed-db.sh  # Bisa dijalankan berulang kali
```

---

**Happy Testing! 🎉**
