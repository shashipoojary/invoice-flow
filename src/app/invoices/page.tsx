'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Plus, Eye, CheckCircle, Clock, AlertCircle, FileText, Loader2, Download, Send, Edit, Calendar, User, Building2, DollarSign } from 'lucide-react'
import ToastContainer from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  client_id: string
  client?: {
    name: string
    email: string
    company?: string
  }
  subtotal: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  created_at: string
  notes?: string
  invoice_items?: InvoiceItem[]
  public_token?: string
}

interface InvoiceItem {
  id: string
  description: string
  rate: number
  line_total: number
}

export default function InvoicesPage() {
  const { user, loading: authLoading, getAuthHeaders } = useAuth()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false)
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null)
  
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Fetch invoices from API
  const fetchInvoices = useCallback(async () => {
    if (!user || authLoading) return
    
    setIsLoadingInvoices(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices', {
        headers,
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      showError('Load Failed', 'Failed to load invoices. Please try again.')
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [user, authLoading, getAuthHeaders, showError])

  useEffect(() => {
    // Check dark mode - use same key as main app
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Load data when user is authenticated
  useEffect(() => {
    if (user && !authLoading && !hasLoadedData) {
      setHasLoadedData(true)
      fetchInvoices()
    }
  }, [user, authLoading, hasLoadedData, fetchInvoices])

  // Auto-refresh data when window regains focus (for cross-device sync)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !authLoading && hasLoadedData) {
        setTimeout(() => {
          fetchInvoices()
        }, 500)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, authLoading, hasLoadedData, fetchInvoices])

  // Periodic data refresh for cross-device synchronization (every 30 seconds)
  useEffect(() => {
    if (!user || authLoading || !hasLoadedData) return

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchInvoices()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, authLoading, hasLoadedData, fetchInvoices])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border border-green-200 dark:border-green-700'
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-200 dark:border-red-700'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
    }
  }

  const markAsPaid = async (invoiceId: string) => {
    const originalInvoices = [...invoices]
    setIsUpdatingInvoice(true)
    setUpdatingInvoiceId(invoiceId)
    
    try {
      // Optimistic update
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: 'paid' as const }
          : invoice
      ))

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'paid' })
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice status')
      }

      // Refresh data from server to ensure synchronization
      await fetchInvoices()
      showSuccess('Invoice Updated', 'Invoice marked as paid successfully.')
    } catch (error) {
      console.error('Error updating invoice:', error)
      
      // Rollback optimistic update
      setInvoices(originalInvoices)
      showError('Update Failed', 'Failed to mark invoice as paid. Please try again.')
    } finally {
      setIsUpdatingInvoice(false)
      setUpdatingInvoiceId(null)
    }
  }

  const viewInvoice = (invoice: Invoice) => {
    // Use public_token for viewing invoice
    router.push(`/invoice/${invoice.public_token || invoice.id}`)
  }

  if (authLoading || isLoadingInvoices) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {authLoading ? 'Authenticating...' : 'Loading invoices...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-200 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Invoices
              </h1>
            </div>
            <button
              onClick={() => router.push('/invoices/new')}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              No invoices yet
            </h3>
            <p className="mb-6" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              Create your first invoice to get started
            </p>
            <button
              onClick={() => router.push('/invoices/new')}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className={`rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/70 border-gray-200'} backdrop-blur-sm ${isUpdatingInvoice && updatingInvoiceId === invoice.id ? 'opacity-75' : ''}`}>
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                            {invoice.invoice_number}
                          </h3>
                          <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                            Invoice
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center justify-start">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="capitalize">{invoice.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        ${invoice.total_amount.toFixed(2)}
                      </div>
                      <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                        Total Amount
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Client Information */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                      <span className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Client
                      </span>
                    </div>
                    <div className="ml-6">
                      <p className="font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                        {invoice.client?.name || 'Unknown Client'}
                      </p>
                      {invoice.client?.company && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Building2 className="h-3 w-3" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                          <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                            {invoice.client.company}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Information */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                      <span className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        Dates
                      </span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                          Issued:
                        </span>
                        <span className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          {new Date(invoice.issue_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                          Due:
                        </span>
                        <span className={`text-sm font-medium ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-red-500' : ''}`}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => viewInvoice(invoice)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    
                    <button
                      onClick={() => {/* PDF download functionality */}}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      <span>PDF</span>
                    </button>
                    
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => markAsPaid(invoice.id)}
                        disabled={isUpdatingInvoice && updatingInvoiceId === invoice.id}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isUpdatingInvoice && updatingInvoiceId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span>
                          {isUpdatingInvoice && updatingInvoiceId === invoice.id ? 'Updating...' : 'Mark Paid'}
                        </span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {/* Send functionality */}}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  )
}
