import prisma from '../config/db.js';
import { stripe } from '../config/stripe.js';
import { asyncHandler } from '../utils/errorHandler.js';

// Get all rent plans for current user
export const getRentPlans = asyncHandler(async (req, res) => {
    const where = req.user.role === 'tenant'
        ? { tenantId: req.user.id }
        : { landlordId: req.user.id };

    const plans = await prisma.rentPlan.findMany({
        where,
        include: {
            tenant: {
                select: { id: true, name: true, email: true },
            },
            landlord: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({ plans });
});

// Landlord creates a new rent plan for a tenant
export const createRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can create rent plans');
        error.status = 403;
        throw error;
    }

    const { tenantId, tenantUsername, monthlyRent, deposit, duration, description, startDate } = req.body;

    // Validation - accept either tenantId or tenantUsername
    if ((!tenantId && !tenantUsername) || !monthlyRent || !deposit || !duration) {
        const error = new Error('Missing required fields: (tenantId or tenantUsername), monthlyRent, deposit, duration');
        error.status = 400;
        throw error;
    }

    const monthlyRentValue = Number(monthlyRent);
    const depositValue = Number(deposit);
    const durationValue = Number(duration);

    if ([monthlyRentValue, depositValue, durationValue].some((value) => Number.isNaN(value) || value <= 0)) {
        const error = new Error('Invalid values: monthlyRent, deposit, and duration must be positive numbers');
        error.status = 400;
        throw error;
    }

    // Find tenant by username or ID
    const whereClause = tenantUsername 
        ? { username: tenantUsername, role: 'tenant' }
        : { id: tenantId, role: 'tenant' };

    const tenant = await prisma.user.findFirst({
        where: whereClause,
    });

    if (!tenant) {
        const error = new Error(tenantUsername ? `Tenant with username "${tenantUsername}" not found` : 'Tenant not found');
        error.status = 404;
        throw error;
    }

    // Create the rent plan
    const plan = await prisma.rentPlan.create({
        data: {
            tenantId: tenant.id,
            landlordId: req.user.id,
            monthlyRent: monthlyRentValue,
            deposit: depositValue,
            duration: durationValue,
            description: description || null,
            startDate: startDate ? new Date(startDate) : null,
            status: 'pending',
        },
        include: {
            tenant: {
                select: { id: true, name: true, email: true, username: true },
            },
            landlord: {
                select: { id: true, name: true, email: true, username: true },
            },
        },
    });

    res.status(201).json({ plan });
});

// Get pending rent plans for current tenant
export const getPendingPlans = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view pending plans');
        error.status = 403;
        throw error;
    }

    const plans = await prisma.rentPlan.findMany({
        where: {
            tenantId: req.user.id,
            status: 'pending',
        },
        include: {
            landlord: {
                select: { id: true, name: true, email: true, username: true },
            },
        },
        orderBy: { proposedDate: 'desc' },
    });

    res.json({ plans });
});

// Tenant accepts a rent plan and initiates Stripe payment
export const acceptRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can accept rent plans');
        error.status = 403;
        throw error;
    }

    const { planId } = req.params;

    // Find the plan
    const plan = await prisma.rentPlan.findUnique({
        where: { id: planId },
        include: {
            tenant: true,
            landlord: true,
        },
    });

    if (!plan) {
        const error = new Error('Rent plan not found');
        error.status = 404;
        throw error;
    }

    if (plan.tenantId !== req.user.id) {
        const error = new Error('Unauthorized: This plan is not for you');
        error.status = 403;
        throw error;
    }

    if (plan.status !== 'pending') {
        const error = new Error(`Cannot accept plan with status: ${plan.status}`);
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
                    unit_amount: Math.round(plan.deposit * 100), // Convert to cents
                    product_data: {
                        name: `Rent Plan Deposit - ${plan.landlord.name}`,
                        description: `Deposit for ${plan.duration} month rental plan. Monthly rent: $${plan.monthlyRent}`,
                    },
                },
                quantity: 1,
            },
        ],
        metadata: {
            rentPlanId: plan.id,
            tenantId: plan.tenantId,
            landlordId: plan.landlordId,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tenant/rent-plan?success=true&planId=${plan.id}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tenant/rent-plan?cancelled=true`,
    });

    // Update plan with session ID and mark as accepted
    await prisma.rentPlan.update({
        where: { id: planId },
        data: {
            status: 'accepted',
            stripeSessionId: session.id,
            acceptedAt: new Date(),
            reviewedDate: new Date(),
        },
    });

    res.json({ 
        sessionUrl: session.url,
        sessionId: session.id,
    });
});

// Tenant rejects a rent plan
export const rejectRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can reject rent plans');
        error.status = 403;
        throw error;
    }

    const { planId } = req.params;

    const plan = await prisma.rentPlan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        const error = new Error('Rent plan not found');
        error.status = 404;
        throw error;
    }

    if (plan.tenantId !== req.user.id) {
        const error = new Error('Unauthorized');
        error.status = 403;
        throw error;
    }

    if (plan.status !== 'pending') {
        const error = new Error(`Cannot reject plan with status: ${plan.status}`);
        error.status = 400;
        throw error;
    }

    const updatedPlan = await prisma.rentPlan.update({
        where: { id: planId },
        data: {
            status: 'rejected',
            reviewedDate: new Date(),
        },
        include: {
            tenant: {
                select: { id: true, name: true, email: true },
            },
            landlord: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    res.json({ plan: updatedPlan });
});

// Stripe webhook handler
export const handleStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).send('Webhook secret not configured');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Get the rent plan ID from metadata
        const rentPlanId = session.metadata.rentPlanId;

        if (rentPlanId) {
            try {
                // Update the rent plan to completed
                await prisma.rentPlan.update({
                    where: { id: rentPlanId },
                    data: {
                        status: 'completed',
                        paymentIntentId: session.payment_intent,
                        completedDate: new Date(),
                    },
                });

                console.log(`✅ Rent plan ${rentPlanId} marked as completed`);
            } catch (error) {
                console.error(`Error updating rent plan ${rentPlanId}:`, error);
            }
        }
    }

    res.json({ received: true });
});

// Landlord cancels a rent plan (only if pending)
export const cancelRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can cancel rent plans');
        error.status = 403;
        throw error;
    }

    const { planId } = req.params;

    const plan = await prisma.rentPlan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        const error = new Error('Rent plan not found');
        error.status = 404;
        throw error;
    }

    if (plan.landlordId !== req.user.id) {
        const error = new Error('Unauthorized');
        error.status = 403;
        throw error;
    }

    if (plan.status === 'completed') {
        const error = new Error('Cannot cancel completed plan');
        error.status = 400;
        throw error;
    }

    const updatedPlan = await prisma.rentPlan.update({
        where: { id: planId },
        data: {
            status: 'cancelled',
        },
        include: {
            tenant: {
                select: { id: true, name: true, email: true },
            },
            landlord: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    res.json({ plan: updatedPlan });
});
