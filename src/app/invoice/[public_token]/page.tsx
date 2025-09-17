'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
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
    venmoId: string
    googlePayUpi: string
    bankAccount: string
    bankIfscSwift: string
    bankIban: string
    paymentNotes: string
  }
}

export default function PublicInvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInvoice = () => {
      try {
        // For now, load from localStorage (in production, this would be an API call)
        const savedInvoices = localStorage.getItem('invoices')
        if (savedInvoices) {
          const invoices = JSON.parse(savedInvoices)
          const foundInvoice = invoices.find((inv: Invoice) => inv.id === params.public_token)
          
          if (foundInvoice) {
            setInvoice(foundInvoice)
          } else {
            setError('Invoice not found')
          }
        } else {
          setError('Invoice not found')
        }
      } catch {
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
                  <Image 
                    src={invoice.freelancerSettings.logo} 
                    alt="Logo" 
                    width={48}
                    height={48}
                    className="h-12 w-auto mb-4" 
                  />
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-2 capitalize">{invoice.status}</span>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Options:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {invoice.freelancerSettings.paypalEmail && (
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">PayPal</p>
                        <p className="text-gray-600">{invoice.freelancerSettings.paypalEmail}</p>
                      </div>
                    </div>
                  )}
                  {invoice.freelancerSettings.venmoId && (
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Venmo</p>
                        <p className="text-gray-600">{invoice.freelancerSettings.venmoId}</p>
                      </div>
                    </div>
                  )}
                  {invoice.freelancerSettings.googlePayUpi && (
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Google Pay / UPI</p>
                        <p className="text-gray-600">{invoice.freelancerSettings.googlePayUpi}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {invoice.freelancerSettings.bankAccount && (
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-indigo-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Bank Transfer</p>
                        <p className="text-gray-600">Account: {invoice.freelancerSettings.bankAccount}</p>
                        {invoice.freelancerSettings.bankIfscSwift && (
                          <p className="text-gray-600">IFSC/SWIFT: {invoice.freelancerSettings.bankIfscSwift}</p>
                        )}
                        {invoice.freelancerSettings.bankIban && (
                          <p className="text-gray-600">IBAN: {invoice.freelancerSettings.bankIban}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {invoice.freelancerSettings.paymentNotes && (
                    <div>
                      <p className="font-medium text-gray-900">Other Methods:</p>
                      <p className="text-gray-600">{invoice.freelancerSettings.paymentNotes}</p>
                    </div>
                  )}
                </div>
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