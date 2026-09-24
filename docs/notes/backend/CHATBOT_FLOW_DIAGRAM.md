# Chatbot Data Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                                                             │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Conversation │  │    Chat     │  │  Message Input   │  │
│  │     List     │  │   Window    │  │   + Send Button  │  │
│  └──────────────┘  └─────────────┘  └──────────────────┘  │
│         │                  │                    │           │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          │ GET /conversations  GET /conversations/:id   POST /conversations/:id/messages
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              aiRoutes.js (Routes)                   │   │
│  │  • POST   /api/ai/conversations                     │   │
│  │  • GET    /api/ai/conversations                     │   │
│  │  • GET    /api/ai/conversations/:id                 │   │
│  │  • POST   /api/ai/conversations/:id/messages        │   │
│  │  • PATCH  /api/ai/conversations/:id                 │   │
│  │  • DELETE /api/ai/conversations/:id                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         auth.js (Middleware)                        │   │
│  │         Verify JWT Token                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       aiController.js (Controllers)                 │   │
│  │  • createConversation()                             │   │
│  │  • getConversations()                               │   │
│  │  • getConversation()                                │   │
│  │  • sendMessage()  ───────────┐                      │   │
│  │  • updateConversation()      │                      │   │
│  │  • deleteConversation()      │                      │   │
│  └──────────────────────────────┼──────────────────────┘   │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Gather User Context   │
                    │  • Expenses (last 50)   │
                    │  • Bills (last 20)      │
                    │  • Rent Plan            │
                    │  • Conversation History │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Google Gemini AI      │
                    │   (gemini-2.5-flash)    │
                    │   Generate Response     │
                    └─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                   │
│                                                             │
│  ┌──────────────┐    ┌─────────────────────┐              │
│  │     User     │────│   Conversation      │              │
│  │              │    │  • id               │              │
│  │ • id         │    │  • userId           │              │
│  │ • name       │    │  • title            │              │
│  │ • email      │    │  • createdAt        │              │
│  │ • expenses   │    │  • updatedAt        │              │
│  │ • bills      │    └──────────┬──────────┘              │
│  │ • rentPlans  │               │                          │
│  └──────────────┘               │                          │
│                                 │                          │
│                    ┌────────────▼──────────────┐           │
│                    │  ConversationMessage      │           │
│                    │  • id                     │           │
│                    │  • conversationId         │           │
│                    │  • role (user/assistant)  │           │
│                    │  • content                │           │
│                    │  • createdAt              │           │
│                    └───────────────────────────┘           │
│                                                             │
│  ┌──────────────┐    ┌──────────┐    ┌─────────────┐     │
│  │   Expense    │    │   Bill   │    │  RentPlan   │     │
│  │ • category   │    │ • amount │    │ • monthlyRent│     │
│  │ • amount     │    │ • isPaid │    │ • deposit   │     │
│  │ • date       │    │ • dueDate│    │ • duration  │     │
│  └──────────────┘    └──────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Message Flow Sequence

```
User                Frontend              Backend               Database              Gemini AI
 │                     │                     │                     │                     │
 │  1. Send Message    │                     │                     │                     │
 ├────────────────────>│                     │                     │                     │
 │                     │  2. POST /messages  │                     │                     │
 │                     ├────────────────────>│                     │                     │
 │                     │                     │  3. Verify Token    │                     │
 │                     │                     │─┐                   │                     │
 │                     │                     │<┘                   │                     │
 │                     │                     │  4. Save User Msg   │                     │
 │                     │                     ├────────────────────>│                     │
 │                     │                     │                     │                     │
 │                     │                     │  5. Get Expenses    │                     │
 │                     │                     ├────────────────────>│                     │
 │                     │                     │<────────────────────┤                     │
 │                     │                     │  6. Get Bills       │                     │
 │                     │                     ├────────────────────>│                     │
 │                     │                     │<────────────────────┤                     │
 │                     │                     │  7. Get Rent Plan   │                     │
 │                     │                     ├────────────────────>│                     │
 │                     │                     │<────────────────────┤                     │
 │                     │                     │  8. Get Conv History│                     │
 │                     │                     ├────────────────────>│                     │
 │                     │                     │<────────────────────┤                     │
 │                     │                     │                     │                     │
 │                     │                     │  9. Generate Response                     │
 │                     │                     ├──────────────────────────────────────────>│
 │                     │                     │                     │  (with context)     │
 │                     │                     │<──────────────────────────────────────────┤
 │                     │                     │                     │  (AI response)      │
 │                     │                     │  10. Save AI Msg    │                     │
 │                     │                     ├────────────────────>│                     │
 │                     │                     │                     │                     │
 │                     │  11. Return Both    │                     │                     │
 │                     │<────────────────────┤                     │                     │
 │  12. Display        │                     │                     │                     │
 │<────────────────────┤                     │                     │                     │
 │                     │                     │                     │                     │
```

## Data Models Relationship

```
┌─────────────────┐
│      User       │
│  id: uuid       │
│  email: string  │
│  name: string   │
│  role: enum     │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│    Conversation         │
│  id: uuid               │
│  userId: uuid           │───────┐
│  title: string?         │       │
│  createdAt: datetime    │       │ 1:N
│  updatedAt: datetime    │       │
└─────────────────────────┘       │
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  ConversationMessage     │
                    │  id: uuid                │
                    │  conversationId: uuid    │
                    │  role: 'user'|'assistant'│
                    │  content: text           │
                    │  createdAt: datetime     │
                    └──────────────────────────┘
```

## Frontend Component Structure

```
App
├── Navbar
├── Sidebar
│   └── ConversationList
│       └── ConversationItem (multiple)
│           ├── Title
│           ├── Preview
│           └── Timestamp
│
└── MainContent
    └── ChatWindow
        ├── ChatHeader
        │   ├── ConversationTitle
        │   └── Actions (Rename, Delete)
        │
        ├── MessageList
        │   └── MessageBubble (multiple)
        │       ├── UserMessage
        │       │   ├── Content
        │       │   └── Timestamp
        │       │
        │       └── AssistantMessage
        │           ├── Avatar/Icon
        │           ├── Content
        │           └── Timestamp
        │
        └── MessageInput
            ├── TextArea
            ├── SendButton
            └── LoadingIndicator
```

## API Call Examples

### 1. Start New Conversation
```javascript
POST /api/ai/conversations
Body: { "title": "Budget Help" }
Response: { conversation: { id, title, ... } }
```

### 2. Send Message
```javascript
POST /api/ai/conversations/:id/messages
Body: { "message": "How much did I spend?" }
Response: { 
  userMessage: { role: "user", content: "..." },
  assistantMessage: { role: "assistant", content: "..." }
}
```

### 3. Load Chat History
```javascript
GET /api/ai/conversations/:id
Response: {
  conversation: {
    id, title,
    messages: [
      { role: "user", content: "...", createdAt: "..." },
      { role: "assistant", content: "...", createdAt: "..." }
    ]
  }
}
```
