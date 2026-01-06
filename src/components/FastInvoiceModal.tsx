'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, DollarSign, Calendar, FileText, User, Mail, ArrowRight, ArrowLeft, Clock, CheckCircle, Send } from 'lucide-react'
import { Invoice } from '@/types'
import { useToast } from '@/hooks/useToast'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/hooks/useAuth'
import CustomDropdown from './CustomDropdown'
import UpgradeModal from './UpgradeModal'

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

interface FastInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: { id: string; email: string; name?: string }
  getAuthHeaders: () => Promise<{ [key: string]: string }>
  isDarkMode?: boolean
  clients?: Client[]
  editingInvoice?: Invoice | null
  showSuccess?: (message: string) => void
  showError?: (message: string) => void
  showWarning?: (message: string) => void
  onUpgradeNeeded?: (usage: { used: number; limit: number | null; remaining: number | null; plan: string }) => void
}

// Client interface removed - not used

export default function FastInvoiceModal({ isOpen, onClose, onSuccess, getAuthHeaders, isDarkMode = false, clients = [], editingInvoice = null, showSuccess: propShowSuccess, showError: propShowError, showWarning: propShowWarning }: FastInvoiceModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [subscriptionUsage, setSubscriptionUsage] = useState<{ used: number; limit: number | null; remaining: number | null; plan: string } | null>(null)
  const [showUpgradeContent, setShowUpgradeContent] = useState(false)
  const { user } = useAuth()
  const { showSuccess: localShowSuccess, showError: localShowError, showWarning: localShowWarning } = useToast()
  const { invoices, addInvoice, addClient, updateInvoice, refreshInvoices, clients: globalClients } = useData()
  
  // Use passed toast functions if available, otherwise use local ones
  const showSuccess = propShowSuccess || localShowSuccess
  const showError = propShowError || localShowError
  const showWarning = propShowWarning || localShowWarning

  // Use refs to store latest functions to prevent dependency issues
  const showErrorRef = useRef(showError)
  const getAuthHeadersRef = useRef(getAuthHeaders)
  
  // Update refs when values change
  useEffect(() => {
    showErrorRef.current = showError
    getAuthHeadersRef.current = getAuthHeaders
  }, [showError, getAuthHeaders])

  // Track if we're currently fetching to prevent multiple simultaneous requests
  const isFetchingRef = useRef(false)
  const hasFetchedRef = useRef(false)

  // Memoize fetchSubscriptionUsage to prevent infinite loops
  const fetchSubscriptionUsage = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }
    
    isFetchingRef.current = true
    try {
      const headers = await getAuthHeadersRef.current()
      const response = await fetch('/api/subscription/usage', {
        headers
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptionUsage(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching subscription usage:', error)
    } finally {
      isFetchingRef.current = false
    }
    return null
  }, []) // Empty deps - using refs instead
  
  // Form data
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [markAsPaid, setMarkAsPaid] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState<{
    client?: string
    clientName?: string
    clientEmail?: string
    description?: string
    amount?: string
    dueDate?: string
  }>({})

  // IMPORTANT: When "Mark as Paid" is selected, set due date to today (Due on Receipt)
  useEffect(() => {
    if (markAsPaid) {
      // Set due date to today (Due on Receipt)
      const today = new Date().toISOString().split('T')[0]
      setDueDate(today)
    }
  }, [markAsPaid])

  // Pre-fill form when editing an invoice OR reset when creating new
  useEffect(() => {
    if (isOpen) {
      if (editingInvoice) {
        // CRITICAL: Only allow editing draft invoices
        if (editingInvoice.status !== 'draft') {
          console.error('Cannot edit non-draft invoice:', editingInvoice.status);
          showError(`Cannot edit invoice: Only draft invoices can be edited. This invoice is "${editingInvoice.status}".`);
          onClose();
          return;
        }
        
        // Pre-fill form when editing an invoice
        setSelectedClientId(editingInvoice.clientId || editingInvoice.client_id || '')
        setClientName(editingInvoice.clientName || '')
        setClientEmail(editingInvoice.clientEmail || '')
        setDescription(editingInvoice.items?.[0]?.description || '')
        setAmount(editingInvoice.items?.[0]?.rate?.toString() || editingInvoice.items?.[0]?.amount?.toString() || '')
        setDueDate(editingInvoice.dueDate || '')
        setNotes(editingInvoice.notes || '')
        
        // If the client doesn't exist in the clients list, add it
        const clientId = editingInvoice.clientId || editingInvoice.client_id;
        if (clientId && editingInvoice.client && !globalClients.find(c => c.id === clientId)) {
          try { 
            addClient && addClient(editingInvoice.client);
            console.log('FastInvoiceModal: Added client to global state:', editingInvoice.client);
          } catch (e) {
            console.error('FastInvoiceModal: Error adding client:', e);
          }
        }
      } else {
        // Reset form when creating new invoice
        resetForm()
        // Set default due date after reset
        const defaultDueDate = new Date()
        defaultDueDate.setDate(defaultDueDate.getDate() + 30)
        setDueDate(defaultDueDate.toISOString().split('T')[0])
      }
    }
  }, [isOpen, editingInvoice, addClient, globalClients])

  const resetForm = () => {
    setStep(1)
    setSelectedClientId('')
    setClientName('')
    setClientEmail('')
    setDescription('')
    setAmount('')
    setDueDate('')
    setNotes('')
    setMarkAsPaid(false)
    setErrors({})
  }
  
  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Client validation
    if (!selectedClientId) {
      if (!clientName || !clientName.trim()) {
        newErrors.clientName = 'Client name is required'
      }
      if (!clientEmail || !clientEmail.trim()) {
        newErrors.clientEmail = 'Client email is required'
      } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(clientEmail.trim())) {
          newErrors.clientEmail = 'Please enter a valid email address'
        }
      }
    }
    
    // Description validation
    if (!description || !description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    // Amount validation
    if (!amount || !amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Please enter a valid amount greater than 0'
      }
    }
    
    // Due date validation
    if (!dueDate || !dueDate.trim()) {
      newErrors.dueDate = 'Due date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    resetForm()
    setShowUpgradeContent(false)
    setShowUpgradeModal(false)
    onClose()
  }

  const handleCreateInvoice = async (showToast = true, isSending = false) => {
    // Validate form before proceeding
    if (!validateForm()) {
      showError('Please fill in all required fields correctly')
      return
    }

    // Show loading state immediately for better UX
    if (!isSending) {
      setLoading(true)
    }

    // Check subscription limit BEFORE creating invoice (only for new invoices, not editing)
    if (!editingInvoice) {
      const usageData = await fetchSubscriptionUsage()
      if (usageData && usageData.plan === 'free' && usageData.limit && usageData.used >= usageData.limit) {
        if (!isSending) {
          setLoading(false)
        }
        showError('You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.')
        // Show upgrade content instead of closing modal (better UX - no modal stacking)
        setShowUpgradeContent(true)
        setSubscriptionUsage(usageData)
        return
      }
    }

    try {
      // Parse description for smart defaults
      const parsedDescription = description.trim()
      const parsedAmount = parseFloat(amount) || 0
      
      // Handle client - either selected or new
      let clientId = null
      if (selectedClientId) {
        clientId = selectedClientId
      } else if (clientName && clientEmail) {
        const headers = await getAuthHeaders()
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clientName,
            email: clientEmail
          })
        })
        const clientData = await clientResponse.json()
        clientId = clientData.client.id
        // update global clients cache
        try { addClient && addClient(clientData.client) } catch {}
      }

      // Create or update invoice
      const headers = await getAuthHeaders()
      
      // Determine if we're editing or creating
      const isEditing = editingInvoice && editingInvoice.id
      const endpoint = isEditing ? '/api/invoices/update' : '/api/invoices/create'
      const method = isEditing ? 'PUT' : 'POST'
      
      const payload = {
        client_id: clientId,
        items: [{
          description: parsedDescription,
          rate: parsedAmount,
          line_total: parsedAmount
        }],
        due_date: dueDate,
        notes: notes,
        billing_choice: 'per_invoice',
        type: 'fast', // Mark as fast invoice
        status: isEditing ? editingInvoice.status : (markAsPaid ? 'paid' : 'draft') // Allow marking as paid during creation
      }
      
      // Add invoice ID to payload if editing
      if (isEditing) {
        (payload as any).invoiceId = editingInvoice.id
      }
      
      const invoiceResponse = await fetch(endpoint, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (invoiceResponse.ok) {
        const result = await invoiceResponse.json()
        if (showToast) {
          showSuccess(isEditing ? 'Invoice updated successfully!' : 'Invoice created successfully!')
          // update global invoices cache immediately
          if (isEditing) {
            try { updateInvoice && updateInvoice(result.invoice) } catch {}
          } else {
            try { addInvoice && addInvoice(result.invoice) } catch {}
          }
          onSuccess()
          onClose()
          resetForm()
        } else {
          // For create & send, don't close yet
          return result.invoice
        }
        return result.invoice
      } else {
        const errorData = await invoiceResponse.json().catch(() => ({}))
        // Check if it's a subscription limit error
        if (invoiceResponse.status === 403 && errorData.limitReached) {
          showError(errorData.error || 'Subscription limit reached')
          setShowUpgradeModal(true)
          // Refresh usage
          await fetchSubscriptionUsage()
          throw new Error('LIMIT_REACHED')
        }
        throw new Error(errorData.error || (editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice'))
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      showError(editingInvoice ? 'Failed to update invoice. Please try again.' : 'Failed to create invoice. Please try again.')
    } finally {
      if (!isSending) {
        setLoading(false)
      }
    }
  }

  const handleCreateAndSend = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      showError('Please fill in all required fields correctly')
      return
    }

    // Show loading state immediately for better UX
    setSendLoading(true)

    // Check subscription limit BEFORE creating invoice (only for new invoices, not editing)
    if (!editingInvoice) {
      const usageData = await fetchSubscriptionUsage()
      if (usageData && usageData.plan === 'free' && usageData.limit && usageData.used >= usageData.limit) {
        setSendLoading(false)
        showError('You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.')
        // Show upgrade content instead of closing modal (better UX - no modal stacking)
        setShowUpgradeContent(true)
        setSubscriptionUsage(usageData)
        return
      }
    }

    try {
      // Determine if we're editing or creating
      const isEditing = editingInvoice && editingInvoice.id
      
      // First create the invoice (without showing toast or loading state)
      const invoice = await handleCreateInvoice(false, true)
      
      if (invoice) {
        // Then send it
        const headers = await getAuthHeaders()
        // Resolve client email/name safely
        const selected = selectedClientId ? clients.find(c => c.id === selectedClientId) : undefined
        const finalClientEmail = (selected?.email || clientEmail || '').trim()
        const finalClientName = (selected?.name || clientName || '').trim()

        if (!finalClientEmail) {
          showWarning('Client email is required to send the invoice')
          try { addInvoice && addInvoice(invoice) } catch {}
          return
        }

        const sendResponse = await fetch('/api/invoices/send', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientEmail: finalClientEmail,
            clientName: finalClientName
          })
        })

        if (sendResponse.ok) {
          // Prefer server-provided updated invoice if present
          try { const payload = await sendResponse.json(); if (payload?.invoice) { try { updateInvoice && updateInvoice(payload.invoice) } catch {} } } catch {}
          const existing = invoices.find(inv => inv.id === invoice.id)
          if (existing) {
            try { updateInvoice && updateInvoice({ ...existing, status: 'sent' as const }) } catch {}
          } else {
            try { updateInvoice && updateInvoice({ ...invoice, status: 'sent' as const }) } catch {}
          }
          try { await refreshInvoices?.() } catch {}
          showSuccess('Invoice created and sent successfully!')
        } else {
          let errorMsg = 'Invoice created but failed to send. You can send it later from the invoice list.'
          try { const err = await sendResponse.json(); if (err?.error) errorMsg = err.error } catch {}
          showWarning(errorMsg)
        }
        
        // update global invoices cache
        if (isEditing) {
          // Preserve 'sent' status when we just sent the invoice
          const updated = sendLoading ? { ...invoice, status: 'sent' as const } : invoice
          try { updateInvoice && updateInvoice(updated) } catch {}
        } else {
          try { addInvoice && addInvoice(invoice) } catch {}
        }

        onSuccess()
        onClose()
        resetForm()
      }
    } catch (error) {
      console.error('Error creating and sending invoice:', error)
      showError('Failed to create and send invoice. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // This will be handled by the individual buttons
  }


  if (!isOpen) return null

  // Show upgrade content instead of invoice form when limit is reached
  if (showUpgradeContent && subscriptionUsage) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="shadow-2xl max-w-2xl w-full overflow-hidden bg-white">
          {/* Upgrade Modal Content - Inline to avoid double backdrop */}
          <div className="bg-white border border-gray-200 max-w-2xl w-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-semibold" style={{color: '#1f2937'}}>
                  Upgrade Your Plan
                </h3>
                <p className="text-sm text-gray-600 mt-1">You've reached your monthly invoice limit. Upgrade to create unlimited invoices.</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Usage Info for Free Plan */}
            {subscriptionUsage.plan === 'free' && subscriptionUsage.limit && (
              <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Invoices this month</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {subscriptionUsage.used} / {subscriptionUsage.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div 
                    className={`h-2 transition-all ${
                      subscriptionUsage.used >= subscriptionUsage.limit 
                        ? 'bg-red-500' 
                        : subscriptionUsage.used >= subscriptionUsage.limit * 0.8
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (subscriptionUsage.used / subscriptionUsage.limit) * 100)}%` }}
                  />
                </div>
                {subscriptionUsage.used >= subscriptionUsage.limit && (
                  <p className="text-xs text-red-600 mt-2">You've reached your monthly limit. Upgrade to create unlimited invoices.</p>
                )}
              </div>
            )}

            {/* Plans */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Plan */}
                <div className="border border-gray-200 hover:border-gray-300 p-4 sm:p-5 transition-colors">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-heading text-base font-semibold text-gray-900">Monthly</h4>
                      <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-0.5">Popular</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-heading text-2xl font-semibold text-gray-900">$9</span>
                      <span className="text-sm text-gray-600">/month</span>
                    </div>
                    <p className="text-xs text-gray-500">Best for regular users</p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Unlimited invoices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">All premium features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Automated reminders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Priority support</span>
                    </li>
                  </ul>
                  <button
                    onClick={async () => {
                      if (!user) return
                      setLoading(true)
                      try {
                        const headers = await getAuthHeaders()
                        const response = await fetch('/api/subscription', {
                          method: 'PUT',
                          headers: { ...headers, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ plan: 'monthly' }),
                        })
                        if (!response.ok) {
                          const error = await response.json()
                          throw new Error(error.error || 'Failed to update subscription')
                        }
                        showSuccess('Successfully upgraded to Monthly plan!')
                        handleClose()
                        window.location.reload()
                      } catch (error: any) {
                        showError(error.message || 'Failed to upgrade. Please try again.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading || subscriptionUsage.plan === 'monthly'}
                    className={`w-full px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      subscriptionUsage.plan === 'monthly'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                    }`}
                  >
                    {loading ? 'Processing...' : subscriptionUsage.plan === 'monthly' ? 'Current Plan' : (
                      <>Upgrade to Monthly<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                {/* Pay Per Invoice Plan */}
                <div className="border border-gray-200 hover:border-gray-300 p-4 sm:p-5 transition-colors">
                  <div className="mb-4">
                    <h4 className="font-heading text-base font-semibold text-gray-900 mb-2">Pay Per Invoice</h4>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-heading text-2xl font-semibold text-gray-900">$0.50</span>
                      <span className="text-sm text-gray-600">/invoice sent</span>
                    </div>
                    <p className="text-xs text-gray-500">Pay only for what you use</p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">No monthly fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Unlimited invoices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">All premium features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Only pay when you send</span>
                    </li>
                  </ul>
                  <button
                    onClick={async () => {
                      if (!user) return
                      setLoading(true)
                      try {
                        const headers = await getAuthHeaders()
                        const response = await fetch('/api/subscription', {
                          method: 'PUT',
                          headers: { ...headers, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ plan: 'pay_per_invoice' }),
                        })
                        if (!response.ok) {
                          const error = await response.json()
                          throw new Error(error.error || 'Failed to update subscription')
                        }
                        showSuccess('Successfully upgraded to Pay Per Invoice plan!')
                        handleClose()
                        window.location.reload()
                      } catch (error: any) {
                        showError(error.message || 'Failed to upgrade. Please try again.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading || subscriptionUsage.plan === 'pay_per_invoice'}
                    className={`w-full px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      subscriptionUsage.plan === 'pay_per_invoice'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                    }`}
                  >
                    {loading ? 'Processing...' : subscriptionUsage.plan === 'pay_per_invoice' ? 'Current Plan' : (
                      <>Choose Pay Per Invoice<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`shadow-2xl max-w-md w-full overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 ${
              isDarkMode 
                ? 'bg-indigo-500/20' 
                : 'bg-indigo-50'
            }`}>
              <Clock className={`h-5 w-5 ${
                isDarkMode 
                  ? 'text-indigo-400' 
                  : 'text-indigo-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Quick Invoice
              </h2>
              <p className={`text-xs ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }`}>
                Create invoice in 60 seconds
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`transition-colors p-1.5 cursor-pointer ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">1</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>Client</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-medium">2</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Details</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className={`text-base font-semibold mb-1 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>Who are you billing?</h3>
                <p className={`text-xs ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
                }`}>Select an existing client or add a new one</p>
              </div>

              <div className="space-y-4">
                {/* Client Selection */}
                {selectedClientId ? (
                  <div className={`p-4 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-indigo-600' : 'bg-indigo-100'
                        }`}>
                          <User className={`h-4 w-4 ${
                            isDarkMode ? 'text-white' : 'text-indigo-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {clients.find(c => c.id === selectedClientId)?.name}
                          </p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {clients.find(c => c.id === selectedClientId)?.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid="clear-client-selection"
                        onClick={() => setSelectedClientId('')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                          isDarkMode 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.length > 0 && (
                      <div>
                        <CustomDropdown
                          value={selectedClientId}
                          onChange={(value) => setSelectedClientId(value)}
                          options={[
                            ...clients.map(client => ({
                              value: client.id,
                              label: `${client.name}${client.company ? ` (${client.company})` : ''}`
                            })),
                            // Show current client even if not in clients list
                            ...(selectedClientId && !clients.find(c => c.id === selectedClientId) && editingInvoice?.client
                              ? [{
                                  value: selectedClientId,
                                  label: `${editingInvoice.client.name}${editingInvoice.client.company ? ` (${editingInvoice.client.company})` : ''}`
                                }]
                              : [])
                          ]}
                          placeholder="Select existing client"
                          isDarkMode={isDarkMode}
                          searchable={false}
                        />
                      </div>
                    )}

                    {clients.length > 0 && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className={`w-full border-t ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`} />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className={`px-2 ${
                            isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'
                          }`}>or add new</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => {
                              setClientName(e.target.value)
                              if (errors.clientName) {
                                setErrors(prev => ({ ...prev, clientName: undefined }))
                              }
                            }}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              errors.clientName
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : isDarkMode 
                                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder="Client name"
                            required={!selectedClientId}
                          />
                        </div>
                        {errors.clientName && (
                          <p className="mt-1 text-xs text-red-600">{errors.clientName}</p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => {
                              setClientEmail(e.target.value)
                              if (errors.clientEmail) {
                                setErrors(prev => ({ ...prev, clientEmail: undefined }))
                              }
                            }}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              errors.clientEmail
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : isDarkMode 
                                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder="client@example.com"
                            required={!selectedClientId}
                          />
                        </div>
                        {errors.clientEmail && (
                          <p className="mt-1 text-xs text-red-600">{errors.clientEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                data-testid="fast-invoice-next-step"
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-none hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">1</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>Client</span>
                </div>
                <div className="w-8 h-0.5 bg-indigo-600"></div>
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">2</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>Details</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className={`text-base font-semibold mb-1 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>What are you billing for?</h3>
                <p className={`text-xs ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
                }`}>Enter the service details and amount</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 h-4 w-4 ${
                      isDarkMode 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
                    }`} />
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value)
                        if (errors.description) {
                          setErrors(prev => ({ ...prev, description: undefined }))
                        }
                      }}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                        errors.description
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : isDarkMode 
                            ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Describe the work or service provided"
                      rows={3}
                      required
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode 
                          ? 'text-gray-500' 
                          : 'text-gray-400'
                      }`} />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value)
                          if (errors.amount) {
                            setErrors(prev => ({ ...prev, amount: undefined }))
                          }
                        }}
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.amount
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : isDarkMode 
                              ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode 
                          ? 'text-gray-500' 
                          : 'text-gray-400'
                      }`} />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => {
                          if (!markAsPaid) {
                            setDueDate(e.target.value)
                            if (errors.dueDate) {
                              setErrors(prev => ({ ...prev, dueDate: undefined }))
                            }
                          }
                        }}
                        disabled={markAsPaid}
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          markAsPaid ? 'cursor-not-allowed opacity-60' : ''
                        } ${
                          errors.dueDate
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : isDarkMode 
                              ? 'border-gray-700 bg-gray-800 text-white' 
                              : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </div>
                    {errors.dueDate ? (
                      <p className="text-xs mt-1 text-red-600">{errors.dueDate}</p>
                    ) : (
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Due Date {markAsPaid && <span className="text-orange-600">(Locked - Due on Receipt)</span>}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                      isDarkMode 
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Payment terms, additional details... (optional)"
                    rows={2}
                  />
                </div>

                {/* Mark as Paid Option */}
                <div className={`p-4 border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800/50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markAsPaid}
                      onChange={(e) => setMarkAsPaid(e.target.checked)}
                      className={`mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'
                      }`}
                    />
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Mark as Paid
                      </span>
                      <p className={`text-xs mt-0.5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Use this if payment was already received. You can still send the invoice to the client.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  data-testid="fast-invoice-back-step"
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 px-6 rounded-none transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                {/* Hide "Create" button when markAsPaid is true */}
                {!markAsPaid && (
                  <button
                    type="button"
                    data-testid="fast-invoice-create-and-send"
                    onClick={() => handleCreateInvoice(true)}
                    disabled={loading || sendLoading}
                    className={`flex-1 px-3 py-2 rounded-none transition-colors font-medium flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer ${
                      isDarkMode 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    <span>{loading ? 'Creating...' : 'Create'}</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="fast-invoice-create-draft"
                  onClick={handleCreateAndSend}
                  disabled={loading || sendLoading}
                  className={`flex-1 ${markAsPaid ? 'sm:flex-1' : ''} px-3 py-2 transition-colors font-medium flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {sendLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  <span>{sendLoading ? 'Sending...' : (markAsPaid ? 'Create & Send Receipt' : 'Create & Send')}</span>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* Upgrade Modal - Fallback if no parent callback provided */}
      {typeof window !== 'undefined' && showUpgradeModal && createPortal(
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            // Refresh usage after modal closes in case user upgraded
            if (!editingInvoice && user) {
              fetchSubscriptionUsage()
            }
          }}
          currentPlan={subscriptionUsage?.plan as 'free' | 'monthly' | 'pay_per_invoice' || 'free'}
          usage={subscriptionUsage ? {
            used: subscriptionUsage.used,
            limit: subscriptionUsage.limit,
            remaining: subscriptionUsage.remaining
          } : undefined}
          reason="You've reached your monthly invoice limit. Upgrade to create unlimited invoices."
        />,
        document.body
      )}
    </div>
  )
}
