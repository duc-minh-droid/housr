'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Mail, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usersApi, billsApi } from '@/lib/api';
import { mockPayments } from '@/lib/mockData';
import { User, Bill, TenantDetailsResponse } from '@/types';

interface TenantData {
  id: string;
  name: string;
  email: string;
  points: number;
  totalPaid: number;
  totalDue: number;
  billsCount: number;
  paidBillsCount: number;
  onTimePaymentRate: number;
  recentPayments: any[];
  detailedData?: TenantDetailsResponse | null;
}

export default function TenantsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTenants();
  }, [user]);

  const loadTenants = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get all tenants for this landlord from the API
      const landlordTenants = await usersApi.getTenants();
      
      // Get all bills to calculate tenant statistics
      const allBills = await billsApi.getLandlordBills() as Bill[];

      // Calculate data for each tenant
      const tenantsData = landlordTenants.map((tenant: User) => {
        const tenantBills = allBills.filter(b => b.tenantId === tenant.id);
        const paidBills = tenantBills.filter(b => b.isPaid);
        const unpaidBills = tenantBills.filter(b => !b.isPaid);
        
        const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);
        const totalDue = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
        
        const tenantPayments = mockPayments.filter(p => p.tenantId === tenant.id);
        const onTimePayments = tenantPayments.filter(p => p.isOnTime);
        const onTimePaymentRate = tenantPayments.length > 0 
          ? (onTimePayments.length / tenantPayments.length) * 100 
          : 0;
        
        // Get recent payments (last 5)
        const recentPayments = tenantPayments
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        return {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          points: tenant.points || 0,
          totalPaid,
          totalDue,
          billsCount: tenantBills.length,
          paidBillsCount: paidBills.length,
          onTimePaymentRate,
          recentPayments,
        };
      });

      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTenantDetails = async (tenantId: string) => {
    if (selectedTenant === tenantId) {
      setSelectedTenant(null);
      return;
    }
    
    setSelectedTenant(tenantId);
    
    // Fetch detailed payment history if not already loaded
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant && !tenant.detailedData) {
      try {
        const detailedData = await usersApi.getTenantDetails(tenantId);
        
        // Update the tenant with detailed data
        setTenants(prevTenants =>
          prevTenants.map(t =>
            t.id === tenantId
              ? { ...t, detailedData }
              : t
          )
        );
      } catch (error) {
        console.error('Error loading tenant details:', error);
      }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <p className="text-gray-600 mt-1">Manage your tenants and view their information</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(tenants.reduce((sum, t) => sum + t.totalPaid, 0))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(tenants.reduce((sum, t) => sum + t.totalDue, 0))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.length > 0
                  ? Math.round(
                      tenants.reduce((sum, t) => sum + t.onTimePaymentRate, 0) / tenants.length
                    )
                  : 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Tenants List */}
      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search criteria' : 'No tenants available'}
            </p>
          </div>
        ) : (
          filteredTenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Tenant Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleTenantDetails(tenant.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {tenant.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Tenant Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {tenant.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-purple-600">
                          <TrendingUp className="w-4 h-4" />
                          {tenant.points} points
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Paid</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(tenant.totalPaid)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Due</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {formatCurrency(tenant.totalDue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">On-Time</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {Math.round(tenant.onTimePaymentRate)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: selectedTenant === tenant.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  </motion.div>
                </div>
              </div>

              {/* Tenant Details (Expandable) */}
              <AnimatePresence>
                {selectedTenant === tenant.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-6 space-y-6">
                      {/* Contact Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Details
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium text-gray-900">{tenant.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tenant ID:</span>
                            <span className="text-sm font-mono text-gray-900">{tenant.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Reward Points:</span>
                            <span className="text-sm font-medium text-purple-600">{tenant.points} pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Bills Summary */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Bills Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Bills</p>
                            <p className="text-xl font-bold text-gray-900">{tenant.billsCount}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Paid Bills</p>
                            <p className="text-xl font-bold text-green-600">{tenant.paidBillsCount}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(tenant.totalPaid)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">Outstanding</p>
                            <p className="text-lg font-bold text-yellow-600">
                              {formatCurrency(tenant.totalDue)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Payment History
                        </h4>
                        {!tenant.detailedData ? (
                          <div className="bg-white rounded-lg p-6 text-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
                            />
                            <p className="text-sm text-gray-600 mt-2">Loading payment history...</p>
                          </div>
                        ) : tenant.detailedData.paymentHistory.length === 0 ? (
                          <div className="bg-white rounded-lg p-6 text-center">
                            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No payment history yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Payment Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <p className="text-xs font-medium text-green-800">Total Paid</p>
                                </div>
                                <p className="text-2xl font-bold text-green-900">
                                  {formatCurrency(tenant.detailedData.totals.paid.amount)}
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                  {tenant.detailedData.totals.paid.count} payment{tenant.detailedData.totals.paid.count !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                  <p className="text-xs font-medium text-yellow-800">Outstanding</p>
                                </div>
                                <p className="text-2xl font-bold text-yellow-900">
                                  {formatCurrency(tenant.detailedData.totals.outstanding.amount)}
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  {tenant.detailedData.totals.outstanding.count} bill{tenant.detailedData.totals.outstanding.count !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>

                            {/* Rent Plan Info */}
                            {tenant.detailedData.rentPlan && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <p className="text-sm font-semibold text-blue-900">Rent Plan</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-blue-700">Monthly Rent</p>
                                    <p className="font-bold text-blue-900">
                                      {formatCurrency(tenant.detailedData.rentPlan.monthlyRent)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-blue-700">Deposit</p>
                                    <p className="font-bold text-blue-900">
                                      {formatCurrency(tenant.detailedData.rentPlan.deposit)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-blue-700">Duration</p>
                                    <p className="font-bold text-blue-900">
                                      {tenant.detailedData.rentPlan.duration} months
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-blue-700">Approved</p>
                                    <p className="font-bold text-blue-900">
                                      {formatDate(tenant.detailedData.rentPlan.reviewedDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Outstanding Bills */}
                            {tenant.detailedData.outstandingBills.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  Outstanding Bills
                                </h5>
                                <div className="bg-white rounded-lg divide-y divide-gray-200 border border-gray-200">
                                  {tenant.detailedData.outstandingBills.map((bill) => (
                                    <div key={bill.id} className="p-3 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                          <Receipt className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {bill.type.charAt(0).toUpperCase() + bill.type.slice(1)}
                                          </p>
                                          <p className="text-xs text-gray-600">{bill.description}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-yellow-600">
                                          {formatCurrency(bill.amount)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Due: {formatDate(bill.dueDate)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Paid Bills History */}
                            <div>
                              <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" />
                                Paid Bills
                              </h5>
                              <div className="bg-white rounded-lg divide-y divide-gray-200 border border-gray-200 max-h-96 overflow-y-auto">
                                {tenant.detailedData.paymentHistory.map((payment) => (
                                  <div key={payment.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                                        </p>
                                        <p className="text-xs text-gray-600">{payment.description}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-green-600">
                                        {formatCurrency(payment.amount)}
                                      </p>
                                      <div className="text-xs text-gray-600">
                                        <p>Due: {formatDate(payment.dueDate)}</p>
                                        <p className="text-green-600 font-medium">
                                          Paid: {formatDate(payment.paidDate)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
