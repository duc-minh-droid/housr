#!/bin/bash

# Quick test to view tenant payment history from landlord view

echo "Checking Tenant Payment History"
echo "=========================================="
echo ""

# Login as landlord
echo "Logging in as landlord (lord@gmail.com)..."
LANDLORD_LOGIN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lord@gmail.com",
    "password": "test12"
  }')

LANDLORD_TOKEN=$(echo "$LANDLORD_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$LANDLORD_TOKEN" ]; then
    echo "❌ Failed to login"
    exit 1
fi

echo "✓ Logged in successfully"
echo ""

# Get list of tenants
echo "Fetching tenants list..."
TENANTS=$(curl -s http://localhost:5001/api/users/tenants \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

echo "Tenants Response:"
echo "$TENANTS" | python3 -m json.tool 2>/dev/null || echo "$TENANTS"
echo ""

# Extract tenant IDs and get details for each
TENANT_IDS=$(echo "$TENANTS" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TENANT_IDS" ]; then
    echo "No tenants found"
    exit 0
fi

echo "=========================================="
echo "TENANT DETAILS WITH PAYMENT HISTORY"
echo "=========================================="
echo ""

TENANT_NUM=1
for TENANT_ID in $TENANT_IDS; do
    echo "--- Tenant #$TENANT_NUM ---"
    
    DETAILS=$(curl -s http://localhost:5001/api/users/tenants/$TENANT_ID \
      -H "Authorization: Bearer $LANDLORD_TOKEN")
    
    # Extract key information
    NAME=$(echo "$DETAILS" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    EMAIL=$(echo "$DETAILS" | grep -o '"email":"[^"]*' | head -1 | cut -d'"' -f4)
    POINTS=$(echo "$DETAILS" | grep -o '"points":[0-9]*' | head -1 | cut -d':' -f2)
    TOTAL_PAID=$(echo "$DETAILS" | grep -o '"paid":{"amount":[0-9.]*' | cut -d':' -f3)
    PAYMENT_COUNT=$(echo "$DETAILS" | grep -o '"paid":{"amount":[^,]*,"count":[0-9]*' | grep -o '"count":[0-9]*' | cut -d':' -f2)
    MONTHLY_RENT=$(echo "$DETAILS" | grep -o '"monthlyRent":[0-9.]*' | cut -d':' -f2)
    
    echo "Name: $NAME"
    echo "Email: $EMAIL"
    echo "Points: $POINTS"
    echo "Monthly Rent: \$$MONTHLY_RENT"
    echo "Total Paid: \$$TOTAL_PAID"
    echo "Number of Payments: $PAYMENT_COUNT"
    echo ""
    
    # Show full details
    echo "Full Details:"
    echo "$DETAILS" | python3 -m json.tool 2>/dev/null || echo "$DETAILS"
    echo ""
    echo "=========================================="
    echo ""
    
    TENANT_NUM=$((TENANT_NUM + 1))
done

echo "✅ Payment history check complete!"
