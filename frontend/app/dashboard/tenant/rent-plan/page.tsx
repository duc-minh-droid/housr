'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal, Alert } from '@/components/UIComponents';
import { rentPlansApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export default function TenantRentPlanPage() {
  const { user } = useAuth();
  const [rentPlan, setRentPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [landlordId, setLandlordId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRentPlan();
  }, [user]);

  const loadRentPlan = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await rentPlansApi.getTenantPlan();
      setRentPlan(data);
    } catch (error) {
      console.error('Error loading rent plan:', error);
      setRentPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);
    
    if (!user?.id) {
      setAlert({ type: 'error', message: 'User not authenticated' });
      setIsSubmitting(false);
      return;
    }
    
    try {
      await rentPlansApi.createPlan({
        landlordId: landlordId,
        monthlyRent: parseFloat(monthlyRent),
        deposit: parseFloat(deposit),
        duration: parseInt(duration),
      });
      
      setAlert({ type: 'success', message: 'Rent plan submitted successfully!' });
      setIsModalOpen(false);
      resetForm();
      loadRentPlan();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to submit rent plan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMonthlyRent('');
    setDeposit('');
    setDuration('');
    setLandlordId('');
  };

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rent Plan</h1>
          <p className="text-gray-600 mt-1">Propose and manage your rental agreement</p>
        </div>
        {(!rentPlan || rentPlan.status === 'rejected') && (
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            {rentPlan ? 'Submit New Plan' : 'Propose Rent Plan'}
          </Button>
        )}
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Current Rent Plan */}
      {rentPlan ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rentPlan.status)}`}>
              {rentPlan.status.charAt(0).toUpperCase() + rentPlan.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Monthly Rent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(rentPlan.monthlyRent)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Security Deposit</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(rentPlan.deposit)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-xl font-bold text-gray-900">
                {rentPlan.duration} months
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Proposed Date</p>
              <p className="text-xl font-bold text-gray-900">
                {formatDate(rentPlan.proposedDate)}
              </p>
            </div>
          </div>

          {rentPlan.status === 'approved' && rentPlan.reviewedDate && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                ✓ Approved on {formatDate(rentPlan.reviewedDate)}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your rental agreement is active. Make sure to pay your rent on time to earn reward points!
              </p>
            </div>
          )}

          {rentPlan.status === 'rejected' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                ✗ Plan was rejected
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please submit a new rent plan with different terms.
              </p>
            </div>
          )}

          {rentPlan.status === 'pending' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                ⏳ Waiting for landlord approval
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Your landlord will review your proposal soon.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Rent Plan Yet</h2>
          <p className="text-gray-600 mb-6">
            Submit a rent plan proposal to your landlord to get started.
          </p>
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            Propose Rent Plan
          </Button>
        </div>
      )}

      {/* Propose Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Propose Rent Plan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landlord ID
            </label>
            <input
              type="text"
              value={landlordId}
              onChange={(e) => setLandlordId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your landlord's ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Rent
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="1500.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security Deposit
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="3000.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (months)
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="12"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your landlord will review this proposal. You can modify it later if needed.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsModalOpen(false);
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
