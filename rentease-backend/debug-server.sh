#!/bin/bash

# Simple debug script to test if the server and routes are working

echo "Testing RentEase Server..."
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5001/health)
echo "Response: $HEALTH"
echo ""

# Test 2: Login
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@gmail.com","password":"test12"}')
echo "Response: $LOGIN_RESPONSE"
echo ""

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - cannot proceed"
    exit 1
fi

echo "✅ Token: ${TOKEN:0:20}..."
echo ""

# Test 3: Try to access AI analysis endpoint (old endpoint that should work)
echo "3. Testing AI analysis endpoint..."
ANALYSIS=$(curl -s -X POST "http://localhost:5001/api/ai/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: ${ANALYSIS:0:200}..."
echo ""

# Test 4: Try to create conversation
echo "4. Testing create conversation endpoint..."
CONV=$(curl -v -X POST "http://localhost:5001/api/ai/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test"}' 2>&1)
echo "$CONV"
echo ""

# Test 5: Check if route exists with OPTIONS
echo "5. Testing OPTIONS on conversations endpoint..."
OPTIONS=$(curl -s -X OPTIONS "http://localhost:5001/api/ai/conversations" \
  -H "Authorization: Bearer $TOKEN" 2>&1)
echo "Response: $OPTIONS"
