#!/bin/bash

echo "🔧 Quick Fix for Frontend Container"
echo "==================================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"

echo ""
echo "🔍 Step 1: Check What's Using Port 9562"
echo "======================================="

echo "📋 Checking port 9562..."
netstat -tlnp | grep :9562 || echo "Port 9562 is free"

echo ""
echo "🔍 Step 2: Check Frontend Container Details"
echo "=========================================="

echo "📋 Checking frontend container..."
docker ps -a --filter "name=frontend"

echo ""
echo "📋 Checking frontend logs..."
docker-compose -f docker-compose.server.yml logs --tail=10 frontend

echo ""
echo "🔧 Step 3: Force Remove Frontend Container"
echo "========================================="

echo "🛑 Force stopping frontend..."
docker stop $(docker ps -q --filter "name=frontend") 2>/dev/null || true

echo "🗑️ Force removing frontend container..."
docker rm -f $(docker ps -aq --filter "name=frontend") 2>/dev/null || true

echo "🧹 Cleaning up..."
docker container prune -f

echo ""
echo "🔧 Step 4: Start Frontend with Different Approach"
echo "================================================"

echo "🐳 Starting frontend directly with docker run..."
docker run -d \
  --name taskme_frontend_temp \
  --network all-taskme_taskme_network \
  -p 9562:80 \
  -e VITE_API_URL=https://api-taskme.motorsights.com/api \
  all-taskme_frontend

echo "⏳ Waiting for frontend to start..."
sleep 15

echo ""
echo "📊 Checking frontend status..."
docker ps --filter "name=frontend"

echo ""
echo "🧪 Testing frontend..."
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend still not responding"

echo ""
echo "🔧 Step 5: Test Domain Access"
echo "============================="

echo "🌐 Testing domain connections..."
echo "Frontend (taskme.motorsights.com):"
curl -s -I https://taskme.motorsights.com | head -1 || echo "❌ Domain not accessible"

echo ""
echo "Backend API (api-taskme.motorsights.com):"
curl -s https://api-taskme.motorsights.com/health || echo "❌ API domain not accessible"

echo ""
echo "🔧 Step 6: Final Status"
echo "======================"

echo "📊 All services status..."
docker-compose -f docker-compose.server.yml ps

echo ""
echo "📋 Frontend container logs (last 10 lines):"
docker logs --tail=10 taskme_frontend_temp 2>/dev/null || echo "No logs available"

echo ""
echo "✨ Quick fix completed!"
echo ""
echo "🔗 If successful, your TaskMe application should be available at:"
echo "  - Frontend: https://taskme.motorsights.com"
echo "  - Backend API: https://api-taskme.motorsights.com"
echo ""
echo "🔍 To monitor logs:"
echo "  - Frontend: docker logs -f taskme_frontend_temp"
echo "  - Backend: docker-compose -f docker-compose.server.yml logs -f backend"
