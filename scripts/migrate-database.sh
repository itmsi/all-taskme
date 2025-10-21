#!/bin/bash

echo "🗄️ Database Migration Script"
echo "============================"

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"
export DATABASE_URL="postgresql://taskme_user:${DB_PASSWORD}@localhost:5432/taskme"

echo "✅ Environment variables set"

echo ""
echo "🔍 Step 1: Check Database Connection"
echo "===================================="

# Test database connection
echo "📊 Testing database connection..."
psql -h localhost -U taskme_user -d taskme -c "SELECT version();" || {
    echo "❌ Database connection failed"
    echo "Please make sure PostgreSQL is running and credentials are correct"
    exit 1
}

echo "✅ Database connection successful"

echo ""
echo "🔧 Step 2: Run Initial Migration"
echo "================================="

echo "📊 Running initial database schema..."
psql -h localhost -U taskme_user -d taskme -f backend/database/init.sql

if [ $? -eq 0 ]; then
    echo "✅ Initial migration completed"
else
    echo "❌ Initial migration failed"
    exit 1
fi

echo ""
echo "🔧 Step 3: Run Task Extensions Migration"
echo "========================================"

echo "📊 Adding task extensions table..."
psql -h localhost -U taskme_user -d taskme -f backend/database/add_task_extensions.sql

if [ $? -eq 0 ]; then
    echo "✅ Task extensions migration completed"
else
    echo "❌ Task extensions migration failed"
    exit 1
fi

echo ""
echo "🔧 Step 4: Check for Additional Migrations"
echo "=========================================="

# Check if there are other migration files
echo "📋 Checking for additional migration files..."
ls -la backend/database/*.sql

echo ""
echo "🔧 Step 5: Seed Database (Optional)"
echo "=================================="

read -p "Do you want to seed the database with dummy data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database with dummy data..."
    cd backend
    node seed.js
    cd ..
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeding completed"
    else
        echo "❌ Database seeding failed"
    fi
else
    echo "⏭️ Skipping database seeding"
fi

echo ""
echo "🔧 Step 6: Verify Migration"
echo "=========================="

echo "📊 Checking database tables..."
psql -h localhost -U taskme_user -d taskme -c "\dt"

echo ""
echo "📊 Checking task_extensions table structure..."
psql -h localhost -U taskme_user -d taskme -c "\d task_extensions"

echo ""
echo "📊 Checking default task statuses..."
psql -h localhost -U taskme_user -d taskme -c "SELECT * FROM task_statuses;"

echo ""
echo "✨ Database migration completed!"
echo ""
echo "🔗 Database is now ready for TaskMe application"
echo ""
echo "📋 Migration Summary:"
echo "  - ✅ Initial schema (init.sql)"
echo "  - ✅ Task extensions (add_task_extensions.sql)"
echo "  - ✅ Default data (if seeded)"
echo ""
echo "🔍 To check database status:"
echo "  - psql -h localhost -U taskme_user -d taskme"
echo "  - \\dt (list tables)"
echo "  - \\d table_name (describe table)"
