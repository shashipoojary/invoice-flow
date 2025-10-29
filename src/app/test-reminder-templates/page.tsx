'use client'

import { useState, useCallback } from 'react'
import { Clock, Mail, AlertTriangle, CheckCircle } from 'lucide-react'

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
  items: Array<{
    id: string
    description: string
    rate: number
    amount: number
  }>
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
  publicToken: string
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

const mockInvoice: Invoice = {
  id: '1',
  invoiceNumber: 'INV-2024-001',
  issueDate: '2024-01-15',
  dueDate: '2024-01-30',
  clientName: 'John Smith',
  clientEmail: 'john.smith@example.com',
  clientCompany: 'Acme Corporation',
  clientPhone: '+1 (555) 123-4567',
  clientAddress: '123 Business St, Suite 100, New York, NY 10001',
  items: [
    {
      id: '1',
      description: 'Web Development Services',
      rate: 150,
      amount: 1500
    },
    {
      id: '2',
      description: 'UI/UX Design',
      rate: 100,
      amount: 800
    }
  ],
  subtotal: 2300,
  discount: 0,
  taxAmount: 184,
  total: 2484,
  lateFees: 0,
  totalWithLateFees: 2484,
  status: 'overdue',
  isOverdue: true,
  daysOverdue: 5,
  notes: 'Thank you for your business!',
  publicToken: 'p17PMK8llr8Im3pdcntdum94MY58HAhJJZlo3F1UN0w%3D',
  freelancerSettings: {
    businessName: 'Your Business Name',
    logo: '',
    address: '123 Business Ave, Suite 200, City, State 12345',
    email: 'billing@yourbusiness.com',
    phone: '+1 (555) 987-6543',
    paypalEmail: 'payments@yourbusiness.com',
    cashappId: '$yourbusiness',
    venmoId: '@yourbusiness',
    googlePayUpi: 'yourbusiness@upi',
    applePayId: 'yourbusiness@apple',
    bankAccount: '****1234',
    bankIfscSwift: 'CHASUS33XXX',
    bankIban: 'US64SVBKUS6S3300958879',
    stripeAccount: 'acct_1234567890',
    paymentNotes: 'Please include invoice number with payment'
  }
}

// Dynamic payment methods based on user settings
const getPaymentMethods = (freelancerSettings: any) => {
  const methods = []
  
  if (freelancerSettings.paypalEmail) {
    methods.push({
      name: 'PayPal',
      details: freelancerSettings.paypalEmail,
      icon: '💳'
    })
  }
  
  if (freelancerSettings.cashappId) {
    methods.push({
      name: 'Cash App',
      details: freelancerSettings.cashappId,
      icon: '💰'
    })
  }
  
  if (freelancerSettings.venmoId) {
    methods.push({
      name: 'Venmo',
      details: freelancerSettings.venmoId,
      icon: '📱'
    })
  }
  
  if (freelancerSettings.googlePayUpi) {
    methods.push({
      name: 'Google Pay',
      details: freelancerSettings.googlePayUpi,
      icon: '📲'
    })
  }
  
  if (freelancerSettings.applePayId) {
    methods.push({
      name: 'Apple Pay',
      details: freelancerSettings.applePayId,
      icon: '🍎'
    })
  }
  
  if (freelancerSettings.bankAccount) {
    methods.push({
      name: 'Bank Transfer',
      details: `Account: ${freelancerSettings.bankAccount}`,
      icon: '🏦'
    })
  }
  
  return methods
}

const mockBusinessSettings = {
  businessName: 'Your Business Name',
  logo: '',
  tagline: 'Professional Services',
  email: 'billing@yourbusiness.com',
  phone: '+1 (555) 987-6543',
  address: '123 Business Ave, Suite 200, City, State 12345'
}

const reminderTypes = [
  {
    id: 'friendly',
    name: 'Payment Reminder',
    description: 'Professional reminder for due payments',
    icon: '📋',
    days: 1,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    id: 'polite',
    name: 'Payment Due Notice',
    description: 'Formal notice for outstanding payments',
    icon: '📄',
    days: 3,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    id: 'firm',
    name: 'Overdue Payment Notice',
    description: 'Professional follow-up for overdue accounts',
    icon: '⚠️',
    days: 7,
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  {
    id: 'urgent',
    name: 'Final Payment Notice',
    description: 'Final notice requiring immediate attention',
    icon: '🔔',
    days: 14,
    color: 'bg-red-50 border-red-200 text-red-800'
  }
]

// Modern Reminder Template (based on Modern invoice template)
const generateModernReminderTemplate = (
  invoice: Invoice,
  businessSettings: any,
  reminderType: string,
  overdueDays: number,
  getGreeting: () => string,
  getMessage: () => string,
  getClosing: () => string
) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #000000;
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
            background: #f8f9fa;
            padding: 48px 40px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 520px;
            margin: 0 auto;
          }
          .business-name {
            font-size: 28px;
            font-weight: 700;
            color: #000000;
            letter-spacing: -0.02em;
          }
          .reminder-details {
            text-align: right;
          }
          .reminder-type {
            font-size: 16px;
            color: #666666;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .amount {
            font-size: 32px;
            font-weight: 800;
            color: #000000;
            letter-spacing: -0.03em;
          }
          .content {
            padding: 48px 40px;
            background: #ffffff;
          }
          .invoice-details {
            background: #f8f9fa;
            padding: 32px;
            margin-bottom: 48px;
            border-radius: 8px;
            text-align: center;
          }
          .invoice-number {
            font-size: 20px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 12px;
          }
          .invoice-amount {
            font-size: 32px;
            font-weight: 800;
            color: #dc2626;
            margin-bottom: 12px;
          }
          .invoice-due {
            font-size: 16px;
            color: #666666;
            margin-bottom: 16px;
          }
          .overdue-notice {
            background: #fef2f2;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #fecaca;
          }
          .overdue-text {
            color: #dc2626;
            font-weight: 600;
            font-size: 16px;
            margin: 0;
            text-align: center;
            letter-spacing: -0.01em;
          }
          .message-section {
            background: #f8f9fa;
            padding: 32px;
            margin-bottom: 48px;
            border-radius: 8px;
          }
          .message-section p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #000000;
            line-height: 1.6;
            font-weight: 500;
          }
          .message-section p:last-child {
            margin-bottom: 0;
          }
          .cta-section {
            text-align: center;
            margin: 48px 0;
          }
          .cta-button {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            border-radius: 8px;
            transition: all 0.2s ease;
            letter-spacing: -0.01em;
          }
          .cta-button:hover {
            background: #262626;
            transform: translateY(-1px);
          }
          .contact-info {
            background: #f8f9fa;
            padding: 24px;
            margin: 32px 0;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          .contact-info p {
            margin: 0;
            font-size: 15px;
            color: #374151;
            line-height: 1.6;
            font-weight: 500;
          }
          .payment-methods {
            margin: 40px 0;
          }
          .payment-methods h3 {
            font-size: 16px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 16px;
            text-align: center;
          }
          .payment-notice {
            background: #f8f8f8;
            padding: 16px;
            margin-bottom: 24px;
            border-radius: 6px;
          }
          .payment-notice p {
            margin: 0;
            font-size: 14px;
            color: #000000;
            line-height: 1.5;
          }
          .payment-list {
            margin-bottom: 24px;
          }
          .payment-method-item {
            padding: 12px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .payment-method-item:last-child {
            border-bottom: none;
          }
          .payment-method-name {
            font-size: 12px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .payment-method-details {
            font-size: 13px;
            color: #666666;
            line-height: 1.4;
          }
          .footer {
            background: #f8f8f8;
            padding: 32px;
            text-align: center;
          }
          .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #000000;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          @media (max-width: 600px) {
            .header {
              padding: 32px 20px;
            }
            .header-content {
              flex-direction: column;
              gap: 20px;
              text-align: center;
            }
            .reminder-details {
              text-align: center;
            }
            .content {
              padding: 32px 24px;
            }
            .footer {
              padding: 24px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-name">${businessSettings.businessName}</div>
              <div class="reminder-details">
                <div class="reminder-type">Payment Reminder</div>
                <div class="amount">$${invoice.total.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="invoice-details">
              <h2 class="invoice-number">Invoice #${invoice.invoiceNumber}</h2>
              <div class="invoice-amount">$${invoice.total.toLocaleString()}</div>
              <p class="invoice-due">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              ${overdueDays > 0 ? `
                <div class="overdue-notice">
                  <p class="overdue-text">This invoice is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue</p>
                </div>
              ` : ''}
            </div>

            <div class="message-section">
              ${getGreeting()}
              ${getMessage()}
            </div>

            <div class="cta-section">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoice/${invoice.publicToken}" class="cta-button">
                View & Pay Invoice
              </a>
            </div>

            ${getPaymentMethods(invoice.freelancerSettings).length > 0 ? `
            <div class="payment-methods">
              <h3>Payment Methods</h3>
              <div class="payment-list">
                ${getPaymentMethods(invoice.freelancerSettings).map(method => `
                  <div class="payment-method-item">
                    <div class="payment-method-name">${method.name}</div>
                    <div class="payment-method-details">${method.details}</div>
                  </div>
                `).join('')}
              </div>
              ${invoice.freelancerSettings?.paymentNotes ? `
                <div class="payment-notice">
                  <p>${invoice.freelancerSettings?.paymentNotes}</p>
                </div>
              ` : ''}
            </div>
            ` : ''}

            <div class="contact-info">
              <p>Need assistance? Reply directly to this email.</p>
            </div>
          </div>

          <div class="footer">
            ${getClosing()}
            <p style="margin-top: 24px; font-size: 12px; color: #999999;">
              This is an automated reminder. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Creative Reminder Template (based on Creative invoice template)
const generateCreativeReminderTemplate = (
  invoice: Invoice,
  businessSettings: any,
  reminderType: string,
  overdueDays: number,
  getGreeting: () => string,
  getMessage: () => string,
  getClosing: () => string
) => {
  const primaryColor = '#8B5CF6';
  const secondaryColor = '#F59E0B';
  const accentColor = '#EC4899';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
            position: relative;
          }
          .email-container::before {
            content: '';
            position: absolute;
            top: -50px;
            right: -50px;
            width: 100px;
            height: 100px;
            background: ${primaryColor}15;
            border-radius: 50%;
            z-index: 0;
          }
          .email-container::after {
            content: '';
            position: absolute;
            bottom: -30px;
            left: -30px;
            width: 60px;
            height: 60px;
            background: ${secondaryColor}20;
            border-radius: 12px;
            transform: rotate(45deg);
            z-index: 0;
          }
          .header {
            background: ${primaryColor};
            padding: 40px 24px;
            color: white;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${secondaryColor};
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: ${accentColor};
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 500px;
            margin: 0 auto;
          }
          .business-name {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            flex: 1;
          }
          .reminder-details {
            text-align: right;
            flex: 1;
          }
          .reminder-type {
            font-size: 16px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .amount {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
            line-height: 1;
          }
          .content {
            padding: 32px 24px;
            position: relative;
            z-index: 1;
          }
          .content::before {
            content: '';
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: ${accentColor}10;
            border-radius: 8px;
            transform: rotate(15deg);
            z-index: 0;
          }
          .content::after {
            content: '';
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 30px;
            height: 30px;
            background: ${primaryColor}12;
            border-radius: 50%;
            z-index: 0;
          }
          .invoice-details {
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 32px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .invoice-number {
            font-size: 18px;
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 12px;
          }
          .invoice-amount {
            font-size: 32px;
            font-weight: 800;
            color: #dc2626;
            margin-bottom: 12px;
          }
          .invoice-due {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 16px;
          }
          .overdue-notice {
            background: #fef2f2;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #fecaca;
          }
          .overdue-text {
            color: #dc2626;
            font-weight: 600;
            font-size: 16px;
            margin: 0;
            text-align: center;
            letter-spacing: -0.01em;
          }
          .message-section {
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 32px;
            border: 1px solid #e2e8f0;
          }
          .message-section p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #1e293b;
            line-height: 1.6;
            font-weight: 500;
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
            background: ${primaryColor};
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            border-radius: 8px;
            transition: all 0.2s ease;
            letter-spacing: -0.01em;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .cta-button:hover {
            background: ${primaryColor}dd;
            transform: translateY(-1px);
          }
          .contact-info {
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            margin: 32px 0;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .contact-info p {
            margin: 0;
            font-size: 15px;
            color: #1e293b;
            line-height: 1.6;
            font-weight: 500;
          }
          .footer {
            background: #f8fafc;
            padding: 32px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #1e293b;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          @media (max-width: 600px) {
            .header {
              padding: 32px 20px;
            }
            .header-content {
              flex-direction: column;
              gap: 20px;
              text-align: center;
            }
            .reminder-details {
              text-align: center;
            }
            .content {
              padding: 24px 20px;
            }
            .footer {
              padding: 24px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-name">${businessSettings.businessName}</div>
              <div class="reminder-details">
                <div class="reminder-type">Payment Reminder</div>
                <div class="amount">$${invoice.total.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="invoice-details">
              <h2 class="invoice-number">Invoice #${invoice.invoiceNumber}</h2>
              <div class="invoice-amount">$${invoice.total.toLocaleString()}</div>
              <p class="invoice-due">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              ${overdueDays > 0 ? `
                <div class="overdue-notice">
                  <p class="overdue-text">This invoice is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue</p>
                </div>
              ` : ''}
            </div>

            <div class="message-section">
              ${getGreeting()}
              ${getMessage()}
            </div>

            <div class="cta-section">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoice/${invoice.publicToken}" class="cta-button">
                View & Pay Invoice
              </a>
            </div>

            ${getPaymentMethods(invoice.freelancerSettings).length > 0 ? `
            <div class="payment-methods">
              <h3>Payment Methods</h3>
              <div class="payment-list">
                ${getPaymentMethods(invoice.freelancerSettings).map(method => `
                  <div class="payment-method-item">
                    <div class="payment-method-name">${method.name}</div>
                    <div class="payment-method-details">${method.details}</div>
                  </div>
                `).join('')}
              </div>
              ${invoice.freelancerSettings?.paymentNotes ? `
                <div class="payment-notice">
                  <p>${invoice.freelancerSettings?.paymentNotes}</p>
                </div>
              ` : ''}
            </div>
            ` : ''}

            <div class="contact-info">
              <p>Need assistance? Reply directly to this email.</p>
            </div>
          </div>

          <div class="footer">
            ${getClosing()}
            <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
              This is an automated reminder. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default function TestReminderTemplates() {
  const [selectedType, setSelectedType] = useState('friendly')
  const [overdueDays, setOverdueDays] = useState(5)
  const [templateStyle, setTemplateStyle] = useState<'modern' | 'creative'>('modern')

  const getReminderEmailTemplate = useCallback((
    invoice: Invoice,
    businessSettings: any,
    reminderType: 'friendly' | 'polite' | 'firm' | 'urgent',
    overdueDays: number,
    templateStyle: 'modern' | 'creative' = 'modern'
  ) => {
  const getGreeting = () => {
    switch (reminderType) {
      case 'friendly':
        return `Dear ${invoice.clientName},`;
      case 'polite':
        return `Dear ${invoice.clientName},`;
      case 'firm':
        return `Dear ${invoice.clientName},`;
      case 'urgent':
        return `Dear ${invoice.clientName},`;
      default:
        return `Dear ${invoice.clientName},`;
    }
  };

  const getSubject = () => {
    switch (reminderType) {
      case 'friendly':
        return `Invoice #${invoice.invoiceNumber} - Payment Reminder`;
      case 'polite':
        return `Invoice #${invoice.invoiceNumber} - Payment Due`;
      case 'firm':
        return `Invoice #${invoice.invoiceNumber} - Overdue Payment Notice`;
      case 'urgent':
        return `Invoice #${invoice.invoiceNumber} - Final Payment Notice`;
      default:
        return `Invoice #${invoice.invoiceNumber} - Payment Reminder`;
    }
  };

  const getMessage = () => {
    switch (reminderType) {
      case 'friendly':
        return `
          <p>We hope this message finds you well. This is a gentle reminder that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong> is due.</p>
          <p>The payment was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. If you have already processed this payment, please disregard this message.</p>
          <p>We appreciate your prompt attention to this matter and are available to assist with any questions you may have.</p>
        `;
      case 'polite':
        return `
          <p>We are writing to remind you that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong> is now due.</p>
          <p>The payment was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. If you have already processed this payment, please accept our apologies for this reminder.</p>
          <p>Please remit payment at your earliest convenience or contact us if you have any questions regarding this invoice.</p>
        `;
      case 'firm':
        return `
          <p>We are following up on invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong>, which is now <strong>${overdueDays} days past due</strong>.</p>
          <p>The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. We understand that circumstances may arise, but we need to resolve this matter promptly to maintain our business relationship.</p>
          <p>Please remit payment immediately or contact us to discuss payment arrangements. We are committed to working with you to resolve this matter.</p>
        `;
      case 'urgent':
        return `
          <p><strong>FINAL NOTICE:</strong> Invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong> is now <strong>${overdueDays} days overdue</strong>.</p>
          <p>The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. This account requires immediate attention to avoid any impact on our business relationship.</p>
          <p>Payment is required immediately. Please remit payment today or contact us immediately to discuss this matter. We are committed to finding a resolution that works for both parties.</p>
        `;
      default:
        return `<p>This is a reminder about your outstanding invoice.</p>`;
    }
  };

  const getClosing = () => {
    switch (reminderType) {
      case 'friendly':
        return `
          <p>Thank you for your continued business and prompt attention to this matter.</p>
          <p>Best regards,<br>${businessSettings.businessName}</p>
        `;
      case 'polite':
        return `
          <p>Thank you for your attention to this matter.</p>
          <p>Best regards,<br>${businessSettings.businessName}</p>
        `;
      case 'firm':
        return `
          <p>We appreciate your immediate attention to this matter and look forward to resolving this promptly.</p>
          <p>Sincerely,<br>${businessSettings.businessName}</p>
        `;
      case 'urgent':
        return `
          <p>We appreciate your immediate attention to this matter and are committed to working with you to resolve this.</p>
          <p>Sincerely,<br>${businessSettings.businessName}</p>
        `;
      default:
        return `<p>Best regards,<br>${businessSettings.businessName}</p>`;
    }
  };

    // Generate template based on style
    if (templateStyle === 'creative') {
      return {
        subject: getSubject(),
        html: generateCreativeReminderTemplate(invoice, businessSettings, reminderType, overdueDays, getGreeting, getMessage, getClosing)
      };
    } else {
      return {
        subject: getSubject(),
        html: generateModernReminderTemplate(invoice, businessSettings, reminderType, overdueDays, getGreeting, getMessage, getClosing)
      };
    }
  }, []);

  const currentTemplate = getReminderEmailTemplate(
    mockInvoice,
    mockBusinessSettings,
    selectedType as 'friendly' | 'polite' | 'firm' | 'urgent',
    overdueDays,
    templateStyle
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Modern & Creative Reminder Templates
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Preview professional payment reminder emails with modern and creative designs 
            that match your invoice templates. Test different styles and reminder stages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Reminder Types
              </h2>
              
              <div className="space-y-4 mb-6">
                {reminderTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedType === type.id
                        ? type.color + ' border-opacity-100'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm opacity-75">{type.description}</div>
                        <div className="text-xs opacity-60">Day {type.days}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTemplateStyle('modern')}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        templateStyle === 'modern'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Modern
                    </button>
                    <button
                      onClick={() => setTemplateStyle('creative')}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        templateStyle === 'creative'
                          ? 'bg-purple-50 border-purple-200 text-purple-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Creative
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overdue Days
                  </label>
                  <input
                    type="number"
                    value={overdueDays}
                    onChange={(e) => setOverdueDays(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                    min="0"
                    max="30"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Email Subject</h3>
                  <p className="text-sm text-blue-800">{currentTemplate.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Email Preview
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>HTML Email Template</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-2">Email Subject:</div>
                  <div className="font-medium text-gray-900">{currentTemplate.subject}</div>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={currentTemplate.html}
                    className="w-full h-[600px] border-0"
                    title="Email Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Professional Reminder System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reminder Schedule</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Day 1: Payment Reminder</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <span>Day 3: Payment Due Notice</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>Day 7: Overdue Payment Notice</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-500" />
                  <span>Day 14: Final Payment Notice</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Professional Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Automated scheduling based on due dates</li>
                <li>• Professional business email templates</li>
                <li>• Direct payment links and invoice access</li>
                <li>• Customizable reminder intervals</li>
                <li>• Automatic stop when payment received</li>
                <li>• Maintains professional business relationships</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
