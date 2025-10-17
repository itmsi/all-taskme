#!/bin/bash

echo "🔧 TaskMe Maintenance Script"

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  backup-db     - Backup database"
    echo "  restore-db    - Restore database from backup"
    echo "  logs          - Show application logs"
    echo "  status        - Show service status"
    echo "  restart       - Restart all services"
    echo "  cleanup       - Clean up unused Docker resources"
    echo "  update        - Update and restart services"
    echo "  help          - Show this help message"
}

# Function to backup database
backup_db() {
    echo "📦 Creating database backup..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="taskme_backup_${timestamp}.sql"
    
    docker-compose exec postgres pg_dump -U taskme_user -d taskme > "${backup_file}"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database backup created: ${backup_file}"
    else
        echo "❌ Database backup failed"
        exit 1
    fi
}

# Function to restore database
restore_db() {
    echo "📥 Restoring database..."
    echo "Available backup files:"
    ls -la *.sql 2>/dev/null || echo "No backup files found"
    echo ""
    read -p "Enter backup file name: " backup_file
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Backup file not found: $backup_file"
        exit 1
    fi
    
    docker-compose exec -T postgres psql -U taskme_user -d taskme < "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restored from: $backup_file"
    else
        echo "❌ Database restore failed"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    echo "📋 Showing application logs..."
    docker-compose logs -f
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    echo ""
    docker-compose ps
    echo ""
    echo "🔍 Health Checks:"
    
    # Check backend
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Backend: Healthy"
    else
        echo "❌ Backend: Unhealthy"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend: Healthy"
    else
        echo "❌ Frontend: Unhealthy"
    fi
    
    # Check database
    if docker-compose exec postgres pg_isready -U taskme_user -d taskme > /dev/null 2>&1; then
        echo "✅ Database: Healthy"
    else
        echo "❌ Database: Unhealthy"
    fi
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting services..."
    docker-compose restart
    echo "✅ Services restarted"
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Cleanup completed"
}

# Function to update
update_services() {
    echo "🔄 Updating and restarting services..."
    docker-compose down
    docker-compose pull
    docker-compose up -d --build
    echo "✅ Services updated and restarted"
}

# Main script logic
case "$1" in
    "backup-db")
        backup_db
        ;;
    "restore-db")
        restore_db
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "restart")
        restart_services
        ;;
    "cleanup")
        cleanup
        ;;
    "update")
        update_services
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
