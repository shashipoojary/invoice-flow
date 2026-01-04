'use client';

import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Eye, Download, Send, CheckCircle, Edit, Trash2, Info, Copy, DollarSign } from 'lucide-react';
import InvoiceActivityDrawer from '@/components/InvoiceActivityDrawer';
import type { Invoice } from '@/types';
import { useAuth } from '@/hooks/useAuth';

// Constants for animation timing
const ANIMATION_DURATION = 400; // ms
const ROTATION_INTERVAL = 2000; // ms

// Check if user prefers reduced motion
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

// Shared rotation hook for synchronized rotation between badges and breakdowns
function useSynchronizedRotation(itemCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't animate if only one item or user prefers reduced motion
    if (itemCount <= 1 || prefersReducedMotion) return;

    // Clear any existing intervals/timeouts
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    intervalRef.current = setInterval(() => {
      setIsAnimating(true);
      
      // After animation completes, update index and reset animation state
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % itemCount);
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    }, ROTATION_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [itemCount]);

  return { currentIndex, isAnimating };
}

// Type definitions
type RotationState = { currentIndex: number; isAnimating: boolean };

// Memoized function to find widest badge for placeholder
const findWidestBadge = (badges: React.ReactNode[]): React.ReactNode => {
  return badges.find(b => {
    try {
      const badgeText = (b as any)?.props?.children?.find?.((c: any) => typeof c === 'string') || '';
      return badgeText.includes('Partial Payment');
    } catch {
      return false;
    }
  }) || badges[0];
};

// Rotating Badge Component - Production-grade smooth slide animation
const RotatingBadges = React.memo(({ badges, rotationState }: { badges: React.ReactNode[]; rotationState: RotationState }) => {
  const { currentIndex, isAnimating } = rotationState;
  const nextBadgeRef = React.useRef<HTMLDivElement>(null);
  const rafIdRef = React.useRef<number | null>(null);

  // Animate next badge sliding up from below
  React.useEffect(() => {
    if (!isAnimating || !nextBadgeRef.current) return;

    // Cleanup any pending animation frames
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Force the next badge to start from below, then animate up
    rafIdRef.current = requestAnimationFrame(() => {
      if (nextBadgeRef.current) {
        nextBadgeRef.current.style.transform = 'translateY(100%)';
        rafIdRef.current = requestAnimationFrame(() => {
          if (nextBadgeRef.current) {
            nextBadgeRef.current.style.transform = 'translateY(0)';
          }
        });
      }
    });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isAnimating]);

  // Memoize computed values
  const nextIndex = React.useMemo(() => (currentIndex + 1) % badges.length, [currentIndex, badges.length]);
  const widestBadge = React.useMemo(() => findWidestBadge(badges), [badges]);

  // Early returns
  if (badges.length === 0) return null;
  if (badges.length === 1) return <>{badges[0]}</>;

  const transitionStyle = isAnimating 
    ? `transform ${ANIMATION_DURATION}ms ease-in-out` 
    : 'none';

  return (
    <div 
      className="relative inline-flex items-center overflow-hidden" 
      style={{ height: '28px', position: 'relative' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Current badge - always rendered, transforms based on animation state */}
      <div
        key={`badge-${currentIndex}`}
        style={{ 
          position: 'absolute',
          whiteSpace: 'nowrap',
          transform: isAnimating ? 'translateY(100%)' : 'translateY(0)',
          transition: transitionStyle,
          willChange: isAnimating ? 'transform' : 'auto',
        }}
      >
        {badges[currentIndex]}
      </div>
      {/* Next badge - only rendered when animating, slides up from below */}
      {isAnimating && (
        <div
          ref={nextBadgeRef}
          key={`badge-in-${nextIndex}`}
          style={{ 
            position: 'absolute',
            whiteSpace: 'nowrap',
            transform: 'translateY(100%)',
            transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
            willChange: 'transform',
          }}
        >
          {badges[nextIndex]}
        </div>
      )}
      {/* Invisible placeholder to maintain size and prevent layout shift */}
      <div 
        className="invisible" 
        style={{ 
          whiteSpace: 'nowrap', 
          display: 'inline-block', 
          height: 0, 
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {widestBadge}
      </div>
    </div>
  );
});

RotatingBadges.displayName = 'RotatingBadges';

// Rotating Amount Breakdown Component - Production-grade smooth slide animation
const RotatingAmountBreakdown = React.memo(({ breakdowns, rotationState }: { breakdowns: React.ReactNode[]; rotationState: RotationState }) => {
  const { currentIndex, isAnimating } = rotationState;
  const nextBreakdownRef = React.useRef<HTMLDivElement>(null);
  const rafIdRef = React.useRef<number | null>(null);

  // Animate next breakdown sliding up from below
  React.useEffect(() => {
    if (!isAnimating || !nextBreakdownRef.current) return;

    // Cleanup any pending animation frames
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Force the next breakdown to start from below, then animate up
    rafIdRef.current = requestAnimationFrame(() => {
      if (nextBreakdownRef.current) {
        nextBreakdownRef.current.style.transform = 'translateY(100%)';
        rafIdRef.current = requestAnimationFrame(() => {
          if (nextBreakdownRef.current) {
            nextBreakdownRef.current.style.transform = 'translateY(0)';
          }
        });
      }
    });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isAnimating]);

  // Memoize computed values
  const nextIndex = React.useMemo(() => (currentIndex + 1) % breakdowns.length, [currentIndex, breakdowns.length]);

  // Early returns
  if (breakdowns.length === 0) return null;
  if (breakdowns.length === 1) return <>{breakdowns[0]}</>;

  const transitionStyle = isAnimating 
    ? `transform ${ANIMATION_DURATION}ms ease-in-out` 
    : 'none';

  return (
    <div 
      className="relative overflow-hidden" 
      style={{ height: '16px' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Current breakdown - always rendered, transforms based on animation state */}
      <div
        key={`breakdown-${currentIndex}`}
        style={{ 
          position: 'absolute',
          width: '100%',
          transform: isAnimating ? 'translateY(100%)' : 'translateY(0)',
          transition: transitionStyle,
          willChange: isAnimating ? 'transform' : 'auto',
        }}
      >
        {breakdowns[currentIndex]}
      </div>
      {/* Next breakdown - only rendered when animating, slides up from below */}
      {isAnimating && (
        <div
          ref={nextBreakdownRef}
          key={`breakdown-in-${nextIndex}`}
          style={{ 
            position: 'absolute',
            width: '100%',
            transform: 'translateY(100%)',
            transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
            willChange: 'transform',
          }}
        >
          {breakdowns[nextIndex]}
        </div>
      )}
      {/* Invisible placeholder to maintain size and prevent layout shift */}
      <div 
        className="invisible" 
        style={{ 
          width: '100%', 
          height: 0, 
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {breakdowns[currentIndex]}
      </div>
    </div>
  );
});

RotatingAmountBreakdown.displayName = 'RotatingAmountBreakdown';

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
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onDuplicate?: (invoice: Invoice) => void;
  paymentData?: { totalPaid: number; remainingBalance: number } | null;
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
  onEdit,
  onDelete,
  onDuplicate,
  paymentData: propPaymentData,
}: UnifiedInvoiceCardProps) {
  const { getAuthHeaders } = useAuth();
  const [showActivity, setShowActivity] = useState(false);
  
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
  const badges = [
    ...(dueCharges.isPartiallyPaid ? [
      <span key="partial" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
        <DollarSign className="h-3 w-3" />
        <span>Partial Payment</span>
      </span>
    ] : []),
    ...(dueDateStatus.status === 'overdue' && invoice.status !== 'paid' ? [
      <span key="overdue" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600">
        <AlertTriangle className="h-3 w-3" />
        <span>{dueDateStatus.days}d overdue</span>
      </span>
    ] : [])
  ];

  // Prepare breakdowns - MUST match badge order for synchronization
  // Ensure complete strings are rendered atomically (no partial rendering)
  const breakdowns = [
    ...(dueCharges.isPartiallyPaid ? [
      <div key="partial">Paid: ${dueCharges.totalPaid.toFixed(2)} • Remaining: ${dueCharges.remainingBalance.toFixed(2)}</div>
    ] : []),
    ...(dueCharges.hasLateFees ? [
      <div key="latefees">Base ${dueCharges.remainingBalance.toFixed(2)} • Late fee ${dueCharges.lateFeeAmount.toFixed(2)}</div>
    ] : []),
    ...(!dueCharges.isPartiallyPaid && !dueCharges.hasLateFees ? [
      <div key="empty" className="min-h-[14px] sm:min-h-[16px]"></div>
    ] : [])
  ];

  // Use shared rotation state for synchronization - use max length to ensure both rotate together
  const maxItems = Math.max(badges.length, breakdowns.length);
  const rotationState = useSynchronizedRotation(maxItems);

  return (
    <div className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
      {/* Mobile */}
      <div className="block sm:hidden p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#1f2937' }}>{invoice.invoiceNumber}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>{invoice.client?.name || 'Unknown Client'}</div>
              </div>
            </div>
            <div className="text-right min-h-[56px] flex flex-col items-end">
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
              <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500" style={{ minHeight: '14px' }}>
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
              <button onClick={() => { onView(invoice); logEvent('viewed_by_owner'); }} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="View">
                <Eye className="h-4 w-4 text-gray-700" />
              </button>
              <button onClick={() => setShowActivity(true)} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="Activity">
                <Info className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={() => { onPdf(invoice); logEvent('downloaded_pdf'); }}
                disabled={loadingActions[`pdf-${invoice.id}`]}
                className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
                  className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {invoice.status === 'draft' && onDelete && (
                <button
                  onClick={() => onDelete(invoice)}
                  className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {(invoice.status === 'pending' || invoice.status === 'sent') && (
                <button
                  onClick={() => { onMarkPaid(invoice); logEvent('paid'); }}
                  disabled={loadingActions[`paid-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#1f2937' }}>{invoice.invoiceNumber}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>{invoice.client?.name || 'Unknown Client'}</div>
              </div>
            </div>
            <div className="text-right min-h-[56px] flex flex-col items-end">
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
              <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500" style={{ minHeight: '14px' }}>
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
              <button onClick={() => setShowActivity(true)} className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="Activity">
                <Info className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={() => onPdf(invoice)}
                disabled={loadingActions[`pdf-${invoice.id}`]}
                className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
                  className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {invoice.status === 'draft' && onDelete && (
                <button
                  onClick={() => onDelete(invoice)}
                  className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-gray-700" />
                </button>
              )}
              {(invoice.status === 'pending' || invoice.status === 'sent') && (
                <button
                  onClick={() => onMarkPaid(invoice)}
                  disabled={loadingActions[`paid-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
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
              )}
            </div>
          </div>
        </div>
      </div>
      {showActivity && (
        <InvoiceActivityDrawer invoice={invoice as any} open={showActivity} onClose={() => setShowActivity(false)} />
      )}
    </div>
  );
}

export default UnifiedInvoiceCard;


