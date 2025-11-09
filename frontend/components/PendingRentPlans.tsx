'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, DollarSign, Calendar, Clock, FileText, Loader2, AlertCircle, User } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PendingPlan {
  id: string;
  landlord: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  monthlyRent: number;
  deposit: number;
  duration: number;
  description?: string;
  startDate?: string;
  proposedDate: string;
}

export function PendingRentPlans() {
  const [pendingPlans, setPendingPlans] = useState<PendingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPlans();
  }, []);

  const loadPendingPlans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/rent-plans/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading pending plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (planId: string) => {
    setProcessingPlanId(planId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rent-plans/${planId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        if (data.sessionUrl) {
          window.location.href = data.sessionUrl;
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept plan');
        setProcessingPlanId(null);
      }
    } catch (error) {
      console.error('Error accepting plan:', error);
      alert('Failed to accept plan');
      setProcessingPlanId(null);
    }
  };

  const handleReject = async (planId: string) => {
    if (!confirm('Are you sure you want to reject this rent plan?')) return;

    setProcessingPlanId(planId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rent-plans/${planId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadPendingPlans(); // Refresh list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject plan');
      }
    } catch (error) {
      console.error('Error rejecting plan:', error);
      alert('Failed to reject plan');
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-card-text/50 animate-spin" />
      </div>
    );
  }

  if (pendingPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-card-text/50" />
        </div>
        <p className="text-card-text/70">No pending rent plan requests</p>
        <p className="text-sm text-card-text/50 mt-2">
          You'll see proposals from landlords here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-card-text">Pending Requests</h3>
          <p className="text-sm text-card-text/70">
            {pendingPlans.length} {pendingPlans.length === 1 ? 'proposal' : 'proposals'} awaiting your response
          </p>
        </div>
      </div>

      {pendingPlans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white/5 rounded-2xl border border-card-text/20 p-6 space-y-4"
        >
          {/* Landlord Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-card-text/10">
            <div className="w-12 h-12 bg-primary-light/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-card-text" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-card-text text-lg">{plan.landlord.name}</p>
              <p className="text-sm text-card-text/70">@{plan.landlord.username}</p>
              <p className="text-xs text-card-text/50">{plan.landlord.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-card-text/50">Proposed</p>
              <p className="text-sm text-card-text/70">{formatDate(plan.proposedDate)}</p>
            </div>
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-card-text/70" />
                <p className="text-xs font-semibold text-card-text/70">Monthly Rent</p>
              </div>
              <p className="text-2xl font-bold text-card-text">{formatCurrency(plan.monthlyRent)}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-card-text/70" />
                <p className="text-xs font-semibold text-card-text/70">Deposit Due</p>
              </div>
              <p className="text-2xl font-bold text-card-text">{formatCurrency(plan.deposit)}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-card-text/70" />
                <p className="text-xs font-semibold text-card-text/70">Duration</p>
              </div>
              <p className="text-2xl font-bold text-card-text">{plan.duration} mo</p>
            </div>

            {plan.startDate && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-card-text/70" />
                  <p className="text-xs font-semibold text-card-text/70">Start Date</p>
                </div>
                <p className="text-sm font-bold text-card-text">{formatDate(plan.startDate)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs font-semibold text-card-text/70 mb-2">Terms & Notes</p>
              <p className="text-sm text-card-text/80">{plan.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleAccept(plan.id)}
              disabled={processingPlanId === plan.id}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingPlanId === plan.id ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Accept & Pay Deposit
                </>
              )}
            </button>

            <button
              onClick={() => handleReject(plan.id)}
              disabled={processingPlanId === plan.id}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
              Reject
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

