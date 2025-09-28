'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, CheckCircle, Clock, AlertCircle, Mail, MapPin, Building2, CreditCard } from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  rate: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientAddress?: string
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
  freelancerSettings?: {
    businessName: string
    logo: string
    address: string
    email: string
    paypalEmail: string
    cashappId: string
    venmoId: string
    googlePayUpi: string
    applePayId: string
    bankAccount: string
    bankIfscSwift: string
    bankIban: string
    stripeAccount: string
    paymentNotes: string
  }
}

export default function PublicInvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/public/${params.public_token}`)
        
        if (response.ok) {
          const data = await response.json()
          setInvoice(data.invoice)
        } else {
          setError('Invoice not found')
        }
      } catch (error) {
        console.error('Error loading invoice:', error)
        setError('Error loading invoice')
      } finally {
        setLoading(false)
      }
    }

    loadInvoice()
  }, [params.public_token])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'sent':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'sent':
        return 'text-blue-600 bg-blue-100'
      case 'overdue':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleDownloadPDF = () => {
    // This will be implemented with react-pdf
    alert('PDF download will be implemented')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">The invoice you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Invoice Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                {invoice.freelancerSettings?.logo && (
                  <div className="h-12 w-auto mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded px-4">
                    <span className="text-xs text-gray-500">Logo</span>
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {invoice.freelancerSettings?.businessName || 'Your Business Name'}
                </h1>
                {invoice.freelancerSettings?.address && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {invoice.freelancerSettings.address}
                    </div>
                  </div>
                )}
                {invoice.freelancerSettings?.email && (
                  <div className="mt-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {invoice.freelancerSettings.email}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-lg text-gray-600">#{invoice.invoiceNumber}</p>
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="capitalize">{invoice.status}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bill To */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{invoice.clientName}</p>
                  {invoice.clientCompany && (
                    <p>{invoice.clientCompany}</p>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {invoice.clientEmail}
                    </div>
                  </div>
                  {invoice.clientAddress && (
                    <div className="mt-1">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5" />
                        <span className="text-sm">{invoice.clientAddress}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
                <div className="text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Issue Date:</span>
                    <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize">{invoice.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services:</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-medium">
                        ${item.rate.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {invoice.freelancerSettings && (
            <div className="px-8 py-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">💳 How to Pay</p>
                <p className="text-sm text-blue-700">
                  Please use one of the payment methods below to settle this invoice. 
                  Include invoice number <strong>#{invoice.invoiceNumber}</strong> in your payment reference.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {invoice.freelancerSettings.paypalEmail && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">PayPal</p>
                          <p className="text-gray-600 text-sm mb-2">Send payment to:</p>
                          <p className="text-gray-900 font-medium">{invoice.freelancerSettings.paypalEmail}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.freelancerSettings.cashappId && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Cash App</p>
                          <p className="text-gray-600 text-sm mb-2">Send to:</p>
                          <p className="text-gray-900 font-medium">${invoice.freelancerSettings.cashappId}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.freelancerSettings.venmoId && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-teal-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Venmo</p>
                          <p className="text-gray-600 text-sm mb-2">Send to:</p>
                          <p className="text-gray-900 font-medium">@{invoice.freelancerSettings.venmoId}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.freelancerSettings.googlePayUpi && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Google Pay / UPI</p>
                          <p className="text-gray-600 text-sm mb-2">UPI ID:</p>
                          <p className="text-gray-900 font-medium">{invoice.freelancerSettings.googlePayUpi}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {invoice.freelancerSettings.applePayId && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Apple Pay</p>
                          <p className="text-gray-600 text-sm mb-2">Send to:</p>
                          <p className="text-gray-900 font-medium">{invoice.freelancerSettings.applePayId}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.freelancerSettings.bankAccount && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Bank Transfer</p>
                          <p className="text-gray-600 text-sm mb-2">Account Details:</p>
                          <p className="text-gray-900 font-medium">{invoice.freelancerSettings.bankAccount}</p>
                          {invoice.freelancerSettings.bankIfscSwift && (
                            <p className="text-gray-600 text-sm mt-1">IFSC/SWIFT: {invoice.freelancerSettings.bankIfscSwift}</p>
                          )}
                          {invoice.freelancerSettings.bankIban && (
                            <p className="text-gray-600 text-sm mt-1">IBAN: {invoice.freelancerSettings.bankIban}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.freelancerSettings.stripeAccount && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Credit/Debit Card</p>
                          <p className="text-gray-600 text-sm mb-2">Processed securely via Stripe</p>
                          <p className="text-gray-900 font-medium">{invoice.freelancerSettings.stripeAccount}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.freelancerSettings.paymentNotes && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">Other Methods</p>
                          <p className="text-gray-600 text-sm">{invoice.freelancerSettings.paymentNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✅ Security:</strong> All payment methods are secure and encrypted. 
                  Please include invoice number <strong>#{invoice.invoiceNumber}</strong> in your payment reference.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="px-8 py-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Thank you for your business!
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}