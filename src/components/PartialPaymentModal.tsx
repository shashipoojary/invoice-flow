'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText, Trash2 } from 'lucide-react';
import type { Invoice } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

interface PartialPaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
  getAuthHeaders: () => Promise<HeadersInit>;
}

export default function PartialPaymentModal({
  invoice,
  isOpen,
  onClose,
  onPaymentAdded,
  getAuthHeaders
}: PartialPaymentModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [lateFeesAmount, setLateFeesAmount] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && invoice?.id) {
      fetchPayments();
    }
  }, [isOpen, invoice?.id]);

  const fetchPayments = async () => {
    if (!invoice?.id) return;
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
        setRemainingBalance(data.remainingBalance || invoice.total);
        setLateFeesAmount(data.lateFeesAmount || 0);
        setTotalPayable(data.totalPayable || invoice.total);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    // Check against total payable (including late fees), not just remaining balance
    const maxPayment = totalPayable - totalPaid;
    if (parseFloat(amount) > maxPayment) {
      alert(`Payment amount cannot exceed total payable (including late fees) of ${formatCurrency(maxPayment, invoice.currency || 'USD')}`);
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentDate,
          paymentMethod: paymentMethod || null,
          notes: notes || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Reset form
        setAmount('');
        setPaymentMethod('');
        setNotes('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        
        // Refresh payments
        await fetchPayments();
        
        // Notify parent
        onPaymentAdded();
        
        // If fully paid, close modal
        if (data.isFullyPaid) {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    setDeleting(paymentId);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}/payments?paymentId=${paymentId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        await fetchPayments();
        onPaymentAdded();
      } else {
        alert('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  const progressPercentage = invoice.total > 0 ? (totalPaid / invoice.total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Partial Payments</h2>
            <p className="text-sm text-gray-500 mt-1">Invoice #{invoice.invoiceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth custom-scrollbar">
          {/* Summary */}
          <div className="bg-gray-50 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Invoice Total</span>
              <span className="text-lg font-semibold text-gray-900">${invoice.total.toFixed(2)}</span>
            </div>
            {lateFeesAmount > 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Late Fees</span>
                <span className="text-lg font-semibold text-red-700">${lateFeesAmount.toFixed(2)}</span>
              </div>
            )}
            {lateFeesAmount > 0 && (
              <div className="flex items-center justify-between mb-2 border-t border-gray-300 pt-2">
                <span className="text-sm font-medium text-gray-700">Total Payable</span>
                <span className="text-lg font-semibold text-gray-900">${totalPayable.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Paid</span>
              <span className="text-lg font-semibold text-emerald-600">${totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Remaining Balance</span>
              <span className={`text-lg font-semibold ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-2">
              <div
                className="bg-emerald-600 h-2 transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {progressPercentage.toFixed(1)}% paid
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={totalPayable - totalPaid}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max: ${(totalPayable - totalPaid).toFixed(2)} {lateFeesAmount > 0 ? '(including late fees)' : ''}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Payment Method
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Bank Transfer, PayPal, Cash"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Optional notes about this payment"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !amount || parseFloat(amount) <= 0}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </form>

          {/* Payment History */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payments recorded yet</div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">${parseFloat(payment.amount.toString()).toFixed(2)}</span>
                        {payment.payment_method && (
                          <span className="text-xs text-gray-500">• {payment.payment_method}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(payment.payment_date).toLocaleDateString()}
                        {payment.notes && ` • ${payment.notes}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={deleting === payment.id}
                      className="p-1.5 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete payment"
                    >
                      {deleting === payment.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

