#!/bin/bash

# TaskMe Database Seeder Script
# This script runs the database seeder inside the Docker container

echo "🌱 TaskMe Database Seeder"
echo "=========================="

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

echo "📦 Running database seeder inside Docker container..."
echo ""

# Run the seeder inside the backend container
docker-compose exec backend npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database seeding completed successfully!"
    echo ""
    echo "📊 You can now:"
    echo "   • Access the frontend: http://localhost:9562"
    echo "   • View API docs: http://localhost:9561/api-docs"
    echo "   • Login with any user (password: password123)"
    echo ""
    echo "👥 Sample users created:"
    echo "   • john_doe@example.com"
    echo "   • jane_smith@example.com"
    echo "   • mike_johnson@example.com"
    echo "   • sarah_wilson@example.com"
    echo "   • david_brown@example.com"
    echo "   (and 5 more users)"
    echo ""
    echo "🔑 All users have the same password: password123"
else
    echo ""
    echo "❌ Database seeding failed!"
    echo "Please check the error messages above."
    exit 1
fi
