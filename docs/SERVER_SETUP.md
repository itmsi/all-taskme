# Setup TaskMe di Server Production

Dokumentasi ini menjelaskan cara setup TaskMe di server production dengan Docker dan subdomain yang sudah ditentukan.

## 🎯 Konfigurasi Server

### Port dan Subdomain
- **Frontend (UI)**: Port 9562 → `https://taskme.motorsights.com`
- **Backend (API)**: Port 9561 → `https://api-taskme.motorsights.com`
- **Database**: Port 9563 → PostgreSQL

## 📋 Prerequisites

### 1. Server Requirements
- Ubuntu/Debian server dengan Docker dan Docker Compose terinstall
- Domain `motorsights.com` sudah dikonfigurasi
- SSL certificates untuk subdomain

### 2. Software yang Dibutuhkan
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🚀 Setup Langkah demi Langkah

### 1. Clone Repository
```bash
git clone <repository-url>
cd taskme
```

### 2. Setup Environment Variables
```bash
# Copy file environment example
cp env.server.example .env.server

# Edit file .env.server dengan nilai yang sesuai
nano .env.server
```

**Isi file `.env.server`:**
```env
DB_PASSWORD=your-super-secure-database-password-here
JWT_SECRET=your-super-secure-jwt-secret-key-here
API_URL=https://api-taskme.motorsights.com/api
FRONTEND_URL=https://taskme.motorsights.com
```

### 3. Setup Nginx (Server)

Karena Nginx sudah terinstall di server, kita akan menggunakan Nginx yang sudah ada:

```bash
# Setup Nginx configuration
sudo ./setup-nginx-server.sh
```

### 4. Setup SSL Certificates

```bash
# Generate SSL certificates dengan Let's Encrypt
sudo ./setup-ssl-server.sh
```

### 5. Konfigurasi DNS

Pastikan DNS records sudah dikonfigurasi:
```
A    taskme.motorsights.com        → IP_SERVER
A    api-taskme.motorsights.com    → IP_SERVER
```

### 6. Deploy ke Server

```bash
# Jalankan script deployment
./deploy-server.sh
```

## 🔧 Konfigurasi Tambahan

### Firewall Configuration
```bash
# Buka port yang diperlukan
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9561/tcp  # Optional: untuk direct API access
sudo ufw allow 9562/tcp  # Optional: untuk direct frontend access
sudo ufw allow 9563/tcp  # Optional: untuk direct database access
```

### Manual SSL Certificate Setup (Alternative)
Jika tidak menggunakan Let's Encrypt, Anda bisa manual setup SSL:

```bash
# Copy certificates ke direktori nginx
sudo cp your-certificate.crt /etc/ssl/certs/taskme.motorsights.com.crt
sudo cp your-private-key.key /etc/ssl/private/taskme.motorsights.com.key
sudo cp your-api-certificate.crt /etc/ssl/certs/api-taskme.motorsights.com.crt
sudo cp your-api-private-key.key /etc/ssl/private/api-taskme.motorsights.com.key

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/*.crt
sudo chmod 600 /etc/ssl/private/*.key
```

## 📊 Monitoring dan Maintenance

### Check Status Services
```bash
# Check Docker services
docker-compose -f docker-compose.server.yml ps

# Check Docker logs
docker-compose -f docker-compose.server.yml logs -f

# Check Docker logs specific service
docker-compose -f docker-compose.server.yml logs -f backend
docker-compose -f docker-compose.server.yml logs -f frontend

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test DNS resolution
./test-dns.sh
```

### Database Management
```bash
# Create admin user
docker exec -it taskme_backend_server node create-admin.js

# Seed database
docker exec -it taskme_backend_server node seed.js

# Access database
docker exec -it taskme_postgres_server psql -U taskme_user -d taskme
```

### Backup Database
```bash
# Create backup
docker exec taskme_postgres_server pg_dump -U taskme_user taskme > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i taskme_postgres_server psql -U taskme_user -d taskme < backup_file.sql
```

## 🔄 Update dan Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild dan restart services
docker-compose -f docker-compose.server.yml down
docker-compose -f docker-compose.server.yml up -d --build
```

### Restart Services
```bash
# Restart Docker services
docker-compose -f docker-compose.server.yml restart

# Restart specific Docker service
docker-compose -f docker-compose.server.yml restart backend

# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx configuration
sudo systemctl reload nginx
```

### Clean Up
```bash
# Remove unused images
docker image prune -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f
```

## 🚨 Troubleshooting

### Common Issues

#### 1. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/taskme.motorsights.com.crt -text -noout

# Test SSL connection
openssl s_client -connect taskme.motorsights.com:443
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.server.yml logs postgres

# Test database connection
docker exec taskme_postgres_server pg_isready -U taskme_user -d taskme
```

#### 3. API Not Responding
```bash
# Check backend logs
docker-compose -f docker-compose.server.yml logs backend

# Test API health
curl -f http://localhost:9561/health
```

#### 5. DNS Issues
```bash
# Test DNS resolution
./test-dns.sh

# Fix DNS issues
sudo ./fix-dns.sh

# Check Docker daemon configuration
cat /etc/docker/daemon.json

# Restart Docker daemon
sudo systemctl restart docker
```

## 📞 Support

Jika mengalami masalah, check:
1. Docker logs dengan `docker-compose -f docker-compose.server.yml logs -f`
2. Docker status dengan `docker-compose -f docker-compose.server.yml ps`
3. Nginx status dengan `sudo systemctl status nginx`
4. Nginx logs dengan `sudo tail -f /var/log/nginx/error.log`
5. Network connectivity dengan `curl` atau `ping`
6. SSL certificates dengan `openssl` commands

## 🔐 Security Notes

1. **Ganti semua password default** di file `.env.server`
2. **Gunakan SSL certificates yang valid**
3. **Regular update** aplikasi dan dependencies
4. **Monitor logs** untuk aktivitas mencurigakan
5. **Backup database** secara berkala
6. **Firewall configuration** yang tepat
