'use client'

import { useState } from 'react'
import { X, Zap, DollarSign, Calendar, FileText, User, Mail } from 'lucide-react'

interface FastInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: { id: string; email: string; name?: string }
  getAuthHeaders: () => Promise<{ [key: string]: string }>
  isDarkMode?: boolean
}

// Client interface removed - not used

export default function FastInvoiceModal({ isOpen, onClose, onSuccess, getAuthHeaders, isDarkMode = false }: FastInvoiceModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Parse description for smart defaults
      const parsedDescription = description.trim()
      const parsedAmount = parseFloat(amount) || 0
      
      // Create client if needed
      let clientId = null
      if (clientName && clientEmail) {
        const headers = await getAuthHeaders()
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: clientName,
            email: clientEmail
          })
        })
        const clientData = await clientResponse.json()
        clientId = clientData.client.id
      }

      // Create invoice
      const headers = await getAuthHeaders()
      const invoiceResponse = await fetch('/api/invoices/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          client_id: clientId,
          items: [{
            description: parsedDescription,
            rate: parsedAmount,
            line_total: parsedAmount
          }],
          due_date: dueDate,
          notes: notes,
          billing_choice: 'subscription' // For now, assume subscription
        })
      })

      if (invoiceResponse.ok) {
        onSuccess()
        onClose()
        resetForm()
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setClientName('')
    setClientEmail('')
    setDescription('')
    setAmount('')
    setDueDate('')
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl shadow-2xl border max-w-md w-full ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode 
            ? 'border-gray-700' 
            : 'border-gray-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode 
                ? 'bg-indigo-900/30' 
                : 'bg-indigo-100'
            }`}>
              <Zap className={`h-5 w-5 ${
                isDarkMode 
                  ? 'text-indigo-400' 
                  : 'text-indigo-600'
              }`} />
            </div>
            <h2 className={`text-xl font-semibold ${
              isDarkMode 
                ? 'text-white' 
                : 'text-gray-900'
            }`}>
              Quick Invoice
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={`transition-colors p-1 rounded-lg ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>Client Information</h3>
                <p className={`text-sm ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
                }`}>Who are you billing?</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Client Name *
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Client Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Client Email *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="client@company.com"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Next: Invoice Details
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>Invoice Details</h3>
                <p className={`text-sm ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
                }`}>What are you billing for?</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Description *
                </label>
                <div className="relative">
                  <FileText className={`absolute left-4 top-4 h-4 w-4 ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-400'
                  }`} />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Website design and development"
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-400'
                  }`} />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="1500"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-400'
                  }`} />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white' 
                        : 'border-gray-200 bg-white text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                      : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Payment terms, additional details..."
                  rows={2}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 px-4 rounded-xl transition-colors font-medium ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create & Send'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
