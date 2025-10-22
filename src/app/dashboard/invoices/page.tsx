'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, FileText, Clock, CheckCircle, AlertCircle, AlertTriangle, FilePlus, Sparkles,
  Eye, Download, Send, Edit, X, Bell, CreditCard, DollarSign, Calendar, Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import FastInvoiceModal from '@/components/FastInvoiceModal';
import QuickInvoiceModal from '@/components/QuickInvoiceModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ClientModal from '@/components/ClientModal';

// Types
import { Client, Invoice } from '@/types';

function InvoicesContent() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
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
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {},
    isLoading: false
  });
  
  // Business settings state
  const [settings, setSettings] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    website: '',
    address: '',
    logo: '',
    paypalEmail: '',
    cashappId: '',
    venmoId: '',
    googlePayUpi: '',
    applePayId: '',
    bankAccount: '',
    bankIfscSwift: '',
    bankIban: '',
    stripeAccount: '',
    paymentNotes: ''
  });



  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the detailed invoice modal by default
    setShowCreateInvoice(true);
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

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid':
        return 'dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'sent':
        return 'dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
      case 'overdue':
        return 'dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30';
      case 'draft':
        return 'dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30';
      default:
        return 'dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30';
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

  const getStatusStyleDark = useCallback((status: string) => {
    switch (status) {
      case 'paid':
        return { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.3)' };
      case 'sent':
        return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' };
      case 'overdue':
        return { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' };
      case 'draft':
        return { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#d1d5db', borderColor: 'rgba(107, 114, 128, 0.3)' };
      default:
        return { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#d1d5db', borderColor: 'rgba(107, 114, 128, 0.3)' };
    }
  }, []);

  const getTypeStyleDark = useCallback((type: string) => {
    switch (type) {
      case 'fast':
        return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' };
      case 'detailed':
        return { backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' };
      default:
        return { backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' };
    }
  }, []);

  // Helper function to calculate due date status
  const getDueDateStatus = useCallback((dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', days: Math.abs(diffDays), color: 'text-red-600 dark:text-red-400' };
    } else if (diffDays === 0) {
      return { status: 'due-today', days: 0, color: 'text-orange-500 dark:text-orange-400' };
    } else if (diffDays <= 3) {
      return { status: 'due-soon', days: diffDays, color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { status: 'upcoming', days: diffDays, color: 'text-gray-600 dark:text-gray-400' };
    }
  }, []);

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
  const formatReminders = useCallback((reminders?: { enabled: boolean; useSystemDefaults: boolean; rules: Array<{ enabled: boolean }> }) => {
    if (!reminders?.enabled) return null;
    if (reminders.useSystemDefaults) return 'Smart System';
    const activeRules = reminders.rules.filter(rule => rule.enabled).length;
    return `${activeRules} Custom Rule${activeRules !== 1 ? 's' : ''}`;
  }, []);

  // Helper function to calculate due charges and total payable
  const calculateDueCharges = useCallback((invoice: Invoice) => {
    // Only calculate late fees for sent invoices that are actually overdue
    if (invoice.status !== 'pending') {
      return {
        hasLateFees: false,
        lateFeeAmount: 0,
        totalPayable: invoice.total,
        overdueDays: 0
      };
    }

    const today = new Date();
    const due = new Date(invoice.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
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
  }, []);

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
      console.log('PDF Download - Current Settings:', settings);
      
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
      console.log('PDF Download - Business Settings:', businessSettings);

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

  const handleSendInvoice = useCallback(async (invoice: Invoice) => {
    const actionKey = `send-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const headers = await getAuthHeaders();
      
      // Debug: Log the invoice data being sent
      console.log('Send Invoice - Invoice data:', {
        id: invoice.id,
        clientEmail: invoice.clientEmail,
        clientName: invoice.clientName,
        client: invoice.client
      });
      
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
        // Update local state instead of refetching
        setInvoices(prevInvoices => 
          prevInvoices.map(inv => 
            inv.id === invoice.id 
              ? { ...inv, status: 'pending' as const }
              : inv
          )
        );
        showSuccess('Invoice Sent', `Invoice ${invoice.invoiceNumber} has been sent successfully.`);
      } else {
        showError('Send Failed', 'Failed to send invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      showError('Send Failed', 'Failed to send invoice. Please try again.');
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [getAuthHeaders, showSuccess, showError]);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.type === 'fast') {
      setShowFastInvoice(true);
    } else {
      setShowCreateInvoice(true);
    }
  }, []);

  const handleMarkAsPaid = useCallback(async (invoice: Invoice) => {
    const actionKey = `paid-${invoice.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
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
        // Update local state instead of refetching
        setInvoices(prevInvoices => 
          prevInvoices.map(inv => 
            inv.id === invoice.id 
              ? { ...inv, status: 'paid' as const }
              : inv
          )
        );
        showSuccess('Invoice Updated', `Invoice ${invoice.invoiceNumber} has been marked as paid.`);
      } else {
        showError('Update Failed', 'Failed to mark invoice as paid. Please try again.');
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      showError('Update Failed', 'Failed to mark invoice as paid. Please try again.');
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
        setInvoices(prevInvoices => 
          prevInvoices.filter(inv => inv.id !== invoice.id)
        );
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

  // Memoized Invoice Card Component
  const InvoiceCard = useCallback(({ invoice, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, handleMarkAsPaid, handleDeleteInvoice, getStatusIcon, getStatusColor, getDueDateStatus, formatPaymentTerms, formatLateFees, formatReminders, calculateDueCharges, loadingActions }: {
    invoice: Invoice;
    handleViewInvoice: (invoice: Invoice) => void;
    handleDownloadPDF: (invoice: Invoice) => void;
    handleSendInvoice: (invoice: Invoice) => void;
    handleEditInvoice: (invoice: Invoice) => void;
    handleMarkAsPaid: (invoice: Invoice) => void;
    handleDeleteInvoice: (invoice: Invoice) => void;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
    getDueDateStatus: (dueDate: string) => { status: string; days: number; color: string };
    formatPaymentTerms: (paymentTerms?: { enabled: boolean; terms: string }) => string | null;
    formatLateFees: (lateFees?: { enabled: boolean; type: 'fixed' | 'percentage'; amount: number; gracePeriod: number }) => string | null;
    formatReminders: (reminders?: { enabled: boolean; useSystemDefaults: boolean; rules: Array<{ enabled: boolean }> }) => string | null;
    calculateDueCharges: (invoice: Invoice) => { hasLateFees: boolean; lateFeeAmount: number; totalPayable: number; overdueDays: number };
    loadingActions: { [key: string]: boolean };
  }) => {
    const dueDateStatus = getDueDateStatus(invoice.dueDate);
    const dueCharges = calculateDueCharges(invoice);
    
    // Show enhanced features for all invoice statuses
    const paymentTerms = formatPaymentTerms(invoice.paymentTerms);
    const lateFees = formatLateFees(invoice.lateFees);
    const reminders = formatReminders(invoice.reminders);
    
    return (
      <div className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
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
                    {invoice.client.name}
              </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold text-base ${
                  invoice.status === 'paid' ? ('text-green-600') :
                  dueDateStatus.status === 'overdue' ? ('text-red-600') :
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
              }`}>
                ${dueCharges.totalPayable.toLocaleString()}
                  </div>
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {new Date(invoice.createdAt).toLocaleDateString()}
              </div>
            </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid' ? ('text-green-600') :
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
                }`}>
                {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
              </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${'bg-gray-100 text-gray-600'}`}>
                  {(invoice.type || 'detailed') === 'fast' ? 'Fast' : 'Detailed'}
                  </span>
                {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${'text-red-600'}`}>
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
                )}
                </div>
              
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handleViewInvoice(invoice)}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'}`}
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    onClick={() => handleEditInvoice(invoice)}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'}`}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {invoice.status === 'draft' && (
                  <button 
                    onClick={() => handleDeleteInvoice(invoice)}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'}`}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </button>
                )}
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
                    {invoice.client.name}
              </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold text-base ${
                  invoice.status === 'paid' ? ('text-green-600') :
                  dueDateStatus.status === 'overdue' ? ('text-red-600') :
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
              }`}>
                ${dueCharges.totalPayable.toLocaleString()}
                  </div>
                <div className="text-xs" style={{color: '#6b7280'}}>
                  {new Date(invoice.createdAt).toLocaleDateString()}
              </div>
            </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                  invoice.status === 'paid' ? ('text-green-600') :
                  invoice.status === 'pending' || invoice.status === 'sent' ? ('text-orange-500') :
                  invoice.status === 'draft' ? ('text-gray-600') :
                  ('text-red-600')
                }`}>
                {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
              </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${'bg-gray-100 text-gray-600'}`}>
                  {(invoice.type || 'detailed') === 'fast' ? 'Fast' : 'Detailed'}
                  </span>
                {dueDateStatus.status === 'overdue' && invoice.status !== 'paid' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${'text-red-600'}`}>
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dueDateStatus.days}d overdue</span>
                  </span>
                )}
                </div>
              
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handleViewInvoice(invoice)}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'}`}
                  title="View"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => handleDownloadPDF(invoice)}
                  disabled={loadingActions[`pdf-${invoice.id}`]}
                  className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'} ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    onClick={() => handleEditInvoice(invoice)}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'}`}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {invoice.status === 'draft' && (
                  <button 
                    onClick={() => handleDeleteInvoice(invoice)}
                    className={`p-1.5 rounded-md transition-colors ${'hover:bg-gray-100'}`}
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
  }, []);


  // Load settings function
  const loadSettings = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/settings', {
        headers,
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [getAuthHeaders]);

  // Load data on mount - prevent infinite loop with hasLoadedData flag
  useEffect(() => {
    if (user && !loading && !hasLoadedData) {
      setHasLoadedData(true); // Set flag immediately to prevent re-runs
      
      const loadData = async () => {
        try {
          // Call getAuthHeaders directly in each fetch to avoid dependency issues
          const headers = await getAuthHeaders();
          
          // Load data progressively without blocking the UI
          // Fetch invoices
          fetch('/api/invoices', { headers, cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
              setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
              setIsLoadingInvoices(false);
            })
            .catch(err => {
              console.error('Error fetching invoices:', err);
              setInvoices([]);
              setIsLoadingInvoices(false);
            });
          
          // Fetch clients
          fetch('/api/clients', { headers, cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
              setClients(data.clients || []);
            })
            .catch(err => {
              console.error('Error fetching clients:', err);
            });
          
          // Load settings
          loadSettings();
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }
  }, [user, loading, hasLoadedData, getAuthHeaders, loadSettings]); // Include hasLoadedData to prevent re-runs

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

  if (!user) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access the invoices</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          isDarkMode={false}
          onToggleDarkMode={() => {}}
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Invoices Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                  Invoices
                </h2>
                  {searchParams.get('status') && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                        searchParams.get('status') === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        searchParams.get('status') === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        searchParams.get('status') === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {searchParams.get('status') === 'paid' ? 'Paid Invoices' :
                         searchParams.get('status') === 'pending' ? 'Pending Invoices' :
                         searchParams.get('status') === 'overdue' ? 'Overdue Invoices' :
                         'Filtered'}
                      </span>
                      <button
                        onClick={() => window.history.replaceState({}, '', '/dashboard/invoices')}
                        className="text-xs sm:text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 underline whitespace-nowrap"
                      >
                        Clear Filter
                      </button>
                    </div>
                  )}
                </div>
                {user ? (
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Invoice</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <span>Sign In</span>
                  </button>
                )}
              </div>
                
              {/* Invoice List */}
              {isLoadingInvoices ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg p-6 bg-white/70 border border-gray-200 backdrop-blur-sm">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                            <div>
                              <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-300 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices
                    .filter((invoice) => {
                      const statusFilter = searchParams.get('status');
                      if (!statusFilter) return true;
                      
                      if (statusFilter === 'paid') {
                        return invoice.status === 'paid';
                      } else if (statusFilter === 'pending') {
                        return invoice.status === 'pending' || invoice.status === 'sent';
                      } else if (statusFilter === 'overdue') {
                        // Only show invoices that are pending/sent AND past due date
                        if (invoice.status !== 'pending' && invoice.status !== 'sent') return false;
                        const today = new Date();
                        const dueDate = new Date(invoice.dueDate);
                        // Set time to start of day for accurate comparison
                        today.setHours(0, 0, 0, 0);
                        dueDate.setHours(0, 0, 0, 0);
                        return dueDate < today;
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      const statusFilter = searchParams.get('status');
                      if (statusFilter === 'paid' || statusFilter === 'pending') {
                        // Sort by amount (highest first)
                        return b.total - a.total;
                      }
                      // Default sort by date (newest first)
                      return new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime();
                    })
                    .map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      handleViewInvoice={handleViewInvoice}
                      handleDownloadPDF={handleDownloadPDF}
                      handleSendInvoice={handleSendInvoice}
                      handleEditInvoice={handleEditInvoice}
                      handleMarkAsPaid={handleMarkAsPaid}
                      handleDeleteInvoice={handleDeleteInvoice}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      getDueDateStatus={getDueDateStatus}
                      formatPaymentTerms={formatPaymentTerms}
                      formatLateFees={formatLateFees}
                      formatReminders={formatReminders}
                      calculateDueCharges={calculateDueCharges}
                      loadingActions={loadingActions}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg p-12 text-center bg-white/70 border border-gray-200 backdrop-blur-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl mb-6 bg-gray-100">
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
                      onClick={() => setShowFastInvoice(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Quick Invoice</span>
                    </button>
                    <button
                      onClick={() => setShowCreateInvoice(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
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
          onClose={() => setShowFastInvoice(false)}
          user={user}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          onSuccess={() => {
            setShowFastInvoice(false);
            // Refresh data after successful invoice creation
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await fetch('/api/invoices', { headers, cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => setInvoices(Array.isArray(data.invoices) ? data.invoices : []))
                    .catch(err => console.error('Error fetching invoices:', err));
                } catch (error) {
                  console.error('Error refreshing data:', error);
                }
              };
              loadData();
            }
          }}
        />
      )}

      {/* Detailed Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          onSuccess={() => {
            setShowCreateInvoice(false);
            // Refresh data after successful invoice creation
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await fetch('/api/invoices', { headers, cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => setInvoices(Array.isArray(data.invoices) ? data.invoices : []))
                    .catch(err => console.error('Error fetching invoices:', err));
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
                  await fetch('/api/clients', { headers, cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => setClients(data))
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
      {showViewInvoice && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="rounded-xl sm:rounded-2xl p-2 sm:p-4 max-w-6xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar bg-white border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-xl font-bold" style={{color: '#1f2937'}}>Invoice Details</h2>
              <button
                onClick={() => setShowViewInvoice(false)}
                className="p-1 sm:p-2 rounded-lg transition-colors hover:bg-gray-100"
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
                      {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : 'N/A'}
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
                  <p className={`font-medium ${'text-gray-900'}`}>{selectedInvoice.client?.name || 'N/A'}</p>
                  <p className={'text-gray-600'}>{selectedInvoice.client?.email || 'N/A'}</p>
                  {selectedInvoice.client?.phone && <p className={'text-gray-600'}>{selectedInvoice.client.phone}</p>}
                  {selectedInvoice.client?.address && <p className={'text-gray-600'}>{selectedInvoice.client.address}</p>}
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
                          <span className={`font-medium ${'text-gray-600'}`}>Auto Reminders</span>
                        </div>
                        <p className={'text-gray-600'}>
                          {selectedInvoice.reminders.enabled 
                            ? (selectedInvoice.reminders.useSystemDefaults 
                              ? 'Smart System' 
                              : `${selectedInvoice.reminders.rules.filter(rule => rule.enabled).length} Custom Rule${selectedInvoice.reminders.rules.filter(rule => rule.enabled).length !== 1 ? 's' : ''}`)
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
        confirmText="Delete Invoice"
        cancelText="Cancel"
      />

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}
