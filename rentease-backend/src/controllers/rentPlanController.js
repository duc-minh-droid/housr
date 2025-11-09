import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import {
    createRentPlan,
    findRentPlanById,
    listRentPlansForLandlord,
    listRentPlansForTenant,
    updateRentPlanStatus,
} from '../models/RentPlan.js';

export const getRentPlans = asyncHandler(async (req, res) => {
    const plans = req.user.role === 'tenant'
        ? await listRentPlansForTenant(req.user.id)
        : await listRentPlansForLandlord(req.user.id);

    res.json({ plans });
});

export const submitRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can submit rent plans');
        error.status = 403;
        throw error;
    }

    const { landlordId, monthlyRent, deposit, duration } = req.body;

    if (!landlordId || !monthlyRent || !deposit || !duration) {
        const error = new Error('Missing required fields');
        error.status = 400;
        throw error;
    }

    const monthlyRentValue = Number(monthlyRent);
    const depositValue = Number(deposit);
    const durationValue = Number(duration);

    if ([monthlyRentValue, depositValue, durationValue].some((value) => Number.isNaN(value) || value <= 0)) {
        const error = new Error('Invalid rent plan values');
        error.status = 400;
        throw error;
    }

    const landlord = await prisma.user.findFirst({
        where: { id: landlordId, role: 'landlord' },
    });

    if (!landlord) {
        const error = new Error('Landlord not found');
        error.status = 404;
        throw error;
    }

    if (req.user.landlordId && req.user.landlordId !== landlordId) {
        const error = new Error('Landlord mismatch for tenant');
        error.status = 403;
        throw error;
    }

    const plan = await createRentPlan({
        tenantId: req.user.id,
        landlordId,
        monthlyRent: monthlyRentValue,
        deposit: depositValue,
        duration: durationValue,
    });

    res.status(201).json({ plan });
});

const ensureLandlordOwnsPlan = async (landlordId, planId) => {
    const plan = await findRentPlanById(planId);

    if (!plan || plan.landlordId !== landlordId) {
        const error = new Error('Rent plan not found');
        error.status = 404;
        throw error;
    }

    if (plan.status !== 'pending') {
        const error = new Error('Rent plan already reviewed');
        error.status = 400;
        throw error;
    }

    return plan;
};

export const approveRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can approve rent plans');
        error.status = 403;
        throw error;
    }

    const { planId } = req.params;
    await ensureLandlordOwnsPlan(req.user.id, planId);
    const plan = await updateRentPlanStatus(planId, 'approved');

    res.json({ plan });
});

export const rejectRentPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can reject rent plans');
        error.status = 403;
        throw error;
    }

    const { planId } = req.params;
    await ensureLandlordOwnsPlan(req.user.id, planId);
    const plan = await updateRentPlanStatus(planId, 'rejected');

    res.json({ plan });
});
