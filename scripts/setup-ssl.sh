#!/bin/bash

echo "🔒 Setting up SSL Certificates with Let's Encrypt"
echo "================================================"

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
    apt install -y certbot
fi

# Stop nginx if running to free port 80
echo -e "${BLUE}🛑 Stopping nginx to free port 80...${NC}"
systemctl stop nginx 2>/dev/null || true

# Generate certificates
echo -e "${BLUE}🔒 Generating SSL certificates...${NC}"

# Generate certificate for taskme.motorsights.com
echo -e "${YELLOW}Generating certificate for taskme.motorsights.com...${NC}"
certbot certonly --standalone -d taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com

# Generate certificate for api-taskme.motorsights.com
echo -e "${YELLOW}Generating certificate for api-taskme.motorsights.com...${NC}"
certbot certonly --standalone -d api-taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com

# Create nginx ssl directory if it doesn't exist
mkdir -p nginx/ssl

# Copy certificates to nginx directory
echo -e "${BLUE}📋 Copying certificates to nginx directory...${NC}"

# Copy taskme.motorsights.com certificates
if [ -f "/etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem nginx/ssl/taskme.motorsights.com.crt
    cp /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem nginx/ssl/taskme.motorsights.com.key
    echo -e "${GREEN}✅ taskme.motorsights.com certificates copied${NC}"
else
    echo -e "${RED}❌ Failed to copy taskme.motorsights.com certificates${NC}"
fi

# Copy api-taskme.motorsights.com certificates
if [ -f "/etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem nginx/ssl/api-taskme.motorsights.com.crt
    cp /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem nginx/ssl/api-taskme.motorsights.com.key
    echo -e "${GREEN}✅ api-taskme.motorsights.com certificates copied${NC}"
else
    echo -e "${RED}❌ Failed to copy api-taskme.motorsights.com certificates${NC}"
fi

# Set proper permissions
chmod 644 nginx/ssl/*.crt
chmod 600 nginx/ssl/*.key

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
# Copy renewed certificates to nginx directory
cp /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem /path/to/taskme/nginx/ssl/taskme.motorsights.com.crt
cp /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem /path/to/taskme/nginx/ssl/taskme.motorsights.com.key
cp /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem /path/to/taskme/nginx/ssl/api-taskme.motorsights.com.crt
cp /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem /path/to/taskme/nginx/ssl/api-taskme.motorsights.com.key

# Set proper permissions
chmod 644 /path/to/taskme/nginx/ssl/*.crt
chmod 600 /path/to/taskme/nginx/ssl/*.key

# Reload nginx
systemctl reload nginx
EOF

chmod +x /usr/local/bin/certbot-post-renewal.sh

echo ""
echo -e "${GREEN}🎉 SSL certificates setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Update the renewal script path in /usr/local/bin/certbot-post-renewal.sh"
echo -e "2. Run the deployment script: ${YELLOW}./deploy-server.sh${NC}"
echo ""
echo -e "${BLUE}🔍 Certificate locations:${NC}"
echo -e "  - taskme.motorsights.com: ${GREEN}nginx/ssl/taskme.motorsights.com.crt${NC}"
echo -e "  - api-taskme.motorsights.com: ${GREEN}nginx/ssl/api-taskme.motorsights.com.crt${NC}"
echo ""
echo -e "${BLUE}🔄 Auto-renewal:${NC}"
echo -e "  Certificates will auto-renew daily at 2 AM"
echo -e "  Check renewal status: ${YELLOW}certbot certificates${NC}"
echo ""
echo -e "${GREEN}✨ SSL setup completed successfully!${NC}"
