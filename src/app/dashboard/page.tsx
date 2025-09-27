'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, Users, TrendingUp, 
  Clock, CheckCircle, AlertCircle, AlertTriangle, UserPlus, FilePlus, Sparkles, Receipt, Timer,
  Eye, Download, Send, Edit, X, Bell, CreditCard, DollarSign, Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import FastInvoiceModal from '@/components/FastInvoiceModal';
import QuickInvoiceModal from '@/components/QuickInvoiceModal';
import ClientModal from '@/components/ClientModal';
import { Client, Invoice } from '@/types';

interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  overdueCount: number;
  totalClients: number;
}

export default function DashboardOverview() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    outstandingAmount: 0,
    overdueCount: 0,
    totalClients: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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

  // Dark mode toggle
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  }, []);

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
        return { backgroundColor: '#d1fae5', color: '#047857', borderColor: '#6ee7b7' };
      case 'sent':
        return { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' };
      case 'overdue':
        return { backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' };
      case 'draft':
        return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
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
      return { status: 'due-today', days: 0, color: 'text-orange-600 dark:text-orange-400' };
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
    if (invoice.status !== 'sent') {
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

      const { downloadPDF } = await import('@/lib/pdf-generator');
      await downloadPDF(invoice, businessSettings);
      
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
      const response = await fetch(`/api/invoices/send`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (response.ok) {
        // Refresh invoices data
        const invoicesResponse = await fetch('/api/invoices', { headers, cache: 'no-store' });
        const invoicesData = await invoicesResponse.json();
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
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
        // Refresh invoices data
        const invoicesResponse = await fetch('/api/invoices', { headers, cache: 'no-store' });
        const invoicesData = await invoicesResponse.json();
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
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

  // Memoized Invoice Card Component
  const InvoiceCard = useCallback(({ invoice, isDarkMode, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, handleMarkAsPaid, getStatusIcon, getStatusColor, getDueDateStatus, formatPaymentTerms, formatLateFees, formatReminders, calculateDueCharges, loadingActions }: {
    invoice: Invoice;
    isDarkMode: boolean;
    handleViewInvoice: (invoice: Invoice) => void;
    handleDownloadPDF: (invoice: Invoice) => void;
    handleSendInvoice: (invoice: Invoice) => void;
    handleEditInvoice: (invoice: Invoice) => void;
    handleMarkAsPaid: (invoice: Invoice) => void;
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
    <div className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${isDarkMode ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/40' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
      <div className="space-y-6">
        {/* Invoice Info Row */}
        <div className="space-y-4 sm:space-y-0">
          {/* Mobile Layout */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="font-heading text-sm font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  {invoice.invoiceNumber}
                </div>
                <span 
                  className={`px-2 py-1 text-xs font-medium rounded-full border`}
                  style={isDarkMode ? getTypeStyleDark(invoice.type || 'detailed') : ((invoice.type || 'detailed') === 'fast' 
                    ? { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }
                    : { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' }
                  )}
                >
                  {invoice.type === 'fast' ? 'Fast' : 'Detailed'}
                </span>
              </div>
              <div className={`font-heading text-lg font-bold ${
                invoice.status === 'paid' ? 'text-green-600 dark:text-green-400' :
                invoice.status === 'sent' ? 'text-amber-600 dark:text-amber-400' :
                invoice.status === 'draft' ? 'text-gray-500 dark:text-gray-400' :
                dueDateStatus.status === 'overdue' ? 'text-red-600 dark:text-red-400' :
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                ${dueCharges.totalPayable.toLocaleString()}
                {dueCharges.hasLateFees && (
                  <div className="text-xs font-normal text-red-500">
                    (includes ${dueCharges.lateFeeAmount.toFixed(2)} late fee)
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              {invoice.createdAt}
            </div>
            <div className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              {invoice.client.name}
            </div>
            {invoice.client.company && (
              <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                {invoice.client.company}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span 
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border`}
                style={isDarkMode ? getStatusStyleDark(invoice.status) : getStatusStyle(invoice.status)}
              >
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </span>
              {invoice.status === 'sent' && (
                <div className="text-sm flex items-center space-x-1">
                  <Calendar className="h-3 w-3" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}} />
                  <span className={dueDateStatus.color}>
                    {dueDateStatus.status === 'overdue' ? `${dueDateStatus.days} days overdue` :
                     dueDateStatus.status === 'due-today' ? 'Due today' :
                     dueDateStatus.status === 'due-soon' ? `Due in ${dueDateStatus.days} days` :
                     `Due in ${dueDateStatus.days} days`}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="font-heading text-sm font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  {invoice.invoiceNumber}
                </div>
                <span 
                  className={`px-2 py-1 text-xs font-medium rounded-full border`}
                  style={isDarkMode ? getTypeStyleDark(invoice.type || 'detailed') : ((invoice.type || 'detailed') === 'fast' 
                    ? { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' }
                    : { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' }
                  )}
                >
                  {invoice.type === 'fast' ? 'Fast' : 'Detailed'}
                </span>
              </div>
              <div className="text-xs" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                {invoice.createdAt}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                {invoice.client.name}
              </div>
              <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                {invoice.client.company}
              </div>
            </div>
            <div className={`font-heading text-lg font-bold ${
              invoice.status === 'paid' ? 'text-green-600 dark:text-green-400' :
              invoice.status === 'sent' ? 'text-amber-600 dark:text-amber-400' :
              invoice.status === 'draft' ? 'text-gray-500 dark:text-gray-400' :
              dueDateStatus.status === 'overdue' ? 'text-red-600 dark:text-red-400' :
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              ${dueCharges.totalPayable.toLocaleString()}
              {dueCharges.hasLateFees && (
                <div className="text-xs font-normal text-red-500">
                  (includes ${dueCharges.lateFeeAmount.toFixed(2)} late fee)
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span 
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border`}
                style={isDarkMode ? getStatusStyleDark(invoice.status) : getStatusStyle(invoice.status)}
              >
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </span>
              {invoice.status === 'sent' && (
                <div className="text-sm hidden lg:block flex items-center space-x-1">
                  <Calendar className="h-3 w-3" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}} />
                  <span className={dueDateStatus.color}>
                    {dueDateStatus.status === 'overdue' ? `${dueDateStatus.days} days overdue` :
                     dueDateStatus.status === 'due-today' ? 'Due today' :
                     dueDateStatus.status === 'due-soon' ? `Due in ${dueDateStatus.days} days` :
                     `Due in ${dueDateStatus.days} days`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
        
        {/* Enhanced Features Section */}
        {(paymentTerms || lateFees || reminders) && (
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {paymentTerms && (
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-3 w-3 text-blue-500" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <span className="font-medium">Terms:</span> {paymentTerms}
                  </span>
                </div>
              )}
              {lateFees && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-3 w-3 text-orange-500" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <span className="font-medium">Late Fee:</span> {lateFees}
                  </span>
                </div>
              )}
              {reminders && (
                <div className="flex items-center space-x-2">
                  <Bell className="h-3 w-3 text-green-500" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <span className="font-medium">Reminders:</span> {reminders}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleViewInvoice(invoice)}
            className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </button>
          <button 
            onClick={() => handleDownloadPDF(invoice)}
            disabled={loadingActions[`pdf-${invoice.id}`]}
            className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} ${loadingActions[`pdf-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loadingActions[`pdf-${invoice.id}`] ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span>PDF</span>
          </button>
          {invoice.status === 'draft' && (
            <button 
              onClick={() => handleSendInvoice(invoice)}
              disabled={loadingActions[`send-${invoice.id}`]}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'} ${loadingActions[`send-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingActions[`send-${invoice.id}`] ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              ) : (
                <Send className="h-3 w-3" />
              )}
              <span>Send</span>
            </button>
          )}
          {invoice.status !== 'paid' && (
            <button 
              onClick={() => handleMarkAsPaid(invoice)}
              disabled={loadingActions[`paid-${invoice.id}`]}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} ${loadingActions[`paid-${invoice.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingActions[`paid-${invoice.id}`] ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              <span>Mark as Paid</span>
            </button>
          )}
          {invoice.status === 'draft' ? (
            <button 
              onClick={() => handleEditInvoice(invoice)}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </button>
          ) : (
            <div 
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-gray-600/20 text-gray-500' : 'bg-gray-50 text-gray-400'} cursor-not-allowed`}
              title="Cannot edit sent invoices - create a new invoice for changes"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  }, []);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
          // Fetch dashboard stats
          fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
              setDashboardStats(data);
              setIsLoadingStats(false);
            })
            .catch(err => {
              console.error('Error fetching dashboard stats:', err);
              setIsLoadingStats(false);
            });
          
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

  // Memoize calculations
  const recentInvoices = useMemo(() => Array.isArray(invoices) ? invoices.slice(0, 5) : [], [invoices]);
  const totalRevenue = useMemo(() => dashboardStats.totalRevenue || 0, [dashboardStats.totalRevenue]);
  const overdueCount = useMemo(() => dashboardStats.overdueCount || 0, [dashboardStats.overdueCount]);
  const totalClients = useMemo(() => dashboardStats.totalClients || 0, [dashboardStats.totalClients]);
  
  // Calculate total payable amount including late fees
  const totalPayableAmount = useMemo(() => {
    return invoices.reduce((total, invoice) => {
      const charges = calculateDueCharges(invoice);
      return total + charges.totalPayable;
    }, 0);
  }, [invoices, calculateDueCharges]);
  
  // Calculate total late fees
  const totalLateFees = useMemo(() => {
    return invoices.reduce((total, invoice) => {
      const charges = calculateDueCharges(invoice);
      return total + charges.lateFeeAmount;
    }, 0);
  }, [invoices, calculateDueCharges]);

  // Only show loading spinner if user is not authenticated yet
  if (loading && !user) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access the dashboard</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex h-screen">
        <ModernSidebar 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Dashboard Overview */}
            <div>
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Dashboard Overview
              </h2>
              <p className="mb-6" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                The fastest way for freelancers & contractors to get paid
              </p>
              
              {/* Welcome message for new users */}
              {user && invoices.length === 0 && clients.length === 0 && (
                <div className={`rounded-lg p-6 mb-8 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                      <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        Ready to get started?
                      </h3>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        Let&apos;s create your first invoice
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-6 leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    InvoiceFlow makes it incredibly easy to create professional invoices and get paid faster. 
                    Start by adding a client or create your first invoice in under 60 seconds.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowFastInvoice(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Create Invoice</span>
                    </button>
                    <button
                      onClick={() => setShowCreateClient(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Client</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Total Revenue</p>
                      <p className="font-heading text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-24 rounded"></div>
                        ) : (
                          `$${totalRevenue.toLocaleString()}`
                        )}
                      </p>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Paid invoices</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                      <Receipt className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Outstanding Amount */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Total Payable</p>
                      <p className="font-heading text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-24 rounded"></div>
                        ) : (
                          `$${totalPayableAmount.toLocaleString()}`
                        )}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {invoices.filter(inv => inv.status === 'sent').length} pending
                        </span>
                        {totalLateFees > 0 && (
                          <span className="text-xs text-red-500 ml-2">
                            (+${totalLateFees.toFixed(2)} late fees)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                      <Timer className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Overdue Invoices */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Overdue</p>
                      <p className="font-heading text-3xl font-bold text-red-600 dark:text-red-400">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-8 rounded"></div>
                        ) : (
                          overdueCount
                        )}
                      </p>
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Need attention</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-500/20' : 'bg-red-50'}`}>
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Total Clients */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Total Clients</p>
                      <p className="font-heading text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-8 rounded"></div>
                        ) : (
                          totalClients
                        )}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Active clients</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                      <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 60-Second Invoice */}
                <button
                  onClick={() => setShowFastInvoice(true)}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:border-green-500 hover:bg-green-500/10' : 'bg-white/70 border-gray-300 hover:border-green-500 hover:bg-green-50'} backdrop-blur-sm cursor-pointer`}
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-green-500/30 group-hover:bg-green-500/50' : 'bg-green-100 group-hover:bg-green-200'}`}>
                      <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg transition-colors" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        60-Second Invoice
                      </h3>
                      <p className="text-sm transition-colors" style={{color: isDarkMode ? '#d1d5db' : '#6b7280'}}>
                        Fast & simple invoicing
                      </p>
                    </div>
                  </div>
                </button>

                {/* Detailed Invoice */}
                <button
                  onClick={() => setShowCreateInvoice(true)}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:border-blue-500 hover:bg-blue-500/10' : 'bg-white/70 border-gray-300 hover:border-blue-500 hover:bg-blue-50'} backdrop-blur-sm cursor-pointer`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-blue-500/30 group-hover:bg-blue-500/50' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
                      <FilePlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg transition-colors" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        Detailed Invoice
                      </h3>
                      <p className="text-sm transition-colors" style={{color: isDarkMode ? '#d1d5db' : '#6b7280'}}>
                        Multiple items & customization
                      </p>
                    </div>
                  </div>
                </button>

                {/* Add Client */}
                <button
                  onClick={() => setShowCreateClient(true)}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:border-purple-500 hover:bg-purple-500/10' : 'bg-white/70 border-gray-300 hover:border-purple-500 hover:bg-purple-50'} backdrop-blur-sm cursor-pointer`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-purple-500/30 group-hover:bg-purple-500/50' : 'bg-purple-100 group-hover:bg-purple-200'}`}>
                      <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg transition-colors" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        Add Client
                      </h3>
                      <p className="text-sm transition-colors" style={{color: isDarkMode ? '#d1d5db' : '#6b7280'}}>
                        Manage your client list
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="mt-8">
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Recent Invoices
              </h2>
              {isLoadingInvoices ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                            <div>
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length > 0 ? (
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      isDarkMode={isDarkMode}
                      handleViewInvoice={handleViewInvoice}
                      handleDownloadPDF={handleDownloadPDF}
                      handleSendInvoice={handleSendInvoice}
                      handleEditInvoice={handleEditInvoice}
                      handleMarkAsPaid={handleMarkAsPaid}
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
                <div className={`p-8 rounded-lg border-2 border-dashed text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <FileText className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    No invoices yet
                  </h3>
                  <p className="text-sm mb-6 max-w-sm mx-auto" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Your recent invoices will appear here. Create your first invoice to start tracking your payments.
                  </p>
                  
                  <button
                    onClick={() => setShowFastInvoice(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mx-auto"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Create Invoice</span>
                  </button>
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
          isDarkMode={isDarkMode}
          clients={clients}
          onSuccess={() => {
            setShowFastInvoice(false);
            // Refresh data after successful invoice creation
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await Promise.all([
                    fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .then(data => setDashboardStats(data))
                      .catch(err => console.error('Error fetching dashboard stats:', err)),
                    fetch('/api/invoices', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .then(data => setInvoices(Array.isArray(data.invoices) ? data.invoices : []))
                      .catch(err => console.error('Error fetching invoices:', err))
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

      {/* Detailed Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          getAuthHeaders={getAuthHeaders}
          isDarkMode={isDarkMode}
          clients={clients}
          onSuccess={() => {
            setShowCreateInvoice(false);
            // Refresh data after successful invoice creation
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  await Promise.all([
                    fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .then(data => setDashboardStats(data))
                      .catch(err => console.error('Error fetching dashboard stats:', err)),
                    fetch('/api/invoices', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .then(data => setInvoices(Array.isArray(data.invoices) ? data.invoices : []))
                      .catch(err => console.error('Error fetching invoices:', err))
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
          isDarkMode={isDarkMode}
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
                      .then(data => setDashboardStats(data))
                      .catch(err => console.error('Error fetching dashboard stats:', err)),
                    fetch('/api/clients', { headers, cache: 'no-store' })
                      .then(res => res.json())
                      .then(data => setClients(data))
                      .catch(err => console.error('Error fetching clients:', err))
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
           <div className={`rounded-xl sm:rounded-2xl p-2 sm:p-4 max-w-6xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center justify-between mb-3 sm:mb-4">
               <h2 className="text-base sm:text-xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Invoice Details</h2>
               <button
                 onClick={() => setShowViewInvoice(false)}
                 className={`p-1 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
               >
                 <X className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
               </button>
             </div>
             
             {/* Responsive Invoice View */}
             <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
               {/* Header */}
               <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                 <div className="w-full sm:w-auto mb-3 sm:mb-0">
                   <h2 className={`text-lg sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     {settings.businessName || 'Your Business Name'}
                   </h2>
                   <div className={`text-xs sm:text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     {settings.address && <p>{settings.address}</p>}
                     {settings.businessEmail && <p>{settings.businessEmail}</p>}
                     {settings.businessPhone && <p>{settings.businessPhone}</p>}
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
        <div 
          className={`px-3 py-1 text-xs font-medium rounded-full border`}
          style={isDarkMode ? getTypeStyleDark(selectedInvoice.type || 'detailed') : ((selectedInvoice.type || 'detailed') === 'fast' 
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
               <div className={`p-3 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                 <h3 className={`text-sm sm:text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Invoice Details</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                   <div>
                     <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Invoice Number:</span>
                     <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>#{selectedInvoice.invoiceNumber || 'N/A'}</p>
                   </div>
                   <div>
                     <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date:</span>
                     <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                       {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : 'N/A'}
                     </p>
                   </div>
                   <div>
                     <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Due Date:</span>
                     <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                       {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Bill To */}
               <div className={`p-3 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                 <h3 className={`text-sm sm:text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bill To</h3>
                 <div className="text-xs sm:text-sm">
                   <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedInvoice.client?.name || 'N/A'}</p>
                   <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedInvoice.client?.email || 'N/A'}</p>
                   {selectedInvoice.client?.phone && <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedInvoice.client.phone}</p>}
                   {selectedInvoice.client?.address && <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedInvoice.client.address}</p>}
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
                   <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                     {selectedInvoice.items?.map((item, index) => (
                       <tr key={item.id || index} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {item.description || 'Service'}
                         </td>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1</td>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${(parseFloat(item.amount?.toString() || '0') || 0).toFixed(2)}
                         </td>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${(parseFloat(item.amount?.toString() || '0') || 0).toFixed(2)}
                         </td>
                       </tr>
                     )) || (
                       <tr>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Service</td>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1</td>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$0.00</td>
                         <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$0.00</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Totals */}
               <div className="p-3 sm:p-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                   <div className="w-full sm:w-auto">
                     <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Thank you for your business!</p>
                   </div>
                   <div className="w-full sm:w-64">
                     <div className="space-y-1">
                       <div className="flex justify-between text-xs sm:text-sm">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xs sm:text-sm">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount:</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${(selectedInvoice.discount || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xs sm:text-sm">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax ({(selectedInvoice.taxRate || 0) * 100}%):</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
                       </div>
                       <div className={`flex justify-between text-xs sm:text-sm font-bold border-t pt-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total:</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${(selectedInvoice.total || 0).toFixed(2)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Notes */}
               {selectedInvoice.notes && (
                 <div className={`p-3 sm:p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                   <h3 className={`text-sm sm:text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notes</h3>
                   <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedInvoice.notes}</p>
                 </div>
               )}

               {/* Enhanced Features - Only for Detailed Invoices */}
               {selectedInvoice.type === 'detailed' && (selectedInvoice.paymentTerms || selectedInvoice.lateFees || selectedInvoice.reminders) && (
                 <div className={`p-3 sm:p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                   <h3 className={`text-sm sm:text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Enhanced Features</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                     {selectedInvoice.paymentTerms && (
                       <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                         <div className="flex items-center space-x-2 mb-2">
                           <CreditCard className="h-4 w-4 text-blue-500" />
                           <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Terms</span>
                         </div>
                         <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                           {selectedInvoice.paymentTerms.enabled ? selectedInvoice.paymentTerms.terms : 'Not configured'}
                         </p>
                       </div>
                     )}
                     {selectedInvoice.lateFees && (
                       <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                         <div className="flex items-center space-x-2 mb-2">
                           <DollarSign className="h-4 w-4 text-orange-500" />
                           <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Late Fees</span>
                         </div>
                         <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                           {selectedInvoice.lateFees.enabled 
                             ? `${selectedInvoice.lateFees.type === 'fixed' ? '$' : ''}${selectedInvoice.lateFees.amount}${selectedInvoice.lateFees.type === 'percentage' ? '%' : ''} after ${selectedInvoice.lateFees.gracePeriod} days`
                             : 'Not configured'
                           }
                         </p>
                       </div>
                     )}
                     {selectedInvoice.reminders && (
                       <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                         <div className="flex items-center space-x-2 mb-2">
                           <Bell className="h-4 w-4 text-green-500" />
                           <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Auto Reminders</span>
                         </div>
                         <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
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
     </div>
   );
 }
