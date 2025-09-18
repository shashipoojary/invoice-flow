'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, FileText, Users, TrendingUp, 
  Clock, CheckCircle, AlertCircle, AlertTriangle, UserPlus, FilePlus, Sparkles, Receipt, Timer
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import FastInvoiceModal from '@/components/FastInvoiceModal';
import QuickInvoiceModal from '@/components/QuickInvoiceModal';

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
  discount?: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  notes?: string;
  type?: 'fast' | 'detailed';
  // Database field names (for compatibility)
  client_id?: string;
  due_date?: string;
  tax_rate?: number;
  tax?: number;
}

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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients' | 'settings'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    outstandingAmount: 0,
    overdueCount: 0,
    totalClients: 0
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);

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
    // This will be handled by navigation to the invoices page
    console.log('Create invoice clicked');
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


  // Load data on mount - prevent infinite loop with hasLoadedData flag
  useEffect(() => {
    if (user && !loading && !hasLoadedData) {
      setHasLoadedData(true); // Set flag immediately to prevent re-runs
      
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Call getAuthHeaders directly in each fetch to avoid dependency issues
          const headers = await getAuthHeaders();
          
          await Promise.all([
            // Fetch dashboard stats
            fetch('/api/dashboard/stats', { headers, cache: 'no-store' })
              .then(res => res.json())
              .then(data => setDashboardStats(data))
              .catch(err => console.error('Error fetching dashboard stats:', err)),
            
            // Fetch invoices
            fetch('/api/invoices', { headers, cache: 'no-store' })
              .then(res => res.json())
              .then(data => setInvoices(Array.isArray(data) ? data : []))
              .catch(err => {
                console.error('Error fetching invoices:', err);
                setInvoices([]);
              }),
            
            // Fetch clients
            fetch('/api/clients', { headers, cache: 'no-store' })
              .then(res => res.json())
              .then(data => setClients(data))
              .catch(err => console.error('Error fetching clients:', err))
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [user, loading, hasLoadedData]); // Include hasLoadedData to prevent re-runs

  // Memoize calculations
  const recentInvoices = useMemo(() => Array.isArray(invoices) ? invoices.slice(0, 5) : [], [invoices]);
  const totalRevenue = useMemo(() => dashboardStats.totalRevenue || 0, [dashboardStats.totalRevenue]);
  const outstandingAmount = useMemo(() => dashboardStats.outstandingAmount || 0, [dashboardStats.outstandingAmount]);
  const overdueCount = useMemo(() => dashboardStats.overdueCount || 0, [dashboardStats.overdueCount]);
  const totalClients = useMemo(() => dashboardStats.totalClients || 0, [dashboardStats.totalClients]);

  if (loading || isLoading) {
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
                        ${totalRevenue.toLocaleString()}
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
                        ${outstandingAmount.toLocaleString()}
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
                        {totalClients}
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

            {/* Recent Invoices */}
            <div className="mt-8">
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Recent Invoices
              </h2>
              {recentInvoices.length > 0 ? (
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/70 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                              {invoice.invoiceNumber}
                            </h3>
                            <p className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                              {invoice.client.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                            ${invoice.total.toLocaleString()}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : invoice.status === 'sent'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </div>
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
                      .then(data => setInvoices(Array.isArray(data) ? data : []))
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
        <QuickInvoiceModal
          isOpen={showCreateClient}
          onClose={() => setShowCreateClient(false)}
          getAuthHeaders={getAuthHeaders}
          isDarkMode={isDarkMode}
          clients={clients}
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
    </div>
  );
}
