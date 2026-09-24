'use client';

import { Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense } from '@/types/expenses';

interface ExpenseListItemProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

export function ExpenseListItem({ expense, onDelete }: ExpenseListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">
          {expense.description || 'No description'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(expense.date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-bold text-gray-900 dark:text-white">
          {formatCurrency(expense.amount)}
        </p>
        <button
          onClick={() => onDelete(expense.id)}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium transition-colors"
          aria-label="Delete expense"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

