export type Period = 'week' | 'month' | 'all';

export interface ExpenseSummary {
  totalSpent: number;
  expensesByCategory: {
    category: string;
    total: number;
    count: number;
  }[];
  timeseries: {
    date: string;
    total: number;
  }[];
  period: Period;
}

export interface Budget {
  id: string;
  tenantId: string;
  period: Period;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

