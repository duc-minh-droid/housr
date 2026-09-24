import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { updateProfile, updatePassword } from '../controllers/profileController.js';

const router = express.Router();

// Update profile (username, name, email)
router.put('/update', authenticate, updateProfile);

// Update password
router.put('/password', authenticate, updatePassword);

export default router;

