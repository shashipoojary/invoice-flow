'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, FileText, Clock, CheckCircle, AlertCircle, AlertTriangle, FilePlus, Sparkles,
  Eye, Download, Send, Edit, X, Bell, CreditCard, DollarSign, Calendar, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import { useData } from '@/contexts/DataContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import UnifiedInvoiceCard from '@/components/UnifiedInvoiceCard';
import PartialPaymentModal from '@/components/PartialPaymentModal';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getInvoicePaymentData } from '@/lib/invoice-payments';

// Lazy load heavy modal components for better performance
const FastInvoiceModal = dynamic(() => import('@/components/FastInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const QuickInvoiceModal = dynamic(() => import('@/components/QuickInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const ConfirmationModal = dynamic(() => import('@/components/ConfirmationModal'), {
  loading: () => null
});

const SendInvoiceModal = dynamic(() => import('@/components/SendInvoiceModal'), {
  loading: () => null
});

const ClientModal = dynamic(() => import('@/components/ClientModal'), {
  loading: () => null
});

// Types
import { Client, Invoice } from '@/types';

function InvoicesContent(): React.JSX.Element {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const { settings } = useSettings();
  const { invoices, clients, isLoadingInvoices, hasInitiallyLoaded, addInvoice, updateInvoice, deleteInvoice, refreshInvoices } = useData();
  const searchParams = useSearchParams();
  
  // Local state for UI
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReminderDates, setShowReminderDates] = useState(false);
  const [showPartialPayment, setShowPartialPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
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
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterAppliedManually, setFilterAppliedManually] = useState(false);
  const [invoicesWithPartialPayments, setInvoicesWithPartialPayments] = useState<Set<string>>(new Set());
  const [paymentDataMap, setPaymentDataMap] = useState<Record<string, { totalPaid: number; remainingBalance: number }>>({});
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page
  
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

  // Payment data is now embedded directly in invoices from /api/invoices
  // No need for separate bulk fetch - removed to prevent infinite loops

  // Business settings are now managed by SettingsContext



  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the invoice type selection modal
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    // Use setTimeout to ensure state is cleared before opening modal
    setSelectedInvoice(null);
    // Use requestAnimationFrame to ensure state update is applied
    requestAnimationFrame(() => {
      setShowFastInvoice(true);
    });
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    // Use setTimeout to ensure state is cleared before opening modal
    setSelectedInvoice(null);
    // Use requestAnimationFrame to ensure state update is applied
    requestAnimationFrame(() => {
      setShowCreateInvoice(true);
    });
  }, []);

  // Status helper functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-3 w-3" />;
      case 'sent':
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
      case 'sent':
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
    // Last resort
    return new Date(input);
  }, []);

  // Debounced search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Search and filter logic
  // Optimized search and filter logic with useMemo and debounced search
  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];

    let filtered = invoices;

    // Apply debounced search query for better performance
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(invoice => {
        const clientName = invoice.client?.name?.toLowerCase() || '';
        const invoiceNumber = invoice.invoiceNumber?.toLowerCase() || '';
        const invoiceType = invoice.type?.toLowerCase() || '';
        const amount = invoice.total?.toString() || '';
        
        return clientName.includes(query) || 
               invoiceNumber.includes(query) || 
               invoiceType.includes(query) || 
               amount.includes(query);
      });
    }

    // Apply status filter
    if (statusFilter) {
      if (statusFilter === 'overdue') {
        const today = new Date();
        const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        
        filtered = filtered.filter(invoice => {
          if (invoice.status !== 'pending' && invoice.status !== 'sent') return false;
          
          const effectiveDueDate = parseDateOnly(invoice.dueDate);
          const dueDateStart = new Date(Date.UTC(effectiveDueDate.getFullYear(), effectiveDueDate.getMonth(), effectiveDueDate.getDate()));
          return dueDateStart < todayStart;
        });
      } else if (statusFilter === 'partial') {
        // Filter for invoices with partial payments
        filtered = filtered.filter(invoice => {
          // Only sent/pending invoices can have partial payments
          if (invoice.status !== 'sent' && invoice.status !== 'pending') return false;
          // Check if this invoice has partial payments
          return invoicesWithPartialPayments.has(invoice.id);
        });
      } else {
        filtered = filtered.filter(invoice => {
          switch (statusFilter) {
            case 'paid': return invoice.status === 'paid' || invoicesWithPartialPayments.has(invoice.id);
            case 'pending': return invoice.status === 'pending' || invoice.status === 'sent';
            case 'draft': return invoice.status === 'draft';
            default: return true;
          }
        });
      }
    }

    // Deduplicate invoices by ID to prevent duplicate keys
    const uniqueInvoices = filtered.filter((invoice, index, self) => 
      index === self.findIndex(i => i.id === invoice.id)
    );
    
    return uniqueInvoices;
  }, [invoices, debouncedSearchQuery, statusFilter, invoicesWithPartialPayments, parseDateOnly]);

  // Pagination logic
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Helper function to calculate due charges and total payable
  const calculateDueCharges = useCallback((invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => {
    // Only calculate late fees for sent invoices that are actually overdue
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

  // Fetch payments when showing payment form
  useEffect(() => {
    if (showPaymentForm && selectedInvoice?.id) {
      fetchPayments();
    }
  }, [showPaymentForm, selectedInvoice?.id, fetchPayments]);

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
      // Fetch complete invoice data from API to ensure all fields are present
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/invoices/${invoice.id}`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }
      
      const data = await response.json();
      const completeInvoice = data.invoice;
      
      if (!completeInvoice || !completeInvoice.client || !completeInvoice.items) {
        throw new Error('Invoice data is incomplete');
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
      
      const pdfBlob = await generateTemplatePDFBlob(
        completeInvoice, 
        businessSettings, 
        template, 
        primaryColor, 
        secondaryColor
      );
      
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
    } catch (error) {
      console.error('PDF download error:', error);
      showError('Download Failed', 'Failed to download PDF. Please try again.');
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [settings, showSuccess, showError, getAuthHeaders]);

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
        // Prefer server response's invoice if provided
        try { const payload = await response.json(); if (payload?.invoice) { updateInvoice(payload.invoice) } } catch {}
        // Fallback optimistic update
        updateInvoice({ ...invoice, status: 'sent' as const });
        // And refresh list to keep filters/pagination in sync
        try { await refreshInvoices(); } catch {}
        showSuccess('Invoice Sent', `Invoice ${invoice.invoiceNumber} has been sent successfully.`);
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
        // Update global state
        updateInvoice({ ...invoice, status: 'paid' as const });
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
        // Update global state
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

  const handleDuplicateInvoice = useCallback((invoice: Invoice) => {
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
  }, []);

  const performDuplicateInvoice = useCallback(async (invoice: Invoice) => {
    const actionKey = `duplicate-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    
    try {
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
        showError('Duplicate Failed', error.error || 'Failed to duplicate invoice. Please try again.');
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      showError('Duplicate Failed', 'Failed to duplicate invoice. Please try again.');
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [getAuthHeaders, showSuccess, showError, addInvoice, refreshInvoices]);

  // Memoized Invoice Card Component - optimized with React.memo
  const InvoiceCard = React.memo(({ invoice, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, handleMarkAsPaid, handleDeleteInvoice, getStatusIcon, getStatusColor, getDueDateStatus, formatPaymentTerms, formatLateFees, formatReminders, calculateDueCharges, loadingActions }: {
    invoice: Invoice;
    handleViewInvoice: (invoice: Invoice) => void;
    handleDownloadPDF: (invoice: Invoice) => void;
    handleSendInvoice: (invoice: Invoice) => void;
    handleEditInvoice: (invoice: Invoice) => void;
    handleMarkAsPaid: (invoice: Invoice) => void;
    handleDeleteInvoice: (invoice: Invoice) => void;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
    getDueDateStatus: (dueDate: string, invoiceStatus: string, paymentTerms?: { enabled: boolean; terms: string }, updatedAt?: string) => { status: string; days: number; color: string };
    formatPaymentTerms: (paymentTerms?: { enabled: boolean; terms: string }) => string | null;
    formatLateFees: (lateFees?: { enabled: boolean; type: 'fixed' | 'percentage'; amount: number; gracePeriod: number }) => string | null;
    formatReminders: (reminders?: { enabled: boolean; useSystemDefaults: boolean; rules?: Array<{ enabled: boolean }>; customRules?: Array<{ enabled: boolean }> }) => string | null;
    calculateDueCharges: (invoice: Invoice, paymentData?: { totalPaid: number; remainingBalance: number } | null) => { hasLateFees: boolean; lateFeeAmount: number; totalPayable: number; overdueDays: number; totalPaid: number; remainingBalance: number; isPartiallyPaid: boolean };
    loadingActions: { [key: string]: boolean };
  }) => {
    const [paymentData, setPaymentData] = useState<{ totalPaid: number; remainingBalance: number } | null>(null);
    
    // Fetch payment data for sent/pending invoices
    useEffect(() => {
      if ((invoice.status === 'sent' || invoice.status === 'pending') && invoice.id) {
        const fetchPayments = async () => {
          try {
            const headers = await getAuthHeaders();
            const response = await fetch(`/api/invoices/${invoice.id}/payments`, { headers });
            if (response.ok) {
              const data = await response.json();
              if (data.totalPaid > 0 && data.remainingBalance > 0) {
                setPaymentData({ totalPaid: data.totalPaid, remainingBalance: data.remainingBalance });
                // Track this invoice as having partial payments
                setInvoicesWithPartialPayments(prev => new Set(prev).add(invoice.id));
              } else {
                setPaymentData(null);
                setInvoicesWithPartialPayments(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(invoice.id);
                  return newSet;
                });
              }
            }
          } catch (error) {
            // Silently fail - payment data is optional
            setPaymentData(null);
            setInvoicesWithPartialPayments(prev => {
              const newSet = new Set(prev);
              newSet.delete(invoice.id);
              return newSet;
            });
          }
        };
        fetchPayments();
      } else {
        setPaymentData(null);
        setInvoicesWithPartialPayments(prev => {
          const newSet = new Set(prev);
          newSet.delete(invoice.id);
          return newSet;
        });
      }
    }, [invoice.id, invoice.status]);
    
    const dueDateStatus = getDueDateStatus(invoice.dueDate, invoice.status, invoice.paymentTerms, (invoice as any).updatedAt);
    const dueCharges = calculateDueCharges(invoice, paymentData);
    
    
    
    // Show enhanced features for all invoice statuses
    const paymentTerms = formatPaymentTerms(invoice.paymentTerms);
    const lateFees = formatLateFees(invoice.lateFees);
    const reminders = formatReminders(invoice.reminders);
    
    return (
      <div className="border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
          {/* Mobile Layout */}
        <div className="block sm:hidden p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100`}>
                  <FileText className="h-4 w-4 text-gray-600" />
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
                <div className={`font-semibold text-base ${
                  invoice.status === 'paid' ? ('text-emerald-600') :
                  dueDateStatus.status === 'overdue' ? ('text-red-600') :
                  /* mirror Recent Invoices color rules */
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
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
                  {new Date(invoice.createdAt).toLocaleDateString()}
              </div>
            </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid' ? ('text-emerald-600') :
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
                }`}>
                {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
              </span>
                {dueCharges.isPartiallyPaid && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
                    <DollarSign className="h-3 w-3" />
                    <span>Partial Paid</span>
                  </span>
                )}
                {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${'text-red-600'}`}>
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
              )}
                {/* match Recent Invoices: no separate draft-past-due chip */}
          </div>
          
              <div className="flex items-center space-x-1">
                <button 
                  data-testid={`invoice-${invoice.id}-view`}
                  onClick={() => handleViewInvoice(invoice)}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100 cursor-pointer'}`}
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  data-testid={`invoice-${invoice.id}-pdf`}
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="PDF"
                >
                  {loadingActions[`pdf-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Download className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {invoice.status === 'draft' && (
                  <button 
                    data-testid={`invoice-${invoice.id}-send`}
                    onClick={() => handleSendInvoice(invoice)}
                    disabled={loadingActions[`send-${invoice.id}`]}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                    data-testid={`invoice-${invoice.id}-mark-paid`}
                    onClick={() => handleMarkAsPaid(invoice)}
                    disabled={loadingActions[`paid-${invoice.id}`]}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Mark Paid"
                  >
                    {loadingActions[`paid-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                )}
          {/* Match Recent Invoices: no inline Edit/Delete in desktop row */}
              </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout - Same as Mobile */}
        <div className="hidden sm:block p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100`}>
                  <FileText className="h-4 w-4 text-gray-600" />
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
              <div className="text-right">
                <div className={`font-semibold text-base ${
                  invoice.status === 'paid' ? ('text-emerald-600') :
                  dueDateStatus.status === 'overdue' ? ('text-red-600') :
                  /* mirror Recent Invoices color rules */
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
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
                  {new Date(invoice.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid' ? ('text-emerald-600') :
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
                }`}>
                {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
                  </span>
                {dueCharges.isPartiallyPaid && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
                    <DollarSign className="h-3 w-3" />
                    <span>Partial Paid</span>
                  </span>
                )}
                {dueDateStatus.status === 'overdue' && (invoice.status === 'pending' || invoice.status === 'sent') && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${'text-red-600'}`}>
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
                )}
                {/* no draft-past-due badge to match Recent Invoices */}
                </div>
        
              <div className="flex items-center space-x-1">
          <button 
            data-testid={`invoice-${invoice.id}-view`}
            onClick={() => handleViewInvoice(invoice)}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100 cursor-pointer'}`}
                  title="View"
          >
                  <Eye className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            data-testid={`invoice-${invoice.id}-pdf`}
            onClick={() => handleDownloadPDF(invoice)}
            disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="PDF"
          >
            {loadingActions[`pdf-${invoice.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
                    <Download className="h-4 w-4 text-gray-600" />
            )}
          </button>
          {invoice.status === 'draft' && (
            <button 
              data-testid={`invoice-${invoice.id}-send`}
              onClick={() => handleSendInvoice(invoice)}
              disabled={loadingActions[`send-${invoice.id}`]}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
              data-testid={`invoice-${invoice.id}-mark-paid`}
              onClick={() => handleMarkAsPaid(invoice)}
              disabled={loadingActions[`paid-${invoice.id}`]}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Mark Paid"
            >
              {loadingActions[`paid-${invoice.id}`] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
                {invoice.status === 'draft' && (
              <button 
              data-testid={`invoice-${invoice.id}-edit`}
                onClick={() => handleEditInvoice(invoice)}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100 cursor-pointer'}`}
                    title="Edit"
              >
                    <Edit className="h-4 w-4 text-gray-600" />
              </button>
                )}
                {invoice.status === 'draft' && (
              <button 
              data-testid={`invoice-${invoice.id}-delete`}
                onClick={() => handleDeleteInvoice(invoice)}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100 cursor-pointer'}`}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
    );
  });

  InvoiceCard.displayName = 'InvoiceCard';

  // Settings are now loaded by SettingsContext

  // Initialize filters from URL parameters
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
      // Don't set filterAppliedManually to true when coming from URL
    }
  }, [searchParams]);

  // Load data on mount - prevent infinite loop with hasLoadedData flag
  // Data loading is now handled by DataContext
  useEffect(() => {
    if (user && !loading) {
      setHasLoadedData(true);
    }
  }, [user, loading]);

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

  // Only show loading spinner if user is not authenticated yet
  if (loading && !user) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Show loading while checking session (layout will handle redirect)
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Invoices Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                  Invoices
                </h2>
                </div>
                {user ? (
                  <button
                    onClick={() => {
                      setSelectedInvoice(null);
                      setShowCreateInvoice(true);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Invoice</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Search and Filter Section */}
              <div className="bg-white border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by client name, invoice number, type, or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm transition-colors"
                      />
                    </div>
                  </div>

                  {/* Filter Button */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                    </button>

                    {/* Clear Filters */}
                    {(searchQuery || (statusFilter && filterAppliedManually)) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('');
                          setFilterAppliedManually(false);
                          window.history.replaceState({}, '', '/dashboard/invoices');
                        }}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          setStatusFilter('');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          !statusFilter 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('paid');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('pending');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'pending' 
                            ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('overdue');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'overdue' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Overdue
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('draft');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'draft' 
                            ? 'bg-gray-100 text-gray-800 border border-gray-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Draft
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('partial');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'partial' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Partial Paid
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Counter */}
              {!isLoadingInvoices && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    {filteredInvoices.length === 0 ? (
                      <span>No invoices found</span>
                    ) : (
                      <span>
                        {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
                        {(searchQuery || statusFilter) && (
                          <span className="ml-2 text-gray-500">
                            (filtered from {invoices.length} total)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
                
              {/* Invoice List */}
              {(isLoadingInvoices || !hasInitiallyLoaded) ? (
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
              ) : invoices.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {paginatedInvoices
                      .sort((a, b) => {
                        if (statusFilter === 'paid' || statusFilter === 'pending') {
                          // Sort by amount (highest first)
                          return b.total - a.total;
                        }
                        // Default sort by date (newest first)
                        return new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime();
                      })
                      .map((invoice) => (
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
                  
                  {/* Pagination Controls */}
                  {filteredInvoices.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!hasPrevPage}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={!hasNextPage}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing{' '}
                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                            {' '}to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}
                            </span>
                            {' '}of{' '}
                            <span className="font-medium">{filteredInvoices.length}</span>
                            {' '}results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={!hasPrevPage}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer ${
                                    page === currentPage
                                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={!hasNextPage}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center bg-white/70 border border-gray-200 backdrop-blur-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gray-100">
                    <FileText className="h-10 w-10 text-gray-500" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3" style={{color: '#1f2937'}}>
                    No invoices found
                  </h3>
                  <p className="text-sm mb-8 max-w-md mx-auto" style={{color: '#374151'}}>
                    Create your first invoice to start managing your business finances. 
                    Choose between our quick invoice or detailed invoice with full customization.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                        requestAnimationFrame(() => {
                          setShowFastInvoice(true);
                        });
                      }}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Quick Invoice</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                        requestAnimationFrame(() => {
                          setShowCreateInvoice(true);
                        });
                      }}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <FilePlus className="h-4 w-4" />
                      <span>Detailed Invoice</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

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
          onSuccess={() => {
            setShowFastInvoice(false);
            setSelectedInvoice(null);
            // Data is now managed globally, no need to refresh manually
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
            // Data is now managed globally, no need to refresh manually
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
                  await fetch('/api/clients', { headers, cache: 'no-store' })
                    .then(res => res.json())
                    // Data is managed globally; no manual setClients here
                    .catch(err => console.error('Error fetching clients:', err));
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
          <div className="rounded-lg sm:rounded-lg p-2 sm:p-4 max-w-6xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-white border-gray-200 flex flex-col">
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
                className="p-1 sm:p-2 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
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
            <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-6 border-b border-gray-200">
                <div className="w-full sm:w-auto mb-3 sm:mb-0">
                  <h2 className="text-lg sm:text-2xl font-bold mb-1 text-gray-900">
                    {settings.businessName || 'Your Business Name'}
                  </h2>
                  <div className="text-xs sm:text-sm space-y-1 text-gray-600">
                    {settings.address && <p>{settings.address}</p>}
                    {settings.businessEmail && <p>{settings.businessEmail}</p>}
                    {settings.businessPhone && <p>{settings.businessPhone}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
        <div 
          className={`px-3 py-1 text-xs font-medium rounded-full border`}
          style={((selectedInvoice.type || 'detailed') === 'fast' 
            ? { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }
            : { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' }
          )}
        >
                    {selectedInvoice.type === 'fast' ? 'Fast Invoice' : 'Detailed Invoice'}
                  </div>
                  <div className="bg-orange-500 text-white px-3 py-2 rounded text-sm sm:text-base font-bold">
                    Invoice
                  </div>
                </div>
              </div>
              
              {/* Invoice Details */}
              <div className={`p-3 sm:p-6 border-b ${'border-gray-200'}`}>
                <h3 className={`text-sm sm:text-base font-semibold mb-2 ${'text-gray-900'}`}>Invoice Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className={`font-medium ${'text-gray-600'}`}>Invoice Number:</span>
                    <p className={'text-gray-600'}>#{selectedInvoice.invoiceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className={`font-medium ${'text-gray-600'}`}>Date:</span>
                    <p className={'text-gray-600'}>
                      {(selectedInvoice.issueDate || selectedInvoice.issue_date) 
                        ? new Date(selectedInvoice.issueDate || selectedInvoice.issue_date || '').toLocaleDateString() 
                        : (selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <span className={`font-medium ${'text-gray-600'}`}>Due Date:</span>
                    <p className={'text-gray-600'}>
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className={`p-3 sm:p-6 border-b ${'border-gray-200'}`}>
                <h3 className={`text-sm sm:text-base font-semibold mb-2 ${'text-gray-900'}`}>Bill To</h3>
                <div className="text-xs sm:text-sm">
                  <p className={`font-medium ${'text-gray-900'}`}>{displayClient?.name || 'N/A'}</p>
                  <p className={'text-gray-600'}>{displayClient?.email || 'N/A'}</p>
                  {displayClient?.phone && <p className={'text-gray-600'}>{displayClient.phone}</p>}
                  {displayClient?.address && <p className={'text-gray-600'}>{displayClient.address}</p>}
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
                  <tbody className={`divide-y ${'divide-gray-200'}`}>
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={item.id || index} className={'hover:bg-gray-50'}>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${'text-gray-900'}`}>
                          {item.description || 'Service'}
                        </td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${'text-gray-600'}`}>1</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right ${'text-gray-900'}`}>
                          ${(parseFloat(item.amount?.toString() || '0') || 0).toFixed(2)}
                        </td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium ${'text-gray-900'}`}>
                          ${(parseFloat(item.amount?.toString() || '0') || 0).toFixed(2)}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${'text-gray-900'}`}>Service</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${'text-gray-600'}`}>1</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right ${'text-gray-900'}`}>$0.00</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium ${'text-gray-900'}`}>$0.00</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="w-full sm:w-auto">
                    <p className={`text-xs sm:text-sm ${'text-gray-600'}`}>Thank you for your business!</p>
                  </div>
                  <div className="w-full sm:w-64">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className={'text-gray-600'}>Subtotal:</span>
                        <span className={'text-gray-900'}>${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className={'text-gray-600'}>Discount:</span>
                        <span className={'text-gray-900'}>${(selectedInvoice.discount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className={'text-gray-600'}>Tax ({(selectedInvoice.taxRate || 0) * 100}%):</span>
                        <span className={'text-gray-900'}>${(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between text-xs sm:text-sm font-bold border-t pt-1 ${'border-gray-200'}`}>
                        <span className={'text-gray-900'}>Total:</span>
                        <span className={'text-gray-900'}>${(selectedInvoice.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className={`p-3 sm:p-6 border-t ${'border-gray-200'}`}>
                  <h3 className={`text-sm sm:text-base font-semibold mb-2 ${'text-gray-900'}`}>Notes</h3>
                  <p className={`text-xs sm:text-sm ${'text-gray-600'}`}>{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Enhanced Features - Only for Detailed Invoices */}
              {selectedInvoice.type === 'detailed' && (selectedInvoice.paymentTerms || selectedInvoice.lateFees || selectedInvoice.reminders) && (
                <div className={`p-3 sm:p-6 border-t ${'border-gray-200'}`}>
                  <h3 className={`text-sm sm:text-base font-semibold mb-3 ${'text-gray-900'}`}>Enhanced Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                    {selectedInvoice.paymentTerms && (
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <span className={`font-medium ${'text-gray-600'}`}>Payment Terms</span>
                        </div>
                        <p className={'text-gray-600'}>
                          {selectedInvoice.paymentTerms.enabled ? selectedInvoice.paymentTerms.terms : 'Not configured'}
                        </p>
                      </div>
                    )}
                    {selectedInvoice.lateFees && (
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <span className={`font-medium ${'text-gray-600'}`}>Late Fees</span>
                        </div>
                        <p className={'text-gray-600'}>
                          {selectedInvoice.lateFees.enabled 
                            ? `${selectedInvoice.lateFees.type === 'fixed' ? '$' : ''}${selectedInvoice.lateFees.amount}${selectedInvoice.lateFees.type === 'percentage' ? '%' : ''} after ${selectedInvoice.lateFees.gracePeriod ?? 0} days`
                            : 'Not configured'
                          }
                        </p>
                      </div>
                    )}
                    {selectedInvoice.reminders && (
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4 text-green-500" />
                            <span className={`font-medium ${'text-gray-600'}`}>Auto Reminders</span>
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
                        <div className={'text-gray-600 space-y-1'}>
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
            <div className="flex-shrink-0 border-t border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
              {showPaymentForm ? (
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'pending') && (
                <button
                  onClick={() => {
                        setShowPaymentForm(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
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




      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full p-6">
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
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
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
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
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
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Partial Payment Modal */}
      {selectedInvoice && (
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
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}
