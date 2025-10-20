#!/bin/bash

echo "🔧 Quick Environment Variables Fix"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Setting environment variables directly...${NC}"

# Generate secure passwords
export DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
export JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

echo -e "${GREEN}✅ Environment variables set:${NC}"
echo -e "  - DB_PASSWORD: ${DB_PASSWORD}"
echo -e "  - JWT_SECRET: ${JWT_SECRET}"
echo ""

echo -e "${BLUE}🛑 Stopping containers...${NC}"
docker-compose -f docker-compose.server.yml down

echo -e "${BLUE}🐳 Starting containers with environment variables...${NC}"
docker-compose -f docker-compose.server.yml up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

echo -e "${BLUE}📊 Checking container status...${NC}"
docker-compose -f docker-compose.server.yml ps

echo -e "${GREEN}✅ Environment variables applied!${NC}"
echo ""
echo -e "${YELLOW}🔍 To verify everything is working:${NC}"
echo -e "  - Check logs: ${BLUE}docker-compose -f docker-compose.server.yml logs${NC}"
echo -e "  - Test API: ${BLUE}curl http://localhost:9561/health${NC}"
echo -e "  - Test frontend: ${BLUE}curl http://localhost:9562${NC}"

echo -e "${GREEN}✨ Environment fix completed!${NC}"
