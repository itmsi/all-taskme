#!/bin/bash

echo "🔍 Checking Port Availability for TaskMe"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports yang akan digunakan TaskMe
PORTS=(9561 9562 9563 80 443)

echo -e "${BLUE}📋 Checking ports that TaskMe will use:${NC}"
echo ""

for port in "${PORTS[@]}"; do
    echo -n "Port $port: "
    
    if netstat -tuln | grep -q ":$port "; then
        # Get process info
        PID=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$PID" ]; then
            PROCESS=$(ps -p $PID -o comm= 2>/dev/null)
            echo -e "${RED}❌ IN USE by process: $PROCESS (PID: $PID)${NC}"
        else
            echo -e "${RED}❌ IN USE${NC}"
        fi
    else
        echo -e "${GREEN}✅ AVAILABLE${NC}"
    fi
done

echo ""
echo -e "${BLUE}📊 Port Usage Summary:${NC}"
echo "  - Port 9561: Backend API"
echo "  - Port 9562: Frontend"
echo "  - Port 9563: Database (PostgreSQL)"
echo "  - Port 80: Nginx HTTP (redirect to HTTPS)"
echo "  - Port 443: Nginx HTTPS"
echo ""

# Check if any critical ports are in use
CRITICAL_PORTS=(80 443)
CRITICAL_IN_USE=false

for port in "${CRITICAL_PORTS[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        CRITICAL_IN_USE=true
        break
    fi
done

if [ "$CRITICAL_IN_USE" = true ]; then
    echo -e "${YELLOW}⚠️  Warning: Ports 80 or 443 are in use${NC}"
    echo -e "${YELLOW}This is normal if Nginx is already running on this server${NC}"
    echo -e "${YELLOW}TaskMe will use the existing Nginx configuration${NC}"
else
    echo -e "${GREEN}✅ All critical ports are available${NC}"
fi

echo ""
echo -e "${BLUE}🔧 If ports are in use by other services:${NC}"
echo "  - Check what's using them: sudo lsof -i :PORT"
echo "  - Stop conflicting services if needed"
echo "  - Or modify docker-compose.server.yml to use different ports"
echo ""
echo -e "${GREEN}✨ Port check completed!${NC}"
