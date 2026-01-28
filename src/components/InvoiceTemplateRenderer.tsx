'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, Clock, AlertCircle, Mail, MapPin, Building2, CreditCard, Smartphone, DollarSign, Shield, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrencyForCards } from '@/lib/currency'

interface InvoiceItem {
  id: string
  description: string
  rate: number
  qty?: number
  amount: number
}

interface Invoice {
  id: string
  userId?: string // Invoice owner's user ID
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
  totalPaid?: number
  remainingBalance?: number
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
  currency?: string
  exchange_rate?: number
  base_currency_amount?: number
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

  // Helper function to get amount color based on invoice status
  // Orange for pending, Red for overdue, Green only when paid
  const getAmountColor = () => {
    if (invoice.status === 'paid') {
      return '#10b981' // Green
    }
    if (invoice.status === 'overdue' || invoice.isOverdue) {
      return '#ef4444' // Red
    }
    if (invoice.status === 'pending') {
      return '#FF6B35' // Orange - matches estimate public page
    }
    return '#FF6B35' // Default to orange for other statuses (draft, due today) - matches estimate public page
  }

  console.log(`InvoiceTemplateRenderer - Invoice Type: ${invoice.type}, Theme: ${JSON.stringify(invoice.theme)}, Template Number: ${templateNumber}`)
  console.log(`InvoiceTemplateRenderer - Primary Color: ${primaryColor}, Secondary Color: ${secondaryColor}`)

  // Render different templates based on template number
  switch (templateNumber) {
    case 1: // Fast Invoice (60-second) - Fixed colors, no customization
      return <FastInvoiceTemplate invoice={invoice} getAmountColor={getAmountColor} />
    case 4: // Modern
      return <ModernTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} getAmountColor={getAmountColor} />
    case 5: // Creative
      return <CreativeTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} getAmountColor={getAmountColor} />
    case 6: // Minimal
      return <MinimalTemplate invoice={invoice} primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} getAmountColor={getAmountColor} />
    default:
      return <FastInvoiceTemplate invoice={invoice} getAmountColor={getAmountColor} />
  }
}

// Fast Invoice Template (60-second) - Fixed Design (No color customization)
function FastInvoiceTemplate({ invoice, getAmountColor }: { invoice: Invoice, getAmountColor: () => string }) {
  // Fixed colors for fast invoice - purple theme to match site
  const primaryColor = '#5C2D91'   // Purple (for amount and accents)
  const secondaryColor = '#8B5CF6' // Light Purple
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null)

  const handleCopyPaymentMethod = async (methodType: string, details: string) => {
    try {
      await navigator.clipboard.writeText(details)
      setCopiedMethod(methodType)
      setTimeout(() => setCopiedMethod(null), 2000)

      // Log the copy event - only if viewer is NOT the owner
      // CRITICAL: Do not track activities for paid invoices (privacy and legal compliance)
      if (invoice.id && invoice.status !== 'paid') {
        try {
          // Check if the viewer is authenticated
          const { data: { session } } = await supabase.auth.getSession()
          
          // Check URL parameters for owner flag (works in incognito mode)
          const urlParams = new URLSearchParams(window.location.search)
          const isOwnerView = urlParams.get('owner') === 'true'
          
          // If user is authenticated and owns the invoice, don't log
          if (session?.user && invoice.userId && session.user.id === invoice.userId) {
            // Owner copying their own payment method - don't log as customer action
            return
          }
          
          // If URL has owner=true parameter, don't log (owner viewing in incognito)
          if (isOwnerView) {
            return
          }
          
          // Log as customer action (either not authenticated or not the owner)
          await fetch('/api/invoices/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoice.id,
              type: 'payment_method_copied',
              metadata: { paymentMethod: methodType }
            })
          })
        } catch (error) {
          console.error('Failed to log payment method copy event:', error)
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }
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

  const invoiceCurrency = invoice.currency || 'USD'
  const formatCurrencyAmount = (amount: number) => {
    return formatCurrencyForCards(amount, invoiceCurrency)
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

  const calculateTotal = () => {
    // Calculate total with discount and tax
    const subtotal = invoice.subtotal || calculateSubtotal()
    const discount = invoice.discount || 0
    const taxAmount = invoice.taxAmount || 0
    return subtotal - discount + taxAmount
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200">
        {/* Header */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1 w-full sm:w-auto" style={{ paddingLeft: 0, marginLeft: 0 }}>
              {/* Modern Logo Display */}
              {invoice.freelancerSettings?.logo && (
                <div className="mb-4" style={{ paddingLeft: 0, marginLeft: 0 }}>
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32" style={{ marginLeft: 0, paddingLeft: 0 }}>
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="w-full h-full object-contain"
                      style={{ display: 'block', margin: 0, padding: 0, verticalAlign: 'top' }}
                      onError={(e) => {
                        // Fallback to business name initial if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">${(invoice.freelancerSettings?.businessName || 'B').charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="text-lg sm:text-xl font-normal text-gray-900 mb-1" style={{ color: '#1F2937', letterSpacing: 0, paddingLeft: 0, marginLeft: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.email}</div>
              )}
              
              {/* Payment Overdue Notice - Status Banner Style */}
              {invoice.isOverdue && (
                <div className="mt-4 px-4 py-3 bg-red-50 border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Payment Overdue</p>
                      <p className="text-xs text-red-700 mt-0.5">This invoice is {invoice.daysOverdue} days past due. Please remit payment immediately to avoid additional charges.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right flex-1 w-full sm:w-auto sm:pl-6">
              <div className="text-lg sm:text-xl font-normal text-gray-900 mb-3" style={{ color: '#1F2937', letterSpacing: 0 }}>
                INVOICE
              </div>
              <div className="text-sm font-bold text-black mb-2">#{invoice.invoiceNumber}</div>
              <div className="text-xs text-gray-500 mb-1">
                Issue: {new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: getAmountColor(), letterSpacing: '-0.5px' }}>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? formatCurrencyAmount(invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)
                  : formatCurrencyAmount(invoice.isOverdue ? (invoice.totalWithLateFees || calculateTotal()) : calculateTotal())}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: {formatCurrencyAmount(invoice.totalPaid)} • Remaining: {formatCurrencyAmount(invoice.remainingBalance)}
                </div>
              )}
              {/* Status Badge */}
              <div className="mt-3 flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance && invoice.remainingBalance > 0 && invoice.status !== 'paid' && (
                  <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-blue-700 bg-blue-100">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="whitespace-nowrap">Partial Paid</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Bill To */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
              Bill To
            </div>
            <div className="text-sm text-black">{invoice.clientName}</div>
            {invoice.clientCompany && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientCompany}</div>
            )}
            {invoice.clientEmail && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientEmail}</div>
            )}
            {invoice.clientPhone && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientPhone}</div>
            )}
            {invoice.clientAddress && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientAddress}</div>
            )}
          </div>

          {/* Items */}
          {invoice.items.length > 0 && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Items
              </div>
              {/* Table Header - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-4 mb-3 pb-2 border-b border-gray-200">
                <div className="col-span-5 text-xs font-medium text-gray-600">Description</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Qty</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Rate</div>
                <div className="col-span-3 text-xs font-medium text-gray-600 text-right">Amount</div>
              </div>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index}>
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-1">
                      <div className="text-sm text-black font-medium">{item.description}</div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Qty: {(item.qty || 1).toFixed(2)}</span>
                        <span>Rate: {formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</span>
                        <span className="text-black font-medium">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</span>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 text-sm">
                      <div className="col-span-5 text-black">{item.description}</div>
                      <div className="col-span-2 text-black text-right">{(item.qty || 1).toFixed(2)}</div>
                      <div className="col-span-2 text-black text-right">{formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</div>
                      <div className="col-span-3 text-black text-right">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary - Right-aligned for professional invoice layout */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 lg:w-2/5 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.subtotal || calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                  <span className="text-black">-{formatCurrencyAmount(invoice.discount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">Total</span>
                  <span className="font-bold text-black" style={{ color: primaryColor }}>
                    {formatCurrencyAmount(calculateTotal())}
                  </span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                      <span className="text-emerald-600">-{formatCurrencyAmount(invoice.totalPaid)}</span>
                    </div>
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                        <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-black">
                        {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                      </span>
                      <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`} style={invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? {} : { color: primaryColor }}>
                        {formatCurrencyAmount(invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)}
                      </span>
                    </div>
                  </>
                )}
                {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                      <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-red-600">Total Payable</span>
                      <span className="font-bold text-red-600">{formatCurrencyAmount(invoice.totalWithLateFees)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {invoice.status === 'paid' && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Payment Received</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Thank you! This invoice has been paid in full.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          {invoice.freelancerSettings && invoice.status !== 'paid' && (
            <div className="mb-8 pb-8">
              <div className="text-sm font-semibold text-gray-900 mb-5" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-5 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods - Grid Layout: 2 columns on desktop, 1 column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">PayPal</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('PayPal', invoice.freelancerSettings?.paypalEmail || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy PayPal email"
                      >
                        {copiedMethod === 'PayPal' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Cash App</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Cash App', invoice.freelancerSettings?.cashappId?.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + (invoice.freelancerSettings?.cashappId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Cash App ID"
                      >
                        {copiedMethod === 'Cash App' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Venmo</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Venmo', invoice.freelancerSettings?.venmoId?.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + (invoice.freelancerSettings?.venmoId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Venmo ID"
                      >
                        {copiedMethod === 'Venmo' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Google Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Google Pay', invoice.freelancerSettings?.googlePayUpi || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Google Pay UPI"
                      >
                        {copiedMethod === 'Google Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Apple Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Apple Pay', invoice.freelancerSettings?.applePayId || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Apple Pay ID"
                      >
                        {copiedMethod === 'Apple Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
                      </div>
                      <button
                        onClick={() => {
                          const bankDetails = [
                            invoice.freelancerSettings?.bankAccount,
                            invoice.freelancerSettings?.bankIfscSwift && `IFSC/SWIFT: ${invoice.freelancerSettings.bankIfscSwift}`,
                            invoice.freelancerSettings?.bankIban && `IBAN: ${invoice.freelancerSettings.bankIban}`
                          ].filter(Boolean).join('\n')
                          handleCopyPaymentMethod('Bank Transfer', bankDetails)
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy bank details"
                      >
                        {copiedMethod === 'Bank Transfer' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
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
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Credit/Debit Card</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Stripe', invoice.freelancerSettings?.stripeAccount || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment info"
                      >
                        {copiedMethod === 'Stripe' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Other Methods</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Other Methods', invoice.freelancerSettings?.paymentNotes || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment notes"
                      >
                        {copiedMethod === 'Other Methods' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-words leading-relaxed">{invoice.freelancerSettings.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Notes
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
            </div>
          )}
        </div>

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
  )
}

// Modern Template (Template 4) - Modern Design with Clean Aesthetics
function ModernTemplate({ invoice, primaryColor, secondaryColor, getAmountColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string, getAmountColor: () => string }) {
  const invoiceCurrency = invoice.currency || 'USD'
  const formatCurrencyAmount = (amount: number) => {
    return formatCurrencyForCards(amount, invoiceCurrency)
  }
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null)

  const handleCopyPaymentMethod = async (methodType: string, details: string) => {
    try {
      await navigator.clipboard.writeText(details)
      setCopiedMethod(methodType)
      setTimeout(() => setCopiedMethod(null), 2000)

      // Log the copy event - only if viewer is NOT the owner
      // CRITICAL: Do not track activities for paid invoices (privacy and legal compliance)
      if (invoice.id && invoice.status !== 'paid') {
        try {
          // Check if the viewer is authenticated
          const { data: { session } } = await supabase.auth.getSession()
          
          // Check URL parameters for owner flag (works in incognito mode)
          const urlParams = new URLSearchParams(window.location.search)
          const isOwnerView = urlParams.get('owner') === 'true'
          
          // If user is authenticated and owns the invoice, don't log
          if (session?.user && invoice.userId && session.user.id === invoice.userId) {
            // Owner copying their own payment method - don't log as customer action
            return
          }
          
          // If URL has owner=true parameter, don't log (owner viewing in incognito)
          if (isOwnerView) {
            return
          }
          
          // Log as customer action (either not authenticated or not the owner)
          await fetch('/api/invoices/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoice.id,
              type: 'payment_method_copied',
              metadata: { paymentMethod: methodType }
            })
          })
        } catch (error) {
          console.error('Failed to log payment method copy event:', error)
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200">
        {/* Header */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1 w-full sm:w-auto">
              {/* Modern Logo Display */}
              {invoice.freelancerSettings?.logo && (
                <div className="mb-4" style={{ paddingLeft: 0, marginLeft: 0, lineHeight: 0 }}>
                  <div className="relative" style={{ marginLeft: 0, paddingLeft: 0, lineHeight: 0, display: 'inline-block' }}>
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="max-w-[112px] sm:max-w-[128px] h-auto"
                      style={{ 
                        display: 'block', 
                        margin: 0, 
                        padding: 0, 
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        verticalAlign: 'top',
                        lineHeight: 0,
                        maxHeight: '112px'
                      }}
                      onError={(e) => {
                        // Fallback to business name initial if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold" style="color: ${primaryColor || '#1F2937'}">${(invoice.freelancerSettings?.businessName || 'B').charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="text-lg sm:text-xl font-normal mb-1" style={{ color: primaryColor || '#1F2937', letterSpacing: 0, paddingLeft: 0, marginLeft: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.email}</div>
              )}
              
              {/* Payment Overdue Notice - Status Banner Style */}
              {invoice.isOverdue && (
                <div className="mt-4 px-4 py-3 bg-red-50 border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Payment Overdue</p>
                      <p className="text-xs text-red-700 mt-0.5">This invoice is {invoice.daysOverdue} days past due. Please remit payment immediately to avoid additional charges.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right flex-1 w-full sm:w-auto sm:pl-6">
              <div className="text-lg sm:text-xl font-normal mb-3" style={{ color: primaryColor || '#1F2937', letterSpacing: 0 }}>
                INVOICE
              </div>
              <div className="text-sm font-bold text-black mb-2">#{invoice.invoiceNumber}</div>
              <div className="text-xs text-gray-500 mb-1">
                Issue: {new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: getAmountColor(), letterSpacing: '-0.5px' }}>
                {formatCurrencyAmount(invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || invoice.total) : invoice.total))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: {formatCurrencyAmount(invoice.totalPaid)} • Remaining: {formatCurrencyAmount(invoice.remainingBalance)}
                </div>
              )}
              {/* Status Badge */}
              <div className="mt-3 flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance && invoice.remainingBalance > 0 && invoice.status !== 'paid' && (
                  <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-blue-700 bg-blue-100">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="whitespace-nowrap">Partial Paid</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Bill To */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="text-sm font-normal mb-4" style={{ color: primaryColor || '#1F2937' }}>
              Bill To
            </div>
            <div className="text-sm" style={{ color: primaryColor || '#000000' }}>{invoice.clientName}</div>
            {invoice.clientCompany && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientCompany}</div>
            )}
            {invoice.clientEmail && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientEmail}</div>
            )}
            {invoice.clientPhone && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientPhone}</div>
            )}
            {invoice.clientAddress && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientAddress}</div>
            )}
          </div>

          {/* Items */}
          {invoice.items.length > 0 && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal mb-4" style={{ color: primaryColor || '#1F2937' }}>
                Items
              </div>
              {/* Table Header - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-4 mb-3 pb-2 border-b border-gray-200">
                <div className="col-span-5 text-xs font-medium text-gray-600">Description</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Qty</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Rate</div>
                <div className="col-span-3 text-xs font-medium text-gray-600 text-right">Amount</div>
              </div>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index}>
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-1">
                      <div className="text-sm text-black font-medium">{item.description}</div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Qty: {(item.qty || 1).toFixed(2)}</span>
                        <span>Rate: {formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</span>
                        <span className="text-black font-medium">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</span>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 text-sm">
                      <div className="col-span-5 text-black">{item.description}</div>
                      <div className="col-span-2 text-black text-right">{(item.qty || 1).toFixed(2)}</div>
                      <div className="col-span-2 text-black text-right">{formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</div>
                      <div className="col-span-3 text-black text-right">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary - Right-aligned for professional invoice layout */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 lg:w-2/5 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.subtotal)}</span>
                </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                  <span className="text-black">-{formatCurrencyAmount(invoice.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.taxAmount || 0)}</span>
                  </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">Total</span>
                  <span className="font-bold text-black">{formatCurrencyAmount(invoice.total)}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                      <span className="text-emerald-600">-{formatCurrencyAmount(invoice.totalPaid)}</span>
                    </div>
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                        <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-black">
                        {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                      </span>
                      <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`}>
                        {formatCurrencyAmount(invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)}
                      </span>
                    </div>
                  </>
                )}
                {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                      <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-red-600">Total Payable</span>
                      <span className="font-bold text-red-600">{formatCurrencyAmount(invoice.totalWithLateFees)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {invoice.status === 'paid' && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-200">
              <div className="px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Payment Received</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Thank you! This invoice has been paid in full.</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Payment Information */}
          {invoice.freelancerSettings && invoice.status !== 'paid' && (
            <div className="mb-8 pb-8">
              <div className="text-sm font-semibold text-gray-900 mb-5" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-5 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods - Grid Layout: 2 columns on desktop, 1 column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">PayPal</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('PayPal', invoice.freelancerSettings?.paypalEmail || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy PayPal email"
                      >
                        {copiedMethod === 'PayPal' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Cash App</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Cash App', invoice.freelancerSettings?.cashappId?.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + (invoice.freelancerSettings?.cashappId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Cash App ID"
                      >
                        {copiedMethod === 'Cash App' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Venmo</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Venmo', invoice.freelancerSettings?.venmoId?.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + (invoice.freelancerSettings?.venmoId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Venmo ID"
                      >
                        {copiedMethod === 'Venmo' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Google Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Google Pay', invoice.freelancerSettings?.googlePayUpi || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Google Pay UPI"
                      >
                        {copiedMethod === 'Google Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Apple Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Apple Pay', invoice.freelancerSettings?.applePayId || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Apple Pay ID"
                      >
                        {copiedMethod === 'Apple Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
                      </div>
                      <button
                        onClick={() => {
                          const bankDetails = [
                            invoice.freelancerSettings?.bankAccount,
                            invoice.freelancerSettings?.bankIfscSwift && `IFSC/SWIFT: ${invoice.freelancerSettings.bankIfscSwift}`,
                            invoice.freelancerSettings?.bankIban && `IBAN: ${invoice.freelancerSettings.bankIban}`
                          ].filter(Boolean).join('\n')
                          handleCopyPaymentMethod('Bank Transfer', bankDetails)
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy bank details"
                      >
                        {copiedMethod === 'Bank Transfer' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
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
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Credit/Debit Card</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Stripe', invoice.freelancerSettings?.stripeAccount || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment info"
                      >
                        {copiedMethod === 'Stripe' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Other Methods</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Other Methods', invoice.freelancerSettings?.paymentNotes || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment notes"
                      >
                        {copiedMethod === 'Other Methods' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-words leading-relaxed">{invoice.freelancerSettings.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Notes
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
            </div>
          )}
        </div>

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
  )
}

// Creative Template (Template 5) - Senior Graphic Designer Style
function CreativeTemplate({ invoice, primaryColor, secondaryColor, getAmountColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string, getAmountColor: () => string }) {
  const invoiceCurrency = invoice.currency || 'USD'
  const formatCurrencyAmount = (amount: number) => {
    return formatCurrencyForCards(amount, invoiceCurrency)
  }
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null)

  const handleCopyPaymentMethod = async (methodType: string, details: string) => {
    try {
      await navigator.clipboard.writeText(details)
      setCopiedMethod(methodType)
      setTimeout(() => setCopiedMethod(null), 2000)

      // Log the copy event - only if viewer is NOT the owner
      // CRITICAL: Do not track activities for paid invoices (privacy and legal compliance)
      if (invoice.id && invoice.status !== 'paid') {
        try {
          // Check if the viewer is authenticated
          const { data: { session } } = await supabase.auth.getSession()
          
          // Check URL parameters for owner flag (works in incognito mode)
          const urlParams = new URLSearchParams(window.location.search)
          const isOwnerView = urlParams.get('owner') === 'true'
          
          // If user is authenticated and owns the invoice, don't log
          if (session?.user && invoice.userId && session.user.id === invoice.userId) {
            // Owner copying their own payment method - don't log as customer action
            return
          }
          
          // If URL has owner=true parameter, don't log (owner viewing in incognito)
          if (isOwnerView) {
            return
          }
          
          // Log as customer action (either not authenticated or not the owner)
          await fetch('/api/invoices/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoice.id,
              type: 'payment_method_copied',
              metadata: { paymentMethod: methodType }
            })
          })
        } catch (error) {
          console.error('Failed to log payment method copy event:', error)
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200">
        {/* Header */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1 w-full sm:w-auto">
              {/* Modern Logo Display */}
              {invoice.freelancerSettings?.logo && (
                <div className="mb-4" style={{ paddingLeft: 0, marginLeft: 0, lineHeight: 0 }}>
                  <div className="relative" style={{ marginLeft: 0, paddingLeft: 0, lineHeight: 0, display: 'inline-block' }}>
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="max-w-[112px] sm:max-w-[128px] h-auto"
                      style={{ 
                        display: 'block', 
                        margin: 0, 
                        padding: 0, 
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        verticalAlign: 'top',
                        lineHeight: 0,
                        maxHeight: '112px'
                      }}
                      onError={(e) => {
                        // Fallback to business name initial if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold" style="color: ${primaryColor || '#1F2937'}">${(invoice.freelancerSettings?.businessName || 'B').charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="text-lg sm:text-xl font-normal mb-1" style={{ color: primaryColor || '#1F2937', letterSpacing: 0, paddingLeft: 0, marginLeft: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.email}</div>
              )}
              
              {/* Payment Overdue Notice - Status Banner Style */}
              {invoice.isOverdue && (
                <div className="mt-4 px-4 py-3 bg-red-50 border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Payment Overdue</p>
                      <p className="text-xs text-red-700 mt-0.5">This invoice is {invoice.daysOverdue} days past due. Please remit payment immediately to avoid additional charges.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right flex-1 w-full sm:w-auto sm:pl-6">
              <div className="text-lg sm:text-xl font-normal mb-3" style={{ color: primaryColor || '#1F2937', letterSpacing: 0 }}>
                INVOICE
              </div>
              <div className="text-sm font-bold text-black mb-2">#{invoice.invoiceNumber}</div>
              <div className="text-xs text-gray-500 mb-1">
                Issue: {new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: getAmountColor(), letterSpacing: '-0.5px' }}>
                {formatCurrencyAmount(invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || invoice.total) : invoice.total))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: {formatCurrencyAmount(invoice.totalPaid)} • Remaining: {formatCurrencyAmount(invoice.remainingBalance)}
                </div>
              )}
              {/* Status Badge */}
              <div className="mt-3 flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance && invoice.remainingBalance > 0 && invoice.status !== 'paid' && (
                  <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-blue-700 bg-blue-100">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="whitespace-nowrap">Partial Paid</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Bill To */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="text-sm font-normal mb-4" style={{ color: primaryColor || '#1F2937' }}>
              Bill To
            </div>
            <div className="text-sm" style={{ color: primaryColor || '#000000' }}>{invoice.clientName}</div>
            {invoice.clientCompany && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientCompany}</div>
            )}
            {invoice.clientEmail && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientEmail}</div>
            )}
            {invoice.clientPhone && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientPhone}</div>
            )}
            {invoice.clientAddress && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientAddress}</div>
            )}
          </div>

          {/* Items */}
          {invoice.items.length > 0 && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal mb-4" style={{ color: primaryColor || '#1F2937' }}>
                Items
              </div>
              {/* Table Header - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-4 mb-3 pb-2 border-b border-gray-200">
                <div className="col-span-5 text-xs font-medium text-gray-600">Description</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Qty</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Rate</div>
                <div className="col-span-3 text-xs font-medium text-gray-600 text-right">Amount</div>
              </div>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index}>
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-1">
                      <div className="text-sm text-black font-medium">{item.description}</div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Qty: {(item.qty || 1).toFixed(2)}</span>
                        <span>Rate: {formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</span>
                        <span className="text-black font-medium">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</span>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 text-sm">
                      <div className="col-span-5 text-black">{item.description}</div>
                      <div className="col-span-2 text-black text-right">{(item.qty || 1).toFixed(2)}</div>
                      <div className="col-span-2 text-black text-right">{formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</div>
                      <div className="col-span-3 text-black text-right">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary - Right-aligned for professional invoice layout */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 lg:w-2/5 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.subtotal)}</span>
                </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                  <span className="text-black">-{formatCurrencyAmount(invoice.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.taxAmount || 0)}</span>
                  </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">Total</span>
                  <span className="font-bold text-black">{formatCurrencyAmount(invoice.total)}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                      <span className="text-emerald-600">-{formatCurrencyAmount(invoice.totalPaid)}</span>
                    </div>
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                        <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-black">
                        {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                      </span>
                      <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`}>
                        {formatCurrencyAmount(invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)}
                      </span>
                    </div>
                  </>
                )}
                {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                      <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-red-600">Total Payable</span>
                      <span className="font-bold text-red-600">{formatCurrencyAmount(invoice.totalWithLateFees)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {invoice.status === 'paid' && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-200">
              <div className="px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Payment Received</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Thank you! This invoice has been paid in full.</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Payment Information */}
          {invoice.freelancerSettings && invoice.status !== 'paid' && (
            <div className="mb-8 pb-8">
              <div className="text-sm font-semibold text-gray-900 mb-5" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-5 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods - Grid Layout: 2 columns on desktop, 1 column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">PayPal</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('PayPal', invoice.freelancerSettings?.paypalEmail || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy PayPal email"
                      >
                        {copiedMethod === 'PayPal' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Cash App</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Cash App', invoice.freelancerSettings?.cashappId?.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + (invoice.freelancerSettings?.cashappId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Cash App ID"
                      >
                        {copiedMethod === 'Cash App' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Venmo</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Venmo', invoice.freelancerSettings?.venmoId?.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + (invoice.freelancerSettings?.venmoId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Venmo ID"
                      >
                        {copiedMethod === 'Venmo' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Google Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Google Pay', invoice.freelancerSettings?.googlePayUpi || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Google Pay UPI"
                      >
                        {copiedMethod === 'Google Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Apple Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Apple Pay', invoice.freelancerSettings?.applePayId || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Apple Pay ID"
                      >
                        {copiedMethod === 'Apple Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
                      </div>
                      <button
                        onClick={() => {
                          const bankDetails = [
                            invoice.freelancerSettings?.bankAccount,
                            invoice.freelancerSettings?.bankIfscSwift && `IFSC/SWIFT: ${invoice.freelancerSettings.bankIfscSwift}`,
                            invoice.freelancerSettings?.bankIban && `IBAN: ${invoice.freelancerSettings.bankIban}`
                          ].filter(Boolean).join('\n')
                          handleCopyPaymentMethod('Bank Transfer', bankDetails)
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy bank details"
                      >
                        {copiedMethod === 'Bank Transfer' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
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
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Credit/Debit Card</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Stripe', invoice.freelancerSettings?.stripeAccount || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment info"
                      >
                        {copiedMethod === 'Stripe' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Other Methods</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Other Methods', invoice.freelancerSettings?.paymentNotes || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment notes"
                      >
                        {copiedMethod === 'Other Methods' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-words leading-relaxed">{invoice.freelancerSettings.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Notes
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
            </div>
          )}
        </div>

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
  )
}

// Minimal Template (Template 6) - Copy of 60-second invoice with Dynamic Colors
function MinimalTemplate({ invoice, primaryColor, secondaryColor, accentColor, getAmountColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string, accentColor: string, getAmountColor: () => string }) {
  const invoiceCurrency = invoice.currency || 'USD'
  const formatCurrencyAmount = (amount: number) => {
    return formatCurrencyForCards(amount, invoiceCurrency)
  }
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null)

  const handleCopyPaymentMethod = async (methodType: string, details: string) => {
    try {
      await navigator.clipboard.writeText(details)
      setCopiedMethod(methodType)
      setTimeout(() => setCopiedMethod(null), 2000)

      // Log the copy event - only if viewer is NOT the owner
      // CRITICAL: Do not track activities for paid invoices (privacy and legal compliance)
      if (invoice.id && invoice.status !== 'paid') {
        try {
          // Check if the viewer is authenticated
          const { data: { session } } = await supabase.auth.getSession()
          
          // Check URL parameters for owner flag (works in incognito mode)
          const urlParams = new URLSearchParams(window.location.search)
          const isOwnerView = urlParams.get('owner') === 'true'
          
          // If user is authenticated and owns the invoice, don't log
          if (session?.user && invoice.userId && session.user.id === invoice.userId) {
            // Owner copying their own payment method - don't log as customer action
            return
          }
          
          // If URL has owner=true parameter, don't log (owner viewing in incognito)
          if (isOwnerView) {
            return
          }
          
          // Log as customer action (either not authenticated or not the owner)
          await fetch('/api/invoices/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoice.id,
              type: 'payment_method_copied',
              metadata: { paymentMethod: methodType }
            })
          })
        } catch (error) {
          console.error('Failed to log payment method copy event:', error)
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200">
        {/* Header */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1 w-full sm:w-auto">
              {/* Modern Logo Display */}
              {invoice.freelancerSettings?.logo && (
                <div className="mb-4" style={{ paddingLeft: 0, marginLeft: 0, lineHeight: 0 }}>
                  <div className="relative" style={{ marginLeft: 0, paddingLeft: 0, lineHeight: 0, display: 'inline-block' }}>
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="max-w-[112px] sm:max-w-[128px] h-auto"
                      style={{ 
                        display: 'block', 
                        margin: 0, 
                        padding: 0, 
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        verticalAlign: 'top',
                        lineHeight: 0,
                        maxHeight: '112px'
                      }}
                      onError={(e) => {
                        // Fallback to business name initial if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold" style="color: ${primaryColor || '#1F2937'}">${(invoice.freelancerSettings?.businessName || 'B').charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="text-lg sm:text-xl font-normal mb-1" style={{ color: primaryColor || '#1F2937', letterSpacing: 0, paddingLeft: 0, marginLeft: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1" style={{ paddingLeft: 0, marginLeft: 0 }}>{invoice.freelancerSettings.email}</div>
              )}
              
              {/* Payment Overdue Notice - Status Banner Style */}
              {invoice.isOverdue && (
                <div className="mt-4 px-4 py-3 bg-red-50 border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Payment Overdue</p>
                      <p className="text-xs text-red-700 mt-0.5">This invoice is {invoice.daysOverdue} days past due. Please remit payment immediately to avoid additional charges.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right flex-1 w-full sm:w-auto sm:pl-6">
              <div className="text-lg sm:text-xl font-normal mb-3" style={{ color: primaryColor || '#1F2937', letterSpacing: 0 }}>
                INVOICE
              </div>
              <div className="text-sm font-bold text-black mb-2">#{invoice.invoiceNumber}</div>
              <div className="text-xs text-gray-500 mb-1">
                Issue: {new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: getAmountColor(), letterSpacing: '-0.5px' }}>
                {formatCurrencyAmount(invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || invoice.total) : invoice.total))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: {formatCurrencyAmount(invoice.totalPaid)} • Remaining: {formatCurrencyAmount(invoice.remainingBalance)}
                </div>
              )}
              {/* Status Badge */}
              <div className="mt-3 flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status === 'due today' ? 'Due Today' : invoice.status}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance && invoice.remainingBalance > 0 && invoice.status !== 'paid' && (
                  <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-blue-700 bg-blue-100">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="whitespace-nowrap">Partial Paid</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Bill To */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="text-sm font-normal mb-4" style={{ color: primaryColor || '#1F2937' }}>
              Bill To
            </div>
            <div className="text-sm" style={{ color: primaryColor || '#000000' }}>{invoice.clientName}</div>
            {invoice.clientCompany && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientCompany}</div>
            )}
            {invoice.clientEmail && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientEmail}</div>
            )}
            {invoice.clientPhone && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientPhone}</div>
            )}
            {invoice.clientAddress && (
              <div className="text-sm text-gray-600 mt-1">{invoice.clientAddress}</div>
            )}
          </div>

          {/* Items */}
          {invoice.items.length > 0 && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal mb-4" style={{ color: primaryColor || '#1F2937' }}>
                Items
              </div>
              {/* Table Header - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-4 mb-3 pb-2 border-b border-gray-200">
                <div className="col-span-5 text-xs font-medium text-gray-600">Description</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Qty</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Rate</div>
                <div className="col-span-3 text-xs font-medium text-gray-600 text-right">Amount</div>
              </div>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index}>
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-1">
                      <div className="text-sm text-black font-medium">{item.description}</div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Qty: {(item.qty || 1).toFixed(2)}</span>
                        <span>Rate: {formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</span>
                        <span className="text-black font-medium">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</span>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 text-sm">
                      <div className="col-span-5 text-black">{item.description}</div>
                      <div className="col-span-2 text-black text-right">{(item.qty || 1).toFixed(2)}</div>
                      <div className="col-span-2 text-black text-right">{formatCurrencyAmount(typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate || 0)))}</div>
                      <div className="col-span-3 text-black text-right">{formatCurrencyAmount(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary - Right-aligned for professional invoice layout */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 lg:w-2/5 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.subtotal)}</span>
                </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                  <span className="text-black">-{formatCurrencyAmount(invoice.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                  <span className="text-black">{formatCurrencyAmount(invoice.taxAmount || 0)}</span>
                  </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">Total</span>
                  <span className="font-bold text-black">{formatCurrencyAmount(invoice.total)}</span>
                </div>
                {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                      <span className="text-emerald-600">-{formatCurrencyAmount(invoice.totalPaid)}</span>
                    </div>
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                        <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-black">
                        {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                      </span>
                      <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`}>
                        {formatCurrencyAmount(invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)) : invoice.remainingBalance)}
                      </span>
                    </div>
                  </>
                )}
                {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <>
                    <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                      <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                      <span className="text-red-600">{formatCurrencyAmount(invoice.lateFees)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                      <span className="font-bold text-red-600">Total Payable</span>
                      <span className="font-bold text-red-600">{formatCurrencyAmount(invoice.totalWithLateFees)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {invoice.status === 'paid' && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-200">
              <div className="px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Payment Received</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Thank you! This invoice has been paid in full.</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Payment Information */}
          {invoice.freelancerSettings && invoice.status !== 'paid' && (
            <div className="mb-8 pb-8">
              <div className="text-sm font-semibold text-gray-900 mb-5" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-5 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods - Grid Layout: 2 columns on desktop, 1 column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">PayPal</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('PayPal', invoice.freelancerSettings?.paypalEmail || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy PayPal email"
                      >
                        {copiedMethod === 'PayPal' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Cash App</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Cash App', invoice.freelancerSettings?.cashappId?.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + (invoice.freelancerSettings?.cashappId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Cash App ID"
                      >
                        {copiedMethod === 'Cash App' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Venmo</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Venmo', invoice.freelancerSettings?.venmoId?.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + (invoice.freelancerSettings?.venmoId || ''))}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Venmo ID"
                      >
                        {copiedMethod === 'Venmo' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Google Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Google Pay', invoice.freelancerSettings?.googlePayUpi || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Google Pay UPI"
                      >
                        {copiedMethod === 'Google Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Apple Pay</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Apple Pay', invoice.freelancerSettings?.applePayId || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy Apple Pay ID"
                      >
                        {copiedMethod === 'Apple Pay' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-all leading-relaxed">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
                      </div>
                      <button
                        onClick={() => {
                          const bankDetails = [
                            invoice.freelancerSettings?.bankAccount,
                            invoice.freelancerSettings?.bankIfscSwift && `IFSC/SWIFT: ${invoice.freelancerSettings.bankIfscSwift}`,
                            invoice.freelancerSettings?.bankIban && `IBAN: ${invoice.freelancerSettings.bankIban}`
                          ].filter(Boolean).join('\n')
                          handleCopyPaymentMethod('Bank Transfer', bankDetails)
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy bank details"
                      >
                        {copiedMethod === 'Bank Transfer' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
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
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Credit/Debit Card</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Stripe', invoice.freelancerSettings?.stripeAccount || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment info"
                      >
                        {copiedMethod === 'Stripe' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="py-3 px-0 hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Other Methods</span>
                      </div>
                      <button
                        onClick={() => handleCopyPaymentMethod('Other Methods', invoice.freelancerSettings?.paymentNotes || '')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy payment notes"
                      >
                        {copiedMethod === 'Other Methods' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 break-words leading-relaxed">{invoice.freelancerSettings.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: primaryColor || '#1F2937' }}>
                Notes
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
            </div>
          )}
        </div>

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
  )
}

