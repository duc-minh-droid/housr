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
    // Check for success/cancel from Stripe redirect first
    const success = searchParams?.get('success');
    const cancelled = searchParams?.get('cancelled');
    const mock = searchParams?.get('mock');

    if (success === 'true') {
      setAlert({
        type: 'success',
        message: mock ? 'Deposit paid successfully! Your rent plan is now active.' : 'Deposit paid successfully! Your rent plan is now active.',
      });
      // Clean up URL
      router.replace('/dashboard/tenant/rent-plan');
      // Force reload after delay to ensure webhook processed
      setTimeout(() => {
        loadRentPlans();
      }, 1000);
    } else if (cancelled === 'true') {
      setAlert({
        type: 'error',
        message: 'Payment was cancelled. You can try again anytime.',
      });
      router.replace('/dashboard/tenant/rent-plan');
      loadRentPlans();
    } else {
      // Normal load
      loadRentPlans();
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
          <div className="text-lg font-semibold text-card-text/70">
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
        <h1 className="text-3xl font-bold text-card-text">Rent Plan</h1>
        <p className="text-card-text/70 mt-1">
          View and manage your rental agreements
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Active Rent Plan */}
      {activePlan && (
        <div className="bg-gradient-to-br from-primary/10 to-primary-light/10 dark:from-primary/20 dark:to-primary-light/20 border-2 border-primary dark:border-primary-light rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary dark:text-primary-light">
                  Active Rental Agreement
                </h2>
                <p className="text-sm text-primary-light dark:text-primary-light">
                  with {activePlan.landlord?.name || 'Landlord'}
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <p className="text-xs font-semibold text-primary dark:text-primary-light">
                  Monthly Rent
                </p>
              </div>
              <p className="text-2xl font-bold text-primary dark:text-white">
                {formatCurrency(activePlan.monthlyRent)}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-semibold text-primary dark:text-primary-light">
                  Deposit Paid
                </p>
              </div>
              <p className="text-2xl font-bold text-primary dark:text-white">
                {formatCurrency(activePlan.deposit)}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <p className="text-xs font-semibold text-primary dark:text-primary-light">
                  Duration
                </p>
              </div>
              <p className="text-2xl font-bold text-primary dark:text-white">
                {activePlan.duration} mo
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <p className="text-xs font-semibold text-primary dark:text-primary-light">
                  Started
                </p>
              </div>
              <p className="text-sm font-bold text-primary dark:text-white">
                {formatDate(activePlan.completedDate || activePlan.proposedDate)}
              </p>
            </div>
          </div>

          {activePlan.description && (
            <div className="mt-4 p-3 bg-white/60 dark:bg-gray-900/20 rounded-lg">
              <p className="text-sm text-primary dark:text-primary-light">
                <strong>Note:</strong> {activePlan.description}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-primary-light dark:text-primary-light">
            <Sparkles className="w-4 h-4" />
            <span>
              <strong>Pro Tip:</strong> Pay your rent on time to earn reward points!
            </span>
          </div>
        </div>
      )}

      {/* Pending Proposals */}
      {pendingPlans.length > 0 && (
        <div className="bg-card-bg rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-text">Pending Proposals</h2>
              <p className="text-sm text-card-text/70">
                {pendingPlans.length} {pendingPlans.length === 1 ? 'proposal' : 'proposals'} awaiting your response
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pendingPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white/5 rounded-2xl border border-card-text/20 p-6"
              >
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-card-text/10">
                  <div>
                    <h3 className="font-bold text-lg text-card-text">
                      Proposal from {plan.landlord?.name || 'Landlord'}
                    </h3>
                    {plan.landlord?.email && (
                      <p className="text-sm text-card-text/70">
                        {plan.landlord.email}
                      </p>
                    )}
                    <p className="text-xs text-card-text/50 mt-1">
                      Proposed {formatDate(plan.proposedDate)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-bold">
                    ACTION REQUIRED
                  </span>
                </div>

                {plan.description && (
                  <div className="mb-4 p-4 bg-white/5 rounded-xl">
                    <p className="text-xs font-semibold text-card-text/70 mb-2">Terms & Notes</p>
                    <p className="text-sm text-card-text/80">{plan.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-card-text/70 mb-1">Monthly Rent</p>
                    <p className="text-xl font-bold text-card-text">
                      {formatCurrency(plan.monthlyRent)}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-card-text/70 mb-1">
                      Deposit (Due Now)
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(plan.deposit)}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-card-text/70 mb-1">Duration</p>
                    <p className="text-xl font-bold text-card-text">
                      {plan.duration} months
                    </p>
                  </div>
                  {plan.startDate && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-card-text/70 mb-1">Start Date</p>
                      <p className="text-sm font-bold text-card-text">
                        {formatDate(plan.startDate)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <p className="text-sm text-card-text">
                      <strong>Accepting requires a deposit payment of{' '}
                      {formatCurrency(plan.deposit)}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-card-text/70 mt-1 ml-7">
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
        <div className="bg-card-bg rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-text">Awaiting Payment Confirmation</h2>
              <p className="text-sm text-card-text/70">
                Your payment is being processed. This usually takes a few minutes.
              </p>
            </div>
          </div>
          {acceptedPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            >
              <p className="font-medium text-card-text">
                Rent Plan with {plan.landlord?.name}
              </p>
              <p className="text-sm text-card-text/70 mt-1">
                {formatCurrency(plan.monthlyRent)}/month • {plan.duration} months
              </p>
            </div>
          ))}
        </div>
      )}

      {/* All Plans History */}
      {rentPlans.length > 0 && (
        <div className="bg-card-bg rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-card-text mb-4">
            Plan History
          </h2>
          <div className="space-y-3">
            {rentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-card-text/20 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="font-medium text-card-text">
                    {plan.landlord?.name || 'Landlord'}
                  </p>
                  <p className="text-sm text-card-text/70">
                    {formatCurrency(plan.monthlyRent)}/month • {plan.duration} months
                  </p>
                  <p className="text-xs text-card-text/50 mt-1">
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
        <div className="bg-card-bg rounded-2xl border border-border p-12 text-center shadow-sm">
          <FileText className="w-20 h-20 text-card-text/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-card-text mb-2">
            No Rent Plans Yet
          </h2>
          <p className="text-card-text/70 mb-2">
            Your landlord hasn't sent you any rental proposals yet.
          </p>
          <p className="text-sm text-card-text/50">
            When they do, you'll be able to review and accept them here.
          </p>
        </div>
      )}
    </div>
  );
}
