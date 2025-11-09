#!/bin/bash

# Test the /api/users/tenants endpoint

echo "Testing /api/users/tenants endpoint"
echo "===================================="
echo ""

# First, login as a landlord
echo "1. Logging in as landlord (lord@gmail.com)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lord@gmail.com",
    "password": "test12"
  }')

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Please check credentials."
    exit 1
fi

echo "✓ Got token: ${TOKEN:0:50}..."
echo ""

# Test the tenants endpoint
echo "2. Fetching tenants list..."
TENANTS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:5001/api/users/tenants \
  -H "Authorization: Bearer $TOKEN")

echo "Tenants Response:"
echo "$TENANTS_RESPONSE"
echo ""

# Check if successful
if echo "$TENANTS_RESPONSE" | grep -q "tenants"; then
    echo "✓ Successfully retrieved tenants!"
else
    echo "❌ Failed to retrieve tenants"
fi
