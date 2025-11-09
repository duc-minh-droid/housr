// Mock API for Demo Tenant - No backend integration required
import { User, Bill, Expense, RentPlan, ShopItem, Redemption } from '@/types';
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
  
  getSummary: async (month?: number, year?: number) => {
    await delay();
    const expenses = await mockExpensesApi.getExpenses(month, year);
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: totalSpent,
      byCategory,
      count: expenses.length,
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
