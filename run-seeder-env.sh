#!/bin/bash

echo "🌱 TaskMe Database Seeder (Using .env)"
echo "====================================="

echo ""
echo "🔍 Step 1: Check Backend .env File"
echo "==================================="

cd backend

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "📋 Current .env content:"
    cat .env
else
    echo "❌ .env file not found"
    echo "📝 Creating .env file..."
    
    cat > .env << 'EOF'
# Database Configuration
DB_HOST_DEV=localhost
DB_PORT_DEV=9541
DB_USER_DEV=msiserver
DB_PASS_DEV=Rubysa179596!
DB_NAME_DEV=taskme

# Application Configuration
NODE_ENV=development
PORT=9561
JWT_SECRET=OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw
CORS_ORIGIN=http://localhost:9562

# Database URL (constructed from above)
DATABASE_URL=postgresql://msiserver:Rubysa179596!@localhost:9541/taskme
EOF
    
    echo "✅ .env file created"
fi

echo ""
echo "🔍 Step 2: Test Database Connection"
echo "==================================="

# Load .env and test connection
source .env

echo "📊 Testing database connection..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT version();" || {
    echo "❌ Database connection failed"
    echo "Please check your database configuration in .env file"
    exit 1
}

echo "✅ Database connection successful"

echo ""
echo "🔍 Step 3: Check if Tables Exist"
echo "================================"

echo "📊 Checking existing tables..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "\dt"

echo ""
echo "🔧 Step 4: Run Database Seeder"
echo "============================="

echo "🌱 Running database seeder..."
echo "📊 Using configuration from .env file"

# Run seeder
node seed.js

if [ $? -eq 0 ]; then
    echo "✅ Database seeding completed successfully"
else
    echo "❌ Database seeding failed"
    exit 1
fi

echo ""
echo "🔍 Step 5: Verify Seeded Data"
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

cd ..

echo ""
echo "✨ Database seeding completed!"
echo ""
echo "🔗 You can now test the application with dummy data"
echo ""
echo "🔍 To check specific data:"
echo "  psql -h localhost -p 9541 -U msiserver -d taskme"
echo "  SELECT * FROM users LIMIT 5;"
echo "  SELECT * FROM teams LIMIT 5;"
echo "  SELECT * FROM projects LIMIT 5;"
echo ""
echo "📝 Your .env file is located at: backend/.env"
