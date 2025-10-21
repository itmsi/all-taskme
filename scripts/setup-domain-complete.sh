#!/bin/bash

echo "🚀 Complete Domain Setup for taskme.motorsights.com"
echo "=================================================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"

echo "✅ Environment variables set"

echo ""
echo "🔧 Step 1: Fix Frontend Container"
echo "=================================="

# Check frontend logs first
echo "📋 Checking frontend logs..."
docker-compose -f docker-compose.server.yml logs --tail=10 frontend

echo ""
echo "🏗️ Rebuilding frontend..."
docker-compose -f docker-compose.server.yml build --no-cache frontend

echo ""
echo "🔄 Restarting frontend..."
docker-compose -f docker-compose.server.yml up -d frontend

echo ""
echo "⏳ Waiting for frontend to start..."
sleep 10

echo ""
echo "📊 Checking frontend status..."
docker-compose -f docker-compose.server.yml ps frontend

echo ""
echo "🧪 Testing frontend..."
curl -s -I http://localhost:9562 | head -1 || echo "❌ Frontend still not responding"

echo ""
echo "🔧 Step 2: Setup Nginx Reverse Proxy"
echo "===================================="

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "🚀 Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

echo ""
echo "📝 Setting up Nginx configuration..."

# Create nginx config
sudo tee /etc/nginx/sites-available/taskme > /dev/null << 'EOF'
# Upstream servers
upstream taskme_frontend {
    server 127.0.0.1:9562;
}

upstream taskme_backend {
    server 127.0.0.1:9561;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name taskme.motorsights.com api-taskme.motorsights.com;
    return 301 https://$server_name$request_uri;
}

# Frontend (taskme.motorsights.com)
server {
    listen 443 ssl http2;
    server_name taskme.motorsights.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/taskme.motorsights.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/taskme.motorsights.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://taskme_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            proxy_pass http://taskme_frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Backend API (api-taskme.motorsights.com)
server {
    listen 443 ssl http2;
    server_name api-taskme.motorsights.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api-taskme.motorsights.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-taskme.motorsights.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes
    location /api/ {
        proxy_pass http://taskme_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://taskme.motorsights.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://taskme.motorsights.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # API Documentation
    location /api-docs {
        proxy_pass http://taskme_backend/api-docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://taskme_backend/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/taskme /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "🔄 Nginx reloaded"
else
    echo "❌ Nginx configuration error"
    exit 1
fi

echo ""
echo "🔧 Step 3: Setup SSL Certificate"
echo "================================"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

echo ""
echo "🔐 Generating SSL certificates..."

# Generate SSL certificates
sudo certbot --nginx -d taskme.motorsights.com -d api-taskme.motorsights.com --non-interactive --agree-tos --email admin@motorsights.com

if [ $? -eq 0 ]; then
    echo "✅ SSL certificates generated successfully"
else
    echo "⚠️ SSL certificate generation failed, but continuing..."
    echo "You may need to run: sudo certbot --nginx -d taskme.motorsights.com -d api-taskme.motorsights.com"
fi

echo ""
echo "🔧 Step 4: Final Verification"
echo "=============================="

echo ""
echo "📊 Checking all services..."
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
echo "✨ Domain setup completed!"
echo ""
echo "🔗 Your TaskMe application is now available at:"
echo "  - Frontend: https://taskme.motorsights.com"
echo "  - Backend API: https://api-taskme.motorsights.com"
echo "  - API Documentation: https://api-taskme.motorsights.com/api-docs"
echo ""
echo "🔍 To monitor logs:"
echo "  - All services: docker-compose -f docker-compose.server.yml logs -f"
echo "  - Nginx: sudo tail -f /var/log/nginx/access.log"
echo "  - Nginx error: sudo tail -f /var/log/nginx/error.log"
