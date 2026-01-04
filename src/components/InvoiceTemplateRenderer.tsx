'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, Clock, AlertCircle, Mail, MapPin, Building2, CreditCard, Smartphone, DollarSign, Shield, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface InvoiceItem {
  id: string
  description: string
  rate: number
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
  const primaryColor = '#0D9488'   // Teal (only for amount)
  const secondaryColor = '#3B82F6' // Blue
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

  const calculateTotal = () => {
    // Fast Invoice: No tax, discount, or late fees - just subtotal
    return invoice.subtotal || calculateSubtotal()
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
                <div className="mb-4">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="w-full h-full object-contain"
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
              <div className="text-lg sm:text-xl font-normal text-gray-900 mb-1" style={{ color: '#1F2937', letterSpacing: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.email}</div>
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
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: primaryColor || '#0D9488', letterSpacing: '-0.5px' }}>
                ${invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2))
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || calculateTotal()).toFixed(2) : calculateTotal().toFixed(2))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: ${invoice.totalPaid.toFixed(2)} • Remaining: ${invoice.remainingBalance.toFixed(2)}
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
                    <span className="whitespace-nowrap">Partial Payment</span>
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
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <div className="text-black flex-1">{item.description}</div>
                    <div className="text-black text-right ml-4" style={{ minWidth: '100px' }}>
                      ${typeof item.amount === 'number' ? item.amount.toFixed(2) : parseFloat(String(item.amount || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary - Fast Invoice: No discount, tax, or late fees */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-black">Total</span>
              <span className="font-bold text-black" style={{ color: primaryColor }}>
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                  <span className="text-emerald-600">-${invoice.totalPaid.toFixed(2)}</span>
                </div>
                {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                    <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                  </span>
                  <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`} style={invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? {} : { color: primaryColor }}>
                    ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                  <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-red-600">Total Payable</span>
                  <span className="font-bold text-red-600">${invoice.totalWithLateFees.toFixed(2)}</span>
                </div>
              </>
            )}
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
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-6 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 [&>div:last-child]:border-b-0">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">PayPal</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Cash App</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Venmo</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Google Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Apple Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
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
                    <div className="text-sm text-gray-600 space-y-1">
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
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Other Methods</span>
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
                    <p className="text-sm text-gray-600 break-words">{invoice.freelancerSettings.paymentNotes}</p>
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
function ModernTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
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
                <div className="mb-4">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="w-full h-full object-contain"
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
              <div className="text-lg sm:text-xl font-normal mb-1" style={{ color: primaryColor || '#1F2937', letterSpacing: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.email}</div>
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
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: primaryColor || '#FF6B35', letterSpacing: '-0.5px' }}>
                ${invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2))
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || invoice.total).toFixed(2) : invoice.total.toFixed(2))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: ${invoice.totalPaid.toFixed(2)} • Remaining: ${invoice.remainingBalance.toFixed(2)}
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
                    <span className="whitespace-nowrap">Partial Payment</span>
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
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <div className="text-black flex-1">{item.description}</div>
                    <div className="text-black text-right ml-4" style={{ minWidth: '100px' }}>
                      ${typeof item.amount === 'number' ? item.amount.toFixed(2) : parseFloat(String(item.amount || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
              <span className="text-black">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                <span className="text-black">-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                <span className="text-black">${invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
              <span className="font-bold text-black">Total</span>
              <span className="font-bold text-black">${invoice.total.toFixed(2)}</span>
            </div>
            {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                  <span className="text-emerald-600">-${invoice.totalPaid.toFixed(2)}</span>
                </div>
                {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                    <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                  </span>
                  <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`}>
                    ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                  <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-red-600">Total Payable</span>
                  <span className="font-bold text-red-600">${invoice.totalWithLateFees.toFixed(2)}</span>
                </div>
              </>
            )}
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
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-6 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 [&>div:last-child]:border-b-0">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">PayPal</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Cash App</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Venmo</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Google Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Apple Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
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
                    <div className="text-sm text-gray-600 space-y-1">
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
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Other Methods</span>
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
                    <p className="text-sm text-gray-600 break-words">{invoice.freelancerSettings.paymentNotes}</p>
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
function CreativeTemplate({ invoice, primaryColor, secondaryColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string }) {
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
                <div className="mb-4">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="w-full h-full object-contain"
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
              <div className="text-lg sm:text-xl font-normal mb-1" style={{ color: primaryColor || '#1F2937', letterSpacing: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.email}</div>
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
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: primaryColor || '#FF6B35', letterSpacing: '-0.5px' }}>
                ${invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2))
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || invoice.total).toFixed(2) : invoice.total.toFixed(2))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: ${invoice.totalPaid.toFixed(2)} • Remaining: ${invoice.remainingBalance.toFixed(2)}
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
                    <span className="whitespace-nowrap">Partial Payment</span>
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
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <div className="text-black flex-1">{item.description}</div>
                    <div className="text-black text-right ml-4" style={{ minWidth: '100px' }}>
                      ${typeof item.amount === 'number' ? item.amount.toFixed(2) : parseFloat(String(item.amount || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
              <span className="text-black">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                <span className="text-black">-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                <span className="text-black">${invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
              <span className="font-bold text-black">Total</span>
              <span className="font-bold text-black">${invoice.total.toFixed(2)}</span>
            </div>
            {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                  <span className="text-emerald-600">-${invoice.totalPaid.toFixed(2)}</span>
                </div>
                {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                    <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                  </span>
                  <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`}>
                    ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                  <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-red-600">Total Payable</span>
                  <span className="font-bold text-red-600">${invoice.totalWithLateFees.toFixed(2)}</span>
                </div>
              </>
            )}
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
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-6 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 [&>div:last-child]:border-b-0">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">PayPal</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Cash App</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Venmo</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Google Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Apple Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
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
                    <div className="text-sm text-gray-600 space-y-1">
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
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Other Methods</span>
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
                    <p className="text-sm text-gray-600 break-words">{invoice.freelancerSettings.paymentNotes}</p>
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
function MinimalTemplate({ invoice, primaryColor, secondaryColor, accentColor }: { invoice: Invoice, primaryColor: string, secondaryColor: string, accentColor: string }) {
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
                <div className="mb-4">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <img
                      src={invoice.freelancerSettings.logo}
                      alt={invoice.freelancerSettings.businessName || 'Business Logo'}
                      className="w-full h-full object-contain"
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
              <div className="text-lg sm:text-xl font-normal mb-1" style={{ color: primaryColor || '#1F2937', letterSpacing: 0 }}>
                {invoice.freelancerSettings?.businessName || 'Business'}
              </div>
              {invoice.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.address}</div>
              )}
              {invoice.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.phone}</div>
              )}
              {invoice.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1">{invoice.freelancerSettings.email}</div>
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
              <div className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: primaryColor || '#FF6B35', letterSpacing: '-0.5px' }}>
                ${invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0
                  ? (invoice.isOverdue ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2))
                  : (invoice.isOverdue ? (invoice.totalWithLateFees || invoice.total).toFixed(2) : invoice.total.toFixed(2))}
              </div>
              {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Paid: ${invoice.totalPaid.toFixed(2)} • Remaining: ${invoice.remainingBalance.toFixed(2)}
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
                    <span className="whitespace-nowrap">Partial Payment</span>
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
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <div className="text-black flex-1">{item.description}</div>
                    <div className="text-black text-right ml-4" style={{ minWidth: '100px' }}>
                      ${typeof item.amount === 'number' ? item.amount.toFixed(2) : parseFloat(String(item.amount || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
              <span className="text-black">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                <span className="text-black">-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                <span className="text-black">${invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
              <span className="font-bold text-black">Total</span>
              <span className="font-bold text-black">${invoice.total.toFixed(2)}</span>
            </div>
            {invoice.totalPaid && invoice.totalPaid > 0 && invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-gray-900" style={{ color: '#1F2937' }}>Amount Paid</span>
                  <span className="text-emerald-600">-${invoice.totalPaid.toFixed(2)}</span>
                </div>
                {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                    <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-black">
                    {invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'Total Payable' : 'Remaining Balance'}
                  </span>
                  <span className={`font-bold ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? 'text-red-600' : 'text-black'}`}>
                    ${invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled ? ((invoice.remainingBalance || invoice.total) + (invoice.lateFees || 0)).toFixed(2) : invoice.remainingBalance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {(!invoice.totalPaid || invoice.totalPaid === 0 || !invoice.remainingBalance || invoice.remainingBalance === 0) && invoice.isOverdue && invoice.lateFees > 0 && invoice.lateFeesSettings && invoice.lateFeesSettings.enabled && (
              <>
                <div className="flex justify-between text-sm mb-2 pt-2 mt-2 border-t border-gray-200">
                  <span className="text-red-600">Late Fees ({invoice.daysOverdue} days)</span>
                  <span className="text-red-600">${invoice.lateFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
                  <span className="font-bold text-red-600">Total Payable</span>
                  <span className="font-bold text-red-600">${invoice.totalWithLateFees.toFixed(2)}</span>
                </div>
              </>
            )}
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
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Payment Information
              </div>
              
              {/* Security Message - Status Banner Style */}
              <div className="mb-6 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Secure Payment</p>
                    <p className="text-xs text-emerald-700 mt-0.5">All payment methods are secure and encrypted. Please include invoice number #{invoice.invoiceNumber} in your payment reference.</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 [&>div:last-child]:border-b-0">
                {/* PayPal */}
                {invoice.freelancerSettings.paypalEmail && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">PayPal</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.paypalEmail}</p>
                  </div>
                )}

                {/* Cash App */}
                {invoice.freelancerSettings.cashappId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Cash App</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.cashappId.startsWith('$') ? invoice.freelancerSettings.cashappId : '$' + invoice.freelancerSettings.cashappId}</p>
                  </div>
                )}

                {/* Venmo */}
                {invoice.freelancerSettings.venmoId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Venmo</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings.venmoId.startsWith('@') ? invoice.freelancerSettings.venmoId : '@' + invoice.freelancerSettings.venmoId}</p>
                  </div>
                )}

                {/* Google Pay */}
                {invoice.freelancerSettings.googlePayUpi && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Google Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.googlePayUpi}</p>
                  </div>
                )}

                {/* Apple Pay */}
                {invoice.freelancerSettings.applePayId && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Apple Pay</span>
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
                    <p className="text-sm text-gray-600 break-all">{invoice.freelancerSettings.applePayId}</p>
                  </div>
                )}

                {/* Bank Transfer */}
                {invoice.freelancerSettings.bankAccount && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
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
                    <div className="text-sm text-gray-600 space-y-1">
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
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
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
                    <p className="text-sm text-gray-600">{invoice.freelancerSettings?.stripeAccount}</p>
                  </div>
                )}

                {/* Other Payment Methods */}
                {invoice.freelancerSettings.paymentNotes && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Other Methods</span>
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
                    <p className="text-sm text-gray-600 break-words">{invoice.freelancerSettings.paymentNotes}</p>
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

