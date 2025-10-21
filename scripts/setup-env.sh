#!/bin/bash

echo "🔧 Setting up Environment Variables for TaskMe"
echo "=============================================="

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

# Create .env.server file
sudo tee .env.server > /dev/null << EOF
# Environment variables for server production deployment
# Generated on $(date)

# Database Configuration
DB_PASSWORD=${DB_PASSWORD}

# JWT Secret for authentication
JWT_SECRET=${JWT_SECRET}

# API URL (should match your subdomain)
API_URL=https://api-taskme.motorsights.com/api

# Frontend URL (should match your subdomain)
FRONTEND_URL=https://taskme.motorsights.com

# Optional: Email configuration (if you want to add email notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# FROM_EMAIL=noreply@motorsights.com

# Optional: File upload settings
# MAX_FILE_SIZE=10485760
# UPLOAD_PATH=/app/uploads
EOF

echo -e "${GREEN}✅ Environment file created: .env.server${NC}"
echo ""
echo -e "${BLUE}📊 Generated values:${NC}"
echo -e "  - DB_PASSWORD: ${DB_PASSWORD}"
echo -e "  - JWT_SECRET: ${JWT_SECRET}"
echo ""
echo -e "${YELLOW}⚠️  Keep these values secure!${NC}"
echo ""
echo -e "${BLUE}🔄 Restarting containers with environment variables...${NC}"

# Stop containers
docker-compose -f docker-compose.server.yml down

# Start containers with environment variables
docker-compose -f docker-compose.server.yml up -d

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
