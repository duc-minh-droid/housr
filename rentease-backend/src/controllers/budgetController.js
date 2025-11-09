import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { getBudgetByPeriod, upsertBudget, getAllBudgets } from '../models/Budget.js';

export const getBudget = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view budgets');
        error.status = 403;
        throw error;
    }

    const { period } = req.query;
    
    if (!period || !['week', 'month', 'all'].includes(period)) {
        const error = new Error('Invalid period. Must be "week", "month", or "all"');
        error.status = 400;
        throw error;
    }

    const budget = await getBudgetByPeriod(req.user.id, period);
    
    res.json({ 
        budget: budget || null,
        period 
    });
});

export const createOrUpdateBudget = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can manage budgets');
        error.status = 403;
        throw error;
    }

    const { period, amount, categoryAllocations } = req.body;

    if (!period || !['week', 'month', 'all'].includes(period)) {
        const error = new Error('Invalid period. Must be "week", "month", or "all"');
        error.status = 400;
        throw error;
    }

    const amountValue = Number(amount);
    if (Number.isNaN(amountValue) || amountValue < 0) {
        const error = new Error('Invalid amount');
        error.status = 400;
        throw error;
    }

    // Validate category allocations if provided
    if (categoryAllocations && Array.isArray(categoryAllocations)) {
        const totalPercentage = categoryAllocations.reduce((sum, ca) => sum + ca.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.1) {
            const error = new Error('Category allocations must total 100%');
            error.status = 400;
            throw error;
        }
    }

    const budget = await upsertBudget(req.user.id, period, amountValue, categoryAllocations);
    
    res.json({ budget });
});

export const getAllUserBudgets = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view budgets');
        error.status = 403;
        throw error;
    }

    const budgets = await getAllBudgets(req.user.id);
    res.json({ budgets });
});

// Check budget progress and update day counter
export const checkBudgetProgress = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can check budget progress');
        error.status = 403;
        throw error;
    }

    const { period } = req.query;
    
    if (!period || period !== 'month') {
        const error = new Error('Budget tracking only available for monthly period');
        error.status = 400;
        throw error;
    }

    // Get monthly budget
    const budget = await prisma.budget.findUnique({
        where: {
            tenantId_period: {
                tenantId: req.user.id,
                period: 'month'
            }
        }
    });

    if (!budget) {
        return res.json({ message: 'No budget set' });
    }

    // Get total expenses for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await prisma.expense.findMany({
        where: {
            tenantId: req.user.id,
            date: {
                gte: startOfMonth
            }
        }
    });

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const isUnderBudget = totalSpent <= budget.amount;

    // Check if we need to update days counter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastChecked = budget.lastCheckedDate ? new Date(budget.lastCheckedDate) : null;
    const shouldUpdate = !lastChecked || lastChecked < today;

    if (shouldUpdate && isUnderBudget && !budget.pointsAwarded) {
        const newDaysCompleted = budget.daysCompleted + 1;
        
        // Award 100 points if reached 30 days
        if (newDaysCompleted >= 30) {
            await prisma.$transaction([
                prisma.budget.update({
                    where: { id: budget.id },
                    data: {
                        daysCompleted: newDaysCompleted,
                        lastCheckedDate: today,
                        pointsAwarded: true
                    }
                }),
                prisma.user.update({
                    where: { id: req.user.id },
                    data: {
                        points: {
                            increment: 100
                        }
                    }
                })
            ]);

            return res.json({
                budget: {
                    ...budget,
                    daysCompleted: newDaysCompleted,
                    pointsAwarded: true
                },
                message: '🎉 Congratulations! You stayed under budget for 30 days and earned 100 points!',
                pointsEarned: 100
            });
        }

        // Just update day counter
        const updatedBudget = await prisma.budget.update({
            where: { id: budget.id },
            data: {
                daysCompleted: newDaysCompleted,
                lastCheckedDate: today
            }
        });

        return res.json({
            budget: updatedBudget,
            message: `Great! Day ${newDaysCompleted} of staying under budget!`,
            daysRemaining: 30 - newDaysCompleted
        });
    }

    // If over budget, reset counter
    if (!isUnderBudget && budget.daysCompleted > 0) {
        const resetBudget = await prisma.budget.update({
            where: { id: budget.id },
            data: {
                daysCompleted: 0,
                lastCheckedDate: today
            }
        });

        return res.json({
            budget: resetBudget,
            message: 'Budget exceeded. Day counter reset.',
            wasReset: true
        });
    }

    res.json({
        budget,
        isUnderBudget,
        daysCompleted: budget.daysCompleted,
        daysRemaining: 30 - budget.daysCompleted,
        pointsAwarded: budget.pointsAwarded
    });
});

