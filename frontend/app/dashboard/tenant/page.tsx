'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardCard, Alert, Badge } from '@/components/UIComponents';
import { LoadingPage, SkeletonCard } from '@/components/LoadingSpinner';
import { billsApi, expensesApi, rentPlansApi, rewardsApi } from '@/lib/api';
import { formatCurrency, formatDate, isPastDue } from '@/lib/utils';
import { Receipt, Wallet, Home, Gift, AlertCircle, CheckCircle, Clock, ArrowRight, TrendingUp, Calendar, Sparkles, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [rentPlan, setRentPlan] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const [billsData, expensesData, rentPlanData, pointsData] = await Promise.all([
        billsApi.getTenantBills(),
        expensesApi.getTenantExpenses(),
        rentPlansApi.getTenantPlan(),
        rewardsApi.getTenantPoints(),
      ]);

      setBills(billsData as any[]);
      setExpenses(expensesData as any[]);
      setRentPlan(rentPlanData);
      setPoints((pointsData as any).points || 0);

      // Generate alerts
      const newAlerts = [];
      const overdueBills = billsData.filter((b: any) => !b.isPaid && isPastDue(b.dueDate));
      if (overdueBills.length > 0) {
        newAlerts.push({
          type: 'error' as const,
          message: `You have ${overdueBills.length} overdue bill(s)!`,
        });
      }

      const upcomingBills = billsData.filter((b: any) => {
        if (b.isPaid) return false;
        const daysUntilDue = Math.ceil(
          (new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilDue > 0 && daysUntilDue <= 7;
      });
      if (upcomingBills.length > 0) {
        newAlerts.push({
          type: 'warning' as const,
          message: `${upcomingBills.length} bill(s) due within 7 days`,
        });
      }

      if (rentPlanData?.status === 'approved') {
        newAlerts.push({
          type: 'success' as const,
          message: 'Your rent plan has been approved!',
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const totalUnpaid = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const monthlyExpenses = expenses
    .filter((e) => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Welcome back, {user?.name}! 👋</p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                type={alert.type}
                message={alert.message}
                icon={
                  alert.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                  alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                  alert.type === 'warning' ? <Clock className="w-5 h-5" /> :
                  <Calendar className="w-5 h-5" />
                }
                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Feature Announcement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Link href="/dashboard/tenant/ai-chat">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Animated background effect */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 blur-3xl"
            />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="shrink-0">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">NEW: AI Financial Assistant</h3>
                  <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    BETA
                  </span>
                </div>
                <p className="text-blue-50 text-sm">
                  Get personalized insights about your expenses and financial habits. Chat with our AI assistant powered by Gemini 2.5 Flash!
                </p>
              </div>
              
              <div className="shrink-0 hidden sm:block">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  Try Now
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <DashboardCard
          title="Unpaid Bills"
          value={formatCurrency(totalUnpaid)}
          subtitle={`${unpaidBills.length} bill(s) pending`}
          icon={<Receipt className="w-6 h-6" />}
          delay={0}
        />
        <DashboardCard
          title="Monthly Expenses"
          value={formatCurrency(monthlyExpenses)}
          subtitle="This month"
          icon={<Wallet className="w-6 h-6" />}
          delay={0.1}
        />
        <DashboardCard
          title="Reward Points"
          value={points}
          subtitle="Available to redeem"
          icon={<Gift className="w-6 h-6" />}
          delay={0.2}
        />
        <DashboardCard
          title="Rent Plan"
          value={rentPlan?.status || 'None'}
          subtitle={rentPlan ? formatCurrency(rentPlan.monthlyRent) : 'Not submitted'}
          icon={<Home className="w-6 h-6" />}
          delay={0.3}
        />
      </div>

      {/* Recent Bills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Recent Bills
          </h2>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
        {bills.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto flex items-center justify-center mb-3">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No bills yet</p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {bills.slice(0, 5).map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-between p-3 sm:p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer bg-gray-50/50 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <motion.div
                    animate={{
                      scale: bill.isPaid ? 1 : [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: bill.isPaid ? 0 : Infinity,
                    }}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      bill.isPaid
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : isPastDue(bill.dueDate)
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}
                  >
                    {bill.isPaid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : isPastDue(bill.dueDate) ? (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{bill.description}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Due: {formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 ml-3">
                  <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{formatCurrency(bill.amount)}</p>
                  <Badge
                    variant={
                      bill.isPaid
                        ? 'success'
                        : isPastDue(bill.dueDate)
                        ? 'error'
                        : 'warning'
                    }
                  >
                    {bill.isPaid ? 'Paid' : isPastDue(bill.dueDate) ? 'Overdue' : 'Pending'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
