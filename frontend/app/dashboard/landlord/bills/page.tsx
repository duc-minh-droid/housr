'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal, Alert } from '@/components/UIComponents';
import { billsApi, usersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { User } from '@/types';

export default function LandlordBillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [tenants, setTenants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [tenantId, setTenantId] = useState('');
  const [type, setType] = useState<'rent' | 'utilities' | 'internet' | 'other'>('rent');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [billsData, tenantsData] = await Promise.all([
        billsApi.getLandlordBills() as Promise<any[]>,
        usersApi.getTenants()
      ]);
      setBills(billsData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBills = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await billsApi.getLandlordBills() as any[];
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
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
      return;
    }
    
    try {
      await billsApi.createBill({
        tenantId: tenantId,
        type: type.toUpperCase(),
        amount: parseFloat(amount),
        dueDate: dueDate,
        description: description || undefined,
      });
      
      setAlert({ type: 'success', message: 'Bill created successfully!' });
      setIsModalOpen(false);
      resetForm();
      loadBills();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to create bill' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTenantId('');
    setType('rent');
    setAmount('');
    setDueDate('');
    setDescription('');
  };

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);
  const totalReceived = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPending = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills Management</h1>
          <p className="text-gray-600 mt-1">Create and manage tenant bills</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          + Create Bill
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900">Total Received</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(totalReceived)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {paidBills.length} paid bill(s)
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900">Pending Payment</h2>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {unpaidBills.length} unpaid bill(s)
          </p>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Bills</h2>
        {bills.length === 0 ? (
          <p className="text-gray-500">No bills created yet</p>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`p-4 border-2 rounded-lg ${
                  bill.isPaid
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{bill.description}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          bill.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bill.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Tenant ID: {bill.tenantId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Type: {bill.type.charAt(0).toUpperCase() + bill.type.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(bill.dueDate)}
                      {bill.isPaid && ` • Paid: ${formatDate(bill.paidDate)}`}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Create New Bill"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant
            </label>
            {tenants.length > 0 ? (
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                No tenants found. Tenants must accept a rent plan first to appear in this list.
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Only tenants who have accepted a rent plan will appear in this list
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'rent' | 'utilities' | 'internet' | 'other')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="rent">Rent</option>
              <option value="utilities">Utilities</option>
              <option value="internet">Internet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Bill description"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Bill'}
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
