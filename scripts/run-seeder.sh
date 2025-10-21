#!/bin/bash

echo "🌱 TaskMe Database Seeder"
echo "========================="

# Set environment variables
export DB_HOST_DEV="localhost"
export DB_PORT_DEV="9541"
export DB_USER_DEV="msiserver"
export DB_PASS_DEV="Rubysa179596!"
export DB_NAME_DEV="taskme"

export NODE_ENV="development"
export DATABASE_URL="postgresql://${DB_USER_DEV}:${DB_PASS_DEV}@${DB_HOST_DEV}:${DB_PORT_DEV}/${DB_NAME_DEV}"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"
echo "📊 Database: ${DB_HOST_DEV}:${DB_PORT_DEV}/${DB_NAME_DEV}"

echo ""
echo "🔍 Step 1: Check Database Connection"
echo "===================================="

# Test database connection
echo "📊 Testing database connection..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT version();" || {
    echo "❌ Database connection failed"
    echo "Please make sure PostgreSQL is running and credentials are correct"
    exit 1
}

echo "✅ Database connection successful"

echo ""
echo "🔍 Step 2: Check if Tables Exist"
echo "================================"

echo "📊 Checking existing tables..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "\dt"

echo ""
echo "🔧 Step 3: Run Database Seeder"
echo "============================="

echo "🌱 Running database seeder..."
cd backend

# Check if seeders.js exists
if [ -f "src/database/seeders.js" ]; then
    echo "📊 Found seeders.js, running seeder..."
    node seed.js
else
    echo "❌ seeders.js not found"
    echo "📋 Available files in src/database/:"
    ls -la src/database/
    exit 1
fi

cd ..

if [ $? -eq 0 ]; then
    echo "✅ Database seeding completed successfully"
else
    echo "❌ Database seeding failed"
    exit 1
fi

echo ""
echo "🔍 Step 4: Verify Seeded Data"
echo "=============================="

echo "📊 Checking users table..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT COUNT(*) as user_count FROM users;"

echo ""
echo "📊 Checking teams table..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT COUNT(*) as team_count FROM teams;"

echo ""
echo "📊 Checking projects table..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT COUNT(*) as project_count FROM projects;"

echo ""
echo "📊 Checking tasks table..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT COUNT(*) as task_count FROM tasks;"

echo ""
echo "📊 Checking task_statuses table..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT name, color FROM task_statuses ORDER BY position;"

echo ""
echo "✨ Database seeding completed!"
echo ""
echo "🔗 You can now test the application with dummy data"
echo ""
echo "🔍 To check specific data:"
echo "  psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV}"
echo "  SELECT * FROM users LIMIT 5;"
echo "  SELECT * FROM teams LIMIT 5;"
echo "  SELECT * FROM projects LIMIT 5;"
