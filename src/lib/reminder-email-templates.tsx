import React from 'react';

// Auto Reminder Email Templates
export const getReminderEmailTemplate = (
  invoice: any,
  businessSettings: any,
  reminderType: 'friendly' | 'polite' | 'firm' | 'urgent',
  overdueDays: number
) => {
  const getGreeting = () => {
    switch (reminderType) {
      case 'friendly':
        return `Hi ${invoice.client.name}! 👋`;
      case 'polite':
        return `Dear ${invoice.client.name},`;
      case 'firm':
        return `Hello ${invoice.client.name},`;
      case 'urgent':
        return `${invoice.client.name},`;
      default:
        return `Hi ${invoice.client.name}!`;
    }
  };

  const getSubject = () => {
    switch (reminderType) {
      case 'friendly':
        return `Just a friendly reminder about invoice #${invoice.invoiceNumber}`;
      case 'polite':
        return `Payment reminder for invoice #${invoice.invoiceNumber}`;
      case 'firm':
        return `Overdue payment notice - Invoice #${invoice.invoiceNumber}`;
      case 'urgent':
        return `URGENT: Payment required - Invoice #${invoice.invoiceNumber}`;
      default:
        return `Payment reminder for invoice #${invoice.invoiceNumber}`;
    }
  };

  const getMessage = () => {
    switch (reminderType) {
      case 'friendly':
        return `
          <p>I hope you're doing well! I wanted to send a quick reminder about invoice <strong>#${invoice.invoiceNumber}</strong> for <strong>$${invoice.total.toLocaleString()}</strong>.</p>
          <p>I know how busy things can get, so I thought I'd reach out in case this slipped through the cracks. If you've already sent the payment, please disregard this message!</p>
          <p>If you have any questions or need to discuss payment arrangements, please don't hesitate to reach out.</p>
        `;
      case 'polite':
        return `
          <p>I hope this message finds you well. I'm writing to remind you about the outstanding payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong>.</p>
          <p>The payment was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. If you've already processed this payment, please accept our apologies for this reminder.</p>
          <p>Please let us know if you have any questions or if there's anything we can do to assist you.</p>
        `;
      case 'firm':
        return `
          <p>This is a reminder that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong> is now <strong>${overdueDays} days overdue</strong>.</p>
          <p>The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. We understand that sometimes payments can be delayed, but we need to resolve this matter promptly.</p>
          <p>Please remit payment immediately or contact us to discuss payment arrangements.</p>
        `;
      case 'urgent':
        return `
          <p><strong>URGENT NOTICE:</strong> Payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${invoice.total.toLocaleString()}</strong> is now <strong>${overdueDays} days overdue</strong>.</p>
          <p>This account is seriously past due. The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>.</p>
          <p>Payment is required immediately to avoid further collection action. Please remit payment today or contact us immediately to discuss this matter.</p>
        `;
      default:
        return `<p>This is a reminder about your outstanding invoice.</p>`;
    }
  };

  const getClosing = () => {
    switch (reminderType) {
      case 'friendly':
        return `
          <p>Thanks so much for your business!</p>
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
          <p>${businessSettings.businessName}</p>
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
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 16px;
          }
          .business-name {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
          }
          .business-tagline {
            color: #6b7280;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
          .invoice-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
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
            font-size: 28px;
            font-weight: 700;
            color: #dc2626;
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
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            text-align: center;
          }
          .overdue-text {
            color: #dc2626;
            font-weight: 600;
            font-size: 14px;
            margin: 0;
          }
          .payment-button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .payment-button:hover {
            background-color: #2563eb;
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
            margin: 16px 0;
            color: #6b7280;
            font-size: 14px;
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
                <p class="overdue-text">⚠️ This invoice is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue</p>
              </div>
            ` : ''}
          </div>

          <div class="message">
            ${getGreeting()}
            ${getMessage()}
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.publicToken}" class="payment-button">
              View & Pay Invoice
            </a>
          </div>

          <div class="contact-info">
            <p><strong>Questions?</strong> Reply to this email or contact us:</p>
            <p>📧 ${businessSettings.email || 'contact@company.com'}</p>
            ${businessSettings.phone ? `<p>📞 ${businessSettings.phone}</p>` : ''}
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
