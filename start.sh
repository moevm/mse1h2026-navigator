#!/usr/bin/env bash
set -e

echo "=== Starting backend + MongoDB ==="
docker compose up -d --build

echo ""
echo "=== Starting graph-data-service ==="
docker compose -f graph-data-service/docker-compose.yaml up -d --build

echo ""
echo "=== Starting frontend (dev) ==="
cd frontend && npm install && npm run dev &

echo ""
echo "All services started."
echo "  Backend:            http://localhost:3000"
echo "  Frontend:           http://localhost:5173"
