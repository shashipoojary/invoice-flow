'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Send, User, Mail, Building } from 'lucide-react'

interface QuickInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: any
  getAuthHeaders: () => any
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
  user, 
  getAuthHeaders 
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
  const [billingRequired, setBillingRequired] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      // Set default due date to 30 days from now
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split('T')[0])
    }
  }, [isOpen])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

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

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
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
      const { subtotal, tax, total } = calculateTotals()

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

      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.billing_required && data.checkout_url) {
        setBillingRequired(true)
        setCheckoutUrl(data.checkout_url)
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url
      } else {
        onSuccess()
        onClose()
      }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create Quick Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            {selectedClientId ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-900">
                    {clients.find(c => c.id === selectedClientId)?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientId('')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select existing client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
                
                <div className="text-center text-gray-500">or</div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Company (optional)"
                    value={newClient.company}
                    onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-20 text-right font-medium">
                    ₹{(item.qty * item.rate).toLocaleString()}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes for the client..."
            />
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18%)</span>
                <span className="font-medium">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
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
