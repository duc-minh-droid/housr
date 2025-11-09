import { Router } from 'express';
import {
    createItem,
    getRedemptions,
    getShopItems,
    redeemItem,
} from '../controllers/shopController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/items', getShopItems);
router.post('/items', createItem);
router.post('/items/:itemId/redeem', redeemItem);
router.get('/redemptions', getRedemptions);

export default router;
