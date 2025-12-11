'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  X, Plus, Minus, Send, User, Mail, 
  Calendar, FileText, DollarSign, 
  Hash, MessageSquare, 
  CheckCircle, Sparkles,
  Clock, Trash2, AlertCircle,
  ClipboardCheck
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useData } from '@/contexts/DataContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'

interface EstimateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  onSuccess
}: EstimateModalProps) {
  const { showSuccess, showError } = useToast()
  const { clients } = useData()
  const { settings } = useSettings()
  const { getAuthHeaders } = useAuth()
  
  // Dark mode not currently used in settings, default to false
  const isDarkMode = false
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [items, setItems] = useState<EstimateItem[]>([
    { id: '1', description: '', rate: 0, qty: 1 }
  ])
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30) // Default 30 days
    return date.toISOString().split('T')[0]
  })

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

  const handleSubmit = async () => {
    if (!selectedClientId) {
      showError('Error', 'Please select a client')
      return
    }

    if (items.some(item => !item.description || item.rate <= 0)) {
      showError('Error', 'Please fill in all item descriptions and rates')
      return
    }

    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/estimates/create', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          items: items.map(item => ({
            description: item.description,
            rate: item.rate,
            qty: item.qty,
          })),
          discount,
          taxRate,
          notes,
          issueDate,
          expiryDate,
        }),
      })

      if (response.ok) {
        showSuccess('Estimate Created', 'Your estimate has been created successfully.')
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Failed to create estimate')
      }
    } catch (error: any) {
      console.error('Error creating estimate:', error)
      showError('Error', 'Failed to create estimate')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const subtotal = calculateSubtotal()
  const total = calculateTotal()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden overflow-y-auto scroll-smooth ${
        isDarkMode 
          ? 'bg-gray-900' 
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${
              isDarkMode 
                ? 'bg-teal-500/20' 
                : 'bg-teal-50'
            }`}>
              <ClipboardCheck className={`h-5 w-5 ${
                isDarkMode 
                  ? 'text-teal-400' 
                  : 'text-teal-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-semibold ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Create Estimate
              </h2>
              <p className={`text-xs sm:text-sm ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }`}>
                Step {step} of 2
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
                  <User className="h-4 w-4 mr-2 text-teal-600" />
                  Select Client
                </h4>

                {selectedClientId ? (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-teal-500/10' 
                      : 'bg-teal-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-teal-600' : 'bg-teal-100'
                      }`}>
                        <User className={`h-4 w-4 ${
                          isDarkMode ? 'text-white' : 'text-teal-600'
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
                          ? 'text-teal-400 hover:bg-teal-500/20' 
                          : 'text-teal-600 hover:bg-teal-100'
                      } transition-colors cursor-pointer`}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500 focus:ring-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
                    } focus:ring-2 focus:outline-none`}
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
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
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500 focus:ring-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
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
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500 focus:ring-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
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
                    <FileText className="h-4 w-4 mr-2 text-teal-600" />
                    Items <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <button
                    onClick={addItem}
                    className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                        : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-teal-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-teal-500'
                          } focus:ring-2 focus:outline-none`}
                        />
                      </div>
                      <div className="w-20">
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
                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate || ''}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500'
                          } focus:ring-2 focus:outline-none`}
                        />
                      </div>
                      <div className={`w-24 text-right ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <span className="text-sm font-medium">${(item.rate * item.qty).toFixed(2)}</span>
                      </div>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-500/20'
                              : 'text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedClientId || items.some(item => !item.description || item.rate <= 0)}
                className={`w-full py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  !selectedClientId || items.some(item => !item.description || item.rate <= 0)
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                Continue
              </button>
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

              {/* Discount */}
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

              {/* Tax Rate */}
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
                  <span className="font-bold text-lg text-teal-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    loading
                      ? isDarkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                  }`}
                >
                  {loading ? 'Creating...' : 'Create Estimate'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
