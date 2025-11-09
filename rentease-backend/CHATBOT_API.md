# Chatbot API Documentation

This API provides chatbot functionality with conversation persistence and access to user's financial data (expenses, bills, rent plans).

## Base URL

All endpoints are prefixed with `/api/ai`

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create a New Conversation

**POST** `/conversations`

Create a new chat conversation.

**Request Body:**

```json
{
  "title": "Financial Planning Help" // Optional, defaults to "New Conversation"
}
```

**Response:**

```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Financial Planning Help",
    "createdAt": "2025-11-09T05:00:00.000Z",
    "updatedAt": "2025-11-09T05:00:00.000Z"
  }
}
```

---

### 2. Get All Conversations

**GET** `/conversations`

Retrieve all conversations for the authenticated user with a preview of the first message.

**Response:**

```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Financial Planning Help",
      "createdAt": "2025-11-09T05:00:00.000Z",
      "updatedAt": "2025-11-09T05:00:00.000Z",
      "messages": [
        {
          "id": "uuid",
          "conversationId": "uuid",
          "role": "user",
          "content": "How can I save more money?",
          "createdAt": "2025-11-09T05:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 3. Get a Specific Conversation

**GET** `/conversations/:conversationId`

Retrieve a specific conversation with all its messages.

**Response:**

```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Financial Planning Help",
    "createdAt": "2025-11-09T05:00:00.000Z",
    "updatedAt": "2025-11-09T05:00:00.000Z",
    "messages": [
      {
        "id": "uuid",
        "conversationId": "uuid",
        "role": "user",
        "content": "How can I save more money?",
        "createdAt": "2025-11-09T05:00:00.000Z"
      },
      {
        "id": "uuid",
        "conversationId": "uuid",
        "role": "assistant",
        "content": "Based on your expense data, I can see you spent $500 in the last 30 days...",
        "createdAt": "2025-11-09T05:00:01.000Z"
      }
    ]
  }
}
```

---

### 4. Send a Message

**POST** `/conversations/:conversationId/messages`

Send a message in a conversation and receive an AI response. The AI has access to:

- User's expenses (last 50 transactions)
- User's bills (last 20 bills)
- User's approved rent plan
- Previous conversation history

**Request Body:**

```json
{
  "message": "What were my highest expenses last month?"
}
```

**Response:**

```json
{
  "success": true,
  "userMessage": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "user",
    "content": "What were my highest expenses last month?",
    "createdAt": "2025-11-09T05:00:00.000Z"
  },
  "assistantMessage": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "assistant",
    "content": "Looking at your expenses from the last 30 days...",
    "createdAt": "2025-11-09T05:00:01.000Z"
  }
}
```

---

### 5. Update Conversation Title

**PATCH** `/conversations/:conversationId`

Update the title of a conversation.

**Request Body:**

```json
{
  "title": "Budget Planning 2025"
}
```

**Response:**

```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Budget Planning 2025",
    "createdAt": "2025-11-09T05:00:00.000Z",
    "updatedAt": "2025-11-09T05:00:00.000Z"
  }
}
```

---

### 6. Delete a Conversation

**DELETE** `/conversations/:conversationId`

Delete a conversation and all its messages.

**Response:**

```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## Financial Context Available to AI

The chatbot has access to the following user data:

1. **Expenses**

   - Total expenses
   - Expenses by category
   - Last 30 days expenses
   - Recent 10 transactions with details

2. **Bills**

   - Count of unpaid bills
   - Total outstanding amount

3. **Rent Plan**
   - Monthly rent
   - Deposit amount

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**

```json
{
  "success": false,
  "message": "Message is required"
}
```

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Not authenticated"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Conversation not found"
}
```

**500 Server Error**

```json
{
  "success": false,
  "message": "Failed to generate AI response. Please try again."
}
```

## Usage Example

```javascript
// 1. Create a new conversation
const conversationResponse = await fetch("/api/ai/conversations", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ title: "Budget Help" }),
});
const { conversation } = await conversationResponse.json();

// 2. Send a message
const messageResponse = await fetch(
  `/api/ai/conversations/${conversation.id}/messages`,
  {
    method: "POST",
    headers: {
      Authorization: "Bearer YOUR_JWT_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "How much did I spend on food last month?",
    }),
  }
);
const { userMessage, assistantMessage } = await messageResponse.json();

// 3. Get conversation history
const historyResponse = await fetch(
  `/api/ai/conversations/${conversation.id}`,
  {
    headers: {
      Authorization: "Bearer YOUR_JWT_TOKEN",
    },
  }
);
const { conversation: fullConversation } = await historyResponse.json();

// 4. Get all conversations
const listResponse = await fetch("/api/ai/conversations", {
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
});
const { conversations } = await listResponse.json();
```

## Notes

- The AI uses Google's Gemini 2.5 Flash Lite model
- Conversations are private to each user
- Messages are stored in chronological order
- The AI maintains context from previous messages in the conversation
- All timestamps are in ISO 8601 format (UTC)
- The chatbot provides financial advice based on actual user data
