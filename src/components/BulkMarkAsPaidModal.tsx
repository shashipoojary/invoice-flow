'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Check, FileText } from 'lucide-react';
import type { Invoice } from '@/types';

interface BulkMarkAsPaidModalProps {
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethods: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
}

export default function BulkMarkAsPaidModal({
  invoices,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: BulkMarkAsPaidModalProps) {
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('');
  const [exceptionsText, setExceptionsText] = useState('');
  const [invoicePaymentMethods, setInvoicePaymentMethods] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  // Initialize payment methods when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialMethods: Record<string, string> = {};
      invoices.forEach(inv => {
        initialMethods[inv.id] = '';
      });
      setInvoicePaymentMethods(initialMethods);
      setDefaultPaymentMethod('');
      setExceptionsText('');
      // Auto-select simple mode for 5+ invoices
      setViewMode(invoices.length > 5 ? 'simple' : 'simple');
    }
  }, [isOpen, invoices]);

  // Parse exceptions text and update payment methods
  useEffect(() => {
    if (exceptionsText.trim()) {
      const lines = exceptionsText.split('\n').filter(line => line.trim());
      const updated = { ...invoicePaymentMethods };
      
      lines.forEach(line => {
        const match = line.match(/^([A-Z0-9-]+):\s*(.+)$/i);
        if (match) {
          const invoiceNumber = match[1].trim();
          const paymentMethod = match[2].trim();
          const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
          if (invoice && paymentMethod) {
            updated[invoice.id] = paymentMethod;
          }
        }
      });

      // Apply default to all invoices that don't have exceptions
      invoices.forEach(inv => {
        if (!updated[inv.id] && defaultPaymentMethod.trim()) {
          updated[inv.id] = defaultPaymentMethod;
        }
      });

      setInvoicePaymentMethods(updated);
    } else if (defaultPaymentMethod.trim()) {
      // If no exceptions, apply default to all
      const updated: Record<string, string> = {};
      invoices.forEach(inv => {
        updated[inv.id] = defaultPaymentMethod;
      });
      setInvoicePaymentMethods(updated);
    }
  }, [exceptionsText, defaultPaymentMethod]);

  // Apply default to all invoices
  const applyDefaultToAll = () => {
    if (!defaultPaymentMethod.trim()) return;
    const updated: Record<string, string> = {};
    invoices.forEach(inv => {
      updated[inv.id] = defaultPaymentMethod;
    });
    setInvoicePaymentMethods(updated);
    setExceptionsText(''); // Clear exceptions when applying default to all
  };

  // Update individual invoice payment method (for advanced view)
  const handleInvoicePaymentMethodChange = (invoiceId: string, value: string) => {
    setInvoicePaymentMethods(prev => ({
      ...prev,
      [invoiceId]: value
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all invoices have payment methods
    const missingMethods = invoices.filter(inv => !invoicePaymentMethods[inv.id]?.trim());
    if (missingMethods.length > 0) {
      alert(`Please specify payment method for all invoices. Missing: ${missingMethods.map(inv => inv.invoiceNumber).join(', ')}`);
      return;
    }

    await onConfirm(invoicePaymentMethods);
  };

  const count = invoices.length;
  const invoiceNumberMap = Object.fromEntries(invoices.map(inv => [inv.id, inv.invoiceNumber]));

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
            <div className="p-2 bg-green-50">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Mark Invoices as Paid
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 bg-white">
            <p className="text-gray-600 leading-relaxed mb-4">
              Are you sure you want to mark <strong>{count} invoice{count !== 1 ? 's' : ''}</strong> as paid? Set a default payment method and specify exceptions if needed.
            </p>
            
            {/* Default Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Default Payment Method *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defaultPaymentMethod}
                  onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Bank Transfer, PayPal, Cash, Check"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={applyDefaultToAll}
                  disabled={!defaultPaymentMethod.trim() || isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Apply to All
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be used for all invoices unless you specify exceptions below
              </p>
            </div>

            {/* View Mode Toggle */}
            {count > 5 && (
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('simple')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'simple'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  Simple (Text Format)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('advanced')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'advanced'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  Advanced (Individual)
                </button>
              </div>
            )}

            {/* Simple View: Text Format for Exceptions */}
            {viewMode === 'simple' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Exceptions (Optional)
                </label>
                <textarea
                  value={exceptionsText}
                  onChange={(e) => setExceptionsText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder={`INV-001: PayPal\nINV-002: CashApp\nINV-003: Bank Transfer`}
                  rows={4}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: InvoiceNumber: PaymentMethod (one per line). Leave empty to use default for all.
                </p>
                {exceptionsText && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Preview:</strong> {Object.entries(invoicePaymentMethods).filter(([_, method]) => method).length} of {count} invoices configured
                  </div>
                )}
              </div>
            )}

            {/* Advanced View: Individual Inputs */}
            {viewMode === 'advanced' && (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {invoices.map((invoice) => (
                  <div key={invoice.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {invoice.invoiceNumber} - Payment Method *
                    </label>
                    <input
                      type="text"
                      value={invoicePaymentMethods[invoice.id] || defaultPaymentMethod}
                      onChange={(e) => handleInvoicePaymentMethodChange(invoice.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={defaultPaymentMethod || "e.g., Bank Transfer, PayPal, Cash, Check"}
                      required
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {defaultPaymentMethod && (
              <div className="mt-4 p-3 bg-gray-50 text-sm text-gray-600">
                <strong>Summary:</strong> {Object.values(invoicePaymentMethods).filter(m => m).length} of {count} invoices have payment methods assigned.
                {Object.values(invoicePaymentMethods).filter(m => !m).length > 0 && (
                  <span className="text-orange-600 ml-2">
                    {Object.values(invoicePaymentMethods).filter(m => !m).length} still need payment methods.
                  </span>
                )}
              </div>
            )}
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
              disabled={isLoading || Object.values(invoicePaymentMethods).some(m => !m?.trim())}
              className="px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Mark ${count} as Paid`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

