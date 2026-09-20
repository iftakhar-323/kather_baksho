#!/usr/bin/env bash
set -e

echo "🚀 Building and starting Kather Baksho services..."
docker compose up -d --build

echo ""
echo "================================================================="
echo "  🌿 Kather Baksho is LIVE & RUNNING!"
echo "================================================================="
echo "  👉 Frontend Web App  :  http://localhost:8082"
echo "  ⚡ Algorithm Studio   :  http://localhost:8082/algorithms"
echo "  🛠️  Backend REST API  :  http://localhost:8081"
echo "  📊 Grafana Dashboards :  http://localhost:3000  (admin / admin)"
echo "  📈 Prometheus Metrics :  http://localhost:9090"
echo "  🏥 Health Readiness   :  http://localhost:8081/health/ready"
echo "================================================================="
echo "  ✨ Open in browser: http://localhost:8082"
echo "================================================================="

