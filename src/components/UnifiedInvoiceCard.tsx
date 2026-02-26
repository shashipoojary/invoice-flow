'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, AlertTriangle, Eye, Download, Send, CheckCircle, Edit, Trash2, Info, Copy, DollarSign, Clock, XCircle } from 'lucide-react';
import InvoiceActivityDrawer from '@/components/InvoiceActivityDrawer';
import type { Invoice } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { RotatingBadges, RotatingAmountBreakdown, useSynchronizedRotation } from '@/components/RotatingComponents';
import { formatCurrency, formatCurrencyForCards } from '@/lib/currency';
import { useSettings } from '@/contexts/SettingsContext';

type DueStatus = { status: string; days: number; color: string };

export type UnifiedInvoiceCardProps = {
  invoice: Invoice;
  getStatusIcon: (status: string) => React.ReactElement;
  getDueDateStatus: (
    dueDate: string,
    invoiceStatus: string,
    paymentTerms?: { enabled: boolean; terms: string },
    updatedAt?: string
  ) => DueStatus;
  calculateDueCharges: (invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => {
    hasLateFees: boolean;
    lateFeeAmount: number;
    totalPayable: number;
    overdueDays: number;
    totalPaid: number;
    remainingBalance: number;
    isPartiallyPaid: boolean;
  };
  loadingActions: { [key: string]: boolean };
  onView: (invoice: Invoice) => void;
  onPdf: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onWriteOff?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onDuplicate?: (invoice: Invoice) => void;
  paymentData?: { totalPaid: number; remainingBalance: number } | null;
  // Bulk selection props
  isSelected?: boolean;
  onSelect?: (invoiceId: string, selected: boolean) => void;
  showCheckbox?: boolean;
  bulkActionMode?: 'none' | 'send' | 'mark-paid';
};

export function UnifiedInvoiceCard({
  invoice,
  getStatusIcon,
  getDueDateStatus,
  calculateDueCharges,
  loadingActions,
  onView,
  onPdf,
  onSend,
  onMarkPaid,
  onWriteOff,
  onEdit,
  onDelete,
  onDuplicate,
  paymentData: propPaymentData,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  bulkActionMode = 'none',
}: UnifiedInvoiceCardProps) {
  const { getAuthHeaders } = useAuth();
  const [showActivity, setShowActivity] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [useCompactBadges, setUseCompactBadges] = useState(() => {
    // Only enable on small screens (mobile phones < 640px)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640; // sm breakpoint
    }
    return false;
  });
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const buttonRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const badgesContainerRef = React.useRef<HTMLDivElement>(null);
  const buttonsContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Clear timeout helper
  const clearTooltipTimeout = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };
  
  // Calculate tooltip position
  const calculateTooltipPosition = (buttonId: string) => {
    const button = buttonRefs.current[buttonId];
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 8, // Position above the button
      left: rect.left + rect.width / 2 // Center horizontally
    });
  };
  
  // Show tooltip with delay prevention
  const showTooltipWithDelay = (tooltipId: string) => {
    clearTooltipTimeout();
    calculateTooltipPosition(tooltipId);
    setShowTooltip(tooltipId);
  };
  
  // Hide tooltip with delay
  const hideTooltipWithDelay = () => {
    clearTooltipTimeout();
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(null);
      setTooltipPosition(null);
    }, 100); // Small delay to allow moving from button to tooltip
  };
  
  // Toggle tooltip on click (for mobile)
  const toggleTooltip = (tooltipId: string) => {
    clearTooltipTimeout();
    if (showTooltip === tooltipId) {
      setShowTooltip(null);
      setTooltipPosition(null);
    } else {
      calculateTooltipPosition(tooltipId);
      setShowTooltip(tooltipId);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    };
  }, []);

  // Update tooltip position on scroll/resize when tooltip is visible
  useEffect(() => {
    if (!showTooltip) return;
    
    const updatePosition = () => {
      if (showTooltip) {
        calculateTooltipPosition(showTooltip);
      }
    };
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showTooltip]);

  // Close tooltip when clicking outside (for mobile)
  useEffect(() => {
    if (!showTooltip) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      // Check if click is outside all tooltip buttons and tooltip divs
      let clickedInside = false;
      
      // Check if clicked on any badge button
      Object.values(buttonRefs.current).forEach((button) => {
        if (button && button.contains(target)) {
          clickedInside = true;
        }
      });
      
      // Check if clicked on tooltip itself (tooltips are portaled to body)
      const tooltipElements = document.querySelectorAll('[data-tooltip]');
      tooltipElements.forEach((tooltip) => {
        if (tooltip.contains(target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setShowTooltip(null);
        setTooltipPosition(null);
        clearTooltipTimeout();
      }
    };
    
    // Use capture phase to catch clicks early
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [showTooltip]);
  
  // Use payment data from props (fetched in bulk) instead of individual fetch
  const paymentData = propPaymentData || null;
  
  const dueDateStatus = getDueDateStatus(
    invoice.dueDate,
    invoice.status,
    invoice.paymentTerms,
    (invoice as any).updatedAt
  );
  const dueCharges = calculateDueCharges(invoice, paymentData);

  const displayTotal = dueCharges.totalPayable;

  const logEvent = async (type: string, metadata?: any) => {
    try {
      await fetch('/api/invoices/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, type, metadata })
      });
    } catch {}
  };

  // Prepare badges and breakdowns arrays for synchronized rotation
  // Order matters: Partial Payment badge must match Paid/Remaining breakdown
  // Overdue badge must match Base/Late fee breakdown
  // Due today badge must match Base/Late fee breakdown (if applicable)
  // Write Off badge shows when invoice has write-off amount
  // Memoize to prevent recreation on every render
  const badges = React.useMemo(() => [
    ...(dueCharges.isPartiallyPaid && invoice.status !== 'paid' ? [
      <span key="partial" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
        <DollarSign className="h-3 w-3" />
        <span>Partial Paid</span>
      </span>
    ] : []),
    ...(dueDateStatus.status === 'overdue' && invoice.status !== 'paid' ? [
      <span key="overdue" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600">
        <AlertTriangle className="h-3 w-3" />
        <span>{dueDateStatus.days > 0 ? `${dueDateStatus.days}d overdue` : 'Overdue'}</span>
      </span>
    ] : []),
    ...(dueDateStatus.status === 'due-today' && invoice.status !== 'paid' ? [
      <span key="due-today" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600">
        <Clock className="h-3 w-3" />
        <span>Due today</span>
      </span>
    ] : []),
    ...(invoice.writeOffAmount && invoice.writeOffAmount > 0 ? [
      <span key="writeoff" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600">
        <XCircle className="h-3 w-3" />
        <span>Write Off</span>
      </span>
    ] : [])
  ], [dueCharges.isPartiallyPaid, dueDateStatus.status, dueDateStatus.days, invoice.status, invoice.writeOffAmount]);

  // Prepare breakdowns - MUST match badge order for synchronization
  // Ensure complete strings are rendered atomically (no partial rendering)
  // Memoize to prevent recreation on every render
  // Create complete strings atomically to prevent staggered rendering
  const breakdowns = React.useMemo(() => {
    const items: React.ReactNode[] = [];
    
    const shouldShowPartialPayment = dueCharges.isPartiallyPaid;
    const hasWriteOff = invoice.writeOffAmount && invoice.writeOffAmount > 0;
    
    // Calculate base amount (before late fees are added)
    // When hasLateFees is true, remainingBalance includes late fees, so we need to subtract them
    const baseAmount = dueCharges.hasLateFees 
      ? dueCharges.remainingBalance - dueCharges.lateFeeAmount
      : dueCharges.remainingBalance;
    
    if (shouldShowPartialPayment) {
      // Pre-compute all values before creating string to ensure atomic rendering
      // Use baseAmount (not remainingBalance) to show correct remaining balance before late fees
      const invoiceCurrency = invoice.currency || 'USD';
      // Create complete string atomically - render as single text node to prevent partial rendering
      // Use inline-block and nowrap to prevent layout shift
      const partialText = `Paid: ${formatCurrencyForCards(dueCharges.totalPaid, invoiceCurrency)} • Remaining: ${formatCurrencyForCards(baseAmount, invoiceCurrency)}`;
      items.push(<div key="partial" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{partialText}</div>);
    }
    
    if (hasWriteOff && invoice.status === 'paid') {
      // Show paid amount and write-off amount for written-off invoices
      // Paid amount = total - write-off amount (what was actually received)
      const invoiceCurrency = invoice.currency || 'USD';
      const writeOffAmount = invoice.writeOffAmount || 0;
      const totalAmount = invoice.total || 0;
      const paidAmount = Math.max(0, totalAmount - writeOffAmount);
      const writeOffText = `Paid: ${formatCurrencyForCards(paidAmount, invoiceCurrency)} • Write-off: ${formatCurrencyForCards(writeOffAmount, invoiceCurrency)}`;
      items.push(<div key="writeoff" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{writeOffText}</div>);
    }
    
    if (dueCharges.hasLateFees) {
      // Pre-compute all values before creating string to ensure atomic rendering
      const invoiceCurrency = invoice.currency || 'USD';
      // Create complete string atomically - render as single text node to prevent partial rendering
      // Use inline-block and nowrap to prevent layout shift
      const lateFeesText = `Base ${formatCurrencyForCards(baseAmount, invoiceCurrency)} • Late fee ${formatCurrencyForCards(dueCharges.lateFeeAmount, invoiceCurrency)}`;
      items.push(<div key="latefees" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{lateFeesText}</div>);
    }
    
    if (!shouldShowPartialPayment && !dueCharges.hasLateFees && !hasWriteOff) {
      items.push(<div key="empty" className="min-h-[14px] sm:min-h-[16px]"></div>);
    }
    
    return items;
  }, [dueCharges.isPartiallyPaid, dueCharges.hasLateFees, dueCharges.totalPaid, dueCharges.remainingBalance, dueCharges.lateFeeAmount, invoice.status, invoice.writeOffAmount]);

  // Use Intersection Observer to only enable rotation when card is visible
  const [isVisible, setIsVisible] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Set compact badges based on screen size
  // Desktop/Tablet (>= 640px): Always show text badges
  // Mobile (< 640px): Always show dots
  React.useEffect(() => {
    const updateBadgeMode = () => {
      if (typeof window !== 'undefined') {
        const isSmallScreen = window.innerWidth < 640; // sm breakpoint
        setUseCompactBadges(isSmallScreen);
      }
    };
    
    // Initial check
    updateBadgeMode();
    
    // Update on window resize
    window.addEventListener('resize', updateBadgeMode);
    
    return () => {
      window.removeEventListener('resize', updateBadgeMode);
    };
  }, []);

  // Use shared rotation state for synchronization - use max length to ensure both rotate together
  // Only enable rotation when card is visible to improve performance
  const maxItems = Math.max(badges.length, breakdowns.length);
  const rotationState = useSynchronizedRotation(maxItems, isVisible);

  // Determine if checkbox should be shown for this invoice
  const canShowCheckbox = showCheckbox && onSelect && (
    bulkActionMode === 'none' ? invoice.status !== 'paid' : // Show all non-paid when mode is 'none' (mixed selections)
    (bulkActionMode === 'send' && (invoice.status === 'draft' || invoice.status === 'pending')) ||
    (bulkActionMode === 'mark-paid' && invoice.status !== 'paid')
  );

  const handleCardClick = (e: React.MouseEvent) => {
    if (showCheckbox && onSelect && canShowCheckbox) {
      // Don't trigger if clicking on buttons or links
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('input[type="checkbox"]')) {
        return;
      }
      onSelect(invoice.id, !isSelected);
    }
  };

  return (
    <div 
      ref={cardRef} 
      onClick={handleCardClick}
      className={`border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50 ${isSelected ? 'border-indigo-400 sm:border-indigo-600 border sm:border-2' : ''} ${showCheckbox && canShowCheckbox ? 'cursor-pointer' : ''}`}
    >
      {/* Mobile */}
      <div className="block sm:hidden p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {canShowCheckbox && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(invoice.id, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                <FileText className="h-3.5 w-3.5 text-gray-700" />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#1f2937' }}>{invoice.invoiceNumber}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>{invoice.client?.name || 'Unknown Client'}</div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div
                className={`font-semibold text-base ${
                  invoice.status === 'paid'
                    ? 'text-emerald-600'
                    : dueDateStatus.status === 'overdue'
                    ? 'text-red-600'
                    : invoice.status === 'pending' || invoice.status === 'sent'
                    ? 'text-orange-500'
                    : invoice.status === 'draft'
                    ? 'text-gray-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrencyForCards(displayTotal, invoice.currency || 'USD')}
              </div>
              <div className="mt-0 mb-0.5 text-[10px] sm:text-xs text-gray-500" style={{ minHeight: '12px' }}>
                <RotatingAmountBreakdown
                  breakdowns={breakdowns}
                  rotationState={rotationState}
                />
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{new Date(invoice.createdAt).toLocaleDateString()}</div>
            </div>
            </div>

          <div className="flex items-center justify-between gap-1 sm:gap-0.5 w-full max-w-full min-w-0">
            <div ref={badgesContainerRef} className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid'
                    ? 'text-emerald-600'
                    : invoice.status === 'pending' || invoice.status === 'sent'
                    ? 'text-orange-500'
                    : invoice.status === 'draft'
                    ? 'text-gray-600'
                    : 'text-red-600'
                }`}
              >
                {getStatusIcon(invoice.status)}
                <span className="capitalize">{invoice.status}</span>
              </span>
              {useCompactBadges ? (
                (dueCharges.isPartiallyPaid && invoice.status !== 'paid') ||
                (dueDateStatus.status === 'overdue' && invoice.status !== 'paid') ||
                (dueDateStatus.status === 'due-today' && invoice.status !== 'paid') ||
                (invoice.writeOffAmount && invoice.writeOffAmount > 0) ? (
                  <div className="flex items-center space-x-1" style={{ fontSize: 0, lineHeight: 0 }}>
                    {dueCharges.isPartiallyPaid && invoice.status !== 'paid' && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`partial-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`partial-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`partial-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`partial-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-blue-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-blue-300 transition-all"
                          aria-label="Partial Paid"
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `partial-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`partial-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`partial-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            Partial Paid
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`overdue-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`overdue-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`overdue-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`overdue-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-red-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-red-300 transition-all"
                          aria-label={dueDateStatus.days > 0 ? `${dueDateStatus.days} days overdue` : 'Overdue'}
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `overdue-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`overdue-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`overdue-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            {dueDateStatus.days > 0 ? `${dueDateStatus.days}d overdue` : 'Overdue'}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {dueDateStatus.status === 'due-today' && invoice.status !== 'paid' && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`due-today-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`due-today-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`due-today-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`due-today-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-orange-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-orange-300 transition-all"
                          aria-label="Due today"
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `due-today-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`due-today-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`due-today-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            Due today
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {invoice.writeOffAmount && invoice.writeOffAmount > 0 && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`writeoff-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`writeoff-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`writeoff-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`writeoff-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-slate-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-slate-300 transition-all"
                          aria-label="Write Off"
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `writeoff-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`writeoff-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`writeoff-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            Write Off
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                  </div>
                ) : null
              ) : badges.length > 0 ? (
                <RotatingBadges
                  badges={badges}
                  rotationState={rotationState}
                />
              ) : null}
            </div>

            <div ref={buttonsContainerRef} className="flex items-center space-x-1 flex-shrink-0 ml-1 sm:ml-0">
              <button onClick={() => { onView(invoice); logEvent('viewed_by_owner'); }} className="p-1.5 transition-colors hover:bg-gray-100" title="View">
                <Eye className="h-4 w-4 text-gray-700" />
              </button>
              <button onClick={() => setShowActivity(true)} className="p-1.5 transition-colors hover:bg-gray-100" title="Activity">
                <Info className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={() => { onPdf(invoice); logEvent('downloaded_pdf'); }}
                disabled={loadingActions[`pdf-${invoice.id}`]}
                className={`p-1.5 transition-colors hover:bg-gray-100 ${
                  loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="PDF"
              >
                {loadingActions[`pdf-${invoice.id}`] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Download className="h-4 w-4 text-gray-700" />
                )}
              </button>
              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(invoice)}
                  disabled={loadingActions[`duplicate-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${
                    loadingActions[`duplicate-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Duplicate"
                >
                  {loadingActions[`duplicate-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Copy className="h-4 w-4 text-gray-700" />
                  )}
                </button>
              )}
              {invoice.status === 'draft' && (
                <button
                  onClick={() => { onSend(invoice); logEvent('sent'); }}
                  disabled={loadingActions[`send-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${
                    loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Send"
                >
                  {loadingActions[`send-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Send className="h-4 w-4 text-gray-700" />
                  )}
                </button>
              )}
              {invoice.status === 'draft' && onEdit && (
                <button
                  onClick={() => onEdit(invoice)}
                  className="p-1.5 transition-colors hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {invoice.status === 'draft' && onDelete && (
                <button
                  onClick={() => onDelete(invoice)}
                  className="p-1.5 transition-colors hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {(invoice.status === 'pending' || invoice.status === 'sent') && (
                <>
                  {onWriteOff && (
                    <button
                      onClick={() => { onWriteOff(invoice); logEvent('writeoff_clicked'); }}
                      className="p-1.5 transition-colors hover:bg-orange-50 cursor-pointer"
                      title="Write Off"
                    >
                      <XCircle className="h-4 w-4 text-orange-600" />
                    </button>
                  )}
                  <button
                    onClick={() => { onMarkPaid(invoice); logEvent('paid'); }}
                    disabled={loadingActions[`paid-${invoice.id}`]}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${
                      loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title="Mark Paid"
                  >
                    {loadingActions[`paid-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {canShowCheckbox && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(invoice.id, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                <FileText className="h-3.5 w-3.5 text-gray-700" />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#1f2937' }}>{invoice.invoiceNumber}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>{invoice.client?.name || 'Unknown Client'}</div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div
                className={`font-semibold text-base ${
                  invoice.status === 'paid'
                    ? 'text-emerald-600'
                    : dueDateStatus.status === 'overdue'
                    ? 'text-red-600'
                    : invoice.status === 'pending' || invoice.status === 'sent'
                    ? 'text-orange-500'
                    : invoice.status === 'draft'
                    ? 'text-gray-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrencyForCards(displayTotal, invoice.currency || 'USD')}
              </div>
              <div className="mt-0 mb-0.5 text-[10px] sm:text-xs text-gray-500" style={{ minHeight: '12px' }}>
                <RotatingAmountBreakdown
                  breakdowns={breakdowns}
                  rotationState={rotationState}
                />
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{new Date(invoice.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 sm:gap-0.5 w-full max-w-full min-w-0">
            <div ref={badgesContainerRef} className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid'
                    ? 'text-emerald-600'
                    : invoice.status === 'pending' || invoice.status === 'sent'
                    ? 'text-orange-500'
                    : invoice.status === 'draft'
                    ? 'text-gray-600'
                    : 'text-red-600'
                }`}
              >
                {getStatusIcon(invoice.status)}
                <span className="capitalize">{invoice.status}</span>
              </span>
              {useCompactBadges ? (
                (dueCharges.isPartiallyPaid && invoice.status !== 'paid') ||
                (dueDateStatus.status === 'overdue' && invoice.status !== 'paid') ||
                (dueDateStatus.status === 'due-today' && invoice.status !== 'paid') ||
                (invoice.writeOffAmount && invoice.writeOffAmount > 0) ? (
                  <div className="flex items-center space-x-1" style={{ fontSize: 0, lineHeight: 0 }}>
                    {dueCharges.isPartiallyPaid && invoice.status !== 'paid' && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`partial-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`partial-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`partial-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`partial-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-blue-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-blue-300 transition-all"
                          aria-label="Partial Paid"
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `partial-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`partial-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`partial-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            Partial Paid
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`overdue-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`overdue-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`overdue-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`overdue-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-red-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-red-300 transition-all"
                          aria-label={dueDateStatus.days > 0 ? `${dueDateStatus.days} days overdue` : 'Overdue'}
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `overdue-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`overdue-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`overdue-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            {dueDateStatus.days > 0 ? `${dueDateStatus.days}d overdue` : 'Overdue'}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {dueDateStatus.status === 'due-today' && invoice.status !== 'paid' && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`due-today-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`due-today-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`due-today-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`due-today-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-orange-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-orange-300 transition-all"
                          aria-label="Due today"
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `due-today-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`due-today-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`due-today-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            Due today
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {invoice.writeOffAmount && invoice.writeOffAmount > 0 && (
                      <div className="relative">
                        <button
                          ref={(el) => { buttonRefs.current[`writeoff-${invoice.id}`] = el; }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showTooltipWithDelay(`writeoff-${invoice.id}`);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            hideTooltipWithDelay();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleTooltip(`writeoff-${invoice.id}`);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`writeoff-${invoice.id}`);
                          }}
                          className="w-2 h-2 rounded-full bg-slate-600 cursor-pointer relative flex-shrink-0 border-0 p-0 hover:ring-2 hover:ring-slate-300 transition-all"
                          aria-label="Write Off"
                          style={{ lineHeight: 0, fontSize: 0 }}
                        />
                        {showTooltip === `writeoff-${invoice.id}` && tooltipPosition && isMounted && typeof window !== 'undefined' && createPortal(
                          <div 
                            data-tooltip={`writeoff-${invoice.id}`}
                            className="fixed px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs font-medium whitespace-nowrap z-[9999] shadow-lg rounded-md"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`,
                              transform: 'translate(-50%, -100%)',
                              marginBottom: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                              setShowTooltip(`writeoff-${invoice.id}`);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              hideTooltipWithDelay();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearTooltipTimeout();
                            }}
                          >
                            Write Off
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-200"></div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white"></div>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                  </div>
                ) : null
              ) : badges.length > 0 ? (
                <RotatingBadges
                  badges={badges}
                  rotationState={rotationState}
                />
              ) : null}
            </div>
            <div ref={buttonsContainerRef} className="flex items-center space-x-1 flex-shrink-0 ml-1 sm:ml-0">
              <button onClick={() => onView(invoice)} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="View">
                <Eye className="h-4 w-4 text-gray-700" />
              </button>
              <button onClick={() => setShowActivity(true)} className="p-1.5 transition-colors hover:bg-gray-100" title="Activity">
                <Info className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={() => onPdf(invoice)}
                disabled={loadingActions[`pdf-${invoice.id}`]}
                className={`p-1.5 transition-colors hover:bg-gray-100 ${
                  loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="PDF"
              >
                {loadingActions[`pdf-${invoice.id}`] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Download className="h-4 w-4 text-gray-700" />
                )}
              </button>
              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(invoice)}
                  disabled={loadingActions[`duplicate-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${
                    loadingActions[`duplicate-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Duplicate"
                >
                  {loadingActions[`duplicate-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Copy className="h-4 w-4 text-gray-700" />
                  )}
                </button>
              )}
              {invoice.status === 'draft' && (
                <button
                  onClick={() => onSend(invoice)}
                  disabled={loadingActions[`send-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${
                    loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Send"
                >
                  {loadingActions[`send-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Send className="h-4 w-4 text-gray-700" />
                  )}
                </button>
              )}
              {invoice.status === 'draft' && onEdit && (
                <button
                  onClick={() => onEdit(invoice)}
                  className="p-1.5 transition-colors hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {invoice.status === 'draft' && onDelete && (
                <button
                  onClick={() => onDelete(invoice)}
                  className="p-1.5 transition-colors hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {(invoice.status === 'pending' || invoice.status === 'sent') && (
                <>
                  {onWriteOff && (
                    <button
                      onClick={() => onWriteOff(invoice)}
                      className="p-1.5 transition-colors hover:bg-orange-50 cursor-pointer"
                      title="Write Off"
                    >
                      <XCircle className="h-4 w-4 text-orange-600" />
                    </button>
                  )}
                  <button
                    onClick={() => onMarkPaid(invoice)}
                    disabled={loadingActions[`paid-${invoice.id}`]}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${
                      loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title="Mark Paid"
                  >
                    {loadingActions[`paid-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {isMounted && showActivity && typeof window !== 'undefined' && createPortal(
        <InvoiceActivityDrawer invoice={invoice as any} open={showActivity} onClose={() => setShowActivity(false)} />,
        document.body
      )}
    </div>
  );
}

export default UnifiedInvoiceCard;


