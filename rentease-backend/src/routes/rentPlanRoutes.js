import { Router } from 'express';
import {
    approveRentPlan,
    getRentPlans,
    rejectRentPlan,
    submitRentPlan,
} from '../controllers/rentPlanController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getRentPlans);
router.post('/', submitRentPlan);
router.post('/:planId/approve', approveRentPlan);
router.post('/:planId/reject', rejectRentPlan);

export default router;
