export interface CategoryAllocation {
  category: string;
  percentage: number;
  amount: number;
}

export interface CategoryBudget {
  id: string;
  budgetId: string;
  category: string;
  percentage: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithAllocations {
  id: string;
  tenantId: string;
  period: 'week' | 'month' | 'all';
  amount: number;
  categoryBudgets?: CategoryBudget[];
  createdAt: string;
  updatedAt: string;
}

