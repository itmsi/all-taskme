#!/bin/bash

echo "🔨 Rebuilding TaskMe Containers"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping containers...${NC}"
docker-compose -f docker-compose.server.yml down

echo -e "${BLUE}🗑️  Removing old images...${NC}"
docker-compose -f docker-compose.server.yml rm -f

echo -e "${BLUE}🔨 Rebuilding containers with fixed Dockerfile...${NC}"
docker-compose -f docker-compose.server.yml build --no-cache

echo -e "${BLUE}🐳 Starting containers...${NC}"
docker-compose -f docker-compose.server.yml up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

echo -e "${BLUE}📊 Checking container status...${NC}"
docker-compose -f docker-compose.server.yml ps

echo -e "${GREEN}✅ Containers rebuilt successfully!${NC}"
echo ""
echo -e "${YELLOW}🔍 To verify everything is working:${NC}"
echo -e "  - Check logs: ${BLUE}docker-compose -f docker-compose.server.yml logs${NC}"
echo -e "  - Test API: ${BLUE}curl http://localhost:9561/health${NC}"
echo -e "  - Test frontend: ${BLUE}curl http://localhost:9562${NC}"

echo -e "${GREEN}✨ Rebuild completed!${NC}"
