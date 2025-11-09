// API Integration with Backend
import { User, Bill, Expense, RentPlan, ShopItem, Redemption } from '@/types';
import {
  isDemoTenant,
  isDemoUser,
  mockAuthApi,
  mockBillsApi,
  mockExpensesApi,
  mockRentPlansApi,
  mockRewardsApi,
  mockShopApi,
  mockDashboardApi,
  mockBudgetApi,
  mockAiChatApi,
} from './mockApi';

// Base URL for API - Port 5001 for Financr Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to check if current user is demo/mock user
const isCurrentUserMock = () => {
  if (typeof window === 'undefined') return false;
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return false;
  try {
    const user = JSON.parse(storedUser);
    return isDemoUser(user.email);
  } catch {
    return false;
  }
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const fullUrl = `${API_BASE_URL}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> || {}),
      },
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      
      try {
        // First try to get response as text
        const responseText = await response.text();
        
        // Try to parse as JSON
        if (responseText) {
          try {
            const error = JSON.parse(responseText);
            errorMessage = error.error || error.message || errorMessage;
          } catch {
            // If not JSON, use the text itself if it's not HTML
            if (!responseText.includes('<!DOCTYPE') && !responseText.includes('<html')) {
              errorMessage = responseText.substring(0, 200); // Limit length
            }
          }
        }
      } catch (parseError) {
        // If we can't read the response, use default message
        console.warn('Could not parse error response:', parseError);
      }
      
      console.error(`API Error [${options.method || 'GET'}] ${fullUrl}:`, errorMessage);
      throw new Error(errorMessage);
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return {};
    }
    
    // Try to parse response as JSON
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }
    
    try {
      return JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', responseText.substring(0, 100));
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    // Network errors or other fetch failures
    if (error instanceof Error) {
      // Check if it's a specific error type we want to handle gracefully
      if (error.message.includes('AI') || error.message.includes('generate')) {
        console.warn('AI service temporarily unavailable:', error.message);
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      }
      throw error;
    }
    throw new Error('Network request failed');
  }
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    // Use mock API for demo/mock users
    if (isDemoUser(email)) {
      return mockAuthApi.login(email, password);
    }
    
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { token: data.token, user: data.user };
  },
  
  signup: async (firstName: string, lastName: string, email: string, password: string, role: 'tenant' | 'landlord') => {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name: `${firstName} ${lastName}`,
        role,
      }),
    });
    return { token: data.token, user: data.user };
  },
  
  getProfile: async () => {
    // Use mock API for demo/mock users
    if (isCurrentUserMock()) {
      return mockAuthApi.getProfile();
    }
    
    const data = await fetchWithAuth('/api/auth/me');
    return data.user || data;
  },
};

// Bills API
export const billsApi = {
  getBills: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBillsApi.getBills();
    }
    
    const data = await fetchWithAuth('/api/bills');
    return data.bills || data;
  },
  
  getTenantBills: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBillsApi.getTenantBills();
    }
    
    // The backend automatically returns bills for the current user
    const data = await fetchWithAuth('/api/bills');
    return data.bills || data;
  },
  
  getLandlordBills: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBillsApi.getLandlordBills();
    }
    
    // The backend automatically returns all bills for landlords
    const data = await fetchWithAuth('/api/bills');
    return data.bills || data;
  },
  
  createBill: async (billData: {
    tenantId: string;
    type: string;
    amount: number;
    dueDate: string;
    description?: string;
  }) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBillsApi.createBill(billData);
    }
    
    const data = await fetchWithAuth('/api/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
    return data.bill || data;
  },
  
  updateBill: async (billId: string, billData: Partial<Bill>) => {
    // Not in API docs, but keeping for compatibility
    const data = await fetchWithAuth(`/api/bills/${billId}`, {
      method: 'PUT',
      body: JSON.stringify(billData),
    });
    return data.bill || data;
  },
  
  payBill: async (billId: string, paidDate?: string) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBillsApi.payBill(billId, paidDate);
    }
    
    const data = await fetchWithAuth(`/api/bills/${billId}/pay`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return data;
  },
};

// Expenses API
export const expensesApi = {
  getExpenses: async (period: 'week' | 'month' | 'all' = 'month', month?: number, year?: number) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      // For mock API, filter expenses by period
      let expenses = await mockExpensesApi.getExpenses(month, year);
      const now = new Date();
      
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        expenses = expenses.filter(e => new Date(e.date) >= weekAgo);
      } else if (period === 'month' && !month && !year) {
        expenses = expenses.filter(e => {
          const expDate = new Date(e.date);
          return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        });
      }
      
      return expenses;
    }
    
    let url = '/api/expenses';
    const params = new URLSearchParams();
    params.append('period', period);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    url += `?${params.toString()}`;
    
    const data = await fetchWithAuth(url);
    return data.expenses || data;
  },
  
  getTenantExpenses: async (month?: number, year?: number) => {
    return expensesApi.getExpenses('month', month, year);
  },
  
  createExpense: async (expenseData: {
    category: string;
    amount: number;
    date: string;
    description?: string;
  }) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockExpensesApi.createExpense(expenseData);
    }
    
    const data = await fetchWithAuth('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return data.expense || data;
  },
  
  deleteExpense: async (expenseId: string) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockExpensesApi.deleteExpense(expenseId);
    }
    
    await fetchWithAuth(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    return { success: true };
  },
  
  getSummary: async (period: 'week' | 'month' | 'all' = 'month', month?: number, year?: number) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockExpensesApi.getSummary(period, month, year);
    }
    
    let url = '/api/expenses/summary';
    const params = new URLSearchParams();
    params.append('period', period);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    url += `?${params.toString()}`;
    
    const data = await fetchWithAuth(url);
    return data;
  },
};

// Budget API
export const budgetApi = {
  getBudget: async (period: 'week' | 'month' | 'all' = 'month') => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBudgetApi.getBudget(period);
    }
    
    const params = new URLSearchParams();
    params.append('period', period);
    const data = await fetchWithAuth(`/api/budget?${params.toString()}`);
    return data;
  },
  
  updateBudget: async (
    period: 'week' | 'month' | 'all',
    amount: number,
    categoryAllocations?: Array<{ category: string; percentage: number; amount: number }>
  ) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockBudgetApi.updateBudget(period, amount, categoryAllocations);
    }
    
    const data = await fetchWithAuth('/api/budget', {
      method: 'POST',
      body: JSON.stringify({ period, amount, categoryAllocations }),
    });
    return data;
  },
};

// Rent Plans API
export const rentPlansApi = {
  getRentPlans: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRentPlansApi.getRentPlans();
    }
    
    const data = await fetchWithAuth('/api/rent-plans');
    return data.plans || data;
  },
  
  getTenantPlan: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRentPlansApi.getTenantPlan();
    }
    
    const data = await fetchWithAuth('/api/rent-plans');
    const plans = data.plans || data;
    return Array.isArray(plans) && plans.length > 0 ? plans[0] : null;
  },
  
  getLandlordPlans: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRentPlansApi.getLandlordPlans();
    }
    
    const data = await fetchWithAuth('/api/rent-plans');
    return data.plans || data;
  },
  
  // Landlord creates a rent plan for a tenant
  createPlan: async (planData: {
    tenantId: string;
    monthlyRent: number;
    deposit: number;
    duration: number;
    description?: string;
    startDate?: string;
  }) => {
    if (isCurrentUserMock()) {
      return mockRentPlansApi.createPlan(planData);
    }
    
    const data = await fetchWithAuth('/api/rent-plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
    return data.plan || data;
  },
  
  // Tenant accepts a rent plan and initiates payment
  acceptPlan: async (planId: string) => {
    if (isCurrentUserMock()) {
      return mockRentPlansApi.acceptPlan(planId);
    }
    
    const data = await fetchWithAuth(`/api/rent-plans/${planId}/accept`, {
      method: 'POST',
    });
    return data; // { sessionUrl, sessionId }
  },
  
  // Tenant rejects a rent plan
  rejectPlan: async (planId: string) => {
    if (isCurrentUserMock()) {
      return mockRentPlansApi.rejectPlan(planId);
    }
    
    const data = await fetchWithAuth(`/api/rent-plans/${planId}/reject`, {
      method: 'POST',
    });
    return data.plan || data;
  },
  
  // Landlord cancels a rent plan
  cancelPlan: async (planId: string) => {
    if (isCurrentUserMock()) {
      return mockRentPlansApi.cancelPlan(planId);
    }
    
    const data = await fetchWithAuth(`/api/rent-plans/${planId}`, {
      method: 'DELETE',
    });
    return data.plan || data;
  },
};

// Rewards API
export const rewardsApi = {
  getRewardHistory: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRewardsApi.getRewardHistory();
    }
    
    const data = await fetchWithAuth('/api/rewards');
    return data.rewards || data;
  },
  
  getBalance: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRewardsApi.getBalance();
    }
    
    const data = await fetchWithAuth('/api/rewards/balance');
    return {
      pointsEarned: data.pointsEarned || 0,
      pointsAvailable: data.pointsAvailable || 0
    };
  },
  
  getTenantPoints: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRewardsApi.getTenantPoints();
    }
    
    const data = await fetchWithAuth('/api/rewards/balance');
    return { points: data.pointsAvailable || 0 };
  },
  
  getShopItems: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRewardsApi.getShopItems();
    }
    
    const data = await fetchWithAuth('/api/shop/items');
    return data.items || data;
  },
  
  redeemItem: async (itemId: string) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRewardsApi.redeemItem(itemId);
    }
    
    const data = await fetchWithAuth(`/api/shop/items/${itemId}/redeem`, {
      method: 'POST',
    });
    return data;
  },
  
  getRedemptions: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockRewardsApi.getRedemptions();
    }
    
    const data = await fetchWithAuth('/api/shop/redemptions');
    return data.redemptions || data;
  },
};

// Shop API (alias for rewards)
export const shopApi = {
  getItems: async () => rewardsApi.getShopItems(),
  redeemItem: async (itemId: string) => rewardsApi.redeemItem(itemId),
  getRedemptions: async () => rewardsApi.getRedemptions(),
  createItem: async (itemData: {
    name: string;
    description: string;
    pointCost: number;
    imageUrl?: string;
  }) => {
    const data = await fetchWithAuth('/api/shop/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    return data.item || data;
  },
};

// Users API
export const usersApi = {
  getTenants: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const { mockUsers } = await import('./mockData');
        return mockUsers.filter(u => u.role === 'tenant' && u.landlordId === user.id);
      }
      return [];
    }
    
    const data = await fetchWithAuth('/api/users/tenants');
    return data.tenants || data;
  },
  
  getTenantDetails: async (tenantId: string) => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      // For now, return a basic structure for mock users
      return null;
    }
    
    const data = await fetchWithAuth(`/api/users/tenants/${tenantId}`);
    return data;
  },
};

// Dashboard API
export const dashboardApi = {
  getTenantDashboard: async () => {
    // Use mock API for mock users
    if (isCurrentUserMock()) {
      return mockDashboardApi.getTenantDashboard();
    }
    
    const data = await fetchWithAuth('/api/dashboard/tenant');
    return data;
  },
  
  getLandlordDashboard: async () => {
    const data = await fetchWithAuth('/api/dashboard/landlord');
    return data;
  },
};

// AI Chat API
export const aiChatApi = {
  // Create a new conversation
  createConversation: async (title?: string) => {
    if (isCurrentUserMock()) {
      return mockAiChatApi.createConversation(title);
    }

    const data = await fetchWithAuth('/api/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'New Conversation' }),
    });
    return data.conversation || data;
  },
  
  // Get all conversations for the user
  getConversations: async () => {
    if (isCurrentUserMock()) {
      return mockAiChatApi.getConversations();
    }

    const data = await fetchWithAuth('/api/ai/conversations');
    return data.conversations || data;
  },
  
  // Get a specific conversation with all messages
  getConversation: async (conversationId: string) => {
    if (isCurrentUserMock()) {
      return mockAiChatApi.getConversation(conversationId);
    }

    const data = await fetchWithAuth(`/api/ai/conversations/${conversationId}`);
    return data.conversation || data;
  },
  
  // Send a message in a conversation
  sendMessage: async (conversationId: string, message: string) => {
    if (isCurrentUserMock()) {
      return mockAiChatApi.sendMessage(conversationId, message);
    }

    const data = await fetchWithAuth(`/api/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return data;
  },
  
  // Update conversation title
  updateConversation: async (conversationId: string, title: string) => {
    if (isCurrentUserMock()) {
      return mockAiChatApi.updateConversation(conversationId, title);
    }

    const data = await fetchWithAuth(`/api/ai/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    return data.conversation || data;
  },
  
  // Delete a conversation
  deleteConversation: async (conversationId: string) => {
    if (isCurrentUserMock()) {
      return mockAiChatApi.deleteConversation(conversationId);
    }

    const data = await fetchWithAuth(`/api/ai/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    return data;
  },
};
