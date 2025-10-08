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
  clientAddress?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  lateFees: number
  totalWithLateFees: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
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
    case 1: // Fast Invoice (60-second)
      return <FastInvoiceTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
    case 4: // Modern
      return <ModernTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
    case 5: // Creative
      return <CreativeTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
    case 6: // Minimal
      return <MinimalTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} />
    default:
      return <FastInvoiceTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
  }
}

// Fast Invoice Template (60-second) - Original Design
function FastInvoiceTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
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
                    ${invoice.total.toFixed(2)}
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
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900 font-bold">${invoice.total.toFixed(2)}</span>
                  </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modern Template (Template 4)
function ModernTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header with Theme Colors and Logo - Responsive */}
      <div className="border-b-2" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Logo */}
              {invoice.freelancerSettings?.logo && (
                <div className="flex-shrink-0">
                  <img 
                    src={invoice.freelancerSettings.logo} 
                    alt="Business Logo"
                    className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain rounded-lg bg-white/10 p-1 sm:p-2"
                  />
                </div>
              )}
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {invoice.freelancerSettings?.businessName || 'Your Business'}
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm sm:text-base lg:text-lg text-white/80 mb-1 sm:mb-2 font-medium">#{invoice.invoiceNumber}</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                ${invoice.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Invoice Status Section - Responsive */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-500' :
                    (() => {
                      const today = new Date();
                      const dueDate = new Date(invoice.dueDate);
                      const isDueToday = today.toDateString() === dueDate.toDateString();
                      
                      // Red only if actually overdue (not due today)
                      if (invoice.isOverdue && !isDueToday) {
                        return 'bg-red-500';
                      }
                      
                      // Orange if due today
                      if (isDueToday) {
                        return 'bg-orange-500';
                      }
                      
                      // Yellow for pending/draft
                      return 'bg-yellow-500';
                    })()
                  }`}
                ></div>
                <span className="text-lg sm:text-xl font-semibold text-gray-700">
                  {invoice.status === 'paid' ? 'Paid' :
                   (() => {
                     const today = new Date();
                     const dueDate = new Date(invoice.dueDate);
                     const isDueToday = today.toDateString() === dueDate.toDateString();
                     
                     // Overdue only if actually overdue (not due today)
                     if (invoice.isOverdue && !isDueToday) {
                       return 'Overdue';
                     }
                     
                     // Due Today if today is the due date
                     if (isDueToday) {
                       return 'Due Today';
                     }
                     
                     // Pending or Draft
                     return invoice.status === 'sent' ? 'Pending' : 'Draft';
                   })()}
                </span>
              </div>
              {(() => {
                const today = new Date();
                const dueDate = new Date(invoice.dueDate);
                const isDueToday = today.toDateString() === dueDate.toDateString();
                
                // Show overdue message only if actually overdue (not due today)
                if (invoice.isOverdue && !isDueToday) {
                  return (
                    <div className="text-red-600 font-medium text-base sm:text-lg">
                      {invoice.daysOverdue} day{invoice.daysOverdue !== 1 ? 's' : ''} overdue
                    </div>
                  );
                }
                
                // Show "Due Today" only if today is the due date and not paid
                if (isDueToday && invoice.status !== 'paid') {
                  return (
                    <div className="text-orange-600 font-medium text-base sm:text-lg">
                      Due Today
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Bill To and Invoice Details Grid with Borders - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 lg:mb-12">
          <div className="border-2 rounded-lg p-4 sm:p-6" style={{ borderColor: secondaryColor }}>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: primaryColor }}>Bill To</h3>
            <div className="text-gray-900">
              <p className="text-base sm:text-lg font-medium">{invoice.clientName}</p>
              {invoice.clientCompany && (
                <p className="text-gray-600 mt-1 text-sm sm:text-base">{invoice.clientCompany}</p>
              )}
              <p className="text-gray-600 mt-1 text-sm sm:text-base break-all">{invoice.clientEmail}</p>
            </div>
          </div>
          <div className="border-2 rounded-lg p-4 sm:p-6" style={{ borderColor: secondaryColor }}>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: primaryColor }}>Invoice Details</h3>
            <div className="text-gray-900">
              <p className="text-base sm:text-lg font-medium">Issue Date: {new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-base sm:text-lg font-medium mt-1">Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-base sm:text-lg font-medium mt-1">Status: Outstanding</p>
            </div>
          </div>
        </div>

        {/* Services Table with Theme Colors - Responsive */}
        <div className="mb-8 sm:mb-10 lg:mb-12 border-2 rounded-lg overflow-hidden" style={{ borderColor: secondaryColor }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr style={{ backgroundColor: primaryColor }}>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-white uppercase tracking-wider text-xs sm:text-sm">Description</th>
                  <th className="text-right py-3 sm:py-4 px-3 sm:px-6 font-semibold text-white uppercase tracking-wider text-xs sm:text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-900 text-sm sm:text-base lg:text-lg font-medium">{item.description}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-right text-gray-900 text-sm sm:text-base lg:text-lg font-semibold">
                      ${item.rate.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals with Theme Colors - Responsive */}
        <div className="flex justify-end mb-8 sm:mb-10 lg:mb-12">
          <div className="w-full sm:w-80 border-2 rounded-lg p-4 sm:p-6" style={{ borderColor: secondaryColor }}>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Subtotal</span>
                <span className="text-gray-900 text-sm sm:text-base lg:text-lg font-semibold">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Discount</span>
                  <span className="text-gray-900 text-sm sm:text-base lg:text-lg font-semibold">-${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Tax</span>
                  <span className="text-gray-900 text-sm sm:text-base lg:text-lg font-semibold">${invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              {/* Late Fees - Show as info when due today, add to total when overdue */}
              {(() => {
                const today = new Date();
                const dueDate = new Date(invoice.dueDate);
                const isDueToday = today.toDateString() === dueDate.toDateString();
                
                // Show late fee as information when due today (not added to total)
                if (isDueToday && invoice.status !== 'paid' && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                  return (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 my-3 sm:my-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-800 font-semibold text-xs sm:text-sm">Payment Notice</span>
                      </div>
                      <p className="text-orange-700 text-xs sm:text-sm">
                        Pay today to avoid a late fee of <span className="font-semibold">${invoice.lateFees.toFixed(2)}</span> ({invoice.lateFeesSettings.type === 'percentage' ? `${invoice.lateFeesSettings.amount}%` : 'Fixed'})
                      </p>
                    </div>
                  );
                }
                
                // Show late fee in totals when actually overdue (added to total)
                if (invoice.isOverdue && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                  return (
                    <div className="flex justify-between">
                      <span className="text-red-600 text-sm sm:text-base lg:text-lg font-medium">Late Fee ({invoice.lateFeesSettings.type === 'percentage' ? `${invoice.lateFeesSettings.amount}%` : 'Fixed'})</span>
                      <span className="text-red-600 text-sm sm:text-base lg:text-lg font-semibold">${invoice.lateFees.toFixed(2)}</span>
                    </div>
                  );
                }
                
                return null;
              })()}
              
              <div className="flex justify-between text-lg sm:text-xl lg:text-2xl font-bold pt-3 sm:pt-4" style={{ borderTopColor: primaryColor, borderTopWidth: '2px', borderTopStyle: 'solid' }}>
                <span className="text-gray-900">
                  {(() => {
                    const today = new Date();
                    const dueDate = new Date(invoice.dueDate);
                    const isDueToday = today.toDateString() === dueDate.toDateString();
                    
                    // Only show "Total with Late Fee" when actually overdue (not due today)
                    if (invoice.isOverdue && !isDueToday && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                      return 'Total with Late Fee';
                    }
                    return 'Total';
                  })()}
                </span>
                <span className="text-gray-900 font-black">
                  {(() => {
                    const today = new Date();
                    const dueDate = new Date(invoice.dueDate);
                    const isDueToday = today.toDateString() === dueDate.toDateString();
                    
                    // Only add late fee to total when actually overdue (not due today)
                    if (invoice.isOverdue && !isDueToday && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                      return `$${invoice.totalWithLateFees.toFixed(2)}`;
                    }
                    return `$${invoice.total.toFixed(2)}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section with Theme Colors - Responsive */}
        {invoice.notes && (
          <div className="border-2 rounded-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 lg:mb-12" style={{ borderColor: secondaryColor }}>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: primaryColor }}>Notes</h3>
            <p className="text-gray-900 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Terms Section with Theme Colors - Responsive */}
        {invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms && (
          <div className="border-2 rounded-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 lg:mb-12" style={{ borderColor: secondaryColor }}>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: primaryColor }}>Payment Terms</h3>
            <p className="text-gray-900 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">{invoice.paymentTerms.terms}</p>
          </div>
        )}

        {/* Payment Methods Section - Responsive */}
        {(invoice.freelancerSettings?.paypalEmail || invoice.freelancerSettings?.cashappId || invoice.freelancerSettings?.venmoId || invoice.freelancerSettings?.googlePayUpi || invoice.freelancerSettings?.applePayId || invoice.freelancerSettings?.bankAccount || invoice.freelancerSettings?.stripeAccount || invoice.freelancerSettings?.paymentNotes) && (
          <div className="border-2 rounded-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 lg:mb-12" style={{ borderColor: secondaryColor }}>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4 sm:mb-6" style={{ color: primaryColor }}>Payment Methods</h3>
            
            {/* Payment Notice */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-gray-700 text-xs sm:text-sm font-medium">
                Please use one of the following payment methods to settle this invoice. All payments are processed securely.
              </p>
            </div>

            {/* Payment Methods List */}
            <div className="space-y-2 sm:space-y-3">
              {invoice.freelancerSettings?.paypalEmail && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">PAYPAL</span>
                  <span className="text-gray-900 font-medium text-sm sm:text-base break-all">{invoice.freelancerSettings.paypalEmail}</span>
                </div>
              )}
              {invoice.freelancerSettings?.cashappId && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">CASH APP</span>
                  <span className="text-gray-900 font-medium text-sm sm:text-base">${invoice.freelancerSettings.cashappId}</span>
                </div>
              )}
              {invoice.freelancerSettings?.venmoId && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">VENMO</span>
                  <span className="text-gray-900 font-medium text-sm sm:text-base">@{invoice.freelancerSettings.venmoId}</span>
                </div>
              )}
              {invoice.freelancerSettings?.googlePayUpi && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">GOOGLE PAY</span>
                  <span className="text-gray-900 font-medium text-sm sm:text-base break-all">{invoice.freelancerSettings.googlePayUpi}</span>
                </div>
              )}
              {invoice.freelancerSettings?.applePayId && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">APPLE PAY</span>
                  <span className="text-gray-900 font-medium text-sm sm:text-base">{invoice.freelancerSettings.applePayId}</span>
                </div>
              )}
              {invoice.freelancerSettings?.bankAccount && (
                <div className="py-2 border-b border-gray-200">
                  <div className="mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">BANK TRANSFER</span>
                  </div>
                  <div className="text-gray-900 font-medium text-xs sm:text-sm">
                    <div className="break-words">{invoice.freelancerSettings.bankAccount}</div>
                    {invoice.freelancerSettings.bankIfscSwift && (
                      <div className="mt-1 break-words">{invoice.freelancerSettings.bankIfscSwift}</div>
                    )}
                    {invoice.freelancerSettings.bankIban && (
                      <div className="mt-1 break-words">{invoice.freelancerSettings.bankIban}</div>
                    )}
                  </div>
                </div>
              )}
              {invoice.freelancerSettings?.stripeAccount && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">CREDIT/DEBIT CARD</span>
                  <span className="text-gray-900 font-medium text-sm sm:text-base">Processed securely via Stripe</span>
                </div>
              )}
              {invoice.freelancerSettings?.paymentNotes && (
                <div className="py-2">
                  <div className="mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">OTHER</span>
                  </div>
                  <div className="text-gray-900 font-medium text-xs sm:text-sm break-words">{invoice.freelancerSettings.paymentNotes}</div>
                </div>
              )}
            </div>

            {/* Payment Security Notice */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6 text-center">
              <p className="text-gray-600 text-xs sm:text-sm font-medium">
                Security: All payment methods are secure and encrypted. Please include invoice number <strong>#{invoice.invoiceNumber}</strong> in your payment reference.
              </p>
            </div>
          </div>
        )}

        {/* Thank You Message - Responsive */}
        <div className="text-center">
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}

// Creative Template (Template 5) - Senior Graphic Designer Style
function CreativeTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Creative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5" style={{ backgroundColor: primaryColor, transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-5" style={{ backgroundColor: secondaryColor, transform: 'translate(-50%, 50%)' }}></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full opacity-3" style={{ backgroundColor: primaryColor, transform: 'translate(-50%, -50%)' }}></div>
      
      {/* Creative Header - Responsive */}
      <div className="relative overflow-hidden">
        <div style={{ backgroundColor: primaryColor }} className="text-white py-8 sm:py-12 lg:py-16 relative">
          {/* Header Background Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white opacity-10 rounded-full -translate-y-10 sm:-translate-y-16 lg:-translate-y-20 translate-x-10 sm:translate-x-16 lg:translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white opacity-10 rounded-full translate-y-8 sm:translate-y-12 lg:translate-y-16 -translate-x-8 sm:-translate-x-12 lg:-translate-x-16"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-white opacity-5 rounded-full"></div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-8">
              <div className="flex-1 flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-6 text-center lg:text-left">
                {/* Logo */}
                {invoice.freelancerSettings?.logo && (
                  <div className="flex-shrink-0">
                    <img 
                      src={invoice.freelancerSettings.logo} 
                      alt="Business Logo"
                      className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain rounded-lg bg-white/10 p-1 sm:p-2"
                    />
                  </div>
                )}
                {/* Business Info */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight">{invoice.freelancerSettings?.businessName || 'Your Business'}</h1>
                  <p className="text-white/80 mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg">{invoice.freelancerSettings?.email}</p>
                  {invoice.freelancerSettings?.phone && (
                    <p className="text-white/70 mt-1 text-sm sm:text-base">{invoice.freelancerSettings.phone}</p>
                  )}
                </div>
              </div>
              <div className="text-center lg:text-right flex-1">
                <div className="inline-block">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-wider">INVOICE</h2>
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <p className="text-white/90 text-sm sm:text-base lg:text-lg font-semibold">#{invoice.invoiceNumber}</p>
                    <p className="text-white/70 text-xs sm:text-sm mt-1">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative z-10">
        {/* Invoice Status Section - Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-500' :
                    (() => {
                      const today = new Date();
                      const dueDate = new Date(invoice.dueDate);
                      const isDueToday = today.toDateString() === dueDate.toDateString();
                      
                      // Red only if actually overdue (not due today)
                      if (invoice.isOverdue && !isDueToday) {
                        return 'bg-red-500';
                      }
                      
                      // Orange if due today
                      if (isDueToday) {
                        return 'bg-orange-500';
                      }
                      
                      // Yellow for pending/draft
                      return 'bg-yellow-500';
                    })()
                  }`}
                ></div>
                <span className="text-base sm:text-lg font-semibold text-gray-700">
                  {invoice.status === 'paid' ? 'Paid' :
                   (() => {
                     const today = new Date();
                     const dueDate = new Date(invoice.dueDate);
                     const isDueToday = today.toDateString() === dueDate.toDateString();
                     
                     // Overdue only if actually overdue (not due today)
                     if (invoice.isOverdue && !isDueToday) {
                       return 'Overdue';
                     }
                     
                     // Due Today if today is the due date
                     if (isDueToday) {
                       return 'Due Today';
                     }
                     
                     // Pending or Draft
                     return invoice.status === 'sent' ? 'Pending' : 'Draft';
                   })()}
                </span>
              </div>
              {(() => {
                const today = new Date();
                const dueDate = new Date(invoice.dueDate);
                const isDueToday = today.toDateString() === dueDate.toDateString();
                
                // Show overdue message only if actually overdue (not due today)
                if (invoice.isOverdue && !isDueToday) {
                  return (
                    <div className="text-red-600 font-medium text-sm sm:text-base">
                      {invoice.daysOverdue} day{invoice.daysOverdue !== 1 ? 's' : ''} overdue
                    </div>
                  );
                }
                
                // Show "Due Today" only if today is the due date and not paid
                if (isDueToday && invoice.status !== 'paid') {
                  return (
                    <div className="text-orange-600 font-medium text-sm sm:text-base">
                      Due Today
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-gray-500">Due Date</div>
              <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section - Responsive */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-1 sm:w-10 sm:h-1 lg:w-12 lg:h-1 rounded-full mr-3 sm:mr-4" style={{ backgroundColor: secondaryColor }}></div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Bill To</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Card Background Elements */}
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full opacity-5" style={{ backgroundColor: primaryColor, transform: 'translate(50%, -50%)' }}></div>
            <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full opacity-5" style={{ backgroundColor: secondaryColor, transform: 'translate(-50%, 50%)' }}></div>
            
            <div className="relative z-10">
              <p className="font-bold text-gray-900 text-lg sm:text-xl lg:text-2xl mb-2">{invoice.clientName}</p>
              {invoice.clientCompany && (
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-1">{invoice.clientCompany}</p>
              )}
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg break-all">{invoice.clientEmail}</p>
            </div>
          </div>
        </div>

        {/* Services Table - Responsive */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-1 sm:w-10 sm:h-1 lg:w-12 lg:h-1 rounded-full mr-3 sm:mr-4" style={{ backgroundColor: secondaryColor }}></div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Services</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative">
            {/* Table Background Elements */}
            <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full opacity-5" style={{ backgroundColor: primaryColor, transform: 'translate(-50%, -50%)' }}></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full opacity-5" style={{ backgroundColor: secondaryColor, transform: 'translate(50%, 50%)' }}></div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-full relative z-10">
                <thead>
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
                    <th className="text-left py-3 sm:py-4 lg:py-6 px-3 sm:px-6 lg:px-8 font-bold text-sm sm:text-base lg:text-lg">Description</th>
                    <th className="text-right py-3 sm:py-4 lg:py-6 px-3 sm:px-6 lg:px-8 font-bold text-sm sm:text-base lg:text-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-3 sm:py-4 lg:py-6 px-3 sm:px-6 lg:px-8 text-gray-900 text-sm sm:text-base lg:text-lg">{item.description}</td>
                      <td className="py-3 sm:py-4 lg:py-6 px-3 sm:px-6 lg:px-8 text-right text-gray-900 font-bold text-sm sm:text-base lg:text-lg">
                        ${item.rate.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals - Responsive */}
        <div className="flex justify-end">
          <div className="w-full sm:w-80 lg:w-96">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
              {/* Totals Background Elements */}
              <div className="absolute top-0 right-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full opacity-5" style={{ backgroundColor: primaryColor, transform: 'translate(50%, -50%)' }}></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full opacity-5" style={{ backgroundColor: secondaryColor, transform: 'translate(-50%, 50%)' }}></div>
              
              <div className="space-y-3 sm:space-y-4 relative z-10">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm sm:text-base lg:text-lg">Subtotal</span>
                  <span className="text-gray-900 font-semibold text-sm sm:text-base lg:text-lg">${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm sm:text-base lg:text-lg">Discount</span>
                    <span className="text-red-600 font-semibold text-sm sm:text-base lg:text-lg">-${invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm sm:text-base lg:text-lg">Tax</span>
                    <span className="text-gray-900 font-semibold text-sm sm:text-base lg:text-lg">${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {/* Late Fees - Show as info when due today, add to total when overdue */}
                {(() => {
                  const today = new Date();
                  const dueDate = new Date(invoice.dueDate);
                  const isDueToday = today.toDateString() === dueDate.toDateString();
                  
                  // Show late fee as information when due today (not added to total)
                  if (isDueToday && invoice.status !== 'paid' && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                    return (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 my-3 sm:my-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-orange-800 font-semibold text-xs sm:text-sm">Payment Notice</span>
                        </div>
                        <p className="text-orange-700 text-xs sm:text-sm">
                          Pay today to avoid a late fee of <span className="font-semibold">${invoice.lateFees.toFixed(2)}</span> ({invoice.lateFeesSettings.type === 'percentage' ? `${invoice.lateFeesSettings.amount}%` : 'Fixed'})
                        </p>
                      </div>
                    );
                  }
                  
                  // Show late fee in totals when actually overdue (added to total)
                  if (invoice.isOverdue && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                    return (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-red-600 text-sm sm:text-base lg:text-lg">Late Fee ({invoice.lateFeesSettings.type === 'percentage' ? `${invoice.lateFeesSettings.amount}%` : 'Fixed'})</span>
                        <span className="text-red-600 font-semibold text-sm sm:text-base lg:text-lg">${invoice.lateFees.toFixed(2)}</span>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 text-lg sm:text-xl lg:text-2xl font-bold">
                      {(() => {
                        const today = new Date();
                        const dueDate = new Date(invoice.dueDate);
                        const isDueToday = today.toDateString() === dueDate.toDateString();
                        
                        // Only show "Total with Late Fee" when actually overdue (not due today)
                        if (invoice.isOverdue && !isDueToday && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                          return 'Total with Late Fee';
                        }
                        return 'Total';
                      })()}
                    </span>
                    <span className="text-gray-900 text-xl sm:text-2xl lg:text-3xl font-black">
                      {(() => {
                        const today = new Date();
                        const dueDate = new Date(invoice.dueDate);
                        const isDueToday = today.toDateString() === dueDate.toDateString();
                        
                        // Only add late fee to total when actually overdue (not due today)
                        if (invoice.isOverdue && !isDueToday && invoice.lateFeesSettings?.enabled && invoice.lateFees > 0) {
                          return `$${invoice.totalWithLateFees.toFixed(2)}`;
                        }
                        return `$${invoice.total.toFixed(2)}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms and Notes - Responsive */}
        {((invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms) || invoice.notes) && (
          <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {invoice.paymentTerms?.enabled && invoice.paymentTerms?.terms && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full opacity-5" style={{ backgroundColor: secondaryColor, transform: 'translate(-50%, -50%)' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-6 h-1 sm:w-7 sm:h-1 lg:w-8 lg:h-1 rounded-full mr-2 sm:mr-3" style={{ backgroundColor: primaryColor }}></div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Payment Terms</h3>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">{invoice.paymentTerms.terms}</p>
                </div>
              </div>
            )}
            
            {invoice.notes && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full opacity-5" style={{ backgroundColor: primaryColor, transform: 'translate(50%, -50%)' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-6 h-1 sm:w-7 sm:h-1 lg:w-8 lg:h-1 rounded-full mr-2 sm:mr-3" style={{ backgroundColor: secondaryColor }}></div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">{invoice.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Methods Section - Clean Creative Design */}
        {(invoice.freelancerSettings?.paypalEmail || invoice.freelancerSettings?.cashappId || invoice.freelancerSettings?.venmoId || invoice.freelancerSettings?.googlePayUpi || invoice.freelancerSettings?.applePayId || invoice.freelancerSettings?.bankAccount || invoice.freelancerSettings?.stripeAccount || invoice.freelancerSettings?.paymentNotes) && (
          <div className="mt-8 sm:mt-10 lg:mt-12">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-8 h-1 sm:w-10 sm:h-1 lg:w-12 lg:h-1 rounded-full mr-3 sm:mr-4" style={{ backgroundColor: secondaryColor }}></div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Payment Methods</h3>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
              {/* Payment Methods Background Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full opacity-5" style={{ backgroundColor: primaryColor, transform: 'translate(50%, -50%)' }}></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full opacity-5" style={{ backgroundColor: secondaryColor, transform: 'translate(-50%, 50%)' }}></div>
              
              <div className="relative z-10">
                {/* Payment Notice */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-gray-700 text-xs sm:text-sm font-medium">
                    Please use one of the following payment methods to settle this invoice. All payments are processed securely.
                  </p>
                </div>

                {/* Payment Methods List */}
                <div className="space-y-3 sm:space-y-4">
                  {/* PayPal */}
                  {invoice.freelancerSettings?.paypalEmail && (
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">PayPal</span>
                      </div>
                      <span className="text-gray-600 text-sm sm:text-base break-all">{invoice.freelancerSettings.paypalEmail}</span>
                    </div>
                  )}

                  {/* Cash App */}
                  {invoice.freelancerSettings?.cashappId && (
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Cash App</span>
                      </div>
                      <span className="text-gray-600 text-sm sm:text-base">${invoice.freelancerSettings.cashappId}</span>
                    </div>
                  )}

                  {/* Venmo */}
                  {invoice.freelancerSettings?.venmoId && (
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Venmo</span>
                      </div>
                      <span className="text-gray-600 text-sm sm:text-base">@{invoice.freelancerSettings.venmoId}</span>
                    </div>
                  )}

                  {/* Google Pay */}
                  {invoice.freelancerSettings?.googlePayUpi && (
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Google Pay</span>
                      </div>
                      <span className="text-gray-600 text-sm sm:text-base break-all">{invoice.freelancerSettings.googlePayUpi}</span>
                    </div>
                  )}

                  {/* Apple Pay */}
                  {invoice.freelancerSettings?.applePayId && (
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Apple Pay</span>
                      </div>
                      <span className="text-gray-600 text-sm sm:text-base break-all">{invoice.freelancerSettings.applePayId}</span>
                    </div>
                  )}

                  {/* Bank Transfer */}
                  {invoice.freelancerSettings?.bankAccount && (
                    <div className="py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Bank Transfer</span>
                      </div>
                      <div className="text-gray-600 text-sm sm:text-base space-y-1 ml-11 sm:ml-14">
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
                  {invoice.freelancerSettings?.stripeAccount && (
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Credit/Debit Card</span>
                      </div>
                      <span className="text-gray-600 text-sm sm:text-base">Processed securely via Stripe</span>
                    </div>
                  )}

                  {/* Other Payment Methods */}
                  {invoice.freelancerSettings?.paymentNotes && (
                    <div className="py-3 sm:py-4">
                      <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Other Methods</span>
                      </div>
                      <p className="text-gray-600 text-sm sm:text-base break-words ml-11 sm:ml-14">{invoice.freelancerSettings.paymentNotes}</p>
                    </div>
                  )}
                </div>

                {/* Payment Security Notice */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6 text-center">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">
                    Security: All payment methods are secure and encrypted. Please include invoice number <strong>#{invoice.invoiceNumber}</strong> in your payment reference.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .header .flex-1.flex {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          .header img {
            height: 48px !important;
            width: 48px !important;
          }
          .header h1 {
            font-size: 2rem !important;
          }
          .header h2 {
            font-size: 3rem !important;
          }
          /* Status section mobile */
          .status-section {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
