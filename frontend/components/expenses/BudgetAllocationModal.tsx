'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button, Modal } from '@/components/UIComponents';
import { InteractivePieChart } from './InteractivePieChart';

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
    
    // Get current allocation for this category
    const currentAllocation = allocations.find(a => a.category === category);
    if (!currentAllocation) return;
    
    // Calculate what the new total would be
    const otherAllocationsTotal = allocations
      .filter(a => a.category !== category)
      .reduce((sum, a) => sum + a.percentage, 0);
    
    // Prevent exceeding 100% - cap at remaining available percentage
    const maxAllowed = 100 - otherAllocationsTotal;
    const clampedPercentage = Math.max(0, Math.min(maxAllowed, newPercentage));
    
    setAllocations((prev) =>
      prev.map((a) =>
        a.category === category
          ? {
              ...a,
              percentage: parseFloat(clampedPercentage.toFixed(1)),
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
                  <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10 rounded-xl p-4 border border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary dark:text-primary-light">
              Total Budget
            </span>
            <span className="text-2xl font-bold text-primary dark:text-primary-light">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary dark:text-primary-light">
              Allocated
            </span>
            <span
              className={`text-lg font-bold ${
                isValid
                  ? 'text-primary dark:text-primary-light'
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

        {/* Interactive Pie Chart */}
        <div className="py-4">
          <InteractivePieChart
            allocations={allocations}
            totalBudget={totalBudget}
            onUpdate={handlePercentageChange}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isValid}
            className="flex-1 px-5 py-3 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </button>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

