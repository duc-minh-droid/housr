'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { expensesApi, budgetApi } from '@/lib/api';
import { Period, ExpenseSummary, Budget, Expense } from '@/types/expenses';

interface UseExpensesReturn {
  period: Period;
  setPeriod: (period: Period) => void;
  summary: ExpenseSummary | null;
  expenses: Expense[];
  budget: Budget | null;
  isLoading: boolean;
  error: string | null;
  updateBudget: (period: Period, amount: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useExpenses(initialPeriod: Period = 'month'): UseExpensesReturn {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [summaryData, expensesData, budgetData] = await Promise.all([
        expensesApi.getSummary(period).catch((err) => {
          console.error('Error fetching summary:', err);
          return { totalSpent: 0, expensesByCategory: [], timeseries: [], period };
        }),
        expensesApi.getExpenses(period).catch((err) => {
          console.error('Error fetching expenses:', err);
          return [];
        }),
        budgetApi.getBudget(period).catch((err) => {
          console.error('Error fetching budget:', err);
          return { budget: null };
        }),
      ]);

      setSummary(summaryData);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setBudget(budgetData?.budget || null);
    } catch (err: any) {
      console.error('Error fetching expenses data:', err);
      setError(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateBudget = useCallback(async (budgetPeriod: Period, amount: number) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedBudget = await budgetApi.updateBudget(budgetPeriod, amount);
      
      // Update budget state if it's for the current period
      if (budgetPeriod === period) {
        setBudget(updatedBudget.budget);
      }
      // Always refresh to ensure data is up to date
      await fetchData();
    } catch (err: any) {
      console.error('Error updating budget:', err);
      throw err;
    }
  }, [user?.id, period, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    period,
    setPeriod,
    summary,
    expenses,
    budget,
    isLoading,
    error,
    updateBudget,
    refresh,
  };
}

