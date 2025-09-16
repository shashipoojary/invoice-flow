'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
// Note: This page needs to be updated to use PostgreSQL API calls
import { Download, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  public_token: string
  currency: string
  subtotal: number
  tax: number
  discount: number
  total: number
  due_date: string
  status: string
  branding: any
  notes?: string
  created_at: string
  clients: {
    name: string
    email: string
    company?: string
    phone?: string
    address?: string
  }
  invoice_items: Array<{
    id: string
    description: string
    qty: number
    rate: number
    line_total: number
  }>
}

export default function HostedInvoicePage() {
  const params = useParams()
  const publicToken = params.public_token as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [publicToken])

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (*),
          invoice_items (*)
        `)
        .eq('public_token', publicToken)
        .single()

      if (error) {
        setError('Invoice not found')
        return
      }

      setInvoice(data)
    } catch (err) {
      setError('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/pdf?invoiceId=${invoice.id}`)
      const data = await response.json()

      if (data.pdf_url) {
        window.open(data.pdf_url, '_blank')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const handlePayment = async () => {
    if (!invoice || invoice.status === 'paid') return

    setPaymentLoading(true)
    try {
      const response = await fetch('/api/payments/stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.total,
          currency: 'inr',
          type: 'invoice_payment'
        })
      })

      const data = await response.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
    } finally {
      setPaymentLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'sent':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600">The invoice you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
              <p className="text-lg text-gray-600 mt-1">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusIcon(invoice.status)}
                <span className="ml-2 capitalize">{invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">From</h2>
              <div className="text-gray-700">
                <p className="font-semibold">{invoice.branding?.business_name || 'Your Business'}</p>
                {invoice.branding?.business_email && (
                  <p>{invoice.branding.business_email}</p>
                )}
                {invoice.branding?.business_phone && (
                  <p>{invoice.branding.business_phone}</p>
                )}
                {invoice.branding?.business_address && (
                  <p className="whitespace-pre-line">{invoice.branding.business_address}</p>
                )}
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
              <div className="text-gray-700">
                <p className="font-semibold">{invoice.clients.name}</p>
                {invoice.clients.company && <p>{invoice.clients.company}</p>}
                {invoice.clients.email && <p>{invoice.clients.email}</p>}
                {invoice.clients.phone && <p>{invoice.clients.phone}</p>}
                {invoice.clients.address && (
                  <p className="whitespace-pre-line">{invoice.clients.address}</p>
                )}
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-700">Description</th>
                      <th className="text-right py-2 font-medium text-gray-700">Qty</th>
                      <th className="text-right py-2 font-medium text-gray-700">Rate</th>
                      <th className="text-right py-2 font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.invoice_items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 text-gray-900">{item.description}</td>
                        <td className="py-3 text-right text-gray-700">{item.qty}</td>
                        <td className="py-3 text-right text-gray-700">₹{item.rate.toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-900 font-medium">₹{item.line_total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{invoice.subtotal.toLocaleString()}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span className="font-medium">₹{invoice.tax.toLocaleString()}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium">-₹{invoice.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">₹{invoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Invoice Date</span>
                  <p className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Due Date</span>
                  <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Currency</span>
                  <p className="font-medium">{invoice.currency}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>

                {invoice.status !== 'paid' && (
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {paymentLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                )}

                {invoice.status === 'paid' && (
                  <div className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-md">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Payment Received
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
