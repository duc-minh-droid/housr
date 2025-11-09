import express from 'express';
import { searchUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users by username (landlord only)
router.get('/search', authenticateToken, searchUsers);

export default router;
