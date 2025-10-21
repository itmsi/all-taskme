#!/bin/bash

echo "🔧 Manual Fix - Step by Step"
echo "============================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"

echo ""
echo "🔧 Step 1: Fix Network Issue"
echo "============================"

echo "🛑 Stopping all services..."
docker-compose -f docker-compose.server.yml down

echo "🗑️ Removing network..."
docker network rm all-taskme_taskme_network 2>/dev/null || true

echo "🧹 Cleaning up..."
docker system prune -f

echo ""
echo "🔧 Step 2: Start Database Only"
echo "=============================="

echo "🐳 Starting PostgreSQL..."
docker-compose -f docker-compose.server.yml up -d postgres

echo "⏳ Waiting for database to start..."
sleep 10

echo "📊 Checking database status..."
docker-compose -f docker-compose.server.yml ps postgres

echo ""
echo "🔧 Step 3: Start Backend Only"
echo "=============================="

echo "🐳 Starting backend..."
docker-compose -f docker-compose.server.yml up -d backend

echo "⏳ Waiting for backend to start..."
sleep 15

echo "📊 Checking backend status..."
docker-compose -f docker-compose.server.yml ps backend

echo "🧪 Testing backend..."
curl -s http://localhost:9561/health || echo "❌ Backend not responding"

echo ""
echo "🔧 Step 4: Start Frontend Only"
echo "============================="

echo "🐳 Starting frontend..."
docker-compose -f docker-compose.server.yml up -d frontend

echo "⏳ Waiting for frontend to start..."
sleep 15

echo "📊 Checking frontend status..."
docker-compose -f docker-compose.server.yml ps frontend

echo "🧪 Testing frontend..."
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend not responding"

echo ""
echo "🔧 Step 5: Final Test"
echo "===================="

echo "📊 All services status..."
docker-compose -f docker-compose.server.yml ps

echo ""
echo "🌐 Testing domain access..."
echo "Frontend (taskme.motorsights.com):"
curl -s -I https://taskme.motorsights.com | head -1 || echo "❌ Domain not accessible"

echo ""
echo "Backend API (api-taskme.motorsights.com):"
curl -s https://api-taskme.motorsights.com/health || echo "❌ API domain not accessible"

echo ""
echo "✨ Manual fix completed!"
echo ""
echo "🔍 To monitor logs:"
echo "  - Database: docker-compose -f docker-compose.server.yml logs -f postgres"
echo "  - Backend: docker-compose -f docker-compose.server.yml logs -f backend"
echo "  - Frontend: docker-compose -f docker-compose.server.yml logs -f frontend"
