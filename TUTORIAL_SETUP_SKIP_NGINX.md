# 🚀 Tutorial Setup TaskMe di Server Production
## Skip Nginx Setup (Sudah Ada)

### 📋 Prerequisites
- Server Ubuntu/Debian dengan Nginx sudah terinstall dan dikonfigurasi
- Docker dan Docker Compose sudah terinstall
- Domain `motorsights.com` sudah dikonfigurasi
- Akses root/sudo ke server

---

## 🎯 Tahapan Setup (Skip Nginx)

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

### **Tahap 3: Konfigurasi Nginx Manual**

**Anda perlu menambahkan konfigurasi berikut ke Nginx yang sudah ada:**

#### **3.1. Buat file konfigurasi TaskMe**

```bash
# Buat file konfigurasi TaskMe
sudo nano /etc/nginx/sites-available/taskme
```

#### **3.2. Isi dengan konfigurasi berikut:**

```nginx
# Upstream servers
upstream taskme_frontend {
    server 127.0.0.1:9562;
}

upstream taskme_backend {
    server 127.0.0.1:9561;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name taskme.motorsights.com api-taskme.motorsights.com;
    return 301 https://$server_name$request_uri;
}

# Frontend (taskme.motorsights.com)
server {
    listen 443 ssl http2;
    server_name taskme.motorsights.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/taskme.motorsights.com.crt;
    ssl_certificate_key /etc/ssl/private/taskme.motorsights.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://taskme_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            proxy_pass http://taskme_frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Backend API (api-taskme.motorsights.com)
server {
    listen 443 ssl http2;
    server_name api-taskme.motorsights.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/api-taskme.motorsights.com.crt;
    ssl_certificate_key /etc/ssl/private/api-taskme.motorsights.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://taskme_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://taskme.motorsights.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://taskme.motorsights.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # API Documentation
    location /api-docs {
        proxy_pass http://taskme_backend/api-docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://taskme_backend/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://taskme_backend/auth/login;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **3.3. Enable site dan reload Nginx**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/taskme /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

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
