#!/bin/bash

echo "🌐 Generate Nginx Configuration for TaskMe"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will generate Nginx configuration for TaskMe${NC}"
echo -e "${YELLOW}⚠️  You need to manually add this configuration to your Nginx${NC}"
echo ""

# Create nginx configuration file
cat > nginx-taskme.conf << 'EOF'
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

    # Rate limiting (zones defined in main nginx.conf)

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
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

    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://taskme_backend/auth/login;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo -e "${GREEN}✅ Nginx configuration generated: nginx-taskme.conf${NC}"
echo ""
echo -e "${BLUE}📋 Manual steps to add this configuration:${NC}"
echo ""
echo -e "${YELLOW}1. Copy the configuration to Nginx sites-available:${NC}"
echo -e "   ${BLUE}sudo cp nginx-taskme.conf /etc/nginx/sites-available/taskme${NC}"
echo ""
echo -e "${YELLOW}2. Enable the site:${NC}"
echo -e "   ${BLUE}sudo ln -s /etc/nginx/sites-available/taskme /etc/nginx/sites-enabled/${NC}"
echo ""
echo -e "${YELLOW}3. Test Nginx configuration:${NC}"
echo -e "   ${BLUE}sudo nginx -t${NC}"
echo ""
echo -e "${YELLOW}4. Reload Nginx:${NC}"
echo -e "   ${BLUE}sudo systemctl reload nginx${NC}"
echo ""
echo -e "${YELLOW}5. Check Nginx status:${NC}"
echo -e "   ${BLUE}sudo systemctl status nginx${NC}"
echo ""
echo -e "${BLUE}📊 Configuration details:${NC}"
echo -e "  - Frontend: https://taskme.motorsights.com → 127.0.0.1:9562"
echo -e "  - Backend: https://api-taskme.motorsights.com/api → 127.0.0.1:9561"
echo -e "  - SSL certificates: /etc/ssl/certs/ dan /etc/ssl/private/"
echo -e "  - Rate limiting: API (10 req/s), Login (5 req/m)"
echo -e "  - Security headers: XSS, CSRF, HSTS, CSP"
echo ""
echo -e "${GREEN}✨ Nginx configuration ready!${NC}"
