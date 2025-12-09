'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Users, 
  Clock, CheckCircle, AlertCircle, AlertTriangle, UserPlus, FilePlus, Sparkles, Receipt, Timer,
  Eye, Download, Send, Edit, X, Bell, CreditCard, DollarSign, Trash2, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import { useData } from '@/contexts/DataContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import UnifiedInvoiceCard from '@/components/UnifiedInvoiceCard';
import FastInvoiceModal from '@/components/FastInvoiceModal';
import QuickInvoiceModal from '@/components/QuickInvoiceModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import SendInvoiceModal from '@/components/SendInvoiceModal';
import ClientModal from '@/components/ClientModal';
import { Client, Invoice } from '@/types';


export default function DashboardOverview() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const { settings } = useSettings();
  const { invoices, clients, isLoadingInvoices, isLoadingClients, hasInitiallyLoaded, updateInvoice, deleteInvoice, refreshInvoices } = useData();
  const router = useRouter();
  
  // Local state for UI
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
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
    isLoading: false
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
  
  // Business settings are now managed by SettingsContext


  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the invoice type selection modal
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setSelectedInvoice(null); // Clear selected invoice for new invoice
    setShowFastInvoice(true);
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setSelectedInvoice(null); // Clear selected invoice for new invoice
    setShowCreateInvoice(true);
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

  const getDueDateStatus = useCallback((dueDate: string, invoiceStatus: string, paymentTerms?: { enabled: boolean; terms: string }, updatedAt?: string) => {
    const today = new Date();
    const effectiveDueDate = parseDateOnly(dueDate);
    
    // Note: "Due on Receipt" logic disabled to match public invoice page behavior
    // The public invoice page uses the raw due_date directly without "Due on Receipt" adjustments
    
    // Set time to start of day for accurate date comparison
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const dueDateStart = new Date(Date.UTC(effectiveDueDate.getFullYear(), effectiveDueDate.getMonth(), effectiveDueDate.getDate()));
    
    const diffTime = dueDateStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Draft invoices should never be marked as overdue, even if past due date
    if (invoiceStatus === 'draft') {
      if (diffDays < 0) {
        return { status: 'draft-past-due', days: Math.abs(diffDays), color: 'text-gray-500' };
      } else if (diffDays === 0) {
        return { status: 'draft-due-today', days: 0, color: 'text-gray-500' };
      } else if (diffDays <= 3) {
        return { status: 'draft-due-soon', days: diffDays, color: 'text-gray-500' };
      } else {
        return { status: 'draft-upcoming', days: diffDays, color: 'text-gray-500' };
      }
    }
    
    // Only sent/pending invoices can be overdue
    // Invoice is overdue only if due date has passed (not on the due date itself)
    if (diffDays < 0) {
      return { status: 'overdue', days: Math.abs(diffDays), color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { status: 'due-today', days: 0, color: 'text-orange-500' };
    } else if (diffDays <= 3) {
      return { status: 'due-soon', days: diffDays, color: 'text-yellow-600' };
    } else {
      return { status: 'upcoming', days: diffDays, color: 'text-gray-600' };
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
  const calculateDueCharges = useCallback((invoice: Invoice) => {
    // Only calculate late fees for pending/sent invoices that are overdue
    if (invoice.status !== 'pending' && invoice.status !== 'sent') {
      return {
        hasLateFees: false,
        lateFeeAmount: 0,
        totalPayable: invoice.total,
        overdueDays: 0
      };
    }

    const today = new Date();
    // Use raw due_date directly (no "Due on Receipt" adjustments) to match invoice card logic
    const effectiveDueDate = parseDateOnly(invoice.dueDate);
    
    // Set time to start of day for accurate date comparison (use UTC to match parseDateOnly)
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const dueDateStart = new Date(Date.UTC(effectiveDueDate.getFullYear(), effectiveDueDate.getMonth(), effectiveDueDate.getDate()));
    
    const diffTime = dueDateStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Only calculate late fees if invoice is overdue and late fees are enabled
    if (diffDays < 0 && invoice.lateFees?.enabled) {
      const overdueDays = Math.abs(diffDays);
      const gracePeriod = invoice.lateFees.gracePeriod || 0;
      
      if (overdueDays > gracePeriod) {
        const chargeableDays = overdueDays - gracePeriod;
        let lateFeeAmount = 0;
        
        if (invoice.lateFees.type === 'fixed') {
          lateFeeAmount = invoice.lateFees.amount;
        } else if (invoice.lateFees.type === 'percentage') {
          lateFeeAmount = (invoice.total * invoice.lateFees.amount) / 100;
        }
        
        const totalPayable = invoice.total + lateFeeAmount;
        return {
          hasLateFees: true,
          lateFeeAmount,
          totalPayable,
          overdueDays: chargeableDays
        };
      }
    }
    
    return {
      hasLateFees: false,
      lateFeeAmount: 0,
      totalPayable: invoice.total,
      overdueDays: 0
    };
  }, [parseDateOnly]);

  // Invoice handler functions
  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoice(true);
  }, []);

  const handleDownloadPDF = useCallback(async (invoice: Invoice) => {
    const actionKey = `pdf-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      // Debug: Log current settings
      
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
      
      // Debug: Log business settings being passed to PDF

      const { generateTemplatePDFBlob } = await import('@/lib/template-pdf-generator');
      
      // Extract template and colors from invoice theme if available
      const invoiceTheme = invoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
      const template = invoiceTheme?.template || 1;
      const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
      const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
      
      const pdfBlob = await generateTemplatePDFBlob(
        invoice, 
        businessSettings, 
        template, 
        primaryColor, 
        secondaryColor
      );
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('PDF Downloaded', `Invoice ${invoice.invoiceNumber} has been downloaded.`);
    } catch (error) {
      console.error('PDF download error:', error);
      showError('Download Failed', 'Failed to download PDF. Please try again.');
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [settings, showSuccess, showError]);

  const handleSendInvoice = useCallback((invoice: Invoice) => {
    // Only show modal for draft invoices
    if (invoice.status === 'draft') {
      setSendInvoiceModal({
        isOpen: true,
        invoice,
        isLoading: false
      });
    } else {
      // For non-draft invoices, send directly (shouldn't happen, but just in case)
      performSendInvoice(invoice);
    }
  }, []);

  const performSendInvoice = useCallback(async (invoice: Invoice) => {
    const actionKey = `send-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setSendInvoiceModal(prev => ({ ...prev, isLoading: true }));
    
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
  }, [getAuthHeaders, showSuccess, showError, updateInvoice, refreshInvoices]);

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
      isLoading: false
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
      isLoading: false
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
  const ModernInvoiceCard = ({ invoice, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, handleMarkAsPaid, handleDeleteInvoice, getStatusIcon, getStatusColor, getDueDateStatus, formatPaymentTerms, formatLateFees, formatReminders, calculateDueCharges, loadingActions }: {
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
    calculateDueCharges: (invoice: Invoice) => { hasLateFees: boolean; lateFeeAmount: number; totalPayable: number; overdueDays: number };
    loadingActions: { [key: string]: boolean };
  }) => {
    const dueDateStatus = getDueDateStatus(invoice.dueDate, invoice.status, invoice.paymentTerms, (invoice as any).updatedAt);
    const dueCharges = calculateDueCharges(invoice);
    
    return (
      <div className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
        {/* Mobile Layout */}
        <div className="block sm:hidden p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
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
                  className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer"
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
                <button 
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                    className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                    className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
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
                  className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer"
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                    onClick={() => handleSendInvoice(invoice)}
                    disabled={loadingActions[`send-${invoice.id}`]}
                    className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                    className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
    calculateDueCharges: (invoice: Invoice) => { hasLateFees: boolean; lateFeeAmount: number; totalPayable: number; overdueDays: number };
    loadingActions: { [key: string]: boolean };
  }) => {
    const dueDateStatus = getDueDateStatus(invoice.dueDate, invoice.status, invoice.paymentTerms, (invoice as any).updatedAt);
    const dueCharges = calculateDueCharges(invoice);
    
    
    // Show enhanced features for all invoice statuses
    const paymentTerms = formatPaymentTerms(invoice.paymentTerms);
    const lateFees = formatLateFees(invoice.lateFees);
    const reminders = formatReminders(invoice.reminders);
    
    return (
    <div className="rounded-lg border p-4 transition-all duration-200 hover:shadow-md bg-white border-gray-300 hover:shadow-lg">
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
                ${dueCharges.totalPayable.toLocaleString()}
                  </div>
                {dueCharges.hasLateFees ? (
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
              ${dueCharges.totalPayable.toLocaleString()}
                </div>
              {dueCharges.hasLateFees ? (
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
            className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>
          <button 
            onClick={() => handleDownloadPDF(invoice)}
            disabled={loadingActions[`pdf-${invoice.id}`]}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loadingActions[`pdf-${invoice.id}`] ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>PDF</span>
          </button>
          {invoice.status === 'draft' && (
            <button 
              onClick={() => handleSendInvoice(invoice)}
              disabled={loadingActions[`send-${invoice.id}`]}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-300 ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-300 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button 
                onClick={() => handleDeleteInvoice(invoice)}
                disabled={loadingActions[`delete-${invoice.id}`]}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium bg-red-50 text-red-800 hover:bg-red-100 border border-red-300 ${loadingActions[`delete-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
        setIsLoadingStats(false);
        setDataLoaded(true);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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
      
      // Total revenue (only paid invoices) - early return for non-paid
      if (status === 'paid') {
        totalRevenue += total;
        continue;
      }
      
      // Total payable and overdue count (pending/sent invoices only)
      if (status === 'pending' || status === 'sent') {
      const charges = calculateDueCharges(invoice);
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
  }, [invoices, calculateDueCharges, parseDateOnly]);
  
  // Extract individual values for easier access
  const { recentInvoices, totalRevenue, totalPayableAmount, overdueCount, totalLateFees } = dashboardStats;
  
  // Calculate total clients (simple, no need to include in complex calculation)
  const totalClients = clients.length;

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
    // Redirect to auth page with session expired feedback
    window.location.href = '/auth?message=session_expired';
    return null;
  }

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Dashboard Overview */}
            <div>
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: '#1f2937'}}>
                Dashboard Overview
              </h2>
              <p className="mb-6" style={{color: '#374151'}}>
                The fastest way for freelancers & contractors to get paid
              </p>
              
              {/* Welcome message for new users */}
              {user && hasInitiallyLoaded && !isLoadingInvoices && !isLoadingClients && invoices.length === 0 && clients.length === 0 && (
                <div className="rounded-lg p-6 mb-8 bg-white/70 border border-gray-200 backdrop-blur-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 rounded-xl bg-indigo-50">
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
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Create Invoice</span>
                    </button>
                    <button
                      onClick={() => setShowCreateClient(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Client</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Revenue */}
                <button 
                  onClick={handlePaidInvoicesClick}
                  className="group relative overflow-hidden rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/70 border border-gray-200 hover:border-emerald-500 backdrop-blur-sm h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Total Revenue</p>
                        <div className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600 text-left break-words">
                          {isLoadingStats ? (
                            <div className="animate-pulse bg-gray-300 h-6 sm:h-8 w-20 sm:w-24 rounded"></div>
                          ) : (
                            <span className="break-words">{formatMoney(totalRevenue)}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 justify-start leading-tight">
                          <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-medium text-emerald-600 truncate">Paid invoices</span>
                        </div>
                      </div>
                    </div>
                    {/* Pulse Line Chart - Right Side - Desktop Only */}
                    {totalRevenue > 0 && (
                      <div className="hidden lg:flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-emerald-600">+23%</span>
                        <svg className="w-14 h-6" viewBox="0 0 56 24" fill="none">
                          <path
                            d="M2,18 C8,18 10,16 14,14 C18,12 20,10 24,12 C28,14 30,16 34,14 C38,12 40,8 44,6 C48,4 52,4 54,4"
                            stroke="#10b981"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                          <circle cx="54" cy="4" r="2.5" fill="#10b981" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {/* Outstanding Amount */}
                <button 
                  onClick={handlePendingInvoicesClick}
                  className="group relative overflow-hidden rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/70 border border-gray-200 hover:border-amber-500 backdrop-blur-sm h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Total Payable</p>
                        <div>
                          <div className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-orange-500 text-left break-words" style={{ display: 'block' }}>
                            {isLoadingStats ? (
                              <div className="animate-pulse bg-gray-300 h-6 sm:h-8 w-20 sm:w-24 rounded"></div>
                            ) : (
                              <div>{formatMoney(totalPayableAmount)}</div>
                            )}
                          </div>
                          {totalLateFees > 0 && (
                            <div className="text-[10px] sm:text-xs font-medium text-amber-600 text-left mt-0.5" style={{ display: 'block' }}>
                              (+${totalLateFees.toFixed(2)} late fees)
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 justify-start leading-tight">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-medium text-orange-500 truncate">
                            {invoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length} pending
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Pulse Line Chart - Right Side - Desktop Only */}
                    {totalPayableAmount > 0 && (
                      <div className="hidden lg:flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-amber-600">+18%</span>
                        <svg className="w-14 h-6" viewBox="0 0 56 24" fill="none">
                          <path
                            d="M2,12 C6,12 8,10 12,8 C16,6 18,10 22,12 C26,14 28,16 32,14 C36,12 38,14 42,16 C46,18 50,20 54,20"
                            stroke="#f97316"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                          <circle cx="54" cy="20" r="2.5" fill="#f97316" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {/* Overdue Invoices */}
                <button 
                  onClick={handleOverdueInvoicesClick}
                  className="group relative overflow-hidden rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/70 border border-gray-200 hover:border-red-500 backdrop-blur-sm h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Overdue</p>
                        <div className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 text-left">
                          {isLoadingStats ? (
                            <div className="animate-pulse bg-gray-300 h-6 sm:h-8 w-8 sm:w-10 rounded"></div>
                          ) : (
                            overdueCount
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 justify-start leading-tight">
                          <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-medium text-red-600 truncate">Need attention</span>
                        </div>
                      </div>
                    </div>
                    {/* Pulse Line Chart - Right Side - Desktop Only */}
                    {overdueCount > 0 && (
                      <div className="hidden lg:flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-red-500">-8%</span>
                        <svg className="w-14 h-6" viewBox="0 0 56 24" fill="none">
                          <path
                            d="M2,6 C6,6 8,8 12,10 C16,12 18,10 22,12 C26,14 28,16 32,18 C36,20 40,18 44,20 C48,22 52,20 54,20"
                            stroke="#dc2626"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                          <circle cx="54" cy="20" r="2.5" fill="#dc2626" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {/* Total Clients */}
                <button 
                  onClick={handleClientsClick}
                  className="group relative overflow-hidden rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/70 border border-gray-200 hover:border-indigo-500 backdrop-blur-sm h-full"
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0 pr-3 flex flex-col justify-between h-full">
                      <div className="space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-left truncate" style={{color: '#374151'}}>Total Clients</p>
                        <div className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-600 text-left">
                          {isLoadingStats ? (
                            <div className="animate-pulse bg-gray-300 h-6 sm:h-8 w-8 sm:w-10 rounded"></div>
                          ) : (
                            totalClients
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 justify-start leading-tight">
                          <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-medium text-indigo-600 truncate">Active clients</span>
                        </div>
                      </div>
                    </div>
                    {/* Pulse Line Chart - Right Side - Desktop Only */}
                    {totalClients > 0 && (
                      <div className="hidden lg:flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-indigo-600">+15%</span>
                        <svg className="w-14 h-6" viewBox="0 0 56 24" fill="none">
                          <path
                            d="M2,20 C6,20 8,18 12,16 C16,14 18,12 22,10 C26,8 28,10 32,8 C36,6 40,6 44,4 C48,2 52,4 54,2"
                            stroke="#6366f1"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                          <circle cx="54" cy="2" r="2.5" fill="#6366f1" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>


            {/* Quick Actions - Modern Design */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-semibold" style={{color: '#1f2937'}}>
                Quick Actions
              </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* 60-Second Invoice */}
                <button
                  onClick={() => setShowFastInvoice(true)}
                  className="group relative p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:border-green-200 hover:bg-green-50/30 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1 sm:p-2 rounded-lg bg-green-50">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-sm" style={{color: '#1f2937'}}>
                        Quick Invoice
                      </h3>
                      <p className="text-xs" style={{color: '#6b7280'}}>
                        60-second invoicing
                      </p>
                    </div>
                  </div>
                </button>

                {/* Detailed Invoice */}
                <button
                  onClick={() => setShowCreateInvoice(true)}
                  className="group relative p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1 sm:p-2 rounded-lg bg-blue-50">
                      <FilePlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-sm" style={{color: '#1f2937'}}>
                        Detailed Invoice
                      </h3>
                      <p className="text-xs" style={{color: '#6b7280'}}>
                        Full customization
                      </p>
                    </div>
                  </div>
                </button>

                {/* Add Client */}
                <button
                  onClick={() => setShowCreateClient(true)}
                  className="group relative p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/30 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1 sm:p-2 rounded-lg bg-purple-50">
                      <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-sm" style={{color: '#1f2937'}}>
                        Add Client
                      </h3>
                      <p className="text-xs" style={{color: '#6b7280'}}>
                        Manage clients
                      </p>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            {/* Recent Invoices - Modern Design */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-semibold" style={{color: '#1f2937'}}>
                Recent Invoices
              </h2>
                <button
                  onClick={() => router.push('/dashboard/invoices')}
                  className="group flex items-center space-x-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {(isLoadingInvoices || !hasInitiallyLoaded) ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl p-4 bg-white border border-gray-200">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-300 rounded w-32"></div>
                              <div className="h-3 bg-gray-300 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-300 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasInitiallyLoaded && !isLoadingInvoices && invoices.length === 0 ? (
                <div className="rounded-xl p-8 text-center bg-white border border-gray-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gray-100">
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
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Create Invoice</span>
                  </button>
                </div>
              ) : recentInvoices.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {recentInvoices.map((invoice) => (
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
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </main>
                  </div>
                  
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
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
       {showViewInvoice && selectedInvoice && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
           <div className="rounded-xl sm:rounded-2xl p-2 sm:p-4 max-w-6xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar bg-white border-gray-200">
             <div className="flex items-center justify-between mb-3 sm:mb-4">
               <h2 className="text-base sm:text-xl font-bold" style={{color: '#1f2937'}}>Invoice Details</h2>
               <button
                 onClick={() => setShowViewInvoice(false)}
                 className="p-1 sm:p-2 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
               >
                 <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
               </button>
             </div>
             
             {/* Responsive Invoice View */}
             <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
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
               <div className="p-3 sm:p-6 border-b border-gray-200">
                 <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900">Invoice Details</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                   <div>
                     <span className="font-medium text-gray-700">Invoice Number:</span>
                     <p className="text-gray-700">#{selectedInvoice.invoiceNumber || 'N/A'}</p>
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
                   <p className="font-medium text-gray-900">{selectedInvoice.client?.name || 'N/A'}</p>
                   <p className="text-gray-700">{selectedInvoice.client?.email || 'N/A'}</p>
                   {selectedInvoice.client?.phone && <p className="text-gray-700">{selectedInvoice.client.phone}</p>}
                   {selectedInvoice.client?.address && <p className="text-gray-700">{selectedInvoice.client.address}</p>}
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
                       <div className="flex justify-between text-xs sm:text-sm font-bold border-t pt-1 border-gray-200">
                         <span className="text-gray-900">Total:</span>
                         <span className="text-gray-900">${(selectedInvoice.total || 0).toFixed(2)}</span>
                       </div>
                     </div>
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

               {/* Enhanced Features - Only for Detailed Invoices */}
               {selectedInvoice.type === 'detailed' && (selectedInvoice.paymentTerms || selectedInvoice.lateFees || selectedInvoice.reminders) && (
                 <div className="p-3 sm:p-6 border-t border-gray-200">
                   <h3 className="text-sm sm:text-base font-semibold mb-3 text-gray-900">Enhanced Features</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                     {selectedInvoice.paymentTerms && (
                       <div className="p-3 rounded-lg bg-gray-50">
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
                       <div className="p-3 rounded-lg bg-gray-50">
                         <div className="flex items-center space-x-2 mb-2">
                           <DollarSign className="h-4 w-4 text-orange-500" />
                           <span className="font-medium text-gray-700">Late Fees</span>
                         </div>
                         <p className="text-gray-700">
                           {selectedInvoice.lateFees.enabled 
                             ? `${selectedInvoice.lateFees.type === 'fixed' ? '$' : ''}${selectedInvoice.lateFees.amount}${selectedInvoice.lateFees.type === 'percentage' ? '%' : ''} after ${selectedInvoice.lateFees.gracePeriod} days`
                             : 'Not configured'
                           }
                         </p>
                       </div>
                     )}
                     {selectedInvoice.reminders && (
                       <div className="p-3 rounded-lg bg-gray-50">
                         <div className="flex items-center space-x-2 mb-2">
                           <Bell className="h-4 w-4 text-green-500" />
                           <span className="font-medium text-gray-700">Auto Reminders</span>
                         </div>
                         <p className="text-gray-700">
                           {selectedInvoice.reminders.enabled 
                             ? (selectedInvoice.reminders.useSystemDefaults 
                               ? 'Smart System' 
                               : (() => {
                                  const reminders = selectedInvoice.reminders as any;
                                  const rules = reminders.rules || reminders.customRules || [];
                                  const enabledRules = rules.filter((rule: any) => rule.enabled);
                                  return `${enabledRules.length} Custom Rule${enabledRules.length !== 1 ? 's' : ''}`;
                                })())
                             : 'Not configured'
                           }
                         </p>
                       </div>
                     )}
                   </div>
                 </div>
               )}
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
         confirmText={confirmationModal.type === 'success' ? 'Mark as Paid' : 'Delete Invoice'}
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
         isLoading={sendInvoiceModal.isLoading}
       />

       {/* Toast Container */}
       <ToastContainer
         toasts={toasts}
         onRemove={removeToast}
       />
     </div>
   );
 }
