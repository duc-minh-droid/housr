import { asyncHandler } from '../utils/errorHandler.js';
import { listTenantsForLandlord } from '../models/User.js';
import prisma from '../config/db.js';

// Search users by username (landlord only)
export const searchUsers = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can search users');
        error.status = 403;
        throw error;
    }

    const { username } = req.query;

    if (!username || username.trim().length < 2) {
        return res.json({ users: [] });
    }

    // Search for tenants by username (SQLite-compatible search)
    // Note: SQLite doesn't support mode: 'insensitive', so we do case-insensitive search differently
    const searchTerm = username.trim().toLowerCase();
    
    const allTenants = await prisma.user.findMany({
        where: {
            role: 'tenant',
        },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
        },
    });

    // Filter in JavaScript for case-insensitive search
    const users = allTenants
        .filter(user => user.username.toLowerCase().includes(searchTerm))
        .slice(0, 10)
        .sort((a, b) => a.username.localeCompare(b.username));

    res.json({ users });
});

export const getTenants = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can view their tenants');
        error.status = 403;
        throw error;
    }

    const tenants = await listTenantsForLandlord(req.user.id);

    res.json({ tenants });
});

export const getTenantDetails = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can view tenant details');
        error.status = 403;
        throw error;
    }

    const { tenantId } = req.params;

    // Verify tenant belongs to this landlord
    const tenant = await prisma.user.findFirst({
        where: {
            id: tenantId,
            role: 'tenant',
            landlordId: req.user.id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            points: true,
            createdAt: true,
        },
    });

    if (!tenant) {
        const error = new Error('Tenant not found');
        error.status = 404;
        throw error;
    }

    // Get payment history
    const paymentHistory = await prisma.bill.findMany({
        where: {
            tenantId,
            landlordId: req.user.id,
            isPaid: true,
        },
        orderBy: { paidDate: 'desc' },
        select: {
            id: true,
            type: true,
            amount: true,
            dueDate: true,
            paidDate: true,
            description: true,
        },
    });

    // Get outstanding bills
    const outstandingBills = await prisma.bill.findMany({
        where: {
            tenantId,
            landlordId: req.user.id,
            isPaid: false,
        },
        orderBy: { dueDate: 'asc' },
        select: {
            id: true,
            type: true,
            amount: true,
            dueDate: true,
            description: true,
        },
    });

    // Calculate totals
    const totalPaid = await prisma.bill.aggregate({
        where: {
            tenantId,
            landlordId: req.user.id,
            isPaid: true,
        },
        _sum: { amount: true },
        _count: true,
    });

    const totalOutstanding = await prisma.bill.aggregate({
        where: {
            tenantId,
            landlordId: req.user.id,
            isPaid: false,
        },
        _sum: { amount: true },
        _count: true,
    });

    // Get rent plan
    const rentPlan = await prisma.rentPlan.findFirst({
        where: {
            tenantId,
            landlordId: req.user.id,
            status: 'approved',
        },
        orderBy: { reviewedDate: 'desc' },
        select: {
            id: true,
            monthlyRent: true,
            deposit: true,
            duration: true,
            proposedDate: true,
            reviewedDate: true,
        },
    });

    res.json({
        tenant,
        rentPlan,
        paymentHistory,
        outstandingBills,
        totals: {
            paid: {
                amount: totalPaid._sum.amount || 0,
                count: totalPaid._count,
            },
            outstanding: {
                amount: totalOutstanding._sum.amount || 0,
                count: totalOutstanding._count,
            },
        },
    });
});
