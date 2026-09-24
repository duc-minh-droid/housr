'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Users, 
  Mail, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usersApi, billsApi } from '@/lib/api';
import { Bill } from '@/types';

interface TenantData {
  id: string;
  name: string;
  email: string;
  username?: string;
  points: number;
  latePaymentCount?: number;
  totalPaid: number;
  totalDue: number;
  billsCount: number;
  paidBillsCount: number;
  onTimePaymentRate: number;
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
      
      const landlordTenants = await usersApi.getTenants();
      const allBills = await billsApi.getLandlordBills() as Bill[];

      const tenantsData = landlordTenants.map((tenant: any) => {
        const tenantBills = allBills.filter(b => b.tenantId === tenant.id);
        const paidBills = tenantBills.filter(b => b.isPaid);
        const unpaidBills = tenantBills.filter(b => !b.isPaid);
        
        const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);
        const totalDue = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
        
        const onTimePaymentRate = tenantBills.length > 0 
          ? (paidBills.length / tenantBills.length) * 100 
          : 0;

        return {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          username: tenant.username,
          points: tenant.points || 0,
          latePaymentCount: tenant.latePaymentCount || 0,
          totalPaid,
          totalDue,
          billsCount: tenantBills.length,
          paidBillsCount: paidBills.length,
          onTimePaymentRate,
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
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tenant.username && tenant.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-lg font-semibold text-card-text">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-card-text">Tenants</h1>
        <p className="text-card-text/70 mt-1">Manage your tenants and view their information</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-card-text/70">Total Tenants</p>
              <p className="text-2xl font-bold text-card-text">{tenants.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-card-text/70">Total Collected</p>
              <p className="text-2xl font-bold text-card-text">
                {formatCurrency(tenants.reduce((sum, t) => sum + t.totalPaid, 0))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-card-text/70">Outstanding</p>
              <p className="text-2xl font-bold text-card-text">
                {formatCurrency(tenants.reduce((sum, t) => sum + t.totalDue, 0))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-card-text/70">Avg. On-Time Rate</p>
              <p className="text-2xl font-bold text-card-text">
                {tenants.length > 0
                  ? Math.round(tenants.reduce((sum, t) => sum + t.onTimePaymentRate, 0) / tenants.length)
                  : 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card-bg border border-border rounded-2xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
          <input
            type="text"
            placeholder="Search tenants by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-card-text/20 rounded-lg text-card-text placeholder-card-text/50 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Tenants List */}
      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="bg-card-bg border border-border rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-card-text/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-card-text mb-2">No tenants found</h3>
            <p className="text-card-text/70">
              {searchQuery ? 'Try adjusting your search criteria' : 'Tenants will appear here after they accept rent plans'}
            </p>
          </div>
        ) : (
          filteredTenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-card-bg border border-border rounded-2xl overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setSelectedTenant(selectedTenant === tenant.id ? null : tenant.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg">
                      {tenant.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-card-text">{tenant.name}</h3>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <div className="flex items-center gap-1 text-sm text-card-text/70">
                          <Mail className="w-4 h-4" />
                          {tenant.email}
                        </div>
                        {tenant.username && (
                          <div className="flex items-center gap-1 text-sm text-card-text/70">
                            @{tenant.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-card-text/70">Total Paid</p>
                      <p className="text-lg font-bold text-green-500">{formatCurrency(tenant.totalPaid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-card-text/70">Outstanding</p>
                      <p className="text-lg font-bold text-yellow-500">{formatCurrency(tenant.totalDue)}</p>
                    </div>
                    {tenant.latePaymentCount !== undefined && (
                      <div className="text-right">
                        <p className="text-sm text-card-text/70">Late Payments</p>
                        <p className={`text-lg font-bold ${tenant.latePaymentCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {tenant.latePaymentCount}
                        </p>
                      </div>
                    )}
                    {selectedTenant === tenant.id ? (
                      <ChevronUp className="w-5 h-5 text-card-text/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-card-text/50" />
                    )}
                  </div>
                </div>
              </div>

              {selectedTenant === tenant.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-white/5 p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-card-text/70">Bills</p>
                      </div>
                      <p className="text-2xl font-bold text-card-text">{tenant.billsCount}</p>
                      <p className="text-xs text-card-text/60 mt-1">{tenant.paidBillsCount} paid</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-sm font-semibold text-card-text/70">On-Time Rate</p>
                      </div>
                      <p className="text-2xl font-bold text-card-text">{Math.round(tenant.onTimePaymentRate)}%</p>
                      <p className="text-xs text-card-text/60 mt-1">Payment reliability</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                        <p className="text-sm font-semibold text-card-text/70">Reward Points</p>
                      </div>
                      <p className="text-2xl font-bold text-card-text">{tenant.points}</p>
                      <p className="text-xs text-card-text/60 mt-1">Earned for on-time payments</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
