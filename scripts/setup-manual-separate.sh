#!/bin/bash

echo "🚀 Manual Setup - Separate Services"
echo "==================================="

# Database configuration
export DB_HOST_DEV="localhost"
export DB_PORT_DEV="9541"
export DB_USER_DEV="msiserver"
export DB_PASS_DEV="Rubysa179596!"
export DB_NAME_DEV="taskme"

# Backend configuration
export NODE_ENV="development"
export PORT="9561"
export DATABASE_URL="postgresql://${DB_USER_DEV}:${DB_PASS_DEV}@${DB_HOST_DEV}:${DB_PORT_DEV}/${DB_NAME_DEV}"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"
export CORS_ORIGIN="http://localhost:9562"

# Frontend configuration
export VITE_API_URL="http://localhost:9561/api"

echo "✅ Environment variables set"
echo "📊 Database: ${DB_HOST_DEV}:${DB_PORT_DEV}/${DB_NAME_DEV}"
echo "🔧 Backend: http://localhost:${PORT}"
echo "🌐 Frontend: http://localhost:9562"

echo ""
echo "🔍 Step 1: Check Prerequisites"
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

echo ""
echo "🔧 Step 2: Setup Backend"
echo "========================"

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🧪 Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.query('SELECT version()')
  .then(res => {
    console.log('✅ Database connection successful');
    console.log('📊 PostgreSQL version:', res.rows[0].version);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -eq 0 ]; then
    echo "✅ Backend setup completed"
else
    echo "❌ Backend setup failed"
    exit 1
fi

cd ..

echo ""
echo "🔧 Step 3: Setup Frontend"
echo "========================"

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "✅ Frontend setup completed"
cd ..

echo ""
echo "🔧 Step 4: Create Start Scripts"
echo "==============================="

# Create backend start script
cat > start-backend.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting TaskMe Backend..."
echo "============================="

# Set environment variables
export NODE_ENV="development"
export PORT="9561"
export DATABASE_URL="postgresql://msiserver:Rubysa179596!@localhost:9541/taskme"
export JWT_SECRET="OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw"
export CORS_ORIGIN="http://localhost:9562"

cd backend
echo "📊 Database: $DATABASE_URL"
echo "🔧 Port: $PORT"
echo "🌐 CORS Origin: $CORS_ORIGIN"
echo ""
echo "Starting backend server..."
npm run dev
EOF

# Create frontend start script
cat > start-frontend.sh << 'EOF'
#!/bin/bash

echo "🌐 Starting TaskMe Frontend..."
echo "==============================="

# Set environment variables
export VITE_API_URL="http://localhost:9561/api"

cd frontend
echo "🔗 API URL: $VITE_API_URL"
echo "🌐 Port: 9562"
echo "🏠 Allowed Hosts: localhost, taskme.motorsights.com"
echo ""
echo "Starting frontend server..."
npm run dev
EOF

# Make scripts executable
chmod +x start-backend.sh
chmod +x start-frontend.sh

echo "✅ Start scripts created"

echo ""
echo "🔧 Step 5: Create Nginx Configuration"
echo "===================================="

# Create nginx configuration for development
sudo tee /etc/nginx/sites-available/taskme-dev > /dev/null << 'EOF'
# Development configuration for TaskMe

# Backend API (api-taskme.motorsights.com)
server {
    listen 80;
    server_name api-taskme.motorsights.com;

    location / {
        proxy_pass http://127.0.0.1:9561;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "http://localhost:9562" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "http://localhost:9562";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }
}

# Frontend (taskme.motorsights.com)
server {
    listen 80;
    server_name taskme.motorsights.com;

    location / {
        proxy_pass http://127.0.0.1:9562;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/taskme-dev /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx configuration updated"
else
    echo "❌ Nginx configuration error"
fi

echo ""
echo "🔧 Step 6: Final Instructions"
echo "============================="

echo "✨ Manual setup completed!"
echo ""
echo "🚀 To start the services:"
echo ""
echo "📱 Terminal 1 - Backend:"
echo "  ./start-backend.sh"
echo ""
echo "📱 Terminal 2 - Frontend:"
echo "  ./start-frontend.sh"
echo ""
echo "🔗 Access URLs:"
echo "  - Backend API: http://localhost:9561"
echo "  - Frontend: http://localhost:9562"
echo "  - API Docs: http://localhost:9561/api-docs"
echo ""
echo "🌐 Domain Access (if DNS configured):"
echo "  - Frontend: http://taskme.motorsights.com"
echo "  - Backend API: http://api-taskme.motorsights.com"
echo ""
echo "🔍 To monitor logs:"
echo "  - Backend: Check terminal output"
echo "  - Frontend: Check terminal output"
echo "  - Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🛑 To stop services:"
echo "  - Press Ctrl+C in each terminal"
echo ""
echo "📊 Database connection:"
echo "  - Host: ${DB_HOST_DEV}"
echo "  - Port: ${DB_PORT_DEV}"
echo "  - Database: ${DB_NAME_DEV}"
echo "  - User: ${DB_USER_DEV}"
