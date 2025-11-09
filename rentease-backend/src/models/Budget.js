import prisma from '../config/db.js';

export const getBudgetByPeriod = async (tenantId, period) => {
    return prisma.budget.findUnique({
        where: {
            tenantId_period: {
                tenantId,
                period,
            },
        },
    });
};

export const upsertBudget = async (tenantId, period, amount) => {
    return prisma.budget.upsert({
        where: {
            tenantId_period: {
                tenantId,
                period,
            },
        },
        update: {
            amount,
        },
        create: {
            tenantId,
            period,
            amount,
        },
    });
};

export const getAllBudgets = async (tenantId) => {
    return prisma.budget.findMany({
        where: { tenantId },
    });
};

