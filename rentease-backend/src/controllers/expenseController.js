import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { 
    createExpense, 
    deleteExpense, 
    getExpenseSummary, 
    getExpenseTimeseries,
    listExpensesByTenant 
} from '../models/Expense.js';

export const getExpenses = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view expenses');
        error.status = 403;
        throw error;
    }

    const period = req.query.period || 'month';
    if (!['week', 'month', 'all'].includes(period)) {
        const error = new Error('Invalid period. Must be "week", "month", or "all"');
        error.status = 400;
        throw error;
    }

    const expenses = await listExpensesByTenant(req.user.id, period);
    res.json({ expenses });
});

export const addExpense = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can add expenses');
        error.status = 403;
        throw error;
    }

    const { category, amount, date, description } = req.body;

    if (!category || !amount || !date) {
        const error = new Error('Missing required fields');
        error.status = 400;
        throw error;
    }

    const amountValue = Number(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
        const error = new Error('Invalid amount');
        error.status = 400;
        throw error;
    }

    const dateValue = new Date(date);
    if (Number.isNaN(dateValue.getTime())) {
        const error = new Error('Invalid date');
        error.status = 400;
        throw error;
    }

    const expense = await createExpense({
        tenantId: req.user.id,
        category,
        amount: amountValue,
        date: dateValue,
        description: description || null,
    });

    res.status(201).json({ expense });
});

export const removeExpense = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can delete expenses');
        error.status = 403;
        throw error;
    }

    const { expenseId } = req.params;
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });

    if (!expense || expense.tenantId !== req.user.id) {
        const error = new Error('Expense not found');
        error.status = 404;
        throw error;
    }

    await deleteExpense(req.user.id, expenseId);

    res.status(204).send();
});

export const expenseSummary = asyncHandler(async (req, res) => {
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can view expense summary');
        error.status = 403;
        throw error;
    }

    const period = req.query.period || 'month';
    if (!['week', 'month', 'all'].includes(period)) {
        const error = new Error('Invalid period. Must be "week", "month", or "all"');
        error.status = 400;
        throw error;
    }

    const [summary, timeseries] = await Promise.all([
        getExpenseSummary(req.user.id, period),
        getExpenseTimeseries(req.user.id, period),
    ]);

    res.json({
        totalSpent: summary.total,
        expensesByCategory: summary.categories,
        timeseries,
        period,
    });
});
