#!/bin/bash

echo "🔒 Setting up SSL Certificates for Server Nginx"
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

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Installing certbot...${NC}"
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Stop nginx if running to free port 80
echo -e "${BLUE}🛑 Stopping nginx to free port 80...${NC}"
systemctl stop nginx

# Generate certificates
echo -e "${BLUE}🔒 Generating SSL certificates...${NC}"

# Generate certificate for taskme.motorsights.com
echo -e "${YELLOW}Generating certificate for taskme.motorsights.com...${NC}"
certbot certonly --standalone -d taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com

# Generate certificate for api-taskme.motorsights.com
echo -e "${YELLOW}Generating certificate for api-taskme.motorsights.com...${NC}"
certbot certonly --standalone -d api-taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com

# Create SSL directories
echo -e "${BLUE}📁 Creating SSL directories...${NC}"
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Copy certificates to nginx ssl directory
echo -e "${BLUE}📋 Copying certificates to nginx ssl directory...${NC}"

# Copy taskme.motorsights.com certificates
if [ -f "/etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem /etc/ssl/certs/taskme.motorsights.com.crt
    cp /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem /etc/ssl/private/taskme.motorsights.com.key
    echo -e "${GREEN}✅ taskme.motorsights.com certificates copied${NC}"
else
    echo -e "${RED}❌ Failed to copy taskme.motorsights.com certificates${NC}"
fi

# Copy api-taskme.motorsights.com certificates
if [ -f "/etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem /etc/ssl/certs/api-taskme.motorsights.com.crt
    cp /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem /etc/ssl/private/api-taskme.motorsights.com.key
    echo -e "${GREEN}✅ api-taskme.motorsights.com certificates copied${NC}"
else
    echo -e "${RED}❌ Failed to copy api-taskme.motorsights.com certificates${NC}"
fi

# Set proper permissions
chmod 644 /etc/ssl/certs/*.crt
chmod 600 /etc/ssl/private/*.key

# Setup auto-renewal
echo -e "${BLUE}🔄 Setting up auto-renewal...${NC}"

# Create renewal script
cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates every day at 2 AM
0 2 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# Create post-renewal script to copy certificates
cat > /usr/local/bin/certbot-post-renewal.sh << 'EOF'
#!/bin/bash
# Copy renewed certificates to nginx ssl directory
cp /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem /etc/ssl/certs/taskme.motorsights.com.crt
cp /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem /etc/ssl/private/taskme.motorsights.com.key
cp /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem /etc/ssl/certs/api-taskme.motorsights.com.crt
cp /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem /etc/ssl/private/api-taskme.motorsights.com.key

# Set proper permissions
chmod 644 /etc/ssl/certs/*.crt
chmod 600 /etc/ssl/private/*.key

# Reload nginx
systemctl reload nginx
EOF

chmod +x /usr/local/bin/certbot-post-renewal.sh

# Update cron job to use post-renewal script
cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates every day at 2 AM
0 2 * * * root certbot renew --quiet --post-hook "/usr/local/bin/certbot-post-renewal.sh"
EOF

# Start nginx
echo -e "${BLUE}🔄 Starting nginx...${NC}"
systemctl start nginx

echo ""
echo -e "${GREEN}🎉 SSL certificates setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Certificate locations:${NC}"
echo -e "  - taskme.motorsights.com: ${GREEN}/etc/ssl/certs/taskme.motorsights.com.crt${NC}"
echo -e "  - api-taskme.motorsights.com: ${GREEN}/etc/ssl/certs/api-taskme.motorsights.com.crt${NC}"
echo ""
echo -e "${BLUE}🔄 Auto-renewal:${NC}"
echo -e "  Certificates will auto-renew daily at 2 AM"
echo -e "  Check renewal status: ${YELLOW}certbot certificates${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Run nginx setup: ${YELLOW}./setup-nginx-server.sh${NC}"
echo -e "2. Run deployment: ${YELLOW}./deploy-server.sh${NC}"
echo ""
echo -e "${GREEN}✨ SSL setup completed successfully!${NC}"
