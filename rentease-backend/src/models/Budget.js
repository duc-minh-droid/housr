import prisma from '../config/db.js';

export const getBudgetByPeriod = async (tenantId, period) => {
    return prisma.budget.findUnique({
        where: {
            tenantId_period: {
                tenantId,
                period,
            },
        },
        include: {
            categoryBudgets: true,
        },
    });
};

export const upsertBudget = async (tenantId, period, amount, categoryAllocations = null) => {
    // First, upsert the main budget
    const budget = await prisma.budget.upsert({
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

    // If category allocations are provided, update them
    if (categoryAllocations && Array.isArray(categoryAllocations)) {
        // Delete existing category budgets
        await prisma.categoryBudget.deleteMany({
            where: { budgetId: budget.id },
        });

        // Create new category budgets
        if (categoryAllocations.length > 0) {
            await prisma.categoryBudget.createMany({
                data: categoryAllocations.map(ca => ({
                    budgetId: budget.id,
                    category: ca.category,
                    percentage: ca.percentage,
                    amount: ca.amount,
                })),
            });
        }

        // Fetch and return the updated budget with category budgets
        return prisma.budget.findUnique({
            where: { id: budget.id },
            include: { categoryBudgets: true },
        });
    }

    return budget;
};

export const getAllBudgets = async (tenantId) => {
    return prisma.budget.findMany({
        where: { tenantId },
    });
};

