'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw,
  Send,
  Eye,
  X,
  Sparkles,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useData } from '@/contexts/DataContext';
import { useSettings } from '@/contexts/SettingsContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { RotatingAmountBreakdown, useSynchronizedRotation } from '@/components/RotatingComponents';
import { formatCurrencyForCards } from '@/lib/currency';

// Lazy load heavy components
const FastInvoiceModal = dynamic(() => import('@/components/FastInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const QuickInvoiceModal = dynamic(() => import('@/components/QuickInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

interface ReminderHistory {
  id: string;
  invoice_id: string;
  reminder_type: 'friendly' | 'polite' | 'firm' | 'urgent';
  overdue_days: number;
  sent_at: string;
  email_id: string;
  reminder_status: 'sent' | 'failed' | 'scheduled' | 'delivered' | 'bounced' | 'cancelled';
  failure_reason?: string;
  created_at?: string;
  paymentData?: {
    totalPaid: number;
    remainingBalance: number;
  };
  invoice: {
    invoice_number: string;
    total: number;
    due_date: string;
    status: string;
    late_fees?: string | any; // JSON string or parsed object
    currency?: string;
    clients: {
      name: string;
      email: string;
      company: string;
    };
  };
}

export default function ReminderHistoryPage() {
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { clients } = useData();
  const { settings } = useSettings();
  const [reminders, setReminders] = useState<ReminderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderHistory | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);




  const fetchReminderHistory = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setReminders([]);
        return;
      }


      // Fetch reminder history from database
      // First get all reminders for user's invoices
      const { data: userInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id);
      
      if (invoicesError) {
        console.error('Error fetching user invoices:', invoicesError);
        setReminders([]);
        return;
      }
      
      if (!userInvoices || userInvoices.length === 0) {
        console.log('No invoices found for user');
        setReminders([]);
        return;
      }
      
      const invoiceIds = userInvoices.map(inv => inv.id);
      console.log(`Fetching reminders for ${invoiceIds.length} invoices`);
      
      // Handle large arrays by chunking if needed (Supabase .in() has limits)
      // For now, we'll query all at once but add error handling
      let reminderData: any[] = [];
      let reminderError: any = null;
      
      // If invoiceIds is very large, we might need to chunk it
      // For most use cases, this should be fine
      // CRITICAL: Exclude draft invoices - they should never have reminders
      if (invoiceIds.length > 0) {
        const { data, error } = await supabase
          .from('invoice_reminders')
          .select(`
            *,
            invoices (
              invoice_number,
              total,
              due_date,
              status,
              late_fees,
              currency,
              user_id,
              clients (
                name,
                email,
                company
              )
            )
          `)
          .in('invoice_id', invoiceIds)
          .order('sent_at', { ascending: false });
        
        reminderData = data || [];
        reminderError = error;
        
        // Fetch payment data for all invoice IDs in bulk
        if (reminderData && reminderData.length > 0) {
          const uniqueInvoiceIds = [...new Set(reminderData.map((r: any) => r.invoice_id))];
          
          // Fetch payments for all invoices
          const { data: paymentsData } = await supabase
            .from('invoice_payments')
            .select('invoice_id, amount')
            .in('invoice_id', uniqueInvoiceIds);
          
          // Store payment data in a map for quick lookup
          const paymentsMap = new Map<string, number>();
          if (paymentsData) {
            paymentsData.forEach((p: any) => {
              const currentTotal = paymentsMap.get(p.invoice_id) || 0;
              paymentsMap.set(p.invoice_id, currentTotal + parseFloat(p.amount.toString()));
            });
          }
          
          // Attach payment data to each reminder
          reminderData = reminderData.map((reminder: any) => {
            const totalPaid = paymentsMap.get(reminder.invoice_id) || 0;
            return {
              ...reminder,
              paymentData: {
                totalPaid,
                remainingBalance: Math.max(0, (reminder.invoices?.total || 0) - totalPaid)
              }
            };
          });
        }
      }

      if (reminderError) {
        if (reminderError.code === 'PGRST205' || reminderError.message?.includes('Could not find the table')) {
          setReminders([]);
          return;
        }
        console.error('Error fetching reminders:', reminderError);
        setReminders([]);
        return;
      }

      if (reminderData && reminderData.length > 0) {
        console.log(`Found ${reminderData.length} reminder(s) in database`);
        
        // Filter out reminders with null invoices (in case of orphaned reminders)
        // CRITICAL: Also filter out draft invoices - they should never have reminders
        const validReminders = reminderData.filter(reminder => 
          reminder.invoices && 
          reminder.invoices.invoice_number && 
          reminder.invoices.status !== 'draft'
        );
        console.log(`After filtering (excluding drafts), ${validReminders.length} valid reminder(s)`);
        
        
        const formattedReminders: ReminderHistory[] = validReminders.map(reminder => {
          // Handle old reminders that might not have reminder_status set
          // Default to 'sent' for backward compatibility
          let reminderStatus: 'sent' | 'failed' | 'scheduled' | 'delivered' | 'bounced' = reminder.reminder_status || 'sent';
          
          // If status is null/undefined, check if it has an email_id to determine if it was sent
          if (!reminder.reminder_status) {
            reminderStatus = reminder.email_id ? 'sent' : 'scheduled';
          }
          
          // Safety check for clients data
          const clientsData = reminder.invoices.clients || {};
          
          return {
            id: reminder.id,
            invoice_id: reminder.invoice_id,
            reminder_type: reminder.reminder_type || 'friendly',
            overdue_days: reminder.overdue_days || 0,
            sent_at: reminder.sent_at || reminder.created_at || new Date().toISOString(),
            email_id: reminder.email_id || null,
            reminder_status: reminderStatus,
            failure_reason: reminder.failure_reason || null,
            created_at: reminder.created_at || new Date().toISOString(),
            paymentData: reminder.paymentData || undefined,
            invoice: {
              invoice_number: reminder.invoices.invoice_number,
              total: reminder.invoices.total || 0,
              due_date: reminder.invoices.due_date,
              status: reminder.invoices.status || 'sent',
              late_fees: reminder.invoices.late_fees || null,
              currency: reminder.invoices.currency || null,
              clients: {
                name: clientsData.name || 'N/A',
                email: clientsData.email || 'N/A',
                company: clientsData.company || null
              }
            }
          };
        });
        
        // Deduplicate reminders: keep only the most recent one per invoice+type+status
        // Group by invoice_id + reminder_type + reminder_status
        const reminderMap = new Map<string, ReminderHistory>();
        for (const reminder of formattedReminders) {
          const key = `${reminder.invoice_id}-${reminder.reminder_type}-${reminder.reminder_status}`;
          const existing = reminderMap.get(key);
          
          if (!existing) {
            // First occurrence - add it
            reminderMap.set(key, reminder);
          } else {
            // Compare dates to keep the most recent one
            const existingDate = new Date(existing.created_at || existing.sent_at || 0);
            const currentDate = new Date(reminder.created_at || reminder.sent_at || 0);
            
            if (currentDate > existingDate) {
              // Current reminder is newer - replace
              reminderMap.set(key, reminder);
            }
            // Otherwise keep the existing one
          }
        }
        
        const deduplicatedReminders = Array.from(reminderMap.values());
        console.log(`Formatted ${formattedReminders.length} reminder(s), deduplicated to ${deduplicatedReminders.length}`);
        setReminders(deduplicatedReminders);
      } else {
        console.log('No reminder data found');
        setReminders([]);
      }

    } catch (error) {
      console.error('Error fetching reminder history:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReminderHistory();
    }
  }, [user?.id]);

  // Debounced search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle session expiration - wait for potential refresh from visibility handlers
  useEffect(() => {
    const handleSessionCheck = async () => {
      if (!user && !loading) {
        // Wait a moment for visibility/focus handlers to refresh session
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check one more time before redirecting
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = '/auth?message=session_expired';
        }
      }
    };

    if (!user && !loading) {
      handleSessionCheck();
    }
  }, [user, loading]);

  // Optimized filtering and sorting with useMemo and debounced search
  const filteredReminders = useMemo(() => {
    if (!reminders || reminders.length === 0) {
      return [];
    }
    
    return reminders.filter(reminder => {
      // Safety check for invoice data
      if (!reminder.invoice || !reminder.invoice.invoice_number) {
        return false;
      }

      // CRITICAL: Exclude draft invoices - they should never have reminders
      if (reminder.invoice.status === 'draft') {
        return false;
      }
      
      // Apply search filter (only if search term exists)
      if (debouncedSearchTerm.trim()) {
        const matchesSearch = 
          reminder.invoice.invoice_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (reminder.invoice.clients?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (reminder.invoice.clients?.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());

        if (!matchesSearch) return false;
      }

      // Apply status filter
      if (statusFilter && reminder.reminder_status !== statusFilter) {
        return false;
      }

      // Apply type filter
      if (typeFilter && reminder.reminder_type !== typeFilter) {
        return false;
      }

      // For scheduled reminders: show those scheduled for today or within 1 day ahead
      // For all other statuses: show ALL reminders (complete history)
      if (reminder.reminder_status === 'scheduled') {
        const now = new Date();
        const scheduledDate = new Date(reminder.sent_at || reminder.created_at || now);
        
        // Get today's date (start of day) and tomorrow's date (start of day)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        // Get scheduled date (start of day)
        const scheduledDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
        
        // Show if scheduled for today or tomorrow (within 1 day ahead)
        if (scheduledDay >= today && scheduledDay < dayAfterTomorrow) {
          return true; // Show scheduled reminders for today or tomorrow
        }
        
        return false; // Skip reminders scheduled for past or more than 1 day ahead
      }
      
      // Show ALL sent/failed/delivered/bounced/cancelled reminders (complete history)
      return true;
    }).sort((a, b) => {
      // Sort by status priority: sent/failed/delivered/bounced/cancelled first, then scheduled
      const statusPriority: Record<string, number> = { 
        'sent': 1, 
        'delivered': 1, 
        'failed': 1, 
        'bounced': 1,
        'cancelled': 1,
        'scheduled': 2 
      };
      const aPriority = statusPriority[a.reminder_status] || 3;
      const bPriority = statusPriority[b.reminder_status] || 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same status, sort by date (newest first for sent/failed, earliest first for scheduled)
      if (a.reminder_status === 'scheduled' && b.reminder_status === 'scheduled') {
        return new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
      }
      
      // For sent/failed/delivered/bounced, show newest first
      return new Date(b.sent_at || b.created_at || 0).getTime() - new Date(a.sent_at || a.created_at || 0).getTime();
    });
  }, [reminders, debouncedSearchTerm, statusFilter, typeFilter]);

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'friendly': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'polite': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'firm': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReminderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-600';
      case 'sent': return 'text-blue-600';
      case 'scheduled': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'bounced': return 'text-orange-600';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  // Reminder Card Component - Extracted to fix Rules of Hooks violation
  const ReminderCard = React.memo(({ 
    reminder, 
    totals, 
    sentDate, 
    getReminderStatusColor, 
    sendManualReminder, 
    sendingReminders, 
    handleViewReminder 
  }: {
    reminder: ReminderHistory;
    totals: ReturnType<typeof calculateReminderTotal>;
    sentDate: Date;
    getReminderStatusColor: (status: string) => string;
    sendManualReminder: (invoiceId: string, reminderType: string) => void;
    sendingReminders: Set<string>;
    handleViewReminder: (reminder: ReminderHistory) => void;
  }) => {
    // Get currency for this reminder
    const invoiceCurrency = reminder.invoice.currency || 'USD';
    
    // Prepare breakdowns for rotation (only amount breakdowns rotate, badges stay static)
    // Memoize to prevent recreation on every render
    // Create complete strings atomically to prevent staggered rendering
    const breakdowns = React.useMemo(() => {
      const items: React.ReactNode[] = [];
      
      if (totals.isPartiallyPaid) {
        // Pre-compute all values before creating string to ensure atomic rendering
        const totalPaidFormatted = formatCurrencyForCards(totals.totalPaid, invoiceCurrency);
        const remainingFormatted = formatCurrencyForCards(totals.baseAmount, invoiceCurrency);
        // Create complete string atomically - render as single text node to prevent partial rendering
        // Use inline-block and nowrap to prevent layout shift
        const partialText = `Paid: ${totalPaidFormatted} • Remaining: ${remainingFormatted}`;
        items.push(<div key="partial" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{partialText}</div>);
      }
      
      if (totals.hasLateFees) {
        // Pre-compute all values before creating string to ensure atomic rendering
        const baseFormatted = formatCurrencyForCards(totals.baseAmount, invoiceCurrency);
        const lateFeeFormatted = formatCurrencyForCards(totals.lateFeesAmount, invoiceCurrency);
        // Create complete string atomically - render as single text node to prevent partial rendering
        // Use inline-block and nowrap to prevent layout shift
        const lateFeesText = `Base ${baseFormatted} • Late fee ${lateFeeFormatted}`;
        items.push(<div key="latefees" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{lateFeesText}</div>);
      }
      
      if (!totals.isPartiallyPaid && !totals.hasLateFees) {
        items.push(<div key="empty" className="min-h-[14px] sm:min-h-[16px]"></div>);
      }
      
      return items;
    }, [totals.isPartiallyPaid, totals.hasLateFees, totals.totalPaid, totals.baseAmount, totals.lateFeesAmount, invoiceCurrency]);

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

    // Only enable rotation when card is visible to improve performance
    const rotationState = useSynchronizedRotation(breakdowns.length, isVisible);

    return (
      <div ref={cardRef} className="border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
        {/* Mobile Layout */}
        <div className="block sm:hidden p-3">
          <div className="space-y-2">
            {/* Top Row: Invoice Info + Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                  <Mail className="h-3.5 w-3.5 text-gray-700" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{color: '#1f2937'}}>
                    {reminder.invoice.invoice_number}
                  </div>
                  <div className="text-xs" style={{color: '#6b7280'}}>
                    {reminder.invoice.clients.name}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className={`font-semibold text-base ${
                  reminder.invoice.status === 'paid' ? 'text-emerald-600' :
                  totals.hasLateFees ? 'text-red-600' :
                  'text-green-600'
                }`}>
                  {formatCurrencyForCards(totals.totalPayable, reminder.invoice.currency || 'USD')}
                </div>
                <div className="mt-0 mb-0.5 text-[10px] sm:text-xs text-gray-500" style={{ minHeight: '12px' }}>
                  <RotatingAmountBreakdown
                    breakdowns={breakdowns}
                    rotationState={rotationState}
                  />
                </div>
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {sentDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Bottom Row: Reminder Type, Status & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Static badges - no rotation */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  reminder.reminder_type === 'friendly' ? 'text-blue-600' :
                  reminder.reminder_type === 'polite' ? 'text-emerald-600' :
                  reminder.reminder_type === 'firm' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  <span className="capitalize">{reminder.reminder_type}</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getReminderStatusColor(reminder.reminder_status)}`}>
                  <span className="capitalize">{reminder.reminder_status}</span>
                </span>
                {reminder.failure_reason && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600" title={reminder.failure_reason}>
                    <AlertTriangle className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{reminder.failure_reason}</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Only show manual send button for failed reminders (not cancelled) */}
                {reminder.reminder_status === 'failed' && !reminder.failure_reason?.includes('Invoice already paid') && !reminder.failure_reason?.includes('Invoice fully paid') && !reminder.failure_reason?.includes('reminders cancelled') && (
                  <button
                    onClick={() => sendManualReminder(reminder.invoice_id, reminder.reminder_type)}
                    disabled={sendingReminders.has(`${reminder.invoice_id}-${reminder.reminder_type}`)}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${
                      sendingReminders.has(`${reminder.invoice_id}-${reminder.reminder_type}`) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title="Send again"
                  >
                    {sendingReminders.has(`${reminder.invoice_id}-${reminder.reminder_type}`) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Send className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleViewReminder(reminder)}
                  className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer"
                  title="View reminder details"
                >
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                  <Mail className="h-3.5 w-3.5 text-gray-700" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{color: '#1f2937'}}>
                    {reminder.invoice.invoice_number}
                  </div>
                  <div className="text-xs" style={{color: '#6b7280'}}>
                    {reminder.invoice.clients.name}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className={`font-semibold text-base ${
                  reminder.invoice.status === 'paid' ? 'text-emerald-600' :
                  totals.hasLateFees ? 'text-red-600' :
                  'text-green-600'
                }`}>
                  {formatCurrencyForCards(totals.totalPayable, reminder.invoice.currency || 'USD')}
                </div>
                <div className="mt-0 mb-0.5 text-[10px] sm:text-xs text-gray-500" style={{ minHeight: '12px' }}>
                  <RotatingAmountBreakdown
                    breakdowns={breakdowns}
                    rotationState={rotationState}
                  />
                </div>
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {sentDate.toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Static badges - no rotation */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  reminder.reminder_type === 'friendly' ? 'text-blue-600' :
                  reminder.reminder_type === 'polite' ? 'text-emerald-600' :
                  reminder.reminder_type === 'firm' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  <span className="capitalize">{reminder.reminder_type}</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getReminderStatusColor(reminder.reminder_status)}`}>
                  <span className="capitalize">{reminder.reminder_status}</span>
                </span>
                {reminder.failure_reason && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600" title={reminder.failure_reason}>
                    <AlertTriangle className="h-3 w-3" />
                    <span>{reminder.failure_reason}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {/* Only show manual send button for failed reminders (not cancelled) */}
                {reminder.reminder_status === 'failed' && !reminder.failure_reason?.includes('Invoice already paid') && !reminder.failure_reason?.includes('Invoice fully paid') && !reminder.failure_reason?.includes('reminders cancelled') && (
                  <button
                    onClick={() => sendManualReminder(reminder.invoice_id, reminder.reminder_type)}
                    disabled={sendingReminders.has(`${reminder.invoice_id}-${reminder.reminder_type}`)}
                    className={`p-1.5 transition-colors hover:bg-gray-100 ${
                      sendingReminders.has(`${reminder.invoice_id}-${reminder.reminder_type}`) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title="Send again"
                  >
                    {sendingReminders.has(`${reminder.invoice_id}-${reminder.reminder_type}`) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Send className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleViewReminder(reminder)}
                  className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer"
                  title="View reminder details"
                >
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  ReminderCard.displayName = 'ReminderCard';

  // Helper function to calculate total with late fees and partial payments
  // IMPORTANT: Partial payments should affect scheduled reminders (except sent/cancelled reminders)
  // - Scheduled reminders should use remaining balance (after partial payments)
  // - Sent/delivered reminders should use original total (already sent, can't modify)
  // - Cancelled invoices should use original total
  const calculateReminderTotal = (reminder: ReminderHistory) => {
    // Check if we should ignore partial payments:
    // 1. Reminder has already been sent/delivered (already sent to client, can't modify)
    // 2. Invoice status is 'cancelled' (invoice is cancelled, use original total)
    // NOTE: Invoice status 'sent' should NOT prevent scheduled reminders from using partial payments
    const shouldIgnorePartialPayments = 
      reminder.reminder_status === 'sent' || 
      reminder.reminder_status === 'delivered' ||
      reminder.invoice.status === 'cancelled';
    
    // Use partial payments for scheduled reminders (regardless of invoice status being 'sent' or 'pending')
    // Only sent/delivered reminders or cancelled invoices should ignore partial payments
    const baseAmount = (shouldIgnorePartialPayments || reminder.reminder_status !== 'scheduled')
      ? reminder.invoice.total  // Use original total if reminder sent/delivered or invoice cancelled
      : (reminder.paymentData?.remainingBalance || reminder.invoice.total); // Use remaining balance for scheduled reminders
    
    let lateFeesAmount = 0;
    let totalPayable = baseAmount;
    
    // Parse late fees settings
    let lateFeesSettings = null;
    if (reminder.invoice.late_fees) {
      try {
        lateFeesSettings = typeof reminder.invoice.late_fees === 'string' 
          ? JSON.parse(reminder.invoice.late_fees) 
          : reminder.invoice.late_fees;
      } catch (e) {
        lateFeesSettings = null;
      }
    }
    
    // Calculate late fees if invoice is overdue and late fees are enabled
    if (reminder.overdue_days > 0 && reminder.invoice.status !== 'paid' && lateFeesSettings && lateFeesSettings.enabled) {
      const gracePeriod = lateFeesSettings.gracePeriod || 0;
      const chargeableDays = Math.max(0, reminder.overdue_days - gracePeriod);
      
      if (chargeableDays > 0) {
        if (lateFeesSettings.type === 'percentage') {
          // Calculate late fee on base amount
          lateFeesAmount = baseAmount * ((lateFeesSettings.amount || 0) / 100);
        } else if (lateFeesSettings.type === 'fixed') {
          lateFeesAmount = lateFeesSettings.amount || 0;
        }
        totalPayable = baseAmount + lateFeesAmount;
      }
    }
    
    // Show partial payment if reminder is scheduled (regardless of invoice status being 'sent' or 'pending')
    // Only sent/delivered reminders or cancelled invoices should not show partial payments
    const isPartiallyPaid = !shouldIgnorePartialPayments && 
      reminder.reminder_status === 'scheduled' && 
      (reminder.paymentData?.totalPaid || 0) > 0 && 
      (reminder.paymentData?.remainingBalance || 0) > 0;
    
    return {
      baseAmount,
      lateFeesAmount,
      totalPayable,
      hasLateFees: lateFeesAmount > 0,
      totalPaid: isPartiallyPaid ? (reminder.paymentData?.totalPaid || 0) : 0,
      isPartiallyPaid
    };
  };

  const sendManualReminder = async (invoiceId: string, reminderType: string) => {
    const reminderKey = `${invoiceId}-${reminderType}`;
    
    // Prevent multiple simultaneous sends
    if (sendingReminders.has(reminderKey)) {
      return;
    }

    try {
      setSendingReminders(prev => new Set(prev).add(reminderKey));
      
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          reminderType,
          overdueDays: 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Reminder sent successfully!', 'The payment reminder has been sent to the client.');
        await fetchReminderHistory(); // Refresh data
      } else {
        const errorMessage = data.details || data.error || 'Failed to send reminder';
        showError('Failed to send reminder', errorMessage);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showError('Error sending reminder', 'An unexpected error occurred. Please try again.');
    } finally {
      setSendingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(reminderKey);
        return newSet;
      });
    }
  };


  const handleViewReminder = (reminder: ReminderHistory) => {
    setSelectedReminder(reminder);
    setShowReminderModal(true);
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setSelectedReminder(null);
  };

  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the invoice type selection modal
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setShowFastInvoice(true);
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setShowCreateInvoice(true);
  }, []);


  if (authLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Show loading while checking session (layout will handle redirect)
    return (
      <div className={`min-h-screen transition-colors duration-200 ${'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${'bg-white'}`}>
      <div className="flex h-screen">
        <ModernSidebar 
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
              Reminder History
            </h2>
             <button
               onClick={fetchReminderHistory}
               className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
             >
               <RefreshCw className="h-4 w-4" />
               <span>Refresh</span>
             </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search reminders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border text-sm border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Filter Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || typeFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setTypeFilter('');
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Options - Compact */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 p-3">
              <div className="space-y-3">
                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setStatusFilter('')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        !statusFilter 
                          ? 'text-indigo-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('sent')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === 'sent' 
                          ? 'text-blue-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Sent
                    </button>
                    <button
                      onClick={() => setStatusFilter('scheduled')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === 'scheduled' 
                          ? 'text-yellow-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Scheduled
                    </button>
                    <button
                      onClick={() => setStatusFilter('delivered')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === 'delivered' 
                          ? 'text-emerald-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Delivered
                    </button>
                    <button
                      onClick={() => setStatusFilter('failed')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === 'failed' 
                          ? 'text-red-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Failed
                    </button>
                    <button
                      onClick={() => setStatusFilter('bounced')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === 'bounced' 
                          ? 'text-orange-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Bounced
                    </button>
                    <button
                      onClick={() => setStatusFilter('cancelled')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === 'cancelled' 
                          ? 'text-gray-900' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTypeFilter('')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        !typeFilter 
                          ? 'text-indigo-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTypeFilter('friendly')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        typeFilter === 'friendly' 
                          ? 'text-blue-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Friendly
                    </button>
                    <button
                      onClick={() => setTypeFilter('polite')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        typeFilter === 'polite' 
                          ? 'text-emerald-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Polite
                    </button>
                    <button
                      onClick={() => setTypeFilter('firm')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        typeFilter === 'firm' 
                          ? 'text-yellow-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Firm
                    </button>
                    <button
                      onClick={() => setTypeFilter('urgent')}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        typeFilter === 'urgent' 
                          ? 'text-red-600' 
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Urgent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Count */}
          {(searchTerm || statusFilter || typeFilter) && (
            <div className="text-xs text-gray-600">
              Showing {filteredReminders.length} reminder{filteredReminders.length !== 1 ? 's' : ''}
              {(searchTerm || statusFilter || typeFilter) && (
                <span className="ml-1">
                  (filtered from {reminders.length} total)
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-200 bg-white p-4 sm:p-6">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300"></div>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredReminders.map((reminder) => {
              const totals = calculateReminderTotal(reminder);
              const sentDate = new Date(reminder.sent_at);
              
              return (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  totals={totals}
                  sentDate={sentDate}
                  getReminderStatusColor={getReminderStatusColor}
                  sendManualReminder={sendManualReminder}
                  sendingReminders={sendingReminders}
                  handleViewReminder={handleViewReminder}
                />
              );
            })}

            {filteredReminders.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="border border-gray-200 bg-white p-6">
                  <div className="text-center py-12">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No reminders found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No reminders found. Sent/failed/delivered/bounced reminders (all time) and scheduled reminders within 1 day ahead will appear here.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </main>
      </div>

      {/* Sliding Modal for Reminder Details */}
      {showReminderModal && selectedReminder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm bg-white/20 transition-all duration-300"
            onClick={closeReminderModal}
          />
          
          {/* Sliding Panel - 75% width on mobile, fixed width on desktop */}
          <div className="absolute right-0 top-0 h-full w-3/4 sm:w-full sm:max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reminder Details</h3>
                <button
                  onClick={closeReminderModal}
                  className="p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Invoice Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Invoice Information</h4>
                    <div className="bg-gray-50 p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Invoice Number:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.invoice.invoice_number}</span>
                      </div>
                      {(() => {
                        // Use the same calculation function as cards to ensure consistency
                        const totals = calculateReminderTotal(selectedReminder);
                        const invoiceCurrency = selectedReminder.invoice.currency || 'USD';
                        
                              return (
                                <>
                                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                    <span className="text-xs sm:text-sm text-gray-600">Base Amount:</span>
                                    <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                {formatCurrencyForCards(totals.baseAmount, invoiceCurrency)}
                                    </span>
                                  </div>
                            {totals.isPartiallyPaid && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                      <span className="text-xs sm:text-sm text-gray-600">Partial Paid:</span>
                                      <span className="text-xs sm:text-sm font-medium text-blue-600 break-words">
                                  -{formatCurrencyForCards(totals.totalPaid, invoiceCurrency)}
                                      </span>
                                    </div>
                                  )}
                            {totals.hasLateFees && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                      <span className="text-xs sm:text-sm text-gray-600">Late Fees ({selectedReminder.overdue_days} days):</span>
                                      <span className="text-xs sm:text-sm font-medium text-red-600 break-words">
                                  +{formatCurrencyForCards(totals.lateFeesAmount, invoiceCurrency)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-1 border-t border-gray-200">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Amount Due:</span>
                                    <span className="text-xs sm:text-sm font-bold text-green-600 break-words">
                                {formatCurrencyForCards(totals.totalPayable, invoiceCurrency)}
                                    </span>
                                  </div>
                          </>
                        );
                      })()}
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Due Date:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{new Date(selectedReminder.invoice.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                        <span className={`text-xs sm:text-sm font-medium capitalize break-words ${
                          selectedReminder.invoice.status === 'paid' ? 'text-green-600' :
                          selectedReminder.invoice.status === 'sent' ? 'text-blue-600' :
                          selectedReminder.invoice.status === 'overdue' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {selectedReminder.invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Client Information</h4>
                    <div className="bg-gray-50 p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Name:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.invoice.clients.name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Email:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words break-all">{selectedReminder.invoice.clients.email}</span>
                      </div>
                      {selectedReminder.invoice.clients.company && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm text-gray-600">Company:</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.invoice.clients.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reminder Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Reminder Information</h4>
                    <div className="bg-gray-50 p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Type:</span>
                        <span className={`text-xs sm:text-sm font-medium capitalize break-words ${
                          selectedReminder.reminder_type === 'friendly' ? 'text-blue-600' :
                          selectedReminder.reminder_type === 'polite' ? 'text-emerald-600' :
                          selectedReminder.reminder_type === 'firm' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedReminder.reminder_type}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                        <span className={`text-xs sm:text-sm font-medium capitalize break-words ${getReminderStatusColor(selectedReminder.reminder_status)}`}>
                          {selectedReminder.reminder_status}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Scheduled/Sent:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                          {new Date(selectedReminder.sent_at).toLocaleString()}
                        </span>
                      </div>
                      {selectedReminder.overdue_days !== 0 && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm text-gray-600">Overdue Days:</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.overdue_days}</span>
                        </div>
                      )}
                      {selectedReminder.failure_reason && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm text-gray-600">Failure Reason:</span>
                          <span className="text-xs sm:text-sm font-medium text-red-600 break-words">{selectedReminder.failure_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-0">
                  <button
                    onClick={closeReminderModal}
                    className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  {/* Only show send button for failed reminders (not cancelled) */}
                  {selectedReminder.reminder_status === 'failed' && (
                    <button
                      onClick={async () => {
                        await sendManualReminder(selectedReminder.invoice_id, selectedReminder.reminder_type);
                        closeReminderModal();
                      }}
                      disabled={sendingReminders.has(`${selectedReminder.invoice_id}-${selectedReminder.reminder_type}`)}
                      className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {sendingReminders.has(`${selectedReminder.invoice_id}-${selectedReminder.reminder_type}`) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Again</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          onClose={() => setShowFastInvoice(false)}
          user={user!}
          onSuccess={() => {
            setShowFastInvoice(false);
            showSuccess('Invoice created successfully');
          }}
          getAuthHeaders={getAuthHeaders}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showError}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          onSuccess={() => {
            setShowCreateInvoice(false);
            showSuccess('Invoice created successfully');
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}



