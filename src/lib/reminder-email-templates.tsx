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

  // Calculate days until due (negative if overdue, positive if before due, 0 if due today)
  const calculateDaysUntilDue = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = calculateDaysUntilDue();
  const isBeforeDue = daysUntilDue > 0;
  const isDueOrOverdue = daysUntilDue <= 0;

  const getMessage = () => {
    // Before due date messages
    if (isBeforeDue) {
      switch (reminderType) {
        case 'friendly':
          return `
            <p>This is a reminder that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong> is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.</p>
            <p>The payment will be due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. Please process the payment at your earliest to avoid late fee charges. If you have already processed this payment, please disregard this message.</p>
            <p>If you have any questions regarding this invoice, please contact us.</p>
          `;
        case 'polite':
          return `
            <p>We are writing to remind you that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong> will be due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.</p>
            <p>The payment will be due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. Please process the payment at your earliest to avoid late fee charges. If you have already processed this payment, please accept our apologies for this reminder.</p>
            <p>Please remit payment at your earliest convenience or contact us if you have any questions regarding this invoice.</p>
          `;
        case 'firm':
          return `
            <p>We are following up on invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong>, which will be due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.</p>
            <p>The payment will be due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. Please process the payment at your earliest to avoid late fee charges.</p>
            <p>Please remit payment promptly or contact us to discuss payment arrangements.</p>
          `;
        case 'urgent':
          return `
            <p>This is an important notice regarding invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong>, which will be due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.</p>
            <p>The payment will be due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. Please process the payment at your earliest to avoid late fee charges.</p>
            <p>Payment should be processed before the due date. Please remit payment promptly or contact us to discuss this matter.</p>
          `;
        default:
          return `<p>This is a reminder about your upcoming invoice.</p>`;
      }
    }
    
    // Due or overdue messages (original logic)
    switch (reminderType) {
      case 'friendly':
        return `
          <p>This is a reminder that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong>${invoice.hasLateFees && invoice.lateFees > 0 ? ` (including late fee of $${(invoice.lateFees || 0).toLocaleString()})` : ''} is due.</p>
          <p>The payment was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. If you have already processed this payment, please disregard this message.</p>
          <p>If you have any questions regarding this invoice, please contact us.</p>
        `;
      case 'polite':
        return `
          <p>We are writing to remind you that payment for invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong>${invoice.hasLateFees && invoice.lateFees > 0 ? ` (including late fee of $${(invoice.lateFees || 0).toLocaleString()})` : ''} is now due.</p>
          <p>The payment was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. If you have already processed this payment, please accept our apologies for this reminder.</p>
          <p>Please remit payment at your earliest convenience or contact us if you have any questions regarding this invoice.</p>
        `;
      case 'firm':
        return `
          <p>We are following up on invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong>${invoice.hasLateFees && invoice.lateFees > 0 ? ` (including late fee of $${(invoice.lateFees || 0).toLocaleString()})` : ''}, which is now <strong>${overdueDays} days past due</strong>.</p>
          <p>The original due date was <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>. We understand that circumstances may arise, but we need to resolve this matter promptly.</p>
          <p>Please remit payment immediately or contact us to discuss payment arrangements.</p>
        `;
      case 'urgent':
        return `
          <p>This is an urgent notice regarding invoice <strong>#${invoice.invoiceNumber}</strong> in the amount of <strong>$${(invoice.total || 0).toLocaleString()}</strong>${invoice.hasLateFees && invoice.lateFees > 0 ? ` (including late fee of $${(invoice.lateFees || 0).toLocaleString()})` : ''}, which is now <strong>${overdueDays} days overdue</strong>.</p>
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

  // Determine tone color based on reminder type
  const getToneColor = () => {
    switch (reminderType) {
      case 'friendly':
        return '#3B82F6'; // Blue
      case 'polite':
        return '#10B981'; // Green
      case 'firm':
        return '#F59E0B'; // Amber
      case 'urgent':
        return '#EF4444'; // Red
      default:
        return '#1F2937'; // Dark gray
    }
  };

  const toneColor = getToneColor();
  const primaryColor = '#1F2937';

  return {
    subject: getSubject(),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>Payment Reminder</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px 0;
          }
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .email-container {
              background: #ffffff !important;
              border-color: #e0e0e0 !important;
            }
            .header {
              background: #ffffff !important;
              border-color: #e0e0e0 !important;
            }
            .content {
              background: #ffffff !important;
            }
            .business-name,
            .reminder-title {
              color: ${primaryColor} !important;
            }
            .invoice-number,
            .message {
              color: #000000 !important;
            }
            .amount {
              color: ${toneColor} !important;
            }
            .business-details,
            .invoice-date-label {
              color: #808080 !important;
            }
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e0e0e0;
          }
          .header {
            padding: 40px 40px 32px 40px;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
          }
          .header-content {
            display: table;
            width: 100%;
            table-layout: fixed;
          }
          .business-info {
            display: table-cell;
            vertical-align: top;
            width: 50%;
          }
          .business-name {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            margin: 0;
            padding: 0;
            letter-spacing: 0;
          }
          .business-details {
            font-size: 14px;
            color: #808080 !important;
            line-height: 1.5;
            margin: 4px 0;
          }
          .reminder-info {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 50%;
            padding-left: 24px;
          }
          .reminder-title {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            margin: 0 0 12px 0;
            padding: 0;
            letter-spacing: 0;
          }
          .invoice-number {
            font-size: 14px;
            color: #000000 !important;
            margin: 0 0 12px 0;
            font-weight: 700;
          }
          .invoice-date-label {
            font-size: 12px;
            color: #808080 !important;
            margin: 0 0 4px 0;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: ${toneColor} !important;
            letter-spacing: -0.5px;
            margin: 16px 0 0 0;
          }
          .content {
            padding: 32px 40px 40px 40px;
            background: #ffffff;
          }
          .message-section {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e0e0e0;
          }
          .message {
            font-size: 14px !important;
            color: #000000 !important;
            line-height: 1.6 !important;
            margin: 16px 0 !important;
          }
          .message p {
            margin: 0 0 16px 0;
          }
          .overdue-notice {
            background-color: #fef2f2;
            border-left: 4px solid #EF4444;
            padding: 12px 16px;
            margin: 16px 0;
          }
          .overdue-text {
            color: #dc2626;
            font-weight: 500;
            font-size: 14px;
            margin: 0;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .payment-button {
            display: inline-block !important;
            background-color: ${toneColor} !important;
            color: #ffffff !important;
            text-decoration: none !important;
            padding: 14px 32px !important;
            font-weight: 500 !important;
            text-align: center !important;
            font-size: 14px !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .payment-button span {
            color: #ffffff !important;
          }
          /* Gmail desktop fix - force white text */
          u + .body .payment-button {
            color: #ffffff !important;
          }
          /* Gmail desktop link color fix */
          .payment-button,
          .payment-button:link,
          .payment-button:visited,
          .payment-button:hover,
          .payment-button:active {
            color: #ffffff !important;
          }
          /* Force white text on all child elements */
          .payment-button * {
            color: #ffffff !important;
          }
          /* Gmail specific fix */
          [class~="payment-button"] {
            color: #ffffff !important;
          }
          [class~="payment-button"] * {
            color: #ffffff !important;
          }
          .contact-info {
            margin: 24px 0;
            padding-top: 24px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 14px;
            color: #666666;
          }
          .footer p {
            margin: 0 0 8px 0;
          }
          .footer-note {
            margin-top: 24px;
            font-size: 12px;
            color: #999999;
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px 0;
            }
            .header {
              padding: 30px 20px 24px 20px;
            }
            .content {
              padding: 24px 20px 32px 20px;
            }
            .header-content {
              display: block;
            }
            .business-info,
            .reminder-info {
              display: block;
              width: 100%;
              text-align: left;
              padding-left: 0;
            }
            .reminder-info {
              margin-top: 16px;
            }
            .amount {
              font-size: 28px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name">${businessSettings.businessName || 'Business'}</div>
                ${businessSettings.email ? `<div class="business-details">${businessSettings.email}</div>` : ''}
                ${businessSettings.phone ? `<div class="business-details">${businessSettings.phone}</div>` : ''}
              </div>
              <div class="reminder-info">
                <div class="reminder-title">PAYMENT REMINDER</div>
                <div class="invoice-number">#${invoice.invoiceNumber}</div>
                <div class="invoice-date-label">Due: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div class="amount">$${(invoice.total || 0).toLocaleString()}</div>
                ${invoice.hasLateFees && invoice.lateFees > 0 ? `
                  <div style="font-size: 12px; color: #808080; margin-top: 4px;">
                    Base: $${(invoice.baseTotal || invoice.total || 0).toLocaleString()} • Late Fee: $${(invoice.lateFees || 0).toLocaleString()}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="content">
            ${overdueDays > 0 ? `
              <div class="overdue-notice">
                <p class="overdue-text">This invoice is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue</p>
              </div>
            ` : ''}

            ${invoice.hasLateFees && invoice.lateFees > 0 ? `
              <div style="background-color: #fef2f2; border-left: 4px solid #EF4444; padding: 12px 16px; margin: 16px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #1F2937; font-size: 14px; font-weight: 500;">Invoice Amount:</span>
                  <span style="color: #1F2937; font-size: 14px; font-weight: 500;">$${(invoice.baseTotal || ((invoice.total || 0) - (invoice.lateFees || 0))).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #dc2626; font-size: 14px; font-weight: 500;">Late Fee:</span>
                  <span style="color: #dc2626; font-size: 14px; font-weight: 500;">$${(invoice.lateFees || 0).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #fecaca;">
                  <span style="color: #1F2937; font-size: 16px; font-weight: 700;">Total Due:</span>
                  <span style="color: #1F2937; font-size: 16px; font-weight: 700;">$${(invoice.total || 0).toLocaleString()}</span>
                </div>
              </div>
            ` : ''}

            <div class="message-section">
              <div class="message">
                ${getGreeting()}
                ${getMessage()}
              </div>
            </div>

            <div class="button-container">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${appBaseUrl}/invoice/${invoice.publicToken}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="0%" stroke="f" fillcolor="${toneColor}">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;font-size:14px;font-weight:500;">View &amp; Pay Invoice</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${appBaseUrl}/invoice/${invoice.publicToken}" class="payment-button" style="display: inline-block; background-color: ${toneColor} !important; color: #ffffff !important; text-decoration: none !important; padding: 14px 32px !important; font-weight: 500 !important; text-align: center !important; font-size: 14px !important; border: none !important; border-radius: 0 !important; mso-hide: all;">
                <span style="color: #ffffff !important;">View &amp; Pay Invoice</span>
              </a>
              <!--<![endif]-->
            </div>

            <div class="contact-info">
              <p><strong>Questions?</strong> Reply to this email or contact us:</p>
              ${businessSettings.email ? `<p>Email: ${businessSettings.email}</p>` : ''}
              ${businessSettings.phone ? `<p>Phone: ${businessSettings.phone}</p>` : ''}
            </div>

            <div class="footer">
              ${getClosing()}
              <p class="footer-note">
                This is an automated reminder. Please do not reply to this email.
              </p>
            </div>
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
