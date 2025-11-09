import { Router } from 'express';
import { landlordDashboard, tenantDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/tenant', tenantDashboard);
router.get('/landlord', landlordDashboard);

export default router;
