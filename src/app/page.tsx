'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Plus, FileText, Users, Download, Send, TrendingUp, 
  Clock, CheckCircle, AlertCircle, X, Building2, Eye, 
  Trash2, Edit, Mail, CreditCard, Receipt, UserCheck, 
  Timer, AlertTriangle, UserPlus, FilePlus, Sparkles, User, Phone, MapPin, Upload, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import QuickInvoiceModal from '@/components/QuickInvoiceModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ToastContainer from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import FastInvoiceModal from '@/components/FastInvoiceModal';
import LoginModal from '@/components/LoginModal';
import ModernSidebar from '@/components/ModernSidebar';

// Types
interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  notes?: string;
}

export default function InvoiceDashboard() {
  // Authentication
  const { user, loading: authLoading, signIn, signUp, getAuthHeaders } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients' | 'settings'>('dashboard');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    outstandingAmount: 0,
    overdueCount: 0,
    totalClients: 0
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Loading states
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Settings state
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Update logo preview when settings change
  useEffect(() => {
    if (settings.logo && settings.logo !== logoPreview) {
      setLogoPreview(settings.logo);
    }
  }, [settings, logoPreview]);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  // Form states
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    dueDate: '',
    items: [{ id: '1', description: '', rate: 0, amount: 0 }],
    taxRate: 0.1,
    notes: ''
  });

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: ''
  });

  // Data will be fetched from Supabase
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Data fetching functions with useCallback to prevent infinite loops
  const fetchDashboardStats = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/dashboard/stats', {
        headers,
        cache: 'no-store'
      });
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [getAuthHeaders]);

  const fetchInvoices = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/invoices', {
        headers,
        cache: 'no-store'
      });
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }, [getAuthHeaders]);

  const fetchClients = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/clients', {
        headers,
        cache: 'no-store'
      });
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, [getAuthHeaders]);

  // Data persistence functions
  const saveDataToLocalStorage = useCallback(() => {
    const data = {
      clients,
      invoices,
      dashboardStats,
      timestamp: Date.now()
    };
    localStorage.setItem('invoiceFlowData', JSON.stringify(data));
  }, [clients, invoices, dashboardStats]);

  const loadDataFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('invoiceFlowData');
      if (savedData) {
        const data = JSON.parse(savedData);
        // Only load if data is less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          setClients(data.clients || []);
          setInvoices(data.invoices || []);
          setDashboardStats(data.dashboardStats || {
            totalRevenue: 0,
            outstandingAmount: 0,
            overdueCount: 0,
            totalClients: 0
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
    return false;
  }, []);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    if (user && !authLoading) {
      try {
        // Check if we already have settings loaded
        if (settings.businessName || settings.businessEmail) {
          return;
        }

        setIsLoadingSettings(true);
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
      } finally {
        setIsLoadingSettings(false);
      }
    }
  }, [user, authLoading, getAuthHeaders, settings.businessName, settings.businessEmail]);

  // Manual data fetching - no automatic fetching to prevent infinite loops
  const fetchAllData = useCallback(async () => {
    if (user && !authLoading) {
      console.log('Manually fetching data for user:', user.id);
      await Promise.all([
        fetchDashboardStats(),
        fetchInvoices(),
        fetchClients(),
        fetchSettings()
      ]);
    }
  }, [user, authLoading, fetchDashboardStats, fetchInvoices, fetchClients, fetchSettings]);

  // Load data from localStorage first, then fetch from server if needed
  useEffect(() => {
    if (user && !authLoading && !hasLoadedData) {
      setHasLoadedData(true);
      const hasLocalData = loadDataFromLocalStorage();
      if (!hasLocalData) {
        fetchAllData();
      }
    }
  }, [user, authLoading, hasLoadedData, loadDataFromLocalStorage, fetchAllData]); // Include all dependencies

  // Load settings immediately when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      fetchSettings();
    }
  }, [user, authLoading, fetchSettings]);

  // Save data to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (user && !authLoading && hasLoadedData && (clients.length > 0 || invoices.length > 0)) {
      saveDataToLocalStorage();
    }
  }, [clients, invoices, dashboardStats, user, authLoading, hasLoadedData, saveDataToLocalStorage]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileDropdown) {
        const target = event.target as Element;
        if (!target.closest('.profile-dropdown')) {
          setShowProfileDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Memoize expensive calculations
  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);
  const totalRevenue = useMemo(() => dashboardStats.totalRevenue || 0, [dashboardStats.totalRevenue]);
  const outstandingAmount = useMemo(() => dashboardStats.outstandingAmount || 0, [dashboardStats.outstandingAmount]);
  const overdueCount = useMemo(() => dashboardStats.overdueCount || 0, [dashboardStats.overdueCount]);
  const totalClients = useMemo(() => dashboardStats.totalClients || 0, [dashboardStats.totalClients]);

  // Memoize status utilities
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3 mr-1.5" />;
      case 'sent': return <Clock className="h-3 w-3 mr-1.5" />;
      case 'overdue': return <AlertCircle className="h-3 w-3 mr-1.5" />;
      case 'draft': return <FileText className="h-3 w-3 mr-1.5" />;
      default: return <FileText className="h-3 w-3 mr-1.5" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400';
      case 'sent': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400';
      case 'overdue': return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400';
      case 'draft': return 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300';
    }
  }, []);

  // Memoized Invoice Card Component
  const InvoiceCard = memo(({ invoice, isDarkMode, handleViewInvoice, handleDownloadPDF, handleSendInvoice, handleEditInvoice, getStatusIcon, getStatusColor }: {
    invoice: Invoice;
    isDarkMode: boolean;
    handleViewInvoice: (invoice: Invoice) => void;
    handleDownloadPDF: (invoice: Invoice) => void;
    handleSendInvoice: (invoice: Invoice) => void;
    handleEditInvoice: (invoice: Invoice) => void;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
  }) => (
    <div className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${isDarkMode ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/40' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
      <div className="space-y-6">
        {/* Invoice Info Row */}
        <div className="space-y-4 sm:space-y-0">
          {/* Mobile Layout */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-heading text-sm font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                {invoice.invoiceNumber}
              </div>
              <div className="font-heading text-lg font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                ₹{invoice.total.toLocaleString()}
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
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </span>
              <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Due: {invoice.dueDate}
              </div>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
            <div className="space-y-1">
              <div className="font-heading text-sm font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                {invoice.invoiceNumber}
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
            <div className="font-heading text-lg font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              ₹{invoice.total.toLocaleString()}
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </span>
              <div className="text-sm hidden lg:block" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Due: {invoice.dueDate}
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
        
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
            className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
          >
            <Download className="h-3 w-3" />
            <span>PDF</span>
          </button>
          {invoice.status !== 'paid' && (
            <button 
              onClick={() => handleSendInvoice(invoice)}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
            >
              <Send className="h-3 w-3" />
              <span>Send</span>
            </button>
          )}
          <button 
            onClick={() => handleEditInvoice(invoice)}
            className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 font-medium ${isDarkMode ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  ));
  
  InvoiceCard.displayName = 'InvoiceCard';

  const handleLogin = async (email: string, password: string, name?: string) => {
    let result
    if (name) {
      // Sign up
      result = await signUp(email, password, name)
    } else {
      // Sign in
      result = await signIn(email, password)
    }
    
    if (!result.error) {
      // Refresh data after login
      fetchAllData();
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  // Invoice functions
  const handleCreateInvoice = async () => {
    if (!newInvoice.clientId || !newInvoice.dueDate || newInvoice.items.some(item => !item.description || item.rate <= 0)) {
      alert('Please fill in all required fields');
      return;
    }

    const client = clients.find(c => c.id === newInvoice.clientId);
    if (!client) return;

    setIsCreatingInvoice(true);
    try {
      const subtotal = newInvoice.items.reduce((sum, item) => sum + item.rate, 0);
      const taxAmount = subtotal * newInvoice.taxRate;
      const total = subtotal + taxAmount;

      const invoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        clientId: newInvoice.clientId,
        client: client,
        items: newInvoice.items.map(item => ({
          ...item,
          amount: item.rate
        })),
        subtotal,
        taxRate: newInvoice.taxRate,
        taxAmount,
        total,
        status: 'draft',
        dueDate: newInvoice.dueDate,
        createdAt: new Date().toISOString().split('T')[0],
        notes: newInvoice.notes
      };

      setInvoices(prev => [invoice, ...prev]);
      setShowCreateInvoice(false);
      setNewInvoice({
        clientId: '',
        dueDate: '',
        items: [{ id: '1', description: '', rate: 0, amount: 0 }],
        taxRate: 0.1,
        notes: ''
      });
      alert('Invoice created successfully!');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoice(true);
  }, []);

  const handleDownloadPDF = useCallback(async (invoice: Invoice) => {
    try {
      const authHeaders = await getAuthHeaders();
      
      const response = await fetch('/api/invoices/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF');
    }
  }, [getAuthHeaders]);

  const handleSendInvoice = useCallback(async (invoice: Invoice) => {
    setIsSendingInvoice(true);
    try {
      const subject = `Invoice ${invoice.invoiceNumber} from InvoiceFlow`;
      const body = `Dear ${invoice.client.name},

Please find attached your invoice ${invoice.invoiceNumber} for the amount of $${invoice.total.toFixed(2)}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Due Date: ${invoice.dueDate}
- Total Amount: $${invoice.total.toFixed(2)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!

Best regards,
InvoiceFlow Team`;

      const mailtoLink = `mailto:${invoice.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      // Update invoice status to sent
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
      ));
      alert('Invoice email opened!');
    } finally {
      setIsSendingInvoice(false);
    }
  }, []);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewInvoice({
      clientId: invoice.clientId,
      dueDate: invoice.dueDate,
      items: invoice.items,
      taxRate: invoice.taxRate,
      notes: invoice.notes || ''
    });
    setShowCreateInvoice(true);
  }, []);

  // Client functions
  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) {
      showError('Validation Error', 'Name and email are required fields.');
      return;
    }

    setIsCreatingClient(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          company: newClient.company || '',
          phone: newClient.phone || '',
          address: newClient.address || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const { client } = await response.json();
      
      setClients(prev => [client, ...prev]);
      setShowCreateClient(false);
      setNewClient({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: ''
      });
      showSuccess('Client Added', 'New client has been successfully added to your list.');
    } catch (error) {
      console.error('Error creating client:', error);
      showError('Creation Failed', `Failed to create client: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setNewClient({
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone || '',
      address: client.address || ''
    });
    setShowEditClient(true);
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    if (!newClient.name || !newClient.email) {
      showError('Validation Error', 'Name and email are required fields.');
      return;
    }

    setIsUpdatingClient(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          company: newClient.company || '',
          phone: newClient.phone || '',
          address: newClient.address || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      const { client } = await response.json();
      
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id ? client : c
      ));
      setShowEditClient(false);
      setSelectedClient(null);
      setNewClient({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: ''
      });
      showSuccess('Client Updated', 'Client information has been successfully updated.');
    } catch (error) {
      console.error('Error updating client:', error);
      showError('Update Failed', `Failed to update client: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsUpdatingClient(false);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Client',
      message: `Are you sure you want to delete "${client?.name || 'this client'}"? This action cannot be undone and will also remove all associated invoices.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        setIsDeletingClient(true);
        setDeletingClientId(clientId);
        
        // Store original state for rollback
        const originalClients = [...clients];
        const originalInvoices = [...invoices];
        
        try {
          // Optimistic update - remove client immediately for better UX
          setClients(prev => prev.filter(client => client.id !== clientId));
          setInvoices(prev => prev.filter(invoice => invoice.clientId !== clientId));
          
          const headers = await getAuthHeaders();
          const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE',
            headers
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete client');
          }

          showSuccess('Client Deleted', 'Client has been successfully removed from your list.');
        } catch (error) {
          console.error('Error deleting client:', error);
          
          // Rollback optimistic update on error
          setClients(originalClients);
          setInvoices(originalInvoices);
          
          showError('Delete Failed', `Failed to delete client: ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
          setIsDeletingClient(false);
          setDeletingClientId(null);
        }
      }
    });
  };

  const handleContactClient = (client: Client) => {
    const subject = 'Message from InvoiceFlow';
    const body = `Dear ${client.name},

I hope this message finds you well.

Best regards,
InvoiceFlow Team`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File Type', 'Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'File size must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // Update settings with logo
        const updatedSettings = { ...settings, logo: base64String };
        setSettings(updatedSettings);
        setLogoPreview(base64String);
        
        // Save to database
        const headers = await getAuthHeaders();
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers,
          body: JSON.stringify(updatedSettings)
        });

        if (!response.ok) {
          throw new Error('Failed to save logo');
        }

        showSuccess('Logo Uploaded', 'Your logo has been successfully uploaded!');
      };
      
      reader.readAsDataURL(file);
      
      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error('Logo upload error:', error);
      showError('Upload Failed', 'Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (logoPreview) {
      // Update settings to remove logo
      const updatedSettings = { ...settings, logo: '' };
      setSettings(updatedSettings);
      setLogoPreview(null);
      
      // Save to database
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers,
          body: JSON.stringify(updatedSettings)
        });

        if (!response.ok) {
          throw new Error('Failed to remove logo');
        }

        showSuccess('Logo Removed', 'Your logo has been successfully removed.');
      } catch (error) {
        console.error('Logo removal error:', error);
        showError('Remove Failed', 'Failed to remove logo. Please try again.');
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      showSuccess('Settings Saved', 'Your business settings have been successfully saved!');
      // Refresh settings from database
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Save Failed', 'Failed to save settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Invoice item functions
  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', rate: 0, amount: 0 }]
    }));
  };

  const removeInvoiceItem = (itemId: string) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateInvoiceItem = (itemId: string, field: string, value: string | number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'rate') {
            updatedItem.amount = updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Dashboard stats (computed from API data)
  // These are now fetched from the API and stored in dashboardStats state


  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex h-screen">
        {/* Modern Sidebar */}
        <ModernSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onCreateInvoice={() => setShowCreateInvoice(true)}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
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
                        ₹{totalRevenue.toLocaleString()}
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
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Outstanding</p>
                      <p className="font-heading text-3xl font-bold text-amber-600 dark:text-amber-400">
                        ₹{outstandingAmount.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {invoices.filter(inv => inv.status === 'sent').length} pending
                        </span>
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
                        {overdueCount}
                      </p>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          Need attention
                        </span>
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
                        {totalClients}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          Active clients
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                      <UserCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
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
            <div>
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Recent Invoices
              </h2>
              {recentInvoices.length > 0 ? (
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
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              ) : (
                <div className={`rounded-lg p-8 text-center ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
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
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Invoices
              </h2>
              {user ? (
                <button
                  onClick={() => setShowCreateInvoice(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Invoice</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <span>Sign In</span>
                </button>
              )}
        </div>
            
            {/* Invoice List */}
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    isDarkMode={isDarkMode}
                    handleViewInvoice={handleViewInvoice}
                    handleDownloadPDF={handleDownloadPDF}
                    handleSendInvoice={handleSendInvoice}
                    handleEditInvoice={handleEditInvoice}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <div className={`rounded-lg p-12 text-center ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-xl mb-6 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <FileText className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  No invoices found
                </h3>
                <p className="text-sm mb-8 max-w-md mx-auto" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
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
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FilePlus className="h-4 w-4" />
                    <span>Detailed Invoice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Clients
              </h2>
              <button
                onClick={() => setShowCreateClient(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </button>
            </div>
            
            {/* Client List */}
            {clients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <div key={client.id} className={`rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm ${isDeletingClient && deletingClientId === client.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                        <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditClient(client)}
                          disabled={isUpdatingClient || (isDeletingClient && deletingClientId === client.id)}
                          className={`p-3 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
                            isUpdatingClient || (isDeletingClient && deletingClientId === client.id)
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          aria-label={`Edit ${client.name}`}
                        >
                          <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={isDeletingClient && deletingClientId === client.id}
                          className={`p-3 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
                            isDeletingClient && deletingClientId === client.id 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          aria-label={`Delete ${client.name}`}
                        >
                          {isDeletingClient && deletingClientId === client.id ? (
                            <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-heading text-lg font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                      {client.name}
                    </h3>
                    <p className="text-sm mb-1" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      {client.company}
                    </p>
                    <p className="text-sm mb-4" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      {client.email}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        {invoices.filter(inv => inv.clientId === client.id).length} invoices
                      </div>
                      <button 
                        onClick={() => handleContactClient(client)}
                        className="flex items-center justify-center space-x-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 min-h-[44px] sm:min-h-auto"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-lg p-12 text-center ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-xl mb-6 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  No clients yet
                </h3>
                <p className="text-sm mb-8 max-w-md mx-auto" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Build your client database to streamline your invoicing process. 
                  Add client details once and use them for all future invoices.
                </p>
                
                <button
                  onClick={() => setShowCreateClient(true)}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mx-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add First Client</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Settings
              </h2>
              {isLoadingSettings && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            {/* Business Information */}
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Business Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, businessEmail: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.businessPhone}
                    onChange={(e) => setSettings(prev => ({ ...prev, businessPhone: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={settings.address}
                    onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Your business address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Logo
                  </label>
                  
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="mb-4 p-4 border rounded-lg" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Current Logo
                        </span>
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-16 h-16 object-contain border rounded-lg"
                          style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}
                        />
                        <div>
                          <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                            Logo uploaded successfully
                          </p>
                          <p className="text-xs" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                            This will appear on your invoices
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                      <div className={`flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span className="text-sm">{isUploadingLogo ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Payment Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    value={settings.paypalEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="your@paypal.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    CashApp ID
                  </label>
                  <input
                    type="text"
                    value={settings.cashappId}
                    onChange={(e) => setSettings(prev => ({ ...prev, cashappId: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="$yourcashapp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Venmo ID
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    value={settings.venmoId}
                    onChange={(e) => setSettings(prev => ({ ...prev, venmoId: e.target.value }))}
                    placeholder="@yourvenmo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Google Pay / UPI ID
                  </label>
                  <input
                    type="text"
                    value={settings.googlePayUpi}
                    onChange={(e) => setSettings(prev => ({ ...prev, googlePayUpi: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="your@upi or phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Apple Pay ID
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    value={settings.applePayId}
                    onChange={(e) => setSettings(prev => ({ ...prev, applePayId: e.target.value }))}
                    placeholder="Apple Pay ID or phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Bank Account Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={settings.bankAccount}
                        onChange={(e) => setSettings(prev => ({ ...prev, bankAccount: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                        placeholder="Account number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                        IFSC / SWIFT Code
                      </label>
                      <input
                        type="text"
                        value={settings.bankIfscSwift}
                        onChange={(e) => setSettings(prev => ({ ...prev, bankIfscSwift: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                        placeholder="IFSC or SWIFT code"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    IBAN (International)
                  </label>
                  <input
                    type="text"
                    value={settings.bankIban}
                    onChange={(e) => setSettings(prev => ({ ...prev, bankIban: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="IBAN number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Stripe Account
                  </label>
                  <input
                    type="text"
                    value={settings.stripeAccount}
                    onChange={(e) => setSettings(prev => ({ ...prev, stripeAccount: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Stripe account ID or email"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Additional Payment Methods
                  </label>
                  <textarea
                    rows={3}
                    value={settings.paymentNotes}
                    onChange={(e) => setSettings(prev => ({ ...prev, paymentNotes: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Wise, Revolut, Zelle, or other payment methods not listed above..."
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Create Invoice</h2>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Client *
                  </label>
                  <select 
                    value={newInvoice.clientId}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, clientId: e.target.value }))}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Invoice Items *
                  </label>
                  <button
                    onClick={addInvoiceItem}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newInvoice.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-7">
                        <input
                          type="text"
                          placeholder="Service Description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.rate}
                          onChange={(e) => updateInvoiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          ${item.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {newInvoice.items.length > 1 && (
                          <button
                            onClick={() => removeInvoiceItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.taxRate * 100}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 || 0 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Notes
                  </label>
                  <input
                    type="text"
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
              </div>

              {/* Invoice Total Preview */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center text-sm">
                  <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Subtotal:</span>
                  <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    ${newInvoice.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Tax:</span>
                  <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    ${(newInvoice.items.reduce((sum, item) => sum + item.amount, 0) * newInvoice.taxRate).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
                  <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Total:</span>
                  <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    ${(newInvoice.items.reduce((sum, item) => sum + item.amount, 0) * (1 + newInvoice.taxRate)).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateInvoice(false);
                    setEditingInvoice(null);
                    setNewInvoice({
                      clientId: '',
                      dueDate: '',
                      items: [{ id: '1', description: '', rate: 0, amount: 0 }],
                      taxRate: 0.1,
                      notes: ''
                    });
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateInvoice}
                  disabled={isCreatingInvoice}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreatingInvoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  <span>{isCreatingInvoice ? 'Creating Invoice...' : (editingInvoice ? 'Update Invoice' : 'Create Invoice')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-2xl shadow-2xl border max-w-lg w-full ${
            isDarkMode 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          } backdrop-blur-sm`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${
              isDarkMode 
                ? 'border-gray-700' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${
                  isDarkMode 
                    ? 'bg-indigo-500/20' 
                    : 'bg-indigo-50'
                }`}>
                  <UserPlus className={`h-6 w-6 ${
                    isDarkMode 
                      ? 'text-indigo-400' 
                      : 'text-indigo-600'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${
                    isDarkMode 
                      ? 'text-white' 
                      : 'text-gray-900'
                  }`}>
                    {showEditClient ? 'Edit Client' : 'Add New Client'}
                  </h2>
                  <p className={`text-sm ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-600'
                  }`}>
                    {showEditClient ? 'Update client information' : 'Add a new client to your list'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateClient(false);
                  setShowEditClient(false);
                  setSelectedClient(null);
                  setNewClient({
                    name: '',
                    email: '',
                    company: '',
                    phone: '',
                    address: ''
                  });
                }}
                className={`transition-colors p-2 rounded-lg ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* Required Fields */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Client Name *
                    </label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Enter client name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="client@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`text-sm font-medium mb-4 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Additional Information (Optional)
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <input
                          type="tel"
                          value={newClient.phone || ''}
                          onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Company
                      </label>
                      <div className="relative">
                        <Building2 className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          value={newClient.company || ''}
                          onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Company name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className={`absolute left-3 top-3 h-4 w-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <textarea
                          value={newClient.address || ''}
                          onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Client address"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateClient(false);
                      setShowEditClient(false);
                      setSelectedClient(null);
                      setNewClient({
                        name: '',
                        email: '',
                        company: '',
                        phone: '',
                        address: ''
                      });
                    }}
                    className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={showEditClient ? handleUpdateClient : handleCreateClient}
                    disabled={isCreatingClient || isUpdatingClient}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(isCreatingClient || isUpdatingClient) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span>
                      {isCreatingClient ? 'Adding Client...' : 
                       isUpdatingClient ? 'Updating Client...' :
                       showEditClient ? 'Update Client' : 'Add Client'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewInvoice && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Invoice {selectedInvoice.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowViewInvoice(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Invoice Header */}
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Invoice Details</h3>
                  <div className="space-y-1 text-xs sm:text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> {selectedInvoice.createdAt}</p>
                    <p><strong>Due Date:</strong> {selectedInvoice.dueDate}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedInvoice.status === 'paid' 
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                          : selectedInvoice.status === 'sent'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                          : selectedInvoice.status === 'overdue'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300'
                      }`}>
                        {selectedInvoice.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Bill To</h3>
                  <div className="text-xs sm:text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    <p className="font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>{selectedInvoice.client.name}</p>
                    {selectedInvoice.client.company && <p>{selectedInvoice.client.company}</p>}
                    <p>{selectedInvoice.client.email}</p>
                    {selectedInvoice.client.phone && <p>{selectedInvoice.client.phone}</p>}
                    {selectedInvoice.client.address && <p>{selectedInvoice.client.address}</p>}
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Items</h3>
                
                {/* Mobile Layout - Cards */}
                <div className="sm:hidden space-y-3">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        {item.description}
                      </div>
                      <div className="text-sm font-semibold mt-1" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        ₹{item.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop Layout - Table */}
                <div className={`hidden sm:block rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <table className="w-full">
                    <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Service</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Amount</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>{item.description}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>₹{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Subtotal:</span>
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Tax ({(selectedInvoice.taxRate * 100).toFixed(1)}%):</span>
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>₹{selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Total:</span>
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Notes</h3>
                  <p className="text-xs sm:text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => handleSendInvoice(selectedInvoice)}
                    disabled={isSendingInvoice}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingInvoice ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{isSendingInvoice ? 'Sending...' : 'Send Invoice'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleEditInvoice(selectedInvoice)}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />

      {/* Fast Invoice Modal */}
      <FastInvoiceModal
        isOpen={showFastInvoice}
        onClose={() => setShowFastInvoice(false)}
        onSuccess={() => {
          fetchAllData();
        }}
        user={user || { id: 'guest', email: 'guest@example.com', name: 'Guest' }}
        getAuthHeaders={getAuthHeaders}
        isDarkMode={isDarkMode}
        clients={clients}
      />

      {/* Quick Invoice Modal */}
      {user && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={() => {
            fetchAllData();
          }}
          getAuthHeaders={getAuthHeaders}
          isDarkMode={isDarkMode}
          clients={clients}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
      />

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
          </div>
        </main>
      </div>
    </div>
  );
}