'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, FileText, Zap, Loader2, Lock } from 'lucide-react';
import { Estimate } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';

interface EstimateConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (invoiceType: 'fast' | 'detailed', template?: number) => void;
  estimate: Estimate | null;
  isLoading?: boolean;
}

export default function EstimateConversionModal({
  isOpen,
  onClose,
  onConfirm,
  estimate,
  isLoading = false
}: EstimateConversionModalProps) {
  const { settings } = useSettings();
  const { getAuthHeaders } = useAuth();
  const [subscriptionUsage, setSubscriptionUsage] = useState<{ 
    plan: string; 
    templates?: { enabled: number; total: number };
    used?: number;
    limit?: number | null;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Check if estimate can be converted to fast invoice (only 1 item)
  const canConvertToFast = useMemo(() => {
    if (!estimate || !estimate.items) return false;
    // CRITICAL: Tax-registered users cannot use fast invoices
    if (settings?.isTaxRegistered === true) return false;
    return estimate.items.length === 1;
  }, [estimate, settings?.isTaxRegistered]);

  // Get available templates based on plan
  const availableTemplates = useMemo(() => {
    if (!subscriptionUsage) return { 1: true, 2: false, 3: false }; // Default to only template 1
    
    const plan = subscriptionUsage.plan || 'free';
    const templatesEnabled = subscriptionUsage.templates?.enabled || 1;
    
    if (plan === 'monthly') {
      // Monthly plan: All templates available
      return { 1: true, 2: true, 3: true };
    } else if (plan === 'pay_per_invoice') {
      // Pay Per Invoice: All templates available (may charge for premium)
      return { 1: true, 2: true, 3: true };
    } else {
      // Free plan: Only template 1
      return { 
        1: true, 
        2: templatesEnabled >= 2, 
        3: templatesEnabled >= 3 
      };
    }
  }, [subscriptionUsage]);

  // Default to detailed if fast is not available
  const [invoiceType, setInvoiceType] = useState<'fast' | 'detailed'>(() => {
    return canConvertToFast ? 'fast' : 'detailed';
  });
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1); // 1=Minimal, 2=Modern, 3=Creative

  // Fetch subscription usage when modal opens
  useEffect(() => {
    if (isOpen && !subscriptionUsage && !loadingUsage) {
      const fetchUsage = async () => {
        try {
          setLoadingUsage(true);
          const headers = await getAuthHeaders();
          const response = await fetch('/api/subscription/usage', {
            headers,
            cache: 'no-store'
          });
          if (response.ok) {
            const data = await response.json();
            setSubscriptionUsage(data);
          }
        } catch (error) {
          console.error('Error fetching subscription usage:', error);
        } finally {
          setLoadingUsage(false);
        }
      };
      fetchUsage();
    }
  }, [isOpen, subscriptionUsage, loadingUsage, getAuthHeaders]);

  // Update invoice type if fast becomes unavailable
  useEffect(() => {
    if (!canConvertToFast && invoiceType === 'fast') {
      setInvoiceType('detailed');
    }
  }, [canConvertToFast, invoiceType]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Set default based on whether fast is available
      setInvoiceType(canConvertToFast ? 'fast' : 'detailed');
      setSelectedTemplate(1);
    }
  }, [isOpen, canConvertToFast]);

  // Ensure selected template is available
  useEffect(() => {
    if (invoiceType === 'detailed' && !availableTemplates[selectedTemplate as keyof typeof availableTemplates]) {
      setSelectedTemplate(1); // Fallback to template 1 if selected template is not available
    }
  }, [invoiceType, selectedTemplate, availableTemplates]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (invoiceType === 'fast') {
      onConfirm('fast');
    } else {
      // Map UI template to PDF template: 1->6, 2->4, 3->5
      const pdfTemplate = selectedTemplate === 1 ? 6 : selectedTemplate === 2 ? 4 : 5;
      onConfirm('detailed', pdfTemplate);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInvoiceType(canConvertToFast ? 'fast' : 'detailed');
      setSelectedTemplate(1);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white shadow-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] transform transition-all duration-300 scale-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-2 rounded-full bg-blue-50 flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              Convert Estimate to Invoice
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-3"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 bg-white overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-6">
            Choose the invoice type and template for estimate <span className="font-semibold">#{estimate?.estimateNumber}</span>
          </p>

          {/* Invoice Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Invoice Type
            </label>
            <div className={`grid gap-3 ${canConvertToFast ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Fast Invoice Option - Only show if estimate has 1 item and user is not tax-registered */}
              {canConvertToFast && (
                <button
                  type="button"
                  onClick={() => setInvoiceType('fast')}
                  disabled={isLoading}
                  className={`p-4 border-2 transition-all cursor-pointer text-left relative ${
                    invoiceType === 'fast'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className={`h-5 w-5 flex-shrink-0 ${invoiceType === 'fast' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${invoiceType === 'fast' ? 'text-blue-700' : 'text-gray-700'}`}>
                      Fast Invoice
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Quick 60-second invoice with minimal details
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      • Single item only<br/>
                      • No auto reminders<br/>
                      • No late fees
                    </p>
                  </div>
                </button>
              )}

              {/* Show message if fast invoice is blocked due to tax registration */}
              {!canConvertToFast && estimate?.items && estimate.items.length === 1 && settings?.isTaxRegistered === true && (
                <div className="p-4 border-2 border-gray-200 bg-gray-50 opacity-60">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">
                      Fast Invoice (Not Available)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fast invoices are not available for tax-registered users. Please use Detailed Invoice instead.
                  </p>
                </div>
              )}

              {/* Detailed Invoice Option */}
              <button
                type="button"
                onClick={() => setInvoiceType('detailed')}
                disabled={isLoading}
                className={`p-4 border-2 transition-all cursor-pointer text-left ${
                  invoiceType === 'detailed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className={`h-5 w-5 flex-shrink-0 ${invoiceType === 'detailed' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${invoiceType === 'detailed' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Detailed Invoice
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Full-featured invoice with customizable templates
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    • Multiple items<br/>
                    • Auto reminders<br/>
                    • Late fees & custom templates
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Template Selection (only for detailed) */}
          {invoiceType === 'detailed' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Template
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(1)}
                  disabled={isLoading || !availableTemplates[1]}
                  className={`p-3 border-2 transition-all cursor-pointer relative ${
                    selectedTemplate === 1
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading || !availableTemplates[1] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {!availableTemplates[1] && (
                    <div className="absolute top-1 right-1">
                      <Lock className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                  <div className={`text-sm font-medium mb-1 ${selectedTemplate === 1 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Minimal
                  </div>
                  <div className="h-12 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300"></div>
                  <p className="text-xs text-gray-500 mt-1">Clean & simple</p>
                  {subscriptionUsage?.plan === 'free' && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Free</p>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate(2)}
                  disabled={isLoading || !availableTemplates[2]}
                  className={`p-3 border-2 transition-all cursor-pointer relative ${
                    selectedTemplate === 2
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading || !availableTemplates[2] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {!availableTemplates[2] && (
                    <div className="absolute top-1 right-1">
                      <Lock className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                  <div className={`text-sm font-medium mb-1 ${selectedTemplate === 2 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Modern
                  </div>
                  <div className="h-12 bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-300"></div>
                  <p className="text-xs text-gray-500 mt-1">Professional</p>
                  {subscriptionUsage?.plan === 'free' && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">Premium</p>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate(3)}
                  disabled={isLoading || !availableTemplates[3]}
                  className={`p-3 border-2 transition-all cursor-pointer relative ${
                    selectedTemplate === 3
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading || !availableTemplates[3] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {!availableTemplates[3] && (
                    <div className="absolute top-1 right-1">
                      <Lock className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                  <div className={`text-sm font-medium mb-1 ${selectedTemplate === 3 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Creative
                  </div>
                  <div className="h-12 bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-300"></div>
                  <p className="text-xs text-gray-500 mt-1">Bold & vibrant</p>
                  {subscriptionUsage?.plan === 'free' && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">Premium</p>
                  )}
                </button>
              </div>
              {/* Show plan restriction message */}
              {subscriptionUsage?.plan === 'free' && (
                <p className="text-xs text-gray-500 mt-2">
                  Free plan includes Minimal template only. Upgrade to unlock Modern and Creative templates.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <span>Convert to Invoice</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
