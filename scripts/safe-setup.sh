#!/bin/bash

echo "🚀 TaskMe Server Setup - Safe & Isolated"
echo "========================================"

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

echo -e "${BLUE}📋 This script will setup TaskMe safely without affecting other systems${NC}"
echo ""
echo -e "${YELLOW}⚠️  Safety measures:${NC}"
echo "  - Using isolated Docker network (172.20.0.0/16)"
echo "  - Using non-standard ports (9561, 9562, 9563)"
echo "  - Creating separate Nginx configuration"
echo "  - Not modifying existing system files"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 1
fi

# Step 1: Check prerequisites
echo -e "${BLUE}🔍 Step 1: Checking prerequisites...${NC}"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx is not installed. Please install nginx first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Nginx is installed${NC}"

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install docker-compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is installed${NC}"

# Step 2: Setup environment
echo -e "${BLUE}📝 Step 2: Setting up environment variables...${NC}"
if [ ! -f .env.server ]; then
    cp config/env.server.example .env.server
    echo -e "${YELLOW}⚠️  Please edit .env.server with your secure passwords:${NC}"
    echo "  - DB_PASSWORD=your-secure-database-password"
    echo "  - JWT_SECRET=your-super-secure-jwt-secret"
    echo ""
    read -p "Press Enter after editing .env.server..."
else
    echo -e "${GREEN}✅ .env.server already exists${NC}"
fi

# Step 3: Check port availability
echo -e "${BLUE}🔍 Step 3: Checking port availability...${NC}"
PORTS=(9561 9562 9563)
for port in "${PORTS[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo -e "${YELLOW}Please free port $port or modify docker-compose.server.yml${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
done

# Step 4: Setup SSL certificates
echo -e "${BLUE}🔒 Step 4: Setting up SSL certificates...${NC}"
if [ ! -f "/etc/ssl/certs/taskme.motorsights.com.crt" ]; then
    echo -e "${YELLOW}Generating SSL certificates with Let's Encrypt...${NC}"
    ./setup-ssl-server.sh
else
    echo -e "${GREEN}✅ SSL certificates already exist${NC}"
fi

# Step 5: Setup Nginx
echo -e "${BLUE}🌐 Step 5: Setting up Nginx configuration...${NC}"
if [ ! -f "/etc/nginx/sites-enabled/taskme" ]; then
    echo -e "${YELLOW}Configuring Nginx...${NC}"
    ./setup-nginx-server.sh
else
    echo -e "${GREEN}✅ Nginx already configured${NC}"
fi

# Step 6: Setup Docker
echo -e "${BLUE}🐳 Step 6: Setting up Docker configuration...${NC}"
echo -e "${YELLOW}Configuring Docker daemon and DNS...${NC}"
./fix-dns.sh

# Step 7: Deploy application
echo -e "${BLUE}🚀 Step 7: Deploying TaskMe application...${NC}"
./deploy-server.sh

# Step 8: Create admin user
echo -e "${BLUE}👤 Step 8: Creating admin user...${NC}"
read -p "Do you want to create an admin user now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./server-maintenance.sh admin
fi

# Step 9: Final verification
echo -e "${BLUE}🔍 Step 9: Final verification...${NC}"

# Check if services are running
echo -e "${YELLOW}Checking service status...${NC}"
if docker-compose -f docker-compose.server.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
else
    echo -e "${RED}❌ Some Docker services are not running${NC}"
fi

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi

# Test DNS
echo -e "${YELLOW}Testing DNS resolution...${NC}"
./test-dns.sh

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
echo -e "  - Test DNS: ${YELLOW}./server-maintenance.sh dns${NC}"
echo ""
echo -e "${BLUE}🛡️  Safety features:${NC}"
echo -e "  - Isolated Docker network (172.20.0.0/16)"
echo -e "  - Non-standard ports (9561, 9562, 9563)"
echo -e "  - Separate Nginx configuration"
echo -e "  - No modification of existing system files"
echo ""
echo -e "${GREEN}✨ Setup completed successfully!${NC}"
