#!/usr/bin/env bash
set -e

echo "=== Starting backend + MongoDB ==="
docker compose up -d --build

echo ""
echo "=== Starting frontend (dev) ==="
cd frontend && npm install && npm run dev &

echo ""
echo "All services started."
echo "  Backend:            http://localhost:3000"
echo "  Graph Data Service: http://localhost:8000"
echo "  Frontend:           http://localhost:5173"
