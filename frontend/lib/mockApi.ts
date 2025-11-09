// Mock API for Demo Tenant - No backend integration required
import { User, Bill, Expense, RentPlan, ShopItem, Redemption, Conversation, ChatMessage } from '@/types';
import {
  mockUsers,
  mockBills,
  mockExpenses,
  mockRentPlans,
  mockShopItems,
  mockRedemptions,
  mockPayments,
} from './mockData';

// Helper to check if user is demo tenant
export const isDemoTenant = (email: string): boolean => {
  return email === 'demo@example.com';
};

// Helper to check if user is demo/mock user (tenant or landlord)
export const isDemoUser = (email: string): boolean => {
  return email === 'demo@example.com' || email === 'landlord@example.com' || mockUsers.some(u => u.email === email);
};

// Helper to get current user from mock data
const getCurrentMockUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

// Simulate API delay for realism
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Auth API
export const mockAuthApi = {
  login: async (email: string, password: string) => {
    await delay();
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // For demo/mock users, accept any password
    if (isDemoUser(email)) {
      return {
        token: 'demo-mock-jwt-token',
        user: user,
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  getProfile: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    return user;
  },
};

// Mock Bills API
export const mockBillsApi = {
  getBills: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    return mockBills.filter(bill => bill.tenantId === user.id);
  },
  
  getTenantBills: async () => {
    return mockBillsApi.getBills();
  },
  
  getLandlordBills: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    if (user.role !== 'landlord') throw new Error('Unauthorized');
    
    return mockBills.filter(bill => bill.landlordId === user.id);
  },
  
  createBill: async (billData: any) => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    if (user.role !== 'landlord') throw new Error('Unauthorized');
    
    const newBill = {
      id: `bill-${Date.now()}`,
      tenantId: billData.user_id.toString(),
      landlordId: user.id,
      type: billData.category,
      amount: billData.amount,
      dueDate: billData.due_date,
      isPaid: false,
      description: billData.title,
    };
    
    mockBills.push(newBill);
    return newBill;
  },
  
  payBill: async (billId: string, paidDate?: string) => {
    await delay();
    const bill = mockBills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');
    
    // In a real scenario, this would update the bill
    // For demo, we just return the updated bill
    return {
      ...bill,
      isPaid: true,
      paidDate: paidDate || new Date().toISOString(),
    };
  },
};

// Mock Expenses API
export const mockExpensesApi = {
  getExpenses: async (month?: number, year?: number) => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    let expenses = mockExpenses.filter(expense => expense.tenantId === user.id);
    
    if (month !== undefined && year !== undefined) {
      expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
      });
    }
    
    return expenses;
  },
  
  getTenantExpenses: async (month?: number, year?: number) => {
    return mockExpensesApi.getExpenses(month, year);
  },
  
  createExpense: async (expenseData: {
    category: string;
    amount: number;
    date: string;
    description?: string;
  }) => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      tenantId: user.id,
      category: expenseData.category,
      amount: expenseData.amount,
      date: expenseData.date,
      description: expenseData.description || '',
    };
    
    // In demo mode, we don't persist, but return the new expense
    mockExpenses.push(newExpense);
    return newExpense;
  },
  
  deleteExpense: async (expenseId: string) => {
    await delay();
    const index = mockExpenses.findIndex(e => e.id === expenseId);
    if (index > -1) {
      mockExpenses.splice(index, 1);
    }
    return { success: true };
  },
  
  getSummary: async (period: 'week' | 'month' | 'all' = 'month', month?: number, year?: number) => {
    await delay();
    let expenses = await mockExpensesApi.getExpenses(month, year);
    
    // Filter by period
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expenses = expenses.filter(e => new Date(e.date) >= weekAgo);
    } else if (period === 'month') {
      expenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      });
    }
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = expenses.reduce((acc, exp) => {
      const existing = acc.find(c => c.category === exp.category);
      if (existing) {
        existing.total += exp.amount;
        existing.count += 1;
      } else {
        acc.push({ category: exp.category, total: exp.amount, count: 1 });
      }
      return acc;
    }, [] as Array<{ category: string; total: number; count: number }>);
    
    // Generate timeseries
    const timeseriesMap = new Map<string, number>();
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const key = period === 'all'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : date.toISOString().split('T')[0];
      timeseriesMap.set(key, (timeseriesMap.get(key) || 0) + exp.amount);
    });
    
    // Sort and calculate cumulative totals
    const sortedTimeseries = Array.from(timeseriesMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    let cumulativeTotal = 0;
    const timeseries = sortedTimeseries.map((item) => {
      cumulativeTotal += item.total;
      return {
        date: item.date,
        total: Number(cumulativeTotal.toFixed(2)),
      };
    });
    
    return {
      totalSpent,
      expensesByCategory: byCategory,
      timeseries,
      period,
    };
  },
};

// Mock Rent Plans API
export const mockRentPlansApi = {
  getRentPlans: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    return mockRentPlans.filter(plan => plan.tenantId === user.id);
  },
  
  getTenantPlan: async () => {
    const plans = await mockRentPlansApi.getRentPlans();
    return plans.length > 0 ? plans[0] : null;
  },
  
  getLandlordPlans: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    if (user.role !== 'landlord') throw new Error('Unauthorized');
    
    return mockRentPlans.filter(plan => plan.landlordId === user.id);
  },
  
  updatePlanStatus: async (planId: string, status: 'approved' | 'rejected') => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    if (user.role !== 'landlord') throw new Error('Unauthorized');
    
    const plan = mockRentPlans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');
    
    plan.status = status;
    plan.reviewedDate = new Date().toISOString();
    
    return plan;
  },
};

// Mock Budget API
interface MockBudgetData {
  period: string;
  amount: number;
  categoryAllocations?: Array<{ category: string; percentage: number; amount: number }>;
}

const mockBudgets = new Map<string, MockBudgetData>();

export const mockBudgetApi = {
  getBudget: async (period: 'week' | 'month' | 'all') => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    const key = `${user.id}-${period}`;
    const budgetData = mockBudgets.get(key);
    
    return {
      budget: budgetData ? {
        id: key,
        tenantId: user.id,
        period,
        amount: budgetData.amount,
        categoryBudgets: budgetData.categoryAllocations?.map((ca, idx) => ({
          id: `cat-${key}-${idx}`,
          budgetId: key,
          category: ca.category,
          percentage: ca.percentage,
          amount: ca.amount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : null,
      period,
    };
  },
  
  updateBudget: async (
    period: 'week' | 'month' | 'all',
    amount: number,
    categoryAllocations?: Array<{ category: string; percentage: number; amount: number }>
  ) => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    const key = `${user.id}-${period}`;
    mockBudgets.set(key, { period, amount, categoryAllocations });
    
    return {
      budget: {
        id: key,
        tenantId: user.id,
        period,
        amount,
        categoryBudgets: categoryAllocations?.map((ca, idx) => ({
          id: `cat-${key}-${idx}`,
          budgetId: key,
          category: ca.category,
          percentage: ca.percentage,
          amount: ca.amount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },
};

// Mock Rewards API
export const mockRewardsApi = {
  getRewardHistory: async () => {
    await delay();
    return mockPayments.filter(payment => {
      const user = getCurrentMockUser();
      return user && payment.tenantId === user.id;
    });
  },
  
  getBalance: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    return {
      points: user.points || 0,
    };
  },
  
  getTenantPoints: async () => {
    return mockRewardsApi.getBalance();
  },
  
  getShopItems: async () => {
    await delay();
    return mockShopItems;
  },
  
  redeemItem: async (itemId: string) => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    const item = mockShopItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    
    if ((user.points || 0) < item.pointCost) {
      throw new Error('Insufficient points');
    }
    
    const newRedemption: Redemption = {
      id: `redemption-${Date.now()}`,
      tenantId: user.id,
      itemId: item.id,
      itemName: item.name,
      pointsSpent: item.pointCost,
      date: new Date().toISOString(),
    };
    
    // Update user points in localStorage
    const updatedUser = { ...user, points: (user.points || 0) - item.pointCost };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    mockRedemptions.push(newRedemption);
    return newRedemption;
  },
  
  getRedemptions: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    return mockRedemptions.filter(r => r.tenantId === user.id);
  },
};

// Mock Shop API (alias for rewards)
export const mockShopApi = {
  getItems: async () => mockRewardsApi.getShopItems(),
  redeemItem: async (itemId: string) => mockRewardsApi.redeemItem(itemId),
  getRedemptions: async () => mockRewardsApi.getRedemptions(),
};

// Mock Dashboard API
export const mockDashboardApi = {
  getTenantDashboard: async () => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');
    
    const bills = await mockBillsApi.getBills();
    const expenses = await mockExpensesApi.getExpenses();
    const rentPlan = await mockRentPlansApi.getTenantPlan();
    const balance = await mockRewardsApi.getBalance();
    
    const unpaidBills = bills.filter(b => !b.isPaid);
    const totalDue = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      user,
      points: balance.points,
      unpaidBills: unpaidBills.length,
      totalDue,
      monthlyExpenses: monthlyTotal,
      rentPlan,
    };
  },
};

// Mock conversations storage
const mockConversations: Conversation[] = [];
const mockMessages: ChatMessage[] = [];

// Mock AI Chat API
export const mockAiChatApi = {
  createConversation: async (title?: string): Promise<Conversation> => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');

    const newConversation: Conversation = {
      id: `mock-conv-${Date.now()}`,
      userId: user.id,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    mockConversations.push(newConversation);
    return newConversation;
  },

  getConversations: async (): Promise<Conversation[]> => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');

    return mockConversations
      .filter(c => c.userId === user.id)
      .map(conv => ({
        ...conv,
        messages: mockMessages
          .filter(m => m.conversationId === conv.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(0, 1), // Only first message for preview
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');

    const conversation = mockConversations.find(c => c.id === conversationId && c.userId === user.id);
    if (!conversation) throw new Error('Conversation not found');

    const messages = mockMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      ...conversation,
      messages,
    };
  },

  sendMessage: async (conversationId: string, message: string) => {
    await delay(500); // Longer delay to simulate AI processing
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');

    const conversation = mockConversations.find(c => c.id === conversationId && c.userId === user.id);
    if (!conversation) throw new Error('Conversation not found');

    // Create user message
    const userMessage: ChatMessage = {
      id: `mock-msg-${Date.now()}-user`,
      conversationId,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    mockMessages.push(userMessage);

    // Get user's financial data for context
    const expenses = await mockExpensesApi.getExpenses();
    const bills = await mockBillsApi.getBills();
    const rentPlan = await mockRentPlansApi.getTenantPlan();

    // Generate mock AI response based on context
    let aiResponse = '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('expense') || lowerMessage.includes('spending')) {
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const categoryTotals: { [key: string]: number } = {};
      expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      });
      const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      
      aiResponse = `Based on your expense data, you've spent a total of $${totalExpenses.toFixed(2)}. Your highest spending category is ${topCategory[0]} at $${topCategory[1].toFixed(2)}. Consider setting a budget for this category to help manage your spending better!`;
    } else if (lowerMessage.includes('bill') || lowerMessage.includes('payment')) {
      const unpaidBills = bills.filter(b => !b.isPaid);
      const totalDue = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
      
      if (unpaidBills.length > 0) {
        aiResponse = `You currently have ${unpaidBills.length} unpaid bill(s) totaling $${totalDue.toFixed(2)}. I recommend paying these as soon as possible to maintain a good payment record and earn reward points!`;
      } else {
        aiResponse = `Great news! You're all caught up on your bills. Keep up the excellent payment habits to continue earning reward points!`;
      }
    } else if (lowerMessage.includes('save') || lowerMessage.includes('money')) {
      aiResponse = `Here are some personalized tips to save money: 1) Review your spending on non-essentials like entertainment and dining out. 2) Set up automatic savings transfers on payday. 3) Take advantage of your reward points for discounts. Would you like me to analyze your spending in a specific category?`;
    } else if (lowerMessage.includes('rent')) {
      if (rentPlan) {
        aiResponse = `Your current rent is $${rentPlan.monthlyRent.toFixed(2)} per month with a $${rentPlan.deposit.toFixed(2)} deposit. This is a ${rentPlan.duration}-month lease. Make sure to pay on time to earn reward points and maintain a good rental history!`;
      } else {
        aiResponse = `I don't see an active rent plan for you. Please check with your landlord to set up your rental agreement.`;
      }
    } else if (lowerMessage.includes('budget')) {
      aiResponse = `A good budgeting strategy is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Based on your expenses, I can help you analyze if you're following this ratio. Would you like me to break down your spending by category?`;
    } else if (lowerMessage.includes('point') || lowerMessage.includes('reward')) {
      aiResponse = `You currently have ${user.points || 0} reward points! You earn points by paying rent on time and staying under your monthly budget. Check out the Shop page to redeem your points for rewards and discounts!`;
    } else {
      // Default helpful response
      aiResponse = `I'm here to help with your finances! You can ask me about:\n• Your expenses and spending patterns\n• Unpaid bills and payment schedules\n• Budgeting tips and savings strategies\n• Your rent plan details\n• How to earn and use reward points\n\nWhat would you like to know?`;
    }

    // Create AI message
    const assistantMessage: ChatMessage = {
      id: `mock-msg-${Date.now()}-assistant`,
      conversationId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date(Date.now() + 100).toISOString(), // Slightly after user message
    };
    mockMessages.push(assistantMessage);

    // Update conversation timestamp
    conversation.updatedAt = new Date().toISOString();

    return {
      userMessage,
      assistantMessage,
    };
  },

  updateConversation: async (conversationId: string, title: string): Promise<Conversation> => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');

    const conversation = mockConversations.find(c => c.id === conversationId && c.userId === user.id);
    if (!conversation) throw new Error('Conversation not found');

    conversation.title = title;
    conversation.updatedAt = new Date().toISOString();

    return conversation;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await delay();
    const user = getCurrentMockUser();
    if (!user) throw new Error('Not authenticated');

    const index = mockConversations.findIndex(c => c.id === conversationId && c.userId === user.id);
    if (index === -1) throw new Error('Conversation not found');

    mockConversations.splice(index, 1);
    
    // Delete all messages in this conversation
    const messageIndices = mockMessages
      .map((m, i) => (m.conversationId === conversationId ? i : -1))
      .filter(i => i !== -1)
      .reverse(); // Delete from end to start to maintain indices
    
    messageIndices.forEach(i => mockMessages.splice(i, 1));
  },
};
