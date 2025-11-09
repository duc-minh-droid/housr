import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../utils/errorHandler.js';
import prisma from '../config/db.js';

// Initialize Gemini AI     
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeUserFinances = asyncHandler(async (req, res) => {
    // Only tenants can analyze their own finances
    if (req.user.role !== 'tenant') {
        const error = new Error('Only tenants can analyze their finances');
        error.status = 403;
        throw error;
    }

    const userId = req.user.id;

    // Gather comprehensive user data
    const [user, expenses, bills, rentPlan] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                points: true,
                createdAt: true,
            },
        }),
        prisma.expense.findMany({
            where: { tenantId: userId },
            orderBy: { date: 'desc' },
        }),
        prisma.bill.findMany({
            where: { tenantId: userId },
            orderBy: { dueDate: 'desc' },
        }),
        prisma.rentPlan.findFirst({
            where: { tenantId: userId, status: 'approved' },
            orderBy: { reviewedDate: 'desc' },
        }),
    ]);

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    // Calculate expense statistics
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    // Calculate last 30 days expenses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = expenses.filter(exp => new Date(exp.date) >= thirtyDaysAgo);
    const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate bill statistics
    const paidBills = bills.filter(bill => bill.isPaid);
    const unpaidBills = bills.filter(bill => !bill.isPaid);
    const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalOutstanding = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);

    // Prepare data for AI analysis
    const userData = {
        user: {
            name: user.name,
            memberSince: user.createdAt,
            rewardPoints: user.points,
        },
        rentPlan: rentPlan ? {
            monthlyRent: rentPlan.monthlyRent,
            deposit: rentPlan.deposit,
            duration: rentPlan.duration,
        } : null,
        expenses: {
            total: totalExpenses,
            count: expenses.length,
            byCategory: expensesByCategory,
            last30Days: {
                total: recentTotal,
                count: recentExpenses.length,
            },
            recentTransactions: expenses.slice(0, 10).map(exp => ({
                category: exp.category,
                amount: exp.amount,
                date: exp.date,
                description: exp.description,
            })),
        },
        bills: {
            paid: {
                count: paidBills.length,
                total: totalPaid,
            },
            unpaid: {
                count: unpaidBills.length,
                total: totalOutstanding,
            },
        },
    };

    // Create a short prompt for Gemini: single short paragraph with analysis, tips and one recommendation
    const prompt = `Please analyze the tenant's financial data (expenses, bills, rent plan) and in one short paragraph provide: a brief analysis of their spending, practical tips to improve their finances, and one clear recommendation. Data: ${JSON.stringify(userData, null, 2)}`;

    try {
        // Call Gemini AI - using gemini-2.5-flash (free tier model)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        // Calculate some quick stats for UI display
        const monthlyIncome = rentPlan ? rentPlan.monthlyRent * 3 : 0; // Estimate
        const monthlyExpenses = recentTotal;
        const savingsRate = monthlyIncome > 0 ? 
            ((monthlyIncome - monthlyExpenses - (rentPlan?.monthlyRent || 0)) / monthlyIncome * 100).toFixed(1) : 0;

        res.json({
            success: true,
            userData,
            analysis,
            summary: {
                totalExpenses,
                recentExpenses: recentTotal,
                totalPaid,
                totalOutstanding,
                monthlyRent: rentPlan?.monthlyRent || 0,
                savingsRate: parseFloat(savingsRate),
                paymentStreak: paidBills.length,
                rewardPoints: user.points,
            },
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Gemini AI Error:', error);
        console.error('Error details:', error.message);
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to generate AI analysis. ';
        if (error.message?.includes('API key')) {
            errorMessage += 'Please check your GEMINI_API_KEY in .env file.';
        } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
            errorMessage += 'API rate limit exceeded. Please try again later.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += 'Please try again later.';
        }
        
        const aiError = new Error(errorMessage);
        aiError.status = 500;
        throw aiError;
    }
});

// Create a new chat conversation
export const createConversation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { title } = req.body;

    const conversation = await prisma.conversation.create({
        data: {
            userId,
            title: title || 'New Conversation',
        },
    });

    res.status(201).json({
        success: true,
        conversation,
    });
});

// Get all conversations for a user
export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
        where: { userId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                take: 1, // Only get the first message for preview
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    res.json({
        success: true,
        conversations,
    });
});

// Get a specific conversation with all messages
export const getConversation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId,
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!conversation) {
        const error = new Error('Conversation not found');
        error.status = 404;
        throw error;
    }

    res.json({
        success: true,
        conversation,
    });
});

// Send a message in a conversation and get AI response
export const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        const error = new Error('Message is required');
        error.status = 400;
        throw error;
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId,
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!conversation) {
        const error = new Error('Conversation not found');
        error.status = 404;
        throw error;
    }

    // Save user message
    const userMessage = await prisma.conversationMessage.create({
        data: {
            conversationId,
            role: 'user',
            content: message,
        },
    });

    // Gather user's financial data for context
    const [expenses, bills, rentPlan] = await Promise.all([
        prisma.expense.findMany({
            where: { tenantId: userId },
            orderBy: { date: 'desc' },
            take: 50, // Last 50 expenses
        }),
        prisma.bill.findMany({
            where: { tenantId: userId },
            orderBy: { dueDate: 'desc' },
            take: 20, // Last 20 bills
        }),
        prisma.rentPlan.findFirst({
            where: { tenantId: userId, status: 'approved' },
            orderBy: { reviewedDate: 'desc' },
        }),
    ]);

    // Calculate expense statistics
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    // Recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = expenses.filter(exp => new Date(exp.date) >= thirtyDaysAgo);
    const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Bill statistics
    const unpaidBills = bills.filter(bill => !bill.isPaid);
    const totalOutstanding = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);

    // Prepare context for AI
    const financialContext = {
        expenses: {
            total: totalExpenses,
            count: expenses.length,
            byCategory: expensesByCategory,
            last30Days: recentTotal,
            recent: expenses.slice(0, 10).map(exp => ({
                category: exp.category,
                amount: exp.amount,
                date: exp.date,
                description: exp.description,
            })),
        },
        bills: {
            unpaidCount: unpaidBills.length,
            totalOutstanding,
        },
        rentPlan: rentPlan ? {
            monthlyRent: rentPlan.monthlyRent,
            deposit: rentPlan.deposit,
        } : null,
    };

    // Build conversation history for context
    const conversationHistory = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    // Create prompt with context
    const systemPrompt = `You are a helpful financial assistant for a tenant rental management app called RentEase. 
You have access to the user's expense data, bills, and rent plan. 
Provide helpful, concise, and friendly advice about their finances.
Be conversational and supportive.

User's Financial Data:
${JSON.stringify(financialContext, null, 2)}

Previous conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's new message: ${message}

Respond helpfully and naturally. If they ask about their expenses, reference the actual data. Keep responses concise (2-3 paragraphs max).`;

    try {
        // Call Gemini AI
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Save AI response
        const assistantMessage = await prisma.conversationMessage.create({
            data: {
                conversationId,
                role: 'assistant',
                content: aiResponse,
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        res.json({
            success: true,
            userMessage,
            assistantMessage,
        });
    } catch (error) {
        console.error('Gemini AI Error:', error);
        
        let errorMessage = 'Failed to generate AI response. ';
        if (error.message?.includes('API key')) {
            errorMessage += 'Please check your GEMINI_API_KEY.';
        } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
            errorMessage += 'API rate limit exceeded. Please try again later.';
        } else {
            errorMessage += 'Please try again.';
        }
        
        const aiError = new Error(errorMessage);
        aiError.status = 500;
        throw aiError;
    }
});

// Delete a conversation
export const deleteConversation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId,
        },
    });

    if (!conversation) {
        const error = new Error('Conversation not found');
        error.status = 404;
        throw error;
    }

    await prisma.conversation.delete({
        where: { id: conversationId },
    });

    res.json({
        success: true,
        message: 'Conversation deleted successfully',
    });
});

// Update conversation title
export const updateConversation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === '') {
        const error = new Error('Title is required');
        error.status = 400;
        throw error;
    }

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId,
        },
    });

    if (!conversation) {
        const error = new Error('Conversation not found');
        error.status = 404;
        throw error;
    }

    const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
    });

    res.json({
        success: true,
        conversation: updatedConversation,
    });
});
