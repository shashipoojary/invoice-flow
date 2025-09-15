'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign, Users, Calendar, Download, Send, Zap, TrendingUp, Clock, CheckCircle, AlertCircle, X, Receipt, Sun, Moon } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  total: number;
  status: 'draft' | 'sent' | 'paid';
  dueDate: string;
  createdAt: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const QUICK_TEMPLATES = [
  { name: 'Web Development', description: 'Website Development Services', rate: 75 },
  { name: 'Consulting', description: 'Business Consulting', rate: 100 },
  { name: 'Design', description: 'UI/UX Design Services', rate: 50 },
  { name: 'Writing', description: 'Content Writing', rate: 25 },
  { name: 'Marketing', description: 'Digital Marketing', rate: 60 },
  { name: 'Photography', description: 'Photography Services', rate: 150 },
  { name: 'Coaching', description: 'Personal Coaching', rate: 80 },
  { name: 'Tutoring', description: 'Online Tutoring', rate: 30 }
];

// Smart Client Memory System
const CLIENT_MEMORY = {
  'john@acme.com': {
    name: 'John Smith',
    company: 'Acme Corp',
    preferredRate: 75,
    lastProject: 'Website Development',
    avgProjectValue: 2500,
    paymentTerms: 'Net 30',
    timezone: 'EST'
  },
  'sarah@techstart.com': {
    name: 'Sarah Johnson',
    company: 'TechStart LLC',
    preferredRate: 100,
    lastProject: 'Business Consulting',
    avgProjectValue: 1500,
    paymentTerms: 'Net 15',
    timezone: 'PST'
  }
};

// Smart Pricing Engine
const SMART_PRICING = {
  'Web Development': { min: 50, max: 150, suggested: 75, factors: ['complexity', 'timeline', 'client_budget'] },
  'Consulting': { min: 75, max: 200, suggested: 100, factors: ['expertise_level', 'industry', 'project_scope'] },
  'Design': { min: 30, max: 100, suggested: 50, factors: ['design_type', 'revisions', 'brand_guidelines'] }
};

export default function InvoiceGenerator() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-001',
      clientName: 'Acme Corporation',
      clientEmail: 'billing@acme.com',
      items: [
        { description: 'Website Development', quantity: 40, rate: 75, amount: 3000 },
        { description: 'UI/UX Design', quantity: 20, rate: 50, amount: 1000 }
      ],
      total: 4000,
      status: 'sent',
      dueDate: '2024-02-15',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      invoiceNumber: 'INV-002',
      clientName: 'TechStart LLC',
      clientEmail: 'finance@techstart.com',
      items: [
        { description: 'Business Consulting', quantity: 10, rate: 100, amount: 1000 }
      ],
      total: 1000,
      status: 'paid',
      dueDate: '2024-01-30',
      createdAt: '2024-01-10'
    }
  ]);

  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [quickInvoice, setQuickInvoice] = useState({
    clientName: '',
    clientEmail: '',
    template: '',
    amount: 0,
    dueDate: ''
  });

  // Smart Assistant Features
  const [smartSuggestions, setSmartSuggestions] = useState<any>(null);
  const [recurringInvoices, setRecurringInvoices] = useState<any[]>([]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const createQuickInvoice = () => {
    const template = QUICK_TEMPLATES.find(t => t.name === quickInvoice.template);
    const total = quickInvoice.amount;
    const invoiceNumber = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
    
    const invoice: Invoice = {
      id: String(invoices.length + 1),
      invoiceNumber,
      clientName: quickInvoice.clientName,
      clientEmail: quickInvoice.clientEmail,
      items: [{
        description: template?.description || quickInvoice.template,
        quantity: 1,
        rate: total,
        amount: total
      }],
      total,
      status: 'draft',
      dueDate: quickInvoice.dueDate,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setInvoices(prev => [invoice, ...prev]);
    setQuickInvoice({ clientName: '', clientEmail: '', template: '', amount: 0, dueDate: '' });
    setShowQuickCreate(false);
  };

  const generatePDF = (invoice: Invoice) => {
    // Create a simple PDF-like view in a new window
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .client-info, .invoice-info { width: 45%; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f8fafc; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status.draft { background-color: #f1f5f9; color: #475569; }
            .status.sent { background-color: #fef3c7; color: #92400e; }
            .status.paid { background-color: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">InvoiceFlow</div>
            <h1>INVOICE ${invoice.invoiceNumber}</h1>
          </div>
          
          <div class="invoice-details">
            <div class="client-info">
              <h3>Bill To:</h3>
              <p><strong>${invoice.clientName}</strong><br>
              ${invoice.clientEmail}</p>
            </div>
            <div class="invoice-info">
              <p><strong>Invoice Date:</strong> ${invoice.createdAt}</p>
              <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
              <p><strong>Status:</strong> <span class="status ${invoice.status}">${invoice.status.toUpperCase()}</span></p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.rate.toFixed(2)}</td>
                  <td>$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Total: $${invoice.total.toFixed(2)}</p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Thank you for your business!</p>
            <p>Generated by InvoiceFlow - Professional Invoicing Made Simple</p>
          </div>
        </body>
        </html>
      `);
      pdfWindow.document.close();
      pdfWindow.print();
    }
  };

  const sendInvoice = (invoice: Invoice) => {
    // Simulate sending email
    const subject = `Invoice ${invoice.invoiceNumber} from InvoiceFlow`;
    const body = `Dear ${invoice.clientName},

Please find attached your invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: $${invoice.total.toFixed(2)}
- Due Date: ${invoice.dueDate}
- Status: ${invoice.status}

Thank you for your business!

Best regards,
InvoiceFlow Team`;

    const mailtoLink = `mailto:${invoice.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    // Update status to 'sent'
    setInvoices(prev => prev.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
    ));
  };

  const markAsPaid = (invoice: Invoice) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'paid' as const } : inv
    ));
  };

  // Smart Assistant Functions
  const getSmartSuggestions = (email: string) => {
    const client = CLIENT_MEMORY[email as keyof typeof CLIENT_MEMORY];
    if (client) {
      setSmartSuggestions({
        name: client.name,
        company: client.company,
        suggestedRate: client.preferredRate,
        suggestedAmount: client.avgProjectValue,
        paymentTerms: client.paymentTerms,
        lastProject: client.lastProject
      });
    }
  };

  const createRecurringInvoice = (invoice: Invoice) => {
    const recurring = {
      id: `REC-${Date.now()}`,
      baseInvoice: invoice,
      frequency: 'monthly',
      nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    };
    setRecurringInvoices(prev => [...prev, recurring]);
  };

  const autoFillFromMemory = (email: string) => {
    const client = CLIENT_MEMORY[email as keyof typeof CLIENT_MEMORY];
    if (client) {
      setQuickInvoice(prev => ({
        ...prev,
        clientName: client.name,
        clientEmail: email,
        amount: client.avgProjectValue,
        template: client.lastProject
      }));
    }
  };

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
  const draftCount = invoices.filter(inv => inv.status === 'draft').length;

  // Professional Logo Component
  const Logo = () => (
    <div className="flex items-center">
      <img 
        src={isDarkMode ? "/logowhite.png" : "/logoblack.png"} 
        alt="InvoiceFlow Logo" 
        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40"
      />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* Mobile Menu Button */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSmartAssistant(true)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Smart Assistant</span>
                  <span className="sm:hidden">Smart</span>
                </button>
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick Invoice</span>
                  <span className="sm:hidden">Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
                <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>${totalRevenue.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  +12% this month
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Payments</p>
                <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>${pendingAmount.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 mt-1 flex items-center">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {invoices.filter(inv => inv.status === 'sent').length} invoices
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl ${isDarkMode ? 'bg-orange-900' : 'bg-orange-100'}`}>
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Invoices</p>
                <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{invoices.length}</p>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {draftCount} drafts
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Clients</p>
                <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {new Set(invoices.map(inv => inv.clientName)).size}
                </p>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-1 flex items-center">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Growing network
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl ${isDarkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Smart Assistant Modal */}
        {showSmartAssistant && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl border max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Smart Invoice Assistant</h2>
                <button
                  onClick={() => setShowSmartAssistant(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        const email = 'john@acme.com';
                        autoFillFromMemory(email);
                        setShowQuickCreate(true);
                        setShowSmartAssistant(false);
                      }}
                      className={`p-4 rounded-lg transition-colors text-left ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-blue-600 mr-2" />
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Auto-Fill Client</span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Use client history to pre-fill invoice details</p>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (invoices.length > 0) {
                          createRecurringInvoice(invoices[0]);
                        }
                      }}
                      className={`p-4 rounded-lg transition-colors text-left ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 text-green-600 mr-2" />
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Set Recurring</span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Make this invoice repeat monthly</p>
                    </button>
                  </div>
                </div>

                {/* Pricing Suggestions */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Market Rates</h3>
                  <div className="space-y-3">
                    {Object.entries(SMART_PRICING).map(([service, data]) => (
                      <div key={service} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{service}</div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>${data.min}-${data.max}/hr</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 dark:text-green-400">${data.suggested}/hr</div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>suggested</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowSmartAssistant(false)}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Create Modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl p-4 sm:p-8 max-w-md w-full shadow-2xl border max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Invoice</h2>
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Client Name</label>
                    <input
                      type="text"
                      value={quickInvoice.clientName}
                      onChange={(e) => setQuickInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Client Email</label>
                    <input
                      type="email"
                      value={quickInvoice.clientEmail}
                      onChange={(e) => setQuickInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Enter client email"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Service Type</label>
                  <select
                    value={quickInvoice.template}
                    onChange={(e) => {
                      const template = QUICK_TEMPLATES.find(t => t.name === e.target.value);
                      setQuickInvoice(prev => ({ 
                        ...prev, 
                        template: e.target.value,
                        amount: template?.rate || 0
                      }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  >
                    <option value="">Select service type</option>
                    {QUICK_TEMPLATES.map(template => (
                      <option key={template.name} value={template.name}>
                        {template.name} (${template.rate}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</label>
                    <input
                      type="number"
                      value={quickInvoice.amount}
                      onChange={(e) => setQuickInvoice(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Due Date</label>
                    <input
                      type="date"
                      value={quickInvoice.dueDate}
                      onChange={(e) => setQuickInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={createQuickInvoice}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Invoice
                </button>
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        <div className={`rounded-2xl shadow-sm border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 sm:p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Recent Invoices</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Invoice
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Client
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Amount
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Due Date
                  </th>
                  <th className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'bg-gray-900 divide-gray-800' : 'bg-white divide-gray-200'}`}>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>{invoice.invoiceNumber}</div>
                      <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{invoice.createdAt}</div>
                      {/* Mobile: Show client info under invoice number */}
                      <div className="sm:hidden mt-1">
                        <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{invoice.clientName}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{invoice.clientEmail}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{invoice.clientName}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{invoice.clientEmail}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>${invoice.total.toLocaleString()}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400'
                          : invoice.status === 'sent'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400'
                          : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {invoice.status === 'sent' && <Clock className="h-3 w-3 mr-1" />}
                        {invoice.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
                        {invoice.status}
                      </span>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm hidden lg:table-cell ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {invoice.dueDate}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <button 
                          onClick={() => generatePDF(invoice)}
                          className="flex items-center space-x-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button 
                          onClick={() => sendInvoice(invoice)}
                          className="flex items-center space-x-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                        {invoice.status === 'sent' && (
                          <button 
                            onClick={() => markAsPaid(invoice)}
                            className="flex items-center space-x-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Paid</span>
                          </button>
                        )}
                        <button 
                          onClick={() => createRecurringInvoice(invoice)}
                          className="flex items-center space-x-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        >
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Recurring</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
