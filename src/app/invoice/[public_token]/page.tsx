'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Download, CheckCircle, Clock, AlertCircle, Mail, MapPin, Building2, CreditCard, Smartphone, DollarSign, Shield } from 'lucide-react'

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
  lateFees: number
  totalWithLateFees: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  isOverdue: boolean
  daysOverdue: number
  notes?: string
  freelancerSettings?: {
    businessName: string
    logo: string
    address: string
    email: string
    phone: string
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
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'sent':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'overdue':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
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
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Teal Banner */}
      <div className="bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">INVOICE</h1>
            <p className="text-teal-100 mt-2 text-lg">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Invoice Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Business Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Logo Placeholder */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {invoice.freelancerSettings?.logo ? (
                      <Image
                        src={invoice.freelancerSettings.logo}
                        alt="Business Logo"
                        width={48}
                        height={48}
                        className="rounded-lg object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className="text-sm sm:text-lg font-bold text-gray-600 hidden">
                      {invoice.freelancerSettings?.businessName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                      {invoice.freelancerSettings?.businessName || 'Your Business Name'}
                    </h2>
                    {invoice.freelancerSettings?.email && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{invoice.freelancerSettings.email}</p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    ${invoice.isOverdue ? invoice.totalWithLateFees.toFixed(2) : invoice.total.toFixed(2)}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="capitalize">{invoice.status}</span>
                  </div>
                  {invoice.isOverdue && (
                    <div className="mt-1 text-xs sm:text-sm text-red-600 font-medium">
                      {invoice.daysOverdue} days overdue
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Bill To */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bill To</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="text-gray-900">
                    <p className="font-semibold text-base sm:text-lg">{invoice.clientName}</p>
                    {invoice.clientCompany && (
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">{invoice.clientCompany}</p>
                    )}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{invoice.clientEmail}</span>
                      </div>
                      {invoice.clientAddress && (
                        <div className="flex items-start text-xs sm:text-sm text-gray-600">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{invoice.clientAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Info */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Invoice Details</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Issue Date</span>
                      <span className="font-medium text-xs sm:text-sm">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Due Date</span>
                      <span className="font-medium text-xs sm:text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Status</span>
                      <span className="font-medium text-xs sm:text-sm capitalize">{invoice.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Services</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px]">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-4 font-semibold text-sm sm:text-base">Service</th>
                    <th className="text-right py-3 sm:py-4 px-3 sm:px-4 font-semibold text-sm sm:text-base">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-gray-900 text-sm sm:text-base">
                        {item.description}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-right text-gray-900 font-semibold text-sm sm:text-base">
                        ${item.rate.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 sm:px-8 py-6 bg-gray-50">
            <div className="flex justify-end">
              <div className="w-full sm:w-80">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.isOverdue && invoice.lateFees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                      <span className="text-red-600 font-medium">${invoice.lateFees.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-900">
                      {invoice.isOverdue ? 'Total Payable' : 'Total'}
                    </span>
                    <span className={`font-bold ${invoice.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      ${invoice.isOverdue ? invoice.totalWithLateFees.toFixed(2) : invoice.total.toFixed(2)}
                    </span>
                  </div>
                  {invoice.isOverdue && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      <strong>Overdue Notice:</strong> This invoice is {invoice.daysOverdue} days past due. 
                      Late fees of ${invoice.lateFees.toFixed(2)} have been applied.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {invoice.status === 'paid' && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-200">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Payment Received</h3>
                    <p className="text-green-700">Thank you! This invoice has been paid in full.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {invoice.isOverdue && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-200">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Payment Overdue</h3>
                    <p className="text-red-700">
                      This invoice is {invoice.daysOverdue} days past due. Please remit payment immediately to avoid additional charges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information - Modern Design */}
          {invoice.freelancerSettings && invoice.status !== 'paid' && (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Payment Information</h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-green-800">
                  <strong>Security:</strong> All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">PayPal</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 break-all">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Cash App</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">${invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Venmo</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">@{invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Google Pay</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 break-all">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Apple Pay</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 break-all">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Bank Transfer</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p className="break-words">{invoice.freelancerSettings.bankAccount}</p>
                      {invoice.freelancerSettings.bankIfscSwift && (
                        <p className="break-words">IFSC/SWIFT: {invoice.freelancerSettings.bankIfscSwift}</p>
                      )}
                      {invoice.freelancerSettings.bankIban && (
                        <p className="break-words">IBAN: {invoice.freelancerSettings.bankIban}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Stripe */}
                {invoice.freelancerSettings.stripeAccount && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Credit/Debit Card</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Processed securely via Stripe</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">Other Methods</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{invoice.freelancerSettings.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-gray-600 font-medium text-sm sm:text-base">Thank you for your business!</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Generated with <a href="https://invoice-flow-vert.vercel.app/" className="text-indigo-600 hover:text-indigo-700">InvoiceFlow</a>
                </p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
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