#!/bin/bash

echo "🛑 Stopping TaskMe System..."

# Stop Docker Compose services
docker-compose down

echo "✅ TaskMe System stopped successfully!"
echo ""
echo "💡 To start again, run: ./start.sh"
