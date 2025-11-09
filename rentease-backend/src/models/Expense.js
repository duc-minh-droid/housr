import dayjs from 'dayjs';
import prisma from '../config/db.js';

export const listExpensesByTenant = async (tenantId) => {
    return prisma.expense.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
    });
};

export const createExpense = async (data) => {
    return prisma.expense.create({ data });
};

export const deleteExpense = async (tenantId, expenseId) => {
    return prisma.expense.deleteMany({
        where: { id: expenseId, tenantId },
    });
};

export const getExpenseSummary = async (tenantId) => {
    const [totals, byCategory, recent] = await Promise.all([
        prisma.expense.aggregate({
            _sum: { amount: true },
            where: { tenantId },
        }),
        prisma.expense.groupBy({
            by: ['category'],
            where: { tenantId },
            _sum: { amount: true },
        }),
        prisma.expense.aggregate({
            _sum: { amount: true },
            where: {
                tenantId,
                date: {
                    gte: dayjs().subtract(30, 'day').toDate(),
                },
            },
        }),
    ]);

    return {
        total: totals._sum.amount || 0,
        categories: byCategory.map((entry) => ({
            category: entry.category,
            amount: entry._sum.amount || 0,
        })),
        last30Days: recent._sum.amount || 0,
    };
};
