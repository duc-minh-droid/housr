import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { getRewardBalance, listRewardsByTenant } from '../models/Reward.js';

export const getRewards = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view rewards');
        error.status = 403;
        throw error;
    }

    const rewards = await listRewardsByTenant(req.user.id);
    res.json({ rewards });
});

export const getBalance = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view reward balance');
        error.status = 403;
        throw error;
    }

    const balance = await getRewardBalance(req.user.id);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    res.json({ pointsEarned: balance, pointsAvailable: user.points });
});
