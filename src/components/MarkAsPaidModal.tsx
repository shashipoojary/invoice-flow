'use client';

import React, { useState } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import type { Invoice } from '@/types';

interface MarkAsPaidModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => Promise<void>;
  isLoading?: boolean;
}

export default function MarkAsPaidModal({
  invoice,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: MarkAsPaidModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white shadow-2xl border border-gray-200 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-50">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Mark Invoice as Paid
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 bg-white">
            <p className="text-gray-600 leading-relaxed mb-4">
              Are you sure you want to mark invoice <strong>{invoice.invoiceNumber}</strong> as paid? This will update the invoice status and record the payment.
            </p>
            
            {/* Payment Method Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Payment Method *
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Bank Transfer, PayPal, Cash, Check"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be recorded in the payment history
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !paymentMethod.trim()}
              className="px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Mark as Paid'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

