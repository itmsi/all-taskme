#!/bin/bash

echo "🚀 Starting TaskMe Development Mode..."

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    cp frontend/env.example frontend/.env
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if PostgreSQL is running (for development)
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running on localhost:5432"
    echo "💡 Please start PostgreSQL or use Docker with: ./setup-db.sh"
    echo ""
    echo "🐳 Starting with Docker Compose instead..."
    docker-compose up -d postgres
    sleep 10
fi

echo "🎯 Starting development servers..."
echo ""
echo "📊 Services will be available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo "  - API Documentation: http://localhost:5000/api-docs"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Start both backend and frontend in development mode
npm run dev
