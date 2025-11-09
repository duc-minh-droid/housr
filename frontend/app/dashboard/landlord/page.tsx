'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { DashboardCard, Alert, Badge } from '@/components/UIComponents';
import { billsApi, rentPlansApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, DollarSign, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [rentPlans, setRentPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const [billsData, plansData] = await Promise.all([
        billsApi.getLandlordBills().catch(() => []),
        rentPlansApi.getLandlordPlans().catch(() => []),
      ]);

      setBills(billsData);
      setRentPlans(plansData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const paidBills = bills.filter((b) => b.isPaid);
  const totalReceived = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const pendingPlans = rentPlans.filter((p) => p.status === 'pending');
  const approvedPlans = rentPlans.filter((p) => p.status === 'approved');

  // Get unique tenant count (simplified - in real app would fetch from tenants endpoint)
  const uniqueTenants = new Set(bills.map((b) => b.tenantId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}! 👋</p>
      </motion.div>

      {/* Alert for Pending Plans */}
      {pendingPlans.length > 0 && (
        <Alert
          type="info"
          message={`You have ${pendingPlans.length} rent plan(s) pending your review`}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Tenants"
          value={uniqueTenants}
          subtitle="Active tenants"
          icon={<Users className="w-8 h-8 text-blue-600" />}
          delay={0}
        />
        <DashboardCard
          title="Total Received"
          value={formatCurrency(totalReceived)}
          subtitle={`${paidBills.length} payment(s)`}
          icon={<DollarSign className="w-8 h-8 text-green-600" />}
          delay={0.1}
        />
        <DashboardCard
          title="Pending Plans"
          value={pendingPlans.length}
          subtitle="Awaiting approval"
          icon={<Clock className="w-8 h-8 text-yellow-600" />}
          delay={0.2}
        />
        <DashboardCard
          title="Active Plans"
          value={approvedPlans.length}
          subtitle="Approved plans"
          icon={<CheckCircle className="w-8 h-8 text-purple-600" />}
          delay={0.3}
        />
      </div>

      {/* Pending Rent Plans */}
      {pendingPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Rent Plan Approvals
          </h2>
          <div className="space-y-3">
            {pendingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Tenant ID: {plan.tenantId}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(plan.monthlyRent)}/month • {plan.duration} months
                  </p>
                  <p className="text-sm text-gray-600">
                    Deposit: {formatCurrency(plan.deposit)}
                  </p>
                </div>
                <Badge variant="warning">
                  Pending Review
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Recent Payments
        </h2>
        {paidBills.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No payments received yet</p>
        ) : (
          <div className="space-y-3">
            {paidBills.slice(0, 5).map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{bill.description}</p>
                    <p className="text-sm text-gray-600">
                      Tenant: {bill.tenantId} • {formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(bill.amount)}
                    </p>
                    <Badge variant="success">
                      Paid
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
