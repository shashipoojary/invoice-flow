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
    payPerInvoice?: {
      totalInvoices: number;
      freeInvoicesUsed: number;
      freeInvoicesRemaining: number;
      chargedInvoices: number;
      totalCharged: string;
      template1DetailedInvoices?: number;
    };
  };
  reason?: string;
  limitType?: 'invoices' | 'estimates' | 'clients' | 'reminders';
  hidePayPerInvoice?: boolean;
  onBeforeRedirect?: () => void; // Callback to save form state before redirecting
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlan = 'free',
  usage,
  reason,
  limitType = 'invoices', // Default to invoices for backward compatibility
  hidePayPerInvoice = false,
  onBeforeRedirect
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
          // Close upgrade modal only - don't close parent modal
          onClose();
          // Refresh page to update subscription status
          setTimeout(() => window.location.reload(), 1000);
          return;
        } else if (data.paymentLink) {
          // Payment method setup required - save form state before redirecting
          if (onBeforeRedirect) {
            onBeforeRedirect();
          }
          // Redirect to Dodo Payment
          window.location.href = data.paymentLink;
          return;
        } else {
          throw new Error('Payment setup link not received. Please try again.');
        }
      }

      // Monthly plan requires payment - redirect to Dodo Payment
      if (data.paymentLink) {
        // Save form state before redirecting
        if (onBeforeRedirect) {
          onBeforeRedirect();
        }
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4">
      <div 
        className="bg-white border border-gray-200 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-gray-900">
              Upgrade Your Plan
            </h3>
            {reason ? (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{reason}</p>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Choose the plan that works best for your business
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Usage Info for Free Plan */}
          {currentPlan === 'free' && usage && usage.limit && (
            <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {limitType === 'invoices' && 'Invoices this month'}
                  {limitType === 'estimates' && 'Estimates this month'}
                  {limitType === 'clients' && 'Clients created'}
                  {limitType === 'reminders' && 'Reminders this month'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                  {usage.used} / {usage.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 overflow-hidden">
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
                <p className="text-xs text-red-600 mt-2">
                  {limitType === 'invoices' && "You've reached your monthly invoice limit. Upgrade to create unlimited invoices."}
                  {limitType === 'estimates' && "You've reached your estimate limit. Upgrade to create unlimited estimates."}
                  {limitType === 'clients' && "You've reached your client limit. Upgrade to create unlimited clients."}
                  {limitType === 'reminders' && "You've reached your monthly reminder limit. Upgrade for unlimited reminders."}
                </p>
              )}
            </div>
          )}

          {/* Usage Info for Pay Per Invoice Plan */}
          {currentPlan === 'pay_per_invoice' && usage && usage.payPerInvoice && (
            <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Invoices sent</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                  {usage.payPerInvoice.totalInvoices} invoice{usage.payPerInvoice.totalInvoices !== 1 ? 's' : ''}
                  {usage.payPerInvoice.chargedInvoices > 0 && (
                    <span className="text-gray-600 ml-1">(${usage.payPerInvoice.totalCharged})</span>
                  )}
                </span>
              </div>
              {(usage.payPerInvoice.freeInvoicesRemaining > 0 || (usage.payPerInvoice.template1DetailedInvoices || 0) > 0) && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Free invoices remaining</span>
                    <span className="text-xs font-medium text-green-600">
                      {usage.payPerInvoice.freeInvoicesRemaining} / 5
                    </span>
                  </div>
                  {(usage.payPerInvoice.template1DetailedInvoices || 0) > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Template 1 invoices</span>
                      <span className="text-xs font-medium text-gray-700">
                        {usage.payPerInvoice.template1DetailedInvoices} invoice{usage.payPerInvoice.template1DetailedInvoices !== 1 ? 's' : ''}
                        <span className="text-gray-600 ml-1">(free within limit, then $0.50)</span>
                      </span>
                    </div>
                  )}
                  <div className="w-full bg-gray-200 h-2 overflow-hidden">
                    <div 
                      className="h-2 bg-green-500 transition-all"
                      style={{ width: `${(usage.payPerInvoice.freeInvoicesUsed / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    🎁 First 5 invoices (fast + template 1 detailed) are free! After that, each invoice costs $0.50. {usage.payPerInvoice.freeInvoicesRemaining} free invoice{usage.payPerInvoice.freeInvoicesRemaining !== 1 ? 's' : ''} remaining.
                  </p>
                </>
              )}
              {usage.payPerInvoice.chargedInvoices > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {usage.payPerInvoice.chargedInvoices} invoice{usage.payPerInvoice.chargedInvoices !== 1 ? 's' : ''} charged at $0.50 each.
                </p>
              )}
            </div>
          )}

          {/* Plans */}
          <div className="p-4 sm:p-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${hidePayPerInvoice ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
              {/* Free Plan */}
              <div className={`border p-4 sm:p-5 transition-colors ${
                currentPlan === 'free' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="mb-4">
                  <h4 className="font-heading text-sm sm:text-base font-semibold text-gray-900 mb-2">Free</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-xl sm:text-2xl font-semibold text-gray-900">$0</span>
                    <span className="text-xs sm:text-sm text-gray-600">/forever</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>Up to 5 invoices / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>1 client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>1 estimate (convert to invoice)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>4 auto reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>1 detailed template only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>Limited customization</span>
                  </li>
                </ul>
                {currentPlan === 'free' && (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-gray-200 text-gray-500 text-center">
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
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-heading text-sm sm:text-base font-semibold text-gray-900">Monthly</h4>
                    <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Popular
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-xl sm:text-2xl font-semibold text-gray-900">$9</span>
                    <span className="text-xs sm:text-sm text-gray-600">/month</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Unlimited invoices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Unlimited clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Unlimited estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Unlimited auto reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">All templates & customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Analytics & priority support</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('monthly')}
                  disabled={loading || currentPlan === 'monthly'}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
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
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Pay Per Invoice Plan - Only show for invoice-related limits */}
              {!hidePayPerInvoice && (
              <div className={`border p-4 sm:p-5 transition-colors ${
                currentPlan === 'pay_per_invoice' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="mb-4">
                  <h4 className="font-heading text-sm sm:text-base font-semibold text-gray-900 mb-2">Pay Per Invoice</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-xl sm:text-2xl font-semibold text-gray-900">$0.50</span>
                    <span className="text-xs sm:text-sm text-gray-600">/invoice</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">Pay only when you send an invoice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">All invoice features included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">No monthly commitment</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('pay_per_invoice')}
                  disabled={loading || currentPlan === 'pay_per_invoice'}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
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
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
