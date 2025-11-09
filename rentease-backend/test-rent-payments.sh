#!/bin/bash

# Test scenario: Multiple tenants making monthly rent payments to landlord

echo "Testing Monthly Rent Payment Flow"
echo "=========================================="
echo ""

# Landlord credentials
LANDLORD_EMAIL="lord@gmail.com"
LANDLORD_PASSWORD="test12"

# Tenant credentials
declare -a TENANT_EMAILS=("test1@gmail.com" "test2@gmail.com")
declare -a TENANT_PASSWORDS=("test12" "test12")
declare -a TENANT_MONTHLY_RENTS=(1500 1200)  # Monthly rent amounts

# Step 1: Login as landlord
echo "1. Logging in as landlord ($LANDLORD_EMAIL)..."
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

echo "✓ Landlord logged in successfully"
echo "  Landlord ID: $LANDLORD_ID"
echo ""

# Step 2: Setup tenants and their rent plans
declare -a TENANT_IDS=()
declare -a TENANT_TOKENS=()

for i in "${!TENANT_EMAILS[@]}"; do
    TENANT_EMAIL="${TENANT_EMAILS[$i]}"
    TENANT_PASSWORD="${TENANT_PASSWORDS[$i]}"
    MONTHLY_RENT="${TENANT_MONTHLY_RENTS[$i]}"
    
    echo "2.$((i+1)). Setting up tenant: $TENANT_EMAIL"
    
    # Login as tenant
    TENANT_LOGIN=$(curl -s -X POST http://localhost:5001/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TENANT_EMAIL\",
        \"password\": \"$TENANT_PASSWORD\"
      }")
    
    TENANT_TOKEN=$(echo "$TENANT_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    TENANT_ID=$(echo "$TENANT_LOGIN" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ -z "$TENANT_TOKEN" ]; then
        echo "  ⚠️  Failed to login tenant, skipping..."
        continue
    fi
    
    TENANT_IDS+=("$TENANT_ID")
    TENANT_TOKENS+=("$TENANT_TOKEN")
    
    echo "  ✓ Tenant logged in: $TENANT_ID"
    
    # Check if tenant already has landlord assigned
    TENANT_INFO=$(curl -s -X POST http://localhost:5001/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TENANT_EMAIL\",
        \"password\": \"$TENANT_PASSWORD\"
      }")
    
    TENANT_LANDLORD_ID=$(echo "$TENANT_INFO" | grep -o '"landlordId":"[^"]*' | cut -d'"' -f4)
    
    if [ "$TENANT_LANDLORD_ID" = "$LANDLORD_ID" ]; then
        echo "  ✓ Tenant already has an approved plan with this landlord"
    else
        echo "  → Creating and approving rent plan..."
        
        # Submit rent plan
        RENT_PLAN=$(curl -s -X POST http://localhost:5001/api/rent-plans \
          -H "Authorization: Bearer $TENANT_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"landlordId\": \"$LANDLORD_ID\",
            \"monthlyRent\": $MONTHLY_RENT,
            \"deposit\": $((MONTHLY_RENT * 2)),
            \"duration\": 12
          }")
        
        PLAN_ID=$(echo "$RENT_PLAN" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
        
        if [ -z "$PLAN_ID" ]; then
            echo "  ⚠️  Failed to create rent plan, skipping tenant..."
            continue
        fi
        
        # Approve rent plan as landlord
        curl -s -X POST http://localhost:5001/api/rent-plans/$PLAN_ID/approve \
          -H "Authorization: Bearer $LANDLORD_TOKEN" \
          -H "Content-Type: application/json" > /dev/null
        
        echo "  ✓ Rent plan created and approved (\$$MONTHLY_RENT/month)"
    fi
    echo ""
done

# Step 3: Check current tenants
echo "3. Checking landlord's tenants..."
TENANTS_LIST=$(curl -s http://localhost:5001/api/users/tenants \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

TENANT_COUNT=$(echo "$TENANTS_LIST" | grep -o '"id":' | wc -l)
echo "  Found $TENANT_COUNT tenant(s)"
echo ""

# Step 4: Create monthly rent bills for each tenant
echo "4. Creating monthly rent bills..."
declare -a BILL_IDS=()

for i in "${!TENANT_IDS[@]}"; do
    TENANT_ID="${TENANT_IDS[$i]}"
    MONTHLY_RENT="${TENANT_MONTHLY_RENTS[$i]}"
    TENANT_EMAIL="${TENANT_EMAILS[$i]}"
    
    # Calculate due date (end of current month)
    DUE_DATE=$(date -v+15d +%Y-%m-%d)
    
    echo "  4.$((i+1)). Creating bill for tenant $TENANT_EMAIL"
    
    BILL_RESPONSE=$(curl -s -X POST http://localhost:5001/api/bills \
      -H "Authorization: Bearer $LANDLORD_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"tenantId\": \"$TENANT_ID\",
        \"type\": \"rent\",
        \"amount\": $MONTHLY_RENT,
        \"dueDate\": \"${DUE_DATE}T23:59:59.000Z\",
        \"description\": \"Monthly rent payment for November 2025\"
      }")
    
    BILL_ID=$(echo "$BILL_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ -z "$BILL_ID" ]; then
        echo "    ⚠️  Failed to create bill"
        echo "    Response: $BILL_RESPONSE"
    else
        BILL_IDS+=("$BILL_ID")
        echo "    ✓ Bill created: \$$MONTHLY_RENT (Due: $DUE_DATE)"
        echo "    Bill ID: $BILL_ID"
    fi
done
echo ""

# Step 5: Check landlord's bills
echo "5. Checking landlord's bills..."
LANDLORD_BILLS=$(curl -s http://localhost:5001/api/bills \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

UNPAID_COUNT=$(echo "$LANDLORD_BILLS" | grep -o '"isPaid":false' | wc -l)
echo "  Unpaid bills: $UNPAID_COUNT"
echo ""

# Step 6: Tenants pay their bills
echo "6. Processing rent payments..."

for i in "${!BILL_IDS[@]}"; do
    BILL_ID="${BILL_IDS[$i]}"
    TENANT_TOKEN="${TENANT_TOKENS[$i]}"
    TENANT_EMAIL="${TENANT_EMAILS[$i]}"
    MONTHLY_RENT="${TENANT_MONTHLY_RENTS[$i]}"
    
    echo "  6.$((i+1)). Tenant $TENANT_EMAIL paying rent (\$$MONTHLY_RENT)..."
    
    PAY_RESPONSE=$(curl -s -X POST http://localhost:5001/api/bills/$BILL_ID/pay \
      -H "Authorization: Bearer $TENANT_TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$PAY_RESPONSE" | grep -q '"isPaid":true'; then
        POINTS=$(echo "$PAY_RESPONSE" | grep -o '"pointsEarned":[0-9]*' | cut -d':' -f2)
        echo "    ✓ Payment successful!"
        echo "    Points earned: $POINTS"
    else
        echo "    ❌ Payment failed"
        echo "    Response: $PAY_RESPONSE"
    fi
done
echo ""

# Step 7: Verify all bills are paid
echo "7. Verifying payment status..."
LANDLORD_BILLS_AFTER=$(curl -s http://localhost:5001/api/bills \
  -H "Authorization: Bearer $LANDLORD_TOKEN")

PAID_COUNT=$(echo "$LANDLORD_BILLS_AFTER" | grep -o '"isPaid":true' | wc -l)
STILL_UNPAID=$(echo "$LANDLORD_BILLS_AFTER" | grep -o '"isPaid":false' | wc -l)

echo "  Paid bills: $PAID_COUNT"
echo "  Unpaid bills: $STILL_UNPAID"
echo ""

# Step 8: Check tenant points
echo "8. Checking tenant rewards..."
for i in "${!TENANT_EMAILS[@]}"; do
    TENANT_TOKEN="${TENANT_TOKENS[$i]}"
    TENANT_EMAIL="${TENANT_EMAILS[$i]}"
    
    TENANT_INFO=$(curl -s -X POST http://localhost:5001/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TENANT_EMAIL\",
        \"password\": \"test12\"
      }")
    
    POINTS=$(echo "$TENANT_INFO" | grep -o '"points":[0-9]*' | cut -d':' -f2 | head -1)
    echo "  Tenant $TENANT_EMAIL: $POINTS points"
done
echo ""

echo "=========================================="
echo "✅ Rent payment test completed!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - $TENANT_COUNT tenants set up"
echo "  - ${#BILL_IDS[@]} bills created"
echo "  - $PAID_COUNT payments processed"
echo ""
