#!/bin/bash

echo "🚀 Deploying TaskMe to Server Production..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.server exists
if [ ! -f .env.server ]; then
    echo -e "${RED}❌ .env.server file not found!${NC}"
    echo -e "${YELLOW}Please create .env.server with the following variables:${NC}"
    echo "  DB_PASSWORD=your-secure-database-password"
    echo "  JWT_SECRET=your-super-secure-jwt-secret"
    echo "  API_URL=https://api-taskme.motorsights.com/api"
    echo "  FRONTEND_URL=https://taskme.motorsights.com"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📋 Loading environment variables...${NC}"
export $(cat .env.server | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Missing required environment variables!${NC}"
    echo -e "${YELLOW}Please set DB_PASSWORD, JWT_SECRET, and API_URL in .env.server${NC}"
    exit 1
fi

# Check if SSL certificates exist
echo -e "${BLUE}🔒 Checking SSL certificates...${NC}"
if [ ! -f "/etc/ssl/certs/taskme.motorsights.com.crt" ] || [ ! -f "/etc/ssl/private/taskme.motorsights.com.key" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates for taskme.motorsights.com not found!${NC}"
    echo -e "${YELLOW}Please run SSL setup first: ./setup-ssl-server.sh${NC}"
    echo -e "${YELLOW}Or place your SSL certificates in:${NC}"
    echo "  - /etc/ssl/certs/taskme.motorsights.com.crt"
    echo "  - /etc/ssl/private/taskme.motorsights.com.key"
    echo "  - /etc/ssl/certs/api-taskme.motorsights.com.crt"
    echo "  - /etc/ssl/private/api-taskme.motorsights.com.key"
    exit 1
fi

if [ ! -f "/etc/ssl/certs/api-taskme.motorsights.com.crt" ] || [ ! -f "/etc/ssl/private/api-taskme.motorsights.com.key" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates for api-taskme.motorsights.com not found!${NC}"
    echo -e "${YELLOW}Please run SSL setup first: ./setup-ssl-server.sh${NC}"
    exit 1
fi

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.server.yml down

# Build and start production containers
echo -e "${BLUE}🐳 Building and starting production containers...${NC}"
docker-compose -f docker-compose.server.yml up -d --build

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 45

# Check if services are running
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check database
echo -e "${YELLOW}Checking database...${NC}"
if docker exec taskme_postgres_server pg_isready -U taskme_user -d taskme > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${RED}❌ Database is not responding${NC}"
    docker-compose -f docker-compose.server.yml logs postgres
    exit 1
fi

# Check backend
echo -e "${YELLOW}Checking backend API...${NC}"
if curl -f http://localhost:9561/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API is not responding${NC}"
    docker-compose -f docker-compose.server.yml logs backend
    exit 1
fi

# Check frontend
echo -e "${YELLOW}Checking frontend...${NC}"
if curl -f http://localhost:9562 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
    docker-compose -f docker-compose.server.yml logs frontend
    exit 1
fi

# Check nginx
echo -e "${YELLOW}Checking nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is healthy${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
    echo -e "${YELLOW}Please run nginx setup: ./setup-nginx-server.sh${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 TaskMe deployed successfully to server!${NC}"
echo ""
echo -e "${BLUE}📊 Services:${NC}"
echo -e "  - Frontend: ${GREEN}https://taskme.motorsights.com${NC}"
echo -e "  - Backend API: ${GREEN}https://api-taskme.motorsights.com/api${NC}"
echo -e "  - API Documentation: ${GREEN}https://api-taskme.motorsights.com/api-docs${NC}"
echo -e "  - Database: ${GREEN}localhost:9563${NC}"
echo ""
echo -e "${BLUE}🔍 Useful commands:${NC}"
echo -e "  - Check logs: ${YELLOW}docker-compose -f docker-compose.server.yml logs -f${NC}"
echo -e "  - Stop services: ${YELLOW}docker-compose -f docker-compose.server.yml down${NC}"
echo -e "  - Restart services: ${YELLOW}docker-compose -f docker-compose.server.yml restart${NC}"
echo -e "  - Update services: ${YELLOW}docker-compose -f docker-compose.server.yml up -d --build${NC}"
echo ""
echo -e "${BLUE}🔧 Database management:${NC}"
echo -e "  - Create admin user: ${YELLOW}docker exec -it taskme_backend_server node create-admin.js${NC}"
echo -e "  - Seed database: ${YELLOW}docker exec -it taskme_backend_server node seed.js${NC}"
echo ""
echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
