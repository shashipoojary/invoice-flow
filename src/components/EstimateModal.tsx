'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  X, Plus, Minus, Send, User, Mail, 
  Calendar, FileText, DollarSign, 
  Hash, MessageSquare, 
  CheckCircle, Sparkles,
  Clock, Trash2, AlertCircle,
  ClipboardCheck, ArrowRight, ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useData } from '@/contexts/DataContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'

interface EstimateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  estimate?: {
    id: string
    clientId: string
    items: Array<{ id: string; description: string; rate: number; qty?: number; amount?: number }>
    subtotal: number
    discount?: number
    taxRate?: number
    taxAmount?: number
    notes?: string
    issueDate?: string
    expiryDate?: string
  } | null
}

interface EstimateItem {
  id: string
  description: string
  rate: number
  qty: number
}

export default function EstimateModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  estimate = null
}: EstimateModalProps) {
  const { showSuccess, showError } = useToast()
  const { clients } = useData()
  const { settings } = useSettings()
  const { getAuthHeaders } = useAuth()
  
  // Dark mode not currently used in settings, default to false
  const isDarkMode = false
  
  const isEditMode = !!estimate
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedClientId, setSelectedClientId] = useState(estimate?.clientId || '')
  const [items, setItems] = useState<EstimateItem[]>(
    estimate?.items && estimate.items.length > 0
      ? estimate.items.map((item, idx) => ({
          id: item.id || (idx + 1).toString(),
          description: item.description || '',
          rate: item.rate || 0,
          qty: item.qty || 1
        }))
      : [{ id: '1', description: '', rate: 0, qty: 1 }]
  )
  const [discount, setDiscount] = useState(estimate?.discount || 0)
  const [taxRate, setTaxRate] = useState(estimate?.taxRate || 0)
  const [notes, setNotes] = useState(estimate?.notes || '')
  const [issueDate, setIssueDate] = useState(
    estimate?.issueDate || new Date().toISOString().split('T')[0]
  )
  const [expiryDate, setExpiryDate] = useState(
    estimate?.expiryDate || (() => {
      const date = new Date()
      date.setDate(date.getDate() + 30) // Default 30 days
      return date.toISOString().split('T')[0]
    })()
  )
  
  // Validation errors
  const [errors, setErrors] = useState<{
    client?: string
    items?: { [key: string]: { description?: string; rate?: string } }
  }>({})
  
  // Update form when estimate prop changes
  useEffect(() => {
    if (estimate) {
      setSelectedClientId(estimate.clientId)
      setItems(
        estimate.items && estimate.items.length > 0
          ? estimate.items.map((item, idx) => {
              // Calculate rate from amount if rate is not available
              let rate = item.rate || 0;
              if (!rate && item.amount) {
                const qty = item.qty || 1;
                rate = typeof item.amount === 'number' ? item.amount / qty : parseFloat(String(item.amount)) / qty;
              }
              return {
                id: item.id || (idx + 1).toString(),
                description: item.description || '',
                rate: rate,
                qty: item.qty || 1
              };
            })
          : [{ id: '1', description: '', rate: 0, qty: 1 }]
      )
      setDiscount(estimate.discount || 0)
      setTaxRate(estimate.taxRate || 0)
      setNotes(estimate.notes || '')
      setIssueDate(estimate.issueDate || new Date().toISOString().split('T')[0])
      setExpiryDate(estimate.expiryDate || (() => {
        const date = new Date()
        date.setDate(date.getDate() + 30)
        return date.toISOString().split('T')[0]
      })())
    } else {
      // Reset to defaults for new estimate
      setSelectedClientId('')
      setItems([{ id: '1', description: '', rate: 0, qty: 1 }])
      setDiscount(0)
      setTaxRate(0)
      setNotes('')
      setIssueDate(new Date().toISOString().split('T')[0])
      const date = new Date()
      date.setDate(date.getDate() + 30)
      setExpiryDate(date.toISOString().split('T')[0])
    }
  }, [estimate])

  const handleClose = () => {
    setSelectedClientId('')
    setItems([{ id: '1', description: '', rate: 0, qty: 1 }])
    setDiscount(0)
    setTaxRate(0)
    setNotes('')
    setStep(1)
    onClose()
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', rate: 0, qty: 1 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof EstimateItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.rate * item.qty), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const afterDiscount = subtotal - discount
    const tax = afterDiscount * (taxRate / 100)
    return afterDiscount + tax
  }

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Client validation
    if (!selectedClientId) {
      newErrors.client = 'Please select a client'
    }
    
    // Items validation
    const itemErrors: { [key: string]: { description?: string; rate?: string } } = {}
    items.forEach((item) => {
      if (!item.description || !item.description.trim()) {
        if (!itemErrors[item.id]) itemErrors[item.id] = {}
        itemErrors[item.id].description = 'Description is required'
      }
      if (!item.rate || item.rate <= 0) {
        if (!itemErrors[item.id]) itemErrors[item.id] = {}
        itemErrors[item.id].rate = 'Please enter a valid rate greater than 0'
      }
    })
    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      showError('Error', 'Please fill in all required fields correctly')
      return
    }

    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const subtotal = calculateSubtotal()
      
      const requestBody = {
        clientId: selectedClientId,
        items: items.map(item => ({
          description: item.description,
          rate: item.rate,
          qty: item.qty,
        })),
        subtotal,
        discount,
        taxRate,
        notes,
        issueDate,
        expiryDate,
      }

      const url = isEditMode && estimate?.id 
        ? `/api/estimates/${estimate.id}`
        : '/api/estimates/create'
      
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        showSuccess(
          isEditMode ? 'Estimate Updated' : 'Estimate Created',
          isEditMode 
            ? 'Your estimate has been updated successfully.'
            : 'Your estimate has been created successfully.'
        )
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        showError('Error', error.error || (isEditMode ? 'Failed to update estimate' : 'Failed to create estimate'))
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} estimate:`, error)
      showError('Error', isEditMode ? 'Failed to update estimate' : 'Failed to create estimate')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const subtotal = calculateSubtotal()
  const total = calculateTotal()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className={`rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden overflow-y-auto scroll-smooth ${
        isDarkMode 
          ? 'bg-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${
              isDarkMode 
                ? 'bg-indigo-500/20' 
                : 'bg-indigo-50'
            }`}>
              <ClipboardCheck className={`h-5 w-5 ${
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
                {isEditMode ? 'Edit Estimate' : 'Create Estimate'}
              </h2>
              <p className={`text-xs sm:text-sm ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }`}>
                Create professional estimates for client approval
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`transition-colors p-1.5 rounded-lg cursor-pointer ${
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
              { step: 1, label: 'Client & Items', icon: User },
              { step: 2, label: 'Details', icon: FileText }
            ].map(({ step: stepNum, label, icon: Icon }) => (
              <div key={stepNum} className="flex items-center flex-shrink-0">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  stepNum <= step
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum < step ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs font-medium hidden xs:inline ${
                  stepNum <= step
                    ? isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {stepNum < 2 && (
                  <div className={`w-2 sm:w-6 h-0.5 mx-1 sm:mx-3 ${
                    stepNum < step ? 'bg-indigo-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className={`text-sm font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Client & Estimate Details</h3>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Select client and set basic information</p>
              </div>

              {/* Client Selection */}
              <div className="p-4">
                <h4 className={`text-sm font-semibold mb-3 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <User className="h-4 w-4 mr-2 text-indigo-600" />
                  Select Client
                </h4>

                {selectedClientId ? (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
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
                      onClick={() => setSelectedClientId('')}
                      className={`text-xs px-2 py-1 rounded ${
                        isDarkMode 
                          ? 'text-indigo-400 hover:bg-indigo-500/20' 
                          : 'text-indigo-600 hover:bg-indigo-100'
                      } transition-colors cursor-pointer`}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedClientId}
                      onChange={(e) => {
                        setSelectedClientId(e.target.value)
                        if (errors.client) {
                          setErrors(prev => ({ ...prev, client: undefined }))
                        }
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                        errors.client
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:ring-2 focus:outline-none`}
                    >
                      <option value="">Choose a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company ? `(${client.company})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.client && (
                      <p className="mt-1 text-xs text-red-600">{errors.client}</p>
                    )}
                  </>
                )}
              </div>

              {/* Issue Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500'
                    } focus:ring-2 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Valid Until (Expiry Date)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500'
                    } focus:ring-2 focus:outline-none`}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                    Items <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <button
                    onClick={addItem}
                    className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => {
                            updateItem(item.id, 'description', e.target.value)
                            if (errors.items?.[item.id]?.description) {
                              setErrors(prev => {
                                const newErrors = { ...prev }
                                if (newErrors.items?.[item.id]) {
                                  delete newErrors.items[item.id].description
                                  if (Object.keys(newErrors.items[item.id]).length === 0) {
                                    delete newErrors.items[item.id]
                                  }
                                }
                                return newErrors
                              })
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                            errors.items?.[item.id]?.description
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500'
                          } focus:ring-2 focus:outline-none`}
                        />
                        {errors.items?.[item.id]?.description && (
                          <p className="mt-1 text-xs text-red-600">{errors.items[item.id].description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-20 sm:w-20">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                            min="1"
                            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
                            } focus:ring-2 focus:outline-none`}
                          />
                        </div>
                        <div className="w-28 sm:w-28">
                          <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate || ''}
                            onChange={(e) => {
                              updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)
                              if (errors.items?.[item.id]?.rate) {
                                setErrors(prev => {
                                  const newErrors = { ...prev }
                                  if (newErrors.items?.[item.id]) {
                                    delete newErrors.items[item.id].rate
                                    if (Object.keys(newErrors.items[item.id]).length === 0) {
                                      delete newErrors.items[item.id]
                                    }
                                  }
                                  return newErrors
                                })
                              }
                            }}
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                              errors.items?.[item.id]?.rate
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                : isDarkMode
                                  ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
                            } focus:ring-2 focus:outline-none`}
                          />
                          {errors.items?.[item.id]?.rate && (
                            <p className="mt-1 text-xs text-red-600">{errors.items[item.id].rate}</p>
                          )}
                        </div>
                        <div className={`flex-1 sm:flex-none sm:w-24 text-right ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <span className="text-sm font-medium">${(item.rate * item.qty).toFixed(2)}</span>
                        </div>
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                              isDarkMode
                                ? 'text-red-400 hover:bg-red-500/20'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedClientId || items.some(item => !item.description || item.rate <= 0)}
                  className={`w-full sm:w-auto bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    !selectedClientId || items.some(item => !item.description || item.rate <= 0)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className={`text-sm font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Additional Details</h3>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Set discount, tax, and notes</p>
              </div>

              {/* Discount & Tax Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Discount ($)
                  </label>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500 focus:ring-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
                    } focus:ring-2 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate || ''}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500 focus:ring-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
                    } focus:ring-2 focus:outline-none`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-teal-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-teal-500'
                  } focus:ring-2 focus:outline-none`}
                  placeholder="Additional notes or terms..."
                />
              </div>

              {/* Summary */}
              <div className={`p-4 rounded-lg space-y-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Discount:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>-${discount.toFixed(2)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>${((subtotal - discount) * (taxRate / 100)).toFixed(2)}</span>
                  </div>
                )}
                <div className={`flex justify-between pt-2 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                  <span className="font-bold text-lg text-indigo-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm cursor-pointer ${
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
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEditMode ? 'Update Estimate' : 'Create Estimate'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
