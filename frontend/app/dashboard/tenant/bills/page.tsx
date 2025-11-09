'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert } from '@/components/UIComponents';
import { billsApi } from '@/lib/api';
import { formatCurrency, formatDate, isPastDue } from '@/lib/utils';

export default function TenantBillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Check for payment success/cancellation from URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';
    const isCancelled = urlParams.get('cancelled') === 'true';
    
    if (isSuccess) {
      setAlert({ type: 'success', message: 'Payment successful! Points have been added to your account.' });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/tenant/bills');
      // Immediately reload bills (payment already processed on backend)
      loadBills();
    } else if (isCancelled) {
      setAlert({ type: 'error', message: 'Payment was cancelled.' });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/tenant/bills');
      loadBills();
    } else {
      // Normal load
      loadBills();
    }
  }, [user]);

  const loadBills = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await billsApi.getTenantBills() as any[];
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayBill = async (billId: string) => {
    setPayingBillId(billId);
    setAlert(null);
    
    try {
      const response = await billsApi.payBill(billId);
      
      // Redirect to Stripe Checkout
      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      } else {
        setAlert({ type: 'error', message: 'Payment session could not be created.' });
        setPayingBillId(null);
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Payment failed. Please try again.' });
      setPayingBillId(null);
    }
  };

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-card-text">Bills</h1>
        <p className="text-card-text/70 mt-1">View and pay your bills</p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Unpaid Bills */}
      <div className="bg-card-bg rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold text-card-text mb-4">
          Unpaid Bills ({unpaidBills.length})
        </h2>
        {unpaidBills.length === 0 ? (
          <p className="text-card-text/70">No unpaid bills 🎉</p>
        ) : (
          <div className="space-y-4">
            {unpaidBills.map((bill) => (
              <div
                key={bill.id}
                className={`p-4 border-2 rounded-lg ${
                  isPastDue(bill.dueDate)
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-yellow-500/30 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-card-text">{bill.description}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          isPastDue(bill.dueDate)
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {isPastDue(bill.dueDate) ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-card-text/70 mt-1">
                      Type: {bill.type.charAt(0).toUpperCase() + bill.type.slice(1)}
                    </p>
                    <p className="text-sm text-card-text/70">
                      Due Date: {formatDate(bill.dueDate)}
                    </p>
                    <p className="text-2xl font-bold text-card-text mt-2">
                      {formatCurrency(bill.amount)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handlePayBill(bill.id)}
                    disabled={payingBillId === bill.id}
                    variant="primary"
                  >
                    {payingBillId === bill.id ? 'Processing...' : 'Pay Now'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid Bills */}
      <div className="bg-card-bg rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold text-card-text mb-4">
          Payment History ({paidBills.length})
        </h2>
        {paidBills.length === 0 ? (
          <p className="text-card-text/70">No payment history yet</p>
        ) : (
          <div className="space-y-3">
            {paidBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-white/5"
              >
                <div>
                  <p className="font-medium text-card-text">{bill.description}</p>
                  <p className="text-sm text-card-text/70">
                    Paid on: {formatDate(bill.paidDate)}
                  </p>
                  <p className="text-sm text-card-text/70">
                    Due: {formatDate(bill.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-card-text">{formatCurrency(bill.amount)}</p>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
