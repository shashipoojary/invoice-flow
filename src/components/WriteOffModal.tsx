'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, FileText, AlertCircle } from 'lucide-react';
import type { Invoice } from '@/types';

interface WriteOffModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  getAuthHeaders: () => Promise<HeadersInit>;
  calculateDueCharges: (invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => {
    hasLateFees: boolean;
    lateFeeAmount: number;
    totalPayable: number;
    overdueDays: number;
    totalPaid: number;
    remainingBalance: number;
    isPartiallyPaid: boolean;
  };
  paymentData?: { totalPaid: number; remainingBalance: number } | null;
}

export default function WriteOffModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
  getAuthHeaders,
  calculateDueCharges,
  paymentData
}: WriteOffModalProps) {
  const [writeOffAmount, setWriteOffAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalOwed, setTotalOwed] = useState(0);
  const [lateFeesAmount, setLateFeesAmount] = useState(0);

  useEffect(() => {
    if (isOpen && invoice) {
      const charges = calculateDueCharges(invoice, paymentData);
      setTotalOwed(charges.totalPayable);
      setLateFeesAmount(charges.lateFeeAmount);
      // Pre-fill with total owed amount
      setWriteOffAmount(charges.totalPayable.toFixed(2));
      setNotes('');
    }
  }, [isOpen, invoice, calculateDueCharges, paymentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!writeOffAmount || parseFloat(writeOffAmount) <= 0) {
      return;
    }

    if (parseFloat(writeOffAmount) > totalOwed) {
      alert(`Write-off amount cannot exceed total owed of $${totalOwed.toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}/writeoff`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writeOffAmount: parseFloat(writeOffAmount),
          notes: notes || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Reset form
        setWriteOffAmount('');
        setNotes('');
        
        // Notify parent
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to write off invoice');
      }
    } catch (error) {
      console.error('Error writing off invoice:', error);
      alert('Failed to write off invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const charges = calculateDueCharges(invoice, paymentData);
  const maxWriteOff = charges.totalPayable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Write Off Invoice</h2>
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
        <div className="px-6 py-4">
          {/* Summary */}
          <div className="bg-gray-50 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Invoice Total</span>
              <span className="text-lg font-semibold text-gray-900">${invoice.total.toFixed(2)}</span>
            </div>
            {charges.totalPaid > 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Paid</span>
                <span className="text-lg font-semibold text-emerald-600">${charges.totalPaid.toFixed(2)}</span>
              </div>
            )}
            {lateFeesAmount > 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Late Fees</span>
                <span className="text-lg font-semibold text-red-700">${lateFeesAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3 border-t border-gray-300 pt-2">
              <span className="text-sm font-medium text-gray-700">Total Owed</span>
              <span className="text-lg font-semibold text-orange-600">${totalOwed.toFixed(2)}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Write-off Warning</p>
                <p className="text-xs text-amber-700 mt-1">
                  Writing off an amount will mark this invoice as paid. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Write-off Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxWriteOff}
                value={writeOffAmount}
                onChange={(e) => setWriteOffAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Max: ${maxWriteOff.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Reason for write-off (e.g., Client dispute, Discount agreement, etc.)"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !writeOffAmount || parseFloat(writeOffAmount) <= 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Write Off & Mark Paid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

