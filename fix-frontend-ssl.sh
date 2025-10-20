#!/bin/bash

echo "🔧 Fix Frontend and SSL Issues"
echo "=============================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"

echo ""
echo "🔧 Step 1: Fix Frontend Container Issue"
echo "========================================"

# Check what's wrong with frontend
echo "📋 Checking frontend container details..."
docker ps -a --filter "name=frontend"

echo ""
echo "📋 Checking frontend logs..."
docker-compose -f docker-compose.server.yml logs --tail=20 frontend

echo ""
echo "🗑️ Removing problematic frontend container..."
docker-compose -f docker-compose.server.yml stop frontend
docker-compose -f docker-compose.server.yml rm -f frontend

echo ""
echo "🏗️ Rebuilding frontend from scratch..."
docker-compose -f docker-compose.server.yml build --no-cache frontend

echo ""
echo "🔄 Starting frontend..."
docker-compose -f docker-compose.server.yml up -d frontend

echo ""
echo "⏳ Waiting for frontend to stabilize..."
sleep 15

echo ""
echo "📊 Checking frontend status..."
docker-compose -f docker-compose.server.yml ps frontend

echo ""
echo "🧪 Testing frontend..."
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend still not responding"

echo ""
echo "🔧 Step 2: Fix SSL Certificate Issue"
echo "===================================="

echo "📋 Checking existing certificates..."
sudo certbot certificates

echo ""
echo "🔐 Fixing SSL certificate with expand flag..."
sudo certbot --nginx -d taskme.motorsights.com -d api-taskme.motorsights.com --expand --non-interactive --agree-tos

if [ $? -eq 0 ]; then
    echo "✅ SSL certificates fixed successfully"
else
    echo "⚠️ SSL certificate fix failed, trying alternative approach..."
    
    # Try to renew existing certificate
    sudo certbot renew --nginx --non-interactive
    
    # If that doesn't work, try to get certificate for taskme.motorsights.com only
    sudo certbot --nginx -d taskme.motorsights.com --non-interactive --agree-tos
fi

echo ""
echo "🔧 Step 3: Test Everything"
echo "=========================="

echo ""
echo "📊 Final service status..."
docker-compose -f docker-compose.server.yml ps

echo ""
echo "🧪 Testing local connections..."
echo "Frontend (localhost:9562):"
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend not responding"

echo ""
echo "Backend API (localhost:9561):"
curl -s http://localhost:9561/health || echo "❌ Backend not responding"

echo ""
echo "🌐 Testing domain connections..."
echo "Frontend (taskme.motorsights.com):"
curl -s -I https://taskme.motorsights.com | head -1 || echo "❌ Domain not accessible"

echo ""
echo "Backend API (api-taskme.motorsights.com):"
curl -s https://api-taskme.motorsights.com/health || echo "❌ API domain not accessible"

echo ""
echo "🔍 Step 4: Debugging Information"
echo "==============================="

echo ""
echo "📋 Frontend container logs (last 10 lines):"
docker-compose -f docker-compose.server.yml logs --tail=10 frontend

echo ""
echo "📋 Nginx error logs (last 5 lines):"
sudo tail -5 /var/log/nginx/error.log

echo ""
echo "📋 Nginx access logs (last 5 lines):"
sudo tail -5 /var/log/nginx/access.log

echo ""
echo "✨ Fix completed!"
echo ""
echo "🔗 If everything works, your TaskMe application should be available at:"
echo "  - Frontend: https://taskme.motorsights.com"
echo "  - Backend API: https://api-taskme.motorsights.com"
echo ""
echo "🔍 To monitor logs:"
echo "  - Frontend: docker-compose -f docker-compose.server.yml logs -f frontend"
echo "  - All services: docker-compose -f docker-compose.server.yml logs -f"
echo "  - Nginx: sudo tail -f /var/log/nginx/error.log"
