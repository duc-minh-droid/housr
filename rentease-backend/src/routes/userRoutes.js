import express from 'express';
import { searchUsers, getTenants, getTenantDetails } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Search users by username (landlord only)
router.get('/search', authenticate, searchUsers);

// Get all tenants for landlord
router.get('/tenants', authenticate, getTenants);

// Get specific tenant details
router.get('/tenants/:tenantId', authenticate, getTenantDetails);

export default router;
