import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    const bill = await prisma.bill.findUnique({ 
        where: { id: billId },
        include: {
            landlord: {
                select: { name: true }
            }
        }
    });

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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: Math.round(bill.amount * 100), // Convert to cents
                    product_data: {
                        name: `${bill.type.charAt(0).toUpperCase() + bill.type.slice(1)} Bill`,
                        description: `${bill.description || 'Payment to ' + bill.landlord.name}`,
                    },
                },
                quantity: 1,
            },
        ],
        metadata: {
            billId: bill.id,
            tenantId: req.user.id,
            landlordId: bill.landlordId,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tenant/bills?success=true&billId=${bill.id}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tenant/bills?cancelled=true`,
    });

    // IMMEDIATELY mark bill as paid (for demo/testing - no webhook wait)
    const paidDate = new Date();
    const isOnTime = paidDate <= bill.dueDate;
    const pointsEarned = isOnTime ? Math.max(0, Math.round(bill.amount * 0.1)) : 0;

    console.log(`💳 Immediately processing bill payment for ${bill.id}`);
    console.log(`📝 Payment details: paidDate=${paidDate.toISOString()}, isOnTime=${isOnTime}, pointsEarned=${pointsEarned}`);

    const operations = [
        prisma.bill.update({
            where: { id: billId },
            data: {
                isPaid: true,
                paidDate,
                stripeSessionId: session.id,
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

    await prisma.$transaction(operations);

    console.log(`✅ Bill ${billId} immediately marked as paid. Points earned: ${pointsEarned}`);

    res.json({ 
        sessionUrl: session.url,
        sessionId: session.id,
        paid: true,
        pointsEarned,
    });
});
