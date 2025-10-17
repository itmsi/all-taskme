#!/bin/bash

echo "🚀 Deploying TaskMe to Production..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ .env.prod file not found!"
    echo "Please create .env.prod with the following variables:"
    echo "  DB_PASSWORD=your-secure-database-password"
    echo "  JWT_SECRET=your-super-secure-jwt-secret"
    echo "  API_URL=https://your-domain.com/api"
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$API_URL" ]; then
    echo "❌ Missing required environment variables!"
    echo "Please set DB_PASSWORD, JWT_SECRET, and API_URL in .env.prod"
    exit 1
fi

# Build and start production containers
echo "🐳 Building and starting production containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo ""
echo "🎉 TaskMe deployed successfully!"
echo ""
echo "📊 Services:"
echo "  - Frontend: http://localhost (or your domain)"
echo "  - Backend API: http://localhost:5000"
echo "  - API Documentation: http://localhost:5000/api-docs"
echo ""
echo "🔍 Check logs with: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop services with: docker-compose -f docker-compose.prod.yml down"
