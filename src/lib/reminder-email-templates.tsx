import React from 'react';

// Auto Reminder Email Templates
export const getReminderEmailTemplate = (
  invoice: any,
  businessSettings: any,
  reminderType: 'friendly' | 'polite' | 'firm' | 'urgent',
  overdueDays: number,
  baseUrl?: string
) => {
  // Get base URL - use provided baseUrl, or fallback to environment variables
  const getBaseUrl = () => {
    if (baseUrl) return baseUrl;
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    // In production, return empty string to prevent broken links
    if (process.env.NODE_ENV === 'production') return '';
    // Development fallback only
    return 'http://localhost:3000';
  };
  const appBaseUrl = getBaseUrl();
  const getGreeting = () => {
    switch (reminderType) {
      case 'friendly':
        return `Dear ${invoice.client.name},`;
      case 'polite':
        return `Dear ${invoice.client.name},`;
      case 'firm':
        return `Dear ${invoice.client.name},`;
      case 'urgent':
        return `Dear ${invoice.client.name},`;
      default:
        return `Dear ${invoice.client.name},`;
    }
  };

  const getSubject = () => {
    switch (reminderType) {
      case 'friendly':
        return `Payment Reminder - Invoice #${invoice.invoiceNumber}`;
      case 'polite':
        return `Payment Reminder - Invoice #${invoice.invoiceNumber}`;
      case 'firm':
        return `Overdue Payment Notice - Invoice #${invoice.invoiceNumber}`;
      case 'urgent':
        return `Urgent: Payment Required - Invoice #${invoice.invoiceNumber}`;
      default:
        return `Payment Reminder - Invoice #${invoice.invoiceNumber}`;
    }
  };

  const getMessage = () => {
    switch (reminderType) {
      case 'friendly':
        return `
          <p>This is a reminder that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong> is due.</p>
          <p>The payment was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. If you have already processed this payment, please disregard this message.</p>
          <p>If you have any questions regarding this invoice, please contact us.</p>
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
          <p>The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. We understand that circumstances may arise, but we need to resolve this matter promptly.</p>
          <p>Please remit payment immediately or contact us to discuss payment arrangements.</p>
        `;
      case 'urgent':
        return `
          <p>This is an urgent notice regarding invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong>, which is now <strong>${overdueDays} days overdue</strong>.</p>
          <p>The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. This account requires immediate attention.</p>
          <p>Payment is required immediately. Please remit payment today or contact us to discuss this matter.</p>
        `;
      default:
        return `<p>This is a reminder about your outstanding invoice.</p>`;
    }
  };

  const getClosing = () => {
    switch (reminderType) {
      case 'friendly':
        return `
          <p>Thank you for your prompt attention to this matter.</p>
          <p>Best regards,<br>${businessSettings.businessName}</p>
        `;
      case 'polite':
        return `
          <p>Thank you for your attention to this matter.</p>
          <p>Best regards,<br>${businessSettings.businessName}</p>
        `;
      case 'firm':
        return `
          <p>We appreciate your immediate attention to this matter.</p>
          <p>Sincerely,<br>${businessSettings.businessName}</p>
        `;
      case 'urgent':
        return `
          <p>This matter requires immediate attention.</p>
          <p>Sincerely,<br>${businessSettings.businessName}</p>
        `;
      default:
        return `<p>Best regards,<br>${businessSettings.businessName}</p>`;
    }
  };

  return {
    subject: getSubject(),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            border: 1px solid #e5e7eb;
          }
          .header {
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 16px;
          }
          .business-name {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }
          .business-tagline {
            color: #6b7280;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
          .invoice-details {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
          }
          .invoice-number {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
          }
          .invoice-amount {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
          }
          .invoice-due {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
          }
          .overdue-notice {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 4px;
            padding: 12px;
            margin: 16px 0;
          }
          .overdue-text {
            color: #dc2626;
            font-weight: 500;
            font-size: 14px;
            margin: 0;
          }
          .payment-button {
            display: inline-block;
            background-color: #1f2937;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 500;
            text-align: center;
            margin: 20px 0;
            font-size: 14px;
          }
          .payment-button:hover {
            background-color: #111827;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .contact-info {
            margin: 24px 0;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.8;
          }
          .message {
            color: #374151;
            font-size: 15px;
            line-height: 1.6;
            margin: 24px 0;
          }
          .message p {
            margin: 0 0 16px 0;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .container {
              padding: 20px;
            }
            .invoice-amount {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${businessSettings.logo ? `<img src="${businessSettings.logo}" alt="${businessSettings.businessName}" class="logo">` : ''}
            <h1 class="business-name">${businessSettings.businessName}</h1>
            ${businessSettings.tagline ? `<p class="business-tagline">${businessSettings.tagline}</p>` : ''}
          </div>

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

          <div class="message">
            ${getGreeting()}
            ${getMessage()}
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${appBaseUrl}/invoice/${invoice.publicToken}" class="payment-button">
              View & Pay Invoice
            </a>
          </div>

          <div class="contact-info">
            <p><strong>Questions?</strong> Reply to this email or contact us:</p>
            <p>Email: ${businessSettings.email || 'contact@company.com'}</p>
            ${businessSettings.phone ? `<p>Phone: ${businessSettings.phone}</p>` : ''}
          </div>

          <div class="footer">
            ${getClosing()}
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
              This is an automated reminder. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Reminder schedule configuration
export const getReminderSchedule = () => {
  return [
    {
      days: 1,
      type: 'friendly' as const,
      name: 'Friendly Reminder',
      description: 'A gentle, friendly reminder sent 1 day after due date'
    },
    {
      days: 3,
      type: 'polite' as const,
      name: 'Polite Reminder',
      description: 'A polite but firm reminder sent 3 days after due date'
    },
    {
      days: 7,
      type: 'firm' as const,
      name: 'Firm Reminder',
      description: 'A firm reminder sent 1 week after due date'
    },
    {
      days: 14,
      type: 'urgent' as const,
      name: 'Urgent Reminder',
      description: 'An urgent final notice sent 2 weeks after due date'
    }
  ];
};
