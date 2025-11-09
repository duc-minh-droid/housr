'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert } from '@/components/UIComponents';
import { rentPlansApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export default function LandlordRentPlansPage() {
  const { user } = useAuth();
  const [rentPlans, setRentPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadRentPlans();
  }, [user]);

  const loadRentPlans = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await rentPlansApi.getLandlordPlans() as any[];
      setRentPlans(data);
    } catch (error) {
      console.error('Error loading rent plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (planId: string, status: 'approved' | 'rejected') => {
    setProcessingPlanId(planId);
    setAlert(null);
    
    try {
      await rentPlansApi.updatePlanStatus(planId, status);
      setAlert({
        type: 'success',
        message: `Rent plan ${status} successfully!`,
      });
      loadRentPlans();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to update rent plan',
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  const pendingPlans = rentPlans.filter((p) => p.status === 'pending');
  const approvedPlans = rentPlans.filter((p) => p.status === 'approved');
  const rejectedPlans = rentPlans.filter((p) => p.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rent Plans</h1>
        <p className="text-gray-600 mt-1">Review and manage tenant rent proposals</p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingPlans.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-3xl font-bold text-green-600">{approvedPlans.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{rejectedPlans.length}</p>
        </div>
      </div>

      {/* Pending Plans */}
      {pendingPlans.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Pending Approvals ({pendingPlans.length})
          </h2>
          <div className="space-y-4">
            {pendingPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">Tenant ID: {plan.tenantId}</p>
                    <p className="text-sm text-gray-600">
                      Proposed: {formatDate(plan.proposedDate)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor('pending')}`}>
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(plan.monthlyRent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deposit</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(plan.deposit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-lg font-bold text-gray-900">
                      {plan.duration} months
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleUpdateStatus(plan.id, 'approved')}
                    disabled={processingPlanId === plan.id}
                    variant="primary"
                  >
                    {processingPlanId === plan.id ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(plan.id, 'rejected')}
                    disabled={processingPlanId === plan.id}
                    variant="danger"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Plans */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Rent Plans</h2>
        {rentPlans.length === 0 ? (
          <p className="text-gray-500">No rent plans yet</p>
        ) : (
          <div className="space-y-3">
            {rentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Tenant: {plan.tenantId}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(plan.monthlyRent)}/month • {plan.duration} months
                  </p>
                  <p className="text-sm text-gray-600">
                    Deposit: {formatCurrency(plan.deposit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Proposed: {formatDate(plan.proposedDate)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                  {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
