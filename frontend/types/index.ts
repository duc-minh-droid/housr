// User types
export type UserRole = 'tenant' | 'landlord';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points?: number; // Only for tenants
  landlordId?: string; // Only for tenants
}

// Bill types
export interface Bill {
  id: string;
  tenantId: string;
  landlordId: string;
  type: 'rent' | 'utilities' | 'internet' | 'other';
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  description: string;
}

// Expense types
export interface Expense {
  id: string;
  tenantId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

// Rent plan types
export type RentPlanStatus = 'pending' | 'approved' | 'rejected';

export interface RentPlan {
  id: string;
  tenantId: string;
  landlordId: string;
  monthlyRent: number;
  deposit: number;
  duration: number; // in months
  status: RentPlanStatus;
  proposedDate: string;
  reviewedDate?: string;
}

// Reward types
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  imageUrl?: string;
}

export interface Redemption {
  id: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  pointsSpent: number;
  date: string;
}

// Payment types
export interface Payment {
  id: string;
  tenantId: string;
  billId: string;
  amount: number;
  date: string;
  isOnTime: boolean;
  pointsEarned: number;
}

// Payment History types (from new API endpoint)
export interface PaymentHistoryItem {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  description: string;
}

export interface OutstandingBill {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  description: string;
}

export interface TenantDetailsResponse {
  tenant: {
    id: string;
    name: string;
    email: string;
    points: number;
    createdAt: string;
  };
  rentPlan: {
    id: string;
    monthlyRent: number;
    deposit: number;
    duration: number;
    proposedDate: string;
    reviewedDate: string;
  } | null;
  paymentHistory: PaymentHistoryItem[];
  outstandingBills: OutstandingBill[];
  totals: {
    paid: {
      amount: number;
      count: number;
    };
    outstanding: {
      amount: number;
      count: number;
    };
  };
}

// AI Chat types
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

