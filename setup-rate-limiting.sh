#!/bin/bash

echo "🔒 Setup Rate Limiting for TaskMe"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Adding rate limiting zones to main Nginx configuration${NC}"

# Backup original nginx.conf
echo -e "${YELLOW}📦 Creating backup of nginx.conf...${NC}"
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Check if rate limiting zones already exist
if grep -q "limit_req_zone.*zone=api" /etc/nginx/nginx.conf; then
    echo -e "${YELLOW}⚠️  Rate limiting zones already exist in nginx.conf${NC}"
    echo -e "${GREEN}✅ No changes needed${NC}"
    exit 0
fi

# Add rate limiting zones to http block
echo -e "${BLUE}➕ Adding rate limiting zones...${NC}"

# Find the http block and add rate limiting zones after it
sudo sed -i '/^http {/a\\n    # Rate limiting zones for TaskMe\n    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;\n' /etc/nginx/nginx.conf

echo -e "${GREEN}✅ Rate limiting zones added to nginx.conf${NC}"

# Test nginx configuration
echo -e "${BLUE}🧪 Testing Nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "   1. Regenerate Nginx site configuration: ${BLUE}./generate-nginx-config.sh${NC}"
    echo -e "   2. Copy and enable site: ${BLUE}sudo cp nginx-taskme.conf /etc/nginx/sites-available/taskme${NC}"
    echo -e "   3. Enable site: ${BLUE}sudo ln -s /etc/nginx/sites-available/taskme /etc/nginx/sites-enabled/${NC}"
    echo -e "   4. Test again: ${BLUE}sudo nginx -t${NC}"
    echo -e "   5. Reload Nginx: ${BLUE}sudo systemctl reload nginx${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    echo -e "${YELLOW}🔄 Restoring backup...${NC}"
    sudo cp /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/nginx.conf
    echo -e "${RED}❌ Changes reverted. Please check nginx.conf manually${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Rate limiting setup completed!${NC}"
