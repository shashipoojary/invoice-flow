'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, AlertTriangle, Eye, Download, Send, CheckCircle, Edit, Trash2, Info, Copy, DollarSign, Clock, XCircle } from 'lucide-react';
import InvoiceActivityDrawer from '@/components/InvoiceActivityDrawer';
import type { Invoice } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { RotatingBadges, RotatingAmountBreakdown, useSynchronizedRotation } from '@/components/RotatingComponents';
import { formatCurrency } from '@/lib/currency';
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

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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
        <span>{dueDateStatus.days}d overdue</span>
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
      const partialText = `Paid: ${formatCurrency(dueCharges.totalPaid, invoiceCurrency)} • Remaining: ${formatCurrency(baseAmount, invoiceCurrency)}`;
      items.push(<div key="partial" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{partialText}</div>);
    }
    
    if (hasWriteOff && invoice.status === 'paid') {
      // Show paid amount and write-off amount for written-off invoices
      // Paid amount = total - write-off amount (what was actually received)
      const writeOffAmount = invoice.writeOffAmount || 0;
      const totalAmount = invoice.total || 0;
      const paidAmount = Math.max(0, totalAmount - writeOffAmount);
      const paidStr = paidAmount.toFixed(2);
      const writeOffStr = writeOffAmount.toFixed(2);
      const writeOffText = `Paid: $${paidStr} • Write-off: $${writeOffStr}`;
      items.push(<div key="writeoff" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{writeOffText}</div>);
    }
    
    if (dueCharges.hasLateFees) {
      // Pre-compute all values before creating string to ensure atomic rendering
      const baseStr = baseAmount.toFixed(2);
      const lateFeeStr = dueCharges.lateFeeAmount.toFixed(2);
      // Create complete string atomically - render as single text node to prevent partial rendering
      // Use inline-block and nowrap to prevent layout shift
      const lateFeesText = `Base $${baseStr} • Late fee $${lateFeeStr}`;
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
                ${displayTotal.toLocaleString()}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
              <RotatingBadges
                badges={badges}
                rotationState={rotationState}
              />
            </div>

            <div className="flex items-center space-x-1">
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
                ${displayTotal.toLocaleString()}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
              <RotatingBadges
                badges={badges}
                rotationState={rotationState}
              />
            </div>
            <div className="flex items-center space-x-1">
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


