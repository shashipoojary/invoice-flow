'use client'

import { useState, useEffect, useCallback, useRef, useMemo, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, Plus, Minus, Send, User, Mail, 
  Calendar, FileText, DollarSign, Download, 
  ArrowRight, ArrowLeft, Hash, MessageSquare, 
  Bell, Palette, Settings, CheckCircle, Sparkles,
  Clock, CreditCard, AlertTriangle, Trash2,
  Zap, AlertCircle
} from 'lucide-react'
import TemplateSelector from './TemplateSelector'
import CustomDropdown from './CustomDropdown'
import { Invoice } from '@/types'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { useData } from '@/contexts/DataContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { checkMissingBusinessDetails } from '@/lib/utils'
import { CURRENCIES, formatCurrency, getCurrencySymbol } from '@/lib/currency'
import UpgradeModal from './UpgradeModal'
import ConfirmationModal from './ConfirmationModal'
import ToastContainer from './Toast'

interface QuickInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  // user parameter removed - not used
  getAuthHeaders: () => Promise<{ [key: string]: string }>
  isDarkMode?: boolean
  clients?: Client[]
  editingInvoice?: Invoice | null
  showSuccess?: (message: string) => void
  showError?: (message: string) => void
  showWarning?: (message: string) => void
}

interface Client {
  id: string
  name: string
  email: string
  company?: string
  address?: string
}

interface InvoiceItem {
  id: string
  description: string
  amount: number | string
}

interface BusinessDetails {
  name: string
  logo?: string
  address: string
  phone: string
  email: string
  website?: string
  paymentDetails: {
    paypal?: string
    bankAccount?: string
    upiId?: string
    venmo?: string
    other?: string
  }
}

interface ReminderRule {
  id: string
  type: 'before' | 'after'
  days: number
  enabled: boolean
}

interface ReminderSettings {
  enabled: boolean
  useSystemDefaults: boolean
  rules: ReminderRule[]
  customRules?: ReminderRule[]
}

interface LateFeeSettings {
  enabled: boolean
  type: 'fixed' | 'percentage'
  amount: number
  gracePeriod: number // days after due date
}

interface PaymentTerms {
  enabled: boolean
  options: string[]
  defaultOption: string
}

interface InvoiceTheme {
  template: number // 1, 2, or 3
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export default function QuickInvoiceModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  getAuthHeaders,
  isDarkMode = false,
  clients: propClients = [],
  editingInvoice = null,
  showSuccess: propShowSuccess,
  showError: propShowError,
  showWarning: propShowWarning
}: QuickInvoiceModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [subscriptionUsage, setSubscriptionUsage] = useState<{ used: number; limit: number | null; remaining: number | null; plan: string; payPerInvoice?: { freeInvoicesRemaining: number } } | null>(null)
  const [showUpgradeContent, setShowUpgradeContent] = useState(false)
  const [showPremiumFeatureConfirm, setShowPremiumFeatureConfirm] = useState(false)
  const [premiumFeatureType, setPremiumFeatureType] = useState<'template' | 'reminder' | 'customization' | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<number | null>(null)
  const [pendingColors, setPendingColors] = useState<{ primary: string; secondary: string } | null>(null)
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false)
  const [unlockedTemplate, setUnlockedTemplate] = useState<number | null>(null) // Track which specific template was unlocked
  
  const router = useRouter()
  const { user } = useAuth()
  const { toasts: localToasts, removeToast: localRemoveToast, showSuccess: localShowSuccess, showError: localShowError, showWarning: localShowWarning } = useToast()
  const { invoices, addInvoice, addClient, updateInvoice, refreshInvoices } = useData()
  const { settings, isLoadingSettings } = useSettings()
  
  // Use passed toast functions if available, otherwise use local ones
  const showSuccess = propShowSuccess || localShowSuccess
  const showError = propShowError || localShowError
  const showWarning = propShowWarning || localShowWarning
  
  // Always use localShowWarning for toast notifications (supports title + message)
  // propShowWarning only supports message string

  // Check for missing business details
  const missingDetails = useMemo(() => {
    return checkMissingBusinessDetails(settings);
  }, [settings]);
  const hasMissingDetails = missingDetails.missing.length > 0;
  const [showMissingDetailsWarning, setShowMissingDetailsWarning] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  
  const wrappedOnClose = useCallback(() => {
    onCloseRef.current();
  }, []);

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
  const lastFetchModalOpenRef = useRef(false) // Track if we fetched for current modal open state

  // Memoize fetchSubscriptionUsage to prevent infinite loops
  const fetchSubscriptionUsage = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return null
    }
    
    isFetchingRef.current = true
    try {
      const headers = await getAuthHeadersRef.current()
      const response = await fetch(`/api/subscription/usage?t=${Date.now()}`, {
        headers,
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        const usageData = {
          ...data,
          payPerInvoice: data.payPerInvoice ? {
            freeInvoicesRemaining: data.payPerInvoice.freeInvoicesRemaining || 0
          } : undefined
        }
        setSubscriptionUsage(usageData)
        return usageData
      }
    } catch (error) {
      console.error('Error fetching subscription usage:', error)
    } finally {
      isFetchingRef.current = false
    }
    return null
  }, []) // Empty deps - using refs instead

  // Fetch subscription usage when modal opens - fetch once per modal open
  useEffect(() => {
    if (isOpen && user) {
      // Only fetch if modal just opened (wasn't open before)
      if (!lastFetchModalOpenRef.current) {
        lastFetchModalOpenRef.current = true
        fetchSubscriptionUsage().then((usageData) => {
          if (usageData) {
            // For monthly plan users creating new invoice: Always unlock premium
            if (usageData.plan === 'monthly' && !editingInvoice) {
              setIsPremiumUnlocked(true);
              setUnlockedTemplate(null); // Monthly plan unlocks all templates
            }
          }
        });
      }
    } else {
      // Reset when modal closes
      lastFetchModalOpenRef.current = false
    }
  }, [isOpen, user, editingInvoice]) // Removed fetchSubscriptionUsage from deps - it's stable
  const [localClients, setLocalClients] = useState<Client[]>([])
  const { clients, isLoadingClients } = useData()
  
  // Use global clients if available, otherwise fall back to local clients
  let effectiveClients = clients.length > 0 ? clients : localClients;
  
  // If editing an invoice and the client is not in the list, add it temporarily
  if (isOpen && editingInvoice?.client) {
    const clientId = editingInvoice.clientId || editingInvoice.client_id;
    if (clientId) {
      const clientExists = effectiveClients.find(c => c.id === clientId);
      if (!clientExists) {
        effectiveClients = [...effectiveClients, editingInvoice.client];
      }
    }
  }
  
  // Remove duplicates based on client ID
  effectiveClients = effectiveClients.filter((client, index, self) => 
    index === self.findIndex(c => c.id === client.id)
  );
  
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    address: ''
  })
  
  // Validation errors
  const [errors, setErrors] = useState<{
    client?: string
    clientName?: string
    clientEmail?: string
    items?: { [key: string]: { description?: string; amount?: string } }
    dueDate?: string
    issueDate?: string
    exchangeRate?: string
    taxRate?: string
  }>({})
  
  // Invoice basic details
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('Thank you for your business!')
  
  // Business details - initialize empty, will be populated by useEffect
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    paymentDetails: {
      paypal: '',
      bankAccount: '',
      upiId: '',
      venmo: '',
      other: ''
    }
  })

  // Update business details when settings change
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      const newBusinessDetails = {
        name: settings.businessName || '',
        address: settings.address || '',
        phone: settings.businessPhone || '',
        email: settings.businessEmail || '',
        website: undefined, // Deprecated - replaced with taxId
        paymentDetails: {
          paypal: settings.paypalEmail || '',
          bankAccount: settings.bankAccount || '',
          upiId: settings.googlePayUpi || '',
          venmo: settings.venmoId || '',
          other: settings.paymentNotes || ''
        }
      }
      setBusinessDetails(newBusinessDetails)
    }
  }, [settings])

  // Force refresh settings when modal opens
  useEffect(() => {
    if (isOpen && settings && Object.keys(settings).length > 0) {
      const newBusinessDetails = {
        name: settings.businessName || '',
        address: settings.address || '',
        phone: settings.businessPhone || '',
        email: settings.businessEmail || '',
        website: undefined, // Deprecated - replaced with taxId
        paymentDetails: {
          paypal: settings.paypalEmail || '',
          bankAccount: settings.bankAccount || '',
          upiId: settings.googlePayUpi || '',
          venmo: settings.venmoId || '',
          other: settings.paymentNotes || ''
        }
      }
      setBusinessDetails(newBusinessDetails)
    }
  }, [isOpen, settings])
  
  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', amount: '' }
  ])
  
  const [loading, setLoading] = useState(false)
  const [creatingLoading, setCreatingLoading] = useState(false)
  const [sendingLoading, setSendingLoading] = useState(false)
  const [shouldSend, setShouldSend] = useState(false)
  const shouldSendRef = useRef(false) // Use ref to track send intent immediately
  const [pdfLoading, setPdfLoading] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement>(null) // Ref to track Create button for stability
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState('')
  const [markAsPaid, setMarkAsPaid] = useState(false)
  const [currency, setCurrency] = useState<string>(() => {
    // Use invoice currency if available, otherwise use baseCurrency
    if (editingInvoice && (editingInvoice.currency || (editingInvoice as any)?.currency)) {
      return editingInvoice.currency || (editingInvoice as any).currency;
    }
    return settings?.baseCurrency || 'USD';
  })
  const [exchangeRate, setExchangeRate] = useState<string>(() => {
    // Use invoice exchange rate if available
    if (editingInvoice) {
      const invoiceExchangeRate = (editingInvoice as any)?.exchange_rate;
      if (invoiceExchangeRate !== undefined && invoiceExchangeRate !== null) {
        return invoiceExchangeRate.toString();
      }
    }
    return '1.0';
  })
  
  // Initialize currency from settings when available
  useEffect(() => {
    if (settings?.baseCurrency && !editingInvoice && isOpen) {
      setCurrency(settings.baseCurrency)
    }
  }, [settings?.baseCurrency, editingInvoice, isOpen])
  
  // Reminder settings
  const [reminders, setReminders] = useState<ReminderSettings>({
    enabled: false,
    useSystemDefaults: true,
    rules: [
      { id: '1', type: 'before', days: 7, enabled: true },
      { id: '2', type: 'before', days: 3, enabled: true }
    ]
  })
  
  // Late fee settings
  const [lateFees, setLateFees] = useState<LateFeeSettings>({
    enabled: false,
    type: 'fixed',
    amount: 25,
    gracePeriod: 7
  })
  
  // Payment terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>({
    enabled: false,
    options: ['Due on Receipt', 'Net 15', 'Net 30', '2/10 Net 30'],
    defaultOption: 'Due on Receipt'
  })
  
  // Invoice theme
  const [theme, setTheme] = useState<InvoiceTheme>({
    template: 1, // Default to template 1
    primaryColor: '#5C2D91', // Template 1 default
    secondaryColor: '#8B5CF6', // Template 1 default
    accentColor: '#8b5cf6' // violet-500
  })
  

  const fetchClients = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/clients', {
        headers
      })
      const data = await response.json()
      setLocalClients(data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [getAuthHeaders])

  // fetchBusinessSettings function removed - using SettingsContext instead

  useEffect(() => {
    if (isOpen) {
      // Use prop clients if available, otherwise fetch
      if (propClients.length > 0) {
        setLocalClients(propClients)
      } else {
        fetchClients()
      }
      // fetchBusinessSettings() - Removed, using SettingsContext instead
    }
  }, [isOpen, fetchClients, propClients])

  // IMPORTANT: When "Mark as Paid" is selected, auto-set payment terms to "Due on Receipt"
  // and disable late fees and reminders
  useEffect(() => {
    if (markAsPaid) {
      // Auto-set payment terms to "Due on Receipt" and enable it
      setPaymentTerms({
        enabled: true,
        options: ['Due on Receipt', 'Net 15', 'Net 30', '2/10 Net 30'],
        defaultOption: 'Due on Receipt'
      })
      // Set due date to issue date (Due on Receipt)
      if (issueDate) {
        setDueDate(issueDate)
      }
      // Disable late fees
      setLateFees(prev => ({ ...prev, enabled: false }))
      // Disable reminders
      setReminders(prev => ({ ...prev, enabled: false }))
    }
  }, [markAsPaid, issueDate])

  // Auto-calculate due date when payment terms are enabled or issue date changes
  // Skip auto-update if "Custom" is selected - allow manual due date entry
  useEffect(() => {
    if (paymentTerms.enabled && paymentTerms.defaultOption !== 'Custom') {
      const selectedTerm = paymentTerms.defaultOption
      const baseDate = issueDate || new Date().toISOString().split('T')[0]
      
      if (selectedTerm === 'Due on Receipt') {
        setDueDate(baseDate)
      } else if (selectedTerm === 'Net 15') {
        const newDueDate = new Date(baseDate)
        newDueDate.setDate(newDueDate.getDate() + 15)
        setDueDate(newDueDate.toISOString().split('T')[0])
      } else if (selectedTerm === 'Net 30') {
        const newDueDate = new Date(baseDate)
        newDueDate.setDate(newDueDate.getDate() + 30)
        setDueDate(newDueDate.toISOString().split('T')[0])
      } else if (selectedTerm === '2/10 Net 30') {
        const newDueDate = new Date(baseDate)
        newDueDate.setDate(newDueDate.getDate() + 30)
        setDueDate(newDueDate.toISOString().split('T')[0])
      }
    }
  }, [paymentTerms.enabled, paymentTerms.defaultOption, issueDate])

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
          showError(`Cannot edit invoice: Only draft invoices can be edited. This invoice is "${editingInvoice.status}".`);
          onClose();
          return;
        }
        
        // Pre-fill form when editing an invoice
        setInvoiceNumber(editingInvoice.invoiceNumber || '')
        // Handle issue date with proper formatting
        const issueDateValue = editingInvoice.issueDate || editingInvoice.issue_date || '';
        
        // Format date for HTML date input (YYYY-MM-DD)
        let formattedIssueDate = issueDateValue;
        if (issueDateValue && issueDateValue.includes('-')) {
          // If it's already in YYYY-MM-DD format, use as is
          formattedIssueDate = issueDateValue;
        } else if (issueDateValue) {
          // Try to parse and format the date
          try {
            const date = new Date(issueDateValue);
            if (!isNaN(date.getTime())) {
              formattedIssueDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error formatting issue date:', e);
          }
        }
        
        setIssueDate(formattedIssueDate)
        setDueDate(editingInvoice.dueDate || '')
        setNotes(editingInvoice.notes || 'Thank you for your business!')
        setDiscount(editingInvoice.discount || 0)
        // Calculate tax rate from taxAmount if available
        if (editingInvoice.taxAmount && editingInvoice.subtotal) {
          const afterDiscount = (editingInvoice.subtotal || 0) - (editingInvoice.discount || 0);
          const calculatedTaxRate = afterDiscount > 0 ? ((editingInvoice.taxAmount / afterDiscount) * 100) : 0;
          setTaxRate(Math.round(calculatedTaxRate * 100) / 100 + '');
        } else {
          setTaxRate('')
        }
        // Prioritize invoice's currency - only fallback to baseCurrency if invoice currency is missing
        const invoiceCurrency = editingInvoice.currency || (editingInvoice as any)?.currency;
        setCurrency(invoiceCurrency || settings.baseCurrency || 'USD')
        // Set exchange rate from invoice, default to 1.0 if missing
        const invoiceExchangeRate = (editingInvoice as any)?.exchange_rate;
        setExchangeRate(invoiceExchangeRate !== undefined && invoiceExchangeRate !== null ? invoiceExchangeRate.toString() : '1.0')
        
        // Set client information immediately (don't wait for clients to load)
        const clientId = editingInvoice.clientId || editingInvoice.client_id;
        if (clientId) {
          setSelectedClientId(clientId)
          
          // If the client doesn't exist in the clients list, add it immediately
          if (editingInvoice.client && !clients.find(c => c.id === clientId)) {
            try { 
              addClient && addClient(editingInvoice.client);
            } catch (e) { 
              console.error('QuickInvoiceModal: Error adding client:', e) 
            }
          }
          
          // CRITICAL: For draft invoices, use the latest client data from the clients list
          // This ensures that when a client is updated, draft invoices reflect those changes
          if (editingInvoice.status === 'draft') {
            // Find the latest client data from the clients list
            const latestClient = clients.find(c => c.id === clientId);
            if (latestClient) {
              // Use the latest client data instead of the invoice's stored client data
              setNewClient({
                name: latestClient.name || '',
                email: latestClient.email || '',
                company: latestClient.company || '',
                address: latestClient.address || ''
              });
            } else if (editingInvoice.client) {
              // Fallback to invoice's client data if not in clients list yet
              setNewClient({
                name: editingInvoice.client.name || editingInvoice.clientName || '',
                email: editingInvoice.client.email || editingInvoice.clientEmail || '',
                company: editingInvoice.client.company || '',
                address: editingInvoice.client.address || ''
              });
            }
          } else {
            // For sent/paid invoices, use the stored client data (don't update)
        if (editingInvoice.clientName) {
          setNewClient(prev => ({ ...prev, name: editingInvoice.clientName || '' }))
        }
        if (editingInvoice.clientEmail) {
          setNewClient(prev => ({ ...prev, email: editingInvoice.clientEmail || '' }))
            }
          }
        }
        
        // Set invoice items (always do this regardless of clients)
        if (editingInvoice.items && editingInvoice.items.length > 0) {
          setItems(editingInvoice.items.map(item => ({
            id: item.id || Date.now().toString(),
            description: item.description || '',
            amount: item.amount?.toString() || item.rate?.toString() || ''
          })))
        } else {
          // If no items, set a default empty item
          setItems([{
            id: Date.now().toString(),
            description: '',
            amount: ''
          }])
        }
      } else {
        // Reset form when creating new invoice
        // Get current date dynamically
        const today = new Date()
        const defaultDueDate = new Date()
        defaultDueDate.setDate(defaultDueDate.getDate() + 30)
        
        setCurrentStep(1)
        setSelectedClientId('')
        
        // Generate invoice number dynamically
        const invoiceNum = `INV-${Date.now().toString().slice(-6)}`
        setInvoiceNumber(invoiceNum)
        
        // Set current date dynamically for issue date (not empty string)
        setIssueDate(today.toISOString().split('T')[0])
        setDueDate(defaultDueDate.toISOString().split('T')[0])
        
        setNewClient({
          name: '',
          email: '',
          company: '',
          address: ''
        })
        setDiscount(0)
        setMarkAsPaid(false)
        setNotes('Thank you for your business!')
        setCurrency(settings.baseCurrency || 'USD')
        setExchangeRate('1.0')
        setItems([{
          id: Date.now().toString(),
          description: '',
          amount: ''
        }])
        // Reset theme to default
        setTheme({
          template: 1,
          primaryColor: '#5C2D91',
          secondaryColor: '#8B5CF6',
          accentColor: '#8b5cf6'
        })
        // Reset reminders to default
        setReminders({
          enabled: false,
          useSystemDefaults: true,
          rules: [
            { id: '1', type: 'before', days: 7, enabled: true },
            { id: '2', type: 'before', days: 3, enabled: true }
          ]
        })
        // Reset late fees to default
        setLateFees({
          enabled: false,
          type: 'fixed',
          amount: 25,
          gracePeriod: 7
        })
        // Reset payment terms to default
        setPaymentTerms({
          enabled: false,
          options: ['Due on Receipt', 'Net 15', 'Net 30', '2/10 Net 30'],
          defaultOption: 'Due on Receipt'
        })
      }
    }
  }, [isOpen, editingInvoice, addClient, clients])

  // Pre-fill client-dependent fields when clients are loaded
  useEffect(() => {
    if (isOpen && editingInvoice) {
      // Only set client selection if not already set (to avoid overriding the immediate setting above)
      if (!selectedClientId && editingInvoice.clientId) {
        setSelectedClientId(editingInvoice.clientId)
      }
      
      // Set payment terms
      if (editingInvoice.paymentTerms) {
        setPaymentTerms({
          enabled: editingInvoice.paymentTerms.enabled,
          options: ['Due on Receipt', 'Net 15', 'Net 30', '2/10 Net 30'],
          defaultOption: editingInvoice.paymentTerms.terms || 'Due on Receipt'
        })
      }
      
      // Set late fees
      if (editingInvoice.lateFees) {
        setLateFees(editingInvoice.lateFees)
      }
      
      // Set reminders
      if (editingInvoice.reminders) {
        const reminderData = editingInvoice.reminders as any;
        // Ensure we have rules array (convert customRules to rules if needed)
        const rules = reminderData.rules || reminderData.customRules || [];
        setReminders({
          ...reminderData,
          rules: rules
        });
      } else if ((editingInvoice as any).reminderSettings) {
        const reminderData = (editingInvoice as any).reminderSettings;
        // Ensure we have rules array (convert customRules to rules if needed)
        const rules = reminderData.rules || reminderData.customRules || [];
        setReminders({
          ...reminderData,
          rules: rules
        });
      }
      
      // Set theme
      if (editingInvoice.theme) {
        const invoiceTheme = editingInvoice.theme as { template?: number; primaryColor?: string; primary_color?: string; secondaryColor?: string; secondary_color?: string; accentColor?: string; accent_color?: string };
        // CRITICAL: Template in database is already in UI format (1, 2, 3), not PDF format
        // Only use getUiTemplate if template is > 3 (PDF format), otherwise use as-is
        let templateId = invoiceTheme.template || 1;
        if (templateId > 3) {
          // If template is in PDF format (4, 5, 6), convert to UI format
          templateId = getUiTemplate(templateId);
        }
        
        setTheme({
          template: templateId,
          primaryColor: invoiceTheme.primaryColor || invoiceTheme.primary_color || '#5C2D91',
          secondaryColor: invoiceTheme.secondaryColor || invoiceTheme.secondary_color || '#8B5CF6',
          accentColor: invoiceTheme.accentColor || invoiceTheme.accent_color || '#8B5CF6'
        });
        
        // CRITICAL FIX: If invoice has premium template (2 or 3) and is draft,
        // check if user is on pay_per_invoice and unlock optimistically
        // This ensures the template stays unlocked when editing drafts
        if (editingInvoice.status === 'draft' && (templateId === 2 || templateId === 3)) {
          fetchSubscriptionUsage().then(usageData => {
            if (usageData && usageData.plan === 'pay_per_invoice') {
              setIsPremiumUnlocked(true);
              setUnlockedTemplate(templateId);
            }
          }).catch(err => {
            console.error('Error checking subscription for draft premium unlock:', err);
          });
        }
      }
    }
  }, [isOpen, editingInvoice])

  // CRITICAL: Sync client data from clients list when editing draft invoices
  // This ensures that when a client is updated, draft invoices reflect the latest data
  useEffect(() => {
    if (isOpen && editingInvoice && editingInvoice.status === 'draft' && selectedClientId) {
      // Find the latest client data from the clients list
      const latestClient = effectiveClients.find(c => c.id === selectedClientId);
      
      if (latestClient) {
        // Update the form with the latest client data
        // This ensures draft invoices always show the most up-to-date client information
        setNewClient(prev => ({
          ...prev,
          name: latestClient.name || prev.name,
          email: latestClient.email || prev.email,
          company: latestClient.company || prev.company,
          address: latestClient.address || prev.address
        }));
      }
    }
  }, [isOpen, editingInvoice, selectedClientId, effectiveClients])

  // Fetch premium unlock status when editing an invoice
  useEffect(() => {
    if (isOpen && editingInvoice?.id) {
      const fetchPremiumStatus = async () => {
        try {
          const headers = await getAuthHeaders();
          const response = await fetch(`/api/invoices/${editingInvoice.id}/premium-status?t=${Date.now()}`, { 
            headers,
            cache: 'no-store' 
          });
          let isUnlocked = false;
          if (response.ok) {
            const data = await response.json();
            isUnlocked = data.isPremiumUnlocked || false;
            const unlockedTemplateFromApi = data.unlockedTemplate || null;
            console.log(`🔓 [PREMIUM STATUS API] Premium unlock status for invoice ${editingInvoice.id}:`, {
              isUnlocked,
              unlockedTemplate: unlockedTemplateFromApi,
              apiResponse: data
            });
            
            setIsPremiumUnlocked(isUnlocked);
            console.log(`🔓 [PREMIUM STATUS] Set isPremiumUnlocked to:`, isUnlocked);
            
            // CRITICAL: Set unlockedTemplate from API response
            if (unlockedTemplateFromApi) {
              setUnlockedTemplate(unlockedTemplateFromApi);
            } else if (isUnlocked && editingInvoice.theme) {
              // Fallback: get template from invoice theme if API didn't return it
              try {
                const invoiceTheme = typeof editingInvoice.theme === 'string' 
                  ? JSON.parse(editingInvoice.theme) 
                  : editingInvoice.theme;
                // Template in database is already in UI format (1, 2, 3)
                let templateId = invoiceTheme.template || null;
                if (templateId && templateId > 3) {
                  // If template is in PDF format, convert to UI format
                  templateId = getUiTemplate(templateId);
                }
                if (templateId && (templateId === 2 || templateId === 3)) {
                  setUnlockedTemplate(templateId);
                }
              } catch (error) {
                console.error('Error parsing invoice theme:', error);
              }
            }
          } else {
            console.error('Failed to fetch premium status:', response.status);
            setIsPremiumUnlocked(false);
            setUnlockedTemplate(null);
          }
        } catch (error) {
          console.error('Error fetching premium status:', error);
          setIsPremiumUnlocked(false);
        }
      };
      fetchPremiumStatus();
    } else if (isOpen && !editingInvoice) {
      // For new invoice: Check plan and set premium unlock accordingly
      // Monthly plan: Always unlocked (no per-invoice unlock needed)
      // Pay-per-invoice: Reset to false (needs unlock per invoice)
      // Free plan: Always false
      if (subscriptionUsage?.plan === 'monthly') {
        setIsPremiumUnlocked(true);
        setUnlockedTemplate(null); // Monthly plan unlocks all templates
      } else {
        // Pay-per-invoice or free: Reset premium unlock for new invoice
        setIsPremiumUnlocked(false);
        setUnlockedTemplate(null);
      }
    }
  }, [isOpen, editingInvoice?.id, editingInvoice?.theme, editingInvoice?.status, getAuthHeaders, fetchSubscriptionUsage, subscriptionUsage])

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      description: '', 
      amount: ''
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0)
    const discountAmount = discount || 0
    const afterDiscount = subtotal - discountAmount
    const taxRateValue = parseFloat(taxRate.toString()) || 0
    const taxAmount = afterDiscount * (taxRateValue / 100)
    const total = afterDiscount + taxAmount
    
    return { 
      subtotal, 
      discount: discountAmount,
      taxRate: taxRateValue,
      taxAmount: taxAmount,
      currency: currency,
      exchange_rate: parseFloat(exchangeRate) || 1.0,
      total
    }
  }

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Client validation
    if (!selectedClientId) {
      if (!newClient.name || !newClient.name.trim()) {
        newErrors.clientName = 'Client name is required'
      }
      if (!newClient.email || !newClient.email.trim()) {
        newErrors.clientEmail = 'Client email is required'
      } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newClient.email.trim())) {
          newErrors.clientEmail = 'Please enter a valid email address'
        }
      }
    }
    
    // Items validation
    const itemErrors: { [key: string]: { description?: string; amount?: string } } = {}
    items.forEach((item, index) => {
      if (!item.description || !item.description.trim()) {
        if (!itemErrors[item.id]) itemErrors[item.id] = {}
        itemErrors[item.id].description = 'Description is required'
      }
      if (!item.amount || !item.amount.toString().trim()) {
        if (!itemErrors[item.id]) itemErrors[item.id] = {}
        itemErrors[item.id].amount = 'Amount is required'
      } else {
        const parsedAmount = parseFloat(item.amount.toString())
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          if (!itemErrors[item.id]) itemErrors[item.id] = {}
          itemErrors[item.id].amount = 'Please enter a valid amount greater than 0'
        }
      }
    })
    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors
    }
    
    // Due date validation
    if (!dueDate || !dueDate.trim()) {
      newErrors.dueDate = 'Due date is required'
    }
    
    // Issue date validation
    if (!issueDate || !issueDate.trim()) {
      newErrors.issueDate = 'Issue date is required'
    }
    
    // Exchange rate validation - required when currency differs from base currency
    const baseCurrency = settings?.baseCurrency || 'USD'
    if (currency !== baseCurrency) {
      if (!exchangeRate || !exchangeRate.trim() || exchangeRate === '1.0' || parseFloat(exchangeRate) <= 0 || isNaN(parseFloat(exchangeRate))) {
        newErrors.exchangeRate = 'Exchange rate is required when currency differs from base currency'
      }
    }
    
    // Tax rate validation - required when user is tax-registered
    if (settings?.isTaxRegistered === true) {
      const taxRateValue = parseFloat(taxRate.toString()) || 0
      if (taxRateValue <= 0) {
        newErrors.taxRate = 'Tax rate is required when you are registered to charge tax'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateDraft = async () => {
    // Set loading state IMMEDIATELY - this is the key to prevent fade
    setCreatingLoading(true)
    
    try {
      // Validate form AFTER setting loading state
      if (!validateForm()) {
        setCreatingLoading(false)
        showError('Please fill in all required fields correctly')
        // Scroll to first error field
        setTimeout(() => {
          const firstError = document.querySelector('.border-red-500')
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        return
      }

      // Check subscription limit BEFORE creating invoice (only for new invoices, not editing)
      if (!editingInvoice) {
        const usageData = await fetchSubscriptionUsage()
        if (usageData && usageData.plan === 'free' && usageData.limit && usageData.used >= usageData.limit) {
          setCreatingLoading(false)
          showError('You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.')
          // Show upgrade modal
          setShowUpgradeContent(true)
          setShowUpgradeModal(true)
          setSubscriptionUsage(usageData)
          return
        }
      }
      
      calculateTotals()
      // Calculate totals for validation

      // Determine if we're editing or creating
      const isEditing = editingInvoice && editingInvoice.id

      const payload = {
        client_id: selectedClientId || undefined,
        client_data: selectedClientId ? undefined : newClient,
        items: items.map(item => ({
          description: item.description,
          rate: parseFloat(item.amount.toString()) || 0,
          line_total: parseFloat(item.amount.toString()) || 0
        })),
        due_date: dueDate,
        discount: discount || 0,
        taxRate: parseFloat(taxRate.toString()) || 0,
        currency: currency,
        exchange_rate: parseFloat(exchangeRate) || 1.0,
        notes: notes,
        billing_choice: 'per_invoice',
        type: 'detailed',
        invoice_number: invoiceNumber || undefined,
        issue_date: issueDate || undefined,
        status: isEditing ? editingInvoice?.status : (markAsPaid ? 'paid' : 'draft'), // Allow marking as paid during creation
        // Enhanced features
        payment_terms: paymentTerms.enabled ? {
          enabled: true,
          terms: paymentTerms.defaultOption
        } : undefined,
        late_fees: lateFees.enabled ? {
          enabled: true,
          type: lateFees.type,
          amount: lateFees.amount,
          gracePeriod: lateFees.gracePeriod
        } : undefined,
        reminderSettings: reminders.enabled ? {
          enabled: true,
          useSystemDefaults: reminders.useSystemDefaults,
          rules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            id: rule.id,
            type: rule.type,
            days: rule.days,
            enabled: true
          })),
          customRules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            id: rule.id,
            type: rule.type,
            days: rule.days,
            enabled: true
          }))
        } : undefined,
        theme: {
          template: theme.template, // Send UI template number (1, 2, 3) - PDF mapping happens in API
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor
        }
      }

      // Add invoice ID to payload if editing
      if (isEditing) {
        (payload as any).invoiceId = editingInvoice.id
      }

      const headers = await getAuthHeaders()
      const endpoint = isEditing ? '/api/invoices/update' : '/api/invoices/create'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.invoice) {
        showSuccess(isEditing ? 'Invoice updated successfully!' : 'Invoice created successfully!')
        // Update global state immediately
        if (isEditing) {
          // Update existing invoice
          try { updateInvoice && updateInvoice(result.invoice) } catch {}
        } else {
          // Add new invoice
          try { addInvoice && addInvoice(result.invoice) } catch {}
        }
        // If a new client was created, add it to global state
        if (result.invoice.client && !selectedClientId) {
          try { addClient && addClient(result.invoice.client) } catch {}
        }
        onSuccess()
        onClose()
      } else {
        // Check if it's a subscription limit error
        if (response.status === 403 && result.limitReached) {
          const errorMessage = result.error || 'Subscription limit reached'
          // Check if it's a client limit error
          if (result.limitType === 'clients') {
            showError('Client Limit Reached', errorMessage)
          } else {
            showError('Limit Reached', errorMessage)
          }
          throw new Error('LIMIT_REACHED')
        }
        
        // Check if error message indicates client limit (from database trigger)
        if (result.error && (result.error.includes('client') && result.error.includes('limit'))) {
          const errorMessage = result.error || 'Client limit reached'
          showError('Client Limit Reached', errorMessage)
          throw new Error('CLIENT_LIMIT_REACHED')
        }
        
        throw new Error(result.error || (isEditing ? 'Failed to update invoice' : 'Failed to create invoice'))
      }

    } catch (error) {
      console.error('Error creating invoice:', error)
      showError('Failed to create invoice. Please try again.')
    } finally {
      setCreatingLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check send intent from ref (immediate) or state (for async cases)
    const wantsToSend = shouldSendRef.current || shouldSend

    // Check for missing business details if trying to send
    if (wantsToSend && hasMissingDetails && !showMissingDetailsWarning) {
      setShowMissingDetailsWarning(true);
      // Show toast notification using localShowWarning (supports title + message)
      const missingText = missingDetails.missing.length === 1 
        ? missingDetails.missing[0]
        : `${missingDetails.missing.slice(0, 2).join(', ')}${missingDetails.missing.length > 2 ? ` +${missingDetails.missing.length - 2} more` : ''}`;
      localShowWarning('Missing Business Details', `Please update: ${missingText} before sending.`);
      return;
    }

    // Validate form FIRST before showing loading or checking subscription
      if (!validateForm()) {
        showError('Please fill in all required fields correctly')
      // Scroll to first error field
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500')
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }

    // Show loading state after validation passes
    setSendingLoading(true)
    
    // Check subscription limit BEFORE creating invoice (only for new invoices, not editing)
    if (!editingInvoice) {
      const usageData = await fetchSubscriptionUsage()
      if (usageData && usageData.plan === 'free' && usageData.limit && usageData.used >= usageData.limit) {
        setSendingLoading(false)
        showError('You\'ve reached your monthly invoice limit. Please upgrade to create more invoices.')
        // Show upgrade modal like EstimateModal
        setShowUpgradeContent(true)
        setShowUpgradeModal(true)
        setSubscriptionUsage(usageData)
        return
      }
    }

    try {
      
      calculateTotals()
      // Calculate totals for validation

      const payload = {
        client_id: selectedClientId || undefined,
        client_data: selectedClientId ? undefined : newClient,
        items: items.map(item => ({
          description: item.description,
          rate: parseFloat(item.amount.toString()) || 0,
          line_total: parseFloat(item.amount.toString()) || 0
        })),
        due_date: dueDate,
        discount: discount || 0,
        taxRate: parseFloat(taxRate.toString()) || 0,
        currency: currency,
        exchange_rate: parseFloat(exchangeRate) || 1.0,
        notes: notes,
        billing_choice: 'per_invoice',
        type: 'detailed', // Mark as detailed invoice
        // New features
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        reminderSettings: reminders.enabled ? {
          enabled: true,
          useSystemDefaults: reminders.useSystemDefaults,
          rules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            id: rule.id,
            type: rule.type,
            days: rule.days,
            enabled: true
          })),
          customRules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            id: rule.id,
            type: rule.type,
            days: rule.days,
            enabled: true
          }))
        } : { enabled: false },
        late_fees: lateFees.enabled ? {
          enabled: true,
          type: lateFees.type,
          amount: lateFees.amount,
          grace_period: lateFees.gracePeriod
        } : { enabled: false },
        payment_terms: paymentTerms.enabled ? {
          enabled: true,
          terms: paymentTerms.defaultOption
        } : { enabled: false },
        theme: {
          template: theme.template, // Send UI template number (1, 2, 3) - PDF mapping happens in API
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor
        },
        // CRITICAL: Save premium unlock status to metadata for draft invoices
        // This ensures the unlock persists when editing drafts
        premium_unlocked: isPremiumUnlocked,
        unlocked_template: unlockedTemplate
      }

      const headers = await getAuthHeaders()
      
      // Determine if we're editing or creating
      const isEditing = editingInvoice && editingInvoice.id
      const endpoint = isEditing ? '/api/invoices/update' : '/api/invoices/create'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Add status to payload
      if (!isEditing) {
        (payload as any).status = markAsPaid ? 'paid' : 'draft'
      }
      
      // Add invoice ID to payload if editing
      if (isEditing) {
        (payload as any).invoiceId = editingInvoice.id
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && (result.invoice || result.success)) {
        // If user clicked Send button, send the invoice (works for both create and edit)
        const wantsToSend = shouldSendRef.current || shouldSend
        if (result.invoice && wantsToSend) {
          // Resolve client email/name safely
          const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : undefined;
          const finalClientEmail = (selectedClient?.email || newClient.email || '').trim();
          const finalClientName = (selectedClient?.name || newClient.name || '').trim();

          if (!finalClientEmail) {
            showWarning('Client email is required to send the invoice');
            // Still add invoice to list but do not attempt send
            try { addInvoice && addInvoice(result.invoice) } catch {}
            setSendingLoading(false)
            onSuccess();
            onClose();
            return;
          }

          // Check for missing business details (should already be checked in UI, but double-check)
          const { checkMissingBusinessDetails } = await import('@/lib/utils');
          const missingDetailsCheck = checkMissingBusinessDetails(settings);
          if (missingDetailsCheck.missing.length > 0 && !showMissingDetailsWarning) {
            // This shouldn't happen if UI is working correctly, but handle it
            setShowMissingDetailsWarning(true);
            setSendingLoading(false);
            try { addInvoice && addInvoice(result.invoice) } catch {}
            return;
          }

          // Send the invoice to the client
          const sendResponse = await fetch('/api/invoices/send', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: result.invoice.id,
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
              const existing = invoices.find(inv => inv.id === result.invoice.id);
              if (existing) {
                try { updateInvoice && updateInvoice({ ...existing, status: 'sent' as const }) } catch {}
              } else {
                try { updateInvoice && updateInvoice({ ...result.invoice, status: 'sent' as const }) } catch {}
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
            setShouldSend(false)
            shouldSendRef.current = false
            return // Exit early to prevent further execution
          } else {
            let errorMsg = 'Invoice created but failed to send. You can send it later from the invoice list.'
            try { const err = await sendResponse.json(); if (err?.error) errorMsg = err.error } catch {}
            showWarning(errorMsg)
          }
        } else {
          // Show success message for non-send actions (only if not sending)
          const wantsToSend = shouldSendRef.current || shouldSend
          if (!wantsToSend) {
          showSuccess(isEditing ? 'Invoice updated successfully!' : 'Invoice created successfully!')
          }
        }
        
        // Update global state immediately
        if (result.invoice) {
          const alreadySent = shouldSend; // when Create & Send path is used
          if (isEditing) {
            // Update existing invoice; preserve 'sent' status if we just sent
            const updated = alreadySent ? { ...result.invoice, status: 'sent' as const } : result.invoice;
            try { updateInvoice && updateInvoice(updated) } catch {}
          } else {
            // Add new invoice
            try { addInvoice && addInvoice(result.invoice) } catch {}
          }
          // If a new client was created, add it to global state
          if (result.invoice.client && !selectedClientId) {
            try { addClient && addClient(result.invoice.client) } catch {}
          }
        }
      } else {
        throw new Error(result.error || (isEditing ? 'Failed to update invoice' : 'Failed to create invoice'))
      }

      // Ensure the list reflects the latest status before closing
      try { await refreshInvoices?.() } catch {}
      onSuccess()
      onClose()
      setShouldSend(false)
      shouldSendRef.current = false // Reset ref

    } catch (error) {
      console.error('Error creating invoice:', error)
      showError('Failed to create invoice. Please try again.')
    } finally {
      setSendingLoading(false)
    }
  }

  const { subtotal, discount: totalDiscount, taxAmount: totalTax, total } = calculateTotals()

  const resetForm = () => {
    setCurrentStep(1)
    setSelectedClientId('')
    shouldSendRef.current = false // Reset ref
    setNewClient({ name: '', email: '', company: '', address: '' })
    setItems([{ id: '1', description: '', amount: '' }])
    setNotes('Thank you for your business!')
      setDiscount(0)
      setTaxRate('')
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
    shouldSendRef.current = false // Reset ref when closing
    setShouldSend(false)
    wrappedOnClose()
  }

  // Helper function to map template selection to PDF template
  const getPdfTemplate = (templateId: number): number => {
    switch (templateId) {
      case 1: return 6; // Minimal -> Template 6 (Minimal - Finalized)
      case 2: return 4; // Modern -> Template 4
      case 3: return 5; // Creative -> Template 5 (Simple Clean)
      default: return 6; // Default to Template 6
    }
  }

  // Helper function to map PDF template back to UI template
  const getUiTemplate = (pdfTemplateId: number): number => {
    switch (pdfTemplateId) {
      case 6: return 1; // Template 6 -> Minimal
      case 4: return 2; // Template 4 -> Modern
      case 5: return 3; // Template 5 -> Creative
      default: return 1; // Default to Minimal
    }
  }

  const handleGeneratePDF = async () => {
    setPdfLoading(true)
    try {
      // Validate required fields for PDF generation
      if (!selectedClientId && !newClient.name) {
        showWarning('Please select a client or enter client details')
        setPdfLoading(false)
        return
      }

      if (items.some(item => !item.description || !item.amount || parseFloat(item.amount.toString()) <= 0)) {
        showWarning('Please fill in all item details with valid amounts')
        setPdfLoading(false)
        return
      }

      // Check subscription limits before generating PDF
      const headers = await getAuthHeaders()
      const usageResponse = await fetch('/api/subscription/usage', {
        headers,
        cache: 'no-store'
      })
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        
        // For free plan: Check monthly invoice limit
        if (usageData.plan === 'free' && usageData.limit && usageData.used >= usageData.limit) {
          setPdfLoading(false)
          setShowUpgradeModal(true)
          setSubscriptionUsage(usageData)
          showError('PDF Generation Limit Reached', 'You\'ve reached your monthly invoice limit. Please upgrade to generate more PDFs.')
          return
        }
      }

      const payload = {
        client_id: selectedClientId || undefined,
        client_data: selectedClientId ? undefined : newClient,
        items: items.map(item => ({
          description: item.description,
          rate: parseFloat(item.amount.toString()) || 0,
          line_total: parseFloat(item.amount.toString()) || 0
        })),
        due_date: dueDate,
        discount: discount || 0,
        taxRate: parseFloat(taxRate.toString()) || 0,
        currency: currency,
        exchange_rate: parseFloat(exchangeRate) || 1.0,
        notes: notes,
        billing_choice: 'per_invoice',
        type: 'detailed', // Mark as detailed invoice
        // New features
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        reminderSettings: reminders.enabled ? {
          enabled: true,
          useSystemDefaults: reminders.useSystemDefaults,
          rules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            id: rule.id,
            type: rule.type,
            days: rule.days,
            enabled: true
          })),
          customRules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            id: rule.id,
            type: rule.type,
            days: rule.days,
            enabled: true
          }))
        } : { enabled: false },
        late_fees: lateFees.enabled ? {
          enabled: true,
          type: lateFees.type,
          amount: lateFees.amount,
          grace_period: lateFees.gracePeriod
        } : { enabled: false },
        payment_terms: paymentTerms.enabled ? {
          enabled: true,
          terms: paymentTerms.defaultOption
        } : { enabled: false },
        theme: {
          template: theme.template, // Send UI template number (1, 2, 3) - PDF mapping happens in API
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor
        },
        // CRITICAL: Save premium unlock status to metadata for draft invoices
        // This ensures the unlock persists when editing drafts
        premium_unlocked: isPremiumUnlocked,
        unlocked_template: unlockedTemplate,
        // PDF generation flag
        generate_pdf_only: true
      }

      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess('PDF generated successfully!')
      } else {
        // Handle API errors with specific messages
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 403 && errorData.limitReached) {
          // Subscription limit reached - show upgrade modal
          try {
            const usageResponse = await fetch('/api/subscription/usage', {
              headers,
              cache: 'no-store'
            })
            if (usageResponse.ok) {
              const usageData = await usageResponse.json()
              setShowUpgradeModal(true)
              setSubscriptionUsage(usageData)
            }
          } catch (usageError) {
            console.error('Error fetching subscription usage:', usageError)
          }
          throw new Error('LIMIT_REACHED')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('AUTH_ERROR')
        } else if (response.status === 400) {
          throw new Error('VALIDATION_ERROR')
        } else {
          throw new Error('PDF_GENERATION_ERROR')
        }
      }

    } catch (error: any) {
      console.error('Error generating PDF:', error)
      const errorMessage = error?.message || error?.toString() || 'UNKNOWN'
      
      // Handle specific error types with clear messages
      let errorTitle = 'PDF Generation Failed'
      let errorDescription = ''
      
      if (errorMessage === 'LIMIT_REACHED') {
        errorTitle = 'Subscription Limit Reached'
        errorDescription = 'You\'ve reached your monthly invoice limit. Please upgrade to generate more PDFs.'
        // Upgrade modal already shown above
      } else if (errorMessage === 'AUTH_ERROR') {
        errorTitle = 'Authentication Error'
        errorDescription = 'Your session has expired. Please refresh the page and try again.'
      } else if (errorMessage === 'VALIDATION_ERROR') {
        errorTitle = 'Validation Error'
        errorDescription = 'Please check that all required fields are filled correctly before generating the PDF.'
      } else if (errorMessage === 'PDF_GENERATION_ERROR' || errorMessage.includes('Failed to generate PDF')) {
        errorTitle = 'PDF Generation Error'
        errorDescription = 'An error occurred while generating the PDF. This may be due to missing invoice data or a template issue. Please try again or contact support if the problem persists.'
      } else {
        errorTitle = 'PDF Generation Failed'
        errorDescription = 'An unexpected error occurred. Please try again or refresh the page.'
      }
      
      showError(errorTitle, errorDescription)
    } finally {
      setPdfLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Helper functions for reminders
  const addReminderRule = async (e?: React.MouseEvent) => {
    // Prevent event propagation to avoid closing modals
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Simple check: For free plan, only allow 4 reminder rules per invoice
    // Check if user is trying to add a 5th rule
    const currentRulesCount = reminders.rules.length;
    
    // Fetch subscription usage if not available
    let usageData = subscriptionUsage;
    if (!usageData) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/subscription/usage?t=${Date.now()}`, { 
          headers,
          cache: 'no-store' 
        });
        if (response.ok) {
          usageData = await response.json();
          setSubscriptionUsage(usageData);
        }
      } catch (error) {
        console.error('Error fetching subscription usage:', error);
      }
    }
    
    // CRITICAL FIX: Monthly plan users have unlimited reminders - skip all checks
    if (usageData && usageData.plan === 'monthly') {
      const newRule: ReminderRule = {
        id: Date.now().toString(),
        type: 'before',
        days: 1,
        enabled: true
      }
      setReminders({
        ...reminders,
        rules: [...reminders.rules, newRule]
      })
      return
    }
    
    // If premium unlocked, allow unlimited reminders
    if (isPremiumUnlocked) {
      const newRule: ReminderRule = {
        id: Date.now().toString(),
        type: 'before',
        days: 1,
        enabled: true
      }
      setReminders({
        ...reminders,
        rules: [...reminders.rules, newRule]
      })
      return
    }
    
    // For free plan: Block adding 5th rule (max 4 reminders per invoice)
    if (usageData && usageData.plan === 'free' && currentRulesCount >= 4) {
      showError('Free plan allows up to 4 reminder rules per invoice. Please upgrade for unlimited reminders.');
      return;
    }
    
    // Check if Pay Per Invoice user trying to add 5th reminder
    if (usageData && usageData.plan === 'pay_per_invoice' && currentRulesCount >= 4) {
      // If premium is already unlocked, allow it
      if (isPremiumUnlocked) {
        // Premium unlocked, allow unlimited reminders
        const newRule: ReminderRule = {
          id: Date.now().toString(),
          type: 'before',
          days: 1,
          enabled: true
        }
        setReminders({
          ...reminders,
          rules: [...reminders.rules, newRule]
        })
        return
      }
      
      // Premium not unlocked - show toast message instead of confirmation modal
      showWarning('Adding more than 4 reminders requires premium features. Unlock any premium template (Template 2 or 3) to enable unlimited reminders and all premium color presets for this invoice.');
      return;
    }
    
    const newRule: ReminderRule = {
      id: Date.now().toString(),
      type: 'before',
      days: 1,
      enabled: true
    }
    setReminders({
      ...reminders,
      rules: [...reminders.rules, newRule]
    })
  }

  const removeReminderRule = (id: string) => {
    setReminders({
      ...reminders,
      rules: reminders.rules.filter(rule => rule.id !== id)
    })
  }

  const updateReminderRule = (id: string, updates: Partial<ReminderRule>) => {
    setReminders({
      ...reminders,
      rules: reminders.rules.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      )
    })
  }

  const toggleSystemDefaults = () => {
    // Simple toggle - no complex limit checks
    setReminders({
      ...reminders,
      useSystemDefaults: !reminders.useSystemDefaults
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main Invoice Modal - Hide when upgrade modal is shown */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 ${showUpgradeModal ? 'hidden' : ''}`}>
      <div className={`shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden overflow-y-auto scroll-smooth ${
        isDarkMode 
          ? 'bg-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 ${
              isDarkMode 
                ? 'bg-indigo-500/20' 
                : 'bg-indigo-50'
            }`}>
              <Sparkles className={`h-5 w-5 ${
                isDarkMode 
                  ? 'text-indigo-400' 
                  : 'text-indigo-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-semibold ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Detailed Invoice
              </h2>
              <p className={`text-xs sm:text-sm ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }`}>
                Create professional invoices with auto reminders
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // If upgrade modal is showing, just hide it, don't close parent
              if (showUpgradeModal) {
                setShowUpgradeModal(false)
                setShowUpgradeContent(false)
              } else {
                handleClose()
              }
            }}
            className={`transition-colors p-1.5 cursor-pointer ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 sm:px-6 py-2">
          <div className="flex items-center justify-center space-x-1 sm:space-x-3 overflow-x-auto">
            {[
              { step: 1, label: 'Client', icon: User },
              { step: 2, label: 'Services', icon: FileText },
              { step: 3, label: 'Settings', icon: Settings },
              { step: 4, label: 'Review', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs font-medium hidden xs:inline ${
                  step <= currentStep
                    ? isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {step < 4 && (
                  <div className={`w-2 sm:w-6 h-0.5 mx-1 sm:mx-3 ${
                    step < currentStep ? 'bg-indigo-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Step 1: Client & Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className={`text-sm font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Client & Invoice Details</h3>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Select client and set basic information</p>
              </div>

              {/* Client Selection */}
              <div className="p-4 w-full">
                <h4 className={`text-sm font-semibold mb-3 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <User className="h-4 w-4 mr-2 text-indigo-600" />
                  Select Client
                </h4>

                {selectedClientId ? (
                  <div className={`flex items-center justify-between p-3 ${
                    isDarkMode 
                      ? 'bg-indigo-500/10' 
                      : 'bg-indigo-50'
                  }`}>
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
                      data-testid="quick-invoice-clear-client"
                      onClick={() => setSelectedClientId('')}
                      className={`text-xs font-medium px-3 py-1.5 transition-colors cursor-pointer ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {effectiveClients.length > 0 && (
                      <CustomDropdown
                        value={selectedClientId}
                        onChange={(value) => setSelectedClientId(value)}
                        options={[
                          ...effectiveClients.map(client => ({
                            value: client.id,
                            label: `${client.name}${client.company ? ` (${client.company})` : ''}`
                          })),
                          // Show current client even if not in clients list
                          ...(selectedClientId && !effectiveClients.find(c => c.id === selectedClientId) && editingInvoice?.client
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
                    )}
                    
                    {effectiveClients.length > 0 && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${
                            isDarkMode ? 'border-gray-600' : 'border-gray-200'
                          }`} />
                      </div>
                        <div className="relative flex justify-center text-xs">
                        <span className={`px-2 ${
                            isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                          }`}>or add new</span>
                      </div>
                    </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                        <input
                          type="text"
                            placeholder="Client name"
                          value={newClient.name}
                          onChange={(e) => {
                            setNewClient({...newClient, name: e.target.value})
                            if (errors.clientName) {
                              setErrors(prev => ({ ...prev, clientName: undefined }))
                            }
                          }}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              errors.clientName
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : isDarkMode 
                              ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
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
                          placeholder="client@example.com"
                          value={newClient.email}
                          onChange={(e) => {
                            setNewClient({...newClient, email: e.target.value})
                            if (errors.clientEmail) {
                              setErrors(prev => ({ ...prev, clientEmail: undefined }))
                            }
                          }}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              errors.clientEmail
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : isDarkMode 
                              ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
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

                {/* Invoice Details */}
                <div className="p-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" style={{ maxWidth: '100%' }}>
                  <div>
                    <div className="relative">
                      <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={invoiceNumber}
                        readOnly
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border transition-colors ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800 text-gray-300' 
                            : 'border-gray-300 bg-gray-50 text-gray-600'
                        }`}
                        placeholder="Auto-generated"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className={`w-2 h-2 rounded-full ${
                          isDarkMode ? 'bg-green-400' : 'bg-green-500'
                        }`} title="Auto-generated by system"></div>
                    </div>
                    </div>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Auto-generated by system
                    </p>
                  </div>

                  <div>
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => {
                          setIssueDate(e.target.value)
                          if (errors.issueDate) {
                            setErrors(prev => ({ ...prev, issueDate: undefined }))
                          }
                        }}
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.issueDate
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : isDarkMode 
                            ? 'border-gray-700 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        required
                      />
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <div className={`w-2 h-2 rounded-full ${
                          isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                        }`} title="Auto-selected current date"></div>
                    </div>
                    </div>
                    {errors.issueDate ? (
                      <p className="text-xs mt-1 text-red-600">{errors.issueDate}</p>
                    ) : (
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Issue Date {!editingInvoice ? '(Auto-selected)' : ''}
                    </p>
                    )}
                  </div>

                  <div>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
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
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        markAsPaid ? 'cursor-not-allowed opacity-60' : ''
                      } ${
                        errors.dueDate
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : isDarkMode 
                          ? 'border-gray-700 bg-gray-800 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      required
                    />
                    {paymentTerms.enabled && paymentTerms.defaultOption === 'Due on Receipt' && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <div className={`w-2 h-2 rounded-full ${
                          isDarkMode ? 'bg-orange-400' : 'bg-orange-500'
                        }`} title="Auto-updated by payment terms"></div>
                  </div>
                    )}
                  </div>
                  {errors.dueDate ? (
                    <p className="text-xs mt-1 text-red-600">{errors.dueDate}</p>
                  ) : (
                    <>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                        Due Date {markAsPaid && <span className="text-orange-600">(Locked - Due on Receipt)</span>}
                  </p>
                  {paymentTerms.enabled && paymentTerms.defaultOption !== 'Custom' && (
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      Auto-updated to match the payment terms
                    </p>
                      )}
                  {paymentTerms.enabled && paymentTerms.defaultOption === 'Custom' && (
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Set your custom due date manually
                    </p>
                      )}
                    </>
                  )}
                </div>
                  </div>
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto bg-indigo-600 text-white py-3 px-6 hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Services & Amount */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className={`text-sm sm:text-base font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Services & Amount</h3>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Add the services you provided and their amounts</p>
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className={`block text-sm font-medium ${
                    isDarkMode 
                      ? 'text-white' 
                      : 'text-gray-900'
                  }`}>
                    Services
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className={`flex items-center text-sm font-medium px-3 py-2 transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-800/30' 
                        : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Service
                  </button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className={`p-4 border ${
                      isDarkMode 
                        ? 'border-gray-700 bg-gray-800' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                        <div className="sm:col-span-2">
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Service Description *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Website Development, Consulting, Design"
                            value={item.description}
                            onChange={(e) => {
                              updateItem(item.id, 'description', e.target.value)
                              if (errors.items?.[item.id]?.description) {
                                setErrors(prev => {
                                  const newItems = { ...prev.items }
                                  if (newItems[item.id]) {
                                    delete newItems[item.id].description
                                    if (Object.keys(newItems[item.id]).length === 0) {
                                      delete newItems[item.id]
                                    }
                                  }
                                  return { ...prev, items: Object.keys(newItems).length > 0 ? newItems : undefined }
                                })
                              }
                            }}
                            className={`w-full px-3 py-2 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              errors.items?.[item.id]?.description
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : isDarkMode 
                                ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                            }`}
                          />
                          {errors.items?.[item.id]?.description && (
                            <p className="mt-1 text-xs text-red-600">{errors.items[item.id].description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <label className={`block text-xs font-medium mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Amount ({getCurrencySymbol(currency)})
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={item.amount}
                              onChange={(e) => {
                                updateItem(item.id, 'amount', e.target.value)
                                if (errors.items?.[item.id]?.amount) {
                                  setErrors(prev => {
                                    const newItems = { ...prev.items }
                                    if (newItems[item.id]) {
                                      delete newItems[item.id].amount
                                      if (Object.keys(newItems[item.id]).length === 0) {
                                        delete newItems[item.id]
                                      }
                                    }
                                    return { ...prev, items: Object.keys(newItems).length > 0 ? newItems : undefined }
                                  })
                                }
                              }}
                              className={`w-full px-3 py-2 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                errors.items?.[item.id]?.amount
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : isDarkMode 
                                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                              }`}
                            />
                            {errors.items?.[item.id]?.amount && (
                              <p className="mt-1 text-xs text-red-600">{errors.items[item.id].amount}</p>
                            )}
                          </div>
                          
                          {items.length > 1 && (
                            <button
                              type="button"
                              data-testid={`remove-item-${item.id}`}
                              onClick={() => removeItem(item.id)}
                              className={`p-2 transition-colors ml-2 cursor-pointer ${
                                isDarkMode 
                                  ? 'text-red-400 hover:text-red-200 hover:bg-red-900/20' 
                                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Currency
                    </label>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Invoice currency (base: {settings.baseCurrency || 'USD'})
                    </p>
                  </div>
                  <div className="w-40">
                    <CustomDropdown
                      value={currency}
                      onChange={(value) => {
                        setCurrency(value)
                        // Auto-set exchange rate to 1.0 if same as base currency
                        if (value === (settings.baseCurrency || 'USD')) {
                          setExchangeRate('1.0')
                        }
                      }}
                      options={CURRENCIES.map((curr) => ({
                        value: curr.code,
                        label: `${curr.code} - ${curr.symbol}`
                      }))}
                      placeholder="Select currency"
                      isDarkMode={isDarkMode}
                      searchable={true}
                      className="w-full"
                    />
                  </div>
                </div>
                {currency !== (settings.baseCurrency || 'USD') && (
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Exchange Rate ({currency} to {settings.baseCurrency || 'USD'})
                      </label>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        placeholder="1.0"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className={`w-full px-3 py-2 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Discount (Optional)
                    </label>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Enter discount amount
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium whitespace-nowrap ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {getCurrencySymbol(currency)}
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={discount || ''}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        style={{ paddingLeft: getCurrencySymbol(currency).length > 2 ? '3.5rem' : '2.75rem' }}
                        className={`w-full pr-3 py-2 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Rate */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tax Rate (%)
                      {settings?.isTaxRegistered === true && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </label>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {settings?.isTaxRegistered === true 
                        ? 'Tax rate is required when you are registered to charge tax'
                        : 'Enter tax rate percentage'}
                    </p>
                    {errors.taxRate && (
                      <p className="text-xs text-red-500 mt-1">{errors.taxRate}</p>
                    )}
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="0"
                      value={taxRate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setTaxRate(Math.round(value * 100) / 100 + '');
                        // Clear error when user starts typing
                        if (errors.taxRate) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.taxRate;
                            return newErrors;
                          });
                        }
                      }}
                      required={settings?.isTaxRegistered === true}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        errors.taxRate 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : isDarkMode 
                            ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <div className="relative">
                  <MessageSquare className={`absolute left-3 top-3 h-4 w-4 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                      isDarkMode 
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Thank you for your business!"
                    rows={3}
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount</span>
                      <span className={`font-semibold text-green-600`}>-{formatCurrency(totalDiscount, currency)}</span>
                    </div>
                  )}
                  {totalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax</span>
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{formatCurrency(totalTax, currency)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold border-t pt-3 ${
                    isDarkMode 
                      ? 'border-gray-600' 
                      : 'border-gray-300'
                  }`}>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-1 py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Settings (Reminders, Late Fees, Payment Terms & Colors) */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className={`text-sm sm:text-base font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Invoice Settings</h3>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Configure reminders, late fees, payment terms and colors</p>
              </div>

              {/* Template Selection */}
              <div className="p-5">
                  <TemplateSelector
                    selectedTemplate={theme.template}
                    onTemplateSelect={(template) => {
                      // Get plan info - default to 'free' if not loaded yet
                      const userPlan = subscriptionUsage?.plan || 'free';
                      const isPremiumTemplate = template !== 1;
                      
                      // CRITICAL FIX: Monthly plan users have unlimited access to all templates
                      // Skip all premium unlock checks for monthly plan users
                      if (userPlan === 'monthly') {
                        setTheme(prevTheme => ({...prevTheme, template}))
                        return
                      }
                      
                      // For pay-per-invoice users: If premium unlocked, only allow the unlocked template (not both 2 & 3)
                      if (isPremiumUnlocked && unlockedTemplate) {
                        // Only allow switching to the template that was unlocked OR template 1 (free)
                        if (template === unlockedTemplate || template === 1) {
                          setTheme(prevTheme => ({...prevTheme, template}))
                          return
                        } else {
                          // Block switching to the other premium template
                          showError(`Only Template ${unlockedTemplate} is unlocked for this invoice. You can switch to Template 1 (free) or keep Template ${unlockedTemplate}. To use Template ${template}, you would need to purchase it separately.`);
                          return
                        }
                      } else if (isPremiumUnlocked && !unlockedTemplate && userPlan === 'pay_per_invoice') {
                        // Fallback: if premium is unlocked but no specific template tracked, check current theme
                        // This only applies to pay-per-invoice users, not monthly plan users
                        // If current theme has premium template, lock the other one
                        if (theme.template === 2 && template === 3) {
                          showError('Only Template 2 is unlocked for this invoice. You can switch to Template 1 (free) or keep Template 2.');
                          return
                        } else if (theme.template === 3 && template === 2) {
                          showError('Only Template 3 is unlocked for this invoice. You can switch to Template 1 (free) or keep Template 3.');
                          return
                        }
                        setTheme(prevTheme => ({...prevTheme, template}))
                        return
                      }
                      
                      // Check if template is locked for free plan (or if plan data not loaded yet, treat as free)
                      if (userPlan === 'free' && isPremiumTemplate) {
                        showError('Free plan users can only use Template 1 (Minimal). Please upgrade to access all templates.');
                        return;
                      }
                      
                      // Check if Pay Per Invoice user trying to use premium template (2 or 3)
                      // Note: Premium templates ALWAYS require $0.50 charge, even if user has free invoices remaining
                      // Free invoices are only for basic features (Template 1, first 4 colors, max 4 reminders)
                      if (userPlan === 'pay_per_invoice' && isPremiumTemplate) {
                        // ALWAYS show confirmation modal for premium templates - they require $0.50 charge
                        // Free invoices are only for basic features, not premium templates
                        setPendingTemplate(template);
                        setPremiumFeatureType('template');
                        setShowPremiumFeatureConfirm(true);
                        return;
                      }
                      
                      // For monthly plan or other plans, allow template selection
                      setTheme(prevTheme => ({...prevTheme, template}))
                    }}
                    primaryColor={theme.primaryColor}
                    onPrimaryColorChange={(color) => {
                      // Check user plan first
                      const userPlan = subscriptionUsage?.plan || 'free';
                      
                      // CRITICAL FIX: Monthly plan users have unlimited access to all colors
                      if (userPlan === 'monthly') {
                        setTheme(prevTheme => ({...prevTheme, primaryColor: color}))
                        return
                      }
                      
                      // If premium unlocked, allow all colors
                      if (isPremiumUnlocked) {
                        setTheme(prevTheme => ({...prevTheme, primaryColor: color}))
                        return
                      }
                      
                      // For pay-per-invoice users: If premium is unlocked, allow all colors without confirmation
                      // If premium not unlocked, only allow first 4 color presets (free colors)
                      if (userPlan === 'pay_per_invoice' && !isPremiumUnlocked) {
                        // Check if this color is from a premium preset (beyond first 4)
                        const colorPresets = [
                          { name: 'Purple', primary: '#5C2D91', secondary: '#8B5CF6' },
                          { name: 'Blue', primary: '#1E40AF', secondary: '#3B82F6' },
                          { name: 'Green', primary: '#059669', secondary: '#10B981' },
                          { name: 'Red', primary: '#DC2626', secondary: '#EF4444' },
                          { name: 'Orange', primary: '#EA580C', secondary: '#F97316' },
                          { name: 'Pink', primary: '#DB2777', secondary: '#EC4899' },
                          { name: 'Indigo', primary: '#4338CA', secondary: '#6366F1' },
                          { name: 'Teal', primary: '#0D9488', secondary: '#14B8A6' },
                          { name: 'Black', primary: '#1F2937', secondary: '#374151' },
                          { name: 'Dark Gray', primary: '#374151', secondary: '#6B7280' },
                          { name: 'Navy', primary: '#1E3A8A', secondary: '#3B82F6' },
                          { name: 'Emerald', primary: '#047857', secondary: '#10B981' },
                          { name: 'Rose', primary: '#BE185D', secondary: '#F43F5E' },
                          { name: 'Amber', primary: '#D97706', secondary: '#F59E0B' },
                          { name: 'Cyan', primary: '#0891B2', secondary: '#06B6D4' },
                          { name: 'Violet', primary: '#7C2D12', secondary: '#A855F7' }
                        ];
                        
                        // Check if the new combination matches a premium preset (index 4+)
                        const matchesPremiumPreset = colorPresets.slice(4).some(preset => 
                          preset.primary === color && preset.secondary === theme.secondaryColor
                        );
                        
                        // Check if it matches any of the first 4 presets (free)
                        const matchesFirstFour = colorPresets.slice(0, 4).some(preset => 
                          preset.primary === color && preset.secondary === theme.secondaryColor
                        );
                        
                        // Block premium colors if premium not unlocked
                        if (matchesPremiumPreset && !matchesFirstFour) {
                          showError('Premium colors are unlocked when you select Template 2 or 3. Please unlock a premium template first to use premium color presets.');
                          return;
                        }
                      }
                      setTheme(prevTheme => ({...prevTheme, primaryColor: color}))
                    }}
                    secondaryColor={theme.secondaryColor}
                    onSecondaryColorChange={(color) => {
                      // Check user plan first
                      const userPlan = subscriptionUsage?.plan || 'free';
                      
                      // CRITICAL FIX: Monthly plan users have unlimited access to all colors
                      if (userPlan === 'monthly') {
                        setTheme(prevTheme => ({...prevTheme, secondaryColor: color}))
                        return
                      }
                      
                      // If premium unlocked, allow all colors
                      if (isPremiumUnlocked) {
                        setTheme(prevTheme => ({...prevTheme, secondaryColor: color}))
                        return
                      }
                      
                      // For pay-per-invoice users: If premium is unlocked, allow all colors without confirmation
                      // If premium not unlocked, only allow first 4 color presets (free colors)
                      if (userPlan === 'pay_per_invoice' && !isPremiumUnlocked) {
                        // Check if this color is from a premium preset (beyond first 4)
                        const colorPresets = [
                          { name: 'Purple', primary: '#5C2D91', secondary: '#8B5CF6' },
                          { name: 'Blue', primary: '#1E40AF', secondary: '#3B82F6' },
                          { name: 'Green', primary: '#059669', secondary: '#10B981' },
                          { name: 'Red', primary: '#DC2626', secondary: '#EF4444' },
                          { name: 'Orange', primary: '#EA580C', secondary: '#F97316' },
                          { name: 'Pink', primary: '#DB2777', secondary: '#EC4899' },
                          { name: 'Indigo', primary: '#4338CA', secondary: '#6366F1' },
                          { name: 'Teal', primary: '#0D9488', secondary: '#14B8A6' },
                          { name: 'Black', primary: '#1F2937', secondary: '#374151' },
                          { name: 'Dark Gray', primary: '#374151', secondary: '#6B7280' },
                          { name: 'Navy', primary: '#1E3A8A', secondary: '#3B82F6' },
                          { name: 'Emerald', primary: '#047857', secondary: '#10B981' },
                          { name: 'Rose', primary: '#BE185D', secondary: '#F43F5E' },
                          { name: 'Amber', primary: '#D97706', secondary: '#F59E0B' },
                          { name: 'Cyan', primary: '#0891B2', secondary: '#06B6D4' },
                          { name: 'Violet', primary: '#7C2D12', secondary: '#A855F7' }
                        ];
                        
                        // Check if the new combination matches a premium preset (index 4+)
                        const matchesPremiumPreset = colorPresets.slice(4).some(preset => 
                          preset.primary === theme.primaryColor && preset.secondary === color
                        );
                        
                        // Check if it matches any of the first 4 presets (free)
                        const matchesFirstFour = colorPresets.slice(0, 4).some(preset => 
                          preset.primary === theme.primaryColor && preset.secondary === color
                        );
                        
                        // Block premium colors if premium not unlocked
                        if (matchesPremiumPreset && !matchesFirstFour) {
                          showError('Premium colors are unlocked when you select Template 2 or 3. Please unlock a premium template first to use premium color presets.');
                          return;
                        }
                      }
                      setTheme(prevTheme => ({...prevTheme, secondaryColor: color}))
                    }}
                    isDarkMode={isDarkMode}
                    userPlan={subscriptionUsage?.plan as 'free' | 'monthly' | 'pay_per_invoice' || 'free'}
                    freeInvoicesRemaining={subscriptionUsage?.payPerInvoice?.freeInvoicesRemaining || 0}
                    isPremiumUnlocked={isPremiumUnlocked}
                    unlockedTemplate={unlockedTemplate}
                    onPremiumColorSelect={(primary: string, secondary: string) => {
                      // If premium is already unlocked, allow colors directly without confirmation
                      if (isPremiumUnlocked) {
                        setTheme({ ...theme, primaryColor: primary, secondaryColor: secondary })
                        return true // Allow color change
                      }
                      // Premium not unlocked - show error message
                      showError('Premium colors are unlocked when you select Template 2 or 3. Please unlock a premium template first to use premium color presets.')
                      return false // Prevent color change
                    }}
                  />
              </div>

              {/* Payment Terms */}
              <div className={`p-5 border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } ${markAsPaid ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                    Payment Terms
                    {markAsPaid && (
                      <span className="ml-2 text-xs text-orange-600">(Locked - Due on Receipt)</span>
                    )}
                  </h4>
                  <label className={`relative inline-flex items-center ${markAsPaid ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={paymentTerms.enabled}
                      onChange={(e) => !markAsPaid && setPaymentTerms({...paymentTerms, enabled: e.target.checked})}
                      disabled={markAsPaid}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-colors ${
                      paymentTerms.enabled 
                        ? 'bg-green-600' 
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform ${
                        paymentTerms.enabled ? 'translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>

                {paymentTerms.enabled && (
                  <div className="space-y-4">
                    {/* Payment Terms Info */}
                    <div className={`flex items-start space-x-3 p-3 ${
                      isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>
                      <Zap className={`h-4 w-4 mt-0.5 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div>
                        <p className={`text-xs font-medium ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                          What are Payment Terms?
                        </p>
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          This helps set clear expectations and improves cash flow.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Select Payment Terms
                      </label>
                      <CustomDropdown
                        value={paymentTerms.defaultOption}
                        onChange={(selectedTerm) => {
                          if (markAsPaid) return // Prevent changes when mark as paid is selected
                          setPaymentTerms({...paymentTerms, defaultOption: selectedTerm})
                          
                          // Smart due date adjustment based on payment terms
                          // Skip auto-update if "Custom" is selected - allow manual due date entry
                          if (selectedTerm === 'Custom') {
                            // Don't auto-update - let user set custom due date manually
                            return
                          } else if (selectedTerm === 'Due on Receipt') {
                            setDueDate(issueDate) // Set due date to issue date (today)
                          } else if (selectedTerm === 'Net 15') {
                            const newDueDate = new Date(issueDate)
                            newDueDate.setDate(newDueDate.getDate() + 15)
                            setDueDate(newDueDate.toISOString().split('T')[0])
                          } else if (selectedTerm === 'Net 30') {
                            const newDueDate = new Date(issueDate)
                            newDueDate.setDate(newDueDate.getDate() + 30)
                            setDueDate(newDueDate.toISOString().split('T')[0])
                          } else if (selectedTerm === '2/10 Net 30') {
                            const newDueDate = new Date(issueDate)
                            newDueDate.setDate(newDueDate.getDate() + 30)
                            setDueDate(newDueDate.toISOString().split('T')[0])
                          }
                        }}
                        disabled={markAsPaid}
                        options={[
                          { value: 'Due on Receipt', label: 'Due on Receipt' },
                          { value: 'Net 15', label: 'Net 15' },
                          { value: 'Net 30', label: 'Net 30' },
                          { value: '2/10 Net 30', label: '2/10 Net 30' },
                          { value: 'Custom', label: 'Custom' }
                        ]}
                        placeholder="Select Payment Terms"
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Payment Terms Explanation */}
                    <div className="space-y-2">
                      <h5 className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        What each term means:
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>Due on Receipt:</span>
                          <span>Payment due immediately</span>
                        </div>
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>Net 15:</span>
                          <span>Payment due in 15 days</span>
                        </div>
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>Net 30:</span>
                          <span>Payment due in 30 days</span>
                        </div>
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>2/10 Net 30:</span>
                          <span>2% discount if paid in 10 days, otherwise 30 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Reminders */}
              <div className={`p-5 border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } ${markAsPaid ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Bell className="h-4 w-4 mr-2 text-indigo-600" />
                    Auto Reminders
                    {markAsPaid && (
                      <span className="ml-2 text-xs text-orange-600">(Locked - Disabled)</span>
                    )}
                  </h4>
                  <label className={`relative inline-flex items-center ${markAsPaid ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={reminders.enabled}
                      onChange={async (e) => {
                        if (markAsPaid) return;
                        
                        // If disabling reminders, just update state
                        if (!e.target.checked) {
                          setReminders({...reminders, enabled: false});
                          return;
                        }
                        
                        // Simple enable - no complex limit checks
                        // The limit will be checked when actually sending reminders
                        setReminders({...reminders, enabled: true});
                      }}
                      disabled={markAsPaid}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-colors ${
                      reminders.enabled 
                        ? 'bg-indigo-600' 
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform ${
                        reminders.enabled ? 'translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>

                {reminders.enabled && (
                  <div className="space-y-4">
                    {/* Smart Reminder Logic Based on Payment Terms */}
                    {paymentTerms.enabled && (
                      <div className={`p-3 border ${
                        isDarkMode 
                          ? 'bg-amber-900/20 border-amber-800' 
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-start space-x-2">
                          <AlertCircle className={`h-4 w-4 mt-0.5 ${
                            isDarkMode ? 'text-amber-400' : 'text-amber-600'
                          }`} />
                          <div>
                            <p className={`text-xs font-medium ${
                              isDarkMode ? 'text-amber-300' : 'text-amber-700'
                            }`}>
                              Smart Reminder System
                            </p>
                            <p className={`text-xs mt-1 ${
                              isDarkMode ? 'text-amber-400' : 'text-amber-600'
                            }`}>
                              {paymentTerms.defaultOption === 'Due on Receipt' 
                                ? 'For "Due on Receipt" invoices, reminders will be sent immediately after due date to encourage quick payment.'
                                : `For "${paymentTerms.defaultOption}" invoices, reminders will be sent before and after the due date for optimal collection.`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* System vs Custom Choice */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Reminder Setup
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs cursor-pointer ${
                          reminders.useSystemDefaults 
                            ? (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                            : (isDarkMode ? 'text-white' : 'text-gray-900')
                        }`}>
                          Custom
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reminders.useSystemDefaults}
                            onChange={toggleSystemDefaults}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 rounded-full peer transition-colors ${
                            reminders.useSystemDefaults 
                              ? 'bg-indigo-600' 
                              : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform ${
                              reminders.useSystemDefaults ? 'translate-x-5' : ''
                            }`}></div>
                          </div>
                        </label>
                        <span className={`text-xs ${
                          reminders.useSystemDefaults 
                            ? (isDarkMode ? 'text-white' : 'text-gray-900')
                            : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                        }`}>
                          Smart
                        </span>
                      </div>
                    </div>

                    {reminders.useSystemDefaults ? (
                      /* Smart Defaults - Payment Terms Aware */
                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Smart Reminders
                          </span>
                        </div>
                        <p className={`text-xs mb-3 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {paymentTerms.enabled 
                            ? `System will automatically send reminders optimized for "${paymentTerms.defaultOption}" payment terms`
                            : 'System will automatically send reminders at optimal times'
                          }
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {paymentTerms.enabled && paymentTerms.defaultOption === 'Due on Receipt' ? (
                            // Special logic for "Due on Receipt"
                            <>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>1 day after</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>3 days after</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>7 days after</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>14 days after</span>
                              </div>
                            </>
                          ) : (
                            // Standard logic for other payment terms
                            <>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>7 days before</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>3 days before</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>1 day after</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>7 days after</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Custom Reminders - Simplified */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Custom Rules
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addReminderRule(e);
                            }}
                            className={`text-sm font-medium px-4 py-2 transition-colors cursor-pointer ${
                              isDarkMode
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                          >
                            <Plus className="h-3 w-3 inline mr-1" />
                            Add Rule
                          </button>
                        </div>

                        {reminders.rules.map((rule) => (
                          <div key={rule.id} className="flex items-center space-x-3 py-2">
                            <CustomDropdown
                              value={rule.type}
                              onChange={(value) => !markAsPaid && updateReminderRule(rule.id, { type: value as 'before' | 'after' })}
                              disabled={markAsPaid}
                              options={[
                                { value: 'before', label: 'Before Due Date' },
                                { value: 'after', label: 'After Due Date' }
                              ]}
                              placeholder="Select type"
                              isDarkMode={isDarkMode}
                              className="w-32"
                            />
                            
                            <input
                              type="number"
                              value={rule.days}
                              onChange={(e) => !markAsPaid && updateReminderRule(rule.id, { days: parseInt(e.target.value) || 0 })}
                              disabled={markAsPaid}
                              className={`w-20 px-3 py-2 text-sm border focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                markAsPaid ? 'cursor-not-allowed opacity-60' : ''
                              } ${
                                isDarkMode 
                                  ? 'border-gray-700 bg-gray-800 text-white' 
                                  : 'border-gray-300 bg-white text-gray-900'
                              }`}
                              placeholder="Days"
                            />
                            
                            <span className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              days
                            </span>
                            
                            <button
                              type="button"
                              data-testid={`remove-reminder-rule-${rule.id}`}
                              onClick={() => !markAsPaid && removeReminderRule(rule.id)}
                              disabled={markAsPaid}
                              className={`ml-auto text-red-500 hover:text-red-700 p-1 ${
                                markAsPaid ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                              }`}
                              title="Delete rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Late Fees */}
              <div className={`p-5 border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } ${markAsPaid ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                    Late Fees
                    {markAsPaid && (
                      <span className="ml-2 text-xs text-orange-600">(Locked - Disabled)</span>
                    )}
                  </h4>
                  <label className={`relative inline-flex items-center ${markAsPaid ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={lateFees.enabled}
                      onChange={(e) => !markAsPaid && setLateFees({...lateFees, enabled: e.target.checked})}
                      disabled={markAsPaid}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-colors ${
                      lateFees.enabled 
                        ? 'bg-orange-600' 
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform ${
                        lateFees.enabled ? 'translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>

                {lateFees.enabled && (
                  <div className="space-y-4">
                    {/* Helpful description */}
                    <div className={`p-3 ${
                      isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'
                    }`}>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-orange-300' : 'text-orange-700'
                      }`}>
                        💡 <strong>Late fees</strong> are automatically added to overdue invoices. Choose between a fixed amount ({getCurrencySymbol(currency)}) or a percentage of the invoice total.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Fee Type
                        </label>
                        <CustomDropdown
                          value={lateFees.type}
                          onChange={(value) => !markAsPaid && setLateFees({...lateFees, type: value as 'fixed' | 'percentage'})}
                          disabled={markAsPaid}
                          options={[
                            { value: 'fixed', label: `Fixed Amount (${getCurrencySymbol(currency)})` },
                            { value: 'percentage', label: 'Percentage (%)' }
                          ]}
                          placeholder="Select fee type"
                          isDarkMode={isDarkMode}
                        />
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {lateFees.type === 'fixed' ? `Fixed amount (${getCurrencySymbol(currency)})` : 'Percentage of invoice total'}
                        </p>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Amount {lateFees.type === 'percentage' && <span className="text-orange-600">(%)</span>}
                        </label>
                        <input
                          type="number"
                          value={lateFees.amount === 0 ? '' : lateFees.amount}
                          onChange={(e) => {
                            if (!markAsPaid) {
                              const value = e.target.value;
                              setLateFees({...lateFees, amount: value === '' ? 0 : parseFloat(value) || 0});
                            }
                          }}
                          onBlur={(e) => {
                            if (!markAsPaid && e.target.value === '') {
                              setLateFees({...lateFees, amount: 0});
                            }
                          }}
                          disabled={markAsPaid}
                          className={`w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            markAsPaid ? 'cursor-not-allowed opacity-60' : ''
                          } ${
                            isDarkMode 
                              ? 'border-gray-700 bg-gray-800 text-white' 
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                          placeholder={lateFees.type === 'fixed' ? '25.00' : '5'}
                          min="0"
                          max={lateFees.type === 'percentage' ? '100' : undefined}
                        />
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {lateFees.type === 'fixed' 
                            ? `e.g., ${formatCurrency(25, currency)} per late invoice` 
                            : 'e.g., 5% of invoice total'
                          }
                        </p>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Grace Period (days)
                        </label>
                        <input
                          type="number"
                          value={lateFees.gracePeriod === 0 ? '' : lateFees.gracePeriod}
                          onChange={(e) => {
                            if (!markAsPaid) {
                              const value = e.target.value;
                              setLateFees({...lateFees, gracePeriod: value === '' ? 0 : parseInt(value) || 0});
                            }
                          }}
                          onBlur={(e) => {
                            if (!markAsPaid && e.target.value === '') {
                              setLateFees({...lateFees, gracePeriod: 0});
                            }
                          }}
                          disabled={markAsPaid}
                          className={`w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            markAsPaid ? 'cursor-not-allowed opacity-60' : ''
                          } ${
                            isDarkMode 
                              ? 'border-gray-700 bg-gray-800 text-white' 
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                          placeholder="7"
                          min="0"
                        />
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Days after due date before late fees apply
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>



              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-1 py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Review</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className={`text-base sm:text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Review & Create Invoice</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Review your invoice details before creating</p>
              </div>

              {/* Invoice Preview */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Business Info */}
                  <div>
                    <h4 className={`text-md font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>From:</h4>
                    <div className={`text-sm space-y-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <p className="font-semibold">{businessDetails.name || 'Your Business Name'}</p>
                      <p>{businessDetails.address || 'Your Business Address'}</p>
                      <p>{businessDetails.phone || 'Your Phone Number'}</p>
                      <p>{businessDetails.email || 'your@email.com'}</p>
                      {businessDetails.website && <p>{businessDetails.website}</p>}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h4 className={`text-md font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>To:</h4>
                    <div className={`text-sm space-y-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedClientId ? (
                        <>
                          <p className="font-semibold">{clients.find(c => c.id === selectedClientId)?.name}</p>
                          <p>{clients.find(c => c.id === selectedClientId)?.email}</p>
                          {clients.find(c => c.id === selectedClientId)?.company && (
                            <p>{clients.find(c => c.id === selectedClientId)?.company}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">{newClient.name}</p>
                          <p>{newClient.email}</p>
                          {newClient.company && <p>{newClient.company}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Invoice #:</span>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoiceNumber}</p>
                    </div>
                    <div>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Issue Date:</span>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{issueDate}</p>
                    </div>
                    <div>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Due Date:</span>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {dueDate}
                        {paymentTerms.enabled && paymentTerms.defaultOption === 'Due on Receipt' && (
                          <span className={`text-xs ml-2 ${
                            isDarkMode ? 'text-orange-400' : 'text-orange-600'
                          }`}>
                            (Due on Receipt)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services Summary */}
                <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
                  <h4 className={`text-md font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Services:</h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {item.description}
                        </span>
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)), currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(subtotal, currency)}
                      </span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount</span>
                        <span className="font-semibold text-green-600">-{formatCurrency(totalDiscount, currency)}</span>
                      </div>
                    )}
                    {totalTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax</span>
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(totalTax, currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(total, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Summary */}
              <div className="p-5">
                <h4 className={`text-sm font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Configured Features
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Reminders */}
                  <div className="flex items-center space-x-2">
                    <Bell className={`h-4 w-4 ${
                      reminders.enabled ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Auto Reminders: {reminders.enabled ? 
                        (reminders.useSystemDefaults ? 'Smart System' : (() => {
                          const rules = reminders.rules || reminders.customRules || [];
                          const enabledRules = rules.filter(r => r.enabled);
                          return `${enabledRules.length} Custom Rules`;
                        })()) 
                        : 'Disabled'
                      }
                    </span>
                  </div>

                  {/* Late Fees */}
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      lateFees.enabled ? 'text-orange-500' : 'text-gray-400'
                    }`} />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Late Fees: {lateFees.enabled ? 
                        `${lateFees.type === 'fixed' ? getCurrencySymbol(currency) : ''}${lateFees.amount}${lateFees.type === 'percentage' ? '%' : ''} after ${lateFees.gracePeriod} days` 
                        : 'Disabled'
                      }
                    </span>
                  </div>

                  {/* Payment Terms */}
                  <div className="flex items-center space-x-2">
                    <CreditCard className={`h-4 w-4 ${
                      paymentTerms.enabled ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Payment Terms: {paymentTerms.enabled ? paymentTerms.defaultOption : 'Not Set'}
                    </span>
                  </div>

                  {/* Theme */}
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4 text-indigo-500" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Custom Colors: Applied
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-shrink-0 py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                
                {/* Generate PDF and Create Draft buttons - always mounted with stable structure to prevent fade and layout shift */}
                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={handleGeneratePDF}
                    disabled={pdfLoading || markAsPaid || showMissingDetailsWarning}
                    className="flex-1 py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                    style={{ 
                      minWidth: 0, 
                      minHeight: '48px', // Fixed height to prevent layout shift
                      visibility: (markAsPaid || showMissingDetailsWarning) ? 'hidden' : 'visible', // Use visibility instead of hidden class
                      backgroundColor: '#2563EB',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (!pdfLoading && !markAsPaid && !showMissingDetailsWarning) {
                        e.currentTarget.style.backgroundColor = '#1D4ED8'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!pdfLoading && !markAsPaid && !showMissingDetailsWarning) {
                        e.currentTarget.style.backgroundColor = '#2563EB'
                      }
                    }}
                  >
                    {pdfLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Generate PDF</span>
                      </>
                    )}
                  </button>
                  
                  {/* Create button - changes to "Update Settings" when missing details */}
                  <button
                    ref={createButtonRef}
                    type="button"
                    data-testid="quick-invoice-create-draft"
                    onClick={hasMissingDetails && showMissingDetailsWarning ? () => {
                      onClose();
                      router.push('/dashboard/settings');
                    } : handleCreateDraft}
                    disabled={creatingLoading || sendingLoading || markAsPaid || (showMissingDetailsWarning && !hasMissingDetails)}
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
                      if (!creatingLoading && !sendingLoading && !markAsPaid) {
                        if (hasMissingDetails && showMissingDetailsWarning) {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#4338CA' : '#4F46E5'
                        } else {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#4B5563'
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!creatingLoading && !sendingLoading && !markAsPaid) {
                        if (hasMissingDetails && showMissingDetailsWarning) {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#4F46E5' : '#6366F1'
                        } else {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#4B5563' : '#6B7280'
                        }
                      }
                    }}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {creatingLoading ? (
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
                          <FileText className="h-4 w-4" />
                          <span>Create</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
                
                {/* Send button - changes to "Send Anyway" when missing details */}
                <button
                  type="button"
                  data-testid="quick-invoice-create-and-send"
                  onClick={() => {
                    if (hasMissingDetails && showMissingDetailsWarning) {
                      // Send anyway
                      setShowMissingDetailsWarning(false);
                      shouldSendRef.current = true;
                      setShouldSend(true);
                      const form = document.querySelector('form');
                      if (form) {
                        form.requestSubmit();
                      }
                    } else if (hasMissingDetails) {
                      setShowMissingDetailsWarning(true);
                      const missingText = missingDetails.missing.length === 1 
                        ? missingDetails.missing[0]
                        : `${missingDetails.missing.slice(0, 2).join(', ')}${missingDetails.missing.length > 2 ? ` +${missingDetails.missing.length - 2} more` : ''}`;
                      localShowWarning('Missing Business Details', `Please update: ${missingText} before sending.`);
                      return;
                    } else {
                      shouldSendRef.current = true;
                      setShouldSend(true);
                      const form = document.querySelector('form');
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  }}
                  disabled={creatingLoading || sendingLoading}
                  className={`flex-1 ${markAsPaid ? 'sm:flex-1' : ''} py-3 px-6 transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer ${
                    isDarkMode 
                      ? (hasMissingDetails && showMissingDetailsWarning ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                      : (hasMissingDetails && showMissingDetailsWarning ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                  }`}
                  style={{ minHeight: '48px' }}
                >
                  {sendingLoading ? (
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
            // DO NOT call wrappedOnClose() - keep the parent modal open
            // Refresh usage after modal closes in case user upgraded
            if (!editingInvoice && user) {
              fetchSubscriptionUsage()
            }
          }}
          onBeforeRedirect={() => {
            // Save form state before redirecting to payment
            const formState = {
              items: items.map(item => ({
                description: item.description,
                amount: item.amount
              })),
              selectedClientId,
              newClient: {
                name: newClient.name,
                email: newClient.email,
                company: newClient.company,
                address: newClient.address
              },
              invoiceNumber,
              issueDate,
              dueDate,
              notes,
              discount: discount,
              taxRate: taxRate,
              theme: {
                template: theme.template,
                primaryColor: theme.primaryColor,
                secondaryColor: theme.secondaryColor,
                accentColor: theme.accentColor
              },
              reminderSettings: reminders,
              currentStep,
              timestamp: Date.now()
            }
            localStorage.setItem('pending_invoice_form', JSON.stringify(formState))
            console.log('💾 Form state saved to localStorage (QuickInvoiceModal)')
          }}
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
      
      {/* Premium Feature Confirmation Modal */}
      {typeof window !== 'undefined' && showPremiumFeatureConfirm && createPortal(
        <ConfirmationModal
          isOpen={showPremiumFeatureConfirm}
          onClose={() => {
            setShowPremiumFeatureConfirm(false)
            setPremiumFeatureType(null)
            setPendingTemplate(null)
            setPendingColors(null)
          }}
          onConfirm={() => {
            if (premiumFeatureType === 'template' && pendingTemplate) {
              // User confirmed - unlock premium features for this invoice (selected template, all colors, unlimited reminders)
              // Note: Only the selected template is unlocked, not both templates 2 & 3
              setIsPremiumUnlocked(true)
              setUnlockedTemplate(pendingTemplate) // Track which template was unlocked
              setTheme({ ...theme, template: pendingTemplate })
              showWarning(`Premium template selected (Template ${pendingTemplate}). All premium features (Template ${pendingTemplate}, all color presets, unlimited reminders) unlocked for this invoice. This invoice will be charged $0.50 when sent.`)
            } else if (premiumFeatureType === 'reminder') {
              // User confirmed - unlock all features for this invoice
              setIsPremiumUnlocked(true)
              const newRule: ReminderRule = {
                id: Date.now().toString(),
                type: 'before',
                days: 1,
                enabled: true
              }
              setReminders({
                ...reminders,
                rules: [...reminders.rules, newRule]
              })
              showWarning('Premium reminders enabled. All features (templates, colors, reminders) unlocked for this invoice. This invoice will be charged $0.50 when sent.')
            } else if (premiumFeatureType === 'customization' && pendingColors) {
              // User confirmed - unlock all features for this invoice
              setIsPremiumUnlocked(true)
              setTheme({ ...theme, primaryColor: pendingColors.primary, secondaryColor: pendingColors.secondary })
              showWarning('Premium colors selected. All features (templates, colors, reminders) unlocked for this invoice. This invoice will be charged $0.50 when sent.')
            }
            setShowPremiumFeatureConfirm(false)
            setPremiumFeatureType(null)
            setPendingTemplate(null)
            setPendingColors(null)
          }}
          title={
            premiumFeatureType === 'template' 
              ? 'Premium Template Selected' 
              : premiumFeatureType === 'reminder'
              ? 'Premium Reminders Enabled'
              : 'Premium Colors Selected'
          }
          message={
            premiumFeatureType === 'template' 
              ? `Selecting Template ${pendingTemplate} will unlock premium features for this invoice only (Template ${pendingTemplate}, all color presets, unlimited reminders). This will charge $0.50 when you send this invoice, even though you have ${subscriptionUsage?.payPerInvoice?.freeInvoicesRemaining || 0} free invoices remaining.\n\nFree invoices only apply to basic features (Template 1, max 4 reminders, first 4 color presets).\n\nDo you want to unlock premium features for this invoice?`
              : premiumFeatureType === 'reminder'
              ? `Adding more than 4 reminders will unlock premium features for this invoice only (all color presets, unlimited reminders). This will charge $0.50 when you send this invoice, even though you have ${subscriptionUsage?.payPerInvoice?.freeInvoicesRemaining || 0} free invoices remaining.\n\nFree invoices only apply to basic features (Template 1, max 4 reminders, first 4 color presets).\n\nDo you want to unlock premium features for this invoice?`
              : `Selecting premium colors will unlock premium features for this invoice only (all color presets, unlimited reminders). This will charge $0.50 when you send this invoice, even though you have ${subscriptionUsage?.payPerInvoice?.freeInvoicesRemaining || 0} free invoices remaining.\n\nFree invoices only apply to basic features (Template 1, max 4 reminders, first 4 color presets).\n\nDo you want to unlock premium features for this invoice?`
          }
          infoBanner={
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
                TIP
              </p>
              <p className="text-sm font-medium text-gray-900">
                Subscribe to Monthly Plan ($9/month) to get unlimited access to all templates, colors, reminders, and features. No per-invoice charges!
              </p>
            </div>
          }
          confirmText="Yes, Unlock Premium Features"
          cancelText="Cancel"
          type="warning"
        />,
        document.body
      )}

      {/* Toast Container for local toasts */}
      <ToastContainer toasts={localToasts} onRemove={localRemoveToast} />
    </>
  )
}
