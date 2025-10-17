#!/bin/bash

echo "🗄️ Setting up TaskMe Database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start only PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U taskme_user -d taskme; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"
echo ""
echo "📊 Database Information:"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo "  - Database: taskme"
echo "  - Username: taskme_user"
echo "  - Password: taskme_password"
echo ""
echo "🔗 Connection String:"
echo "  postgresql://taskme_user:taskme_password@localhost:5432/taskme"
echo ""
echo "💡 You can now start the backend application!"
