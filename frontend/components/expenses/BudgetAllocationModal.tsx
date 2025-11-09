'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button, Modal } from '@/components/UIComponents';

interface CategoryAllocation {
  category: string;
  percentage: number;
  amount: number;
}

interface BudgetAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBudget: number;
  categories: string[];
  existingAllocations?: CategoryAllocation[];
  onSave: (allocations: CategoryAllocation[]) => Promise<void>;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: 'bg-orange-500',
  Transportation: 'bg-blue-500',
  Entertainment: 'bg-purple-500',
  Healthcare: 'bg-red-500',
  Shopping: 'bg-green-500',
  Utilities: 'bg-yellow-500',
  Other: 'bg-gray-500',
};

export function BudgetAllocationModal({
  isOpen,
  onClose,
  totalBudget,
  categories,
  existingAllocations = [],
  onSave,
}: BudgetAllocationModalProps) {
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) return;

    // Initialize allocations
    if (existingAllocations.length > 0) {
      setAllocations(existingAllocations);
    } else {
      // Equal distribution by default
      const defaultPercentage = 100 / categories.length;
      setAllocations(
        categories.map((category) => ({
          category,
          percentage: parseFloat(defaultPercentage.toFixed(1)),
          amount: (totalBudget * defaultPercentage) / 100,
        }))
      );
    }
  }, [categories, existingAllocations, totalBudget]);

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.1;

  const handlePercentageChange = (category: string, newPercentage: number) => {
    setError(null);
    const clampedPercentage = Math.max(0, Math.min(100, newPercentage));
    
    setAllocations((prev) =>
      prev.map((a) =>
        a.category === category
          ? {
              ...a,
              percentage: clampedPercentage,
              amount: (totalBudget * clampedPercentage) / 100,
            }
          : a
      )
    );
  };

  const handleAutoBalance = () => {
    setError(null);
    const remaining = 100 - totalPercentage;
    const perCategory = remaining / allocations.length;

    setAllocations((prev) =>
      prev.map((a) => {
        const newPercentage = Math.max(0, a.percentage + perCategory);
        return {
          ...a,
          percentage: parseFloat(newPercentage.toFixed(1)),
          amount: (totalBudget * newPercentage) / 100,
        };
      })
    );
  };

  const handleSave = async () => {
    if (!isValid) {
      setError('Total percentage must equal 100%');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(allocations);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget allocation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Budget by Category">
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Total Budget
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Allocated
            </span>
            <span
              className={`text-lg font-bold ${
                isValid
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {totalPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Error or Warning */}
        <AnimatePresence>
          {!isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {totalPercentage > 100
                    ? `Over by ${(totalPercentage - 100).toFixed(1)}%`
                    : `Under by ${(100 - totalPercentage).toFixed(1)}%`}
                </p>
              </div>
              <button
                onClick={handleAutoBalance}
                className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 hover:underline"
              >
                Auto-balance
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Category Sliders */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {allocations.map((allocation) => {
            const colorClass = CATEGORY_COLORS[allocation.category] || CATEGORY_COLORS.Other;
            
            return (
              <motion.div
                key={allocation.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {allocation.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 min-w-[4rem] text-right">
                      {formatCurrency(allocation.amount)}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={allocation.percentage}
                      onChange={(e) =>
                        handlePercentageChange(allocation.category, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={allocation.percentage}
                    onChange={(e) =>
                      handlePercentageChange(allocation.category, parseFloat(e.target.value))
                    }
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, rgb(16, 185, 129) ${allocation.percentage}%, rgb(229, 231, 235) ${allocation.percentage}%)`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleSave}
            disabled={isSaving || !isValid}
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <TrendingUp className="w-5 h-5" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Allocation
              </>
            )}
          </Button>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

