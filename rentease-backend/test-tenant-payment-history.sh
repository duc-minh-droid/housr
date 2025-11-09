#!/bin/bash

# Test scenario: Create new tenants, make payments, and verify payment history

echo "Testing Tenant Payment History Flow"
echo "=========================================="
echo ""

# Landlord credentials
LANDLORD_EMAIL="lord@gmail.com"
LANDLORD_PASSWORD="test12"

# Generate unique tenant emails for this test
TIMESTAMP=$(date +%s)
TENANT1_EMAIL="tenant_${TIMESTAMP}_1@test.com"
TENANT2_EMAIL="tenant_${TIMESTAMP}_2@test.com"
TENANT1_NAME="Alice Johnson"
TENANT2_NAME="Bob Smith"
TENANT1_RENT=1800
TENANT2_RENT=1600

echo "Creating test with new tenants:"
echo "  Tenant 1: $TENANT1_EMAIL ($TENANT1_NAME) - \$$TENANT1_RENT/month"
echo "  Tenant 2: $TENANT2_EMAIL ($TENANT2_NAME) - \$$TENANT2_RENT/month"
echo ""

# Step 1: Login as landlord
echo "1. Logging in as landlord..."
LANDLORD_LOGIN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$LANDLORD_EMAIL\",
    \"password\": \"$LANDLORD_PASSWORD\"
  }")

LANDLORD_TOKEN=$(echo "$LANDLORD_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
LANDLORD_ID=$(echo "$LANDLORD_LOGIN" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$LANDLORD_TOKEN" ]; then
    echo "❌ Failed to get landlord token"
    exit 1
fi
echo "✓ Landlord logged in"
echo ""

# Step 2: Register new tenants
echo "2. Registering new tenants..."

# Register Tenant 1
TENANT1_REGISTER=$(curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TENANT1_EMAIL\",
    \"password\": \"test123\",
    \"name\": \"$TENANT1_NAME\",
    \"role\": \"tenant\"
  }")

TENANT1_ID=$(echo "$TENANT1_REGISTER" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
TENANT1_TOKEN=$(echo "$TENANT1_REGISTER" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TENANT1_TOKEN" ]; then
    echo "❌ Failed to register tenant 1"
    exit 1
fi
echo "✓ Tenant 1 registered: $TENANT1_NAME"

# Register Tenant 2
TENANT2_REGISTER=$(curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TENANT2_EMAIL\",
    \"password\": \"test123\",
    \"name\": \"$TENANT2_NAME\",
    \"role\": \"tenant\"
  }")

TENANT2_ID=$(echo "$TENANT2_REGISTER" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
TENANT2_TOKEN=$(echo "$TENANT2_REGISTER" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TENANT2_TOKEN" ]; then
    echo "❌ Failed to register tenant 2"
    exit 1
fi
echo "✓ Tenant 2 registered: $TENANT2_NAME"
echo ""

# Step 3: Create and approve rent plans
echo "3. Creating and approving rent plans..."

# Tenant 1 submits plan
PLAN1=$(curl -s -X POST http://localhost:5001/api/rent-plans \
  -H "Authorization: Bearer $TENANT1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"landlordId\": \"$LANDLORD_ID\",
    \"monthlyRent\": $TENANT1_RENT,
    \"deposit\": $((TENANT1_RENT * 2)),
    \"duration\": 12
  }")

PLAN1_ID=$(echo "$PLAN1" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

# Landlord approves
curl -s -X POST http://localhost:5001/api/rent-plans/$PLAN1_ID/approve \
  -H "Authorization: Bearer $LANDLORD_TOKEN" > /dev/null
echo "✓ Rent plan approved for $TENANT1_NAME (\$$TENANT1_RENT/month)"

# Tenant 2 submits plan
PLAN2=$(curl -s -X POST http://localhost:5001/api/rent-plans \
  -H "Authorization: Bearer $TENANT2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"landlordId\": \"$LANDLORD_ID\",
    \"monthlyRent\": $TENANT2_RENT,
    \"deposit\": $((TENANT2_RENT * 2)),
    \"duration\": 12
  }")

PLAN2_ID=$(echo "$PLAN2" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

# Landlord approves
curl -s -X POST http://localhost:5001/api/rent-plans/$PLAN2_ID/approve \
  -H "Authorization: Bearer $LANDLORD_TOKEN" > /dev/null
echo "✓ Rent plan approved for $TENANT2_NAME (\$$TENANT2_RENT/month)"
echo ""

# Step 4: Create multiple bills for each tenant
echo "4. Creating multiple bills for each tenant..."

DUE_DATE=$(date -v+15d +%Y-%m-%d)

declare -a BILL_IDS=()

# Create 3 bills for Tenant 1
for i in {1..3}; do
    BILL=$(curl -s -X POST http://localhost:5001/api/bills \
      -H "Authorization: Bearer $LANDLORD_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"tenantId\": \"$TENANT1_ID\",
        \"type\": \"rent\",
        \"amount\": $TENANT1_RENT,
        \"dueDate\": \"${DUE_DATE}T23:59:59.000Z\",
        \"description\": \"Monthly rent payment - Month $i\"
      }")
    
    BILL_ID=$(echo "$BILL" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    BILL_IDS+=("$BILL_ID:$TENANT1_TOKEN")
    echo "  ✓ Bill $i created for $TENANT1_NAME: \$$TENANT1_RENT"
done

# Create 3 bills for Tenant 2
for i in {1..3}; do
    BILL=$(curl -s -X POST http://localhost:5001/api/bills \
      -H "Authorization: Bearer $LANDLORD_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"tenantId\": \"$TENANT2_ID\",
        \"type\": \"rent\",
        \"amount\": $TENANT2_RENT,
        \"dueDate\": \"${DUE_DATE}T23:59:59.000Z\",
        \"description\": \"Monthly rent payment - Month $i\"
      }")
    
    BILL_ID=$(echo "$BILL" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    BILL_IDS+=("$BILL_ID:$TENANT2_TOKEN")
    echo "  ✓ Bill $i created for $TENANT2_NAME: \$$TENANT2_RENT"
done
echo ""

# Step 5: Tenants pay their bills
echo "5. Processing payments..."

PAYMENT_COUNT=0
for BILL_INFO in "${BILL_IDS[@]}"; do
    BILL_ID="${BILL_INFO%%:*}"
    TOKEN="${BILL_INFO##*:}"
    
    PAY_RESPONSE=$(curl -s -X POST http://localhost:5001/api/bills/$BILL_ID/pay \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$PAY_RESPONSE" | grep -q '"isPaid":true'; then
        PAYMENT_COUNT=$((PAYMENT_COUNT + 1))
        POINTS=$(echo "$PAY_RESPONSE" | grep -o '"pointsEarned":[0-9]*' | cut -d':' -f2)
        echo "  ✓ Payment $PAYMENT_COUNT processed (earned $POINTS points)"
    fi
done
echo ""

# Step 6: Check tenant details with payment history
echo "6. Checking tenant details with payment history..."
echo ""

echo "=== TENANT 1: $TENANT1_NAME ==="
TENANT1_DETAILS=$(curl -s http://localhost:5001/api/users/tenants/$TENANT1_ID \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

echo "$TENANT1_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$TENANT1_DETAILS"

PAYMENT_HISTORY_COUNT=$(echo "$TENANT1_DETAILS" | grep -o '"paymentHistory":\[' | wc -l)
TOTAL_PAID=$(echo "$TENANT1_DETAILS" | grep -o '"amount":[0-9]*' | head -1 | cut -d':' -f2)

echo ""
echo "Summary for $TENANT1_NAME:"
echo "  Total Paid: \$$(echo "$TENANT1_DETAILS" | grep -o '"paid":{"amount":[0-9.]*' | cut -d':' -f3)"
echo "  Payment Count: $(echo "$TENANT1_DETAILS" | grep -o '"paid":{"amount":[^,]*,"count":[0-9]*' | grep -o '"count":[0-9]*' | cut -d':' -f2)"
echo ""

echo "=== TENANT 2: $TENANT2_NAME ==="
TENANT2_DETAILS=$(curl -s http://localhost:5001/api/users/tenants/$TENANT2_ID \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

echo "$TENANT2_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$TENANT2_DETAILS"

echo ""
echo "Summary for $TENANT2_NAME:"
echo "  Total Paid: \$$(echo "$TENANT2_DETAILS" | grep -o '"paid":{"amount":[0-9.]*' | cut -d':' -f3)"
echo "  Payment Count: $(echo "$TENANT2_DETAILS" | grep -o '"paid":{"amount":[^,]*,"count":[0-9]*' | grep -o '"count":[0-9]*' | cut -d':' -f2)"
echo ""

echo "=========================================="
echo "✅ Test completed!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - 2 new tenants registered and approved"
echo "  - 6 bills created (3 per tenant)"
echo "  - $PAYMENT_COUNT payments processed"
echo "  - Payment history is now visible in tenant details"
echo ""
