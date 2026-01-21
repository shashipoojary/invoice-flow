'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Users, 
  Clock, CheckCircle, AlertCircle, AlertTriangle, UserPlus, FilePlus, Sparkles, Receipt, Timer,
  Eye, Download, Send, Edit, X, Bell, CreditCard, DollarSign, Trash2, ArrowRight, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown, ClipboardCheck, Copy, Calendar, Ban, FileCheck, FileX, ArrowLeft, Info, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import { useData } from '@/contexts/DataContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import UnifiedInvoiceCard from '@/components/UnifiedInvoiceCard';
import PartialPaymentModal from '@/components/PartialPaymentModal';
import { Client, Invoice } from '@/types';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { DonutChart, DonutChartSegment } from '@/components/ui/donut-chart';

// Lazy load heavy modal components for better performance
// Using ssr: false and no loading state to prevent layout shift
const FastInvoiceModal = dynamic(() => import('@/components/FastInvoiceModal'), {
  ssr: false,
  loading: () => null // No loading state to prevent layout shift
});

const QuickInvoiceModal = dynamic(() => import('@/components/QuickInvoiceModal'), {
  ssr: false,
  loading: () => null // No loading state to prevent layout shift
});

const ConfirmationModal = dynamic(() => import('@/components/ConfirmationModal'), {
  ssr: false,
  loading: () => null
});

const UpgradeModal = dynamic(() => import('@/components/UpgradeModal'), {
  ssr: false,
  loading: () => null
});

const SendInvoiceModal = dynamic(() => import('@/components/SendInvoiceModal'), {
  ssr: false,
  loading: () => null
});

const ClientModal = dynamic(() => import('@/components/ClientModal'), {
  ssr: false,
  loading: () => null
});

const EstimateModal = dynamic(() => import('@/components/EstimateModal'), {
  ssr: false,
  loading: () => null // No loading state to prevent layout shift
});

// Invoice Performance Chart Component with simple donut charts
const InvoicePerformanceChart = ({ invoices, paymentDataMap }: { invoices: Invoice[], paymentDataMap: Record<string, { totalPaid: number; remainingBalance: number }> }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Calculate revenue metrics
  const totalRevenue = invoices.reduce((sum, inv) => {
    if (inv.status === 'paid') {
      const paymentData = paymentDataMap[inv.id];
      return sum + (paymentData?.totalPaid || inv.total);
    }
    return sum;
  }, 0);
  
  const pendingRevenue = invoices.reduce((sum, inv) => {
    if (inv.status === 'sent' || inv.status === 'pending') {
      const paymentData = paymentDataMap[inv.id];
      return sum + (paymentData?.remainingBalance || inv.total);
    }
    return sum;
  }, 0);
  
  const overdueRevenue = invoices.reduce((sum, inv) => {
    if (inv.status === 'overdue') {
      const paymentData = paymentDataMap[inv.id];
      return sum + (paymentData?.remainingBalance || inv.total);
    }
    return sum;
  }, 0);
  
  const totalRevenueAmount = totalRevenue + pendingRevenue + overdueRevenue;
  
  // Revenue distribution chart data
  const revenueData: DonutChartSegment[] = [
    {
      value: totalRevenue,
      color: '#10b981', // Green
      label: 'Paid'
    },
    {
      value: pendingRevenue,
      color: '#6366f1', // Indigo
      label: 'Pending'
    },
    {
      value: overdueRevenue,
      color: '#ef4444', // Red
      label: 'Overdue'
    }
  ].filter(seg => seg.value > 0);
  
  // Calculate performance metrics
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const totalInvoices = invoices.length;
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenueAmount / totalInvoices : 0;
  const collectionRate = totalRevenueAmount > 0 ? (totalRevenue / totalRevenueAmount) * 100 : 0;
  
  // Calculate average days to payment (for paid invoices)
  const today = new Date();
  let totalDaysToPayment = 0;
  let paidWithDates = 0;
  
  paidInvoices.forEach(inv => {
    const paymentData = paymentDataMap[inv.id];
    if (paymentData && paymentData.totalPaid > 0 && inv.createdAt) {
      try {
        const invoiceDate = new Date(inv.createdAt);
        const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 365) { // Reasonable range check
          totalDaysToPayment += daysDiff;
          paidWithDates++;
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
  });
  
  const avgDaysToPayment = paidWithDates > 0 ? Math.round(totalDaysToPayment / paidWithDates) : 0;
  
  const hoveredRevenueSegment = hoveredCategory && hoveredCategory.startsWith('revenue-')
    ? revenueData.find(seg => seg.label === hoveredCategory.replace('revenue-', ''))
    : null;
  
  const revenueCenterContent = hoveredRevenueSegment ? (
    <div className="flex flex-col items-center justify-center">
      <span className="text-2xl font-semibold tabular-nums">
        ${(hoveredRevenueSegment.value / 1000).toFixed(1)}k
      </span>
      <span className="text-xs text-gray-500">{hoveredRevenueSegment.label}</span>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center">
      <span className="text-lg font-semibold text-gray-400">Total</span>
      <span className="text-2xl font-semibold tabular-nums">
        ${(totalRevenueAmount / 1000).toFixed(1)}k
      </span>
      <span className="text-xs text-gray-500">Revenue</span>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Revenue Distribution */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="flex-shrink-0">
            <DonutChart
              data={revenueData}
              size={140}
              strokeWidth={18}
              hoveredSegmentLabel={hoveredCategory?.startsWith('revenue-') ? hoveredCategory.replace('revenue-', '') : null}
              centerContent={revenueCenterContent}
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <div className="space-y-2">
              {revenueData.map((segment) => {
                const percentage = totalRevenueAmount > 0 
                  ? ((segment.value / totalRevenueAmount) * 100).toFixed(1)
                  : '0';
                const isHovered = hoveredCategory === `revenue-${segment.label}`;
                
                return (
                  <div
                    key={segment.label}
                    className={`flex items-center justify-between p-2 transition-colors cursor-pointer ${
                      isHovered ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                    style={{ borderRadius: 0 }}
                    onMouseEnter={() => setHoveredCategory(`revenue-${segment.label}`)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 flex-shrink-0"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {segment.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        ${(segment.value / 1000).toFixed(1)}k
                      </span>
                      <span className="text-xs text-gray-500 min-w-[35px] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Avg Invoice Value</p>
            <p className="text-xl font-semibold text-gray-900">${avgInvoiceValue.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Collection Rate</p>
            <p className="text-xl font-semibold text-gray-900">{collectionRate.toFixed(1)}%</p>
          </div>
          {avgDaysToPayment > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Days to Payment</p>
              <p className="text-xl font-semibold text-gray-900">{avgDaysToPayment} days</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Invoices</p>
            <p className="text-xl font-semibold text-gray-900">{totalInvoices}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Conversion Rate Chart Component with interactive donut chart and legend
const ConversionRateChart = ({ invoices, paymentDataMap }: { invoices: Invoice[], paymentDataMap: Record<string, { totalPaid: number; remainingBalance: number }> }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Calculate invoice categories
  const totalPaid = invoices.filter(inv => inv.status === 'paid').length;
  const totalSent = invoices.filter(inv => inv.status === 'sent').length;
  const totalPending = invoices.filter(inv => inv.status === 'pending').length;
  const totalDraft = invoices.filter(inv => inv.status === 'draft').length;
  const totalOverdue = invoices.filter(inv => inv.status === 'overdue').length;
  const totalInvoices = invoices.length;
  const totalSentOrPaid = invoices.filter(inv => inv.status === 'sent' || inv.status === 'paid').length;
  const conversionRate = totalSentOrPaid > 0 ? (totalPaid / totalSentOrPaid) * 100 : 0;
  
  // Create category data for donut chart
  const categoryData: DonutChartSegment[] = [
    {
      value: totalPaid,
      color: '#10b981', // Green
      label: 'Paid'
    },
    {
      value: totalSent,
      color: '#6366f1', // Indigo
      label: 'Sent'
    },
    {
      value: totalPending,
      color: '#f59e0b', // Amber
      label: 'Pending'
    },
    {
      value: totalDraft,
      color: '#6b7280', // Gray
      label: 'Draft'
    },
    {
      value: totalOverdue,
      color: '#ef4444', // Red
      label: 'Overdue'
    }
  ].filter(seg => seg.value > 0); // Only show categories with data
  
  // Get hovered segment data
  const hoveredSegment = hoveredCategory 
    ? categoryData.find(seg => seg.label === hoveredCategory)
    : null;
  
  // Center content based on hover
  const centerContent = hoveredSegment ? (
    <div className="flex flex-col items-center justify-center">
      <span className="text-2xl font-semibold tabular-nums">
        {hoveredSegment.value}
      </span>
      <span className="text-xs text-gray-500">{hoveredSegment.label}</span>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center">
      <span className="text-lg font-semibold text-gray-400">Total</span>
      <span className="text-2xl font-semibold tabular-nums">
        {totalInvoices}
      </span>
      <span className="text-xs text-gray-500">Invoices</span>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-medium leading-none tracking-tight tabular-nums">
          {conversionRate.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500">Conversion Rate</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        {/* Donut Chart */}
        <div className="flex-shrink-0">
          <DonutChart
            data={categoryData}
            size={160}
            strokeWidth={20}
            hoveredSegmentLabel={hoveredCategory}
            centerContent={centerContent}
          />
        </div>
        
        {/* Category Legend */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="space-y-2">
            {categoryData.map((segment) => {
              const percentage = totalInvoices > 0 
                ? ((segment.value / totalInvoices) * 100).toFixed(1)
                : '0';
              const isHovered = hoveredCategory === segment.label;
              
              return (
                <div
                  key={segment.label}
                  className={`flex items-center justify-between p-2 transition-colors cursor-pointer ${
                    isHovered ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                  style={{ borderRadius: 0 }}
                  onMouseEnter={() => setHoveredCategory(segment.label)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {segment.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {segment.value}
                    </span>
                    <span className="text-xs text-gray-500 min-w-[35px] text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardOverview() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const { settings } = useSettings();
  const { invoices, clients, isLoadingInvoices, isLoadingClients, hasInitiallyLoaded, addInvoice, updateInvoice, deleteInvoice, refreshInvoices } = useData();
  const router = useRouter();
  
  // Track if sidebar is transitioning to prevent unnecessary re-renders
  const sidebarTransitioningRef = useRef(false);
  
  // Local state for UI
  // Initialize loading state to false to prevent flash - stats are calculated from invoices which are already loaded
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [paymentDataMap, setPaymentDataMap] = useState<Record<string, { totalPaid: number; remainingBalance: number }>>({});
  const [invoicesWithPartialPayments, setInvoicesWithPartialPayments] = useState<Set<string>>(new Set());
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReminderDates, setShowReminderDates] = useState(false);
  const [showCreateEstimate, setShowCreateEstimate] = useState(false);
  const [showPartialPayment, setShowPartialPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    // Load read notifications from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('readNotificationIds');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const notificationRef = useRef<HTMLDivElement>(null);
  const invoicesRef = useRef<Invoice[]>([]);
  const notificationsFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');
  const getAuthHeadersRef = useRef<typeof getAuthHeaders | null>(null);
  const parseDateOnlyRef = useRef<((input: string) => Date) | null>(null);
  const [dueInvoicesScrollIndex, setDueInvoicesScrollIndex] = useState(0);
  const dueInvoicesScrollRef = useRef<HTMLDivElement>(null);
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRAFRef = useRef<number | null>(null);
  const previousScrollIndexRef = useRef<number>(-1);
  const renderCount = useRef(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'viewed' | 'due_today' | 'overdue' | 'paid' | 'partial_paid' | 'draft_created' | 'downloaded' | 'payment_copied' | 'reminder_scheduled' | 'sent' | 'failed' | 'cancelled' | 'estimate_sent' | 'estimate_approved' | 'estimate_rejected';
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    message: string;
    timestamp: string;
  }>>([]);
  
  // Payment Activity and Reminders state
  const [paymentActivity, setPaymentActivity] = useState<Array<{
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    date: string;
    method?: string;
  }>>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Array<{
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    dueDate: string;
    scheduledFor: string;
    reminderType: string;
    amount: number; // The exact amount that will be sent in the reminder
    invoiceTotal: number;
    lateFees?: { enabled: boolean; type: 'fixed' | 'percentage'; amount: number; gracePeriod: number };
    invoiceStatus: string;
  }>>([]);
  const [loadingPaymentActivity, setLoadingPaymentActivity] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  
  // Payment form state
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Loading states for action buttons
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: boolean;
  }>({});
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info' | 'success',
    onConfirm: () => {},
    isLoading: false,
    confirmText: 'Confirm' as string | undefined,
    cancelText: 'Cancel' as string | undefined,
    infoBanner: undefined as React.ReactNode | undefined
  });
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionUsage, setSubscriptionUsage] = useState<{
    used: number;
    limit: number | null;
    remaining: number | null;
    plan: string;
  } | null>(null);

  // Send invoice modal state
  const [sendInvoiceModal, setSendInvoiceModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    invoice: null,
    isLoading: false
  });
  
  // Business settings are now managed by SettingsContext

  // Debug: Track component renders (throttled to reduce console noise)
  useEffect(() => {
    renderCount.current += 1;
    // Only log every 5th render to reduce console noise
    if (renderCount.current % 5 === 0 || renderCount.current <= 3) {
      console.log('🔄 Dashboard: Component rendered', {
        renderCount: renderCount.current,
        timestamp: `${performance.now().toFixed(2)}ms`,
        invoicesCount: invoices?.length || 0,
        clientsCount: clients?.length || 0
      });
    }
  });

  // Preload modals on mount to prevent layout shift and loading spinner
  useEffect(() => {
    // Preload all modals in the background to prevent any loading spinners
    if (typeof window !== 'undefined') {
      import('@/components/FastInvoiceModal');
      import('@/components/QuickInvoiceModal');
      import('@/components/EstimateModal');
    }
  }, []);

  // Keep invoices ref updated
  useEffect(() => {
    invoicesRef.current = invoices || [];
  }, [invoices]);

  // Cleanup scroll animation frames on unmount
  useEffect(() => {
    return () => {
      if (scrollRAFRef.current !== null) {
        cancelAnimationFrame(scrollRAFRef.current);
      }
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Extract payment data from invoices immediately - now instant since it's direct properties
  useEffect(() => {
    if (!invoices || invoices.length === 0) {
      setPaymentDataMap({});
      setInvoicesWithPartialPayments(new Set());
      return;
    }

    // Payment data is now direct properties on invoice objects (totalPaid, remainingBalance)
    const payments: Record<string, { totalPaid: number; remainingBalance: number }> = {};
    const partialSet = new Set<string>();
    
    invoices.forEach((invoice: any) => {
      // Direct property access - no extraction needed
      const totalPaid = invoice.totalPaid || 0;
      const remainingBalance = invoice.remainingBalance || 0;
      
      if (totalPaid > 0 || remainingBalance !== invoice.total) {
        payments[invoice.id] = { totalPaid, remainingBalance };
      }
      
      if (totalPaid > 0 && remainingBalance > 0) {
        partialSet.add(invoice.id);
      }
    });

    setPaymentDataMap(payments);
    setInvoicesWithPartialPayments(partialSet);
  }, [invoices]);

  // Fetch payment activity
  useEffect(() => {
    const fetchPaymentActivity = async () => {
      if (!user?.id || isLoadingInvoices) return;
      
      setLoadingPaymentActivity(true);
      try {
        const { data: payments, error } = await supabase
          .from('invoice_payments')
          .select(`
            id,
            invoice_id,
            amount,
            payment_date,
            payment_method,
            invoices (
              invoice_number,
              clients (name)
            )
          `)
          .order('payment_date', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        const activity = (payments || []).map((p: any) => ({
          id: p.id,
          invoiceId: p.invoice_id,
          invoiceNumber: p.invoices?.invoice_number || 'N/A',
          clientName: p.invoices?.clients?.name || 'Unknown Client',
          amount: parseFloat(p.amount.toString()),
          date: p.payment_date,
          method: p.payment_method || 'N/A'
        }));
        
        setPaymentActivity(activity);
      } catch (error) {
        console.error('Error fetching payment activity:', error);
        setPaymentActivity([]);
      } finally {
        setLoadingPaymentActivity(false);
      }
    };
    
    fetchPaymentActivity();
  }, [user?.id, isLoadingInvoices]);

  // Fetch upcoming reminders
  useEffect(() => {
    const fetchUpcomingReminders = async () => {
      if (!user?.id || isLoadingInvoices) return;
      
      setLoadingReminders(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const { data: reminders, error } = await supabase
          .from('invoice_reminders')
          .select(`
            id,
            invoice_id,
            scheduled_for,
            reminder_type,
            invoices (
              invoice_number,
              due_date,
              total,
              status,
              late_fees,
              clients (name)
            )
          `)
          .eq('reminder_status', 'scheduled')
          .gte('scheduled_for', today.toISOString())
          .lte('scheduled_for', nextWeek.toISOString())
          .order('scheduled_for', { ascending: true })
          .limit(10);
        
        if (error) throw error;
        
        // Fetch payment data for all invoice IDs
        const invoiceIds = (reminders || []).map((r: any) => r.invoice_id).filter(Boolean);
        const paymentDataMap: Record<string, { totalPaid: number; remainingBalance: number }> = {};
        
        if (invoiceIds.length > 0) {
          const { data: payments } = await supabase
            .from('invoice_payments')
            .select('invoice_id, amount')
            .in('invoice_id', invoiceIds);
          
          if (payments) {
            invoiceIds.forEach((invoiceId: string) => {
              const invoicePayments = payments.filter((p: any) => p.invoice_id === invoiceId);
              const totalPaid = invoicePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0);
              const reminder = (reminders || []).find((r: any) => r.invoice_id === invoiceId);
              const invoice = reminder?.invoices as any;
              const invoiceTotal = (invoice && !Array.isArray(invoice) ? invoice.total : Array.isArray(invoice) && invoice.length > 0 ? invoice[0].total : 0) || 0;
              paymentDataMap[invoiceId] = {
                totalPaid,
                remainingBalance: Math.max(0, invoiceTotal - totalPaid)
              };
            });
          }
        }
        
        const upcoming = (reminders || []).map((r: any) => {
          const invoice = Array.isArray(r.invoices) ? r.invoices[0] : r.invoices;
          const invoiceTotal = invoice?.total || 0;
          const invoiceStatus = invoice?.status || 'pending';
          const paymentData = paymentDataMap[r.invoice_id];
          
          // Parse late fees
          let lateFeesSettings = null;
          if (invoice?.late_fees) {
            try {
              lateFeesSettings = typeof invoice.late_fees === 'string' 
                ? JSON.parse(invoice.late_fees) 
                : invoice.late_fees;
            } catch (e) {
              lateFeesSettings = null;
            }
          }
          
          // Calculate base amount (for scheduled reminders, use remaining balance if available)
          const baseAmount = (invoiceStatus === 'cancelled') 
            ? invoiceTotal 
            : (paymentData?.remainingBalance || invoiceTotal);
          
          // Calculate late fees if invoice is overdue
          let lateFeesAmount = 0;
          let totalPayable = baseAmount;
          
          if (invoice?.due_date && lateFeesSettings?.enabled) {
            const dueDate = new Date(invoice.due_date);
            const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
            const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            const isOverdue = dueDateStart < todayStart && invoiceStatus !== 'paid';
            
            if (isOverdue) {
              const daysOverdue = Math.round((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24));
              const gracePeriod = lateFeesSettings.gracePeriod || 0;
              const chargeableDays = Math.max(0, daysOverdue - gracePeriod);
              
              if (chargeableDays > 0) {
                if (lateFeesSettings.type === 'percentage') {
                  lateFeesAmount = baseAmount * ((lateFeesSettings.amount || 0) / 100);
                } else if (lateFeesSettings.type === 'fixed') {
                  lateFeesAmount = lateFeesSettings.amount || 0;
                }
                totalPayable = baseAmount + lateFeesAmount;
              }
            }
          }
          
          const clients = invoice?.clients;
          const clientName = Array.isArray(clients) 
            ? (clients.length > 0 ? clients[0]?.name : 'Unknown Client')
            : (clients?.name || 'Unknown Client');
          
          return {
            id: r.id,
            invoiceId: r.invoice_id,
            invoiceNumber: invoice?.invoice_number || 'N/A',
            clientName,
            dueDate: invoice?.due_date || '',
            scheduledFor: r.scheduled_for,
            reminderType: r.reminder_type || 'friendly',
            amount: totalPayable, // The exact amount that will be sent
            invoiceTotal,
            lateFees: lateFeesSettings,
            invoiceStatus
          };
        });
        
        setUpcomingReminders(upcoming);
      } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        setUpcomingReminders([]);
      } finally {
        setLoadingReminders(false);
      }
    };
    
    fetchUpcomingReminders();
  }, [user?.id, isLoadingInvoices]);



  // Payment data is now embedded directly in invoices from /api/invoices
  // No need for separate bulk fetch - removed to prevent infinite loops

  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the invoice type selection modal
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    // Use requestAnimationFrame to ensure state update is applied
    setSelectedInvoice(null);
    requestAnimationFrame(() => {
      setShowFastInvoice(true);
    });
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    // Use requestAnimationFrame to ensure state update is applied
    setSelectedInvoice(null);
    requestAnimationFrame(() => {
      setShowCreateInvoice(true);
    });
  }, []);

  // Status helper functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Send className="h-3 w-3" />;
      case 'overdue':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  }, []);

  const getStatusStyle = useCallback((status: string) => {
    switch (status) {
      case 'paid':
        return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
      case 'pending':
        return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' };
      case 'overdue':
        return { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' };
      case 'draft':
        return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' };
    }
  }, []);

  // Helper function to calculate due date status
  // Parse a YYYY-MM-DD or MM/DD/YYYY date string as a local date (no timezone shifts)
  const parseDateOnly = useCallback((input: string) => {
    if (!input) return new Date(NaN);
    // ISO date from DB e.g., 2025-10-27 - use UTC to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    // Fallback for MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
      const [mm, dd, yyyy] = input.split('/').map(Number);
      return new Date(Date.UTC(yyyy, (mm as number) - 1, dd));
    }
    return new Date(input);
  }, []);

  // Keep refs updated - set after functions are defined
  useEffect(() => {
    getAuthHeadersRef.current = getAuthHeaders;
    parseDateOnlyRef.current = parseDateOnly;
  }, [getAuthHeaders, parseDateOnly]);


  // Scroll handler for Due Invoices section
  const handleDueInvoicesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    
    // Calculate which slide is visible (with threshold for better UX)
    const threshold = containerWidth * 0.3;
    if (scrollLeft < threshold) {
      setDueInvoicesScrollIndex(0);
    } else if (scrollLeft < containerWidth * 1.3) {
      setDueInvoicesScrollIndex(1);
    } else if (scrollLeft < containerWidth * 2.3) {
      setDueInvoicesScrollIndex(2);
    } else {
      setDueInvoicesScrollIndex(3);
    }
  }, []);

  // Function to scroll to specific slide
  const scrollToDueInvoicesSlide = useCallback((index: number) => {
    if (dueInvoicesScrollRef.current) {
      const container = dueInvoicesScrollRef.current;
      const containerWidth = container.clientWidth;
      container.scrollTo({
        left: index * containerWidth,
        behavior: 'smooth'
      });
      setDueInvoicesScrollIndex(index);
    }
  }, []);

  const getDueDateStatus = useCallback((dueDate: string, invoiceStatus: string, paymentTerms?: { enabled: boolean; terms: string }, updatedAt?: string) => {
    const today = new Date();
    const effectiveDueDate = parseDateOnly(dueDate);
    
    // Note: "Due on Receipt" logic disabled to match public invoice page behavior
    // The public invoice page uses the raw due_date directly without "Due on Receipt" adjustments
    
    // Set time to start of day for accurate date comparison
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const dueDateStart = new Date(Date.UTC(effectiveDueDate.getFullYear(), effectiveDueDate.getMonth(), effectiveDueDate.getDate()));
    
    // Calculate days difference: today - dueDate (positive if overdue)
    const diffTime = todayStart.getTime() - dueDateStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Draft invoices should never be marked as overdue, even if past due date
    if (invoiceStatus === 'draft') {
      if (diffDays > 0) {
        return { status: 'draft-past-due', days: diffDays, color: 'text-gray-500' };
      } else if (diffDays === 0) {
        return { status: 'draft-due-today', days: 0, color: 'text-gray-500' };
      } else {
        // diffDays < 0 means due date is in the future
        const daysUntilDue = Math.abs(diffDays);
        if (daysUntilDue <= 3) {
          return { status: 'draft-due-soon', days: daysUntilDue, color: 'text-gray-500' };
        } else {
          return { status: 'draft-upcoming', days: daysUntilDue, color: 'text-gray-500' };
        }
      }
    }
    
    // Only sent/pending invoices can be overdue
    // Invoice is overdue only if due date has passed (not on the due date itself)
    if (diffDays > 0) {
      // diffDays > 0 means today is past the due date (overdue)
      return { status: 'overdue', days: diffDays, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { status: 'due-today', days: 0, color: 'text-orange-500' };
    } else {
      // diffDays < 0 means due date is in the future
      const daysUntilDue = Math.abs(diffDays);
      if (daysUntilDue <= 3) {
        return { status: 'due-soon', days: daysUntilDue, color: 'text-yellow-600' };
      } else {
        return { status: 'upcoming', days: daysUntilDue, color: 'text-gray-600' };
      }
    }
  }, [parseDateOnly]);

  // Helper function to format payment terms
  const formatPaymentTerms = useCallback((paymentTerms?: { enabled: boolean; terms: string }) => {
    if (!paymentTerms?.enabled) return null;
    return paymentTerms.terms;
  }, []);

  // Helper function to format late fees
  const formatLateFees = useCallback((lateFees?: { enabled: boolean; type: 'fixed' | 'percentage'; amount: number; gracePeriod: number }) => {
    if (!lateFees?.enabled) return null;
    const amount = lateFees.type === 'fixed' ? `$${lateFees.amount}` : `${lateFees.amount}%`;
    return `${amount} after ${lateFees.gracePeriod} days`;
  }, []);

  // Helper function to format reminders
  const formatReminders = useCallback((reminders?: { enabled: boolean; useSystemDefaults: boolean; rules?: Array<{ enabled: boolean }>; customRules?: Array<{ enabled: boolean }> }) => {
    if (!reminders?.enabled) return null;
    if (reminders.useSystemDefaults) return 'Smart System';
    const rules = reminders.rules || reminders.customRules || [];
    const activeRules = rules.filter(rule => rule.enabled).length;
    return `${activeRules} Custom Rule${activeRules !== 1 ? 's' : ''}`;
  }, []);

  // Helper function to calculate due charges and total payable
  const calculateDueCharges = useCallback((invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => {
    // Only calculate late fees for pending/sent invoices that are overdue
    if (invoice.status !== 'pending' && invoice.status !== 'sent') {
      return {
        hasLateFees: false,
        lateFeeAmount: 0,
        totalPayable: invoice.total,
        overdueDays: 0,
        totalPaid: paymentData?.totalPaid || 0,
        remainingBalance: paymentData?.remainingBalance || invoice.total,
        isPartiallyPaid: (paymentData?.totalPaid || 0) > 0 && (paymentData?.remainingBalance || 0) > 0
      };
    }

    const today = new Date();
    // Use raw due_date directly (no "Due on Receipt" adjustments) to match invoice card logic
    const effectiveDueDate = parseDateOnly(invoice.dueDate);
    
    // Set time to start of day for accurate date comparison (use UTC to match parseDateOnly)
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const dueDateStart = new Date(Date.UTC(effectiveDueDate.getFullYear(), effectiveDueDate.getMonth(), effectiveDueDate.getDate()));
    
    // Calculate days difference: today - dueDate (positive if overdue)
    const diffTime = todayStart.getTime() - dueDateStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate base amount (considering partial payments)
    const baseAmount = paymentData ? paymentData.remainingBalance : invoice.total;
    
    // Only calculate late fees if invoice is overdue and late fees are enabled
    if (diffDays > 0 && invoice.lateFees?.enabled) {
      const overdueDays = diffDays;
      const gracePeriod = invoice.lateFees.gracePeriod || 0;
      
      if (overdueDays > gracePeriod) {
        const chargeableDays = overdueDays - gracePeriod;
        let lateFeeAmount = 0;
        
        if (invoice.lateFees.type === 'fixed') {
          lateFeeAmount = invoice.lateFees.amount;
        } else if (invoice.lateFees.type === 'percentage') {
          // Calculate late fee on the remaining balance (after partial payments)
          lateFeeAmount = (baseAmount * invoice.lateFees.amount) / 100;
        }
        
        const totalPayable = baseAmount + lateFeeAmount;
        return {
          hasLateFees: true,
          lateFeeAmount,
          totalPayable,
          overdueDays: chargeableDays,
          totalPaid: paymentData?.totalPaid || 0,
          remainingBalance: totalPayable,
          isPartiallyPaid: (paymentData?.totalPaid || 0) > 0 && totalPayable > 0
        };
      }
    }
    
    return {
      hasLateFees: false,
      lateFeeAmount: 0,
      totalPayable: baseAmount,
      overdueDays: 0,
      totalPaid: paymentData?.totalPaid || 0,
      remainingBalance: baseAmount,
      isPartiallyPaid: (paymentData?.totalPaid || 0) > 0 && (paymentData?.remainingBalance || 0) > 0
    };
  }, [parseDateOnly]);

  // Fetch payments for selected invoice
  const fetchPayments = useCallback(async () => {
    if (!selectedInvoice?.id) return;
    
    setLoadingPayments(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
        setRemainingBalance(data.remainingBalance || selectedInvoice.total);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  }, [selectedInvoice?.id, getAuthHeaders, selectedInvoice?.total]);

  // Fetch payments when showing payment form or viewing invoice
  useEffect(() => {
    if ((showPaymentForm || showViewInvoice) && selectedInvoice?.id) {
      fetchPayments();
    }
  }, [showPaymentForm, showViewInvoice, selectedInvoice?.id, fetchPayments]);

  // Handle payment submission
  const handlePaymentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0 || !selectedInvoice?.id) {
      return;
    }

    if (parseFloat(paymentAmount) > remainingBalance) {
      showError(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      return;
    }

    setSubmittingPayment(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentDate,
          paymentMethod: paymentMethod || null,
          notes: paymentNotes || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Reset form
        setPaymentAmount('');
        setPaymentMethod('');
        setPaymentNotes('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        
        // Refresh payments
        await fetchPayments();
        
        // Refresh invoices
        await refreshInvoices();
        
        showSuccess('Payment recorded successfully');
        
        // If fully paid, go back to invoice view
        if (data.isFullyPaid) {
          setShowPaymentForm(false);
        }
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      showError('Failed to record payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  }, [paymentAmount, remainingBalance, selectedInvoice?.id, paymentDate, paymentMethod, paymentNotes, getAuthHeaders, fetchPayments, refreshInvoices, showSuccess, showError]);

  // Handle payment deletion
  const handleDeletePayment = useCallback((paymentId: string) => {
    if (!selectedInvoice?.id) return;

    // Find the payment to get its details for the confirmation message
    const payment = payments.find(p => p.id === paymentId);
    const paymentAmount = payment ? `$${parseFloat(payment.amount.toString()).toFixed(2)}` : 'this payment';

    // Calculate what will happen after deletion
    const remainingAfterDelete = totalPaid - (payment ? parseFloat(payment.amount.toString()) : 0);
    const invoiceTotal = selectedInvoice.total || 0;
    const willBecomeUnpaid = remainingAfterDelete < invoiceTotal && selectedInvoice.status === 'paid';
    
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Payment',
      message: `Are you sure you want to delete ${paymentAmount}? This action cannot be undone.${willBecomeUnpaid ? '\n\nNote: This invoice will be marked as unpaid if it was previously fully paid.' : ''}`,
      type: 'danger',
      confirmText: 'Delete Payment',
      cancelText: 'Cancel',
      isLoading: false,
      infoBanner: (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">IMPORTANT</p>
          <p className="text-sm font-medium text-gray-900">
            Deleting this payment will update the invoice balance and may change the invoice status.
          </p>
        </div>
      ),
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        setDeletingPayment(paymentId);
        
        try {
          const headers = await getAuthHeaders();
          const response = await fetch(`/api/invoices/${selectedInvoice.id}/payments?paymentId=${paymentId}`, {
            method: 'DELETE',
            headers
          });

          if (response.ok) {
            await fetchPayments();
            await refreshInvoices();
            showSuccess('Payment deleted successfully');
            setConfirmationModal({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {}, isLoading: false, confirmText: 'Confirm', cancelText: 'Cancel', infoBanner: undefined });
          } else {
            showError('Failed to delete payment');
            setConfirmationModal(prev => ({ ...prev, isLoading: false }));
          }
        } catch (error) {
          console.error('Error deleting payment:', error);
          showError('Failed to delete payment. Please try again.');
          setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeletingPayment(null);
        }
      }
    });
  }, [selectedInvoice?.id, payments, getAuthHeaders, fetchPayments, refreshInvoices, showSuccess, showError]);

  // Invoice handler functions
  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoice(true);
    setShowPaymentForm(false);
    // Reset payment form
    setPaymentAmount('');
    setPaymentMethod('');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleDownloadPDF = useCallback(async (invoice: Invoice) => {
    const actionKey = `pdf-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      // IMPORTANT: Skip subscription limits for already sent/paid invoices
      // These invoices are already created and sent, so users should be able to download PDFs
      const isAlreadySent = invoice.status === 'sent' || invoice.status === 'paid';
      
      // Only check subscription limits for draft invoices (not yet sent)
      if (!isAlreadySent) {
        const headers = await getAuthHeaders();
        const usageResponse = await fetch('/api/subscription/usage', {
          headers,
          cache: 'no-store'
        });
        
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          
          // For free plan: Check monthly invoice limit (only for draft invoices)
          if (usageData.plan === 'free' && usageData.limit && usageData.used >= usageData.limit) {
            setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
            setShowUpgradeModal(true);
            setSubscriptionUsage(usageData);
            showError('PDF Download Limit Reached', 'You\'ve reached your monthly invoice limit. Please upgrade to download more PDFs.');
            return;
          }
        }
      }
      
      const headers = await getAuthHeaders();
      
      // Fetch complete invoice data from API to ensure all fields are present
      const response = await fetch(`/api/invoices/${invoice.id}`, { headers });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('AUTH_ERROR');
        } else if (response.status === 404) {
          throw new Error('NOT_FOUND');
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.limitReached) {
            throw new Error('LIMIT_REACHED');
          }
          throw new Error('FETCH_ERROR');
        }
      }
      
      const data = await response.json();
      const completeInvoice = data.invoice;
      
      if (!completeInvoice) {
        throw new Error('INVOICE_MISSING');
      }
      
      if (!completeInvoice.client) {
        throw new Error('CLIENT_MISSING');
      }
      
      if (!completeInvoice.items || completeInvoice.items.length === 0) {
        throw new Error('ITEMS_MISSING');
      }
      
      // Prepare business settings for PDF
      const businessSettings = {
        businessName: settings.businessName || 'Your Business Name',
        businessEmail: settings.businessEmail || 'your-email@example.com',
        businessPhone: settings.businessPhone || '',
        address: settings.address || '',
        logo: settings.logo || '',
        paypalEmail: settings.paypalEmail || '',
        cashappId: settings.cashappId || '',
        venmoId: settings.venmoId || '',
        googlePayUpi: settings.googlePayUpi || '',
        applePayId: settings.applePayId || '',
        bankAccount: settings.bankAccount || '',
        bankIfscSwift: settings.bankIfscSwift || '',
        bankIban: settings.bankIban || '',
        stripeAccount: settings.stripeAccount || '',
        paymentNotes: settings.paymentNotes || ''
      };

      const { generateTemplatePDFBlob } = await import('@/lib/template-pdf-generator');
      
      // Extract template and colors from invoice theme if available
      const invoiceTheme = completeInvoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
      // Map UI template (1, 2, 3) to PDF template (6, 4, 5)
      const mapUiTemplateToPdf = (uiTemplate: number): number => {
        switch (uiTemplate) {
          case 1: return 6; // Minimal -> Template 6
          case 2: return 4; // Modern -> Template 4
          case 3: return 5; // Creative -> Template 5
          default: return 6;
        }
      };
      // Use template 1 (FastInvoiceTemplate) for fast invoices, otherwise map UI template to PDF template
      const template = completeInvoice.type === 'fast' ? 1 : (invoiceTheme?.template ? mapUiTemplateToPdf(invoiceTheme.template) : 1);
      const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
      const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
      
      let pdfBlob: Blob;
      try {
        pdfBlob = await generateTemplatePDFBlob(
          completeInvoice, 
          businessSettings, 
          template, 
          primaryColor, 
          secondaryColor
        );
      } catch (pdfGenError: any) {
        const pdfErrorMsg = pdfGenError?.message || pdfGenError?.toString() || '';
        if (pdfErrorMsg.includes('Failed to generate PDF') || pdfErrorMsg.includes('PDF')) {
          throw new Error('PDF_GENERATION_ERROR');
        }
        throw pdfGenError;
      }
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${completeInvoice.invoiceNumber || completeInvoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('PDF Downloaded', `Invoice ${completeInvoice.invoiceNumber || completeInvoice.invoice_number} has been downloaded.`);
    } catch (error: any) {
      console.error('PDF download error:', error);
      const errorMessage = error?.message || error?.toString() || 'UNKNOWN';
      
      // Handle specific error types with clear messages
      let errorTitle = 'PDF Download Failed';
      let errorDescription = '';
      
      if (errorMessage === 'LIMIT_REACHED') {
        errorTitle = 'Subscription Limit Reached';
        errorDescription = 'You\'ve reached your monthly invoice limit. Please upgrade to download more PDFs.';
        // Fetch usage and show upgrade modal
        try {
          const headers = await getAuthHeaders();
          const usageResponse = await fetch('/api/subscription/usage', {
            headers,
            cache: 'no-store'
          });
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setShowUpgradeModal(true);
            setSubscriptionUsage(usageData);
          }
        } catch (usageError) {
          console.error('Error fetching subscription usage:', usageError);
        }
      } else if (errorMessage === 'AUTH_ERROR') {
        errorTitle = 'Authentication Error';
        errorDescription = 'Your session has expired. Please refresh the page and try again.';
      } else if (errorMessage === 'NOT_FOUND') {
        errorTitle = 'Invoice Not Found';
        errorDescription = 'This invoice could not be found. It may have been deleted.';
      } else if (errorMessage === 'INVOICE_MISSING') {
        errorTitle = 'Invoice Data Error';
        errorDescription = 'Invoice data is missing. Please try refreshing the page.';
      } else if (errorMessage === 'CLIENT_MISSING') {
        errorTitle = 'Client Information Missing';
        errorDescription = 'This invoice is missing client information. Please edit the invoice and add a client.';
      } else if (errorMessage === 'ITEMS_MISSING') {
        errorTitle = 'Invoice Items Missing';
        errorDescription = 'This invoice has no items. Please add items to the invoice before downloading.';
      } else if (errorMessage === 'FETCH_ERROR') {
        errorTitle = 'Network Error';
        errorDescription = 'Failed to load invoice data. Please check your internet connection and try again.';
      } else if (errorMessage === 'PDF_GENERATION_ERROR' || errorMessage.includes('Failed to generate PDF') || errorMessage.includes('PDF generation')) {
        errorTitle = 'PDF Generation Error';
        errorDescription = 'An error occurred while generating the PDF. This may be due to missing invoice data or a template issue. Please try again or contact support if the problem persists.';
      } else {
        errorTitle = 'PDF Download Failed';
        errorDescription = 'An unexpected error occurred. Please try again or refresh the page.';
      }
      
      showError(errorTitle, errorDescription);
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [settings, showSuccess, showError, getAuthHeaders, setShowUpgradeModal, setSubscriptionUsage]);

  const handleSendInvoice = useCallback((invoice: Invoice) => {
    // Show modal for draft and paid invoices
    if (invoice.status === 'draft' || invoice.status === 'paid') {
      setSendInvoiceModal({
        isOpen: true,
        invoice,
        isLoading: false
      });
    } else {
      // For other statuses (sent/pending), send directly
      performSendInvoice(invoice);
    }
  }, []);

  const performSendInvoice = useCallback(async (invoice: Invoice) => {
    const actionKey = `send-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setSendInvoiceModal(prev => ({ ...prev, isLoading: true }));
    
    // Check for missing business details - SendInvoiceModal handles blocking for draft/paid invoices
    // This check is for sent/pending invoices that bypass the modal
    const { checkMissingBusinessDetails } = await import('@/lib/utils');
    const missingDetails = checkMissingBusinessDetails(settings);
    if (missingDetails.missing.length > 0) {
      // For direct calls (sent/pending invoices), just inform but don't block
      // The SendInvoiceModal already blocks for draft/paid invoices
      const missingText = missingDetails.missing.length === 1 
        ? missingDetails.missing[0]
        : `${missingDetails.missing.slice(0, 2).join(', ')}${missingDetails.missing.length > 2 ? ` +${missingDetails.missing.length - 2} more` : ''}`;
      showWarning('Missing Details', `Missing: ${missingText}. Update in Settings.`);
    }
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/invoices/send`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          invoiceId: invoice.id,
          clientEmail: invoice.clientEmail,
          clientName: invoice.clientName
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        
        // Always use server response invoice data if available (most accurate)
        // This prevents flickering and ensures correct data immediately
        if (payload?.invoice) {
          // Map the invoice to match frontend format
          const mappedInvoice = {
            ...payload.invoice,
            invoiceNumber: payload.invoice.invoice_number || payload.invoice.invoiceNumber,
            dueDate: payload.invoice.due_date || payload.invoice.dueDate,
            createdAt: payload.invoice.created_at || payload.invoice.createdAt,
            updatedAt: payload.invoice.updated_at || payload.invoice.updatedAt,
            status: payload.invoice.status || 'sent',
          };
          updateInvoice(mappedInvoice);
        } else {
          // Fallback: optimistic update only if no server data
        updateInvoice({ ...invoice, status: 'sent' as const });
        }
        
        // Refresh IMMEDIATELY after send confirmation (before closing modal)
        // This ensures UI shows correct data before modal closes
        try {
          await refreshInvoices();
        } catch (error) {
          console.error('Error refreshing invoices:', error);
        }
        
        // Handle queued vs sync messages
        if (payload?.queued) {
          showSuccess('Invoice Queued', `Invoice ${invoice.invoiceNumber} is being sent.`);
        } else {
        showSuccess('Invoice Sent', `Invoice ${invoice.invoiceNumber} has been sent successfully.`);
        }
        
        // Close modal AFTER refresh completes (ensures UI is updated)
        setSendInvoiceModal({ isOpen: false, invoice: null, isLoading: false });
      } else {
        showError('Send Failed', 'Failed to send invoice. Please try again.');
        setSendInvoiceModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      showError('Send Failed', 'Failed to send invoice. Please try again.');
      setSendInvoiceModal(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [getAuthHeaders, showSuccess, showError, showWarning, updateInvoice, refreshInvoices, settings]);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.type === 'fast') {
      setShowFastInvoice(true);
    } else {
      setShowCreateInvoice(true);
    }
  }, []);

  const handleMarkAsPaid = useCallback((invoice: Invoice) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Mark Invoice as Paid',
      message: `Are you sure you want to mark invoice ${invoice.invoiceNumber} as paid? This will update the invoice status and cannot be easily undone.`,
      type: 'success',
      onConfirm: () => performMarkAsPaid(invoice),
      isLoading: false,
      confirmText: 'Mark as Paid',
      cancelText: 'Cancel',
      infoBanner: undefined
    });
  }, []);

  const performMarkAsPaid = useCallback(async (invoice: Invoice) => {
    const actionKey = `paid-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      });

      if (response.ok) {
        const payload = await response.json();
        
        // Update global state with server response if available
        if (payload?.invoice) {
          updateInvoice(payload.invoice);
        } else {
        updateInvoice({ ...invoice, status: 'paid' as const });
        }
        
        // Refresh list to keep filters/pagination in sync
        try { await refreshInvoices(); } catch {}
        
        showSuccess('Invoice Updated', `Invoice ${invoice.invoiceNumber} has been marked as paid.`);
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
      } else {
        showError('Update Failed', 'Failed to mark invoice as paid. Please try again.');
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      showError('Update Failed', 'Failed to mark invoice as paid. Please try again.');
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [getAuthHeaders, showSuccess, showError]);

  const handleDuplicateInvoice = useCallback((invoice: Invoice) => {
    // Show modal instantly for better UX
    setConfirmationModal({
      isOpen: true,
      title: 'Duplicate Invoice',
      message: `Are you sure you want to duplicate invoice ${invoice.invoiceNumber}? This will create a new draft invoice with the same details that you can edit.`,
      type: 'info',
      onConfirm: () => performDuplicateInvoice(invoice),
      isLoading: false,
      confirmText: 'Create Duplicate',
      cancelText: 'Cancel',
      infoBanner: undefined
    });
    
    // Fetch subscription usage in background and update modal if needed
    // NOTE: Duplication ALWAYS checks limits because it creates a NEW invoice that can be edited
    getAuthHeaders().then(headers => {
      fetch('/api/subscription/usage', {
        headers,
        cache: 'no-store'
      }).then(usageResponse => {
        if (usageResponse.ok) {
          return usageResponse.json();
        }
        return null;
      }).then(usageData => {
        if (usageData && usageData.plan === 'pay_per_invoice') {
          const freeInvoicesRemaining = usageData.payPerInvoice?.freeInvoicesRemaining || 0;
          if (freeInvoicesRemaining === 0) {
            // Update modal with charge warning
            setConfirmationModal(prev => ({
              ...prev,
              message: `${prev.message}\n\n⚠️ Note: You've used all 5 free invoices. This duplicated invoice will be charged $0.50 when sent.`,
              type: 'warning'
            }));
          }
        }
      }).catch(error => {
        console.error('Error fetching subscription usage:', error);
        // Silently fail - modal already shown
      });
    });
  }, [getAuthHeaders]);

  const performDuplicateInvoice = useCallback(async (invoice: Invoice) => {
    const actionKey = `duplicate-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      // NOTE: Duplication ALWAYS checks subscription limits because it creates a NEW invoice
      // Even if the original invoice was sent/paid, the duplicate is a new draft that can be edited
      const headers = await getAuthHeaders();
      const response = await fetch('/api/invoices/duplicate', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.invoice) {
          // Add new invoice to global state
          addInvoice(result.invoice);
          // Refresh invoices list
          await refreshInvoices();
          showSuccess('Invoice Duplicated', `Invoice ${result.invoice.invoiceNumber} has been created. You can now edit it.`);
          setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          // Open the duplicated invoice for editing
          setSelectedInvoice(result.invoice);
          if (result.invoice.type === 'fast') {
            setShowFastInvoice(true);
          } else {
            setShowCreateInvoice(true);
          }
        }
      } else {
        const error = await response.json();
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        
        // Check if it's a subscription limit error
        if (error.limitReached) {
          // Fetch subscription usage to show upgrade modal
          try {
            const headers = await getAuthHeaders();
            const usageResponse = await fetch('/api/subscription/usage', {
              headers,
              cache: 'no-store'
            });
            
            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              // Show upgrade modal instead of error toast
              setShowUpgradeModal(true);
              setSubscriptionUsage(usageData);
              showError('Invoice Limit Reached', error.error || 'You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.');
            } else {
              showError('Invoice Limit Reached', error.error || 'You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.');
            }
          } catch (usageError) {
            console.error('Error fetching subscription usage:', usageError);
            showError('Invoice Limit Reached', error.error || 'You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.');
          }
        } else {
          showError('Duplicate Failed', error.error || 'Failed to duplicate invoice. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      showError('Duplicate Failed', 'Failed to duplicate invoice. Please try again.');
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [getAuthHeaders, showSuccess, showError, addInvoice, refreshInvoices]);

  const handleDeleteInvoice = useCallback((invoice: Invoice) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone and will permanently remove the invoice from your records.`,
      type: 'danger',
      onConfirm: () => performDeleteInvoice(invoice),
      isLoading: false,
      confirmText: 'Delete Invoice',
      cancelText: 'Cancel',
      infoBanner: undefined
    });
  }, []);

  const performDeleteInvoice = useCallback(async (invoice: Invoice) => {
    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        // Update local state instead of refetching
        deleteInvoice(invoice.id);
        showSuccess('Invoice Deleted', `Invoice ${invoice.invoiceNumber} has been deleted successfully.`);
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
      } else {
        showError('Delete Failed', 'Failed to delete invoice. Please try again.');
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showError('Delete Failed', 'Failed to delete invoice. Please try again.');
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    }
  }, [getAuthHeaders, showSuccess, showError]);

  // Modern Invoice Card Component - Responsive Design
  const ModernInvoiceCard = ({ invoice, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, handleMarkAsPaid, handleDeleteInvoice, handleDuplicateInvoice, getStatusIcon, getStatusColor, getDueDateStatus, formatPaymentTerms, formatLateFees, formatReminders, calculateDueCharges, loadingActions, paymentData }: {
    invoice: Invoice;
    handleViewInvoice: (invoice: Invoice) => void;
    handleDownloadPDF: (invoice: Invoice) => void;
    handleSendInvoice: (invoice: Invoice) => void;
    handleEditInvoice: (invoice: Invoice) => void;
    handleMarkAsPaid: (invoice: Invoice) => void;
    handleDeleteInvoice: (invoice: Invoice) => void;
    handleDuplicateInvoice: (invoice: Invoice) => void;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
    getDueDateStatus: (dueDate: string, invoiceStatus: string, paymentTerms?: { enabled: boolean; terms: string }, updatedAt?: string) => { status: string; days: number; color: string };
    formatPaymentTerms: (paymentTerms?: { enabled: boolean; terms: string }) => string | null;
    formatLateFees: (lateFees?: { enabled: boolean; type: 'fixed' | 'percentage'; amount: number; gracePeriod: number }) => string | null;
    formatReminders: (reminders?: { enabled: boolean; useSystemDefaults: boolean; rules?: Array<{ enabled: boolean }>; customRules?: Array<{ enabled: boolean }> }) => string | null;
    calculateDueCharges: (invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => { hasLateFees: boolean; lateFeeAmount: number; totalPayable: number; overdueDays: number; totalPaid: number; remainingBalance: number; isPartiallyPaid: boolean };
    loadingActions: { [key: string]: boolean };
    paymentData?: { totalPaid: number; remainingBalance: number } | null;
  }) => {
    const dueDateStatus = getDueDateStatus(invoice.dueDate, invoice.status, invoice.paymentTerms, (invoice as any).updatedAt);
    const dueCharges = calculateDueCharges(invoice, paymentData);
    
    return (
      <div className="border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
        {/* Mobile Layout */}
        <div className="block sm:hidden p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{color: '#1f2937'}}>
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-xs" style={{color: '#6b7280'}}>
                    {invoice.client?.name || 'Unknown Client'}
                  </div>
                </div>
              </div>
            <div className="text-right min-h-[56px] flex flex-col items-end">
              {(() => { const lf = invoice.lateFees as any; (invoice as any)._lateFeeShow = (dueCharges.hasLateFees || (lf && lf.enabled && dueDateStatus.status === 'overdue')); (invoice as any)._lateFeeAmount = dueCharges.hasLateFees ? dueCharges.lateFeeAmount : (lf ? (lf.type === 'fixed' ? lf.amount : (invoice.total * lf.amount)/100) : 0); (invoice as any)._displayTotal = (invoice as any)._lateFeeShow ? (invoice.total + (invoice as any)._lateFeeAmount) : dueCharges.totalPayable; return null; })()}
                <div className={`font-semibold text-base ${
                  invoice.status === 'paid' ? 'text-emerald-600' :
                  dueDateStatus.status === 'overdue' ? 'text-red-600' :
                  invoice.status === 'pending' || invoice.status === 'sent' ? 'text-orange-500' :
                  invoice.status === 'draft' ? 'text-gray-600' :
                  'text-red-600'
                }`}>
                  ${(((invoice as any)._displayTotal) || dueCharges.totalPayable).toLocaleString()}
                </div>
                {(invoice as any)._lateFeeShow ? (
                  <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500">
                    Base ${invoice.total.toLocaleString()} • Late fee {((invoice as any)._lateFeeAmount as number).toLocaleString()}
                  </div>
                ) : (
                  <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                )}
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-h-[24px]">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid' ? 'text-emerald-600' :
                  invoice.status === 'pending' || invoice.status === 'sent' ? 'text-orange-500' :
                  invoice.status === 'draft' ? 'text-gray-600' :
                  'text-red-600'
                }`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  {(invoice.type || 'detailed') === 'fast' ? 'Fast' : 'Detailed'}
                </span>
                {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1 min-h-[24px]">
                <button 
                  onClick={() => handleViewInvoice(invoice)}
                  className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer"
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
                <button 
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="PDF"
                >
                  {loadingActions[`pdf-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Download className="h-4 w-4 text-gray-700" />
                  )}
                </button>
                {invoice.status === 'draft' && (
                  <button 
                    onClick={() => handleSendInvoice(invoice)}
                    disabled={loadingActions[`send-${invoice.id}`]}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Send"
                  >
                    {loadingActions[`send-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Send className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                )}
                {(invoice.status === 'pending' || invoice.status === 'sent') && (
                  <button 
                    onClick={() => handleMarkAsPaid(invoice)}
                    disabled={loadingActions[`paid-${invoice.id}`]}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

        {/* Desktop Layout - Mirror Invoices page structure */}
        <div className="hidden sm:block p-4">
          <div className="space-y-3">
            {/* Row 1: Info (left) + Amount/Date (right) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{color: '#1f2937'}}>
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-xs" style={{color: '#6b7280'}}>
                      {invoice.client?.name || 'Unknown Client'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right min-h-[56px] flex flex-col items-end">
                {(() => { const lf = invoice.lateFees as any; (invoice as any)._lateFeeShow2 = (dueCharges.hasLateFees || (lf && lf.enabled && dueDateStatus.status === 'overdue')); (invoice as any)._lateFeeAmount2 = dueCharges.hasLateFees ? dueCharges.lateFeeAmount : (lf ? (lf.type === 'fixed' ? lf.amount : (invoice.total * lf.amount)/100) : 0); (invoice as any)._displayTotal2 = (invoice as any)._lateFeeShow2 ? (invoice.total + (invoice as any)._lateFeeAmount2) : dueCharges.totalPayable; return null; })()}
                <div className={`font-semibold text-base ${
                  invoice.status === 'paid' ? 'text-emerald-600' :
                  dueDateStatus.status === 'overdue' ? 'text-red-600' :
                  invoice.status === 'pending' || invoice.status === 'sent' ? 'text-orange-500' :
                  invoice.status === 'draft' ? 'text-gray-600' :
                  'text-red-600'
                }`}>
                  ${(((invoice as any)._displayTotal2) || dueCharges.totalPayable).toLocaleString()}
                </div>
                {(invoice as any)._lateFeeShow2 ? (
                  <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500">
                    Base ${invoice.total.toLocaleString()} • Late fee {((invoice as any)._lateFeeAmount2 as number).toLocaleString()}
                  </div>
                ) : (
                  <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                )}
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Row 2: Status chips (left) + Actions (right) - mirror invoices page */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid' ? 'text-emerald-600' :
                  invoice.status === 'pending' || invoice.status === 'sent' ? 'text-orange-500' :
                  invoice.status === 'draft' ? 'text-gray-600' :
                  'text-red-600'
                }`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
                </span>
                {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handleViewInvoice(invoice)}
                  className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer"
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="PDF"
                >
                  {loadingActions[`pdf-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Download className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => handleDuplicateInvoice(invoice)}
                  disabled={loadingActions[`duplicate-${invoice.id}`]}
                  className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`duplicate-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Duplicate"
                >
                  {loadingActions[`duplicate-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {invoice.status === 'draft' && (
                  <button 
                    onClick={() => handleSendInvoice(invoice)}
                    disabled={loadingActions[`send-${invoice.id}`]}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Send"
                  >
                    {loadingActions[`send-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Send className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                )}
                {(invoice.status === 'pending' || invoice.status === 'sent') && (
                  <button 
                    onClick={() => handleMarkAsPaid(invoice)}
                    disabled={loadingActions[`paid-${invoice.id}`]}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Mark Paid"
                  >
                    {loadingActions[`paid-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Memoized Invoice Card Component - optimized with React.memo
  const InvoiceCard = React.memo(({ invoice, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, handleMarkAsPaid, handleDeleteInvoice, handleDuplicateInvoice, getStatusIcon, getStatusColor, getDueDateStatus, formatPaymentTerms, formatLateFees, formatReminders, calculateDueCharges, loadingActions, paymentData }: {
    invoice: Invoice;
    handleViewInvoice: (invoice: Invoice) => void;
    handleDownloadPDF: (invoice: Invoice) => void;
    handleSendInvoice: (invoice: Invoice) => void;
    handleEditInvoice: (invoice: Invoice) => void;
    handleMarkAsPaid: (invoice: Invoice) => void;
    handleDeleteInvoice: (invoice: Invoice) => void;
    handleDuplicateInvoice: (invoice: Invoice) => void;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
    getDueDateStatus: (dueDate: string, invoiceStatus: string, paymentTerms?: { enabled: boolean; terms: string }, updatedAt?: string) => { status: string; days: number; color: string };
    formatPaymentTerms: (paymentTerms?: { enabled: boolean; terms: string }) => string | null;
    formatLateFees: (lateFees?: { enabled: boolean; type: 'fixed' | 'percentage'; amount: number; gracePeriod: number }) => string | null;
    formatReminders: (reminders?: { enabled: boolean; useSystemDefaults: boolean; rules?: Array<{ enabled: boolean }>; customRules?: Array<{ enabled: boolean }> }) => string | null;
    calculateDueCharges: (invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => { hasLateFees: boolean; lateFeeAmount: number; totalPayable: number; overdueDays: number; totalPaid: number; remainingBalance: number; isPartiallyPaid: boolean };
    loadingActions: { [key: string]: boolean };
    paymentData?: { totalPaid: number; remainingBalance: number } | null;
  }) => {
    const dueDateStatus = getDueDateStatus(invoice.dueDate, invoice.status, invoice.paymentTerms, (invoice as any).updatedAt);
    const dueCharges = calculateDueCharges(invoice, paymentData);
    
    
    // Show enhanced features for all invoice statuses
    const paymentTerms = formatPaymentTerms(invoice.paymentTerms);
    const lateFees = formatLateFees(invoice.lateFees);
    const reminders = formatReminders(invoice.reminders);
    
    return (
    <div className="border p-4 transition-all duration-200 hover:shadow-md bg-white border-gray-300 hover:shadow-lg">
      <div className="space-y-6">
        {/* Invoice Info Row */}
        <div className="space-y-4 sm:space-y-0">
          {/* Mobile Layout */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="font-heading text-sm font-semibold" style={{color: '#1f2937'}}>
                  {invoice.invoiceNumber}
                </div>
                <span 
                  className={`px-2 py-0.5 text-xs font-medium rounded-full border`}
                  style={((invoice.type || 'detailed') === 'fast' 
                    ? { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }
                    : { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' }
                  )}
                >
                  {(invoice.type || 'detailed') === 'fast' ? 'Fast' : 'Detailed'}
                </span>
              </div>
              <div className={`font-heading text-lg font-bold ${
                invoice.status === 'paid' ? 'text-emerald-600' :
                invoice.status === 'pending' ? 'text-orange-500' :
                invoice.status === 'draft' ? 'text-gray-600' :
                dueDateStatus.status === 'overdue' ? 'text-red-600' :
                'text-gray-800'
              }`}>
                ${dueCharges.totalPayable.toFixed(2)}
                  </div>
                {dueCharges.isPartiallyPaid ? (
                  <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500">
                    Paid: ${dueCharges.totalPaid.toFixed(2)} • Remaining: ${dueCharges.remainingBalance.toFixed(2)}
                    {dueCharges.hasLateFees && ` • Late fee: ${dueCharges.lateFeeAmount.toFixed(2)}`}
                  </div>
                ) : dueCharges.hasLateFees ? (
                  <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500">
                    Base ${invoice.total.toLocaleString()} • Late fee ${dueCharges.lateFeeAmount.toLocaleString()}
                  </div>
                ) : (
                  <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                )}
              </div>
            <div className="text-xs" style={{color: '#374151'}}>
              {new Date(invoice.createdAt).toLocaleDateString()}
            </div>
            <div className="text-sm font-medium" style={{color: '#1f2937'}}>
              {invoice.client?.name || 'Unknown Client'}
            </div>
            {invoice.client?.company && (
              <div className="text-sm" style={{color: '#374151'}}>
                {invoice.client?.company}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span 
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border`}
                style={getStatusStyle(invoice.status)}
              >
                {getStatusIcon(invoice.status)}
                <span className="capitalize">{invoice.status}</span>
              </span>
              {dueCharges.isPartiallyPaid && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
                  <DollarSign className="h-3 w-3" />
                  <span>Partial Paid</span>
                </span>
              )}
              {(invoice.status === 'pending' || invoice.status === 'sent') && dueDateStatus.status === 'overdue' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-800 border-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{dueDateStatus.days}d overdue</span>
                  </span>
              )}
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                  <div className="font-heading text-sm font-semibold" style={{color: '#1f2937'}}>
                  {invoice.invoiceNumber}
                </div>
              </div>
                <div className="text-xs" style={{color: '#374151'}}>
                  {new Date(invoice.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
                <div className="text-sm font-medium" style={{color: '#1f2937'}}>
                {invoice.client?.name || 'Unknown Client'}
              </div>
                {invoice.client?.company && (
                  <div className="text-sm" style={{color: '#374151'}}>
                {invoice.client?.company}
              </div>
                )}
            </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
            <div className={`font-heading text-lg font-bold ${
                  invoice.status === 'paid' ? 'text-green-700' :
                    invoice.status === 'pending' ? 'text-orange-500' :
                    invoice.status === 'draft' ? 'text-gray-600' :
                  dueDateStatus.status === 'overdue' ? 'text-red-600' :
                  'text-gray-700'
            }`}>
              ${dueCharges.totalPayable.toFixed(2)}
                </div>
              {dueCharges.isPartiallyPaid ? (
                <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500">
                  Paid: ${dueCharges.totalPaid.toFixed(2)} • Remaining: ${dueCharges.remainingBalance.toFixed(2)}
                  {dueCharges.hasLateFees && ` • Late fee: ${dueCharges.lateFeeAmount.toFixed(2)}`}
            </div>
              ) : dueCharges.hasLateFees ? (
                <div className="mt-0.5 mb-1 text-[10px] sm:text-xs text-gray-500">
                  Base ${invoice.total.toLocaleString()} • Late fee ${dueCharges.lateFeeAmount.toLocaleString()}
            </div>
              ) : (
                <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
              )}
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
          </div>
        </div>
        
                <div className="flex items-center space-x-2">
              <span 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border`}
                  style={getStatusStyle(invoice.status)}
              >
                {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
              </span>
              {dueCharges.isPartiallyPaid && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
                  <DollarSign className="h-3 w-3" />
                  <span>Partial Paid</span>
                </span>
              )}
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border`}
                  style={((invoice.type || 'detailed') === 'fast' 
                    ? { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }
                    : { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' }
                  )}
                >
                  {(invoice.type || 'detailed') === 'fast' ? 'Fast' : 'Detailed'}
                  </span>
                {invoice.status === 'pending' && dueDateStatus.status === 'overdue' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-800 border-red-300">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
              )}
            </div>
          </div>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2 pt-3">
          <button 
            onClick={() => handleViewInvoice(invoice)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={() => handleDownloadPDF(invoice)}
            disabled={loadingActions[`pdf-${invoice.id}`]}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loadingActions[`pdf-${invoice.id}`] ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleDuplicateInvoice(invoice)}
            disabled={loadingActions[`duplicate-${invoice.id}`]}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-300 ${loadingActions[`duplicate-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loadingActions[`duplicate-${invoice.id}`] ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>Duplicate</span>
          </button>
          {invoice.status === 'draft' && (
            <button 
              onClick={() => handleSendInvoice(invoice)}
              disabled={loadingActions[`send-${invoice.id}`]}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-300 ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loadingActions[`send-${invoice.id}`] ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Send</span>
            </button>
          )}
          {invoice.status === 'pending' && (
            <button 
              onClick={() => handleMarkAsPaid(invoice)}
              disabled={loadingActions[`paid-${invoice.id}`]}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loadingActions[`paid-${invoice.id}`] ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              <span>Mark as Paid</span>
            </button>
          )}
          {invoice.status === 'draft' && (
            <>
              <button 
                onClick={() => handleEditInvoice(invoice)}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-300 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button 
                onClick={() => handleDeleteInvoice(invoice)}
                disabled={loadingActions[`delete-${invoice.id}`]}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs transition-all duration-200 font-medium bg-red-50 text-red-800 hover:bg-red-100 border border-red-300 ${loadingActions[`delete-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {loadingActions[`delete-${invoice.id}`] ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    );
  });

  InvoiceCard.displayName = 'InvoiceCard';



  // Settings are now loaded by SettingsContext

  // Optimized data loading - only handle stats since invoices/clients are global
  // Stats are calculated from invoices, so no need for separate loading state
  const loadData = useCallback(async () => {
    if (!user || loading || dataLoaded) return;
    
    try {
      const headers = await getAuthHeaders();
      
      // Only load stats since invoices and clients are managed globally
      const response = await fetch('/api/dashboard/stats', { 
        headers,
        cache: 'force-cache' 
      });
      
      if (response.ok) {
        // Stats are calculated from invoices, so no loading state needed
        setIsLoadingStats(false);
        setDataLoaded(true);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Don't show loading state on error - stats are calculated from invoices anyway
      setIsLoadingStats(false);
      setHasError(true);
      setErrorMessage('Failed to load dashboard stats. Please try refreshing the page.');
    }
  }, [user, loading, dataLoaded, getAuthHeaders]);

  // Load data on mount
  useEffect(() => {
      loadData();
  }, [loadData]);

  // Set dataLoaded to true when both loading states are false
  useEffect(() => {
    if (!isLoadingStats && !isLoadingInvoices) {
      setDataLoaded(true);
    }
  }, [isLoadingStats, isLoadingInvoices]);

  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset error state when data loads successfully
  useEffect(() => {
    if (dataLoaded && !hasError) {
      setErrorMessage('');
    }
  }, [dataLoaded, hasError]);

  // Update selectedInvoice when invoices are updated globally
  useEffect(() => {
    if (selectedInvoice && invoices.length > 0) {
      const updatedInvoice = invoices.find(invoice => invoice.id === selectedInvoice.id);
      if (updatedInvoice && JSON.stringify(updatedInvoice) !== JSON.stringify(selectedInvoice)) {
        setSelectedInvoice(updatedInvoice);
      }
    }
  }, [invoices, selectedInvoice]);

  // Optimized calculations with better memoization and early returns
  const dashboardStats = useMemo(() => {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return {
        recentInvoices: [],
        totalRevenue: 0,
        totalPayableAmount: 0,
        overdueCount: 0,
        totalLateFees: 0
      };
    }

    // Pre-calculate today's start time once
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    let totalRevenue = 0;
    let totalPayableAmount = 0;
    let overdueCount = 0;
    let totalLateFees = 0;
    
    // Use for...of for better performance than forEach
    for (const invoice of invoices) {
      const { status, total, dueDate } = invoice;
      
      // Total revenue calculation - includes fully paid invoices and partial payments
      if (status === 'paid') {
        // Fully paid invoice - add full total
        totalRevenue += total;
      } else {
        // Check for partial payments on non-paid invoices
        const paymentData = paymentDataMap[invoice.id];
        if (paymentData && paymentData.totalPaid > 0) {
          // Add partial payments to revenue
          totalRevenue += paymentData.totalPaid;
        }
      }
      
      // Total payable and overdue count (pending/sent invoices only)
      if (status === 'pending' || status === 'sent') {
      const charges = calculateDueCharges(invoice, paymentDataMap[invoice.id] || null);
        totalPayableAmount += charges.totalPayable;
        totalLateFees += charges.lateFeeAmount;
        
        // Check if overdue - optimized date comparison
        const effectiveDueDate = parseDateOnly(dueDate);
        const dueDateStart = new Date(Date.UTC(effectiveDueDate.getFullYear(), effectiveDueDate.getMonth(), effectiveDueDate.getDate()));
        if (dueDateStart < todayStart) {
          overdueCount++;
        }
      }
    }
    
    // Deduplicate invoices by ID to prevent duplicate keys
    const uniqueInvoices = invoices.filter((invoice, index, self) => 
      index === self.findIndex(i => i.id === invoice.id)
    );
    
    return {
      recentInvoices: uniqueInvoices.slice(0, 8),
      totalRevenue,
      totalPayableAmount,
      overdueCount,
      totalLateFees
    };
  }, [invoices, calculateDueCharges, parseDateOnly, paymentDataMap]);
  
  // Extract individual values for easier access
  const { recentInvoices, totalRevenue, totalPayableAmount, overdueCount, totalLateFees } = dashboardStats;
  
  // Calculate total clients (simple, no need to include in complex calculation)
  const totalClients = clients.length;

  // Calculate overdue, due today, and upcoming invoices
  const dueInvoices = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return { overdue: [], dueToday: [], upcoming: [] };
    }
    
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStart = new Date(Date.UTC(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate()));
    
    const parseFn = parseDateOnlyRef.current || parseDateOnly;
    
    const overdue: Invoice[] = [];
    const dueToday: Invoice[] = [];
    const upcoming: Invoice[] = [];
    
    invoices.forEach(invoice => {
        const status = invoice.status;
      if (status === 'paid' || status === 'draft') return;
        
          const dueDate = parseFn(invoice.dueDate);
        const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
        
        const diffTime = dueDateStart.getTime() - todayStart.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
      if (diffDays < 0) {
        // Overdue
        overdue.push(invoice);
      } else if (diffDays === 0) {
        // Due today
        dueToday.push(invoice);
      } else if (diffDays > 0 && diffDays <= 7) {
        // Upcoming (next 7 days)
        upcoming.push(invoice);
      }
    });
    
    // Sort overdue by days overdue (most overdue first)
    overdue.sort((a, b) => {
        const dateA = parseDateOnly(a.dueDate);
        const dateB = parseDateOnly(b.dueDate);
        return dateA.getTime() - dateB.getTime();
    });
    
    // Sort due today and upcoming by due date (earliest first)
    dueToday.sort((a, b) => {
      const dateA = parseDateOnly(a.dueDate);
      const dateB = parseDateOnly(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
    
    upcoming.sort((a, b) => {
      const dateA = parseDateOnly(a.dueDate);
      const dateB = parseDateOnly(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
    
    return { overdue, dueToday, upcoming };
  }, [invoices, parseDateOnly]);

  // Determine which tabs have data - must be after dueInvoices is defined
  const availableTabs = useMemo(() => {
    const tabs: number[] = [];
    
    // Tab 0: Invoice List - show if there are any due invoices
    const hasDueInvoices = dueInvoices.overdue.length > 0 || dueInvoices.dueToday.length > 0 || dueInvoices.upcoming.length > 0;
    if (hasDueInvoices) tabs.push(0);
    
    // Tab 1: Analytics - show if there are any due invoices (same data as tab 0)
    if (hasDueInvoices) tabs.push(1);
    
    // Tab 2: Invoice Performance - show if there are any invoices
    if (invoices.length > 0) tabs.push(2);
    
    // Tab 3: Conversion Rate - show if there are any sent/paid invoices
    const totalSent = invoices.filter(inv => inv.status === 'sent' || inv.status === 'paid').length;
    if (totalSent > 0) tabs.push(3);
    
    // Tab 4: Payment Activity - show if there are any payments
    if (paymentActivity.length > 0) tabs.push(4);
    
    // Tab 5: Upcoming Reminders - show if there are any scheduled reminders
    if (upcomingReminders.length > 0) tabs.push(5);
    
    return tabs;
  }, [dueInvoices, invoices, paymentActivity.length, upcomingReminders.length]);

  // Scroll handler for dot indicator - each slide is full-width
  const handleDueInvoicesScrollUpdated = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Skip scroll handling during sidebar transitions to prevent lag
    if (sidebarTransitioningRef.current) {
      return;
    }
    
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const slideWidth = container.clientWidth; // Each slide is full-width (100% of container)
    const tabsCount = availableTabs.length;
    
    if (tabsCount === 0 || slideWidth === 0) return;
    
    // Use requestAnimationFrame to debounce and ensure smooth updates
    // This prevents interference with native snap scrolling
    requestAnimationFrame(() => {
      // Skip if sidebar is transitioning (double-check)
      if (sidebarTransitioningRef.current) {
        return;
      }
      
      // Calculate active index using center-point detection
      // This updates the dot when the next slide is at least 50% visible
      // Formula: floor((scrollLeft + slideWidth / 2) / slideWidth)
      const activeIndex = Math.floor((container.scrollLeft + slideWidth / 2) / slideWidth);
      
      // Clamp to valid range (0 to tabsCount - 1)
      const clampedIndex = Math.max(0, Math.min(activeIndex, tabsCount - 1));
      
      // Only update if index actually changed to prevent skipped indices during momentum scrolling
      if (clampedIndex !== previousScrollIndexRef.current) {
        previousScrollIndexRef.current = clampedIndex;
        setDueInvoicesScrollIndex(clampedIndex);
      }
    });
  }, [availableTabs]);

  // Function to scroll to specific slide - each slide is full-width
  const scrollToDueInvoicesSlideUpdated = useCallback((scrollIndex: number) => {
    if (dueInvoicesScrollRef.current && scrollIndex >= 0 && scrollIndex < availableTabs.length) {
      const container = dueInvoicesScrollRef.current;
      const slideWidth = container.clientWidth; // Each slide is full-width (100% of container)
      
      if (slideWidth === 0) return;
      
      // Scroll to the specific full-width slide
      container.scrollTo({
        left: scrollIndex * slideWidth,
        behavior: 'smooth'
      });
      
      // Update ref and state immediately when clicking to keep dots in sync
      previousScrollIndexRef.current = scrollIndex;
      setDueInvoicesScrollIndex(scrollIndex);
    }
  }, [availableTabs]);

  // Sync scroll position and dot indicator on mount/tabs change
  useEffect(() => {
    const container = dueInvoicesScrollRef.current;
    if (!container || availableTabs.length === 0) return;

    // Reset to first tab immediately
    container.scrollLeft = 0;
    previousScrollIndexRef.current = 0;
    setDueInvoicesScrollIndex(0);
    
    // Also ensure correct position after a brief delay to catch any layout changes
    requestAnimationFrame(() => {
      if (container && availableTabs.length > 0) {
        container.scrollLeft = 0;
      }
    });
  }, [availableTabs]);

  // Maintain scroll position only on actual window resize (not sidebar transitions)
  // This allows sidebar to animate smoothly without interference
  useEffect(() => {
    const container = dueInvoicesScrollRef.current;
    if (!container || availableTabs.length === 0) return;

    // Track actual window dimensions to distinguish real resize from layout changes
    let lastWindowWidth = window.innerWidth;
    let lastWindowHeight = window.innerHeight;

    // Update scroll to maintain current slide position
    const updateScrollToCurrentSlide = () => {
      // Skip during sidebar transitions
      if (sidebarTransitioningRef.current) {
        return;
      }
      
      if (!container || availableTabs.length === 0) return;
      const currentScrollIndex = previousScrollIndexRef.current;
      const currentContainerWidth = container.clientWidth;
      if (currentContainerWidth > 0) {
        const targetScrollLeft = currentScrollIndex * currentContainerWidth;
        container.scrollLeft = targetScrollLeft;
        console.log('📜 Dashboard: Updated scroll position:', {
          index: currentScrollIndex,
          containerWidth: currentContainerWidth,
          scrollLeft: targetScrollLeft,
          timestamp: `${performance.now().toFixed(2)}ms`
        });
      }
    };

    // Only handle actual window resize - ignore sidebar transitions and layout changes
    let windowResizeTimeout: NodeJS.Timeout | null = null;
    const handleWindowResize = () => {
      // Skip during sidebar transitions
      if (sidebarTransitioningRef.current) {
        console.log('🟡 Dashboard RESIZE IGNORED (sidebar transitioning)');
        return;
      }
      
      const timestamp = performance.now();
      // Check if window dimensions actually changed (not just layout)
      const currentWindowWidth = window.innerWidth;
      const currentWindowHeight = window.innerHeight;
      
      // Only proceed if window size actually changed
      if (currentWindowWidth === lastWindowWidth && currentWindowHeight === lastWindowHeight) {
        console.log('🟡 Dashboard RESIZE IGNORED (layout change, not window resize):', {
          timestamp: `${timestamp.toFixed(2)}ms`,
          windowWidth: currentWindowWidth,
          windowHeight: currentWindowHeight,
          reason: 'Dimensions unchanged - likely sidebar animation'
        });
        return;
      }
      
      console.group('🟠 Dashboard: WINDOW RESIZE EVENT');
      console.log('📐 Window Size Change:', {
        timestamp: `${timestamp.toFixed(2)}ms`,
        from: { width: lastWindowWidth, height: lastWindowHeight },
        to: { width: currentWindowWidth, height: currentWindowHeight }
      });
      
      // Update tracked dimensions
      lastWindowWidth = currentWindowWidth;
      lastWindowHeight = currentWindowHeight;

      if (windowResizeTimeout) clearTimeout(windowResizeTimeout);
      windowResizeTimeout = setTimeout(() => {
        // Double-check sidebar isn't transitioning
        if (sidebarTransitioningRef.current) {
          console.log('🟡 Dashboard: Skipping scroll update (sidebar transitioning)');
          return;
        }
        if (container && availableTabs.length > 0) {
          console.log('⏱️ Dashboard: Executing scroll update after debounce');
          updateScrollToCurrentSlide();
        }
        console.groupEnd();
      }, 150); // Slightly longer debounce to avoid interfering with animations
    };
    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (windowResizeTimeout) clearTimeout(windowResizeTimeout);
    };
  }, [availableTabs]);


  // Calculate invoice trends for the conversion rate slide
  const invoiceTrends = useMemo(() => {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return {
        monthlyRevenue: [],
        statusDistribution: { paid: 0, pending: 0, sent: 0, draft: 0, cancelled: 0 },
        monthlyPayments: [],
        monthlyVolume: []
      };
    }

    const now = new Date();
    
    // Initialize monthly data with date info for matching
    const monthlyRevenue: Array<{ month: string; revenue: number; year: number; monthIndex: number }> = [];
    const monthlyPayments: Array<{ month: string; payments: number }> = [];
    const monthlyVolume: Array<{ month: string; count: number; year: number; monthIndex: number }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyRevenue.push({ month: monthKey, revenue: 0, year: date.getFullYear(), monthIndex: date.getMonth() });
      monthlyPayments.push({ month: monthKey, payments: 0 });
      monthlyVolume.push({ month: monthKey, count: 0, year: date.getFullYear(), monthIndex: date.getMonth() });
    }

    // Status distribution
    const statusDistribution = {
      paid: 0,
      pending: 0,
      sent: 0,
      draft: 0,
      cancelled: 0
    };

    // Process invoices
    invoices.forEach(invoice => {
      // Status distribution
      if (invoice.status in statusDistribution) {
        statusDistribution[invoice.status as keyof typeof statusDistribution]++;
      }

      // Get invoice date
      const invoiceDate = new Date(invoice.createdAt || invoice.updatedAt || new Date());
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonthIndex = invoiceDate.getMonth();
      
      // Find matching month index
      const monthIndex = monthlyVolume.findIndex(m => {
        return m.year === invoiceYear && m.monthIndex === invoiceMonthIndex;
      });

      if (monthIndex >= 0) {
        // Monthly volume
        monthlyVolume[monthIndex].count++;

        // Monthly revenue (from paid invoices and partial payments)
        if (invoice.status === 'paid') {
          monthlyRevenue[monthIndex].revenue += invoice.total;
          monthlyPayments[monthIndex].payments += invoice.total;
        } else {
          const paymentData = paymentDataMap[invoice.id];
          if (paymentData && paymentData.totalPaid > 0) {
            monthlyRevenue[monthIndex].revenue += paymentData.totalPaid;
            monthlyPayments[monthIndex].payments += paymentData.totalPaid;
          }
        }
      }
    });

    return {
      monthlyRevenue,
      statusDistribution,
      monthlyPayments,
      monthlyVolume
    };
  }, [invoices, paymentDataMap]);

  // Helper function to render recent invoices section
  const renderRecentInvoicesSection = useCallback(() => {
    if (isLoadingInvoices || !hasInitiallyLoaded) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-gray-200 bg-white p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                <div className="flex items-center justify-between mt-4">
                  <div className="h-6 bg-gray-300 rounded w-20"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (hasInitiallyLoaded && !isLoadingInvoices && invoices.length === 0) {
      return (
        <div className="p-8 text-center bg-white border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          
          <h3 className="text-lg font-semibold mb-2" style={{color: '#1f2937'}}>
            No invoices yet
          </h3>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{color: '#6b7280'}}>
            Create your first invoice to start tracking payments and managing your business.
          </p>
          
          <button
            onClick={handleCreateInvoice}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      );
    }
    if (recentInvoices.length > 0) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:items-start">
          {/* Invoice Insights - Second on Mobile, Right Side on Desktop - Horizontal Scrollable - Only show if tabs are available */}
          {availableTabs.length > 0 && (
          <div className="space-y-3 sm:space-y-4 order-2 lg:order-2">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                Invoice Insights
              </h2>
              <button
                onClick={() => router.push('/dashboard/invoices')}
                className="group flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 transition-colors text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            {/* Horizontal Scrollable Container with Snap */}
            <div className="relative">
              {/* Scroll Indicator Dots with Navigation Arrows - Only show for available tabs */}
              {availableTabs.length > 1 && (
                <div 
                  ref={dotsContainerRef}
                  className="flex items-center justify-center gap-2 mb-3 overflow-x-auto scrollbar-hide"
                  style={{ 
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {/* Left Arrow Button - Desktop Only */}
                  <button
                    onClick={() => {
                      const prevIndex = Math.max(0, dueInvoicesScrollIndex - 1);
                      scrollToDueInvoicesSlideUpdated(prevIndex);
                    }}
                    disabled={dueInvoicesScrollIndex === 0}
                    className="hidden lg:flex items-center justify-center w-6 h-6 p-0 flex-shrink-0 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ borderRadius: 0 }}
                    aria-label="Previous tab"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {/* Dots */}
                  {availableTabs.map((actualTabIndex, scrollIndex) => {
                    const tabLabels = [
                      'Go to invoices list',
                      'Go to analytics',
                      'Go to invoice performance',
                      'Go to conversion rate',
                      'Go to payment activity',
                      'Go to upcoming reminders'
                    ];
                    return (
                      <button
                        key={actualTabIndex}
                        onClick={() => scrollToDueInvoicesSlideUpdated(scrollIndex)}
                        className={`w-2 h-2 p-0 flex-shrink-0 aspect-square rounded-full border-0 outline-none transition-all ${
                          dueInvoicesScrollIndex === scrollIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={tabLabels[actualTabIndex]}
                      ></button>
                    );
                  })}
                  
                  {/* Right Arrow Button - Desktop Only */}
                  <button
                    onClick={() => {
                      const nextIndex = Math.min(availableTabs.length - 1, dueInvoicesScrollIndex + 1);
                      scrollToDueInvoicesSlideUpdated(nextIndex);
                    }}
                    disabled={dueInvoicesScrollIndex === availableTabs.length - 1}
                    className="hidden lg:flex items-center justify-center w-6 h-6 p-0 flex-shrink-0 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ borderRadius: 0 }}
                    aria-label="Next tab"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              
              {/* Scroll Container - Production-grade: Maintains position during transitions */}
              <div 
                ref={dueInvoicesScrollRef}
                className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-optimized-desktop"
                onScroll={handleDueInvoicesScrollUpdated}
                style={{ 
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                  scrollBehavior: 'smooth', // Smooth for snap scrolling
                  scrollSnapType: 'x mandatory', // Enable snap scrolling
                  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                  WebkitScrollSnapType: 'x mandatory', // Safari support
                  scrollSnapStop: 'always', // Prevent skipping tabs
                  contain: 'layout style', // Isolate layout calculations to prevent affecting sidebar animation
                  position: 'relative', // For proper overflow handling
                  width: '100%', // Ensure full width
                }}
              >
                <div 
                  className="flex h-full" 
                  style={{ 
                    width: `${availableTabs.length * 100}%`,
                    scrollSnapType: 'x mandatory' // Ensure snap on flex container
                  }}
                >
                  {/* Slide 1: Due Invoices List - Only render if tab 0 is available */}
                  {availableTabs.includes(0) && (
                  <div className="flex-shrink-0 snap-start w-full" style={{ 
                    width: `${100 / availableTabs.length}%`, 
                    minWidth: `${100 / availableTabs.length}%`, 
                    maxWidth: `${100 / availableTabs.length}%`,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    boxSizing: 'border-box',
                    paddingRight: '0.5rem'
                  }}>
                    {dueInvoices.overdue.length === 0 && dueInvoices.dueToday.length === 0 && dueInvoices.upcoming.length === 0 ? (
                      <div className="bg-white border border-gray-200 p-8 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2" style={{color: '#9ca3af'}} />
                        <p className="text-sm" style={{color: '#6b7280'}}>No invoices due</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Overdue Section */}
                        {dueInvoices.overdue.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <h3 className="text-sm font-semibold text-red-600">Overdue</h3>
                              <span className="text-xs text-gray-500">({dueInvoices.overdue.length})</span>
                            </div>
                            <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                              {dueInvoices.overdue.map((invoice) => {
                                const paymentData = paymentDataMap[invoice.id] || null;
                                const dueCharges = calculateDueCharges(invoice, paymentData);
                                const dueDate = parseDateOnly(invoice.dueDate);
                                const today = new Date();
                                const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                                const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
                                const daysOverdue = Math.floor((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24));
                                
                                return (
                                  <div
                                    key={invoice.id}
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-900 truncate">
                                            {invoice.invoiceNumber}
                                          </span>
                                          <span className="text-xs text-gray-500 truncate">
                                            {invoice.client?.name || 'Unknown Client'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <span>{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</span>
                                          <span>•</span>
                                          <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right">
                                        <div className="text-sm font-semibold text-red-600">
                                          ${dueCharges.totalPayable.toFixed(2)}
                                        </div>
                                        {dueCharges.isPartiallyPaid && (
                                          <div className="text-xs text-gray-500">
                                            ${dueCharges.totalPaid.toFixed(2)} paid
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Due Today Section */}
                        {dueInvoices.dueToday.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <h3 className="text-sm font-semibold text-amber-600">Due Today</h3>
                              <span className="text-xs text-gray-500">({dueInvoices.dueToday.length})</span>
                            </div>
                            <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                              {dueInvoices.dueToday.map((invoice) => {
                                const paymentData = paymentDataMap[invoice.id] || null;
                                const dueCharges = calculateDueCharges(invoice, paymentData);
                                
                                return (
                                  <div
                                    key={invoice.id}
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-900 truncate">
                                            {invoice.invoiceNumber}
                                          </span>
                                          <span className="text-xs text-gray-500 truncate">
                                            {invoice.client?.name || 'Unknown Client'}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Due today
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right">
                                        <div className="text-sm font-semibold text-amber-600">
                                          ${dueCharges.totalPayable.toFixed(2)}
                                        </div>
                                        {dueCharges.isPartiallyPaid && (
                                          <div className="text-xs text-gray-500">
                                            ${dueCharges.totalPaid.toFixed(2)} paid
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Upcoming Section */}
                        {dueInvoices.upcoming.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <h3 className="text-sm font-semibold text-blue-600">Upcoming</h3>
                              <span className="text-xs text-gray-500">({dueInvoices.upcoming.length})</span>
                            </div>
                            <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                              {dueInvoices.upcoming.map((invoice) => {
                                const paymentData = paymentDataMap[invoice.id] || null;
                                const dueCharges = calculateDueCharges(invoice, paymentData);
                                const dueDate = parseDateOnly(invoice.dueDate);
                                const today = new Date();
                                const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                                const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
                                const daysUntilDue = Math.floor((dueDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                                
                                return (
                                  <div
                                    key={invoice.id}
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-900 truncate">
                                            {invoice.invoiceNumber}
                                          </span>
                                          <span className="text-xs text-gray-500 truncate">
                                            {invoice.client?.name || 'Unknown Client'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <span>Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</span>
                                          <span>•</span>
                                          <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                      <div className="ml-4 text-right">
                                        <div className="text-sm font-semibold text-gray-900">
                                          ${dueCharges.totalPayable.toFixed(2)}
                                        </div>
                                        {dueCharges.isPartiallyPaid && (
                                          <div className="text-xs text-gray-500">
                                            ${dueCharges.totalPaid.toFixed(2)} paid
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Slide 2: Due Invoices Analytics Graph - Only render if tab 1 is available */}
                  {availableTabs.includes(1) && (
                  <div className="flex-shrink-0 snap-start flex self-start w-full" style={{ 
                    width: `${100 / availableTabs.length}%`, 
                    minWidth: `${100 / availableTabs.length}%`, 
                    maxWidth: `${100 / availableTabs.length}%`,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    boxSizing: 'border-box',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem'
                  }}>
                    <div className="bg-white border border-gray-200 pt-6 px-6 pb-6 w-full flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Analytics</h3>
                      
                      {(() => {
                        const allDue = [...dueInvoices.overdue, ...dueInvoices.dueToday, ...dueInvoices.upcoming];
                        const today = new Date();
                        const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                        
                        // Calculate totals
                        const totalAmount = allDue.reduce((sum, inv) => {
                          const paymentData = paymentDataMap[inv.id];
                          const dueCharges = calculateDueCharges(inv, paymentData);
                          return sum + dueCharges.totalPayable;
                        }, 0);
                        
                        const overdueTotal = dueInvoices.overdue.reduce((sum, inv) => {
                          const paymentData = paymentDataMap[inv.id];
                          const dueCharges = calculateDueCharges(inv, paymentData);
                          return sum + dueCharges.totalPayable;
                        }, 0);
                        
                        const dueTodayTotal = dueInvoices.dueToday.reduce((sum, inv) => {
                          const paymentData = paymentDataMap[inv.id];
                          const dueCharges = calculateDueCharges(inv, paymentData);
                          return sum + dueCharges.totalPayable;
                        }, 0);
                        
                        const upcomingTotal = dueInvoices.upcoming.reduce((sum, inv) => {
                          const paymentData = paymentDataMap[inv.id];
                          const dueCharges = calculateDueCharges(inv, paymentData);
                          return sum + dueCharges.totalPayable;
                        }, 0);
                        
                        // Calculate average days overdue
                        const overdueDays = dueInvoices.overdue.map(inv => {
                          const dueDate = parseDateOnly(inv.dueDate);
                          const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
                          const diffTime = todayStart.getTime() - dueDateStart.getTime();
                          return Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        });
                        const avgDaysOverdue = overdueDays.length > 0 
                          ? Math.round(overdueDays.reduce((a, b) => a + b, 0) / overdueDays.length)
                          : 0;
                        
                        // Calculate aging buckets
                        const agingBuckets = {
                          '0-30': 0,
                          '31-60': 0,
                          '61-90': 0,
                          '90+': 0
                        };
                        
                        dueInvoices.overdue.forEach(inv => {
                          const paymentData = paymentDataMap[inv.id];
                          const dueCharges = calculateDueCharges(inv, paymentData);
                          const dueDate = parseDateOnly(inv.dueDate);
                          const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
                          const diffTime = todayStart.getTime() - dueDateStart.getTime();
                          const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (days <= 30) agingBuckets['0-30'] += dueCharges.totalPayable;
                          else if (days <= 60) agingBuckets['31-60'] += dueCharges.totalPayable;
                          else if (days <= 90) agingBuckets['61-90'] += dueCharges.totalPayable;
                          else agingBuckets['90+'] += dueCharges.totalPayable;
                        });
                        
                        // Top clients by amount due
                        const clientTotals: { [key: string]: { name: string; amount: number; count: number } } = {};
                        allDue.forEach(inv => {
                          const clientName = inv.client?.name || 'Unknown Client';
                          const paymentData = paymentDataMap[inv.id];
                          const dueCharges = calculateDueCharges(inv, paymentData);
                          
                          if (!clientTotals[clientName]) {
                            clientTotals[clientName] = { name: clientName, amount: 0, count: 0 };
                          }
                          clientTotals[clientName].amount += dueCharges.totalPayable;
                          clientTotals[clientName].count += 1;
                        });
                        
                        const topClients = Object.values(clientTotals)
                          .sort((a, b) => b.amount - a.amount)
                          .slice(0, 3);
                        
                        // Calculate partial payment stats
                        const partialPaidCount = allDue.filter(inv => {
                          const paymentData = paymentDataMap[inv.id];
                          return paymentData && paymentData.totalPaid > 0 && paymentData.remainingBalance > 0.01;
                        }).length;
                        
                        const totalPaidAmount = allDue.reduce((sum, inv) => {
                          const paymentData = paymentDataMap[inv.id];
                          return sum + (paymentData?.totalPaid || 0);
                        }, 0);
                        
                        const collectionRate = totalAmount > 0 ? ((totalPaidAmount / (totalAmount + totalPaidAmount)) * 100) : 0;
                        
                        // Average invoice amount
                        const avgInvoiceAmount = allDue.length > 0 ? totalAmount / allDue.length : 0;
                        
                        return (
                          <div className="flex-1 flex flex-col space-y-4">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Total Due</p>
                                <p className="text-xl font-semibold text-gray-900">${totalAmount.toFixed(0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Avg Invoice</p>
                                <p className="text-xl font-semibold text-gray-900">${avgInvoiceAmount.toFixed(0)}</p>
                              </div>
                            </div>
                            
                            {/* Breakdown by Status */}
                            <div className="space-y-3">
                              {dueInvoices.overdue.length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-gray-700">Overdue</span>
                                    <span className="text-xs font-semibold text-red-600">
                                      ${overdueTotal.toFixed(0)}
                                    </span>
                                  </div>
                                  <div className="h-2.5 bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full bg-red-500 transition-all"
                                      style={{
                                        width: `${totalAmount > 0 ? (overdueTotal / totalAmount) * 100 : 0}%`
                                      }}
                                    ></div>
                                  </div>
                                  {avgDaysOverdue > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">Avg {avgDaysOverdue} days overdue</p>
                                  )}
                                </div>
                              )}
                              
                              {dueInvoices.dueToday.length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-gray-700">Due Today</span>
                                    <span className="text-xs font-semibold text-amber-600">
                                      ${dueTodayTotal.toFixed(0)}
                                    </span>
                                  </div>
                                  <div className="h-2.5 bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 transition-all"
                                      style={{
                                        width: `${totalAmount > 0 ? (dueTodayTotal / totalAmount) * 100 : 0}%`
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              {dueInvoices.upcoming.length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-gray-700">Upcoming</span>
                                    <span className="text-xs font-semibold text-blue-600">
                                      ${upcomingTotal.toFixed(0)}
                                    </span>
                                  </div>
                                  <div className="h-2.5 bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all"
                                      style={{
                                        width: `${totalAmount > 0 ? (upcomingTotal / totalAmount) * 100 : 0}%`
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Aging Analysis */}
                            {dueInvoices.overdue.length > 0 && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Aging Analysis</p>
                                <div className="space-y-2">
                                  {Object.entries(agingBuckets).map(([range, amount]) => {
                                    if (amount === 0) return null;
                                    const color = range === '0-30' ? 'bg-orange-500' : 
                                                 range === '31-60' ? 'bg-red-500' : 
                                                 range === '61-90' ? 'bg-red-600' : 'bg-red-700';
                                    return (
                                      <div key={range}>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs text-gray-600">{range} days</span>
                                          <span className="text-xs font-medium text-gray-900">${amount.toFixed(0)}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 overflow-hidden">
                                          <div
                                            className={`h-full ${color} transition-all`}
                                            style={{
                                              width: `${overdueTotal > 0 ? (amount / overdueTotal) * 100 : 0}%`
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Top Clients */}
                            {topClients.length > 0 && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Top Clients by Amount Due</p>
                                <div className="space-y-2">
                                  {topClients.map((client, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{client.name}</p>
                                        <p className="text-xs text-gray-500">{client.count} invoice{client.count !== 1 ? 's' : ''}</p>
                                      </div>
                                      <p className="text-xs font-semibold text-gray-900 ml-2">${client.amount.toFixed(0)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Payment Stats */}
                            <div className="pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Collection Rate</p>
                                  <p className="text-sm font-semibold text-gray-900">{collectionRate.toFixed(0)}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Partial Paid</p>
                                  <p className="text-sm font-semibold text-gray-900">{partialPaidCount}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  )}
                  {/* Slide 2: Invoice Performance - Only render if tab 2 is available */}
                  {availableTabs.includes(2) && (
                  <div className="flex-shrink-0 snap-start flex self-start w-full" style={{ 
                    width: `${100 / availableTabs.length}%`, 
                    minWidth: `${100 / availableTabs.length}%`, 
                    maxWidth: `${100 / availableTabs.length}%`,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    boxSizing: 'border-box',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem'
                  }}>
                    <div className="bg-white border border-gray-200 pt-6 px-6 pb-6 w-full flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Performance</h3>
                      
                      <InvoicePerformanceChart invoices={invoices} paymentDataMap={paymentDataMap} />
                    </div>
                  </div>
                  )}

                  {/* Slide 3: Conversion Rate - Only render if tab 3 is available */}
                  {availableTabs.includes(3) && (
                  <div className="flex-shrink-0 snap-start flex self-start w-full" style={{ 
                    width: `${100 / availableTabs.length}%`, 
                    minWidth: `${100 / availableTabs.length}%`, 
                    maxWidth: `${100 / availableTabs.length}%`,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    boxSizing: 'border-box',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem'
                  }}>
                    <div className="bg-white border border-gray-200 pt-6 px-6 pb-6 w-full flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Conversion Rate</h3>
                      
                      <ConversionRateChart invoices={invoices} paymentDataMap={paymentDataMap} />
                    </div>
                  </div>
                  )}

                  {/* Slide 4: Payment Activity - Only render if tab 4 is available */}
                  {availableTabs.includes(4) && (
                  <div className="flex-shrink-0 snap-start w-full" style={{ 
                    width: `${100 / availableTabs.length}%`, 
                    minWidth: `${100 / availableTabs.length}%`, 
                    maxWidth: `${100 / availableTabs.length}%`,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    boxSizing: 'border-box',
                    paddingRight: '0.5rem'
                  }}>
                    {loadingPaymentActivity ? (
                      <div className="bg-white border border-gray-200 p-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                      </div>
                    ) : paymentActivity.length === 0 ? (
                      <div className="bg-white border border-gray-200 p-8 text-center">
                        <CreditCard className="h-8 w-8 mx-auto mb-2" style={{color: '#9ca3af'}} />
                        <p className="text-sm" style={{color: '#6b7280'}}>No recent payments</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-green-500" />
                            <h3 className="text-sm font-semibold text-green-600">Recent Payments</h3>
                            <span className="text-xs text-gray-500">({paymentActivity.length})</span>
                          </div>
                          <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                            {paymentActivity.map((payment) => (
                              <div
                                key={payment.id}
                                onClick={() => {
                                  const invoice = invoices.find(inv => inv.id === payment.invoiceId);
                                  if (invoice) handleViewInvoice(invoice);
                                }}
                                className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900 truncate">
                                        {payment.invoiceNumber}
                                      </span>
                                      <span className="text-xs text-gray-500 truncate">
                                        {payment.clientName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                                      {payment.method && payment.method !== 'N/A' && (
                                        <>
                                          <span>•</span>
                                          <span>{payment.method}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <div className="text-sm font-semibold text-green-600">
                                      ${payment.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Slide 5: Upcoming Reminders - Only render if tab 5 is available */}
                  {availableTabs.includes(5) && (
                  <div className="flex-shrink-0 snap-start w-full" style={{ 
                    width: `${100 / availableTabs.length}%`, 
                    minWidth: `${100 / availableTabs.length}%`, 
                    maxWidth: `${100 / availableTabs.length}%`,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    boxSizing: 'border-box',
                    paddingRight: '0.5rem'
                  }}>
                    {loadingReminders ? (
                      <div className="bg-white border border-gray-200 p-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                      </div>
                    ) : upcomingReminders.length === 0 ? (
                      <div className="bg-white border border-gray-200 p-8 text-center">
                        <Bell className="h-8 w-8 mx-auto mb-2" style={{color: '#9ca3af'}} />
                        <p className="text-sm" style={{color: '#6b7280'}}>No upcoming reminders</p>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <Bell className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-sm font-semibold text-indigo-600">Scheduled Reminders</h3>
                            <span className="text-xs text-gray-500">({upcomingReminders.length})</span>
                          </div>
                          <div className="bg-white border border-gray-200 divide-y divide-gray-100 w-full">
                            {upcomingReminders.map((reminder) => {
                              const reminderDate = new Date(reminder.scheduledFor);
                              const dueDate = reminder.dueDate ? parseDateOnly(reminder.dueDate) : null;
                              const today = new Date();
                              const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                              const reminderDateStart = new Date(Date.UTC(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate()));
                              const daysUntilReminder = Math.floor((reminderDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                              
                              const reminderTypeLabels: Record<string, string> = {
                                friendly: 'Friendly',
                                polite: 'Polite',
                                firm: 'Firm',
                                urgent: 'Urgent'
                              };
                              
                              return (
                                <div
                                  key={reminder.id}
                                  onClick={() => {
                                    const invoice = invoices.find(inv => inv.id === reminder.invoiceId);
                                    if (invoice) handleViewInvoice(invoice);
                                  }}
                                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer w-full"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                          {reminder.invoiceNumber}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate">
                                          {reminder.clientName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{reminderDate.toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{reminderTypeLabels[reminder.reminderType] || reminder.reminderType}</span>
                                        {daysUntilReminder >= 0 && (
                                          <>
                                            <span>•</span>
                                            <span>{daysUntilReminder === 0 ? 'Today' : `In ${daysUntilReminder} day${daysUntilReminder !== 1 ? 's' : ''}`}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                      <div className="text-sm font-semibold text-indigo-600">
                                        ${reminder.amount.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}
          
          {/* Recent Invoices - First on Mobile, Left Side on Desktop */}
          <div className="space-y-3 sm:space-y-4 order-1 lg:order-1">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                Recent Invoices
              </h2>
              <button
                onClick={() => router.push('/dashboard/invoices')}
                className="group flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 transition-colors text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            {recentInvoices.slice(0, 4).map((invoice) => (
              <UnifiedInvoiceCard
                key={invoice.id}
                invoice={invoice}
                getStatusIcon={getStatusIcon}
                getDueDateStatus={getDueDateStatus}
                calculateDueCharges={calculateDueCharges}
                loadingActions={loadingActions}
                onView={handleViewInvoice}
                onPdf={handleDownloadPDF}
                onSend={handleSendInvoice}
                onMarkPaid={handleMarkAsPaid}
                onEdit={handleEditInvoice}
                onDelete={handleDeleteInvoice}
                onDuplicate={handleDuplicateInvoice}
                paymentData={paymentDataMap[invoice.id] || null}
              />
            ))}
          </div>
        </div>
      );
    }
    return null;
  }, [isLoadingInvoices, hasInitiallyLoaded, invoices.length, recentInvoices, dueInvoices, paymentDataMap, calculateDueCharges, parseDateOnly, handleViewInvoice, router, dueInvoicesScrollIndex, scrollToDueInvoicesSlideUpdated, handleDueInvoicesScrollUpdated, dueInvoicesScrollRef, getStatusIcon, getDueDateStatus, loadingActions, handleDownloadPDF, handleSendInvoice, handleMarkAsPaid, handleEditInvoice, handleDeleteInvoice, handleDuplicateInvoice, availableTabs, paymentActivity, upcomingReminders, loadingPaymentActivity, loadingReminders, invoices]);

  // Helper function to get time ago
  const getTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Fetch and calculate notifications - only once when data is ready
  useEffect(() => {
    if (!user || !hasInitiallyLoaded || isLoadingInvoices) {
      notificationsFetchedRef.current = false;
      lastFetchKeyRef.current = '';
      return;
    }
    
    // Create a unique key for this fetch attempt
    const fetchKey = `${user?.id || ''}-${hasInitiallyLoaded}-${isLoadingInvoices}`;
    
    // Prevent multiple fetches with the same key
    if (lastFetchKeyRef.current === fetchKey && notificationsFetchedRef.current) {
      return;
    }
    
    lastFetchKeyRef.current = fetchKey;
    notificationsFetchedRef.current = true;
    
    const fetchNotifications = async () => {
      const currentInvoices = invoicesRef.current;
      const notificationList: Array<{
        id: string;
        type: 'viewed' | 'due_today' | 'overdue';
        invoiceId: string;
        invoiceNumber: string;
        clientName: string;
        message: string;
        timestamp: string;
        date?: string; // ISO date string for sorting
      }> = [];
      
      const today = new Date();
      const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      
      // Get all invoice events (last 7 days)
      try {
        const headers = await (getAuthHeadersRef.current || getAuthHeaders)();
        const response = await fetch('/api/invoices/events?days=7', {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.events && Array.isArray(data.events)) {
            // Process events and validate against current invoice status
            for (const event of data.events) {
              const invoice = currentInvoices.find(inv => inv.id === event.invoice_id);
              if (!invoice) continue;
              
              // CRITICAL: Validate event type matches current invoice status
              // This prevents showing stale notifications (e.g., "created" when invoice is actually "sent")
              const eventStatusMap: { [key: string]: string[] } = {
                'created': ['draft'], // Created events only valid for draft invoices
                'sent': ['sent', 'pending'], // Sent events only valid for sent/pending invoices
                'paid': ['paid'], // Paid events only valid for paid invoices
                'cancelled': ['draft', 'sent', 'pending', 'overdue', 'due today'], // Cancelled events can appear for various statuses
                'partial_payment': ['sent', 'pending', 'overdue', 'due today'], // Partial payments valid for unpaid invoices
                'viewed_by_customer': ['sent', 'pending', 'overdue', 'due today'], // Views only for sent invoices
                'downloaded_by_customer': ['sent', 'pending', 'overdue', 'due today'], // Downloads only for sent invoices
                'payment_method_copied': ['sent', 'pending', 'overdue', 'due today'], // Payment method copied only for sent invoices
                'reminder_scheduled': ['sent', 'pending', 'overdue', 'due today'], // Reminders only for sent invoices
                'reminder_failed': ['sent', 'pending', 'overdue', 'due today'] // Failed reminders only for sent invoices
              };
              
              // Check if event type is valid for current invoice status
              const validStatuses = eventStatusMap[event.type];
              if (validStatuses && !validStatuses.includes(invoice.status)) {
                // Event type doesn't match current invoice status - skip this notification
                // This handles cases like: event is "created" but invoice is now "sent"
                continue;
              }
              
              const eventDate = new Date(event.created_at);
              const now = new Date();
              const diffMs = now.getTime() - eventDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);
              let timeAgo = 'Just now';
              if (diffMins >= 1 && diffMins < 60) timeAgo = `${diffMins}m ago`;
              else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
              else if (diffDays === 1) timeAgo = 'Yesterday';
              else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
              else timeAgo = eventDate.toLocaleDateString();
              
              const invoiceNumber = invoice.invoiceNumber || invoice.invoice_number || 'N/A';
              const clientName = invoice.clientName || invoice.client?.name || 'Unknown';
              
              // Skip notifications for cancelled invoices (except cancellation notification itself)
              // Note: 'cancelled' is not in Invoice status type, but we check event type
              if (event.type === 'cancelled') {
                // Only show cancelled notifications if invoice status allows it
                // For now, we'll show cancelled events regardless of status
              }
              
              // Verify paid status before showing paid notification
              if (event.type === 'paid') {
                // Only show paid notification if invoice is actually paid
                if (invoice.status !== 'paid') {
                  continue; // Skip this notification - invoice is not actually paid
                }
                // Also verify it's fully paid (not just partial)
                const total = typeof invoice.total === 'number' ? invoice.total : parseFloat(String(invoice.total || '0'));
                const totalPaid = invoice.totalPaid || 0;
                // Calculate remaining balance if not provided
                const remainingBalance = invoice.remainingBalance !== undefined 
                  ? invoice.remainingBalance 
                  : (total - totalPaid);
                if (remainingBalance > 0.01) { // Allow small rounding differences
                  continue; // Invoice has remaining balance, not fully paid
                }
              }
              
              // Verify partial payment status before showing partial payment notification
              if (event.type === 'partial_payment') {
                // Only show if invoice has partial payments and is not fully paid
                const total = typeof invoice.total === 'number' ? invoice.total : parseFloat(String(invoice.total || '0'));
                const totalPaid = invoice.totalPaid || 0;
                // Calculate remaining balance if not provided
                const remainingBalance = invoice.remainingBalance !== undefined 
                  ? invoice.remainingBalance 
                  : (total - totalPaid);
                // Skip if fully paid or no payments
                if (totalPaid === 0 || remainingBalance <= 0.01) {
                  continue; // Skip - either no payments or fully paid
                }
              }
              
              // Map event types to notification types
              const eventTypeMap: { [key: string]: { type: any; message: string } } = {
                'viewed_by_customer': { type: 'viewed', message: `Invoice #${invoiceNumber} viewed by customer` },
                'downloaded_by_customer': { type: 'downloaded', message: `Invoice #${invoiceNumber} downloaded by customer` },
                'payment_method_copied': { type: 'payment_copied', message: `Payment method copied from customer for Invoice #${invoiceNumber}` },
                'paid': { type: 'paid', message: `Invoice #${invoiceNumber} paid` },
                'partial_payment': { type: 'partial_paid', message: `Invoice #${invoiceNumber} partially paid` },
                'created': { type: 'draft_created', message: `Invoice #${invoiceNumber} created as draft` },
                'sent': { type: 'sent', message: `Invoice #${invoiceNumber} sent` },
                'reminder_scheduled': { type: 'reminder_scheduled', message: `Auto reminder scheduled for Invoice #${invoiceNumber}` },
                'reminder_failed': { type: 'failed', message: `Reminder failed for Invoice #${invoiceNumber}` },
                'cancelled': { type: 'cancelled', message: `Invoice #${invoiceNumber} cancelled` }
              };
              
              const mapped = eventTypeMap[event.type];
              if (mapped) {
                notificationList.push({
                  id: `${event.type}-${event.id}`,
                  type: mapped.type,
                  invoiceId: invoice.id,
                  invoiceNumber,
                  clientName,
                  message: mapped.message,
                  timestamp: timeAgo,
                  date: event.created_at // Store actual date for sorting
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching invoice events:', error);
      }
      
      // Check for due today and overdue invoices (only if invoices are loaded)
      if (currentInvoices && currentInvoices.length > 0) {
        currentInvoices.forEach(invoice => {
          if (invoice.status === 'paid' || invoice.status === 'draft') return;
          
          const parseFn = parseDateOnlyRef.current || parseDateOnly;
          const dueDate = parseFn(invoice.dueDate);
          const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
          
          // Due today
          if (dueDateStart.getTime() === todayStart.getTime()) {
            notificationList.push({
              id: `due-today-${invoice.id}`,
              type: 'due_today',
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || 'N/A',
              clientName: invoice.clientName || invoice.client?.name || 'Unknown',
              message: `Invoice #${invoice.invoiceNumber || invoice.invoice_number || 'N/A'} is due today`,
              timestamp: 'Today',
              date: dueDateStart.toISOString() // Use actual due date for proper sorting
            });
          }
          
          // Overdue
          if (dueDateStart < todayStart) {
            const diffTime = todayStart.getTime() - dueDateStart.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            // Use current time minus days overdue to sort: most recently overdue first
            // This ensures invoices that became overdue more recently appear at the top
            const sortDate = new Date(todayStart.getTime() - diffTime);
            notificationList.push({
              id: `overdue-${invoice.id}`,
              type: 'overdue',
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || 'N/A',
              clientName: invoice.clientName || invoice.client?.name || 'Unknown',
              message: `Invoice #${invoice.invoiceNumber || invoice.invoice_number || 'N/A'} is ${diffDays} day${diffDays > 1 ? 's' : ''} overdue`,
              timestamp: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`,
              date: sortDate.toISOString() // Sort by when it became overdue (most recent first)
            });
          }
        });
      }
      
      // Fetch estimate events (if estimates API exists)
      // Note: This would need to be implemented if estimate events are tracked separately
      // For now, we'll check invoice status changes that might indicate estimate conversions
      
      // Deduplicate notifications - remove duplicates based on ID and content
      // This prevents the same notification from appearing multiple times
      // Use a Set to track unique notification IDs and content keys
      const seenNotificationIds = new Set<string>();
      const seenNotificationKeys = new Set<string>();
      const deduplicatedList: typeof notificationList = [];
      
      for (const notif of notificationList) {
        // First check by notification ID (most specific)
        if (seenNotificationIds.has(notif.id)) {
          continue; // Skip exact duplicate by ID
        }
        
        // Also check by content key: invoiceId + type + invoiceNumber + message
        // This catches duplicates even if they have different event IDs
        const contentKey = `${notif.invoiceId}-${notif.type}-${notif.invoiceNumber}-${notif.message}`;
        if (seenNotificationKeys.has(contentKey)) {
          continue; // Skip duplicate by content
        }
        
        // Add to both tracking sets and the deduplicated list
        seenNotificationIds.add(notif.id);
        seenNotificationKeys.add(contentKey);
        deduplicatedList.push(notif);
      }
      
      // Sort by date (latest first) - newest notifications appear at the top
      deduplicatedList.sort((a, b) => {
        // Get date from notification object (stored as ISO string)
        const getDate = (notif: typeof a) => {
          // If notification has a date field, use it
          if ((notif as any).date) {
            const date = new Date((notif as any).date);
            // Validate date
            if (isNaN(date.getTime())) {
              return 0; // Invalid date, put at end
            }
            return date.getTime();
          }
          // Fallback: use current time (shouldn't happen if date is always set)
          return 0;
        };
        
        const dateA = getDate(a);
        const dateB = getDate(b);
        
        // Sort by date descending (newest first)
        // If dates are equal, maintain order (stable sort)
        if (dateB === dateA) {
          return 0;
        }
        return dateB - dateA;
      });
      
      // Preserve read state when setting new notifications
      // Load read IDs from localStorage before setting notifications
      const storedReadIds: Set<string> = typeof window !== 'undefined' 
        ? (() => {
            try {
              const stored = localStorage.getItem('readNotificationIds');
              if (stored) {
                const parsed = JSON.parse(stored) as string[];
                return new Set<string>(parsed);
              }
              return new Set<string>();
            } catch {
              return new Set<string>();
            }
          })()
        : new Set<string>();
      
      // Only update readNotificationIds if there are new notifications that should be marked as read
      // Don't reset the read state - preserve it
      setNotifications(deduplicatedList);
      
      // Sync read state with stored values (but don't overwrite if user just marked as read)
      // This ensures read state persists across refetches
      if (storedReadIds.size > 0) {
        const currentNotificationIds = new Set(notificationList.map(n => n.id));
        const validStoredReadIds = new Set<string>([...storedReadIds].filter((id: string) => currentNotificationIds.has(id)));
        if (validStoredReadIds.size > 0) {
          // Only update if there are valid read IDs to preserve
          setReadNotificationIds(prev => {
            // Merge with existing read IDs, don't replace
            const merged = new Set([...prev, ...validStoredReadIds]);
            return merged;
          });
        }
      }
    };
    
    fetchNotifications();
    
    // Set up real-time subscriptions for notifications
    if (!user?.id) return;
    
    // Subscribe to invoice_events changes (listen to all events, filter in callback)
    const eventsChannel = supabase
      .channel(`invoice-events-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_events'
        },
        (payload) => {
          // Check if this event is for one of the user's invoices
          const invoiceIds = invoicesRef.current.map(inv => inv.id);
          const newData = payload.new as any;
          const oldData = payload.old as any;
          if (newData && newData.invoice_id && invoiceIds.includes(newData.invoice_id)) {
            // Refresh notifications when events change for user's invoices
            fetchNotifications();
          } else if (oldData && oldData.invoice_id && invoiceIds.includes(oldData.invoice_id)) {
            // Also handle updates/deletes
            fetchNotifications();
          }
        }
      )
      .subscribe();
    
    // Subscribe to invoices table changes (status updates)
    const invoicesChannel = supabase
      .channel(`invoices-status-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Refresh notifications when invoice status changes
          fetchNotifications();
        }
      )
      .subscribe();
    
    // Cleanup subscriptions on unmount
    return () => {
      eventsChannel.unsubscribe();
      invoicesChannel.unsubscribe();
    };
    // Only depend on stable values - use user.id instead of user object
  }, [user?.id, hasInitiallyLoaded, isLoadingInvoices]);

  // Clean up read notification IDs for notifications that no longer exist
  // But preserve read state - only remove IDs that truly don't exist anymore
  useEffect(() => {
    if (readNotificationIds.size > 0 && notifications.length > 0) {
      const currentNotificationIds = new Set(notifications.map(n => n.id));
      const validReadIds = new Set([...readNotificationIds].filter(id => currentNotificationIds.has(id)));
      
      // Only update if there are actually invalid IDs to remove
      // Don't reset if all IDs are still valid
      if (validReadIds.size < readNotificationIds.size) {
        setReadNotificationIds(validReadIds);
        if (typeof window !== 'undefined') {
          localStorage.setItem('readNotificationIds', JSON.stringify([...validReadIds]));
        }
      }
    } else if (notifications.length === 0 && readNotificationIds.size > 0) {
      // If no notifications, don't clear read state - preserve it for when notifications come back
      // This prevents read state from being lost when notifications are temporarily empty
    }
  }, [notifications]); // Removed readNotificationIds from deps to prevent infinite loops

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);


  // Navigation functions for dashboard cards
  const handlePaidInvoicesClick = useCallback(() => {
    router.push('/dashboard/invoices?status=paid');
  }, [router]);

  const handlePendingInvoicesClick = useCallback(() => {
    router.push('/dashboard/invoices?status=pending');
  }, [router]);

  const handleOverdueInvoicesClick = useCallback(() => {
    router.push('/dashboard/invoices?status=overdue');
  }, [router]);

  // Consistent money formatter for stats
  const formatMoney = useCallback((value: number | undefined | null) => {
    const n = Number(value || 0);
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, []);

  const handleClientsClick = useCallback(() => {
    router.push('/dashboard/clients');
  }, [router]);

  // Only show loading spinner if user is not authenticated yet
  // Don't show spinner immediately to prevent flash
  const [showAuthSpinner, setShowAuthSpinner] = useState(false);
  
  useEffect(() => {
    if ((loading && !user) || (!user && !loading)) {
      // Delay showing spinner to prevent flash (150ms delay)
      const timer = setTimeout(() => setShowAuthSpinner(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowAuthSpinner(false);
    }
  }, [loading, user]);
  
  if (loading && !user) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        {showAuthSpinner && (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    );
  }

  if (!user && !loading) {
    // Show loading while checking session (layout will handle redirect)
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        {showAuthSpinner && (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          onCreateInvoice={handleCreateInvoice}
          onTransitionStart={() => {
            sidebarTransitioningRef.current = true;
          }}
          onTransitionEnd={() => {
            sidebarTransitioningRef.current = false;
          }}
        />
        
        <main 
          className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar"
          onTransitionStart={(e) => {
            // Only log significant transitions, ignore micro-transitions on child elements
            if (e.propertyName && ['width', 'transform', 'margin', 'padding'].includes(e.propertyName)) {
              console.log('🎬 Dashboard Main: Transition started', {
                property: e.propertyName,
                timestamp: `${performance.now().toFixed(2)}ms`
              });
            }
          }}
          onTransitionEnd={(e) => {
            // Only log significant transitions, ignore micro-transitions on child elements
            if (e.propertyName && ['width', 'transform', 'margin', 'padding'].includes(e.propertyName)) {
              console.log('🏁 Dashboard Main: Transition ended', {
                property: e.propertyName,
                elapsedTime: e.elapsedTime,
                timestamp: `${performance.now().toFixed(2)}ms`
              });
            }
          }}
        >
          <div className="pt-16 lg:pt-4 p-4 sm:p-5 lg:p-6 xl:p-8">
            {/* Dashboard Overview */}
            <div>
              <div className="flex items-center justify-between mb-0">
                <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                  Dashboard Overview
                </h2>
                {/* Notification Icon */}
                <div className="relative flex-shrink-0" ref={notificationRef} style={{ minWidth: '40px', minHeight: '40px' }}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                    style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Notifications"
                  >
                    <div className="relative inline-block">
                      <Bell className="h-5 w-5" style={{color: '#6b7280'}} />
                      {notifications.length > 0 && notifications.some(n => !readNotificationIds.has(n.id)) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                  </button>
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 lg:w-[28rem] xl:w-[32rem] bg-white border border-gray-200 shadow-lg z-50 flex flex-col max-h-96 lg:max-h-[32rem]"
                      style={{
                        // Prevent layout shift
                        willChange: 'transform',
                        contain: 'layout style paint'
                      }}
                    >
                      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
                        <h3 className="font-semibold text-sm" style={{color: '#1f2937'}}>Notifications</h3>
                        <div className="flex items-center gap-2">
                          {notifications.length > 0 && notifications.some(n => !readNotificationIds.has(n.id)) && (
                            <button
                              onClick={() => {
                                const allIds = new Set(notifications.map(n => n.id));
                                setReadNotificationIds(allIds);
                                // Persist to localStorage
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('readNotificationIds', JSON.stringify([...allIds]));
                                }
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 hover:bg-indigo-50 transition-colors"
                            >
                              Mark all as read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 hover:bg-gray-100 transition-colors"
                          >
                            <X className="h-4 w-4" style={{color: '#6b7280'}} />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="h-8 w-8 mx-auto mb-2" style={{color: '#9ca3af'}} />
                            <p className="text-sm" style={{color: '#6b7280'}}>No notifications</p>
                          </div>
                        ) : (
                          <div className="p-2">
                            {notifications.map((notification) => {
                              const invoice = invoices.find(inv => inv.id === notification.invoiceId);
                              const formatDate = (dateString: string | Date | null | undefined) => {
                                if (!dateString) return 'N/A';
                                try {
                                  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                } catch {
                                  return 'N/A';
                                }
                              };
                              const displayDate = invoice 
                                ? (invoice.dueDate || (invoice as any).due_date 
                                  ? formatDate(invoice.dueDate || (invoice as any).due_date) 
                                  : (invoice.issueDate || (invoice as any).issue_date 
                                    ? formatDate(invoice.issueDate || (invoice as any).issue_date) 
                                    : 'N/A'))
                                : 'N/A';
                              
                              const isRead = readNotificationIds.has(notification.id);
                              
                              return (
                                <div
                                  key={notification.id}
                                  className={`flex gap-3 p-3 transition-colors cursor-pointer relative ${
                                    isRead 
                                      ? 'hover:bg-gray-50' 
                                      : 'bg-purple-50 hover:bg-purple-100'
                                  }`}
                                  onClick={() => {
                                    // Mark as read when clicked
                                    if (!isRead) {
                                      const newReadIds = new Set([...readNotificationIds, notification.id]);
                                      setReadNotificationIds(newReadIds);
                                      // Persist to localStorage
                                      if (typeof window !== 'undefined') {
                                        localStorage.setItem('readNotificationIds', JSON.stringify([...newReadIds]));
                                      }
                                    }
                                    if (invoice) {
                                      setSelectedInvoice(invoice);
                                      setShowViewInvoice(true);
                                      setShowNotifications(false);
                                    }
                                  }}
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    {notification.type === 'viewed' && (
                                      <Eye className="h-5 w-5 text-blue-600" />
                                    )}
                                    {notification.type === 'due_today' && (
                                      <Clock className="h-5 w-5 text-amber-600" />
                                    )}
                                    {notification.type === 'overdue' && (
                                      <AlertCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    {notification.type === 'paid' && (
                                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    )}
                                    {notification.type === 'partial_paid' && (
                                      <DollarSign className="h-5 w-5 text-blue-600" />
                                    )}
                                    {notification.type === 'draft_created' && (
                                      <FileText className="h-5 w-5 text-gray-600" />
                                    )}
                                    {notification.type === 'downloaded' && (
                                      <Download className="h-5 w-5 text-indigo-600" />
                                    )}
                                    {notification.type === 'payment_copied' && (
                                      <Copy className="h-5 w-5 text-purple-600" />
                                    )}
                                    {notification.type === 'reminder_scheduled' && (
                                      <Timer className="h-5 w-5 text-teal-600" />
                                    )}
                                    {notification.type === 'sent' && (
                                      <Send className="h-5 w-5 text-green-600" />
                                    )}
                                    {notification.type === 'failed' && (
                                      <AlertTriangle className="h-5 w-5 text-red-600" />
                                    )}
                                    {notification.type === 'cancelled' && (
                                      <Ban className="h-5 w-5 text-gray-600" />
                                    )}
                                    {notification.type === 'estimate_sent' && (
                                      <Send className="h-5 w-5 text-blue-600" />
                                    )}
                                    {notification.type === 'estimate_approved' && (
                                      <FileCheck className="h-5 w-5 text-emerald-600" />
                                    )}
                                    {notification.type === 'estimate_rejected' && (
                                      <FileX className="h-5 w-5 text-red-600" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 relative">
                                    {!isRead && (
                                      <div className="absolute -right-1 top-0 w-2 h-2 bg-purple-500 rounded-full border border-white shadow-sm"></div>
                                    )}
                                    <p className="text-sm font-medium" style={{color: '#1f2937'}}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{color: '#6b7280'}}>
                                      {displayDate} • {notification.clientName}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-xs" style={{color: '#9ca3af'}}>
                                        {notification.timestamp}
                                      </p>
                                      {invoice && (
                                        <p className="text-xs font-semibold" style={{color: '#1f2937'}}>
                                          ${(() => {
                                            // Show remaining balance if available and invoice is not fully paid
                                            if (invoice.remainingBalance && invoice.remainingBalance > 0) {
                                              return typeof invoice.remainingBalance === 'number' 
                                                ? invoice.remainingBalance.toFixed(2) 
                                                : parseFloat(String(invoice.remainingBalance || '0')).toFixed(2);
                                            }
                                            // Otherwise show total
                                            const total = invoice.total || 0;
                                            return typeof total === 'number' 
                                              ? total.toFixed(2) 
                                              : (typeof total === 'string' 
                                                ? parseFloat(total).toFixed(2) 
                                                : '0.00');
                                          })()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="-mt-1 mb-2 sm:mb-3 text-sm sm:text-base" style={{color: '#374151'}}>
                The fastest way for freelancers & contractors to get paid
              </p>
              
              {/* Welcome message for new users */}
              {user && hasInitiallyLoaded && !isLoadingInvoices && !isLoadingClients && invoices.length === 0 && clients.length === 0 && (
                <div className="p-6 mb-8 bg-white/70 border border-gray-200 backdrop-blur-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-indigo-50">
                      <Sparkles className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{color: '#1f2937'}}>
                        Ready to get started?
                      </h3>
                      <p className="text-sm font-medium text-indigo-600">
                        Let&apos;s create your first invoice
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-6 leading-relaxed" style={{color: '#374151'}}>
                    FlowInvoicer makes it incredibly easy to create professional invoices and get paid faster. 
                    Start by adding a client or create your first invoice in under 60 seconds.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleCreateInvoice}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Create Invoice</span>
                    </button>
                    <button
                      onClick={() => setShowCreateClient(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Client</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {/* Total Revenue */}
                <button 
                  onClick={handlePaidInvoicesClick}
                  className="group relative overflow-hidden p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white border border-gray-200 hover:border-emerald-500 h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-1.5 sm:pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Total Revenue</p>
                        <div className="min-h-[40px] sm:min-h-[52px] lg:min-h-[56px] flex flex-col justify-start">
                          <div className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-emerald-600 text-left break-words" style={{ display: 'block' }}>
                            {formatMoney(totalRevenue)}
                          </div>
                          {/* Fixed height placeholder to match late fees line spacing - ensures alignment */}
                          <div className="text-[10px] sm:text-xs font-medium text-left mt-0.5" style={{ display: 'block', height: '14px', minHeight: '14px', lineHeight: '14px' }}>
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1.5 justify-start leading-tight mt-auto">
                          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-emerald-600 truncate">Paid invoices</span>
                        </div>
                      </div>
                    </div>
                    {/* Trend Indicator - Right Side - Desktop Only */}
                    {totalRevenue > 0 && (
                      <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                        <ArrowUp className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-medium text-emerald-600">+23%</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Outstanding Amount */}
                <button 
                  onClick={handlePendingInvoicesClick}
                  className="group relative overflow-hidden p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white border border-gray-200 hover:border-amber-500 h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-1.5 sm:pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Total Payable</p>
                        <div className="min-h-[40px] sm:min-h-[52px] lg:min-h-[56px] flex flex-col justify-start">
                          <div className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-orange-500 text-left break-words" style={{ display: 'block' }}>
                            {formatMoney(totalPayableAmount)}
                          </div>
                          {/* Fixed height container for late fees - always reserves space for alignment */}
                          <div className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-amber-600 text-left mt-0.5" style={{ display: 'block', height: '14px', minHeight: '14px', lineHeight: '14px' }}>
                            {totalLateFees > 0 ? `(+$${totalLateFees.toFixed(2)} late fees)` : ''}
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1.5 justify-start leading-tight mt-auto">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-orange-500 flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-orange-500 truncate">
                            {invoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length} pending
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Trend Indicator - Right Side - Desktop Only */}
                    {totalPayableAmount > 0 && (
                      <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                        <ArrowUp className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] font-medium text-amber-600">+18%</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Overdue Invoices */}
                <button 
                  onClick={handleOverdueInvoicesClick}
                  className="group relative overflow-hidden p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white border border-gray-200 hover:border-red-500 h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-1.5 sm:pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Overdue</p>
                        <div className="min-h-[40px] sm:min-h-[52px] lg:min-h-[56px] flex flex-col justify-start">
                          <div className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-red-600 text-left" style={{ display: 'block' }}>
                            {overdueCount}
                          </div>
                          {/* Fixed height placeholder to match late fees line spacing - ensures alignment */}
                          <div className="text-[10px] sm:text-xs font-medium text-left mt-0.5" style={{ display: 'block', height: '14px', minHeight: '14px', lineHeight: '14px' }}>
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1.5 justify-start leading-tight mt-auto">
                          <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-red-600 truncate">Need attention</span>
                        </div>
                      </div>
                    </div>
                    {/* Trend Indicator - Right Side - Desktop Only */}
                    {overdueCount > 0 && (
                      <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                        <ArrowDown className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-medium text-red-500">-8%</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Total Clients */}
                <button 
                  onClick={handleClientsClick}
                  className="group relative overflow-hidden p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white border border-gray-200 hover:border-indigo-500 h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-1.5 sm:pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Total Clients</p>
                        <div className="min-h-[40px] sm:min-h-[52px] lg:min-h-[56px] flex flex-col justify-start">
                          <div className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-indigo-600 text-left" style={{ display: 'block' }}>
                            {totalClients}
                          </div>
                          {/* Fixed height placeholder to match late fees line spacing - ensures alignment */}
                          <div className="text-[10px] sm:text-xs font-medium text-left mt-0.5" style={{ display: 'block', height: '14px', minHeight: '14px', lineHeight: '14px' }}>
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1.5 justify-start leading-tight mt-auto">
                          <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-indigo-600 truncate">Active clients</span>
                        </div>
                      </div>
                    </div>
                    {/* Trend Indicator - Right Side - Desktop Only */}
                    {totalClients > 0 && (
                      <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                        <span className="text-[10px] font-medium text-indigo-600">+15%</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Actions - Modern Design */}
            <div className="mt-6 sm:mt-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                Quick Actions
              </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {/* 60-Second Invoice */}
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    requestAnimationFrame(() => {
                      setShowFastInvoice(true);
                    });
                  }}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors text-sm font-medium cursor-pointer active:opacity-90"
                >
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Quick Invoice</span>
                </button>

                {/* Detailed Invoice */}
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    requestAnimationFrame(() => {
                      setShowCreateInvoice(true);
                    });
                  }}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors text-sm font-medium cursor-pointer active:opacity-90"
                >
                  <FilePlus className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Detailed Invoice</span>
                </button>

                {/* Create Estimate */}
                <button
                  onClick={() => setShowCreateEstimate(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors text-sm font-medium cursor-pointer active:opacity-90"
                >
                  <ClipboardCheck className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Create Estimate</span>
                </button>

                {/* Add Client */}
                <button
                  onClick={() => setShowCreateClient(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors text-sm font-medium cursor-pointer active:opacity-90"
                >
                  <UserPlus className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Add Client</span>
                </button>

              </div>
            </div>

            {/* Recent Invoices - Modern Design */}
            <div className="mt-6 sm:mt-8">
              {renderRecentInvoicesSection()}
            </div>
          </div>
        </main>
                  
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="font-heading text-xl font-semibold mb-2" style={{color: '#1f2937'}}>
                Choose Invoice Type
                  </h3>
              <p className="text-gray-600 text-sm">
                Select the type of invoice you want to create
                  </p>
            </div>
                  
            <div className="space-y-3">
              {/* Fast Invoice Option */}
                  <button
                onClick={handleSelectFastInvoice}
                className="w-full p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Fast Invoice</h4>
                    <p className="text-sm text-gray-500">Quick invoice with minimal details</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                  </button>

              {/* Detailed Invoice Option */}
              <button
                onClick={handleSelectDetailedInvoice}
                className="w-full p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                    <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Detailed Invoice</h4>
                    <p className="text-sm text-gray-500">Complete invoice with all details and customization</p>
            </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
          </div>
                </div>
              </button>
      </div>
      
            {/* Cancel Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowInvoiceTypeSelection(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Invoice Modal */}
      {showFastInvoice && (
        <FastInvoiceModal
          isOpen={showFastInvoice}
          onClose={() => {
            setShowFastInvoice(false);
            setSelectedInvoice(null);
          }}
          user={user!}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          editingInvoice={selectedInvoice}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showWarning}
          onSuccess={() => {
            setShowFastInvoice(false);
            setSelectedInvoice(null);
            // Delay data refresh to allow toast to be visible
            setTimeout(() => {
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await Promise.all([
                    fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .catch(err => console.error('Error fetching dashboard stats:', err)),
                    // Data is now managed globally, no need to refresh manually
                  ]);
                } catch (error) {
                  console.error('Error refreshing data:', error);
                }
              };
              loadData();
            }
            }, 2000); // Wait 2 seconds for toast to be visible
          }}
        />
      )}

      {/* Detailed Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => {
            setShowCreateInvoice(false);
            setSelectedInvoice(null);
          }}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          editingInvoice={selectedInvoice}
          showSuccess={showSuccess}
          showError={showError}
          onSuccess={() => {
            setShowCreateInvoice(false);
            setSelectedInvoice(null);
            // Refresh data after successful invoice creation/update
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await Promise.all([
                    fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .catch(err => console.error('Error fetching dashboard stats:', err)),
                    // Data is now managed globally, no need to refresh manually
                  ]);
                } catch (error) {
                  console.error('Error refreshing data:', error);
                }
              };
              loadData();
            }
          }}
        />
      )}

      {/* Create Client Modal */}
      {showCreateClient && (
        <ClientModal
          isOpen={showCreateClient}
          onClose={() => setShowCreateClient(false)}
          getAuthHeaders={getAuthHeaders}
          onSuccess={() => {
            setShowCreateClient(false);
            // Refresh data after successful client creation
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await Promise.all([
                    fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .catch(err => console.error('Error fetching dashboard stats:', err)),
                    // Data is now managed globally, no need to refresh manually
                  ]);
                } catch (error) {
                  console.error('Error refreshing data:', error);
                }
              };
              loadData();
            }
          }}
         />
       )}

       {/* View Invoice Modal */}
       {showViewInvoice && selectedInvoice && (() => {
         // CRITICAL: For draft invoices, use the latest client data from the clients list
         // For sent/paid invoices, use the stored client data (as it was when sent)
         const isDraft = selectedInvoice.status === 'draft';
         const clientId = selectedInvoice.clientId || selectedInvoice.client_id;
         const latestClient = isDraft && clientId ? clients.find(c => c.id === clientId) : null;
         const displayClient = latestClient || selectedInvoice.client || null;
         
         return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
           <div className="p-2 sm:p-4 max-w-6xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-white border-gray-200 flex flex-col">
             <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
               <div className="flex items-center gap-3">
                 <h2 className="text-base sm:text-xl font-bold" style={{color: '#1f2937'}}>
                   {showPaymentForm ? 'Record Payment' : 'Invoice Details'}
                 </h2>
                 {!showPaymentForm && <span className="text-xs text-gray-400 font-normal">(View only)</span>}
               </div>
               <button
                 onClick={() => {
                   setShowViewInvoice(false);
                   setShowReminderDates(false);
                   setShowPaymentForm(false);
                 }}
                 className="p-1 sm:p-2 transition-colors hover:bg-gray-100 cursor-pointer"
               >
                 <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
             
             {showPaymentForm ? (
               /* Payment Form View */
               <div className="space-y-6">
                 {/* Summary */}
                 <div className="bg-gray-50 p-4">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-700">Invoice Total</span>
                     <span className="text-lg font-semibold text-gray-900">${selectedInvoice.total.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-700">Total Paid</span>
                     <span className="text-lg font-semibold text-emerald-600">${totalPaid.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium text-gray-700">Remaining Balance</span>
                     <span className={`text-lg font-semibold ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                       ${remainingBalance.toFixed(2)}
                     </span>
                   </div>
                   {/* Progress bar */}
                   <div className="w-full bg-gray-200 h-2">
                     <div
                       className="bg-emerald-600 h-2 transition-all duration-300"
                       style={{ width: `${Math.min((totalPaid / selectedInvoice.total) * 100, 100)}%` }}
                     />
                   </div>
                   <div className="text-xs text-gray-500 mt-1 text-center">
                     {((totalPaid / selectedInvoice.total) * 100).toFixed(1)}% paid
                   </div>
                 </div>

                 {/* Payment Form */}
                 <form onSubmit={handlePaymentSubmit} className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         <DollarSign className="h-4 w-4 inline mr-1" />
                         Amount *
                       </label>
                       <input
                         type="number"
                         step="0.01"
                         min="0.01"
                         max={remainingBalance}
                         value={paymentAmount}
                         onChange={(e) => setPaymentAmount(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                         placeholder="0.00"
                         required
                       />
                       <p className="text-xs text-gray-500 mt-1">Max: ${remainingBalance.toFixed(2)}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         <Calendar className="h-4 w-4 inline mr-1" />
                         Payment Date *
                       </label>
                       <input
                         type="date"
                         value={paymentDate}
                         onChange={(e) => setPaymentDate(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                         required
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       <CreditCard className="h-4 w-4 inline mr-1" />
                       Payment Method
                     </label>
                     <input
                       type="text"
                       value={paymentMethod}
                       onChange={(e) => setPaymentMethod(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       placeholder="e.g., Bank Transfer, PayPal, Cash"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       <FileText className="h-4 w-4 inline mr-1" />
                       Notes
                     </label>
                     <textarea
                       value={paymentNotes}
                       onChange={(e) => setPaymentNotes(e.target.value)}
                       rows={2}
                       className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       placeholder="Optional notes about this payment"
                     />
                   </div>
                   <button
                     type="submit"
                     disabled={submittingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                     className="w-full bg-indigo-600 text-white py-2.5 px-4 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                   >
                     {submittingPayment ? 'Recording...' : 'Record Payment'}
                   </button>
                 </form>

                 {/* Payment History */}
                 <div className="mt-6">
                   <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
                   {loadingPayments ? (
                     <div className="text-center py-8 text-gray-500">Loading payments...</div>
                   ) : payments.length === 0 ? (
                     <div className="text-center py-8 text-gray-500">No payments recorded yet</div>
                   ) : (
                     <div className="space-y-2">
                       {payments.map((payment) => (
                         <div
                           key={payment.id}
                           className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:bg-gray-50"
                         >
                           <div className="flex-1">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-gray-900">${parseFloat(payment.amount.toString()).toFixed(2)}</span>
                               {payment.payment_method && (
                                 <span className="text-xs text-gray-500">• {payment.payment_method}</span>
                               )}
                             </div>
                             <div className="text-xs text-gray-500 mt-1">
                               {new Date(payment.payment_date).toLocaleDateString()}
                               {payment.notes && ` • ${payment.notes}`}
                             </div>
                           </div>
                           <button
                             onClick={() => handleDeletePayment(payment.id)}
                             disabled={deletingPayment === payment.id}
                             className="p-1.5 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                             title="Delete payment"
                           >
                             {deletingPayment === payment.id ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                             ) : (
                               <Trash2 className="h-4 w-4" />
                             )}
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               /* Responsive Invoice View */
             <div className="w-full bg-white border border-gray-200 overflow-hidden">
               {/* Header */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-6 border-b border-gray-200">
                 <div className="w-full sm:w-auto mb-3 sm:mb-0">
                   <h2 className="text-lg sm:text-2xl font-bold mb-1 text-gray-900">
                     {settings.businessName || 'Your Business Name'}
                   </h2>
                   <div className="text-xs sm:text-sm space-y-1 text-gray-700">
                     {settings.address && <p>{settings.address}</p>}
                     {settings.businessEmail && <p>{settings.businessEmail}</p>}
                     {settings.businessPhone && <p>{settings.businessPhone}</p>}
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
        <div 
          className={`px-3 py-1 text-xs font-medium border`}
          style={((selectedInvoice.type || 'detailed') === 'fast' 
            ? { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }
            : { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' }
          )}
        >
                     {selectedInvoice.type === 'fast' ? 'Fast Invoice' : 'Detailed Invoice'}
                   </div>
                   <div className="bg-orange-500 text-white px-3 py-2 text-sm sm:text-base font-bold border border-orange-600">
                     Invoice
                   </div>
                 </div>
               </div>
               
               {/* Invoice Details */}
               <div className="p-3 sm:p-6 border-b border-gray-200">
                 <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Invoice Details</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                   <div>
                     <span className="font-medium text-gray-700">Invoice Number:</span>
                     <p className="text-gray-700">#{selectedInvoice.invoiceNumber || 'N/A'}</p>
                   </div>
                   <div>
                     <span className="font-medium text-gray-700">Status:</span>
                     <p className="text-gray-700">
                       {(() => {
                         // Calculate actual status based on due date
                         const dueDateStatus = getDueDateStatus(
                           selectedInvoice.dueDate || '', 
                           selectedInvoice.status, 
                           selectedInvoice.paymentTerms,
                           (selectedInvoice as any).updatedAt
                         );
                         
                         // Determine display status: prioritize due date status over invoice status for sent/pending invoices
                         let displayStatus: string = selectedInvoice.status;
                         let statusClass = '';
                         
                         if (selectedInvoice.status === 'paid') {
                           displayStatus = 'Paid';
                           statusClass = 'bg-green-100 text-green-800 border-green-300';
                         } else if (selectedInvoice.status === 'draft') {
                           displayStatus = 'Draft';
                           statusClass = 'bg-gray-100 text-gray-800 border-gray-300';
                         } else {
                           // For sent/pending invoices, use due date status
                           if (dueDateStatus.status === 'overdue') {
                             displayStatus = 'Overdue';
                             statusClass = 'bg-red-100 text-red-800 border-red-300';
                           } else if (dueDateStatus.status === 'due-today') {
                             displayStatus = 'Due Today';
                             statusClass = 'bg-amber-100 text-amber-800 border-amber-300';
                           } else if (selectedInvoice.status === 'sent') {
                             displayStatus = 'Sent';
                             statusClass = 'bg-blue-100 text-blue-800 border-blue-300';
                           } else {
                             displayStatus = selectedInvoice.status ? selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1) : 'Pending';
                             statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                           }
                         }
                         
                         return (
                           <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${statusClass}`}>
                             {displayStatus}
                           </span>
                         );
                       })()}
                     </p>
                   </div>
                   <div>
                     <span className="font-medium text-gray-700">Date:</span>
                     <p className="text-gray-700">
                       {(selectedInvoice.issueDate || selectedInvoice.issue_date) 
                         ? new Date(selectedInvoice.issueDate || selectedInvoice.issue_date || '').toLocaleDateString() 
                         : (selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : 'N/A')}
                     </p>
                   </div>
                   <div>
                     <span className="font-medium text-gray-700">Due Date:</span>
                     <p className="text-gray-700">
                       {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Bill To */}
               <div className="p-3 sm:p-6 border-b border-gray-200">
                 <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Bill To</h3>
                 <div className="text-xs sm:text-sm">
                   <p className="font-medium text-gray-900">{displayClient?.name || 'N/A'}</p>
                   <p className="text-gray-700">{displayClient?.email || 'N/A'}</p>
                   {displayClient?.phone && <p className="text-gray-700">{displayClient.phone}</p>}
                   {displayClient?.address && <p className="text-gray-700">{displayClient.address}</p>}
                 </div>
               </div>
               
               {/* Items Table */}
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-800 text-white">
                     <tr>
                       <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium">Description</th>
                       <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium">Hours/Qty</th>
                       <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium">Rate</th>
                       <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {selectedInvoice.items?.map((item, index) => (
                       <tr key={item.id || index} className="hover:bg-gray-50">
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                           {item.description || 'Service'}
                         </td>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">1</td>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-900">
                            ${(parseFloat(item.amount?.toString() || '0') || 0).toFixed(2)}
                         </td>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium text-gray-900">
                            ${(parseFloat(item.amount?.toString() || '0') || 0).toFixed(2)}
                         </td>
                       </tr>
                     )) || (
                       <tr>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">Service</td>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">1</td>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-900">$0.00</td>
                         <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium text-gray-900">$0.00</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Totals */}
               <div className="p-3 sm:p-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                   <div className="w-full sm:w-auto">
                     <p className="text-xs sm:text-sm text-gray-700">Thank you for your business!</p>
                   </div>
                   <div className="w-full sm:w-64">
                     {(() => {
                       const paymentData = paymentDataMap[selectedInvoice.id] || null;
                       const dueCharges = calculateDueCharges(selectedInvoice, paymentData);
                       const hasPartialPayments = totalPaid > 0 && remainingBalance > 0;
                       return (
                         <div className="space-y-1">
                           <div className="flex justify-between text-xs sm:text-sm">
                             <span className="text-gray-700">Subtotal:</span>
                             <span className="text-gray-900">${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-xs sm:text-sm">
                             <span className="text-gray-700">Discount:</span>
                             <span className="text-gray-900">${(selectedInvoice.discount || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-xs sm:text-sm">
                             <span className="text-gray-700">Tax ({(selectedInvoice.taxRate || 0) * 100}%):</span>
                             <span className="text-gray-900">${(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
                           </div>
                           {dueCharges.hasLateFees && dueCharges.lateFeeAmount > 0 ? (
                             <>
                               <div className="flex justify-between text-xs sm:text-sm border-t pt-1 border-gray-200">
                                 <span className="text-gray-700">Total:</span>
                                 <span className="text-gray-900">${(selectedInvoice.total || 0).toFixed(2)}</span>
                               </div>
                               {hasPartialPayments && (
                                 <>
                                   <div className="flex justify-between text-xs sm:text-sm">
                                     <span className="text-emerald-700">Total Paid:</span>
                                     <span className="text-emerald-700 font-semibold">${totalPaid.toFixed(2)}</span>
                                   </div>
                                   <div className="flex justify-between text-xs sm:text-sm">
                                     <span className="text-orange-700">Remaining Balance:</span>
                                     <span className="text-orange-700 font-semibold">${remainingBalance.toFixed(2)}</span>
                                   </div>
                                 </>
                               )}
                               <div className="flex justify-between text-xs sm:text-sm">
                                 <span className="text-red-700">Late Fees:</span>
                                 <span className="text-red-700 font-semibold">${dueCharges.lateFeeAmount.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between text-xs sm:text-sm font-bold border-t pt-1 border-gray-200">
                                 <span className="text-red-900">Total Payable:</span>
                                 <span className="text-red-900">${dueCharges.totalPayable.toFixed(2)}</span>
                               </div>
                             </>
                           ) : (
                             <>
                               <div className="flex justify-between text-xs sm:text-sm border-t pt-1 border-gray-200">
                                 <span className="text-gray-700">Total:</span>
                               <span className="text-gray-900">${(selectedInvoice.total || 0).toFixed(2)}</span>
                             </div>
                               {hasPartialPayments && (
                                 <>
                                   <div className="flex justify-between text-xs sm:text-sm">
                                     <span className="text-emerald-700">Total Paid:</span>
                                     <span className="text-emerald-700 font-semibold">${totalPaid.toFixed(2)}</span>
                                   </div>
                                   <div className="flex justify-between text-xs sm:text-sm font-bold">
                                     <span className="text-orange-700">Remaining Balance:</span>
                                     <span className="text-orange-700">${remainingBalance.toFixed(2)}</span>
                                   </div>
                                 </>
                               )}
                             </>
                           )}
                         </div>
                       );
                     })()}
                   </div>
                 </div>
               </div>

               {/* Notes */}
               {selectedInvoice.notes && (
                 <div className="p-3 sm:p-6 border-t border-gray-200">
                   <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Notes</h3>
                   <p className="text-xs sm:text-sm text-gray-700">{selectedInvoice.notes}</p>
                 </div>
               )}

               {/* Payment History - Show if there are partial payments */}
               {totalPaid > 0 && (
                 <div className="p-3 sm:p-6 border-t border-gray-200">
                   <h3 className="text-sm sm:text-base font-semibold mb-3 text-gray-900">Payment History</h3>
                   {loadingPayments ? (
                     <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">Loading payments...</div>
                   ) : payments.length === 0 ? (
                     <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">No payments recorded</div>
                   ) : (
                     <div className="space-y-2">
                       {payments.map((payment) => (
                         <div
                           key={payment.id}
                           className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 border border-gray-200"
                         >
                           <div className="flex-1">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-gray-900 text-xs sm:text-sm">${parseFloat(payment.amount.toString()).toFixed(2)}</span>
                               {payment.payment_method && (
                                 <span className="text-xs text-gray-500">• {payment.payment_method}</span>
                               )}
                             </div>
                             <div className="text-xs text-gray-500 mt-1">
                               {new Date(payment.payment_date).toLocaleDateString()}
                               {payment.notes && ` • ${payment.notes}`}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}

               {/* Enhanced Features - Only for Detailed Invoices */}
               {selectedInvoice.type === 'detailed' && (selectedInvoice.paymentTerms || selectedInvoice.lateFees || selectedInvoice.reminders) && (
                 <div className="p-3 sm:p-6 border-t border-gray-200">
                   <h3 className="text-sm sm:text-base font-semibold mb-3 text-gray-900">Enhanced Features</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                     {selectedInvoice.paymentTerms && (
                       <div className="p-3 bg-gray-50">
                         <div className="flex items-center space-x-2 mb-2">
                           <CreditCard className="h-4 w-4 text-blue-500" />
                           <span className="font-medium text-gray-700">Payment Terms</span>
                         </div>
                         <p className="text-gray-700">
                           {selectedInvoice.paymentTerms.enabled ? selectedInvoice.paymentTerms.terms : 'Not configured'}
                         </p>
                       </div>
                     )}
                     {selectedInvoice.lateFees && (
                       <div className="p-3 bg-gray-50">
                         <div className="flex items-center space-x-2 mb-2">
                           <DollarSign className="h-4 w-4 text-orange-500" />
                           <span className="font-medium text-gray-700">Late Fees</span>
                         </div>
                         <p className="text-gray-700">
                           {selectedInvoice.lateFees.enabled 
                             ? `${selectedInvoice.lateFees.type === 'fixed' ? '$' : ''}${selectedInvoice.lateFees.amount}${selectedInvoice.lateFees.type === 'percentage' ? '%' : ''} after ${selectedInvoice.lateFees.gracePeriod ?? 0} days`
                             : 'Not configured'
                           }
                         </p>
                       </div>
                     )}
                     {selectedInvoice.reminders && (
                       <div className="p-3 bg-gray-50">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-2">
                             <Bell className="h-4 w-4 text-green-500" />
                             <span className="font-medium text-gray-700">Auto Reminders</span>
                           </div>
                           {selectedInvoice.reminders.enabled && !selectedInvoice.reminders.useSystemDefaults && (() => {
                             const reminders = selectedInvoice.reminders as any;
                             const rules = reminders.rules || reminders.customRules || [];
                             const enabledRules = rules.filter((rule: any) => rule.enabled);
                             const dueDate = selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate) : null;
                             
                             if (dueDate && enabledRules.length > 0) {
                               return (
                                 <button
                                   onClick={() => setShowReminderDates(!showReminderDates)}
                                   className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                 >
                                   <span>{showReminderDates ? 'Hide' : 'View'} Dates</span>
                                   {showReminderDates ? (
                                     <ChevronUp className="h-3 w-3" />
                                   ) : (
                                     <ChevronDown className="h-3 w-3" />
                                   )}
                                 </button>
                               );
                             }
                             return null;
                           })()}
                         </div>
                         <div className="text-gray-700 space-y-1">
                           {selectedInvoice.reminders.enabled 
                             ? (selectedInvoice.reminders.useSystemDefaults 
                               ? <p>Smart System</p>
                               : (() => {
                                  const reminders = selectedInvoice.reminders as any;
                                  const rules = reminders.rules || reminders.customRules || [];
                                  const enabledRules = rules.filter((rule: any) => rule.enabled);
                                  const dueDate = selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate) : null;
                                  
                                  if (!dueDate || enabledRules.length === 0) {
                                    return <p>{enabledRules.length} Custom Rule{enabledRules.length !== 1 ? 's' : ''}</p>;
                                  }
                                  
                                  return (
                                    <div className="space-y-1.5">
                                      {showReminderDates && (
                                        <>
                                          <p className="text-xs font-medium text-gray-500 mb-1">Scheduled Dates:</p>
                                          {enabledRules.map((rule: any, idx: number) => {
                                            const reminderDate = new Date(dueDate);
                                            if (rule.type === 'before') {
                                              reminderDate.setDate(reminderDate.getDate() - (rule.days || 0));
                                            } else {
                                              reminderDate.setDate(reminderDate.getDate() + (rule.days || 0));
                                            }
                                            return (
                                              <p key={idx} className="text-xs">
                                                {rule.type === 'before' ? 'Before' : 'After'} {rule.days || 0} day{rule.days !== 1 ? 's' : ''}: <span className="font-medium">{reminderDate.toLocaleDateString()}</span>
                                              </p>
                                            );
                                          })}
                                        </>
                                      )}
                                    </div>
                                  );
                                })())
                             : <p>Not configured</p>
                           }
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}
             </div>
             )}
            </div>
            
            {/* Footer with Actions */}
            <div className="flex-shrink-0 border-t border-gray-200 px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
              {showPaymentForm ? (
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Back to Invoice
                </button>
              ) : (
                <>
              <button
                onClick={() => {
                  setShowViewInvoice(false);
                  setShowReminderDates(false);
                      setShowPaymentForm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'pending') && (
                <button
                  onClick={() => {
                        setShowPaymentForm(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        );
       })()}





       {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
        confirmText={confirmationModal.confirmText || (confirmationModal.type === 'success' ? 'Mark as Paid' : confirmationModal.type === 'info' ? 'Create Duplicate' : 'Delete Invoice')}
        cancelText="Cancel"
      />

      {/* Upgrade Modal */}
      {showUpgradeModal && subscriptionUsage && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setSubscriptionUsage(null);
          }}
          currentPlan={subscriptionUsage.plan as 'free' | 'monthly' | 'pay_per_invoice' || 'free'}
          usage={{
            used: subscriptionUsage.used,
            limit: subscriptionUsage.limit,
            remaining: subscriptionUsage.remaining
          }}
          reason="You've reached your monthly invoice limit. Upgrade to create unlimited invoices."
          limitType="invoices"
        />
      )}

       <SendInvoiceModal
         isOpen={sendInvoiceModal.isOpen}
         onClose={() => setSendInvoiceModal({ isOpen: false, invoice: null, isLoading: false })}
         onEdit={() => {
           if (sendInvoiceModal.invoice) {
             handleEditInvoice(sendInvoiceModal.invoice);
             setSendInvoiceModal({ isOpen: false, invoice: null, isLoading: false });
           }
         }}
         onSend={() => {
           if (sendInvoiceModal.invoice) {
             performSendInvoice(sendInvoiceModal.invoice);
           }
         }}
         invoiceNumber={sendInvoiceModal.invoice?.invoiceNumber || ''}
         invoice={sendInvoiceModal.invoice}
         isLoading={sendInvoiceModal.isLoading}
         settings={settings}
       />

       {/* Estimate Modal */}
       <EstimateModal
         isOpen={showCreateEstimate}
         onClose={() => setShowCreateEstimate(false)}
         onSuccess={() => {
           setShowCreateEstimate(false);
           showSuccess('Estimate Created', 'Your estimate has been created successfully.');
         }}
       />

       {/* Partial Payment Modal */}
       {showPartialPayment && selectedInvoice && (
         <PartialPaymentModal
           invoice={selectedInvoice}
           isOpen={showPartialPayment}
           onClose={async () => {
             setShowPartialPayment(false);
             // refreshInvoices() already includes payment data embedded in invoices
             await refreshInvoices();
           }}
           onPaymentAdded={async () => {
             // refreshInvoices() already includes payment data embedded in invoices
             await refreshInvoices();
           }}
           getAuthHeaders={getAuthHeaders}
         />
       )}


      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
      </div>
    </div>
  );
}
