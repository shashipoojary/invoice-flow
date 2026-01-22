'use client'

import { useState, useEffect, useCallback, useRef, useMemo, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, DollarSign, Calendar, FileText, User, Mail, ArrowRight, ArrowLeft, Clock, CheckCircle, Send, Settings } from 'lucide-react'
import { Invoice } from '@/types'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/contexts/SettingsContext'
import CustomDropdown from './CustomDropdown'
import UpgradeModal from './UpgradeModal'
import ConfirmationModal from './ConfirmationModal'
import ToastContainer from './Toast'
import { checkMissingBusinessDetails } from '@/lib/utils'

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
  const createButtonRef = useRef<HTMLButtonElement>(null) // Ref to directly update button state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [subscriptionUsage, setSubscriptionUsage] = useState<{ used: number; limit: number | null; remaining: number | null; plan: string; payPerInvoice?: { freeInvoicesRemaining: number }; clients?: { used: number; limit: number | null; remaining: number | null } } | null>(null)
  const [showUpgradeContent, setShowUpgradeContent] = useState(false)
  const [showMissingDetailsWarning, setShowMissingDetailsWarning] = useState(false)
  const [showChargeConfirmation, setShowChargeConfirmation] = useState(false)
  const [pendingInvoiceCreation, setPendingInvoiceCreation] = useState<{ showToast: boolean; isSending: boolean } | null>(null)
  
  const router = useRouter()
  const { user } = useAuth()
  const { toasts: localToasts, removeToast: localRemoveToast, showSuccess: localShowSuccess, showError: localShowError, showWarning: localShowWarning } = useToast()
  const { invoices, addInvoice, addClient, updateInvoice, refreshInvoices, clients: globalClients } = useData()
  const { settings } = useSettings()

  // Check for missing business details
  const missingDetails = useMemo(() => {
    return checkMissingBusinessDetails(settings);
  }, [settings]);
  const hasMissingDetails = missingDetails.missing.length > 0;
  
  // Use passed toast functions if available, otherwise use local ones
  // Wrap showError to handle both prop signature (message only) and hook signature (title, message)
  const showError = useCallback((title: string, message?: string) => {
    if (propShowError) {
      // Prop expects just message, so combine title and message
      propShowError(message ? `${title}: ${message}` : title)
    } else {
      // Hook expects (title, message)
      localShowError(title, message)
    }
  }, [propShowError, localShowError])
  
  const showSuccess = propShowSuccess || localShowSuccess
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
          // Only show error if we're actually trying to edit (not a stale state issue)
          // If the invoice was just created and is "sent", silently clear it and continue as new invoice
          if (editingInvoice.status === 'sent' || editingInvoice.status === 'paid') {
            // This is likely a stale state - clear it and continue as new invoice
            console.log('Clearing stale editingInvoice with status:', editingInvoice.status);
            // Reset form for new invoice instead of showing error
            resetForm();
            return;
          }
          showError('Cannot Edit Invoice', `Only draft invoices can be edited. This invoice is "${editingInvoice.status}".`);
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

  // Save form state to localStorage before redirecting to payment
  const saveFormState = () => {
    const formState = {
      selectedClientId,
      clientName,
      clientEmail,
      clientCompany,
      clientPhone,
      clientAddress,
      invoiceNumber,
      issueDate,
      description,
      amount,
      dueDate,
      notes,
      markAsPaid,
      step,
      timestamp: Date.now()
    }
    localStorage.setItem('pending_invoice_form', JSON.stringify(formState))
    console.log('💾 Form state saved to localStorage')
  }

  // Restore form state from localStorage
  const restoreFormState = () => {
    try {
      const savedState = localStorage.getItem('pending_invoice_form')
      if (savedState) {
        const formState = JSON.parse(savedState)
        // Only restore if saved within last 30 minutes
        if (Date.now() - formState.timestamp < 30 * 60 * 1000) {
          setSelectedClientId(formState.selectedClientId || '')
          setClientName(formState.clientName || '')
          setClientEmail(formState.clientEmail || '')
          setClientCompany(formState.clientCompany || '')
          setClientPhone(formState.clientPhone || '')
          setClientAddress(formState.clientAddress || '')
          setInvoiceNumber(formState.invoiceNumber || '')
          setIssueDate(formState.issueDate || '')
          setDescription(formState.description || '')
          setAmount(formState.amount || '')
          setDueDate(formState.dueDate || '')
          setNotes(formState.notes || '')
          setMarkAsPaid(formState.markAsPaid || false)
          setStep(formState.step || 1)
          console.log('✅ Form state restored from localStorage')
          return true
        } else {
          // Clear expired state
          localStorage.removeItem('pending_invoice_form')
        }
      }
    } catch (error) {
      console.error('Error restoring form state:', error)
    }
    return false
  }

  // Check for pending form state on mount
  useEffect(() => {
    if (isOpen && !editingInvoice) {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('restore_invoice') === 'true') {
        const restored = restoreFormState()
        if (restored) {
          showSuccess('Welcome back! Your invoice form has been restored. You can now continue creating your invoice.')
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname)
        }
      }
    }
  }, [isOpen, editingInvoice])

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
    // Only reset form if not editing and upgrade content not shown
    // This preserves form state when user closes upgrade modal
    if (!showUpgradeContent && !editingInvoice) {
      resetForm()
    }
    setShowUpgradeContent(false)
    setShowUpgradeModal(false)
    setSubscriptionUsage(null)
    onClose()
  }

  const handleCreateInvoice = async (showToast = true, isSending = false) => {
    // Set loading state IMMEDIATELY - this is critical to prevent fade
    if (!isSending) {
      setLoading(true)
    }
    
    // Validate form AFTER loading state is set
    // Defer setErrors to prevent it from blocking the loading state render
    const validationErrors: typeof errors = {}
    
    // Client validation
    if (!selectedClientId) {
      if (!clientName || !clientName.trim()) {
        validationErrors.clientName = 'Client name is required'
      }
      if (!clientEmail || !clientEmail.trim()) {
        validationErrors.clientEmail = 'Client email is required'
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(clientEmail.trim())) {
          validationErrors.clientEmail = 'Please enter a valid email address'
        }
      }
    }
    
    // Description validation
    if (!description || !description.trim()) {
      validationErrors.description = 'Description is required'
    }
    
    // Amount validation
    if (!amount || !amount.trim()) {
      validationErrors.amount = 'Amount is required'
    } else {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        validationErrors.amount = 'Please enter a valid amount greater than 0'
      }
    }
    
    // Due date validation
    if (!dueDate || !dueDate.trim()) {
      validationErrors.dueDate = 'Due date is required'
    }
    
    // Defer setErrors to next tick to prevent blocking render
    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => {
        setErrors(validationErrors)
        if (!isSending) {
          setLoading(false)
        }
      }, 0)
      showError('Validation Error', 'Please fill in all required fields correctly')
      return
    }
    
    // Clear errors if validation passes (defer to avoid blocking)
    setTimeout(() => setErrors({}), 0)

    // Check subscription limit BEFORE creating invoice (only for new invoices, not editing)
    // IMPORTANT: For fast invoices, check free plan monthly limit FIRST, then pay_per_invoice free invoices
    if (!editingInvoice) {
      const usageData = await fetchSubscriptionUsage()
      
      if (!usageData) {
        // If we can't fetch usage data, allow creation (fail open)
        // Continue to invoice creation
      } else {
        // CRITICAL: Monthly plan users have unlimited invoices - skip all limit checks
        if (usageData.plan === 'monthly') {
          // Monthly plan: No restrictions, allow creation
          // Continue to invoice creation
        } else {
          // Step 1: Check free plan monthly limit (5 invoices/month) - ALWAYS check this first for fast invoices
          const freePlanLimit = 5 // Free plan always has 5 invoices/month limit
          
          // Calculate monthly invoice count (for current month)
          let freePlanUsed = 0
          if (usageData.plan === 'free' && usageData.limit !== null) {
            // User is on free plan - use the provided monthly count
            freePlanUsed = usageData.used || 0
          } else if (usageData.plan === 'pay_per_invoice') {
            // For pay_per_invoice, we'll check monthly limit by making a direct query
            // But to keep it simple, we'll check pay_per_invoice free invoices after this
            // For now, assume monthly limit might be available (we'll check pay_per_invoice next)
            freePlanUsed = 0 // Will check pay_per_invoice free invoices below
          }
          
          const freePlanRemaining = Math.max(0, freePlanLimit - freePlanUsed)
          
          if (freePlanRemaining > 0) {
            // Free plan monthly limit available - use it (no charge)
            // Continue to invoice creation
          } else {
            // Free plan monthly limit exhausted - check pay_per_invoice free invoices
            if (usageData.plan === 'pay_per_invoice' && usageData.payPerInvoice) {
              const payPerInvoiceFreeRemaining = usageData.payPerInvoice.freeInvoicesRemaining || 0
              
              if (payPerInvoiceFreeRemaining > 0) {
                // Pay per invoice free invoices available - use them (no charge)
                // Continue to invoice creation
              } else {
                // Both free plan monthly limit and pay_per_invoice free invoices exhausted - show charge confirmation
                if (!isSending) {
                  setLoading(false)
                }
                setSubscriptionUsage(usageData)
                setPendingInvoiceCreation({ showToast, isSending })
                setShowChargeConfirmation(true)
                return // Wait for user confirmation
              }
            } else {
              // Not on pay_per_invoice plan and free monthly limit exhausted - show upgrade modal
              if (!isSending) {
                setLoading(false)
              }
              showError('Invoice Limit Reached', 'You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.')
              // Show upgrade modal
              setShowUpgradeContent(true)
              setShowUpgradeModal(true)
              setSubscriptionUsage(usageData)
              return
            }
          }
        }
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
        try {
          const headers = await getAuthHeaders()
          const clientResponse = await fetch('/api/clients', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientName,
              email: clientEmail
            })
          })
          
          if (!clientResponse.ok) {
            let errorMessage = 'Failed to create client'
            let limitReached = false
            let limitType = 'clients'
            
            try {
              const errorData = await clientResponse.json()
              errorMessage = errorData.error || errorMessage
              limitReached = errorData.limitReached || false
              limitType = errorData.limitType || 'clients'
            } catch (parseError) {
              // If JSON parsing fails, use status text
              errorMessage = `Failed to create client: ${clientResponse.statusText || 'Unknown error'}`
            }
            
            // If client limit reached, show error toast
            if (clientResponse.status === 403 && limitReached) {
              if (!isSending) {
                setLoading(false)
              }
              showError('Client Limit Reached', errorMessage)
              return
            }
            
            // Other errors
            if (!isSending) {
              setLoading(false)
            }
            showError('Error', errorMessage)
            return
          }
          
          const clientData = await clientResponse.json()
          if (clientData.client && clientData.client.id) {
            clientId = clientData.client.id
            // update global clients cache
            try { addClient && addClient(clientData.client) } catch {}
          } else {
            if (!isSending) {
              setLoading(false)
            }
            showError('Error', 'Failed to create client: Invalid response from server')
            return
          }
        } catch (fetchError: any) {
          if (!isSending) {
            setLoading(false)
          }
          showError('Error', `Failed to create client: ${fetchError.message || 'Network error'}`)
          return
        }
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
          showError('Limit Reached', errorData.error || 'Subscription limit reached')
          setShowUpgradeModal(true)
          // Refresh usage
          await fetchSubscriptionUsage()
          throw new Error('LIMIT_REACHED')
        }
        throw new Error(errorData.error || (editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice'))
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      showError('Error', editingInvoice ? 'Failed to update invoice. Please try again.' : 'Failed to create invoice. Please try again.')
    } finally {
      if (!isSending) {
        setLoading(false)
      }
    }
  }

  const handleCreateAndSend = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields correctly')
      return
    }

    // Show loading state immediately for better UX
    setSendLoading(true)

    // Check subscription limit BEFORE creating invoice (only for new invoices, not editing)
    // IMPORTANT: For fast invoices, check free plan limit FIRST, then pay_per_invoice free invoices
    if (!editingInvoice) {
      const usageData = await fetchSubscriptionUsage()
      
      if (!usageData) {
        // If we can't fetch usage data, allow creation (fail open)
        // Continue to invoice creation
      } else {
        // CRITICAL: Monthly plan users have unlimited invoices - skip all limit checks
        if (usageData.plan === 'monthly') {
          // Monthly plan: No restrictions, allow creation
          // Continue to invoice creation
        } else {
          // Step 1: Check free plan monthly limit (5 invoices/month) - ALWAYS check this first for fast invoices
          const freePlanLimit = 5 // Free plan always has 5 invoices/month limit
          
          // Calculate monthly invoice count (for current month)
          let freePlanUsed = 0
          if (usageData.plan === 'free' && usageData.limit !== null) {
            // User is on free plan - use the provided monthly count
            freePlanUsed = usageData.used || 0
          } else if (usageData.plan === 'pay_per_invoice') {
            // For pay_per_invoice, we'll check monthly limit by making a direct query
            // But to keep it simple, we'll check pay_per_invoice free invoices after this
            // For now, assume monthly limit might be available (we'll check pay_per_invoice next)
            freePlanUsed = 0 // Will check pay_per_invoice free invoices below
          }
          
          const freePlanRemaining = Math.max(0, freePlanLimit - freePlanUsed)
          
          if (freePlanRemaining > 0) {
            // Free plan monthly limit available - use it (no charge)
            // Continue to invoice creation
          } else {
            // Free plan monthly limit exhausted - check pay_per_invoice free invoices
            if (usageData.plan === 'pay_per_invoice' && usageData.payPerInvoice) {
              const payPerInvoiceFreeRemaining = usageData.payPerInvoice.freeInvoicesRemaining || 0
              
              if (payPerInvoiceFreeRemaining > 0) {
                // Pay per invoice free invoices available - use them (no charge)
                // Continue to invoice creation
              } else {
                // Both free plan and pay_per_invoice free invoices exhausted - show charge confirmation
                setSendLoading(false)
                setSubscriptionUsage(usageData)
                setPendingInvoiceCreation({ showToast: true, isSending: true })
                setShowChargeConfirmation(true)
                return // Wait for user confirmation
              }
            } else {
              // Not on pay_per_invoice plan and free limit exhausted - show upgrade modal
              setSendLoading(false)
              showError('Invoice Limit Reached', 'You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.')
              // Show upgrade modal
              setShowUpgradeContent(true)
              setShowUpgradeModal(true)
              setSubscriptionUsage(usageData)
              return
            }
          }
        }
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

        // Check for missing business details (should already be checked in UI, but double-check)
        const { checkMissingBusinessDetails } = await import('@/lib/utils');
        const missingDetailsCheck = checkMissingBusinessDetails(settings);
        if (missingDetailsCheck.missing.length > 0 && !showMissingDetailsWarning) {
          // This shouldn't happen if UI is working correctly, but handle it
          setShowMissingDetailsWarning(true);
          setSendLoading(false);
          try { addInvoice && addInvoice(invoice) } catch {}
          return;
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
          const payload = await sendResponse.json();
          
          // Always use server response invoice data if available (most accurate)
          // This prevents flickering and ensures correct data immediately
          if (payload?.invoice) {
            // Map the invoice to match frontend format
            const mappedInvoice = {
              ...payload.invoice,
              invoiceNumber: payload.invoice.invoice_number || payload.invoice.invoiceNumber,
              dueDate: payload.invoice.due_date || payload.invoice.dueDate,
              createdAt: payload.invoice.created_at || payload.invoice.createdAt,
              updatedAt: payload.invoice.updated_at || payload.invoice.updatedAt,
              status: payload.invoice.status || 'sent',
            };
            try { updateInvoice && updateInvoice(mappedInvoice) } catch {}
          } else {
            // Fallback: optimistic update only if no server data
            const existing = invoices.find(inv => inv.id === invoice.id);
            if (existing) {
              try { updateInvoice && updateInvoice({ ...existing, status: 'sent' as const }) } catch {}
            } else {
              try { updateInvoice && updateInvoice({ ...invoice, status: 'sent' as const }) } catch {}
            }
          }
          
          // Refresh IMMEDIATELY after send confirmation (before closing modal)
          // This ensures UI shows correct data before modal closes
          try {
            await refreshInvoices?.();
          } catch (error) {
            console.error('Error refreshing invoices:', error);
          }
          
          // Handle queued vs sync messages
          if (payload?.queued) {
            showSuccess(isEditing ? 'Invoice updated and queued for sending!' : 'Invoice created and queued for sending!');
          } else {
            showSuccess(isEditing ? 'Invoice updated and sent successfully!' : 'Invoice created and sent successfully!');
          }
          
          // Close modal AFTER refresh completes (ensures UI is updated)
          onSuccess()
          onClose()
          resetForm()
          return // Exit early to prevent further execution
        } else {
          let errorMsg = 'Invoice created but failed to send. You can send it later from the invoice list.'
          try { const err = await sendResponse.json(); if (err?.error) errorMsg = err.error } catch {}
          showWarning(errorMsg)
        }
        
        // update global invoices cache (only if send failed)
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
      showError('Error', 'Failed to create and send invoice. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // This will be handled by the individual buttons
  }


  if (!isOpen) return null

  return (
    <>
      {/* Main Invoice Modal - Hide when upgrade modal is shown */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 ${showUpgradeModal ? 'hidden' : ''}`}>
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

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  data-testid="fast-invoice-back-step"
                  onClick={() => setStep(1)}
                  className={`flex-shrink-0 py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                
                {/* Create button - changes to "Update Settings" when missing details */}
                <button
                  ref={createButtonRef}
                  type="button"
                  data-testid="fast-invoice-create-and-send"
                  onClick={hasMissingDetails && showMissingDetailsWarning ? () => {
                    onClose();
                    router.push('/dashboard/settings');
                  } : () => handleCreateInvoice(true)}
                  disabled={loading || sendLoading || markAsPaid || (showMissingDetailsWarning && !hasMissingDetails)}
                  className="flex-1 py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                  style={{ 
                    minWidth: 0, 
                    minHeight: '48px', // Fixed height to prevent layout shift
                    backgroundColor: (hasMissingDetails && showMissingDetailsWarning) 
                      ? (isDarkMode ? '#4F46E5' : '#6366F1') // Indigo when showing update
                      : (isDarkMode ? '#4B5563' : '#6B7280'), // Gray when normal
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !sendLoading && !markAsPaid) {
                      if (hasMissingDetails && showMissingDetailsWarning) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#4338CA' : '#4F46E5'
                      } else {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#4B5563'
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && !sendLoading && !markAsPaid) {
                      if (hasMissingDetails && showMissingDetailsWarning) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#4F46E5' : '#6366F1'
                      } else {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#4B5563' : '#6B7280'
                      }
                    }
                  }}
                >
                  <span className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (hasMissingDetails && showMissingDetailsWarning) ? (
                      <>
                        <Settings className="h-4 w-4" />
                        <span>Update</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Create</span>
                      </>
                    )}
                  </span>
                </button>
                
                {/* Send button - changes to "Send Anyway" when missing details */}
                <button
                  type="button"
                  data-testid="fast-invoice-create-draft"
                  onClick={() => {
                    if (hasMissingDetails && showMissingDetailsWarning) {
                      // Send anyway
                      setShowMissingDetailsWarning(false);
                      handleCreateAndSend();
                    } else if (hasMissingDetails) {
                      setShowMissingDetailsWarning(true);
                      const missingText = missingDetails.missing.length === 1 
                        ? missingDetails.missing[0]
                        : `${missingDetails.missing.slice(0, 2).join(', ')}${missingDetails.missing.length > 2 ? ` +${missingDetails.missing.length - 2} more` : ''}`;
                      showWarning('Missing Business Details', `Please update: ${missingText} before sending.`);
                      return;
                    } else {
                      handleCreateAndSend();
                    }
                  }}
                  disabled={loading || sendLoading}
                  className={`flex-1 ${markAsPaid ? 'sm:flex-1' : ''} py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer ${
                    isDarkMode 
                      ? (hasMissingDetails && showMissingDetailsWarning ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                      : (hasMissingDetails && showMissingDetailsWarning ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                  }`}
                  style={{ minHeight: '48px' }}
                >
                  {sendLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{markAsPaid ? 'Send Receipt' : 'Send'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      </div>
      
      {/* Upgrade Modal - Show via portal when limit is reached */}
      {typeof window !== 'undefined' && showUpgradeModal && subscriptionUsage && createPortal(
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            setShowUpgradeContent(false)
            // DO NOT reset form or subscriptionUsage - preserve user's input
            // DO NOT call onClose() - keep the parent modal open
            // Refresh usage after modal closes in case user upgraded
            if (!editingInvoice && user) {
              fetchSubscriptionUsage()
            }
          }}
          onBeforeRedirect={saveFormState}
          currentPlan={subscriptionUsage?.plan as 'free' | 'monthly' | 'pay_per_invoice' || 'free'}
          usage={subscriptionUsage ? {
            used: subscriptionUsage.used,
            limit: subscriptionUsage.limit,
            remaining: subscriptionUsage.remaining
          } : undefined}
          reason="You've reached your monthly invoice limit. Upgrade to create unlimited invoices."
          limitType="invoices"
        />,
        document.body
      )}

      {/* Charge Confirmation Modal - Show when pay-per-invoice user has no free invoices remaining */}
      {typeof window !== 'undefined' && showChargeConfirmation && createPortal(
        <ConfirmationModal
          isOpen={showChargeConfirmation}
          onClose={() => {
            setShowChargeConfirmation(false)
            setPendingInvoiceCreation(null)
          }}
          onConfirm={() => {
            setShowChargeConfirmation(false)
            if (pendingInvoiceCreation) {
              const { showToast, isSending } = pendingInvoiceCreation
              setPendingInvoiceCreation(null)
              // Proceed with invoice creation
              if (isSending) {
                handleCreateAndSend()
              } else {
                handleCreateInvoice(showToast, isSending)
              }
            }
          }}
          title="Invoice Charge Confirmation"
          message="You've used all 5 free invoices. This invoice will be charged $0.50 when sent. Do you want to continue?"
          type="warning"
          confirmText="Continue & Create Invoice"
          cancelText="Cancel"
        />,
        document.body
      )}

      {/* Toast Container for local toasts */}
      <ToastContainer toasts={localToasts} onRemove={localRemoveToast} />
    </>
  )
}
