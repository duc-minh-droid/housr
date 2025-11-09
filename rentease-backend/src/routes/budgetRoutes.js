import { Router } from 'express';
import { getBudget, createOrUpdateBudget, getAllUserBudgets } from '../controllers/budgetController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getBudget);
router.get('/all', getAllUserBudgets);
router.post('/', createOrUpdateBudget);

export default router;

