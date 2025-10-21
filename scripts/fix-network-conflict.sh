#!/bin/bash

echo "🔧 Fixing Docker Network Conflict"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Cleaning up conflicting networks...${NC}"

# Stop all containers
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
docker-compose -f docker-compose.server.yml down

# Remove only TaskMe networks (AMAN - tidak menghapus network lain)
echo -e "${YELLOW}🗑️  Removing only TaskMe networks...${NC}"
docker network rm all-taskme_taskme_network 2>/dev/null || true
docker network rm taskme_network 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

echo -e "${BLUE}🐳 Starting containers with new network configuration...${NC}"

# Start containers with new network
docker-compose -f docker-compose.server.yml up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check container status
echo -e "${BLUE}📊 Checking container status...${NC}"
docker-compose -f docker-compose.server.yml ps

echo -e "${GREEN}✅ Network conflict fixed!${NC}"
echo ""
echo -e "${BLUE}📋 What was fixed:${NC}"
echo -e "  - Changed subnet from 172.20.0.0/16 to 172.25.0.0/16"
echo -e "  - Cleaned up conflicting networks"
echo -e "  - Restarted containers with new configuration"
echo ""
echo -e "${YELLOW}🔍 To verify everything is working:${NC}"
echo -e "  - Check status: ${BLUE}docker-compose -f docker-compose.server.yml ps${NC}"
echo -e "  - Check logs: ${BLUE}docker-compose -f docker-compose.server.yml logs${NC}"
echo -e "  - Test DNS: ${BLUE}./test-dns.sh${NC}"

echo -e "${GREEN}✨ Network fix completed!${NC}"
