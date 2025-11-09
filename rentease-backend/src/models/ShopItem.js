import prisma from '../config/db.js';

export const listShopItems = async () => {
    return prisma.shopItem.findMany({
        orderBy: { pointCost: 'asc' },
    });
};

export const createShopItem = async (data) => {
    return prisma.shopItem.create({ data });
};

export const findShopItemById = async (itemId) => {
    return prisma.shopItem.findUnique({ where: { id: itemId } });
};
