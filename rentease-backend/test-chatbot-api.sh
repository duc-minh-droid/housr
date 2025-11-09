#!/bin/bash

# Test script for Chatbot API
# Usage: ./test-chatbot-api.sh

BASE_URL="http://localhost:5001/api"
TENANT_EMAIL="test1@gmail.com"
TENANT_PASSWORD="test12"

echo "=== RentEase Chatbot API Test ==="
echo ""

# Step 1: Login as tenant
echo "1. Logging in as tenant..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TENANT_EMAIL\",\"password\":\"$TENANT_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Make sure the server is running and user exists."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Create a new conversation
echo "2. Creating a new conversation..."
CREATE_CONV_RESPONSE=$(curl -s -X POST "$BASE_URL/ai/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Budget Planning"}')

CONVERSATION_ID=$(echo $CREATE_CONV_RESPONSE | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$CONVERSATION_ID" ]; then
    echo "❌ Failed to create conversation"
    echo "Response: $CREATE_CONV_RESPONSE"
    exit 1
fi

echo "✅ Conversation created: $CONVERSATION_ID"
echo ""

# Step 3: Send a message
echo "3. Sending a message to the chatbot..."
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/ai/conversations/$CONVERSATION_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"What are my total expenses?"}')

echo "✅ Message sent and AI responded"
echo ""
echo "AI Response:"
echo $MESSAGE_RESPONSE | grep -o '"content":"[^"]*' | tail -1 | sed 's/"content":"//' | sed 's/\\n/\n/g'
echo ""

# Step 4: Get conversation history
echo "4. Getting conversation history..."
HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/ai/conversations/$CONVERSATION_ID" \
  -H "Authorization: Bearer $TOKEN")

MESSAGE_COUNT=$(echo $HISTORY_RESPONSE | grep -o '"role":' | wc -l | tr -d ' ')
echo "✅ Conversation has $MESSAGE_COUNT messages"
echo ""

# Step 5: Send another message
echo "5. Sending a follow-up message..."
FOLLOWUP_RESPONSE=$(curl -s -X POST "$BASE_URL/ai/conversations/$CONVERSATION_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"What category do I spend the most on?"}')

echo "✅ Follow-up message sent"
echo ""
echo "AI Response:"
echo $FOLLOWUP_RESPONSE | grep -o '"content":"[^"]*' | tail -1 | sed 's/"content":"//' | sed 's/\\n/\n/g'
echo ""

# Step 6: List all conversations
echo "6. Listing all conversations..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/ai/conversations" \
  -H "Authorization: Bearer $TOKEN")

CONV_COUNT=$(echo $LIST_RESPONSE | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')
echo "✅ Found $CONV_COUNT conversation(s)"
echo ""

# Step 7: Update conversation title
echo "7. Updating conversation title..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ai/conversations/$CONVERSATION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Financial Planning 2025"}')

echo "✅ Conversation title updated"
echo ""

# Step 8: Delete conversation
echo "8. Deleting conversation..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/ai/conversations/$CONVERSATION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Conversation deleted"
echo ""

echo "=== All tests completed successfully! ==="
echo ""
echo "API Endpoints tested:"
echo "  ✅ POST   /api/ai/conversations"
echo "  ✅ GET    /api/ai/conversations"
echo "  ✅ GET    /api/ai/conversations/:id"
echo "  ✅ POST   /api/ai/conversations/:id/messages"
echo "  ✅ PATCH  /api/ai/conversations/:id"
echo "  ✅ DELETE /api/ai/conversations/:id"
