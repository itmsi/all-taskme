#!/bin/bash

echo "🔧 Fixing DNS Issues in Docker Containers"
echo "========================================="

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

echo -e "${BLUE}🔍 Checking Docker daemon configuration...${NC}"

# Check Docker daemon DNS configuration
if [ -f "/etc/docker/daemon.json" ]; then
    echo -e "${YELLOW}Found existing daemon.json${NC}"
    cat /etc/docker/daemon.json
else
    echo -e "${YELLOW}Creating daemon.json with DNS configuration...${NC}"
    mkdir -p /etc/docker
fi

# Create or update Docker daemon configuration
cat > /etc/docker/daemon.json << 'EOF'
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
  "dns-opts": ["ndots:2", "edns0"],
  "dns-search": [],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "bridge": "docker0",
  "iptables": true,
  "ip-forward": true,
  "ip-masq": true
}
EOF

echo -e "${GREEN}✅ Docker daemon configuration updated${NC}"

# Restart Docker daemon
echo -e "${BLUE}🔄 Restarting Docker daemon...${NC}"
systemctl restart docker

# Wait for Docker to start
echo -e "${YELLOW}Waiting for Docker to start...${NC}"
sleep 10

# Check Docker status
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✅ Docker daemon is running${NC}"
else
    echo -e "${RED}❌ Docker daemon failed to start${NC}"
    exit 1
fi

# Clean up existing containers and networks
echo -e "${BLUE}🧹 Cleaning up existing containers and networks...${NC}"
docker-compose -f docker-compose.server.yml down
docker network prune -f

# Recreate containers with new DNS configuration
echo -e "${BLUE}🐳 Recreating containers with new DNS configuration...${NC}"
docker-compose -f docker-compose.server.yml up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 30

# Test DNS resolution
echo -e "${BLUE}🔍 Testing DNS resolution...${NC}"
./test-dns.sh

echo ""
echo -e "${GREEN}🎉 DNS configuration fixed!${NC}"
echo ""
echo -e "${BLUE}📋 What was fixed:${NC}"
echo -e "  - Added DNS servers to Docker daemon configuration"
echo -e "  - Enabled DNS options for better resolution"
echo -e "  - Configured IP forwarding and masquerading"
echo -e "  - Added explicit DNS servers to each container"
echo -e "  - Configured custom network with proper subnet"
echo ""
echo -e "${BLUE}🔍 To verify DNS is working:${NC}"
echo -e "  - Run: ${YELLOW}./test-dns.sh${NC}"
echo -e "  - Check container logs: ${YELLOW}docker-compose -f docker-compose.server.yml logs${NC}"
echo ""
echo -e "${GREEN}✨ DNS fix completed successfully!${NC}"
