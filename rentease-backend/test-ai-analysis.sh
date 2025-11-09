#!/bin/bash

# Test AI Financial Analysis Endpoint

BASE_URL="http://localhost:5001/api"

echo "======================================"
echo "AI Financial Analysis Test"
echo "======================================"
echo ""

# Login as a tenant
echo "1. Logging in as tenant..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@gmail.com",
    "password": "test12"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get AI Analysis
echo "2. Requesting AI financial analysis..."
ANALYSIS_RESPONSE=$(curl -s -X POST "$BASE_URL/ai/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo "======================================"
echo "AI Analysis Response:"
echo "======================================"
echo "$ANALYSIS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYSIS_RESPONSE"
echo ""

# Check if successful
if echo "$ANALYSIS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ AI Analysis generated successfully!"
else
  echo "❌ AI Analysis failed"
fi

echo ""
echo "======================================"
echo "Test Complete"
echo "======================================"
