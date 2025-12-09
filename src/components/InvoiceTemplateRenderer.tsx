'use client'

import React from 'react'
import Image from 'next/image'
import { CheckCircle, Clock, AlertCircle, Mail, MapPin, Building2, CreditCard, Smartphone, DollarSign, Shield } from 'lucide-react'

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
  clientPhone?: string
  clientAddress?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  lateFees: number
  totalWithLateFees: number
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'due today'
  isOverdue: boolean
  daysOverdue: number
  notes?: string
  paymentTerms?: {
    enabled: boolean
    terms: string
  }
  theme?: {
    template?: number
    primary_color?: string
    secondary_color?: string
    accent_color?: string
  }
  type?: string
  lateFeesSettings?: {
    enabled: boolean
    type: 'fixed' | 'percentage'
    amount: number
    gracePeriod: number
  }
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

interface InvoiceTemplateRendererProps {
  invoice: Invoice
}

export default function InvoiceTemplateRenderer({ invoice }: InvoiceTemplateRendererProps) {
  // Determine which template to use
  const getTemplateNumber = () => {
    if (invoice.type === 'fast') {
      return 1 // Fast Invoice (60-second)
    }
    return invoice.theme?.template || 1 // Use theme template or default to 1
  }

  const templateNumber = getTemplateNumber()
  const primaryColor = invoice.theme?.primary_color || '#5C2D91'
  const secondaryColor = invoice.theme?.secondary_color || '#8B5CF6'
  const accentColor = invoice.theme?.accent_color || '#3B82F6'

  console.log(`InvoiceTemplateRenderer - Invoice Type: ${invoice.type}, Theme: ${JSON.stringify(invoice.theme)}, Template Number: ${templateNumber}`)
  console.log(`InvoiceTemplateRenderer - Primary Color: ${primaryColor}, Secondary Color: ${secondaryColor}`)

  // Render different templates based on template number
  switch (templateNumber) {
    case 1: // Fast Invoice (60-second) - Fixed colors, no customization
      return <FastInvoiceTemplate invoice={invoice} />
    case 4: // Modern
      return <ModernTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
    case 5: // Creative
      return <CreativeTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
    case 6: // Minimal
      return <MinimalTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} />
    default:
      return <FastInvoiceTemplate invoice={invoice} />
  }
}

// Fast Invoice Template (60-second) - Fixed Design (No color customization)
function FastInvoiceTemplate({ invoice }: { invoice: Invoice }) {
  // Fixed colors for fast invoice - no customization
  const primaryColor = '#0D9488'   // Teal
  const secondaryColor = '#3B82F6' // Blue
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'due today':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-700 bg-emerald-100'
      case 'pending':
        return 'text-blue-700 bg-blue-100'
      case 'due today':
        return 'text-amber-700 bg-amber-100'
      case 'overdue':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const calculateSubtotal = () => {
    if (!invoice.items || invoice.items.length === 0) return 0
    return invoice.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount?.toString() || '0') || 0
      return sum + amount
    }, 0)
  }

  const calculateTax = () => {
    return invoice.taxAmount || 0
  }

  const calculateTotal = () => {
    const subtotal = invoice.subtotal || calculateSubtotal()
    const tax = calculateTax()
    const discount = invoice.discount || 0
    return subtotal + tax - discount
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Fixed Color Banner */}
      <div style={{ backgroundColor: primaryColor }} className="text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">INVOICE</h1>
            <p className="text-white opacity-90 mt-2 text-lg">#{invoice.invoiceNumber}</p>
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
                  <div className="mt-2 space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                    </div>
                    {invoice.isOverdue && (
                      <div className="text-xs sm:text-sm text-red-600 font-medium">
                        {invoice.daysOverdue} days overdue
                      </div>
                    )}
                  </div>
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
                      <span className="font-medium text-xs sm:text-sm capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
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
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
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
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-gray-900 font-medium">-${invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                    <div className="flex justify-between">
                      <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                      <span className="text-red-600 font-medium">${invoice.lateFees.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.status === 'due today' && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                      <strong>Due Today Notice:</strong> This invoice is due today. 
                      {invoice.lateFeesSettings.gracePeriod > 0 ? ` Late fees will apply after ${invoice.lateFeesSettings.gracePeriod} days grace period.` : ' Late fees may apply if payment is delayed.'}
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-900">
                      {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Total'}
                    </span>
                    <span className={`font-bold ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-gray-900'}`} style={{ color: invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? undefined : primaryColor }}>
                      ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? invoice.totalWithLateFees.toFixed(2) : invoice.total.toFixed(2)}
                    </span>
                  </div>
                  {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
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

          {/* Payment Information */}
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
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
                  Generated with <a href={process.env.NEXT_PUBLIC_APP_URL || '/'} className="text-indigo-600 hover:text-indigo-700">FlowInvoicer</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modern Template (Template 4) - Modern Design with Clean Aesthetics
function ModernTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'due today':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-700 bg-emerald-100'
      case 'pending':
        return 'text-blue-700 bg-blue-100'
      case 'due today':
        return 'text-amber-700 bg-amber-100'
      case 'overdue':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header with Gradient and Glass Effect */}
      <div className="relative overflow-hidden">
        <div style={{ backgroundColor: primaryColor }} className="text-white relative">
          {/* Modern geometric background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-45 translate-x-16 -translate-y-16 modern-bg-1" style={{ backgroundColor: 'white' }}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-15 transform rotate-12 -translate-x-12 translate-y-12 modern-bg-2" style={{ backgroundColor: 'white' }}></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 opacity-20 transform rotate-45 modern-bg-3" style={{ backgroundColor: 'white' }}></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">INVOICE</h1>
              <p className="text-white opacity-90 mt-2 text-lg">#{invoice.invoiceNumber}</p>
            </div>
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
                  <div className="mt-2 space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                    </div>
                    {invoice.isOverdue && (
                      <div className="text-xs sm:text-sm text-red-600 font-medium">
                        {invoice.daysOverdue} days overdue
                      </div>
                    )}
                  </div>
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
                      <span className="font-medium text-xs sm:text-sm capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
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
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
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
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-gray-900 font-medium">-${invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                      {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                          <span className="text-red-600 font-medium">${invoice.lateFees.toFixed(2)}</span>
                        </div>
                      )}
                      {invoice.status === 'due today' && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                          <strong>Due Today Notice:</strong> This invoice is due today. 
                          {invoice.lateFeesSettings.gracePeriod > 0 ? ` Late fees will apply after ${invoice.lateFeesSettings.gracePeriod} days grace period.` : ' Late fees may apply if payment is delayed.'}
                        </div>
                      )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-900">
                      {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Total'}
                    </span>
                    <span className={`font-bold ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-gray-900'}`}>
                      ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? invoice.totalWithLateFees.toFixed(2) : invoice.total.toFixed(2)}
                    </span>
                  </div>
                  {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
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
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200 relative">
            {/* Modern geometric accent */}
            <div className="absolute top-0 left-0 w-16 h-16 opacity-5 transform rotate-12 -translate-x-8 -translate-y-8 modern-bg-2" style={{ backgroundColor: primaryColor }}></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 opacity-8 transform rotate-45 translate-x-6 translate-y-6 modern-bg-1" style={{ backgroundColor: secondaryColor }}></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <div className="text-center sm:text-left">
                <p className="text-gray-600 font-medium text-sm sm:text-base">Thank you for your business!</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Generated with <a href={process.env.NEXT_PUBLIC_APP_URL || '/'} className="text-indigo-600 hover:text-indigo-700">FlowInvoicer</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modern CSS Animations */}
      <style jsx>{`
        @keyframes modernFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        
        @keyframes modernPulse {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.1; transform: scale(1.02); }
        }
        
        @keyframes modernSlide {
          0% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          50% { transform: translateX(5px) translateY(-3px) rotate(1deg); }
          100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
        }
        
        .modern-bg-1 {
          animation: modernFloat 8s ease-in-out infinite;
        }
        
        .modern-bg-2 {
          animation: modernPulse 6s ease-in-out infinite;
        }
        
        .modern-bg-3 {
          animation: modernSlide 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Creative Template (Template 5) - Senior Graphic Designer Style
function CreativeTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'due today':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-700 bg-emerald-100'
      case 'pending':
        return 'text-blue-700 bg-blue-100'
      case 'due today':
        return 'text-amber-700 bg-amber-100'
      case 'overdue':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Creative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 creative-bg-1" style={{ backgroundColor: primaryColor, transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 creative-bg-2" style={{ backgroundColor: secondaryColor, transform: 'translate(-50%, 50%)' }}></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full opacity-8 creative-bg-3" style={{ backgroundColor: primaryColor, transform: 'translate(-50%, -50%)' }}></div>
      <div className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full opacity-12 creative-bg-4" style={{ backgroundColor: secondaryColor }}></div>
      <div className="absolute bottom-1/3 left-1/3 w-20 h-20 rounded-full opacity-15 creative-bg-5" style={{ backgroundColor: primaryColor }}></div>
      <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full opacity-20 creative-bg-6" style={{ backgroundColor: secondaryColor }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-12 h-12 rounded-full opacity-25 creative-bg-7" style={{ backgroundColor: primaryColor }}></div>
      
      {/* Modern Header with Dynamic Color Banner */}
      <div style={{ backgroundColor: primaryColor }} className="text-white relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">INVOICE</h1>
            <p className="text-white opacity-90 mt-2 text-lg">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Additional Creative Background Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-5 creative-bg-2" style={{ backgroundColor: secondaryColor, transform: 'translate(-20%, -20%)' }}></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-8 creative-bg-3" style={{ backgroundColor: primaryColor, transform: 'translate(20%, 20%)' }}></div>
        <div className="absolute top-1/2 right-0 w-28 h-28 rounded-full opacity-6 creative-bg-4" style={{ backgroundColor: secondaryColor, transform: 'translate(30%, -50%)' }}></div>
        
        {/* Invoice Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden relative border border-white/20">
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
                  <div className="mt-2 space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                    </div>
                    {invoice.isOverdue && (
                      <div className="text-xs sm:text-sm text-red-600 font-medium">
                        {invoice.daysOverdue} days overdue
                      </div>
                    )}
                  </div>
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
                      <span className="font-medium text-xs sm:text-sm capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
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
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
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
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-gray-900 font-medium">-${invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                      {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                          <span className="text-red-600 font-medium">${invoice.lateFees.toFixed(2)}</span>
                        </div>
                      )}
                      {invoice.status === 'due today' && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                          <strong>Due Today Notice:</strong> This invoice is due today. 
                          {invoice.lateFeesSettings.gracePeriod > 0 ? ` Late fees will apply after ${invoice.lateFeesSettings.gracePeriod} days grace period.` : ' Late fees may apply if payment is delayed.'}
                        </div>
                      )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-900">
                      {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Total'}
                    </span>
                    <span className={`font-bold ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-gray-900'}`}>
                      ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? invoice.totalWithLateFees.toFixed(2) : invoice.total.toFixed(2)}
                    </span>
                  </div>
                  {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
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
                  Generated with <a href={process.env.NEXT_PUBLIC_APP_URL || '/'} className="text-indigo-600 hover:text-indigo-700">FlowInvoicer</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Creative CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
        
        @keyframes drift {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(-5px) translateY(10px); }
          75% { transform: translateX(-10px) translateY(-5px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        
        .creative-bg-1 {
          animation: float 6s ease-in-out infinite;
        }
        
        .creative-bg-2 {
          animation: pulse 4s ease-in-out infinite;
        }
        
        .creative-bg-3 {
          animation: drift 8s ease-in-out infinite;
        }
        
        .creative-bg-4 {
          animation: float 5s ease-in-out infinite reverse;
        }
        
        .creative-bg-5 {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .creative-bg-6 {
          animation: drift 7s ease-in-out infinite reverse;
        }
        
        .creative-bg-7 {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Minimal Template (Template 6) - Copy of 60-second invoice with Dynamic Colors
function MinimalTemplate({ invoice, primaryColor, secondaryColor, accentColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string, accentColor: string }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'due today':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-700 bg-emerald-100'
      case 'pending':
        return 'text-blue-700 bg-blue-100'
      case 'due today':
        return 'text-amber-700 bg-amber-100'
      case 'overdue':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Dynamic Color Banner */}
      <div style={{ backgroundColor: primaryColor }} className="text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">INVOICE</h1>
            <p className="text-white opacity-90 mt-2 text-lg">#{invoice.invoiceNumber}</p>
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
                  <div className="mt-2 space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                    </div>
                    {invoice.isOverdue && (
                      <div className="text-xs sm:text-sm text-red-600 font-medium">
                        {invoice.daysOverdue} days overdue
                      </div>
                    )}
                  </div>
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
                      <span className="font-medium text-xs sm:text-sm capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
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
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
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
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-gray-900 font-medium">-${invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                      {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                          <span className="text-red-600 font-medium">${invoice.lateFees.toFixed(2)}</span>
                        </div>
                      )}
                      {invoice.status === 'due today' && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                          <strong>Due Today Notice:</strong> This invoice is due today. 
                          {invoice.lateFeesSettings.gracePeriod > 0 ? ` Late fees will apply after ${invoice.lateFeesSettings.gracePeriod} days grace period.` : ' Late fees may apply if payment is delayed.'}
                        </div>
                      )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-900">
                      {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Total'}
                    </span>
                    <span className={`font-bold ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-gray-900'}`}>
                      ${invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? invoice.totalWithLateFees.toFixed(2) : invoice.total.toFixed(2)}
                    </span>
                  </div>
                  {invoice.isOverdue && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
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
                    <p className="text-xs sm:text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
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
                  Generated with <a href={process.env.NEXT_PUBLIC_APP_URL || '/'} className="text-indigo-600 hover:text-indigo-700">FlowInvoicer</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
