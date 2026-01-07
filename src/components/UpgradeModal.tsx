'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'free' | 'monthly' | 'pay_per_invoice';
  usage?: {
    used: number;
    limit: number | null;
    remaining: number | null;
  };
  reason?: string;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlan = 'free',
  usage,
  reason 
}: UpgradeModalProps) {
  const { user, getAuthHeaders } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: 'monthly' | 'pay_per_invoice') => {
    if (!user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      // Create payment checkout session
      const checkoutResponse = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        throw new Error(error.error || 'Failed to create payment session');
      }

      const data = await checkoutResponse.json();

      // Pay Per Invoice: Check if payment method setup is required
      if (plan === 'pay_per_invoice') {
        if (data.requiresPayment === false) {
          // Payment method already saved, plan activated
          showSuccess(data.message || `Pay Per Invoice plan activated! You will be charged $0.50 per invoice automatically.`);
          onClose();
          window.location.reload();
          return;
        } else if (data.paymentLink) {
          // Payment method setup required - redirect to Dodo Payment
          window.location.href = data.paymentLink;
          return;
        } else {
          throw new Error('Payment setup link not received. Please try again.');
        }
      }

      // Monthly plan requires payment - redirect to Dodo Payment
      if (data.paymentLink) {
        // Redirect to Dodo Payment checkout
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Payment link not received. Please try again.');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      showError(error.message || 'Failed to upgrade. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white border border-gray-200 max-w-2xl w-full shadow-xl pointer-events-auto relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-semibold" style={{color: '#1f2937'}}>
                Upgrade Your Plan
              </h3>
              {reason && (
                <p className="text-sm text-gray-600 mt-1">{reason}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Usage Info for Free Plan */}
          {currentPlan === 'free' && usage && usage.limit && (
            <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Invoices this month</span>
                <span className="text-sm font-semibold text-gray-900">
                  {usage.used} / {usage.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div 
                  className={`h-2 transition-all ${
                    usage.used >= usage.limit 
                      ? 'bg-red-500' 
                      : usage.used >= usage.limit * 0.8
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                />
              </div>
              {usage.used >= usage.limit && (
                <p className="text-xs text-red-600 mt-2">You've reached your monthly limit. Upgrade to create unlimited invoices.</p>
              )}
            </div>
          )}

          {/* Plans */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div className={`border p-4 sm:p-5 transition-colors ${
                currentPlan === 'free' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200'
              }`}>
                <div className="mb-4">
                  <h4 className="font-heading text-base font-semibold text-gray-900 mb-2">Free</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-2xl font-semibold text-gray-900">$0</span>
                    <span className="text-sm text-gray-600">/forever</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>Up to 5 invoices / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>1 client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>1 estimate (convert to invoice)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>4 auto reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>1 detailed template only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>Limited customization</span>
                  </li>
                </ul>
                {currentPlan === 'free' && (
                  <div className="w-full px-4 py-2.5 text-sm font-medium bg-gray-200 text-gray-500 text-center">
                    Current Plan
                  </div>
                )}
              </div>
              {/* Monthly Plan */}
              <div className={`border p-4 sm:p-5 transition-colors ${
                currentPlan === 'monthly' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-heading text-base font-semibold text-gray-900">Monthly</h4>
                      <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Popular
                      </span>
                    </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-2xl font-semibold text-gray-900">$9</span>
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlimited invoices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlimited clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlimited estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlimited auto reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">All templates & customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Analytics & priority support</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('monthly')}
                  disabled={loading || currentPlan === 'monthly'}
                  className={`w-full px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    currentPlan === 'monthly'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    'Processing...'
                  ) : currentPlan === 'monthly' ? (
                    'Current Plan'
                  ) : (
                    <>
                      Upgrade to Monthly
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Pay Per Invoice Plan */}
              <div className={`border p-4 sm:p-5 transition-colors ${
                currentPlan === 'pay_per_invoice' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="mb-4">
                  <h4 className="font-heading text-base font-semibold text-gray-900 mb-2">Pay Per Invoice</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-2xl font-semibold text-gray-900">$0.50</span>
                    <span className="text-sm text-gray-600">/invoice</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Pay only when you send an invoice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">All invoice features included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">No monthly commitment</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('pay_per_invoice')}
                  disabled={loading || currentPlan === 'pay_per_invoice'}
                  className={`w-full px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    currentPlan === 'pay_per_invoice'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    'Processing...'
                  ) : currentPlan === 'pay_per_invoice' ? (
                    'Current Plan'
                  ) : (
                    <>
                      Choose Pay Per Invoice
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
