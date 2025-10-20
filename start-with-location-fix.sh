#!/bin/bash

echo "🚀 TaskMe Startup Script with Location Fix"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    echo ""
    echo "To start Docker:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to fully start"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Docker is running"

# Start the database
echo "🗄️ Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
echo "🔍 Checking database connection..."
if docker-compose exec -T postgres pg_isready -U taskme_user -d taskme; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready yet. Please wait and try again."
    exit 1
fi

# Run migration to add location columns
echo "🔧 Adding location columns to tasks table..."
docker-compose exec -T postgres psql -U taskme_user -d taskme -c "
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_address TEXT;
"

if [ $? -eq 0 ]; then
    echo "✅ Location columns added successfully!"
else
    echo "⚠️ Warning: Could not add location columns. The app will still work with fallback handling."
fi

# Start the backend
echo "🚀 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start the frontend
echo "🎨 Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 TaskMe is starting up!"
echo ""
echo "📱 Frontend: http://localhost:9562"
echo "🔧 Backend: http://localhost:9561"
echo "📚 API Docs: http://localhost:9561/api-docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; echo '✅ All services stopped'; exit 0" INT

# Keep script running
wait
