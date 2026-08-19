#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@katherbox.com", "password":"admin"}' | grep -oP '"token":"\K[^"]+')
echo "Token: $TOKEN"

echo "Consultations before delete:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/admin/consultations | grep -oP '"id":\K\d+'

echo "Deleting consultation 1..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/admin/consultations/1/cancel
echo ""

echo "Consultations after delete:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/admin/consultations | grep -oP '"id":\K\d+'
