'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal, Alert } from '@/components/UIComponents';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDate, calculateTotal } from '@/lib/utils';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await expensesApi.getTenantExpenses() as any[];
      // Sort by date descending
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);
    
    if (!user?.id) {
      setAlert({ type: 'error', message: 'User not authenticated' });
      setIsSubmitting(false);
      return;
    }
    
    try {
      await expensesApi.createExpense({
        category,
        amount: parseFloat(amount),
        date,
        description,
      });
      
      setAlert({ type: 'success', message: 'Expense added successfully!' });
      setIsModalOpen(false);
      resetForm();
      loadExpenses();
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
      setAlert({ type: 'success', message: 'Expense deleted successfully!' });
      loadExpenses();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to delete expense' });
    }
  };

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  // Calculate monthly total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return (
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });
  const monthlyTotal = calculateTotal(monthlyExpenses);

  // Group by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track your personal expenses</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          + Add Expense
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

      {/* Monthly Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900">This Month's Expenses</h2>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          {formatCurrency(monthlyTotal)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {monthlyExpenses.length} expense(s) logged
        </p>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500">No expenses logged yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {cat} ({(items as any[]).length})
                </h3>
                <div className="space-y-2 ml-4">
                  {(items as any[]).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}
