#!/bin/bash

echo "🚀 Starting TaskMe System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    cp frontend/env.example frontend/.env
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Start with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo "✅ TaskMe System is starting up!"
echo ""
echo "📊 Services:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo "  - API Documentation: http://localhost:5000/api-docs"
echo "  - Database: localhost:5432"
echo ""
echo "⏳ Please wait a few moments for all services to start..."
echo "🔍 Check logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"
