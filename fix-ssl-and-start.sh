#!/bin/bash

echo "🔧 Fixing SSL Connection and Starting Services"
echo "=============================================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set:"
echo "  - DB_PASSWORD: $DB_PASSWORD"
echo "  - JWT_SECRET: $JWT_SECRET"

echo ""
echo "🐳 Starting all services..."
docker-compose -f docker-compose.server.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Checking container status..."
docker-compose -f docker-compose.server.yml ps

echo ""
echo "🔍 Checking backend logs..."
docker-compose -f docker-compose.server.yml logs --tail=10 backend

echo ""
echo "🧪 Testing API connection..."
curl -s http://localhost:9561/health || echo "❌ API not responding"

echo ""
echo "🧪 Testing frontend..."
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend not responding"

echo ""
echo "✨ SSL fix and startup completed!"
echo ""
echo "🔍 To monitor logs:"
echo "  - Backend: docker-compose -f docker-compose.server.yml logs -f backend"
echo "  - Frontend: docker-compose -f docker-compose.server.yml logs -f frontend"
echo "  - Database: docker-compose -f docker-compose.server.yml logs -f postgres"
