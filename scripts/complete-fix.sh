#!/bin/bash

echo "🔧 Complete Fix for SSL and Container Issues"
echo "============================================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"

echo ""
echo "🛑 Complete cleanup..."
# Force remove all containers and networks
docker-compose -f docker-compose.server.yml down --remove-orphans
docker system prune -f

echo ""
echo "🗑️ Removing corrupted containers..."
# Remove any corrupted containers
docker rm -f $(docker ps -aq --filter "name=taskme") 2>/dev/null || true

echo ""
echo "🏗️ Rebuilding backend with SSL fix..."
# Rebuild backend to apply SSL fix
docker-compose -f docker-compose.server.yml build --no-cache backend

echo ""
echo "🐳 Starting services..."
# Start services
docker-compose -f docker-compose.server.yml up -d

echo ""
echo "⏳ Waiting for services to stabilize..."
sleep 15

echo ""
echo "📊 Checking container status..."
docker-compose -f docker-compose.server.yml ps

echo ""
echo "🔍 Checking backend logs..."
docker-compose -f docker-compose.server.yml logs --tail=15 backend

echo ""
echo "🧪 Testing connections..."
echo "API Health Check:"
curl -s http://localhost:9561/health || echo "❌ API not responding"

echo ""
echo "Frontend Check:"
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend not responding"

echo ""
echo "✨ Complete fix completed!"
echo ""
echo "🔍 To monitor logs:"
echo "  - Backend: docker-compose -f docker-compose.server.yml logs -f backend"
echo "  - All services: docker-compose -f docker-compose.server.yml logs -f"
