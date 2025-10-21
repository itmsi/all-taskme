# 🚀 Tutorial Setup TaskMe di Server Production
## Tanpa Mengganggu Sistem Lain yang Sudah Ada

### 📋 Prerequisites
- Server Ubuntu/Debian dengan Nginx sudah terinstall
- Docker dan Docker Compose sudah terinstall
- Domain `motorsights.com` sudah dikonfigurasi
- Akses root/sudo ke server

---

## 🎯 Tahapan Setup (Aman & Isolated)

### **Tahap 1: Persiapan Environment**

```bash
# 1. Clone repository ke direktori khusus
cd /opt
sudo git clone <repository-url> taskme
cd taskme

# 2. Setup environment variables
sudo cp env.server.example .env.server
sudo nano .env.server
```

**Isi file `.env.server` dengan password yang aman:**
```env
DB_PASSWORD=your-super-secure-database-password-here
JWT_SECRET=your-super-secure-jwt-secret-key-here
API_URL=https://api-taskme.motorsights.com/api
FRONTEND_URL=https://taskme.motorsights.com
```

---

### **Tahap 2: Setup SSL Certificates (Let's Encrypt)**

```bash
# 1. Install certbot jika belum ada
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. Generate SSL certificates
sudo ./setup-ssl-server.sh
```

**Script ini akan:**
- Generate SSL certificates untuk kedua subdomain
- Copy certificates ke `/etc/ssl/certs/` dan `/etc/ssl/private/`
- Setup auto-renewal
- **TIDAK mengubah konfigurasi Nginx yang ada**

---

### **Tahap 3: Konfigurasi Nginx (Isolated)**

```bash
# 1. Setup konfigurasi Nginx khusus untuk TaskMe
sudo ./setup-nginx-server.sh
```

**Script ini akan:**
- Membuat file konfigurasi di `/etc/nginx/sites-available/taskme`
- Enable site dengan symlink ke `/etc/nginx/sites-enabled/`
- **TIDAK mengubah konfigurasi Nginx default yang ada**
- **TIDAK mengganggu website lain di server**

---

### **Tahap 4: Setup Docker (Isolated Network)**

```bash
# 1. Setup Docker daemon configuration
sudo ./fix-dns.sh
```

**Script ini akan:**
- Update `/etc/docker/daemon.json` dengan DNS configuration
- Restart Docker daemon
- **TIDAK mengganggu container Docker lain yang sudah ada**

---

### **Tahap 5: Deploy TaskMe Application**

```bash
# 1. Deploy aplikasi
./deploy-server.sh
```

**Script ini akan:**
- Build dan start containers dengan network isolated
- Check health semua services
- **Menggunakan port yang sudah ditentukan (9561, 9562, 9563)**
- **TIDAK menggunakan port yang umum digunakan**

---

### **Tahap 6: Create Admin User**

```bash
# 1. Create admin user
./server-maintenance.sh admin
```

---

## 🔒 Keamanan & Isolasi

### **Port yang Digunakan (Tidak Konflik):**
- **Frontend**: Port 9562 → `https://taskme.motorsights.com`
- **Backend**: Port 9561 → `https://api-taskme.motorsights.com/api`
- **Database**: Port 9563 → PostgreSQL (internal)

### **Network Isolation:**
- Docker network: `172.20.0.0/16` (custom subnet)
- **TIDAK menggunakan network default Docker**
- **TIDAK mengganggu network sistem lain**

### **File System Isolation:**
- SSL certificates: `/etc/ssl/certs/` dan `/etc/ssl/private/`
- Nginx config: `/etc/nginx/sites-available/taskme`
- Application: `/opt/taskme/`
- **TIDAK mengubah file sistem lain**

---

## 🚨 Troubleshooting

### **Jika ada masalah:**

```bash
# 1. Check status semua services
./server-maintenance.sh status

# 2. Check health
./server-maintenance.sh health

# 3. Check DNS
./server-maintenance.sh dns

# 4. Check logs
./server-maintenance.sh logs

# 5. Restart services
./server-maintenance.sh restart
```

### **Jika perlu rollback:**

```bash
# 1. Stop TaskMe services
docker-compose -f docker-compose.server.yml down

# 2. Disable Nginx site
sudo rm /etc/nginx/sites-enabled/taskme
sudo systemctl reload nginx

# 3. Remove SSL certificates (optional)
sudo rm /etc/ssl/certs/taskme.motorsights.com.crt
sudo rm /etc/ssl/private/taskme.motorsights.com.key
sudo rm /etc/ssl/certs/api-taskme.motorsights.com.crt
sudo rm /etc/ssl/private/api-taskme.motorsights.com.key
```

---

## 📊 Monitoring

### **Check Status:**
```bash
# Docker services
docker-compose -f docker-compose.server.yml ps

# Nginx status
sudo systemctl status nginx

# SSL certificates
sudo certbot certificates
```

### **Check Logs:**
```bash
# Docker logs
docker-compose -f docker-compose.server.yml logs -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Maintenance

### **Update Application:**
```bash
cd /opt/taskme
git pull origin main
./server-maintenance.sh update
```

### **Backup Database:**
```bash
./server-maintenance.sh backup
```

### **Restart Services:**
```bash
./server-maintenance.sh restart
```

---

## ✅ Verifikasi Setup

### **Test Akses:**
- Frontend: `https://taskme.motorsights.com`
- API: `https://api-taskme.motorsights.com/api`
- API Docs: `https://api-taskme.motorsights.com/api-docs`

### **Test Health:**
```bash
# Test API health
curl -f https://api-taskme.motorsights.com/health

# Test frontend
curl -f https://taskme.motorsights.com
```

---

## 🎉 Setup Selesai!

Setelah mengikuti tahapan di atas, TaskMe akan berjalan dengan:
- ✅ **Isolated** dari sistem lain
- ✅ **Secure** dengan SSL certificates
- ✅ **Scalable** dengan Docker containers
- ✅ **Maintainable** dengan script maintenance
- ✅ **TIDAK mengganggu** sistem lain di server

**Akses aplikasi:**
- 🌐 **Frontend**: https://taskme.motorsights.com
- 🔌 **API**: https://api-taskme.motorsights.com/api
- 📚 **Documentation**: https://api-taskme.motorsights.com/api-docs
