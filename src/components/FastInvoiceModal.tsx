'use client'

import { useState } from 'react'
import { X, Sparkles, DollarSign, Calendar, FileText, User, Mail, ArrowRight, ArrowLeft } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

interface FastInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: { id: string; email: string; name?: string }
  getAuthHeaders: () => Promise<{ [key: string]: string }>
  isDarkMode?: boolean
  clients?: Client[]
}

// Client interface removed - not used

export default function FastInvoiceModal({ isOpen, onClose, onSuccess, getAuthHeaders, isDarkMode = false, clients = [] }: FastInvoiceModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setStep(1)
    setSelectedClientId('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Parse description for smart defaults
      const parsedDescription = description.trim()
      const parsedAmount = parseFloat(amount) || 0
      
      // Handle client - either selected or new
      let clientId = null
      if (selectedClientId) {
        clientId = selectedClientId
      } else if (clientName && clientEmail) {
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


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl shadow-2xl border max-w-lg w-full ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-sm`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
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
              <Sparkles className={`h-6 w-6 ${
                isDarkMode 
                  ? 'text-indigo-400' 
                  : 'text-indigo-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Quick Invoice
              </h2>
              <p className={`text-sm ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-600'
              }`}>
                Create invoice in 60 seconds
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

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">1</div>
                <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center text-sm font-semibold">2</div>
              </div>

              <div className="text-center mb-8">
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

              <div className="space-y-5">
                {/* Client Selection */}
                {clients.length > 0 && (
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      💡 You have {clients.length} existing client{clients.length !== 1 ? 's' : ''} to choose from
                    </p>
                  </div>
                )}

                {selectedClientId ? (
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {clients.find(c => c.id === selectedClientId)?.name}
                        </p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {clients.find(c => c.id === selectedClientId)?.email}
                        </p>
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.length > 0 && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Select Existing Client
                        </label>
                        <div className="relative">
                          <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none cursor-pointer ${
                              isDarkMode 
                                ? 'border-gray-600 bg-gray-800 text-white' 
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          >
                            <option value="">📋 Select existing client</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>
                                👤 {client.name} {client.company && `(${client.company})`}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
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
                        <div className="relative flex justify-center text-sm">
                          <span className={`px-2 ${
                            isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                          }`}>or add new client</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Client Name *
                      </label>
                      <div className="relative">
                        <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Enter client name"
                          required={!selectedClientId}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Client Email *
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="client@example.com"
                          required={!selectedClientId}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">1</div>
                <div className="w-12 h-0.5 bg-indigo-600"></div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">2</div>
              </div>

              <div className="text-center mb-8">
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

              <div className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? 'text-gray-300' 
                      : 'text-gray-700'
                  }`}>
                    Description *
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 h-4 w-4 ${
                      isDarkMode 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
                    }`} />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Describe the work or service provided"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? 'text-gray-300' 
                      : 'text-gray-700'
                  }`}>
                    Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
                    }`} />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? 'text-gray-300' 
                      : 'text-gray-700'
                  }`}>
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
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
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? 'text-gray-300' 
                      : 'text-gray-700'
                  }`}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Payment terms, additional details..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Invoice'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
