'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert, Modal } from '@/components/UIComponents';
import { rentPlansApi, usersApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Plus, X, FileText, Calendar, DollarSign, Clock } from 'lucide-react';

export default function LandlordRentPlansPage() {
  const { user } = useAuth();
  const [rentPlans, setRentPlans] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form state
  const [selectedTenant, setSelectedTenant] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [plansData, tenantsData] = await Promise.all([
        rentPlansApi.getLandlordPlans(),
        usersApi.getTenants(),
      ]);
      setRentPlans(plansData as any[]);
      setTenants(tenantsData as any[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      await rentPlansApi.createPlan({
        tenantId: selectedTenant,
        monthlyRent: parseFloat(monthlyRent),
        deposit: parseFloat(deposit),
        duration: parseInt(duration),
        description: description || undefined,
        startDate: startDate || undefined,
      });

      setAlert({
        type: 'success',
        message: 'Rent plan created and sent to tenant successfully!',
      });
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to create rent plan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to cancel this rent plan?')) return;

    setProcessingPlanId(planId);
    setAlert(null);

    try {
      await rentPlansApi.cancelPlan(planId);
      setAlert({
        type: 'success',
        message: 'Rent plan cancelled successfully!',
      });
      loadData();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to cancel rent plan',
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  const resetForm = () => {
    setSelectedTenant('');
    setMonthlyRent('');
    setDeposit('');
    setDuration('');
    setDescription('');
    setStartDate('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">Loading rent plans...</div>
        </div>
      </div>
    );
  }

  const pendingPlans = rentPlans.filter((p) => p.status === 'pending');
  const acceptedPlans = rentPlans.filter((p) => p.status === 'accepted');
  const completedPlans = rentPlans.filter((p) => p.status === 'completed');
  const rejectedPlans = rentPlans.filter((p) => p.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rent Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage rent plans for your tenants
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
          <Plus className="w-5 h-5" />
          Create Rent Plan
        </Button>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Pending Response</p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{pendingPlans.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Awaiting Payment</p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{acceptedPlans.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Completed</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{completedPlans.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Rejected</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">{rejectedPlans.length}</p>
        </div>
      </div>

      {/* All Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">All Rent Plans</h2>
        {rentPlans.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No rent plans yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Create your first rent plan to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rentPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {plan.tenant?.name || `Tenant: ${plan.tenantId}`}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </span>
                    </div>
                    {plan.tenant?.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{plan.tenant.email}</p>
                    )}
                    {plan.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{plan.description}</p>
                    )}
                  </div>
                  {plan.status === 'pending' && (
                    <Button
                      onClick={() => handleCancelPlan(plan.id)}
                      disabled={processingPlanId === plan.id}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                      {processingPlanId === plan.id ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Rent</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(plan.monthlyRent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Deposit</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(plan.deposit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {plan.duration} months
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Proposed</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(plan.proposedDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Rent Plan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Rent Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Tenant *
            </label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Choose a tenant...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Rent ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deposit ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (months) *
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add any additional notes about this rental agreement..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create & Send to Tenant'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
