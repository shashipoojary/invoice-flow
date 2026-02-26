'use client';

import React, { useState, useMemo } from 'react';
import { X, FileText, Zap, Loader2 } from 'lucide-react';
import { Estimate } from '@/types';

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
  // Check if estimate can be converted to fast invoice (only 1 item)
  const canConvertToFast = useMemo(() => {
    if (!estimate || !estimate.items) return false;
    return estimate.items.length === 1;
  }, [estimate]);

  // Default to detailed if fast is not available
  const [invoiceType, setInvoiceType] = useState<'fast' | 'detailed'>(() => {
    return canConvertToFast ? 'fast' : 'detailed';
  });
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1); // 1=Minimal, 2=Modern, 3=Creative

  // Update invoice type if fast becomes unavailable
  React.useEffect(() => {
    if (!canConvertToFast && invoiceType === 'fast') {
      setInvoiceType('detailed');
    }
  }, [canConvertToFast, invoiceType]);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      // Set default based on whether fast is available
      setInvoiceType(canConvertToFast ? 'fast' : 'detailed');
      setSelectedTemplate(1);
    }
  }, [isOpen, canConvertToFast]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white shadow-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] transform transition-all duration-300 scale-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-blue-50 flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
              Convert Estimate to Invoice
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0 ml-2"
            disabled={isLoading}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 sm:p-4 md:p-6 bg-white overflow-y-auto flex-1">
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
            Choose the invoice type and template for estimate <span className="font-semibold">#{estimate?.estimateNumber}</span>
          </p>

          {/* Invoice Type Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Invoice Type
            </label>
            <div className={`grid gap-2 sm:gap-3 ${canConvertToFast ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Fast Invoice Option - Only show if estimate has 1 item */}
              {canConvertToFast && (
                <button
                  type="button"
                  onClick={() => setInvoiceType('fast')}
                  disabled={isLoading}
                  className={`p-3 sm:p-4 border-2 transition-all cursor-pointer ${
                    invoiceType === 'fast'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 mb-1.5 sm:mb-2">
                    <Zap className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${invoiceType === 'fast' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-sm sm:text-base font-medium ${invoiceType === 'fast' ? 'text-blue-700' : 'text-gray-700'}`}>
                      Fast Invoice
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 text-left">
                    Quick 60-second invoice with minimal details
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 text-left">
                      • Single item only<br/>
                      • No auto reminders<br/>
                      • No late fees
                    </p>
                  </div>
                </button>
              )}

              {/* Detailed Invoice Option */}
              <button
                type="button"
                onClick={() => setInvoiceType('detailed')}
                disabled={isLoading}
                className={`p-3 sm:p-4 border-2 transition-all cursor-pointer ${
                  invoiceType === 'detailed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2 mb-1.5 sm:mb-2">
                  <FileText className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${invoiceType === 'detailed' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`text-sm sm:text-base font-medium ${invoiceType === 'detailed' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Detailed Invoice
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 text-left">
                  Full-featured invoice with customizable templates
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 text-left">
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
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Choose Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(1)}
                  disabled={isLoading}
                  className={`p-2.5 sm:p-3 border-2 transition-all cursor-pointer ${
                    selectedTemplate === 1
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${selectedTemplate === 1 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Minimal
                  </div>
                  <div className="h-8 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300"></div>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">Clean & simple</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate(2)}
                  disabled={isLoading}
                  className={`p-2.5 sm:p-3 border-2 transition-all cursor-pointer ${
                    selectedTemplate === 2
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${selectedTemplate === 2 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Modern
                  </div>
                  <div className="h-8 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-300"></div>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">Professional</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate(3)}
                  disabled={isLoading}
                  className={`p-2.5 sm:p-3 border-2 transition-all cursor-pointer ${
                    selectedTemplate === 3
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${selectedTemplate === 3 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Creative
                  </div>
                  <div className="h-8 sm:h-12 bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-300"></div>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">Bold & vibrant</p>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
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

