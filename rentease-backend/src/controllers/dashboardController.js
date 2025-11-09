import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { listRecentPayments } from '../models/Bill.js';
import { getExpenseSummary } from '../models/Expense.js';
import { listTenantsForLandlord } from '../models/User.js';

export const tenantDashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can access tenant dashboard');
        error.status = 403;
        throw error;
    }

    const tenantId = req.user.id;

    const [upcomingBills, outstanding, summary, user, redemptions] = await Promise.all([
        prisma.bill.findMany({
            where: { tenantId, isPaid: false },
            orderBy: { dueDate: 'asc' },
            take: 5,
        }),
        prisma.bill.aggregate({
            where: { tenantId, isPaid: false },
            _sum: { amount: true },
        }),
        getExpenseSummary(tenantId),
        prisma.user.findUnique({ where: { id: tenantId } }),
        prisma.redemption.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            take: 5,
        }),
    ]);

    res.json({
        bills: {
            upcoming: upcomingBills,
            outstandingTotal: outstanding._sum.amount || 0,
        },
        expenses: summary,
        rewards: {
            points: user.points,
        },
        redemptions,
    });
});

export const landlordDashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can access landlord dashboard');
        error.status = 403;
        throw error;
    }

    const landlordId = req.user.id;

    const [tenants, outstandingBillsAggregate, outstandingBillCount, pendingPlans, recentPayments] = await Promise.all([
        listTenantsForLandlord(landlordId),
        prisma.bill.aggregate({
            where: { landlordId, isPaid: false },
            _sum: { amount: true },
        }),
        prisma.bill.count({ where: { landlordId, isPaid: false } }),
        prisma.rentPlan.findMany({
            where: { landlordId, status: 'pending' },
            orderBy: { proposedDate: 'desc' },
            take: 5,
        }),
        listRecentPayments(landlordId, 5),
    ]);

    res.json({
        tenants,
        bills: {
            outstandingTotal: outstandingBillsAggregate._sum.amount || 0,
            outstandingCount: outstandingBillCount,
        },
        rentPlans: pendingPlans,
        payments: recentPayments,
    });
});
