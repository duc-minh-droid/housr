import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { 
    analyzeUserFinances,
    createConversation,
    getConversations,
    getConversation,
    sendMessage,
    deleteConversation,
    updateConversation,
} from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/analyze - Get AI analysis of user's financial data
router.post('/analyze', authenticate, analyzeUserFinances);

// Chatbot routes
router.post('/conversations', authenticate, createConversation);
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:conversationId', authenticate, getConversation);
router.post('/conversations/:conversationId/messages', authenticate, sendMessage);
router.delete('/conversations/:conversationId', authenticate, deleteConversation);
router.patch('/conversations/:conversationId', authenticate, updateConversation);

export default router;
