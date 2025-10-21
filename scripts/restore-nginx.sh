#!/bin/bash

echo "🔄 Restoring Nginx Service"
echo "=========================="

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

echo -e "${BLUE}🔄 Restoring Nginx service...${NC}"

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is already running${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx is not running, starting it...${NC}"
    
    # Start nginx
    systemctl start nginx
    
    # Check if nginx started successfully
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start Nginx${NC}"
        echo -e "${YELLOW}Checking Nginx status...${NC}"
        systemctl status nginx
        exit 1
    fi
fi

# Check nginx configuration
echo -e "${BLUE}🧪 Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    echo -e "${YELLOW}Please check the configuration manually${NC}"
fi

# Reload nginx configuration
echo -e "${BLUE}🔄 Reloading Nginx configuration...${NC}"
systemctl reload nginx

# Check nginx status
echo -e "${BLUE}📊 Nginx status:${NC}"
systemctl status nginx --no-pager

echo ""
echo -e "${GREEN}🎉 Nginx service restored!${NC}"
echo ""
echo -e "${BLUE}📋 Nginx information:${NC}"
echo -e "  - Status: ${GREEN}$(systemctl is-active nginx)${NC}"
echo -e "  - Enabled: ${GREEN}$(systemctl is-enabled nginx)${NC}"
echo -e "  - Port 80: ${GREEN}$(netstat -tuln | grep :80 | wc -l) connections${NC}"
echo -e "  - Port 443: ${GREEN}$(netstat -tuln | grep :443 | wc -l) connections${NC}"
echo ""
echo -e "${BLUE}🔍 Useful commands:${NC}"
echo -e "  - Check status: ${YELLOW}sudo systemctl status nginx${NC}"
echo -e "  - Check logs: ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  - Test config: ${YELLOW}sudo nginx -t${NC}"
echo -e "  - Reload config: ${YELLOW}sudo systemctl reload nginx${NC}"
echo ""
echo -e "${GREEN}✨ Nginx restoration completed!${NC}"
