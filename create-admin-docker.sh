#!/bin/bash

# TaskMe Create Admin Script
# This script creates a super admin user inside the Docker container

echo "🔐 TaskMe Create Super Admin"
echo "============================"

# Check if Docker containers are running
if ! docker-compose ps | grep -q "taskme_backend.*Up"; then
    echo "❌ Backend container is not running. Please start the application first:"
    echo "   docker-compose up -d"
    exit 1
fi

if ! docker-compose ps | grep -q "taskme_postgres.*Up"; then
    echo "❌ PostgreSQL container is not running. Please start the application first:"
    echo "   docker-compose up -d"
    exit 1
fi

echo "📦 Creating super admin user inside Docker container..."
echo ""

# Copy and run the admin creation script inside the backend container
docker cp create-admin.js taskme_backend:/app/create-admin.js
docker-compose exec backend node create-admin.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Super Admin created successfully!"
    echo ""
    echo "🔑 Admin Login Credentials:"
    echo "   📧 Email: admin@taskme.com"
    echo "   🔐 Password: admin123"
    echo ""
    echo "🌐 Access URLs:"
    echo "   🖥️  Frontend: http://localhost:9562"
    echo "   📚 API Docs: http://localhost:9561/api-docs"
    echo ""
    echo "⚠️  Security Note:"
    echo "   Please change the default password after first login!"
else
    echo ""
    echo "❌ Admin creation failed!"
    echo "Please check the error messages above."
    exit 1
fi
