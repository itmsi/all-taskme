#!/bin/bash

echo "🔧 Memperbaiki konfigurasi Socket.io..."

# Stop containers
echo "⏹️ Menghentikan containers..."
docker-compose down

# Rebuild frontend dengan environment variables yang benar
echo "🔨 Rebuilding frontend..."
cd frontend
rm -rf dist node_modules
npm install

# Set environment variable untuk production
export VITE_API_URL=https://api-taskme.motorsights.com/api
npm run build
cd ..

# Restart containers
echo "🚀 Menjalankan containers..."
docker-compose up -d

# Restart nginx untuk menerapkan konfigurasi socket.io
echo "🔄 Restarting nginx..."
docker-compose restart nginx

echo "✅ Konfigurasi Socket.io telah diperbaiki!"
echo "📡 Socket.io sekarang dapat diakses di: https://api-taskme.motorsights.com/socket.io/"
echo "🌐 Frontend dapat diakses di: https://taskme.motorsights.com"
echo "🔗 API dapat diakses di: https://api-taskme.motorsights.com/api"
