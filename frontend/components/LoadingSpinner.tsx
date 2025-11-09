'use client';

import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-blue-600 border-t-transparent rounded-full`}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <LoadingSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-gray-600 dark:text-gray-400 font-medium"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3 skeleton" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3 skeleton" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 skeleton" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 skeleton" />
      </div>
    </div>
  );
}
