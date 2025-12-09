'use client'

import { useState } from 'react'

export default function TestEmailTemplate() {
  const [businessName, setBusinessName] = useState('Tech Physic')
  const [businessEmail, setBusinessEmail] = useState('hello@techphysic.com')
  const [businessPhone, setBusinessPhone] = useState('+1 (555) 123-4567')
  const [clientName, setClientName] = useState('shashi')
  const [invoiceNumber, setInvoiceNumber] = useState('INV-0008')
  const [total, setTotal] = useState('450.00')
  const [dueDate, setDueDate] = useState('30/9/2025')
  const [createdDate, setCreatedDate] = useState('28/9/2025')
  const [status, setStatus] = useState('Draft')
  const [notes, setNotes] = useState('Thank you for your business!')
  
  // Get base URL dynamically
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  };
  const baseUrl = getBaseUrl();
  
  // Payment methods
  const [paypalEmail, setPaypalEmail] = useState('payments@techphysic.com')
  const [cashappId, setCashappId] = useState('techphysic')
  const [venmoId, setVenmoId] = useState('techphysic')
  const [googlePayUpi, setGooglePayUpi] = useState('techphysic@upi')
  const [applePayId, setApplePayId] = useState('techphysic@apple')
  const [bankAccount, setBankAccount] = useState('Chase Bank Account Name: Tech Physic LLC')
  const [bankIfscSwift, setBankIfscSwift] = useState('CHASUS33XXX')
  const [bankIban, setBankIban] = useState('US64SVBKUS6S3300958879')
  const [stripeAccount, setStripeAccount] = useState('stripe@techphysic.com')
  const [paymentNotes, setPaymentNotes] = useState('Wire transfers, Zelle, and cryptocurrency payments also accepted. Contact us for details.')

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #202124;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            padding: 32px 24px 24px;
            border-bottom: 1px solid #e8eaed;
            background: #fafafa;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .business-info {
            flex: 1;
          }
          .business-name {
            font-size: 18px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 4px;
          }
          .business-details {
            font-size: 13px;
            color: #5f6368;
            line-height: 1.4;
          }
          .invoice-info {
            text-align: right;
            flex: 1;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 4px;
          }
          .invoice-number {
            font-size: 13px;
            color: #5f6368;
            margin-bottom: 8px;
          }
          .amount {
            font-size: 24px;
            font-weight: 600;
            color: #137333;
          }
          .content {
            padding: 32px 24px;
          }
          .details-section {
            margin-bottom: 32px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f1f3f4;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-size: 14px;
            color: #5f6368;
            font-weight: 400;
          }
          .detail-value {
            font-size: 14px;
            color: #202124;
            font-weight: 400;
          }
          .message-section {
            margin: 32px 0;
            padding: 24px 0;
          }
          .message-section p {
            margin-bottom: 16px;
            font-size: 14px;
            color: #202124;
            line-height: 1.6;
          }
          .message-section p:last-child {
            margin-bottom: 0;
          }
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          .cta-button {
            display: inline-block;
            background: #1a73e8;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 14px;
          }
          .payment-methods {
            margin: 32px 0;
            padding: 0;
          }
          .payment-methods h3 {
            font-size: 18px;
            font-weight: 600;
            color: #202124;
            margin-bottom: 16px;
          }
          .payment-notice {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #1a73e8;
          }
          .payment-notice p {
            margin: 0;
            font-size: 14px;
            color: #202124;
            line-height: 1.5;
          }
          .payment-list {
            margin-bottom: 20px;
          }
          .payment-item {
            margin-bottom: 16px;
            padding: 0;
          }
          .payment-method {
            font-size: 16px;
            font-weight: 600;
            color: #1a73e8;
            margin-bottom: 4px;
          }
          .payment-info {
            font-size: 14px;
            color: #5f6368;
            line-height: 1.4;
          }
          .payment-security {
            background: #f1f3f4;
            padding: 16px;
            border-radius: 4px;
            border: 1px solid #e8eaed;
          }
          .payment-security p {
            margin: 0;
            font-size: 14px;
            color: #5f6368;
            line-height: 1.4;
          }
          .footer {
            padding: 32px 24px;
            border-top: 1px solid #f1f3f4;
            text-align: center;
          }
          .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #5f6368;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          .business-info {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #f1f3f4;
          }
          .business-name {
            font-size: 16px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 4px;
          }
          .business-contact {
            color: #5f6368;
            font-size: 14px;
          }
          .invoiceflow-branding {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e8eaed;
            text-align: center;
          }
          .invoiceflow-disclaimer {
            font-size: 11px;
            color: #9aa0a6;
            line-height: 1.3;
            margin-bottom: 8px;
          }
          .invoiceflow-link {
            font-size: 11px;
            color: #5f6368;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .header {
              padding: 24px 16px;
            }
            .content {
              padding: 24px 16px;
            }
            .footer {
              padding: 24px 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name">${businessName}</div>
                <div class="business-details">
                  ${businessEmail}<br>
                  ${businessPhone}
                </div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title">Invoice</div>
                <div class="invoice-number">#${invoiceNumber}</div>
                <div class="amount">$${total}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="details-section">
              <div class="detail-row">
                <span class="detail-label">Client</span>
                <span class="detail-value">${clientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date</span>
                <span class="detail-value">${dueDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">${status}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Created</span>
                <span class="detail-value">${createdDate}</span>
              </div>
            </div>

            <div class="message-section">
              <p><strong>Hello ${clientName},</strong></p>
              <p>Please find attached your invoice #${invoiceNumber} for the amount of <strong>$${total}</strong>.</p>
              <p>Payment is due by <strong>${dueDate}</strong>.</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>

            <div class="cta-section">
              <a href="${baseUrl}/invoice/INV-0008" class="cta-button">
                View Invoice Online
              </a>
            </div>

            ${(paypalEmail || cashappId || venmoId || googlePayUpi || applePayId || bankAccount || stripeAccount || paymentNotes) ? `
            <div class="payment-methods">
              <h3>Payment Information</h3>
              <div class="payment-notice">
                <p>Please use one of the following payment methods to settle this invoice. All payments are processed securely.</p>
              </div>
              <div class="payment-list">
                ${paypalEmail ? `
                  <div class="payment-item">
                    <div class="payment-method">PayPal</div>
                    <div class="payment-info">Send payment to: ${paypalEmail}</div>
                  </div>
                ` : ''}
                ${cashappId ? `
                  <div class="payment-item">
                    <div class="payment-method">Cash App</div>
                    <div class="payment-info">Send to: ${cashappId.startsWith('$') ? cashappId : '$' + cashappId}</div>
                  </div>
                ` : ''}
                ${venmoId ? `
                  <div class="payment-item">
                    <div class="payment-method">Venmo</div>
                    <div class="payment-info">Send to: ${venmoId.startsWith('@') ? venmoId : '@' + venmoId}</div>
                  </div>
                ` : ''}
                ${googlePayUpi ? `
                  <div class="payment-item">
                    <div class="payment-method">Google Pay</div>
                    <div class="payment-info">UPI ID: ${googlePayUpi}</div>
                  </div>
                ` : ''}
                ${applePayId ? `
                  <div class="payment-item">
                    <div class="payment-method">Apple Pay</div>
                    <div class="payment-info">Send to: ${applePayId}</div>
                  </div>
                ` : ''}
                ${bankAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Bank Transfer</div>
                    <div class="payment-info">${bankAccount}${bankIfscSwift ? `<br>IFSC/SWIFT: ${bankIfscSwift}` : ''}${bankIban ? `<br>IBAN: ${bankIban}` : ''}</div>
                  </div>
                ` : ''}
                ${stripeAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Credit/Debit Card</div>
                    <div class="payment-info">Processed securely via Stripe</div>
                  </div>
                ` : ''}
                ${paymentNotes ? `
                  <div class="payment-item">
                    <div class="payment-method">Other Payment Methods</div>
                    <div class="payment-info">${paymentNotes}</div>
                  </div>
                ` : ''}
              </div>
              <div class="payment-security">
                <p><strong>Security:</strong> All payment methods are secure and encrypted. Please include invoice number #${invoiceNumber} in your payment reference.</p>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            <div class="business-info">
              <div class="business-name">${businessName}</div>
              <div class="business-contact">
                ${businessEmail}<br>
                ${businessPhone}
              </div>
            </div>
            
            <div class="invoiceflow-branding">
              <div class="invoiceflow-disclaimer">
                This invoice was generated using FlowInvoicer
              </div>
              <a href="${baseUrl}" class="invoiceflow-link">
                ${baseUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Template Preview</h1>
          <p className="text-gray-600">Quickly preview and test email template changes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Template Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  data-testid="business-name-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                <input
                  type="email"
                  data-testid="business-email-input"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input
                  type="text"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-3">Payment Methods</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cash App ID</label>
                    <input
                      type="text"
                      value={cashappId}
                      onChange={(e) => setCashappId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venmo ID</label>
                    <input
                      type="text"
                      value={venmoId}
                      onChange={(e) => setVenmoId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Pay UPI</label>
                    <input
                      type="text"
                      value={googlePayUpi}
                      onChange={(e) => setGooglePayUpi(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apple Pay ID</label>
                    <input
                      type="text"
                      value={applePayId}
                      onChange={(e) => setApplePayId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC/SWIFT</label>
                    <input
                      type="text"
                      value={bankIfscSwift}
                      onChange={(e) => setBankIfscSwift(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank IBAN</label>
                    <input
                      type="text"
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Account</label>
                    <input
                      type="text"
                      value={stripeAccount}
                      onChange={(e) => setStripeAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Notes</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={emailHtml}
                className="w-full h-[800px] border-0"
                title="Email Template Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
