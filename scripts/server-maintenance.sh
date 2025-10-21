#!/bin/bash

echo "🔧 TaskMe Server Maintenance Script"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage: $0 [command]${NC}"
    echo ""
    echo -e "${YELLOW}Available commands:${NC}"
    echo "  status     - Show status of all services"
    echo "  logs       - Show logs of all services"
    echo "  restart    - Restart all services"
    echo "  update     - Update and rebuild services"
    echo "  backup     - Backup database"
    echo "  restore    - Restore database from backup"
    echo "  cleanup    - Clean up unused Docker resources"
    echo "  health     - Check health of all services"
    echo "  dns        - Test DNS resolution in containers"
    echo "  fix-dns    - Fix DNS issues"
    echo "  admin      - Create admin user"
    echo "  seed       - Seed database with sample data"
    echo ""
}

# Function to check service status
check_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f docker-compose.server.yml ps
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Service Logs:${NC}"
    docker-compose -f docker-compose.server.yml logs -f --tail=50
}

# Function to restart services
restart_services() {
    echo -e "${BLUE}🔄 Restarting services...${NC}"
    docker-compose -f docker-compose.server.yml restart
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# Function to update services
update_services() {
    echo -e "${BLUE}🔄 Updating services...${NC}"
    git pull origin main
    docker-compose -f docker-compose.server.yml down
    docker-compose -f docker-compose.server.yml up -d --build
    echo -e "${GREEN}✅ Services updated${NC}"
}

# Function to backup database
backup_database() {
    echo -e "${BLUE}💾 Creating database backup...${NC}"
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker exec taskme_postgres_server pg_dump -U taskme_user taskme > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Database backed up to: $BACKUP_FILE${NC}"
}

# Function to restore database
restore_database() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Please provide backup file: $0 restore backup_file.sql${NC}"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Backup file not found: $1${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Restoring database from: $1${NC}"
    docker exec -i taskme_postgres_server psql -U taskme_user -d taskme < "$1"
    echo -e "${GREEN}✅ Database restored${NC}"
}

# Function to cleanup Docker resources
cleanup_docker() {
    echo -e "${BLUE}🧹 Cleaning up Docker resources...${NC}"
    docker system prune -f
    docker volume prune -f
    docker network prune -f
    echo -e "${GREEN}✅ Docker cleanup completed${NC}"
}

# Function to check health
check_health() {
    echo -e "${BLUE}🏥 Health Check:${NC}"
    
    # Check database
    if docker exec taskme_postgres_server pg_isready -U taskme_user -d taskme > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database: Healthy${NC}"
    else
        echo -e "${RED}❌ Database: Unhealthy${NC}"
    fi
    
    # Check backend
    if curl -f http://localhost:9561/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API: Healthy${NC}"
    else
        echo -e "${RED}❌ Backend API: Unhealthy${NC}"
    fi
    
    # Check frontend
    if curl -f http://localhost:9562 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: Healthy${NC}"
    else
        echo -e "${RED}❌ Frontend: Unhealthy${NC}"
    fi
    
    # Check nginx
    if curl -f http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx: Healthy${NC}"
    else
        echo -e "${RED}❌ Nginx: Unhealthy${NC}"
    fi
}

# Function to create admin user
create_admin() {
    echo -e "${BLUE}👤 Creating admin user...${NC}"
    docker exec -it taskme_backend_server node create-admin.js
    echo -e "${GREEN}✅ Admin user created${NC}"
}

# Function to test DNS
test_dns() {
    echo -e "${BLUE}🔍 Testing DNS resolution...${NC}"
    ./test-dns.sh
}

# Function to fix DNS
fix_dns() {
    echo -e "${BLUE}🔧 Fixing DNS issues...${NC}"
    ./fix-dns.sh
}

# Main script logic
case "$1" in
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_services
        ;;
    update)
        update_services
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    cleanup)
        cleanup_docker
        ;;
    health)
        check_health
        ;;
    dns)
        test_dns
        ;;
    fix-dns)
        fix_dns
        ;;
    admin)
        create_admin
        ;;
    seed)
        seed_database
        ;;
    *)
        show_usage
        ;;
esac
