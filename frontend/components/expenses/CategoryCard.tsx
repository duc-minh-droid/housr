'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, Car, Film, Heart, Pizza, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { ExpenseListItem } from './ExpenseListItem';
import { Expense } from '@/types/expenses';

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const iconClass = "w-6 h-6";
  switch (category.toLowerCase()) {
    case 'food':
      return <Pizza className={iconClass} />;
    case 'transportation':
      return <Car className={iconClass} />;
    case 'entertainment':
      return <Film className={iconClass} />;
    case 'healthcare':
      return <Heart className={iconClass} />;
    case 'shopping':
      return <ShoppingBag className={iconClass} />;
    default:
      return <Package className={iconClass} />;
  }
};

// Category color mapping
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        bar: 'bg-orange-500',
      };
    case 'transportation':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        bar: 'bg-blue-500',
      };
    case 'entertainment':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        bar: 'bg-purple-500',
      };
    case 'healthcare':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        bar: 'bg-red-500',
      };
    case 'shopping':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        bar: 'bg-green-500',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-700/20',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700',
        bar: 'bg-gray-500',
      };
  }
};

interface CategoryCardProps {
  category: string;
  total: number;
  count: number;
  percentage: number;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export function CategoryCard({
  category,
  total,
  count,
  percentage,
  expenses,
  onDeleteExpense,
}: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = getCategoryColor(category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border ${colors.border} overflow-hidden hover:shadow-lg transition-shadow`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {/* Category Icon */}
        <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text}`}>
          {getCategoryIcon(category)}
        </div>

        {/* Category Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {category}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} font-medium`}>
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(total)}
            </span>
            <div className="flex-1 max-w-xs">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${colors.bar}`}
                  />
                </div>
                <span className={`text-sm font-semibold ${colors.text} min-w-[3rem] text-right`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        {expenses.length > 0 && (
          <div className="ml-4 flex-shrink-0">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className={`w-5 h-5 ${colors.text}`} />
            </motion.div>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && expenses.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-2 border-t border-gray-200 dark:border-gray-700">
              {expenses.map((expense) => (
                <ExpenseListItem
                  key={expense.id}
                  expense={expense}
                  onDelete={onDeleteExpense}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

