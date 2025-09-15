'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Download, CreditCard, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_name: string | null
  milestone_name: string | null
  description: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_at: string
  public_token: string
  clients: {
    name: string
    email: string
    company: string | null
  }
  invoice_items: Array<{
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
  }>
}

export default function HostedInvoicePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const paymentStatus = searchParams.get('payment')

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [token])

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (
            name,
            email,
            company
          ),
          invoice_items (*)
        `)
        .eq('public_token', token)
        .single()

      if (error) {
        console.error('Error fetching invoice:', error)
        return
      }

      setInvoice(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStripePayment = async () => {
    if (!invoice) return

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicToken: invoice.public_token
        })
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        alert('Error creating payment session')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error processing payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  const downloadPDF = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/pdf?token=${invoice.public_token}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoice_number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
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

  if (!invoice) {
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
        {/* Payment Status Messages */}
        {paymentStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800 font-medium">Payment successful! Thank you for your payment.</p>
            </div>
          </div>
        )}

        {paymentStatus === 'cancelled' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-yellow-800 font-medium">Payment was cancelled. You can try again anytime.</p>
            </div>
          </div>
        )}

        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">InvoiceFlow Pro</h1>
              <p className="text-gray-600 mt-2">Professional Invoice Management</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h2>
              <div className="flex items-center mt-2">
                {getStatusIcon(invoice.status)}
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bill To */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
              <div className="text-gray-700">
                <p className="font-medium">{invoice.clients.name}</p>
                {invoice.clients.company && <p>{invoice.clients.company}</p>}
                <p>{invoice.clients.email}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details:</h3>
              <div className="text-gray-700 space-y-2">
                <p><span className="font-medium">Invoice Date:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
                {invoice.project_name && <p><span className="font-medium">Project:</span> {invoice.project_name}</p>}
                {invoice.milestone_name && <p><span className="font-medium">Milestone:</span> {invoice.milestone_name}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Items</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Quantity</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">{item.description}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-700">${item.rate.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Tax ({invoice.tax_rate}%):</span>
                  <span className="text-gray-900">${invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-semibold text-gray-900">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {invoice.status !== 'paid' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Options</h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStripePayment}
                disabled={processingPayment}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {processingPayment ? 'Processing...' : 'Pay with Card'}
              </button>

              <button
                onClick={downloadPDF}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Secure payment processing powered by Stripe. Your payment information is encrypted and secure.
            </p>
          </div>
        )}

        {invoice.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Payment Received</h3>
            <p className="text-green-700">This invoice has been paid. Thank you for your business!</p>
          </div>
        )}
      </div>
    </div>
  )
}
