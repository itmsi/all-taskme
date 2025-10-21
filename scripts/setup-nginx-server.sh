#!/bin/bash

echo "🌐 Setting up Nginx for TaskMe Server"
echo "====================================="

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

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing nginx...${NC}"
    apt update
    apt install -y nginx
fi

# Create nginx configuration
echo -e "${BLUE}📋 Creating nginx configuration...${NC}"
cp nginx-server.conf /etc/nginx/sites-available/taskme

# Enable the site
echo -e "${BLUE}🔗 Enabling TaskMe site...${NC}"
ln -sf /etc/nginx/sites-available/taskme /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo -e "${YELLOW}⚠️  Removing default nginx site...${NC}"
    rm /etc/nginx/sites-enabled/default
fi

# Create SSL directories
echo -e "${BLUE}📁 Creating SSL directories...${NC}"
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Check if SSL certificates exist
echo -e "${BLUE}🔒 Checking SSL certificates...${NC}"
if [ ! -f "/etc/ssl/certs/taskme.motorsights.com.crt" ] || [ ! -f "/etc/ssl/private/taskme.motorsights.com.key" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates for taskme.motorsights.com not found!${NC}"
    echo -e "${YELLOW}Please place your SSL certificates in:${NC}"
    echo "  - /etc/ssl/certs/taskme.motorsights.com.crt"
    echo "  - /etc/ssl/private/taskme.motorsights.com.key"
    echo "  - /etc/ssl/certs/api-taskme.motorsights.com.crt"
    echo "  - /etc/ssl/private/api-taskme.motorsights.com.key"
    echo ""
    echo -e "${YELLOW}Or run the SSL setup script: ./setup-ssl-server.sh${NC}"
fi

# Test nginx configuration
echo -e "${BLUE}🧪 Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

# Restart nginx
echo -e "${BLUE}🔄 Restarting nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
    systemctl status nginx
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Nginx setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Ensure SSL certificates are in place"
echo -e "2. Run the deployment script: ${YELLOW}./deploy-server.sh${NC}"
echo ""
echo -e "${BLUE}🔍 Useful commands:${NC}"
echo -e "  - Check nginx status: ${YELLOW}systemctl status nginx${NC}"
echo -e "  - Test nginx config: ${YELLOW}nginx -t${NC}"
echo -e "  - Reload nginx: ${YELLOW}systemctl reload nginx${NC}"
echo -e "  - View nginx logs: ${YELLOW}tail -f /var/log/nginx/error.log${NC}"
echo ""
echo -e "${GREEN}✨ Nginx setup completed successfully!${NC}"
