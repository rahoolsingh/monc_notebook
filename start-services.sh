#!/bin/bash

echo "Starting Document Chat Application Services..."

# Start MongoDB and Qdrant using Docker Compose
echo "Starting MongoDB and Qdrant..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose ps

echo ""
echo "Services started successfully!"
echo "MongoDB: http://localhost:27017"
echo "Qdrant: http://localhost:6333"
echo ""
echo "You can now start the backend and frontend servers:"
echo "Backend: cd backend && pnpm run dev"
echo "Frontend: cd frontend && npm run dev"