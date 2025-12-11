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
        // Reset form
        setSelectedClientId('')
        setItems([{ id: '1', description: '', rate: 0, qty: 1 }])
        setDiscount(0)
        setTaxRate(0)
        setNotes('')
        setStep(1)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{color: '#1f2937'}}>Create Estimate</h2>
              <p className="text-sm" style={{color: '#6b7280'}}>Step {step} of 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                  Valid Until (Expiry Date)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium" style={{color: '#374151'}}>
                    Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addItem}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate || ''}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-sm font-medium">${(item.rate * item.qty).toFixed(2)}</span>
                      </div>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Discount */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                  Discount ($)
                </label>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={taxRate || ''}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Additional notes or terms..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span style={{color: '#6b7280'}}>Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#6b7280'}}>Discount:</span>
                    <span className="font-medium">-${discount.toFixed(2)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#6b7280'}}>Tax:</span>
                    <span className="font-medium">${((subtotal - discount) * (taxRate / 100)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold" style={{color: '#1f2937'}}>Total:</span>
                  <span className="font-bold text-lg text-teal-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
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

