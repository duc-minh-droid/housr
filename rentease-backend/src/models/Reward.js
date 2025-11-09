import prisma from '../config/db.js';

export const createReward = async (data) => {
    return prisma.reward.create({ data });
};

export const listRewardsByTenant = async (tenantId) => {
    return prisma.reward.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
    });
};

export const getRewardBalance = async (tenantId) => {
    const aggregate = await prisma.reward.aggregate({
        where: { tenantId },
        _sum: { pointsEarned: true },
    });

    return aggregate._sum.pointsEarned || 0;
};
