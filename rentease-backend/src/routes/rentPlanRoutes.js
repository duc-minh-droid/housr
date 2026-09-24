import { Router } from 'express';
import express from 'express';
import {
    getRentPlans,
    getPendingPlans,
    createRentPlan,
    acceptRentPlan,
    rejectRentPlan,
    cancelRentPlan,
    handleStripeWebhook,
} from '../controllers/rentPlanController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Webhook route must be BEFORE express.json() middleware and authentication
router.post(
    '/stripe/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

// All other routes require authentication
router.use(authenticate);

router.get('/', getRentPlans);
router.get('/pending', getPendingPlans);       // Tenant gets pending plans
router.post('/', createRentPlan);              // Landlord creates plan
router.post('/:planId/accept', acceptRentPlan); // Tenant accepts and pays
router.post('/:planId/reject', rejectRentPlan); // Tenant rejects
router.delete('/:planId', cancelRentPlan);      // Landlord cancels

export default router;
