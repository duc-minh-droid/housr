'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert } from '@/components/UIComponents';
import { rentPlansApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Sparkles,
  Home,
} from 'lucide-react';

export default function TenantRentPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [rentPlans, setRentPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadRentPlans();

    // Check for success/cancel from Stripe redirect
    const success = searchParams?.get('success');
    const cancelled = searchParams?.get('cancelled');
    const mock = searchParams?.get('mock');

    if (success === 'true') {
      setAlert({
        type: 'success',
        message: mock ? 'Mock payment successful! Your rent plan is now active.' : 'Payment successful! Your rent plan is now active.',
      });
      // Clean up URL
      router.replace('/dashboard/tenant/rent-plan');
    } else if (cancelled === 'true') {
      setAlert({
        type: 'error',
        message: 'Payment was cancelled. You can try again anytime.',
      });
      router.replace('/dashboard/tenant/rent-plan');
    }
  }, [searchParams, router]);

  const loadRentPlans = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await rentPlansApi.getRentPlans();
      setRentPlans(data as any[]);
    } catch (error) {
      console.error('Error loading rent plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPlan = async (planId: string) => {
    setProcessingPlanId(planId);
    setAlert(null);

    try {
      // Accept plan and get Stripe checkout URL
      const response = await rentPlansApi.acceptPlan(planId);

      // Redirect to Stripe checkout
      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      } else {
        setAlert({
          type: 'error',
          message: 'Failed to initiate payment. Please try again.',
        });
        setProcessingPlanId(null);
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to accept rent plan',
      });
      setProcessingPlanId(null);
    }
  };

  const handleRejectPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to reject this rent plan proposal?')) return;

    setProcessingPlanId(planId);
    setAlert(null);

    try {
      await rentPlansApi.rejectPlan(planId);
      setAlert({
        type: 'success',
        message: 'Rent plan rejected.',
      });
      loadRentPlans();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to reject rent plan',
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            Loading rent plans...
          </div>
        </div>
      </div>
    );
  }

  const pendingPlans = rentPlans.filter((p) => p.status === 'pending');
  const acceptedPlans = rentPlans.filter((p) => p.status === 'accepted');
  const completedPlans = rentPlans.filter((p) => p.status === 'completed');
  const rejectedPlans = rentPlans.filter((p) => p.status === 'rejected');
  const activePlan = completedPlans[0]; // Most recent completed plan

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rent Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your rental agreements
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Active Rent Plan */}
      {activePlan && (
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-500 dark:border-emerald-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  Active Rental Agreement
                </h2>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  with {activePlan.landlord?.name || 'Landlord'}
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Monthly Rent
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-white">
                {formatCurrency(activePlan.monthlyRent)}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Deposit Paid
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-white">
                {formatCurrency(activePlan.deposit)}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Duration
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-white">
                {activePlan.duration} mo
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Started
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-900 dark:text-white">
                {formatDate(activePlan.completedDate || activePlan.proposedDate)}
              </p>
            </div>
          </div>

          {activePlan.description && (
            <div className="mt-4 p-3 bg-white/60 dark:bg-gray-900/20 rounded-lg">
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                <strong>Note:</strong> {activePlan.description}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-4 h-4" />
            <span>
              <strong>Pro Tip:</strong> Pay your rent on time to earn reward points!
            </span>
          </div>
        </div>
      )}

      {/* Pending Proposals */}
      {pendingPlans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📬 Pending Proposals ({pendingPlans.length})
          </h2>
          <div className="space-y-4">
            {pendingPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      Proposal from {plan.landlord?.name || 'Landlord'}
                    </h3>
                    {plan.landlord?.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.landlord.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Proposed {formatDate(plan.proposedDate)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-bold">
                    ACTION REQUIRED
                  </span>
                </div>

                {plan.description && (
                  <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{plan.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Rent</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(plan.monthlyRent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Deposit (Due Now)
                    </p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(plan.deposit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.duration} months
                    </p>
                  </div>
                  {plan.startDate && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Start Date</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatDate(plan.startDate)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Accepting this plan requires a deposit payment of{' '}
                      {formatCurrency(plan.deposit)}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-7">
                    You'll be redirected to a secure Stripe checkout page
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAcceptPlan(plan.id)}
                    disabled={processingPlanId === plan.id}
                    variant="primary"
                    fullWidth
                  >
                    <CreditCard className="w-4 h-4" />
                    {processingPlanId === plan.id
                      ? 'Processing...'
                      : `Accept & Pay ${formatCurrency(plan.deposit)}`}
                  </Button>
                  <Button
                    onClick={() => handleRejectPlan(plan.id)}
                    disabled={processingPlanId === plan.id}
                    variant="danger"
                    fullWidth
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Awaiting Payment (Accepted but not completed) */}
      {acceptedPlans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⏳ Awaiting Payment Confirmation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your payment is being processed. This usually takes a few minutes.
          </p>
          {acceptedPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-lg"
            >
              <p className="font-medium text-gray-900 dark:text-white">
                Rent Plan with {plan.landlord?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatCurrency(plan.monthlyRent)}/month • {plan.duration} months
              </p>
            </div>
          ))}
        </div>
      )}

      {/* All Plans History */}
      {rentPlans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Plan History
          </h2>
          <div className="space-y-3">
            {rentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {plan.landlord?.name || 'Landlord'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(plan.monthlyRent)}/month • {plan.duration} months
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(plan.proposedDate)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    plan.status
                  )}`}
                >
                  {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rentPlans.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-lg">
          <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Rent Plans Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Your landlord hasn't sent you any rental proposals yet.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            When they do, you'll be able to review and accept them here.
          </p>
        </div>
      )}
    </div>
  );
}
