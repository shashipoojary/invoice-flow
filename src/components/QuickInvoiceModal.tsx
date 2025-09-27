'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  X, Plus, Minus, Send, User, Mail, 
  Calendar, FileText, DollarSign, Download, 
  ArrowRight, ArrowLeft, Hash, MessageSquare, 
  Bell, Palette, Settings, CheckCircle, Sparkles,
  Clock, CreditCard, AlertTriangle, Trash2,
  Zap
} from 'lucide-react'

interface QuickInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  // user parameter removed - not used
  getAuthHeaders: () => Promise<{ [key: string]: string }>
  isDarkMode?: boolean
  clients?: Client[]
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
  clients: propClients = []
}: QuickInvoiceModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    address: ''
  })
  
  // Invoice basic details
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('Thank you for your business!')
  
  // Business details
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
  
  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', amount: '' }
  ])
  
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [discount, setDiscount] = useState('')
  
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
    options: ['Net 15', 'Net 30', 'Due on Receipt', '2/10 Net 30'],
    defaultOption: 'Net 30'
  })
  
  // Invoice theme
  const [theme, setTheme] = useState<InvoiceTheme>({
    primaryColor: '#4f46e5', // indigo-600
    secondaryColor: '#6366f1', // indigo-500
    accentColor: '#8b5cf6' // violet-500
  })

  const fetchClients = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/clients', {
        headers
      })
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [getAuthHeaders])

  const fetchBusinessSettings = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/settings', {
        headers
      })
      const data = await response.json()
      if (data.settings) {
        setBusinessDetails({
          name: data.settings.business_name || '',
          address: data.settings.address || '',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          website: data.settings.website || '',
          paymentDetails: {
            paypal: data.settings.paypal_email || '',
            bankAccount: data.settings.bank_account || '',
            upiId: data.settings.google_pay_upi || '',
            venmo: data.settings.venmo_id || '',
            other: data.settings.payment_notes || ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    if (isOpen) {
      // Use prop clients if available, otherwise fetch
      if (propClients.length > 0) {
        setClients(propClients)
      } else {
        fetchClients()
      }
      fetchBusinessSettings()
      
      // Set default dates
      const today = new Date()
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      
      setIssueDate(today.toISOString().split('T')[0])
      setDueDate(defaultDueDate.toISOString().split('T')[0])
      
      // Generate invoice number
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`
      setInvoiceNumber(invoiceNum)
    }
  }, [isOpen, fetchClients, fetchBusinessSettings, propClients])

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
    const discountAmount = parseFloat(discount.toString()) || 0
    const total = subtotal - discountAmount
    
    return { 
      subtotal, 
      discount: discountAmount, 
      total
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      calculateTotals()
      // Calculate totals for validation

      // Validate required fields
      if (!selectedClientId && !newClient.name) {
        alert('Please select a client or enter client details')
        return
      }

      if (items.some(item => !item.description || !item.amount || parseFloat(item.amount.toString()) <= 0)) {
        alert('Please fill in all item details with valid amounts')
        return
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
        discount: parseFloat(discount.toString()) || 0,
        notes: notes,
        billing_choice: 'per_invoice',
        type: 'detailed', // Mark as detailed invoice
        // New features
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        reminders: reminders.enabled ? {
          enabled: true,
          use_system_defaults: reminders.useSystemDefaults,
          rules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            type: rule.type,
            days: rule.days
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
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor
        }
      }

      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.invoice) {
        // Send the invoice to the client
        const sendResponse = await fetch('/api/invoices/send', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            invoiceId: result.invoice.id,
            clientEmail: selectedClientId ? 
              (clients.find(c => c.id === selectedClientId)?.email || newClient.email) : 
              newClient.email,
            clientName: selectedClientId ? 
              (clients.find(c => c.id === selectedClientId)?.name || newClient.name) : 
              newClient.name
          })
        })

        if (sendResponse.ok) {
          alert('Invoice created and sent successfully!')
        } else {
          alert('Invoice created but failed to send. You can send it later from the invoice list.')
        }
      } else {
        throw new Error(result.error || 'Failed to create invoice')
      }

      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, discount: totalDiscount, total } = calculateTotals()

  const resetForm = () => {
    setCurrentStep(1)
    setSelectedClientId('')
    setNewClient({ name: '', email: '', company: '', address: '' })
    setItems([{ id: '1', description: '', amount: '' }])
    setNotes('Thank you for your business!')
    setDiscount('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleGeneratePDF = async () => {
    setPdfLoading(true)
    try {
      // Validate required fields for PDF generation
      if (!selectedClientId && !newClient.name) {
        alert('Please select a client or enter client details')
        return
      }

      if (items.some(item => !item.description || !item.amount || parseFloat(item.amount.toString()) <= 0)) {
        alert('Please fill in all item details with valid amounts')
        return
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
        discount: parseFloat(discount.toString()) || 0,
        notes: notes,
        billing_choice: 'per_invoice',
        type: 'detailed', // Mark as detailed invoice
        // New features
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        reminders: reminders.enabled ? {
          enabled: true,
          use_system_defaults: reminders.useSystemDefaults,
          rules: reminders.rules.filter(rule => rule.enabled).map(rule => ({
            type: rule.type,
            days: rule.days
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
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor
        },
        // PDF generation flag
        generate_pdf_only: true
      }

      const headers = await getAuthHeaders()
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
        alert('PDF generated successfully!')
      } else {
        throw new Error('Failed to generate PDF')
      }

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
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
  const addReminderRule = () => {
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
    setReminders({
      ...reminders,
      useSystemDefaults: !reminders.useSystemDefaults
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className={`rounded-xl sm:rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-y-auto scroll-smooth ${
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
            <div className={`p-2.5 rounded-lg ${
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
            onClick={handleClose}
            className={`transition-colors p-1.5 rounded-lg ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
            {[
              { step: 1, label: 'Client', icon: User },
              { step: 2, label: 'Services', icon: FileText },
              { step: 3, label: 'Settings', icon: Settings },
              { step: 4, label: 'Review', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs font-medium hidden sm:inline ${
                  step <= currentStep
                    ? isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {step < 4 && (
                  <div className={`w-3 sm:w-6 h-0.5 mx-2 sm:mx-3 ${
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
            <div className="space-y-4 sm:space-y-5">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className={`text-sm sm:text-base font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Client & Invoice Details</h3>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Select client and set basic invoice information</p>
              </div>

              {/* Client Selection */}
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-sm font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <User className="h-4 w-4 mr-2 text-indigo-600" />
                  Select Client
                </h4>

                {selectedClientId ? (
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-indigo-900/20 border-indigo-800' 
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-indigo-800' : 'bg-indigo-100'
                      }`}>
                        <User className={`h-4 w-4 ${
                          isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
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
                      onClick={() => setSelectedClientId('')}
                      className={`text-xs font-medium px-3 py-2 rounded transition-colors ${
                        isDarkMode 
                          ? 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-800/30' 
                          : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.length > 0 && (
                    <div className="relative">
                      <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                          className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none cursor-pointer ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                          <option value="">Select existing client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    )}
                    
                    {clients.length > 0 && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${
                            isDarkMode ? 'border-gray-600' : 'border-gray-300'
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
                          onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        </div>
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
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={invoiceNumber}
                      readOnly
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800/50 text-gray-300' 
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
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      required
                    />
                    {paymentTerms.enabled && paymentTerms.defaultOption === 'Due on Receipt' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className={`w-2 h-2 rounded-full ${
                          isDarkMode ? 'bg-orange-400' : 'bg-orange-500'
                        }`} title="Auto-updated by payment terms"></div>
                  </div>
                    )}
                  </div>
                  {paymentTerms.enabled && paymentTerms.defaultOption === 'Due on Receipt' && (
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      Auto-updated to match &quot;Due on Receipt&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm"
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
                    className={`flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
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
                    <div key={item.id} className={`p-4 border rounded-lg ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800/50' 
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
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              isDarkMode 
                                ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                            }`}
                          />
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <label className={`block text-xs font-medium mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Amount ($)
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={item.amount}
                              onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                isDarkMode 
                                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                              }`}
                            />
                          </div>
                          
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className={`p-2 rounded-lg transition-colors ml-2 ${
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

              {/* Discount */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
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
                      Enter discount amount in $
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        placeholder="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Thank you for your business!"
                    rows={3}
                  />
                </div>
              </div>

              {/* Totals */}
              <div className={`p-6 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>${subtotal.toLocaleString()}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount</span>
                      <span className={`font-semibold text-green-600`}>-${totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold border-t pt-3 ${
                    isDarkMode 
                      ? 'border-gray-600' 
                      : 'border-gray-300'
                  }`}>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm ${
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
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm"
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

              {/* Auto Reminders */}
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Bell className="h-4 w-4 mr-2 text-indigo-600" />
                    Auto Reminders
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminders.enabled}
                      onChange={(e) => setReminders({...reminders, enabled: e.target.checked})}
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
                    {/* System vs Custom Choice */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Reminder Setup
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${
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
                      /* Smart Defaults - Clean Design */
                      <div className={`p-4 rounded-lg border ${
                        isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
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
                          System will automatically send reminders at optimal times
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
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
                            onClick={addReminderRule}
                            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
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
                            <select
                              value={rule.type}
                              onChange={(e) => updateReminderRule(rule.id, { type: e.target.value as 'before' | 'after' })}
                              className={`px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                isDarkMode 
                                  ? 'border-gray-600 bg-gray-800' 
                                  : 'border-gray-300 bg-white'
                              } ${
                                rule.type === 'before'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              <option value="before" className="text-green-600 dark:text-green-400">Before Due Date</option>
                              <option value="after" className="text-red-600 dark:text-red-400">After Due Date</option>
                            </select>
                            
                            <input
                              type="number"
                              value={rule.days}
                              onChange={(e) => updateReminderRule(rule.id, { days: parseInt(e.target.value) || 0 })}
                              className={`w-20 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                isDarkMode 
                                  ? 'border-gray-600 bg-gray-800 text-white' 
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
                              onClick={() => removeReminderRule(rule.id)}
                              className="ml-auto text-red-500 hover:text-red-700 p-1"
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
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                    Late Fees
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lateFees.enabled}
                      onChange={(e) => setLateFees({...lateFees, enabled: e.target.checked})}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Fee Type
                      </label>
                      <select
                        value={lateFees.type}
                        onChange={(e) => setLateFees({...lateFees, type: e.target.value as 'fixed' | 'percentage'})}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Amount
                      </label>
                      <input
                        type="number"
                        value={lateFees.amount}
                        onChange={(e) => setLateFees({...lateFees, amount: parseFloat(e.target.value) || 0})}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder={lateFees.type === 'fixed' ? '25.00' : '5'}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Grace Period (days)
                      </label>
                      <input
                        type="number"
                        value={lateFees.gracePeriod}
                        onChange={(e) => setLateFees({...lateFees, gracePeriod: parseInt(e.target.value) || 0})}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="7"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Terms */}
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                    Payment Terms
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentTerms.enabled}
                      onChange={(e) => setPaymentTerms({...paymentTerms, enabled: e.target.checked})}
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
                    {/* Explanation */}
                    <div className={`p-3 rounded-lg ${
                      isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className={`text-xs font-medium ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-700'
                          }`}>
                            What are Payment Terms?
                          </p>
                          <p className={`text-xs mt-1 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            Payment terms define when and how clients should pay your invoice. 
                            This helps set clear expectations and improves cash flow.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Select Payment Terms
                      </label>
                      <select
                        value={paymentTerms.defaultOption}
                        onChange={(e) => {
                          const selectedTerm = e.target.value
                          setPaymentTerms({...paymentTerms, defaultOption: selectedTerm})
                          
                          // Auto-update due date based on payment terms
                          if (selectedTerm === 'Due on Receipt') {
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
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        {paymentTerms.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
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
                          <span><strong>Net 15:</strong> Payment due within 15 days</span>
                        </div>
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span><strong>Net 30:</strong> Payment due within 30 days</span>
                        </div>
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span><strong>Due on Receipt:</strong> Payment due immediately</span>
                        </div>
                        <div className={`flex justify-between ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span><strong>2/10 Net 30:</strong> 2% discount if paid in 10 days, otherwise 30 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Customization */}
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-sm font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Palette className="h-4 w-4 mr-2 text-indigo-600" />
                  Invoice Colors
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Primary
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => setTheme({...theme, primaryColor: e.target.value})}
                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className={`text-xs font-mono ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {theme.primaryColor}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Secondary
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={theme.secondaryColor}
                        onChange={(e) => setTheme({...theme, secondaryColor: e.target.value})}
                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className={`text-xs font-mono ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {theme.secondaryColor}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Accent
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => setTheme({...theme, accentColor: e.target.value})}
                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className={`text-xs font-mono ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {theme.accentColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm ${
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
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm"
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
              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
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
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹{subtotal.toLocaleString()}
                      </span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount</span>
                        <span className="font-semibold text-green-600">-₹{totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>${total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Summary */}
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
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
                        (reminders.useSystemDefaults ? 'Smart System' : `${reminders.rules.filter(r => r.enabled).length} Custom Rules`) 
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
                        `${lateFees.type === 'fixed' ? '₹' : ''}${lateFees.amount}${lateFees.type === 'percentage' ? '%' : ''} after ${lateFees.gracePeriod} days` 
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
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm ${
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
                  onClick={handleGeneratePDF}
                  disabled={pdfLoading}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 ${
                    isDarkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 ${
                    isDarkMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {loading ? (
                    <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Create & Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
