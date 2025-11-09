# AI Chat Feature Implementation

## Overview

Added a new AI Chat tab for tenants to interact with an AI assistant about their expenses and finances. The AI has access to the user's expenses, bills, and rent plan data to provide personalized financial insights.

## Files Modified/Created

### 1. `/lib/api.ts`

Added `aiChatApi` object with the following methods:

- `createConversation(title?)` - Create a new conversation
- `getConversations()` - Get all conversations with message previews
- `getConversation(conversationId)` - Get specific conversation with all messages
- `sendMessage(conversationId, message)` - Send a message and get AI response
- `updateConversation(conversationId, title)` - Update conversation title
- `deleteConversation(conversationId)` - Delete a conversation

### 2. `/types/index.ts`

Added new types:

```typescript
interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}
```

### 3. `/components/Sidebar.tsx`

- Added `MessageCircle` icon import
- Added new link to tenant navigation: `{ href: '/dashboard/tenant/ai-chat', label: 'AI Chat', icon: MessageCircle }`

### 4. `/app/dashboard/tenant/ai-chat/page.tsx` (NEW)

Created a complete chat interface with:

#### Features:

- **Conversation Management**

  - Create new conversations
  - View list of all conversations
  - Edit conversation titles
  - Delete conversations
  - Automatic conversation list updates

- **Chat Interface**

  - Real-time message display
  - User and AI message differentiation
  - Message timestamps
  - Auto-scroll to latest message
  - Loading states during AI responses

- **User Experience**

  - Beautiful gradient UI with purple/blue theme
  - Responsive design (mobile & desktop)
  - Collapsible sidebar on mobile
  - Smooth animations with Framer Motion
  - Disabled states during message sending
  - Empty states for no conversations/messages

- **Keyboard Shortcuts**
  - Enter to send message
  - Escape to cancel title editing

## API Integration

The component uses the backend API at `/api/ai/*` with the following endpoints:

1. **POST** `/api/ai/conversations` - Create conversation
2. **GET** `/api/ai/conversations` - List conversations
3. **GET** `/api/ai/conversations/:id` - Get conversation details
4. **POST** `/api/ai/conversations/:id/messages` - Send message
5. **PATCH** `/api/ai/conversations/:id` - Update title
6. **DELETE** `/api/ai/conversations/:id` - Delete conversation

## UI Components

### Main Layout

```
┌─────────────────────────────────────────┐
│ Header (with New Chat button)          │
├───────────┬─────────────────────────────┤
│           │                             │
│ Conversa- │   Chat Messages Area        │
│ tion List │                             │
│           │                             │
│           ├─────────────────────────────┤
│           │   Message Input             │
└───────────┴─────────────────────────────┘
```

### Color Scheme

- Primary: Purple to Blue gradients
- AI messages: Gray background
- User messages: Purple/Blue gradient background
- Icons: Sparkles for branding, Bot for AI, User for tenant

## Usage Flow

1. **First Visit**: User sees welcome screen with "Start a Conversation" button
2. **Create Chat**: Click "New Chat" or "Start a Conversation"
3. **Send Message**: Type question about expenses/finances and press Enter or click Send
4. **AI Response**: AI analyzes user's financial data and responds with insights
5. **Continue Chat**: Messages maintain context within the conversation
6. **Manage Chats**: Edit titles, delete old conversations, or start new ones

## AI Capabilities

The AI assistant has access to:

- User's last 50 expense transactions
- User's last 20 bills
- User's approved rent plan
- Previous conversation history

Can answer questions like:

- "What were my highest expenses last month?"
- "How much did I spend on food?"
- "What bills do I have due soon?"
- "How can I save more money?"
- "What's my total outstanding balance?"

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with dark mode support
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React hooks (useState, useEffect, useRef)
- **Authentication**: Uses AuthContext for user data
- **API Client**: Custom fetchWithAuth helper from api.ts

## Notes

- The chat is only available for tenants (not landlords)
- All conversations are private to each user
- The AI uses Google's Gemini 2.5 Flash Lite model (as per API docs)
- Timestamps are displayed in user's local time
- Auto-scrolling ensures latest messages are always visible
- Conversation list shows most recent conversations first
