#!/bin/bash

echo "🔍 Testing DNS Resolution in Docker Containers"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test DNS in container
test_dns_in_container() {
    local container_name=$1
    local service_name=$2
    
    echo -e "${BLUE}Testing DNS in ${service_name} container...${NC}"
    
    if docker ps | grep -q "$container_name"; then
        echo -e "${YELLOW}Container $container_name is running${NC}"
        
        # Test external DNS resolution
        echo -e "${YELLOW}Testing external DNS resolution...${NC}"
        if docker exec "$container_name" nslookup google.com > /dev/null 2>&1; then
            echo -e "${GREEN}✅ External DNS resolution works${NC}"
        else
            echo -e "${RED}❌ External DNS resolution failed${NC}"
        fi
        
        # Test internal DNS resolution
        echo -e "${YELLOW}Testing internal DNS resolution...${NC}"
        if docker exec "$container_name" nslookup postgres > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Internal DNS resolution works${NC}"
        else
            echo -e "${RED}❌ Internal DNS resolution failed${NC}"
        fi
        
        # Test specific service resolution
        case $service_name in
            "Backend")
                if docker exec "$container_name" nslookup backend > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Backend service DNS works${NC}"
                else
                    echo -e "${RED}❌ Backend service DNS failed${NC}"
                fi
                ;;
            "Frontend")
                if docker exec "$container_name" nslookup frontend > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Frontend service DNS works${NC}"
                else
                    echo -e "${RED}❌ Frontend service DNS failed${NC}"
                fi
                ;;
        esac
        
        # Test ping to external
        echo -e "${YELLOW}Testing connectivity to external...${NC}"
        if docker exec "$container_name" ping -c 1 8.8.8.8 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ External connectivity works${NC}"
        else
            echo -e "${RED}❌ External connectivity failed${NC}"
        fi
        
        # Test ping to internal services
        echo -e "${YELLOW}Testing connectivity to internal services...${NC}"
        if docker exec "$container_name" ping -c 1 postgres > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Internal connectivity works${NC}"
        else
            echo -e "${RED}❌ Internal connectivity failed${NC}"
        fi
        
    else
        echo -e "${RED}❌ Container $container_name is not running${NC}"
    fi
    
    echo ""
}

# Check if containers are running
echo -e "${BLUE}📊 Checking container status...${NC}"
docker-compose -f docker-compose.server.yml ps

echo ""

# Test DNS in each container
test_dns_in_container "taskme_postgres_server" "Database"
test_dns_in_container "taskme_backend_server" "Backend"
test_dns_in_container "taskme_frontend_server" "Frontend"

# Test network connectivity between containers
echo -e "${BLUE}🔗 Testing inter-container connectivity...${NC}"

# Test backend to database
echo -e "${YELLOW}Testing backend to database connection...${NC}"
if docker exec taskme_backend_server nc -z postgres 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend can connect to database${NC}"
else
    echo -e "${RED}❌ Backend cannot connect to database${NC}"
fi

# Test frontend to backend
echo -e "${YELLOW}Testing frontend to backend connection...${NC}"
if docker exec taskme_frontend_server nc -z backend 5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend can connect to backend${NC}"
else
    echo -e "${RED}❌ Frontend cannot connect to backend${NC}"
fi

# Test external API calls from backend
echo -e "${YELLOW}Testing external API calls from backend...${NC}"
if docker exec taskme_backend_server curl -f https://httpbin.org/get > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend can make external API calls${NC}"
else
    echo -e "${RED}❌ Backend cannot make external API calls${NC}"
fi

echo ""
echo -e "${BLUE}📋 DNS Configuration Summary:${NC}"
echo -e "  - External DNS servers: 8.8.8.8, 8.8.4.4, 1.1.1.1"
echo -e "  - Network subnet: 172.20.0.0/16"
echo -e "  - Gateway: 172.20.0.1"
echo -e "  - Bridge networking enabled"
echo -e "  - IP masquerading enabled"
echo ""
echo -e "${GREEN}✨ DNS testing completed!${NC}"
