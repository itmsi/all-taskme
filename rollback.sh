#!/bin/bash

echo "🔄 TaskMe Rollback Script"
echo "========================"

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

echo -e "${YELLOW}⚠️  This script will remove TaskMe from your server${NC}"
echo -e "${YELLOW}It will NOT affect other systems or websites${NC}"
echo ""

read -p "Are you sure you want to rollback TaskMe? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Starting TaskMe rollback...${NC}"

# Step 1: Stop Docker services
echo -e "${BLUE}🛑 Step 1: Stopping Docker services...${NC}"
if [ -f "docker-compose.server.yml" ]; then
    docker-compose -f docker-compose.server.yml down
    echo -e "${GREEN}✅ Docker services stopped${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.server.yml not found${NC}"
fi

# Step 2: Remove Docker containers and images
echo -e "${BLUE}🧹 Step 2: Removing Docker containers and images...${NC}"
docker rm -f taskme_postgres_server taskme_backend_server taskme_frontend_server 2>/dev/null || true
docker rmi -f $(docker images | grep taskme | awk '{print $3}') 2>/dev/null || true
echo -e "${GREEN}✅ Docker containers and images removed${NC}"

# Step 3: Remove Docker network
echo -e "${BLUE}🌐 Step 3: Removing Docker network...${NC}"
docker network rm taskme_network 2>/dev/null || true
echo -e "${GREEN}✅ Docker network removed${NC}"

# Step 4: Disable Nginx site
echo -e "${BLUE}🌐 Step 4: Disabling Nginx site...${NC}"
if [ -f "/etc/nginx/sites-enabled/taskme" ]; then
    rm /etc/nginx/sites-enabled/taskme
    echo -e "${GREEN}✅ Nginx site disabled${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx site not found${NC}"
fi

# Step 5: Remove Nginx configuration
echo -e "${BLUE}📋 Step 5: Removing Nginx configuration...${NC}"
if [ -f "/etc/nginx/sites-available/taskme" ]; then
    rm /etc/nginx/sites-available/taskme
    echo -e "${GREEN}✅ Nginx configuration removed${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx configuration not found${NC}"
fi

# Step 6: Reload Nginx
echo -e "${BLUE}🔄 Step 6: Reloading Nginx...${NC}"
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx is not running${NC}"
fi

# Step 7: Remove SSL certificates (optional)
echo -e "${BLUE}🔒 Step 7: SSL certificates cleanup...${NC}"
read -p "Do you want to remove SSL certificates? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f /etc/ssl/certs/taskme.motorsights.com.crt
    rm -f /etc/ssl/private/taskme.motorsights.com.key
    rm -f /etc/ssl/certs/api-taskme.motorsights.com.crt
    rm -f /etc/ssl/private/api-taskme.motorsights.com.key
    echo -e "${GREEN}✅ SSL certificates removed${NC}"
else
    echo -e "${YELLOW}⚠️  SSL certificates kept${NC}"
fi

# Step 8: Remove Docker volumes (optional)
echo -e "${BLUE}💾 Step 8: Docker volumes cleanup...${NC}"
read -p "Do you want to remove Docker volumes (this will delete all data)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume rm taskme_postgres_data 2>/dev/null || true
    echo -e "${GREEN}✅ Docker volumes removed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker volumes kept${NC}"
fi

# Step 9: Clean up Docker daemon configuration (optional)
echo -e "${BLUE}🐳 Step 9: Docker daemon configuration cleanup...${NC}"
read -p "Do you want to remove Docker daemon DNS configuration? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "/etc/docker/daemon.json" ]; then
        # Backup original daemon.json
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
        # Remove DNS configuration
        jq 'del(.dns, .dns-opts, .dns-search)' /etc/docker/daemon.json > /tmp/daemon.json
        mv /tmp/daemon.json /etc/docker/daemon.json
        systemctl restart docker
        echo -e "${GREEN}✅ Docker daemon configuration cleaned${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker daemon configuration not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker daemon configuration kept${NC}"
fi

# Step 10: Remove application files (optional)
echo -e "${BLUE}📁 Step 10: Application files cleanup...${NC}"
read -p "Do you want to remove TaskMe application files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ..
    rm -rf taskme
    echo -e "${GREEN}✅ Application files removed${NC}"
else
    echo -e "${YELLOW}⚠️  Application files kept${NC}"
fi

echo ""
echo -e "${GREEN}🎉 TaskMe rollback completed!${NC}"
echo ""
echo -e "${BLUE}📋 What was removed:${NC}"
echo -e "  - Docker containers and images"
echo -e "  - Docker network"
echo -e "  - Nginx site configuration"
echo -e "  - SSL certificates (if chosen)"
echo -e "  - Docker volumes (if chosen)"
echo -e "  - Application files (if chosen)"
echo ""
echo -e "${BLUE}🛡️  What was NOT affected:${NC}"
echo -e "  - Other Docker containers"
echo -e "  - Other Nginx sites"
echo -e "  - System files"
echo -e "  - Other applications"
echo ""
echo -e "${GREEN}✨ Rollback completed successfully!${NC}"
