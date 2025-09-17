'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Minus, Send, User } from 'lucide-react'

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
}

interface InvoiceItem {
  id: string
  description: string
  qty: number
  rate: number
}

export default function QuickInvoiceModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  getAuthHeaders,
  isDarkMode = false
}: QuickInvoiceModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: ''
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', qty: 1, rate: 0 }
  ])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  // billingRequired and checkoutUrl removed - not implemented yet

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

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      // Set default due date to 30 days from now
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split('T')[0])
    }
  }, [isOpen, fetchClients])

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      description: '', 
      qty: 1, 
      rate: 0 
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
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0)
    const tax = subtotal * 0.18 // 18% GST
    const total = subtotal + tax
    return { subtotal, tax, total }
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

      if (items.some(item => !item.description || item.rate <= 0)) {
        alert('Please fill in all item details with valid rates')
        return
      }

      const payload = {
        client_id: selectedClientId || undefined,
        client_data: selectedClientId ? undefined : newClient,
        items: items.map(item => ({
          description: item.description,
          qty: item.qty,
          rate: item.rate
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

  const { subtotal, tax, total } = calculateTotals()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode 
            ? 'border-gray-700' 
            : 'border-gray-100'
        }`}>
          <h2 className={`text-2xl font-semibold ${
            isDarkMode 
              ? 'text-white' 
              : 'text-gray-900'
          }`}>Create Invoice</h2>
          <button
            onClick={onClose}
            className={`transition-colors p-1 rounded-lg ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Client
            </label>
            {selectedClientId ? (
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-indigo-600 mr-3" />
                  <span className="text-indigo-900 font-medium">
                    {clients.find(c => c.id === selectedClientId)?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientId('')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
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
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or add new client</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Company (optional)"
                    value={newClient.company}
                    onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:col-span-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-900">
                Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-center"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    />
                  </div>
                  <div className="w-20 text-right font-semibold text-gray-900">
                    ₹{(item.qty * item.rate).toLocaleString()}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              placeholder="Additional notes for the client..."
            />
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18%)</span>
                <span className="font-semibold text-gray-900">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Create & Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
