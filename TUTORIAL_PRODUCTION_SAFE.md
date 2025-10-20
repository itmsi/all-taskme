# 🚀 Tutorial Setup TaskMe - SERVER PRODUCTION AMAN
## Tidak Mengganggu Sistem Lain yang Sudah Berjalan

### ⚠️ **PERINGATAN PENTING**
- **Ini adalah SERVER PRODUCTION**
- **Website lain sudah berjalan**
- **TIDAK akan menghentikan Nginx**
- **TIDAK akan mengganggu sistem lain**

---

## 🎯 **Tahapan Setup AMAN**

### **🔍 Tahap 1: Persiapan & Check Prerequisites**

```bash
# 1. Clone repository ke direktori khusus
cd /opt
sudo git clone <repository-url> taskme
cd taskme

# 2. Check port availability (PENTING!)
./check-ports.sh

# 3. Check Nginx status
sudo systemctl status nginx
```

**Pastikan:**
- ✅ Nginx sedang berjalan
- ✅ Port 9561, 9562, 9563 tersedia
- ✅ Website lain masih bisa diakses

---

### **⚙️ Tahap 2: Setup Environment**

```bash
# 1. Setup environment variables
sudo cp env.server.example .env.server
sudo nano .env.server
```

**Isi file `.env.server`:**
```env
DB_PASSWORD=your-super-secure-database-password-here
JWT_SECRET=your-super-secure-jwt-secret-key-here
API_URL=https://api-taskme.motorsights.com/api
FRONTEND_URL=https://taskme.motorsights.com
```

---

### **🔒 Tahap 3: Setup SSL Certificates (AMAN)**

**Opsi 1: Menggunakan certbot dengan nginx plugin (RECOMMENDED)**
```bash
# Install certbot jika belum ada
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificates (AMAN - tidak stop Nginx)
sudo certbot --nginx -d taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com
sudo certbot --nginx -d api-taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com
```

**Opsi 2: Menggunakan script aman**
```bash
# Gunakan script yang sudah dibuat khusus untuk production
sudo ./setup-ssl-production-safe.sh
```

**Yang akan terjadi:**
- ✅ Nginx tetap berjalan
- ✅ Website lain tidak terganggu
- ✅ SSL certificates ter-generate
- ✅ Auto-renewal setup

---

### **🌐 Tahap 4: Konfigurasi Nginx Manual**

**Setelah SSL certificates selesai, tambahkan konfigurasi Nginx:**

```bash
# 1. Generate konfigurasi Nginx
./generate-nginx-config.sh

# 2. Copy konfigurasi ke Nginx
sudo cp nginx-taskme.conf /etc/nginx/sites-available/taskme

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/taskme /etc/nginx/sites-enabled/

# 4. Test Nginx configuration (PENTING!)
sudo nginx -t

# 5. Reload Nginx (AMAN - hanya reload config)
sudo systemctl reload nginx
```

**Yang akan terjadi:**
- ✅ Konfigurasi Nginx ditambahkan
- ✅ Website lain tetap berjalan
- ✅ Hanya reload konfigurasi

---

### **🐳 Tahap 5: Setup Docker (AMAN)**

```bash
# Setup Docker dengan DNS yang aman
sudo ./fix-dns.sh
```

**Yang akan terjadi:**
- ✅ Update `/etc/docker/daemon.json`
- ✅ Restart Docker daemon
- ✅ Container lain tidak terganggu

---

### **🚀 Tahap 6: Deploy Application**

```bash
# Deploy TaskMe dengan network isolated
./deploy-server.sh
```

**Yang akan terjadi:**
- ✅ Build dan start containers
- ✅ Check health semua services
- ✅ Menggunakan network isolated (172.20.0.0/16)
- ✅ Port yang aman (9561, 9562, 9563)

---

### **👤 Tahap 7: Create Admin User**

```bash
# Create admin user
./server-maintenance.sh admin
```

---

## 🛡️ **Keamanan & Isolasi**

### **✅ Yang AMAN:**
- **Isolated Docker network**: `172.20.0.0/16`
- **Non-standard ports**: 9561, 9562, 9563
- **Separate Nginx config**: `/etc/nginx/sites-available/taskme`
- **Custom SSL certificates**: `/etc/ssl/certs/` dan `/etc/ssl/private/`
- **Application directory**: `/opt/taskme/`

### **❌ Yang TIDAK akan diubah:**
- **System files**
- **Other Docker containers**
- **Other Nginx sites**
- **Other applications**
- **Default ports (80, 443) - hanya digunakan untuk redirect**

---

## 🚨 **Troubleshooting**

### **Jika ada masalah:**

```bash
# 1. Check status
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
# Rollback lengkap
sudo ./rollback.sh
```

**Script rollback akan:**
- Stop semua TaskMe services
- Remove containers dan images
- Disable Nginx site
- Remove SSL certificates (optional)
- **TIDAK mengganggu sistem lain**

---

## ✅ **Verifikasi Setup**

### **Test Akses:**
- **Frontend**: https://taskme.motorsights.com
- **API**: https://api-taskme.motorsights.com/api
- **API Docs**: https://api-taskme.motorsights.com/api-docs

### **Test Health:**
```bash
# Test API health
curl -f https://api-taskme.motorsights.com/health

# Test frontend
curl -f https://taskme.motorsights.com

# Test website lain masih bisa diakses
curl -f https://your-other-website.com
```

---

## 🎉 **Setup Selesai!**

Setelah mengikuti tahapan di atas, TaskMe akan berjalan dengan:

- ✅ **Isolated** dari sistem lain
- ✅ **Secure** dengan SSL certificates
- ✅ **Scalable** dengan Docker containers
- ✅ **Maintainable** dengan script maintenance
- ✅ **TIDAK mengganggu** sistem lain di server
- ✅ **Website lain tetap berjalan normal**

**Akses aplikasi:**
- 🌐 **Frontend**: https://taskme.motorsights.com
- 🔌 **API**: https://api-taskme.motorsights.com/api
- 📚 **Documentation**: https://api-taskme.motorsights.com/api-docs

**Script yang tersedia:**
- `setup-ssl-production-safe.sh` - SSL setup yang aman
- `generate-nginx-config.sh` - Generate konfigurasi Nginx
- `check-ports.sh` - Check port availability
- `rollback.sh` - Rollback jika ada masalah
- `server-maintenance.sh` - Maintenance commands
- `test-dns.sh` - Test DNS resolution
- `fix-dns.sh` - Fix DNS issues
