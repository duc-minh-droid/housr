import dayjs from 'dayjs';
import prisma from '../config/db.js';

const getPeriodDateRange = (period) => {
    const now = dayjs();
    let startDate;

    switch (period) {
        case 'week':
            startDate = now.subtract(7, 'day').startOf('day');
            break;
        case 'month':
            startDate = now.startOf('month');
            break;
        case 'all':
            startDate = null; // No start date filter
            break;
        default:
            startDate = now.startOf('month');
    }

    return { startDate: startDate ? startDate.toDate() : null };
};

export const listExpensesByTenant = async (tenantId, period = 'month') => {
    const { startDate } = getPeriodDateRange(period);
    
    const where = { tenantId };
    if (startDate) {
        where.date = { gte: startDate };
    }

    return prisma.expense.findMany({
        where,
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

export const getExpenseSummary = async (tenantId, period = 'month') => {
    const { startDate } = getPeriodDateRange(period);
    
    const where = { tenantId };
    if (startDate) {
        where.date = { gte: startDate };
    }

    const [totals, byCategory] = await Promise.all([
        prisma.expense.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where,
        }),
        prisma.expense.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true },
            _count: { id: true },
        }),
    ]);

    return {
        total: totals._sum.amount || 0,
        count: totals._count.id || 0,
        categories: byCategory.map((entry) => ({
            category: entry.category,
            total: entry._sum.amount || 0,
            count: entry._count.id || 0,
        })),
    };
};

export const getExpenseTimeseries = async (tenantId, period = 'month') => {
    const { startDate } = getPeriodDateRange(period);
    
    const where = { tenantId };
    if (startDate) {
        where.date = { gte: startDate };
    }

    const expenses = await prisma.expense.findMany({
        where,
        select: {
            date: true,
            amount: true,
        },
        orderBy: { date: 'asc' },
    });

    // Group by date bucket based on period
    const timeseriesMap = new Map();
    
    expenses.forEach((expense) => {
        const date = dayjs(expense.date);
        let key;
        
        switch (period) {
            case 'week':
                key = date.format('YYYY-MM-DD');
                break;
            case 'month':
                key = date.format('YYYY-MM-DD');
                break;
            case 'all':
                key = date.format('YYYY-MM');
                break;
            default:
                key = date.format('YYYY-MM-DD');
        }
        
        const existing = timeseriesMap.get(key) || { date: key, total: 0 };
        existing.total += expense.amount;
        timeseriesMap.set(key, existing);
    });

    // Convert to array and sort
    // Sort the timeseries by date and calculate cumulative totals
    const sortedTimeseries = Array.from(timeseriesMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

    let cumulativeTotal = 0;
    const timeseries = sortedTimeseries.map((item) => {
        cumulativeTotal += item.total;
        return {
            date: item.date,
            total: Number(cumulativeTotal.toFixed(2)),
        };
    });

    return timeseries;
};
