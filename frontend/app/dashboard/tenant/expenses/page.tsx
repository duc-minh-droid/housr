'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { BudgetCircle } from '@/components/expenses/BudgetCircle';
import { BudgetAllocationModal } from '@/components/expenses/BudgetAllocationModal';
import dynamic from 'next/dynamic';
import { CategoryCard } from '@/components/expenses/CategoryCard';

// Dynamically import ExpensesChart to avoid SSR issues with recharts
const ExpensesChart = dynamic(
  () => import('@/components/expenses/ExpensesChart').then((mod) => mod.ExpensesChart),
  { ssr: false }
);
import { Button, Modal, Alert } from '@/components/UIComponents';
import { expensesApi, budgetApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Period } from '@/types/expenses';
import { Expense } from '@/types/expenses';

export default function ExpensesPage() {
  const { period, setPeriod, summary, expenses, budget, isLoading, error, updateBudget, refresh } = useExpenses('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Budget form state
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<Period>(period);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

  // Update budgetPeriod when period changes
  useEffect(() => {
    setBudgetPeriod(period);
  }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);
    
    try {
      await expensesApi.createExpense({
        category,
        amount: parseFloat(amount),
        date,
        description,
      });
      
      setIsModalOpen(false);
      resetForm();
      // Force a refresh to update the UI
      await refresh();
      setAlert({ type: 'success', message: 'Expense added successfully!' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to add expense' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await expensesApi.deleteExpense(expenseId);
      // Force a refresh to update the UI
      await refresh();
      setAlert({ type: 'success', message: 'Expense deleted successfully!' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to delete expense' });
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingBudget(true);
    setAlert(null);
    
    try {
      await updateBudget(budgetPeriod, parseFloat(budgetAmount));
      setAlert({ type: 'success', message: 'Budget updated successfully!' });
      setIsBudgetModalOpen(false);
      setBudgetAmount('');
      // updateBudget already calls fetchData, so no need to call refresh again
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to update budget' });
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  const handleAllocationSave = async (allocations: Array<{ category: string; percentage: number; amount: number }>) => {
    if (!budget) return;

    try {
      await budgetApi.updateBudget(period, budget.amount, allocations);
      await refresh();
      setAlert({ type: 'success', message: 'Budget allocation updated successfully!' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to update allocation' });
      throw error;
    }
  };

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  // Group expenses by category
  const expensesByCategory = (Array.isArray(expenses) ? expenses : []).reduce((acc, expense) => {
    if (expense && expense.category) {
      if (!acc[expense.category]) {
        acc[expense.category] = [];
      }
      acc[expense.category].push(expense);
    }
    return acc;
  }, {} as Record<string, Expense[]>);

  // Calculate category percentages and sort by amount descending
  const totalSpent = summary?.totalSpent || 0;
  const categoryData = (summary?.expensesByCategory || [])
    .map((cat) => ({
      ...cat,
      percentage: totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0,
      expenses: expensesByCategory[cat.category] || [],
    }))
    .sort((a, b) => b.total - a.total); // Sort by total amount, highest first

  const periodLabel = period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time';

  // Show loading only on initial mount, not on period changes
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isLoading, hasLoaded]);

  if (isLoading && !hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">Loading expenses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your personal expenses</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          <Plus className="w-5 h-5" />
          Add Expense
        </Button>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Error from hook */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => {}}
        />
      )}

      {/* Time Filter Dropdown */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Period:
        </label>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-white appearance-none cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="all">Lifetime</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6 shadow-lg shadow-emerald-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
              This {periodLabel}'s Expenses
            </h2>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              {(Array.isArray(summary?.expensesByCategory) 
                ? summary.expensesByCategory.reduce((sum, cat) => sum + (cat.count || 0), 0)
                : expenses.length) || 0} expense(s) logged
            </p>
          </div>
          {/* Only show budget summary in header for monthly view */}
          {budget && period === 'month' && (
            <div className="text-right">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Monthly Budget</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                {formatCurrency(budget.amount)}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                {budget.amount - totalSpent > 0 
                  ? `${formatCurrency(budget.amount - totalSpent)} left`
                  : `${formatCurrency(totalSpent - budget.amount)} over`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart and Budget Side by Side (Budget only shows for Monthly) */}
      <div className={`grid grid-cols-1 gap-6 ${period === 'month' ? 'lg:grid-cols-4' : ''}`}>
        {/* Chart - Takes 3 columns when budget shown, full width otherwise */}
        <div className={`${period === 'month' ? 'lg:col-span-3' : ''} bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Spending Over Time
          </h3>
          <div className="h-80">
            <ExpensesChart
              data={Array.isArray(summary?.timeseries) ? summary.timeseries : []}
              period={period}
            />
          </div>
        </div>

                {/* Budget Circle - Only visible for Monthly period */}
                {period === 'month' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 text-center">
                      Budget Tracker
                    </h3>
                    <BudgetCircle
                      spent={totalSpent}
                      budget={budget?.amount || null}
                      period={period}
                      onEditClick={() => {
                        setBudgetPeriod(period);
                        setBudgetAmount(budget?.amount?.toString() || '');
                        setIsBudgetModalOpen(true);
                      }}
                      onAllocateClick={() => setIsAllocationModalOpen(true)}
                      hasAllocation={budget && (budget as any).categoryBudgets && (budget as any).categoryBudgets.length > 0}
                    />
                  </div>
                )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expenses by Category</h2>
        {categoryData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No expenses recorded for this period yet
            </p>
          </div>
        ) : (
          categoryData.map((category) => (
            <CategoryCard
              key={category.category}
              category={category.category}
              total={category.total}
              count={category.count}
              percentage={category.percentage}
              expenses={category.expenses}
              onDeleteExpense={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Add New Expense"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select category</option>
              <option value="Food">Food</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Shopping">Shopping</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="What did you spend on?"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetAmount('');
        }}
        title="Set Budget"
      >
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period
            </label>
            <select
              value={budgetPeriod}
              onChange={(e) => setBudgetPeriod(e.target.value as Period)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" fullWidth disabled={isUpdatingBudget}>
              {isUpdatingBudget ? 'Updating...' : 'Save Budget'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsBudgetModalOpen(false);
                setBudgetAmount('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
              </Modal>

              {/* Budget Allocation Modal */}
              {budget && budget.amount > 0 && (
                <BudgetAllocationModal
                  isOpen={isAllocationModalOpen}
                  onClose={() => setIsAllocationModalOpen(false)}
                  totalBudget={budget.amount}
                  categories={(summary?.expensesByCategory || []).map((cat) => cat.category)}
                  existingAllocations={
                    (budget as any).categoryBudgets?.map((cb: any) => ({
                      category: cb.category,
                      percentage: cb.percentage,
                      amount: cb.amount,
                    })) || []
                  }
                  onSave={handleAllocationSave}
                />
              )}
            </div>
          );
        }
