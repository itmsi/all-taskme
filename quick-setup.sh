#!/bin/bash

echo "🚀 TaskMe Server Quick Setup"
echo "============================"

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

echo -e "${BLUE}📋 This script will setup TaskMe on your server with the following steps:${NC}"
echo "1. Setup environment variables"
echo "2. Setup SSL certificates"
echo "3. Setup Nginx configuration"
echo "4. Deploy TaskMe application"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 1
fi

# Step 1: Setup environment variables
echo -e "${BLUE}📝 Step 1: Setting up environment variables...${NC}"
if [ ! -f .env.server ]; then
    cp env.server.example .env.server
    echo -e "${YELLOW}⚠️  Please edit .env.server with your secure passwords:${NC}"
    echo "  - DB_PASSWORD=your-secure-database-password"
    echo "  - JWT_SECRET=your-super-secure-jwt-secret"
    echo ""
    read -p "Press Enter after editing .env.server..."
else
    echo -e "${GREEN}✅ .env.server already exists${NC}"
fi

# Step 2: Setup SSL certificates
echo -e "${BLUE}🔒 Step 2: Setting up SSL certificates...${NC}"
if [ ! -f "/etc/ssl/certs/taskme.motorsights.com.crt" ]; then
    echo -e "${YELLOW}Generating SSL certificates with Let's Encrypt...${NC}"
    ./setup-ssl-server.sh
else
    echo -e "${GREEN}✅ SSL certificates already exist${NC}"
fi

# Step 3: Setup Nginx
echo -e "${BLUE}🌐 Step 3: Setting up Nginx...${NC}"
if [ ! -f "/etc/nginx/sites-enabled/taskme" ]; then
    echo -e "${YELLOW}Configuring Nginx...${NC}"
    ./setup-nginx-server.sh
else
    echo -e "${GREEN}✅ Nginx already configured${NC}"
fi

# Step 4: Deploy application
echo -e "${BLUE}🐳 Step 4: Deploying TaskMe application...${NC}"
./deploy-server.sh

# Step 5: Create admin user
echo -e "${BLUE}👤 Step 5: Creating admin user...${NC}"
read -p "Do you want to create an admin user now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./server-maintenance.sh admin
fi

echo ""
echo -e "${GREEN}🎉 TaskMe server setup completed!${NC}"
echo ""
echo -e "${BLUE}📊 Your TaskMe is now available at:${NC}"
echo -e "  - Frontend: ${GREEN}https://taskme.motorsights.com${NC}"
echo -e "  - API: ${GREEN}https://api-taskme.motorsights.com/api${NC}"
echo -e "  - API Docs: ${GREEN}https://api-taskme.motorsights.com/api-docs${NC}"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "  - Check status: ${YELLOW}./server-maintenance.sh status${NC}"
echo -e "  - Check health: ${YELLOW}./server-maintenance.sh health${NC}"
echo -e "  - View logs: ${YELLOW}./server-maintenance.sh logs${NC}"
echo -e "  - Restart services: ${YELLOW}./server-maintenance.sh restart${NC}"
echo ""
echo -e "${GREEN}✨ Setup completed successfully!${NC}"
