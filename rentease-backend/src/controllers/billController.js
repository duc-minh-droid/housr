import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';

const buildBillInclude = {
    tenant: {
        select: { id: true, name: true, email: true },
    },
    landlord: {
        select: { id: true, name: true, email: true },
    },
};

export const getBills = asyncHandler(async (req, res) => {
    const where = req.user.role === 'tenant'
        ? { tenantId: req.user.id }
        : { landlordId: req.user.id };

    const bills = await prisma.bill.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        include: buildBillInclude,
    });

    res.json({ bills });
});

export const createBill = asyncHandler(async (req, res) => {
    const { tenantId, type, amount, dueDate, description } = req.body;

    if (!tenantId || !type || !amount || !dueDate) {
        const error = new Error('Missing required fields');
        error.status = 400;
        throw error;
    }

    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can create bills');
        error.status = 403;
        throw error;
    }

    const tenant = await prisma.user.findFirst({
        where: { id: tenantId, role: 'tenant' },
    });

    if (!tenant) {
        const error = new Error('Tenant not found');
        error.status = 404;
        throw error;
    }

    if (tenant.landlordId !== req.user.id) {
        const error = new Error('You can only create bills for your own tenants. The tenant must accept a rent plan first.');
        error.status = 403;
        throw error;
    }

    const amountValue = Number(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
        const error = new Error('Invalid amount');
        error.status = 400;
        throw error;
    }

    const dueDateValue = new Date(dueDate);
    if (Number.isNaN(dueDateValue.getTime())) {
        const error = new Error('Invalid due date');
        error.status = 400;
        throw error;
    }

    const bill = await prisma.bill.create({
        data: {
            tenantId,
            landlordId: req.user.id,
            type,
            amount: amountValue,
            dueDate: dueDateValue,
            description: description || null,
        },
        include: buildBillInclude,
    });

    res.status(201).json({ bill });
});

export const payBill = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can pay bills');
        error.status = 403;
        throw error;
    }

    const { billId } = req.params;
    const bill = await prisma.bill.findUnique({ where: { id: billId } });

    if (!bill || bill.tenantId !== req.user.id) {
        const error = new Error('Bill not found');
        error.status = 404;
        throw error;
    }

    if (bill.isPaid) {
        const error = new Error('Bill already paid');
        error.status = 400;
        throw error;
    }

    const paidDate = new Date();
    const isOnTime = paidDate <= bill.dueDate;
    const pointsEarned = isOnTime ? Math.max(0, Math.round(bill.amount * 0.1)) : 0;

    const operations = [
        prisma.bill.update({
            where: { id: billId },
            data: {
                isPaid: true,
                paidDate,
            },
        }),
    ];

    if (pointsEarned > 0) {
        operations.push(
            prisma.reward.create({
                data: {
                    tenantId: req.user.id,
                    billId: bill.id,
                    amount: bill.amount,
                    date: paidDate,
                    isOnTime,
                    pointsEarned,
                },
            }),
            prisma.user.update({
                where: { id: req.user.id },
                data: {
                    points: {
                        increment: pointsEarned,
                    },
                },
            }),
        );
    }

    const results = await prisma.$transaction(operations);
    const updatedBill = results[0];

    const updatedUser = pointsEarned > 0 ? results[results.length - 1] : req.user;

    if (pointsEarned > 0) {
        req.user.points = updatedUser.points;
    }

    res.json({
        bill: updatedBill,
        reward: pointsEarned > 0 ? results[1] : null,
        pointsBalance: updatedUser.points,
    });
});
