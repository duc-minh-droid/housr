import { Router } from 'express';
import { addExpense, expenseSummary, getExpenses, removeExpense } from '../controllers/expenseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', addExpense);
router.get('/summary', expenseSummary);
router.delete('/:expenseId', removeExpense);

export default router;
