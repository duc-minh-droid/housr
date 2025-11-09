import prisma from '../config/db.js';

export const listRentPlansForTenant = async (tenantId) => {
    return prisma.rentPlan.findMany({
        where: { tenantId },
        orderBy: { proposedDate: 'desc' },
    });
};

export const listRentPlansForLandlord = async (landlordId) => {
    return prisma.rentPlan.findMany({
        where: { landlordId },
        orderBy: { proposedDate: 'desc' },
    });
};

export const createRentPlan = async (data) => {
    return prisma.rentPlan.create({ data });
};

export const findRentPlanById = async (planId) => {
    return prisma.rentPlan.findUnique({ where: { id: planId } });
};

export const updateRentPlanStatus = async (planId, status) => {
    const plan = await prisma.rentPlan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        throw new Error('Rent plan not found');
    }

    // If approving the plan, establish the landlord-tenant relationship
    if (status === 'approved') {
        await prisma.$transaction([
            prisma.rentPlan.update({
                where: { id: planId },
                data: {
                    status,
                    reviewedDate: new Date(),
                },
            }),
            prisma.user.update({
                where: { id: plan.tenantId },
                data: {
                    landlordId: plan.landlordId,
                },
            }),
        ]);

        return prisma.rentPlan.findUnique({
            where: { id: planId },
        });
    }

    // For rejection or other statuses, just update the plan
    return prisma.rentPlan.update({
        where: { id: planId },
        data: {
            status,
            reviewedDate: new Date(),
        },
    });
};
