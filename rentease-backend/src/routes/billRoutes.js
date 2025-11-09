import { Router } from 'express';
import { createBill, getBills, payBill } from '../controllers/billController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getBills);
router.post('/', createBill);
router.post('/:billId/pay', payBill);

export default router;
