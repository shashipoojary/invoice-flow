'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Save, Eye, Plus, X } from 'lucide-react'

// InvoiceItem interface removed - using inline type

interface Client {
  id: string
  name: string
  email: string
  company?: string
  address?: string
}

interface FreelancerSettings {
  businessName: string
  logo: string
  address: string
  email: string
  paypalEmail: string
  venmoId: string
  googlePayUpi: string
  bankAccount: string
  bankIfscSwift: string
  bankIban: string
  paymentNotes: string
}

export default function CreateInvoicePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [freelancerSettings, setFreelancerSettings] = useState<FreelancerSettings | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  // selectedClient removed - not used
  const [showPreview, setShowPreview] = useState(false)

  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    clientAddress: '',
    items: [{ id: '1', description: '', rate: 0, amount: 0 }],
    taxRate: 0,
    notes: ''
  })

  useEffect(() => {
    // Check dark mode - use same key as main app
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Load freelancer settings
    const savedSettings = localStorage.getItem('freelancerSettings')
    if (savedSettings) {
      setFreelancerSettings(JSON.parse(savedSettings))
    }

    // Load clients
    const savedClients = localStorage.getItem('clients')
    if (savedClients) {
      setClients(JSON.parse(savedClients))
    }

    // Generate invoice number
    const savedInvoices = localStorage.getItem('invoices')
    const invoiceCount = savedInvoices ? JSON.parse(savedInvoices).length : 0
    setInvoice(prev => ({
      ...prev,
      invoiceNumber: `INV-${String(invoiceCount + 1).padStart(3, '0')}`
    }))
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const addInvoiceItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: Date.now().toString(), 
        description: '', 
        rate: 0, 
        amount: 0 
      }]
    }))
  }

  const removeInvoiceItem = (itemId: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const updateInvoiceItem = (itemId: string, field: string, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'rate') {
            updatedItem.amount = updatedItem.rate
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleClientSelect = (client: Client) => {
    // setSelectedClient removed - not used
    setInvoice(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientCompany: client.company || '',
      clientAddress: client.address || ''
    }))
  }

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.rate, 0)
    const taxAmount = subtotal * (invoice.taxRate / 100)
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const { subtotal, taxAmount, total } = calculateTotals()
      const newInvoice = {
        id: Date.now().toString(),
        ...invoice,
        subtotal,
        taxAmount,
        total,
        status: 'draft',
        createdAt: new Date().toISOString(),
        freelancerSettings
      }

      const savedInvoices = localStorage.getItem('invoices')
      const invoices = savedInvoices ? JSON.parse(savedInvoices) : []
      invoices.push(newInvoice)
      localStorage.setItem('invoices', JSON.stringify(invoices))

      alert('Invoice saved as draft!')
      router.push('/invoices')
    } catch {
      alert('Error saving invoice')
    } finally {
      setSaving(false)
    }
  }

  // handleGeneratePDF removed - not implemented yet

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-200 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Create Invoice
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Invoice Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={invoice.issueDate}
                    onChange={(e) => setInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={invoice.taxRate}
                    onChange={(e) => setInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Client Details
              </h2>
              
              {clients.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Select Existing Client
                  </label>
                  <select
                    value={invoice.clientId}
                    onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value)
                      if (client) handleClientSelect(client)
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={invoice.clientName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Client Email *
                  </label>
                  <input
                    type="email"
                    value={invoice.clientEmail}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="client@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={invoice.clientCompany}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientCompany: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Address
                  </label>
                  <textarea
                    value={invoice.clientAddress}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientAddress: e.target.value }))}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                    placeholder="Client address"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Services
                </h2>
                <button
                  onClick={addInvoiceItem}
                  className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="space-y-3">
                {invoice.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-7">
                      <input
                        type="text"
                        placeholder="Service Description"
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.rate}
                        onChange={(e) => updateInvoiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => removeInvoiceItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Subtotal:</span>
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>${subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between">
                      <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Tax ({invoice.taxRate}%):</span>
                      <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Total:</span>
                    <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Notes
              </h2>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                placeholder="Additional notes or payment terms..."
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Invoice Preview
              </h2>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    {freelancerSettings?.logo && (
                      <img src={freelancerSettings.logo} alt="Logo" className="h-12 w-auto mb-2" />
                    )}
                    <h1 className="text-xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                      {freelancerSettings?.businessName || 'Your Business Name'}
                    </h1>
                    {freelancerSettings?.address && (
                      <p className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                        {freelancerSettings.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                      INVOICE
                    </h2>
                    <p className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      #{invoice.invoiceNumber}
                    </p>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Bill To:
                  </h3>
                  <p className="font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    {invoice.clientName}
                  </p>
                  {invoice.clientCompany && (
                    <p style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      {invoice.clientCompany}
                    </p>
                  )}
                  <p style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    {invoice.clientEmail}
                  </p>
                  {invoice.clientAddress && (
                    <p style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      {invoice.clientAddress}
                    </p>
                  )}
                </div>

                {/* Services Table */}
                <div className="mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Service</th>
                        <th className="text-right py-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                            {item.description}
                          </td>
                          <td className="text-right py-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                            ${item.rate.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Subtotal:</span>
                      <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>${subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.taxRate > 0 && (
                      <div className="flex justify-between">
                        <span style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Tax:</span>
                        <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>${taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Total:</span>
                      <span style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {freelancerSettings && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                      Payment Options:
                    </h3>
                    <div className="space-y-2 text-sm">
                      {freelancerSettings.paypalEmail && (
                        <p><strong>PayPal:</strong> {freelancerSettings.paypalEmail}</p>
                      )}
                      {freelancerSettings.venmoId && (
                        <p><strong>Venmo:</strong> {freelancerSettings.venmoId}</p>
                      )}
                      {freelancerSettings.googlePayUpi && (
                        <p><strong>Google Pay/UPI:</strong> {freelancerSettings.googlePayUpi}</p>
                      )}
                      {freelancerSettings.bankAccount && (
                        <p><strong>Bank Transfer:</strong> {freelancerSettings.bankAccount}</p>
                      )}
                      {freelancerSettings.paymentNotes && (
                        <p><strong>Other:</strong> {freelancerSettings.paymentNotes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
