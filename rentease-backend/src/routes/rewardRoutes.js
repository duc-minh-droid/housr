import { Router } from 'express';
import { getBalance, getRewards } from '../controllers/rewardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getRewards);
router.get('/balance', getBalance);

export default router;
