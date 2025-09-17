'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Plus, FileText, DollarSign, Users, Download, Send, Zap, TrendingUp, 
  Clock, CheckCircle, AlertCircle, X, Building2, Eye, 
  Trash2, Edit, Mail, CreditCard 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import QuickInvoiceModal from '@/components/QuickInvoiceModal';
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

  // Sample data (in real app, this would come from Supabase)
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@acme.com',
      company: 'Acme Corporation',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, City, State 12345',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@techstart.com',
      company: 'TechStart LLC',
      phone: '+1 (555) 987-6543',
      address: '456 Innovation Ave, City, State 12345',
      createdAt: '2024-01-15'
    }
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: '1',
      client: clients[0],
      items: [
        { id: '1', description: 'Website Development', rate: 3000, amount: 3000 },
        { id: '2', description: 'UI/UX Design', rate: 1000, amount: 1000 }
      ],
      subtotal: 4000,
      taxRate: 0.1,
      taxAmount: 400,
      total: 4400,
      status: 'sent',
      dueDate: '2024-02-15',
      createdAt: '2024-01-15',
      notes: 'Thank you for your business!'
    },
    {
      id: '2',
      invoiceNumber: 'INV-002',
      clientId: '2',
      client: clients[1],
      items: [
        { id: '3', description: 'Mobile App Development', rate: 6000, amount: 6000 }
      ],
      subtotal: 6000,
      taxRate: 0.1,
      taxAmount: 600,
      total: 6600,
      status: 'paid',
      dueDate: '2024-01-30',
      createdAt: '2024-01-10'
    }
  ]);

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

  // Fetch dashboard data when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // Only fetch if we don't have data yet
      if (dashboardStats.totalRevenue === undefined) {
        fetchDashboardStats();
      }
      if (invoices.length === 0) {
        fetchInvoices();
      }
      if (clients.length === 0) {
        fetchClients();
      }
    }
  }, [user, authLoading, dashboardStats.totalRevenue, invoices.length, clients.length, fetchDashboardStats, fetchInvoices, fetchClients]);

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button 
            onClick={() => handleViewInvoice(invoice)}
            className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all duration-200 font-medium"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">View</span>
          </button>
          <button 
            onClick={() => handleDownloadPDF(invoice)}
            className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all duration-200 font-medium"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          {invoice.status !== 'paid' && (
            <button 
              onClick={() => handleSendInvoice(invoice)}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all duration-200 font-medium"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          )}
          <button 
            onClick={() => handleEditInvoice(invoice)}
            className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500/30 transition-all duration-200 font-medium"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Edit</span>
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
      fetchDashboardStats();
      fetchInvoices();
      fetchClients();
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
  const handleCreateInvoice = () => {
    if (!newInvoice.clientId || !newInvoice.dueDate || newInvoice.items.some(item => !item.description || item.rate <= 0)) {
      alert('Please fill in all required fields');
      return;
    }

    const client = clients.find(c => c.id === newInvoice.clientId);
    if (!client) return;

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
  };

  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoice(true);
  }, []);

  const handleDownloadPDF = useCallback((invoice: Invoice) => {
    // Generate PDF content
    const pdfContent = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 30px; }
            .client-info { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
            .notes { margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <h2>${invoice.invoiceNumber}</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>Date:</strong> ${invoice.createdAt}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          </div>

          <div class="client-info">
            <h3>Bill To:</h3>
            <p><strong>${invoice.client.name}</strong></p>
            <p>${invoice.client.company}</p>
            <p>${invoice.client.email}</p>
            ${invoice.client.address ? `<p>${invoice.client.address}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>$${item.rate.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
            <p>Tax (${(invoice.taxRate * 100).toFixed(1)}%): $${invoice.taxAmount.toFixed(2)}</p>
            <p><strong>Total: $${invoice.total.toFixed(2)}</strong></p>
          </div>

          ${invoice.notes ? `
            <div class="notes">
              <h3>Notes:</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    // Open PDF in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(pdfContent);
      newWindow.document.close();
      newWindow.print();
    }
  }, []);

  const handleSendInvoice = useCallback((invoice: Invoice) => {
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
  const handleCreateClient = () => {
    if (!newClient.name || !newClient.email || !newClient.company) {
      alert('Please fill in all required fields');
      return;
    }

    const client: Client = {
      id: Date.now().toString(),
      name: newClient.name,
      email: newClient.email,
      company: newClient.company,
      phone: newClient.phone,
      address: newClient.address,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setClients(prev => [client, ...prev]);
    setShowCreateClient(false);
    setNewClient({
      name: '',
      email: '',
      company: '',
      phone: '',
      address: ''
    });
    alert('Client added successfully!');
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

  const handleUpdateClient = () => {
    if (!selectedClient) return;

    setClients(prev => prev.map(client => 
      client.id === selectedClient.id 
        ? { ...client, ...newClient }
        : client
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
    alert('Client updated successfully!');
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      setClients(prev => prev.filter(client => client.id !== clientId));
      setInvoices(prev => prev.filter(invoice => invoice.clientId !== clientId));
      alert('Client deleted successfully!');
    }
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
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth">
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
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Total Revenue</p>
                      <p className="font-heading text-3xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        ₹{totalRevenue.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Paid invoices</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                      <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Outstanding Amount */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Outstanding</p>
                      <p className="font-heading text-3xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
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
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Overdue Invoices */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Overdue</p>
                      <p className="font-heading text-3xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
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
                      <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Total Clients */}
                <div className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Total Clients</p>
                      <p className="font-heading text-3xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
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
                      <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
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
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/30' : 'bg-green-100'}`}>
                      <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        60-Second Invoice
                      </h3>
                      <p className="text-sm" style={{color: isDarkMode ? '#d1d5db' : '#6b7280'}}>
                        Fast & simple invoicing
                      </p>
                    </div>
                  </div>
                </button>

                {/* Detailed Invoice */}
                <button
                  onClick={() => setShowCreateInvoice(true)}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-100'}`}>
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        Detailed Invoice
                      </h3>
                      <p className="text-sm" style={{color: isDarkMode ? '#d1d5db' : '#6b7280'}}>
                        Multiple items & customization
                      </p>
                    </div>
                  </div>
                </button>

                {/* Add Client */}
                <button
                  onClick={() => setShowCreateClient(true)}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-500/30' : 'bg-purple-100'}`}>
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        Add Client
                      </h3>
                      <p className="text-sm" style={{color: isDarkMode ? '#d1d5db' : '#6b7280'}}>
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
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Invoice</span>
                  <span className="sm:hidden">New</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <span>Sign In</span>
                </button>
              )}
        </div>
            
            {/* Invoice List */}
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
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </button>
            </div>
            
            {/* Client List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div key={client.id} className={`rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                      <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditClient(client)}
                        className="p-3 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] sm:min-h-auto"
                      >
                        <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-3 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors min-h-[44px] sm:min-h-auto"
                      >
                        <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
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
                      className="flex items-center justify-center space-x-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 min-h-[44px] sm:min-h-auto"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Contact</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Settings
              </h2>
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
                    Business Name
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Your business address"
                  />
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="paypal@yourbusiness.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Bank Account
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Bank account details"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Other Payment Methods
                  </label>
                  <textarea
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="UPI, Venmo, or other payment methods"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
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
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateInvoice}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Add Client</h2>
              <button
                onClick={() => setShowCreateClient(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Company *
                </label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Phone
                </label>
                <input
                  type="text"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Optional"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Address
                </label>
                <textarea
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Optional"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
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
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={showEditClient ? handleUpdateClient : handleCreateClient}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {showEditClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewInvoice && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
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
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => handleSendInvoice(selectedInvoice)}
                    className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Invoice</span>
                  </button>
                )}
                <button
                  onClick={() => handleEditInvoice(selectedInvoice)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
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
          fetchDashboardStats();
          fetchInvoices();
          fetchClients();
        }}
        user={user || { id: 'guest', email: 'guest@example.com', name: 'Guest' }}
        getAuthHeaders={getAuthHeaders}
        isDarkMode={isDarkMode}
      />

      {/* Quick Invoice Modal */}
      {user && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={() => {
            fetchDashboardStats();
            fetchInvoices();
            fetchClients();
          }}
          getAuthHeaders={getAuthHeaders}
          isDarkMode={isDarkMode}
        />
      )}
          </div>
        </main>
      </div>
    </div>
  );
}