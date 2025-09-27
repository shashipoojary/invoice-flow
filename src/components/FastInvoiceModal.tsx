'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, FileText, User, Mail, ArrowRight, ArrowLeft, Clock, CheckCircle, Send } from 'lucide-react'
import { Invoice } from '@/types'

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
  editingInvoice?: Invoice | null
}

// Client interface removed - not used

export default function FastInvoiceModal({ isOpen, onClose, onSuccess, getAuthHeaders, isDarkMode = false, clients = [], editingInvoice = null }: FastInvoiceModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  
  // Form data
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Set default due date when modal opens
  useEffect(() => {
    if (isOpen && !dueDate) {
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split('T')[0])
    }
  }, [isOpen, dueDate])

  // Pre-fill form when editing an invoice
  useEffect(() => {
    if (isOpen && editingInvoice) {
      setSelectedClientId(editingInvoice.clientId || '')
      setClientName(editingInvoice.clientName || '')
      setClientEmail(editingInvoice.clientEmail || '')
      setDescription(editingInvoice.items?.[0]?.description || '')
      setAmount(editingInvoice.items?.[0]?.amount?.toString() || '')
      setDueDate(editingInvoice.dueDate || '')
      setNotes(editingInvoice.notes || '')
    } else if (isOpen && !editingInvoice) {
      // Reset form when creating new invoice
      resetForm()
    }
  }, [isOpen, editingInvoice])

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

  const handleCreateInvoice = async () => {
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
          billing_choice: 'subscription', // For now, assume subscription
          type: 'fast' // Mark as fast invoice
        })
      })

      if (invoiceResponse.ok) {
        const result = await invoiceResponse.json()
        alert('Invoice created successfully!')
        onSuccess()
        onClose()
        resetForm()
        return result.invoice
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndSend = async () => {
    setSendLoading(true)

    try {
      // First create the invoice
      const invoice = await handleCreateInvoice()
      
      if (invoice) {
        // Then send it
        const headers = await getAuthHeaders()
        const sendResponse = await fetch('/api/invoices/send', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientEmail: selectedClientId ? 
              (clients.find(c => c.id === selectedClientId)?.email || clientEmail) : 
              clientEmail,
            clientName: selectedClientId ? 
              (clients.find(c => c.id === selectedClientId)?.name || clientName) : 
              clientName
          })
        })

        if (sendResponse.ok) {
          alert('Invoice created and sent successfully!')
        } else {
          alert('Invoice created but failed to send. You can send it later from the invoice list.')
        }
      }
    } catch (error) {
      console.error('Error creating and sending invoice:', error)
      alert('Failed to create and send invoice. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // This will be handled by the individual buttons
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl shadow-2xl border max-w-md w-full ${
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
            <div className={`p-2.5 rounded-lg ${
              isDarkMode 
                ? 'bg-indigo-500/20' 
                : 'bg-indigo-50'
            }`}>
              <Clock className={`h-5 w-5 ${
                isDarkMode 
                  ? 'text-indigo-400' 
                  : 'text-indigo-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Quick Invoice
              </h2>
              <p className={`text-xs ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }`}>
                Create invoice in 60 seconds
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

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">1</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>Client</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xs font-medium">2</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Details</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className={`text-base font-semibold mb-1 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>Who are you billing?</h3>
                <p className={`text-xs ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
                }`}>Select an existing client or add a new one</p>
              </div>

              <div className="space-y-4">
                {/* Client Selection */}
                {selectedClientId ? (
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-center justify-between">
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
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.length > 0 && (
                      <div>
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
                            isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'
                          }`}>or add new</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                              isDarkMode 
                                ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder="Client name"
                            required={!selectedClientId}
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
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">1</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>Client</span>
                </div>
                <div className="w-8 h-0.5 bg-indigo-600"></div>
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">2</div>
                  <span className={`ml-2 text-xs font-medium ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>Details</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className={`text-base font-semibold mb-1 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>What are you billing for?</h3>
                <p className={`text-xs ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
                }`}>Enter the service details and amount</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 h-4 w-4 ${
                      isDarkMode 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
                    }`} />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
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
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Payment terms, additional details... (optional)"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
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
                  onClick={handleCreateInvoice}
                  disabled={loading || sendLoading}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-xs disabled:opacity-50 ${
                    isDarkMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  <span>{loading ? 'Creating...' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndSend}
                  disabled={loading || sendLoading}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-xs disabled:opacity-50 ${
                    isDarkMode 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {sendLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  <span>{sendLoading ? 'Sending...' : 'Create & Send'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
