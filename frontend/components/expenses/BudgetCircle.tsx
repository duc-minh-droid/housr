'use client';

import { motion } from 'framer-motion';
import { Settings, Sparkles, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/UIComponents';

interface BudgetCircleProps {
  spent: number;
  budget: number | null;
  period: 'week' | 'month' | 'all';
  onEditClick: () => void;
  onAllocateClick?: () => void;
  hasAllocation?: boolean;
}

// Calculate potential points based on budget adherence
const calculatePotentialPoints = (spent: number, budget: number, period: string): number => {
  if (!budget || spent > budget) return 0;
  
  const percentageUsed = (spent / budget) * 100;
  
  // Points tiers based on how much under budget
  if (percentageUsed < 50) return period === 'month' ? 100 : 25; // Excellent
  if (percentageUsed < 70) return period === 'month' ? 75 : 20;  // Great
  if (percentageUsed < 90) return period === 'month' ? 50 : 15;  // Good
  return period === 'month' ? 25 : 10; // Just under
};

export function BudgetCircle({ spent, budget, period, onEditClick, onAllocateClick, hasAllocation }: BudgetCircleProps) {
  const hasBudget = budget !== null && budget > 0;
  const percentage = hasBudget ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = hasBudget && spent > budget;
  const remaining = hasBudget ? Math.max(budget - spent, 0) : null;
  const potentialPoints = hasBudget ? calculatePotentialPoints(spent, budget, period) : 0;

  // Color based on percentage
  const getColor = () => {
    if (!hasBudget) return '#94a3b8'; // gray
    if (percentage < 50) return '#204E3A'; // Financr green
    if (percentage < 80) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const color = getColor();
  const circumference = 2 * Math.PI * 54; // radius = 54 (increased)
  const offset = circumference - (percentage / 100) * circumference;

  const periodLabel = period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time';

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Points Incentive Banner */}
      {hasBudget && !overBudget && potentialPoints > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-primary/20 to-primary-light/20 border border-primary/30 rounded-lg p-2 text-center"
        >
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-light" />
            <span className="text-xs font-bold text-primary-light">
              Earn {potentialPoints} pts
            </span>
          </div>
          <p className="text-[9px] text-primary-light/80 mt-0.5">
            Stay under budget!
          </p>
        </motion.div>
      )}

      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="transition-colors"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {hasBudget ? `${Math.round(percentage)}%` : '—'}
          </span>
          {hasBudget && !overBudget && (
            <div className="flex items-center gap-0.5 mt-1">
                  <TrendingDown className="w-3 h-3 text-primary" />
                  <span className="text-[9px] text-primary font-semibold">
                    On track
                  </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center space-y-1 w-full">
        {hasBudget ? (
          <>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
              {periodLabel} Budget
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(budget)}
            </div>
            {overBudget ? (
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                <span>Over by {formatCurrency(spent - budget)}</span>
              </div>
            ) : (
                    <div className="text-xs text-primary dark:text-primary-light font-semibold">
                      {formatCurrency(remaining!)} left
                    </div>
            )}
          </>
        ) : (
          <>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
              No Budget Set
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              Set a budget to earn points
            </div>
          </>
        )}
      </div>

              <div className="w-full space-y-2">
            <button
              onClick={onEditClick}
              className="w-full px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              {hasBudget ? 'Edit Budget' : 'Set Budget'}
            </button>
                
                {hasBudget && onAllocateClick && (
                  <button
                    onClick={onAllocateClick}
                    className={`w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 ${
                      hasAllocation
                        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                        : 'text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 border border-primary/30 dark:border-primary/40'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {hasAllocation ? 'Edit Allocation' : 'Allocate Budget'}
                  </button>
                )}
              </div>
            </div>
          );
        }

