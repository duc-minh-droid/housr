/**
 * RentEase API Client
 * Comprehensive API client for RentEase backend (port 5001)
 * Based on BACKEND_INTEGRATION.md
 */

import { User, Bill, Expense, RentPlan, ShopItem, Redemption } from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Types for API Responses
interface LoginResponse {
  token: string;
  user: User;
}

interface BillResponse {
  bill: Bill;
  reward?: {
    id: string;
    tenantId: string;
    billId: string;
    amount: number;
    pointsEarned: number;
    isOnTime: boolean;
  };
  pointsBalance?: number;
}

interface RewardBalance {
  pointsEarned: number;
  pointsAvailable: number;
}

interface ExpenseSummary {
  summary: {
    total: number;
    categories: Array<{
      category: string;
      amount: number;
    }>;
    last30Days: number;
  };
}

interface RedemptionResponse {
  redemption: Redemption;
  pointsBalance: number;
}

interface TenantDashboard {
  bills: {
    upcoming: Bill[];
    outstandingTotal: number;
  };
  expenses: {
    total: number;
    categories: Array<{
      category: string;
      amount: number;
    }>;
    last30Days: number;
  };
  rewards: {
    points: number;
  };
  redemptions: Redemption[];
}

interface LandlordDashboard {
  tenants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  bills: {
    outstandingTotal: number;
    outstandingCount: number;
  };
  rentPlans: Array<{
    id: string;
    tenant: {
      id: string;
      name: string;
    };
    monthlyRent: number;
    status: string;
  }>;
  payments: Array<{
    id: string;
    tenant: {
      id: string;
      name: string;
    };
    amount: number;
    paidDate: string;
  }>;
}

/**
 * RentEase API Client Class
 */
class RentEaseAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized - Please login again');
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      // Parse response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  // ==================== Authentication ====================

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: 'tenant' | 'landlord';
    landlordId?: string;
  }): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  // ==================== Bills ====================

  /**
   * Get all bills for current user
   */
  async getBills(): Promise<{ bills: Bill[] }> {
    return this.request<{ bills: Bill[] }>('/api/bills');
  }

  /**
   * Create a new bill (Landlord only)
   */
  async createBill(data: {
    tenantId: string;
    type: string;
    amount: number;
    dueDate: string;
    description?: string;
  }): Promise<{ bill: Bill }> {
    return this.request<{ bill: Bill }>('/api/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Pay a bill (Tenant only)
   */
  async payBill(billId: string): Promise<BillResponse> {
    return this.request<BillResponse>(`/api/bills/${billId}/pay`, {
      method: 'POST',
    });
  }

  // ==================== Expenses ====================

  /**
   * Get all expenses for current tenant
   */
  async getExpenses(): Promise<{ expenses: Expense[] }> {
    return this.request<{ expenses: Expense[] }>('/api/expenses');
  }

  /**
   * Add a new expense (Tenant only)
   */
  async createExpense(data: {
    category: string;
    amount: number;
    date: string;
    description?: string;
  }): Promise<{ expense: Expense }> {
    return this.request<{ expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an expense (Tenant only)
   */
  async deleteExpense(expenseId: string): Promise<void> {
    await this.request(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get expense summary (Tenant only)
   */
  async getExpenseSummary(): Promise<ExpenseSummary> {
    return this.request<ExpenseSummary>('/api/expenses/summary');
  }

  // ==================== Rent Plans ====================

  /**
   * Get all rent plans
   */
  async getRentPlans(): Promise<{ plans: RentPlan[] }> {
    return this.request<{ plans: RentPlan[] }>('/api/rent-plans');
  }

  /**
   * Submit a new rent plan (Tenant only)
   */
  async submitRentPlan(data: {
    landlordId: string;
    monthlyRent: number;
    deposit: number;
    duration: number;
  }): Promise<{ plan: RentPlan }> {
    return this.request<{ plan: RentPlan }>('/api/rent-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Approve a rent plan (Landlord only)
   */
  async approveRentPlan(planId: string): Promise<{ plan: RentPlan }> {
    return this.request<{ plan: RentPlan }>(`/api/rent-plans/${planId}/approve`, {
      method: 'POST',
    });
  }

  /**
   * Reject a rent plan (Landlord only)
   */
  async rejectRentPlan(planId: string): Promise<{ plan: RentPlan }> {
    return this.request<{ plan: RentPlan }>(`/api/rent-plans/${planId}/reject`, {
      method: 'POST',
    });
  }

  // ==================== Rewards ====================

  /**
   * Get reward history (Tenant only)
   */
  async getRewards(): Promise<{ rewards: any[] }> {
    return this.request<{ rewards: any[] }>('/api/rewards');
  }

  /**
   * Get reward balance (Tenant only)
   */
  async getRewardBalance(): Promise<RewardBalance> {
    return this.request<RewardBalance>('/api/rewards/balance');
  }

  // ==================== Shop ====================

  /**
   * Get all shop items
   */
  async getShopItems(): Promise<{ items: ShopItem[] }> {
    return this.request<{ items: ShopItem[] }>('/api/shop/items');
  }

  /**
   * Create a shop item (Landlord only)
   */
  async createShopItem(data: {
    name: string;
    description: string;
    pointCost: number;
    imageUrl?: string;
  }): Promise<{ item: ShopItem }> {
    return this.request<{ item: ShopItem }>('/api/shop/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Redeem a shop item (Tenant only)
   */
  async redeemShopItem(itemId: string): Promise<RedemptionResponse> {
    return this.request<RedemptionResponse>(`/api/shop/items/${itemId}/redeem`, {
      method: 'POST',
    });
  }

  /**
   * Get redemption history
   */
  async getRedemptions(): Promise<{ redemptions: Redemption[] }> {
    return this.request<{ redemptions: Redemption[] }>('/api/shop/redemptions');
  }

  // ==================== Dashboards ====================

  /**
   * Get tenant dashboard data
   */
  async getTenantDashboard(): Promise<TenantDashboard> {
    return this.request<TenantDashboard>('/api/dashboard/tenant');
  }

  /**
   * Get landlord dashboard data
   */
  async getLandlordDashboard(): Promise<LandlordDashboard> {
    return this.request<LandlordDashboard>('/api/dashboard/landlord');
  }

  // ==================== Users ====================

  /**
   * Get landlord's tenants list (Landlord only)
   */
  async getTenants(): Promise<{ tenants: User[] }> {
    return this.request<{ tenants: User[] }>('/api/users/tenants');
  }
}

// Export singleton instance
export const apiClient = new RentEaseAPIClient();

// Export class for custom instances
export default RentEaseAPIClient;
