'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  X, Plus, Minus, Send, User, Building2, Mail, Phone, MapPin, 
  Calendar, FileText, DollarSign, Upload, Save, Download, 
  CreditCard, Banknote, Smartphone, ArrowRight, ArrowLeft,
  Hash, Image, Globe, MessageSquare
} from 'lucide-react'

interface QuickInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  // user parameter removed - not used
  getAuthHeaders: () => Promise<{ [key: string]: string }>
  isDarkMode?: boolean
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
  amount: number
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

export default function QuickInvoiceModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  getAuthHeaders,
  isDarkMode = false
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
    { id: '1', description: '', amount: 0 }
  ])
  
  const [loading, setLoading] = useState(false)
  const [discount, setDiscount] = useState(0)

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
      fetchClients()
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
  }, [isOpen, fetchClients, fetchBusinessSettings])

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      description: '', 
      amount: 0
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
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const total = subtotal - discount
    
    return { 
      subtotal, 
      discount, 
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

      if (items.some(item => !item.description || item.amount <= 0)) {
        alert('Please fill in all item details with valid amounts')
        return
      }

      const payload = {
        client_id: selectedClientId || undefined,
        client_data: selectedClientId ? undefined : newClient,
        items: items.map(item => ({
          description: item.description,
          rate: item.amount,
          line_total: item.amount
        })),
        due_date: dueDate,
        notes: notes,
        billing_choice: 'per_invoice'
      }

      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      await response.json()

      // Billing logic removed - not implemented yet
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
    setItems([{ id: '1', description: '', amount: 0 }])
    setNotes('Thank you for your business!')
    setDiscount(0)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
      <div className={`rounded-2xl shadow-2xl border max-w-4xl w-full max-h-[95vh] overflow-y-auto scroll-smooth custom-scrollbar ${
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
              <FileText className={`h-6 w-6 ${
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
                Detailed Invoice
              </h2>
              <p className={`text-sm ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-600'
              }`}>
                Step {currentStep} of 4
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`transition-colors p-2 rounded-lg ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-indigo-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <p className={`text-xs sm:text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {currentStep === 1 && 'Client & Details'}
              {currentStep === 2 && 'Services & Amount'}
              {currentStep === 3 && 'Review & Create'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-6">
          {/* Step 1: Client & Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Client & Invoice Details</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Select client and set invoice information</p>
              </div>

              {/* Client Selection */}
              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-md font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  Client
                </h4>

                {selectedClientId ? (
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-indigo-900/20 border-indigo-800' 
                      : 'bg-indigo-50 border-indigo-100'
                  }`}>
                    <div className="flex items-center">
                      <User className={`h-5 w-5 mr-3 ${
                        isDarkMode 
                          ? 'text-indigo-400' 
                          : 'text-indigo-600'
                      }`} />
                      <div>
                        <span className={`font-medium ${
                          isDarkMode 
                            ? 'text-indigo-200' 
                            : 'text-indigo-900'
                        }`}>
                          {clients.find(c => c.id === selectedClientId)?.name}
                        </span>
                        <p className={`text-sm ${
                          isDarkMode 
                            ? 'text-indigo-300' 
                            : 'text-indigo-700'
                        }`}>
                          {clients.find(c => c.id === selectedClientId)?.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedClientId('')}
                      className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-800/30' 
                          : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${
                          isDarkMode 
                            ? 'border-gray-600' 
                            : 'border-gray-300'
                        }`} />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className={`px-2 ${
                          isDarkMode 
                            ? 'bg-gray-800 text-gray-400' 
                            : 'bg-white text-gray-500'
                        }`}>or add new client</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Client Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Client Name"
                          value={newClient.name}
                          onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Email *
                        </label>
                        <input
                          type="email"
                          placeholder="client@example.com"
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Invoice Number *
                  </label>
                  <div className="relative">
                    <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="INV-001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Due Date *
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Services & Amount */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Services & Amount</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
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
                    className={`flex items-center text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
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
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={item.amount}
                              onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
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
                      Enter discount amount in ₹
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="number"
                        placeholder="0"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
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
                    }`}>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount</span>
                      <span className={`font-semibold text-green-600`}>-₹{totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold border-t pt-3 ${
                    isDarkMode 
                      ? 'border-gray-600' 
                      : 'border-gray-300'
                  }`}>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`py-3 px-6 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
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
                  className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Create */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className={`text-lg font-semibold mb-2 ${
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
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{dueDate}</p>
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
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
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
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
                    isDarkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span>Generate PDF</span>
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 ${
                    isDarkMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
