'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, FileText, DollarSign, Users, Calendar, Download, Send, Zap, TrendingUp, Clock, CheckCircle, AlertCircle, X, Sun, Moon, CreditCard, Building2, Mail, Eye, Edit, Trash2 } from 'lucide-react';

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
  quantity: number;
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
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients'>('dashboard');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        { id: '1', description: 'Website Development', quantity: 40, rate: 75, amount: 3000 },
        { id: '2', description: 'UI/UX Design', quantity: 20, rate: 50, amount: 1000 }
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
        { id: '3', description: 'Mobile App Development', quantity: 60, rate: 100, amount: 6000 }
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
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  // Dashboard stats
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const outstandingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const totalClients = clients.length;

  // Logo Component
  const Logo = () => (
    <div className="flex items-center">
      <Image 
        src={isDarkMode ? "/logowhite.png" : "/logoblack.png"} 
        alt="InvoiceFlow Logo" 
        width={160}
        height={160}
        className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48"
      />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-200 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
            <Logo />
            
            {/* Navigation */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-xl transition-all duration-200 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>

              {/* Create Invoice Button */}
              <button
                onClick={() => setShowCreateInvoice(true)}
                className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-13 sm:px-5 sm:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-enterprise hover:shadow-enterprise-lg font-medium text-sm sm:text-base"
              >
                <Plus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Create Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'clients'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Clients
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Dashboard Overview */}
            <div>
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Dashboard Overview
              </h2>
              <p className="mb-6" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Monitor your business performance and invoice metrics
              </p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Total Revenue</p>
                      <p className="font-heading text-3xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        ${totalRevenue.toLocaleString()}
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
                <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Outstanding</p>
                      <p className="font-heading text-3xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
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
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Overdue Invoices */}
                <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
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
                <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
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

            {/* Recent Invoices */}
            <div>
              <h2 className="font-heading text-2xl font-semibold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Recent Invoices
              </h2>
              <div className={`rounded-2xl shadow-enterprise-lg border transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'} backdrop-blur-sm`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'}>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Invoice
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Client
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {invoices.slice(0, 5).map((invoice) => (
                        <tr key={invoice.id} className={`transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="font-heading text-sm font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                                {invoice.invoiceNumber}
                              </div>
                              <div className="text-xs" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                                {invoice.createdAt}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="space-y-1">
                              <div className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                                {invoice.client.name}
                              </div>
                              <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                                {invoice.client.company}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-heading text-lg font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                              ${invoice.total.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                              invoice.status === 'paid' 
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                                : invoice.status === 'sent'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                                : invoice.status === 'overdue'
                                ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'
                                : 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300'
                            }`}>
                              {invoice.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1.5" />}
                              {invoice.status === 'sent' && <Clock className="h-3 w-3 mr-1.5" />}
                              {invoice.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1.5" />}
                              {invoice.status === 'draft' && <FileText className="h-3 w-3 mr-1.5" />}
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                            {invoice.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              <button 
                                onClick={() => setSelectedInvoice(invoice)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all duration-200 font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </button>
                              <button 
                                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all duration-200 font-medium"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                              {invoice.status !== 'paid' && (
                                <button 
                                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all duration-200 font-medium"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Send</span>
                                </button>
                              )}
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
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                All Invoices
              </h2>
              <button
                onClick={() => setShowCreateInvoice(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Invoice</span>
              </button>
            </div>
            
            {/* Invoice List */}
            <div className={`rounded-2xl shadow-enterprise-lg border transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-slate-200'} backdrop-blur-sm`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'}>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className={`transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="font-heading text-sm font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                              {invoice.createdAt}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                              {invoice.client.name}
                            </div>
                            <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                              {invoice.client.company}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-heading text-lg font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                            ${invoice.total.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            invoice.status === 'paid' 
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                              : invoice.status === 'sent'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300'
                          }`}>
                            {invoice.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1.5" />}
                            {invoice.status === 'sent' && <Clock className="h-3 w-3 mr-1.5" />}
                            {invoice.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1.5" />}
                            {invoice.status === 'draft' && <FileText className="h-3 w-3 mr-1.5" />}
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          {invoice.dueDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => setSelectedInvoice(invoice)}
                              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all duration-200 font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button 
                              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all duration-200 font-medium"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button 
                              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all duration-200 font-medium"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Send</span>
                            </button>
                            <button 
                              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500/30 transition-all duration-200 font-medium"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div key={client.id} className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                      <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
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
                    <button className="flex items-center space-x-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                      <Mail className="h-4 w-4" />
                      <span>Contact</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-2xl w-full shadow-2xl border max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Create Invoice</h2>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Client
                  </label>
                  <select className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}>
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Invoice Items
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Description"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Rate"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <button className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateInvoice(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Add Client</h2>
              <button
                onClick={() => setShowCreateClient(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Name
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Company
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateClient(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Add Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}