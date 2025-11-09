import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { createShopItem, findShopItemById, listShopItems } from '../models/ShopItem.js';
import { listRedemptionsForLandlord, listRedemptionsForTenant } from '../models/Redemption.js';

export const getShopItems = asyncHandler(async (req, res) => {
    const items = await listShopItems();
    res.json({ items });
});

export const createItem = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can create shop items');
        error.status = 403;
        throw error;
    }

    const { name, description, pointCost, imageUrl } = req.body;

    if (!name || !description || !pointCost) {
        const error = new Error('Missing required fields');
        error.status = 400;
        throw error;
    }

    const pointCostValue = Number(pointCost);
    if (Number.isNaN(pointCostValue) || pointCostValue <= 0) {
        const error = new Error('Invalid point cost');
        error.status = 400;
        throw error;
    }

    const item = await createShopItem({
        name,
        description,
        pointCost: pointCostValue,
        imageUrl: imageUrl || null,
    });

    res.status(201).json({ item });
});

export const redeemItem = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can redeem shop items');
        error.status = 403;
        throw error;
    }

    const { itemId } = req.params;
    const item = await findShopItemById(itemId);

    if (!item) {
        const error = new Error('Item not found');
        error.status = 404;
        throw error;
    }

    const tenant = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!tenant) {
        const error = new Error('Tenant not found');
        error.status = 404;
        throw error;
    }

    if (tenant.points < item.pointCost) {
        const error = new Error('Not enough points to redeem item');
        error.status = 400;
        throw error;
    }

    const [updatedUser, redemption] = await prisma.$transaction([
        prisma.user.update({
            where: { id: req.user.id },
            data: {
                points: {
                    decrement: item.pointCost,
                },
            },
        }),
        prisma.redemption.create({
            data: {
                tenantId: req.user.id,
                itemId: item.id,
                itemName: item.name,
                pointsSpent: item.pointCost,
            },
        }),
    ]);

    req.user.points = updatedUser.points;

    res.json({
        redemption,
        pointsBalance: updatedUser.points,
    });
});

export const getRedemptions = asyncHandler(async (req, res) => {
    const redemptions = req.user.role === 'tenant'
        ? await listRedemptionsForTenant(req.user.id)
        : await listRedemptionsForLandlord(req.user.id);

    res.json({ redemptions });
});
