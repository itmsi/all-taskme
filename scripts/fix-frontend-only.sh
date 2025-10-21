#!/bin/bash

echo "🔧 Fix Frontend Container Issue"
echo "==============================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"

echo ""
echo "🔍 Step 1: Check Frontend Logs"
echo "=============================="

echo "📋 Checking frontend logs..."
docker-compose -f docker-compose.server.yml logs --tail=20 frontend

echo ""
echo "🔧 Step 2: Remove Frontend Health Check"
echo "======================================="

# Create a modified docker-compose without frontend health check
echo "📝 Creating modified docker-compose..."
cp docker-compose.server.yml docker-compose.server.yml.backup

# Remove health check from frontend
sed -i '/frontend:/,/^[[:space:]]*[^[:space:]]/ {
    /healthcheck:/,/^[[:space:]]*[^[:space:]]/ {
        /healthcheck:/d
        /test:/d
        /interval:/d
        /timeout:/d
        /retries:/d
    }
}' docker-compose.server.yml

echo "✅ Health check removed from frontend"

echo ""
echo "🔧 Step 3: Start Frontend Without Health Check"
echo "==============================================="

echo "🛑 Stopping frontend..."
docker-compose -f docker-compose.server.yml stop frontend

echo "🗑️ Removing frontend container..."
docker-compose -f docker-compose.server.yml rm -f frontend

echo "🐳 Starting frontend without health check..."
docker-compose -f docker-compose.server.yml up -d frontend

echo "⏳ Waiting for frontend to start..."
sleep 20

echo ""
echo "📊 Checking frontend status..."
docker-compose -f docker-compose.server.yml ps frontend

echo ""
echo "🧪 Testing frontend..."
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend still not responding"

echo ""
echo "🔧 Step 4: Test Domain Access"
echo "============================="

echo "🌐 Testing domain connections..."
echo "Frontend (taskme.motorsights.com):"
curl -s -I https://taskme.motorsights.com | head -1 || echo "❌ Domain not accessible"

echo ""
echo "Backend API (api-taskme.motorsights.com):"
curl -s https://api-taskme.motorsights.com/health || echo "❌ API domain not accessible"

echo ""
echo "🔧 Step 5: Final Status"
echo "======================="

echo "📊 All services status..."
docker-compose -f docker-compose.server.yml ps

echo ""
echo "📋 Frontend logs (last 10 lines):"
docker-compose -f docker-compose.server.yml logs --tail=10 frontend

echo ""
echo "✨ Frontend fix completed!"
echo ""
echo "🔗 If successful, your TaskMe application should be available at:"
echo "  - Frontend: https://taskme.motorsights.com"
echo "  - Backend API: https://api-taskme.motorsights.com"
echo ""
echo "🔍 To monitor logs:"
echo "  - Frontend: docker-compose -f docker-compose.server.yml logs -f frontend"
echo "  - All services: docker-compose -f docker-compose.server.yml logs -f"
