#!/bin/bash

echo "🔒 SSL Setup untuk Server Production - AMAN 100%"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${RED}⚠️  PERINGATAN: Ini adalah SERVER PRODUCTION!${NC}"
echo -e "${YELLOW}⚠️  Script ini TIDAK akan menghentikan atau mengganggu Nginx${NC}"
echo -e "${YELLOW}⚠️  Semua website lain akan tetap berjalan normal${NC}"
echo ""

read -p "Apakah Anda yakin ingin melanjutkan? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setup dibatalkan${NC}"
    exit 1
fi

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx sedang berjalan - AMAN${NC}"
else
    echo -e "${RED}❌ Nginx tidak berjalan. Harap start Nginx terlebih dahulu${NC}"
    echo -e "${YELLOW}sudo systemctl start nginx${NC}"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Installing certbot...${NC}"
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Method 1: Gunakan certbot dengan nginx plugin (AMAN)
echo -e "${BLUE}🔒 Method 1: Menggunakan certbot dengan nginx plugin (RECOMMENDED)${NC}"
echo -e "${YELLOW}Ini akan menambahkan SSL ke Nginx yang sudah ada tanpa mengganggu${NC}"

read -p "Gunakan method ini? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔒 Generating SSL certificates dengan nginx plugin...${NC}"
    
    # Generate certificate untuk taskme.motorsights.com
    echo -e "${YELLOW}Generating certificate untuk taskme.motorsights.com...${NC}"
    certbot --nginx -d taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com
    
    # Generate certificate untuk api-taskme.motorsights.com
    echo -e "${YELLOW}Generating certificate untuk api-taskme.motorsights.com...${NC}"
    certbot --nginx -d api-taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com
    
    echo -e "${GREEN}✅ SSL certificates generated dengan nginx plugin${NC}"
else
    # Method 2: Manual copy dari Let's Encrypt
    echo -e "${BLUE}🔒 Method 2: Manual copy dari Let's Encrypt${NC}"
    echo -e "${YELLOW}Pastikan Anda sudah punya SSL certificates dari Let's Encrypt${NC}"
    
    # Check if certificates exist
    if [ -f "/etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem" ]; then
        echo -e "${GREEN}✅ Found existing certificates${NC}"
        
        # Create SSL directories
        echo -e "${BLUE}📁 Creating SSL directories...${NC}"
        mkdir -p /etc/ssl/certs
        mkdir -p /etc/ssl/private
        
        # Copy certificates
        echo -e "${BLUE}📋 Copying certificates...${NC}"
        cp /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem /etc/ssl/certs/taskme.motorsights.com.crt
        cp /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem /etc/ssl/private/taskme.motorsights.com.key
        cp /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem /etc/ssl/certs/api-taskme.motorsights.com.crt
        cp /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem /etc/ssl/private/api-taskme.motorsights.com.key
        
        # Set proper permissions
        chmod 644 /etc/ssl/certs/*.crt
        chmod 600 /etc/ssl/private/*.key
        
        echo -e "${GREEN}✅ Certificates copied successfully${NC}"
    else
        echo -e "${RED}❌ No existing certificates found${NC}"
        echo -e "${YELLOW}Please generate certificates manually first${NC}"
        exit 1
    fi
fi

# Setup auto-renewal (AMAN)
echo -e "${BLUE}🔄 Setting up auto-renewal...${NC}"

# Create post-renewal script
cat > /usr/local/bin/certbot-post-renewal.sh << 'EOF'
#!/bin/bash
# Copy renewed certificates to nginx ssl directory
if [ -f "/etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem /etc/ssl/certs/taskme.motorsights.com.crt
    cp /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem /etc/ssl/private/taskme.motorsights.com.key
fi

if [ -f "/etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem /etc/ssl/certs/api-taskme.motorsights.com.crt
    cp /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem /etc/ssl/private/api-taskme.motorsights.com.key
fi

# Set proper permissions
chmod 644 /etc/ssl/certs/*.crt 2>/dev/null || true
chmod 600 /etc/ssl/private/*.key 2>/dev/null || true

# Reload nginx (AMAN - hanya reload config)
systemctl reload nginx
EOF

chmod +x /usr/local/bin/certbot-post-renewal.sh

# Create cron job for auto-renewal
cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates every day at 2 AM
0 2 * * * root certbot renew --quiet --post-hook "/usr/local/bin/certbot-post-renewal.sh"
EOF

echo ""
echo -e "${GREEN}🎉 SSL setup completed dengan AMAN!${NC}"
echo ""
echo -e "${BLUE}📋 Certificate locations:${NC}"
echo -e "  - taskme.motorsights.com: ${GREEN}/etc/ssl/certs/taskme.motorsights.com.crt${NC}"
echo -e "  - api-taskme.motorsights.com: ${GREEN}/etc/ssl/certs/api-taskme.motorsights.com.crt${NC}"
echo ""
echo -e "${BLUE}🛡️  Safety features:${NC}"
echo -e "  - ✅ Nginx TIDAK dihentikan"
echo -e "  - ✅ Website lain tetap berjalan"
echo -e "  - ✅ Hanya reload konfigurasi Nginx"
echo -e "  - ✅ Auto-renewal setup"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Tambahkan konfigurasi Nginx manual"
echo -e "2. Test konfigurasi: ${YELLOW}sudo nginx -t${NC}"
echo -e "3. Reload Nginx: ${YELLOW}sudo systemctl reload nginx${NC}"
echo -e "4. Run deployment: ${YELLOW}./deploy-server.sh${NC}"
echo ""
echo -e "${GREEN}✨ SSL setup completed dengan AMAN!${NC}"
