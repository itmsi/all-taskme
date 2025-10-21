#!/bin/bash

echo "🔧 Setting up Environment Variables for TaskMe (Safe Version)"
echo "============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Creating environment file...${NC}"

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

# Create .env.server file using echo (more reliable)
echo "# Environment variables for server production deployment" > .env.server
echo "# Generated on $(date)" >> .env.server
echo "" >> .env.server
echo "# Database Configuration" >> .env.server
echo "DB_PASSWORD=${DB_PASSWORD}" >> .env.server
echo "" >> .env.server
echo "# JWT Secret for authentication" >> .env.server
echo "JWT_SECRET=${JWT_SECRET}" >> .env.server
echo "" >> .env.server
echo "# API URL (should match your subdomain)" >> .env.server
echo "API_URL=https://api-taskme.motorsights.com/api" >> .env.server
echo "" >> .env.server
echo "# Frontend URL (should match your subdomain)" >> .env.server
echo "FRONTEND_URL=https://taskme.motorsights.com" >> .env.server

echo -e "${GREEN}✅ Environment file created: .env.server${NC}"
echo ""
echo -e "${BLUE}📊 Generated values:${NC}"
echo -e "  - DB_PASSWORD: ${DB_PASSWORD}"
echo -e "  - JWT_SECRET: ${JWT_SECRET}"
echo ""
echo -e "${YELLOW}⚠️  Keep these values secure!${NC}"
echo ""

# Verify file was created
if [ -f ".env.server" ]; then
    echo -e "${GREEN}✅ File .env.server created successfully${NC}"
    echo -e "${BLUE}📄 File contents:${NC}"
    cat .env.server
    echo ""
else
    echo -e "${RED}❌ Failed to create .env.server file${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Restarting containers with environment variables...${NC}"

# Stop containers
docker-compose -f docker-compose.server.yml --env-file .env.server down

# Start containers with environment variables
docker-compose -f docker-compose.server.yml --env-file .env.server up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

echo -e "${BLUE}📊 Checking container status...${NC}"
docker-compose -f docker-compose.server.yml ps

echo -e "${GREEN}✅ Environment setup completed!${NC}"
echo ""
echo -e "${YELLOW}🔍 To verify everything is working:${NC}"
echo -e "  - Check logs: ${BLUE}docker-compose -f docker-compose.server.yml logs${NC}"
echo -e "  - Test API: ${BLUE}curl http://localhost:9561/health${NC}"
echo -e "  - Test frontend: ${BLUE}curl http://localhost:9562${NC}"

echo -e "${GREEN}✨ Environment setup completed!${NC}"
