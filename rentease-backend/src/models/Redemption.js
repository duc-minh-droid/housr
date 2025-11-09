import prisma from '../config/db.js';

export const createRedemption = async (data) => {
    return prisma.redemption.create({ data });
};

export const listRedemptionsForTenant = async (tenantId) => {
    return prisma.redemption.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
    });
};

export const listRedemptionsForLandlord = async (landlordId) => {
    return prisma.redemption.findMany({
        where: {
            tenant: {
                landlordId,
            },
        },
        orderBy: { date: 'desc' },
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};
