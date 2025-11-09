import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getTenants, getTenantDetails } from '../controllers/userController.js';

const router = express.Router();

router.get('/tenants', authenticate, getTenants);
router.get('/tenants/:tenantId', authenticate, getTenantDetails);

export default router;
