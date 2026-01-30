#!/bin/bash

# TimeTracker - Docker Setup for Linux

echo "=== TimeTracker Docker Setup ==="
echo ""

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    # Update with your production values
    sed -i 's/password/your-secure-password/g' backend/.env
    sed -i 's/your-secret-key-here-change-in-production/your-production-secret-key/g' backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "Building Docker images..."
docker-compose -f docker/docker-compose.yml build

echo ""
echo "Starting services..."
docker-compose -f docker/docker-compose.yml up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "Running database migrations..."
docker exec timetracker-api npm run migrate

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Services are now running:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Database: localhost:5432"
echo ""
echo "Default credentials:"
echo "  Database User: timetracker"
echo "  Database Password: password"
echo ""
echo "To stop services: docker-compose -f docker/docker-compose.yml down"
echo "To view logs: docker-compose -f docker/docker-compose.yml logs -f"
