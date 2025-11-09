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

