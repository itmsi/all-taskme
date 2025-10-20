#!/bin/bash

echo "🚀 Manual Setup Without Docker"
echo "=============================="

# Set environment variables
export DB_PASSWORD="yowa0HyIlJOLbhfyrLcPCiWA1"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"
export NODE_ENV="production"
export DATABASE_URL="postgresql://taskme_user:${DB_PASSWORD}@localhost:5432/taskme"
export PORT="5000"
export CORS_ORIGIN="https://taskme.motorsights.com"

echo "✅ Environment variables set"

echo ""
echo "🔧 Step 1: Check Prerequisites"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is installed: $(node --version)"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not installed"
    exit 1
else
    echo "✅ npm is installed: $(npm --version)"
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not installed. Installing..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "✅ PostgreSQL is installed"
fi

echo ""
echo "🔧 Step 2: Setup Database"
echo "========================="

# Create database and user
echo "📊 Setting up database..."
sudo -u postgres psql -c "CREATE USER taskme_user WITH PASSWORD '${DB_PASSWORD}';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE taskme OWNER taskme_user;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE taskme TO taskme_user;" 2>/dev/null || echo "Privileges already granted"

# Run database initialization
echo "📊 Initializing database..."
sudo -u postgres psql -d taskme -f backend/database/init.sql

echo ""
echo "🔧 Step 3: Setup Backend"
echo "========================"

echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "🚀 Starting backend..."
# Kill existing backend process
pkill -f "node.*server.js" 2>/dev/null || true

# Start backend in background
nohup node src/server.js > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 10

echo "🧪 Testing backend..."
curl -s http://localhost:5000/health || echo "❌ Backend not responding"

echo ""
echo "🔧 Step 4: Setup Frontend"
echo "========================="

cd ../frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️ Building frontend..."
npm run build

echo "📦 Installing serve for production..."
npm install -g serve

echo "🚀 Starting frontend..."
# Kill existing frontend process
pkill -f "serve.*dist" 2>/dev/null || true

# Start frontend in background
nohup serve -s dist -l 3000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
sleep 10

echo "🧪 Testing frontend..."
curl -s -I http://localhost:3000 | head -1 || echo "❌ Frontend not responding"

echo ""
echo "🔧 Step 5: Setup Nginx Reverse Proxy"
echo "===================================="

# Update nginx configuration for manual setup
sudo tee /etc/nginx/sites-available/taskme-manual > /dev/null << 'EOF'
# Upstream servers
upstream taskme_frontend {
    server 127.0.0.1:3000;
}

upstream taskme_backend {
    server 127.0.0.1:5000;
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
sudo ln -sf /etc/nginx/sites-available/taskme-manual /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx configuration updated"
else
    echo "❌ Nginx configuration error"
fi

echo ""
echo "🔧 Step 6: Final Test"
echo "======================"

echo "📊 Checking processes..."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "🧪 Testing local connections..."
echo "Backend (localhost:5000):"
curl -s http://localhost:5000/health || echo "❌ Backend not responding"

echo ""
echo "Frontend (localhost:3000):"
curl -s -I http://localhost:3000 | head -1 || echo "❌ Frontend not responding"

echo ""
echo "🌐 Testing domain connections..."
echo "Frontend (taskme.motorsights.com):"
curl -s -I https://taskme.motorsights.com | head -1 || echo "❌ Domain not accessible"

echo ""
echo "Backend API (api-taskme.motorsights.com):"
curl -s https://api-taskme.motorsights.com/health || echo "❌ API domain not accessible"

echo ""
echo "✨ Manual setup completed!"
echo ""
echo "🔗 Your TaskMe application is now available at:"
echo "  - Frontend: https://taskme.motorsights.com"
echo "  - Backend API: https://api-taskme.motorsights.com"
echo ""
echo "🔍 To monitor logs:"
echo "  - Backend: tail -f backend.log"
echo "  - Frontend: tail -f frontend.log"
echo "  - Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔧 To restart services:"
echo "  - Backend: pkill -f 'node.*server.js' && cd backend && nohup node src/server.js > ../backend.log 2>&1 &"
echo "  - Frontend: pkill -f 'serve.*dist' && cd frontend && nohup serve -s dist -l 3000 > ../frontend.log 2>&1 &"
