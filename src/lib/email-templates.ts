// Email templates for different invoice designs
// Clean, professional designs like Google/Wave

interface InvoiceData {
  invoice_number: string;
  total: number;
  due_date: string;
  issue_date: string;
  notes?: string;
  type?: string;
  clients: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  };
  invoice_items: Array<{
    description: string;
    line_total: number;
  }>;
  theme?: {
    template?: number;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  };
}

interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  address?: string;
  paypalEmail?: string;
  cashappId?: string;
  venmoId?: string;
  googlePayUpi?: string;
  applePayId?: string;
  bankAccount?: string;
  bankIfscSwift?: string;
  bankIban?: string;
  stripeAccount?: string;
  paymentNotes?: string;
}


// Minimal Email Template (Template 6 - Ultra-minimal clean design matching PDF)
export function generateMinimalEmailTemplate(
  invoice: InvoiceData,
  businessSettings: BusinessSettings,
  publicUrl: string
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract primary color from theme (default to dark gray for minimal)
  const primaryColor = invoice.theme?.primary_color || '#1F2937';
  
  // Convert hex to RGB for subtle line color
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 31, g: 41, b: 55 };
  };
  const rgb = hexToRgb(primaryColor);
  const subtleLineColor = `rgb(${Math.round(rgb.r * 0.6)}, ${Math.round(rgb.g * 0.6)}, ${Math.round(rgb.b * 0.6)})`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
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
          /* Dark mode support - ensure readability */
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
            .footer {
              background: #ffffff !important;
              border-color: #e0e0e0 !important;
            }
            /* Force light colors for readability in dark mode email clients */
            .business-name,
            .invoice-title,
            .bill-to-label,
            .detail-label,
            .payment-methods h3,
            .payment-method-name {
              color: ${primaryColor} !important;
            }
            .invoice-number,
            .bill-to-content {
              color: #000000 !important;
            }
            .amount {
              color: #FF6B35 !important;
            }
            .business-details,
            .invoice-date-label,
            .invoice-due-label,
            .bill-to-detail,
            .message-section p,
            .payment-notice p,
            .payment-method-details,
            .payment-security p,
            .footer p,
            .business-contact,
            .invoiceflow-disclaimer,
            .invoiceflow-link {
              color: #333333 !important;
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
          .invoice-info {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 50%;
            padding-left: 24px;
          }
          .invoice-title {
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
          .invoice-due-label {
            font-size: 12px;
            color: #808080 !important;
            margin: 8px 0 0 0;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #FF6B35 !important;
            letter-spacing: -0.5px;
            margin: 16px 0 0 0;
          }
          .content {
            padding: 32px 40px 40px 40px;
            background: #ffffff;
          }
          .bill-to-section {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e0e0e0;
          }
          .bill-to-line {
            height: 1px;
            background: ${subtleLineColor};
            margin-bottom: 20px;
            width: 280px;
          }
          .bill-to-label {
            font-size: 14px !important;
            font-weight: 400 !important;
            color: ${primaryColor} !important;
            margin: 0 0 16px 0 !important;
          }
          .bill-to-content {
            font-size: 14px !important;
            color: #000000 !important;
            line-height: 1.6 !important;
            margin: 4px 0 !important;
          }
          .bill-to-detail {
            font-size: 14px !important;
            color: #666666 !important;
            line-height: 1.6 !important;
            margin: 4px 0 !important;
          }
          .invoice-details-section {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e0e0e0;
          }
          .detail-row {
            display: table;
            width: 100%;
            margin-bottom: 12px;
          }
          .detail-label {
            font-size: 14px;
            color: ${primaryColor} !important;
            font-weight: 400;
            display: table-cell;
            padding-right: 16px;
            vertical-align: top;
          }
          .detail-value {
            font-size: 14px;
            color: #000000 !important;
            font-weight: 400;
            display: table-cell;
            vertical-align: top;
          }
          .message-section {
            margin: 32px 0;
            padding: 16px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .message-section p {
            margin: 0 0 12px 0 !important;
            font-size: 14px !important;
            color: #000000 !important;
            line-height: 1.6 !important;
          }
          .message-section p:last-child {
            margin-bottom: 0 !important;
          }
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          .cta-button {
            display: inline-block;
            background: ${primaryColor};
            color: #ffffff !important;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 0;
            font-weight: 400;
            font-size: 14px;
            margin: 0;
            text-align: center;
            letter-spacing: 0.5px;
            border: none;
          }
          .payment-methods {
            margin: 32px 0;
            width: 100%;
            box-sizing: border-box;
          }
          .payment-methods h3 {
            font-size: 14px;
            font-weight: 400;
            color: ${primaryColor} !important;
            margin-bottom: 16px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-notice {
            background: #f8f8f8;
            padding: 16px;
            margin-bottom: 24px;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            width: 100%;
            box-sizing: border-box;
            text-align: left;
          }
          .payment-notice p {
            margin: 0;
            font-size: 14px;
            color: #000000 !important;
            line-height: 1.6;
            font-weight: 400;
          }
          .payment-list {
            margin-bottom: 20px;
            width: 100%;
            box-sizing: border-box;
          }
          .payment-methods {
            border-top: 1px solid #e0e0e0;
            padding-top: 24px;
            margin-top: 32px;
          }
          .payment-method-item {
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
          }
          .payment-method-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .payment-method-name {
            font-size: 12px;
            font-weight: 400;
            color: ${primaryColor} !important;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-method-details {
            font-size: 14px;
            color: #000000 !important;
            line-height: 1.6;
          }
          .payment-security {
            background: #f8f8f8;
            padding: 16px;
            text-align: left;
            margin-top: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
          }
          .payment-security p {
            margin: 0;
            font-size: 14px;
            color: #000000 !important;
            line-height: 1.6;
            font-weight: 400;
          }
          .footer {
            padding: 32px 40px;
            border-top: 1px solid #e0e0e0;
            text-align: left;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
          }
          .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #808080 !important;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          .business-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
            color: #808080 !important;
            font-size: 14px;
            font-weight: 400;
          }
          .invoiceflow-branding {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
            text-align: left;
          }
          .invoiceflow-disclaimer {
            font-size: 8px;
            color: #808080 !important;
            line-height: 1.4;
            margin-bottom: 4px;
          }
          .invoiceflow-link {
            font-size: 8px;
            color: #808080 !important;
            text-decoration: none;
          }
          @media only screen and (max-width: 600px) {
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            .email-container {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
            }
            .header {
              padding: 32px 20px !important;
            }
            .header-content {
              display: table !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            .business-info {
              display: table-cell !important;
              vertical-align: top !important;
              width: 50% !important;
            }
            .business-name {
              font-size: 18px !important;
            }
            .invoice-info {
              display: table-cell !important;
              vertical-align: top !important;
              text-align: right !important;
              width: 50% !important;
              padding-left: 12px !important;
            }
            .invoice-title {
              font-size: 18px !important;
            }
            .invoice-number {
              font-size: 9px !important;
            }
            .invoice-date-label,
            .invoice-due-label {
              font-size: 7px !important;
            }
            .amount {
              font-size: 28px !important;
            }
            .content {
              padding: 0 20px 32px 20px !important;
            }
            .bill-to-line {
              width: 240px !important;
            }
            .business-details {
              font-size: 14px !important;
            }
            .invoice-number {
              font-size: 14px !important;
            }
            .invoice-date-label {
              font-size: 12px !important;
            }
            .invoice-due-label {
              font-size: 12px !important;
            }
            .bill-to-label {
              font-size: 14px !important;
            }
            .bill-to-content {
              font-size: 14px !important;
            }
            .bill-to-detail {
              font-size: 14px !important;
            }
            .message-section {
              margin: 24px 0 !important;
            }
            .message-section p {
              font-size: 14px !important;
            }
            .cta-button {
              padding: 8px 16px !important;
              font-size: 14px !important;
            }
            .payment-methods {
              margin: 24px 0 !important;
            }
            .payment-methods h3 {
              font-size: 14px !important;
            }
            .payment-notice {
              background: #f8f8f8 !important;
              padding: 16px !important;
              margin-bottom: 24px !important;
              border: 1px solid #e5e5e5 !important;
              border-radius: 4px !important;
              text-align: left !important;
            }
            .payment-notice p {
              font-size: 14px !important;
              color: #000000 !important;
              line-height: 1.6 !important;
            }
            .payment-security {
              background: #f8f8f8 !important;
              padding: 16px !important;
              text-align: left !important;
              margin-top: 20px !important;
              border: 1px solid #e5e5e5 !important;
              border-radius: 4px !important;
            }
            .payment-method-name {
              font-size: 12px !important;
            }
            .payment-method-details {
              font-size: 14px !important;
              color: #000000 !important;
              line-height: 1.6 !important;
            }
            .payment-security p {
              font-size: 14px !important;
              color: #000000 !important;
              line-height: 1.6 !important;
            }
            .footer {
              padding: 24px 20px !important;
            }
            .footer p {
              font-size: 14px !important;
            }
            .business-contact {
              font-size: 14px !important;
            }
            .invoiceflow-disclaimer {
              font-size: 7px !important;
            }
            .invoiceflow-link {
              font-size: 7px !important;
            }
          }
          @media only screen and (max-width: 480px) {
            .header {
              padding: 24px 16px !important;
            }
            .content {
              padding: 0 16px 24px 16px !important;
            }
            .footer {
              padding: 20px 16px !important;
            }
            .business-name {
              font-size: 18px !important;
            }
            .invoice-title {
              font-size: 16px !important;
            }
            .amount {
              font-size: 24px !important;
            }
            .bill-to-line {
              width: 200px !important;
            }
            .cta-button {
              padding: 8px 14px !important;
              font-size: 14px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name" style="color: ${primaryColor} !important; font-size: 20px; font-weight: 400; letter-spacing: 0; margin: 0; padding: 0;">${businessSettings.businessName}</div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title" style="color: ${primaryColor} !important; font-size: 20px; font-weight: 400; letter-spacing: 0; margin: 0 0 12px 0; padding: 0;">INVOICE</div>
                <div class="invoice-number" style="color: #000000 !important; font-size: 10px; font-weight: 700; margin: 0 0 8px 0;">#${invoice.invoice_number}</div>
                <div class="invoice-date-label" style="color: #808080 !important; font-size: 8px; margin: 0 0 4px 0;">Issue: ${formatDate(invoice.issue_date)}</div>
                <div class="invoice-due-label" style="color: #808080 !important; font-size: 8px; margin: 8px 0 0 0;">Due: ${formatDate(invoice.due_date)}</div>
                <div class="amount" style="color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;"><!--[if mso]><span style="color:#FF6B35;"><![endif]--><span style="color:#FF6B35;">${formatCurrency(invoice.total)}</span><!--[if mso]></span><![endif]--></div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="bill-to-section">
              <div class="bill-to-line" style="height: 1px; background: ${subtleLineColor}; margin-bottom: 20px; width: 280px;"></div>
              <div class="bill-to-label" style="color: ${primaryColor} !important; font-size: 14px !important; font-weight: 400 !important; margin: 0 0 16px 0 !important;">Bill To</div>
              <div class="bill-to-content" style="color: #000000 !important; font-size: 14px !important; line-height: 1.6 !important; margin: 4px 0 !important;">${invoice.clients.name}</div>
              ${invoice.clients.company ? `<div class="bill-to-detail" style="color: #666666 !important; font-size: 14px !important; line-height: 1.6 !important; margin: 4px 0 !important;">${invoice.clients.company}</div>` : ''}
              ${invoice.clients.email ? `<div class="bill-to-detail" style="color: #666666 !important; font-size: 14px !important; line-height: 1.6 !important; margin: 4px 0 !important;">${invoice.clients.email}</div>` : ''}
              ${invoice.clients.phone ? `<div class="bill-to-detail" style="color: #666666 !important; font-size: 14px !important; line-height: 1.6 !important; margin: 4px 0 !important;">${invoice.clients.phone}</div>` : ''}
            </div>

            <div class="message-section">
              <p style="margin: 0 0 12px 0 !important; font-size: 14px !important; color: #000000 !important; line-height: 1.6 !important;">Please find attached your invoice for the services provided.</p>
              ${invoice.notes ? `<p style="margin: 0 !important; font-size: 14px !important; color: #000000 !important; line-height: 1.6 !important;">${invoice.notes}</p>` : ''}
            </div>

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button" style="background: ${primaryColor} !important; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 0; font-weight: 400; font-size: 10px; letter-spacing: 0.5px;">
                View Invoice Online
              </a>
            </div>

            ${(businessSettings.paypalEmail || businessSettings.cashappId || businessSettings.venmoId || businessSettings.googlePayUpi || businessSettings.applePayId || businessSettings.bankAccount || businessSettings.stripeAccount || businessSettings.paymentNotes) ? `
            <div class="payment-methods">
              <h3>Payment Methods</h3>
              <div class="payment-notice">
                <p>Please use one of the following payment methods to settle this invoice. All payments are processed securely.</p>
              </div>
              <div class="payment-list">
                ${businessSettings.paypalEmail ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">PAYPAL</div>
                    <div class="payment-method-details">Send payment to: ${businessSettings.paypalEmail}</div>
                  </div>
                ` : ''}
                ${businessSettings.cashappId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">CASH APP</div>
                    <div class="payment-method-details">Send to: ${businessSettings.cashappId.startsWith('$') ? businessSettings.cashappId : '$' + businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">VENMO</div>
                    <div class="payment-method-details">Send to: ${businessSettings.venmoId.startsWith('@') ? businessSettings.venmoId : '@' + businessSettings.venmoId}</div>
                  </div>
                ` : ''}
                ${businessSettings.googlePayUpi ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">GOOGLE PAY</div>
                    <div class="payment-method-details">UPI ID: ${businessSettings.googlePayUpi}</div>
                  </div>
                ` : ''}
                ${businessSettings.applePayId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">APPLE PAY</div>
                    <div class="payment-method-details">Send to: ${businessSettings.applePayId}</div>
                  </div>
                ` : ''}
                ${businessSettings.bankAccount ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">BANK TRANSFER</div>
                    <div class="payment-method-details">
                      Bank: ${businessSettings.bankAccount}
                      ${businessSettings.bankIfscSwift ? `<br>IFSC/SWIFT: ${businessSettings.bankIfscSwift}` : ''}
                      ${businessSettings.bankIban ? `<br>IBAN: ${businessSettings.bankIban}` : ''}
                    </div>
                  </div>
                ` : ''}
                ${businessSettings.stripeAccount ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">CREDIT/DEBIT CARD</div>
                    <div class="payment-method-details">Processed securely via Stripe</div>
                  </div>
                ` : ''}
                ${businessSettings.paymentNotes ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">OTHER</div>
                    <div class="payment-method-details">${businessSettings.paymentNotes}</div>
                  </div>
                ` : ''}
              </div>

              <div class="payment-security">
                <p>Security: All payment methods are secure and encrypted. Please include invoice number <strong>#${invoice.invoice_number}</strong> in your payment reference.</p>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <div class="business-contact">
              ${businessSettings.businessName}<br>
              ${businessSettings.businessEmail}${businessSettings.businessPhone ? ` • ${businessSettings.businessPhone}` : ''}
            </div>

            <div class="invoiceflow-branding">
              <div class="invoiceflow-disclaimer">
                This invoice was created and sent using FlowInvoicer
              </div>
              <a href="https://invoiceflow.com" class="invoiceflow-link">
                Powered by FlowInvoicer
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Modern Email Template (Template 4 - Modern Design)
export function generateModernEmailTemplate(
  invoice: InvoiceData,
  businessSettings: BusinessSettings,
  publicUrl: string
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract primary color from theme (default to dark gray for consistency with minimal)
  const primaryColor = invoice.theme?.primary_color || '#1F2937';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
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
            border: 1px solid #e0e0e0;
          }
          .header {
            background: #f8f9fa;
            padding: 48px 40px;
            border-bottom: 1px solid #e0e0e0;
          }
          .header-content {
            display: table;
            width: 100%;
            max-width: 520px;
            margin: 0 auto;
            table-layout: fixed;
          }
          .business-name {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            letter-spacing: 0;
            margin: 0;
            padding: 0;
          }
          .business-info {
            display: table-cell;
            vertical-align: top;
            width: 50%;
          }
          .invoice-info {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 50%;
            padding-left: 24px;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            letter-spacing: 0;
            margin: 0 0 12px 0;
            padding: 0;
          }
          .invoice-number {
            font-size: 10px;
            color: #000000 !important;
            margin: 0 0 8px 0;
            font-weight: 700;
          }
          .invoice-date-label {
            font-size: 8px;
            color: #808080 !important;
            margin: 0 0 4px 0;
          }
          .invoice-due-label {
            font-size: 8px;
            color: #808080 !important;
            margin: 8px 0 0 0;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #FF6B35;
            letter-spacing: -0.5px;
            margin: 16px 0 0 0;
          }
          .content {
            padding: 48px 40px;
            background: #ffffff;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            margin-bottom: 48px;
          }
          .detail-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #333333 !important;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0 0 16px 0;
          }
          .detail-section p {
            font-size: 14px;
            color: #000000;
            line-height: 1.6;
            margin: 0;
            font-weight: 500;
          }
          /* Add spacing between Bill To and Invoice Details sections for desktop Gmail */
          .details-grid .detail-section:first-child p {
            margin-bottom: 32px !important;
            padding-bottom: 0 !important;
          }
          @media only screen and (max-width: 600px) {
            .details-grid .detail-section:first-child p {
              margin-bottom: 0 !important;
            }
          }
          .message-section {
            background: #f8f9fa;
            padding: 32px;
            margin-bottom: 48px;
            border-radius: 6px;
          }
          .message-section p {
            margin: 0 0 16px 0;
            font-size: 14px;
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
            background: #000000 !important;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            letter-spacing: -0.01em;
          }
          .cta-button:hover {
            background: #262626 !important;
            color: #ffffff !important;
            transform: translateY(-1px);
          }
          .payment-methods {
            margin: 40px 0;
          }
          .payment-methods h3 {
            font-size: 10px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 16px;
            text-align: center;
          }
          .payment-notice {
            background: #f8f8f8;
            padding: 16px;
            margin-bottom: 24px;
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
            font-size: 14px;
            color: #333333 !important;
            line-height: 1.4;
          }
          .payment-security {
            background: #f8f8f8;
            padding: 16px;
            text-align: center;
          }
          .payment-security p {
            margin: 0;
            font-size: 14px;
            color: #333333 !important;
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
          .business-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
            color: #333333 !important;
            font-size: 9px;
          }
          .invoiceflow-branding {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
          }
          .invoiceflow-disclaimer {
            font-size: 8px;
            color: #999999;
            line-height: 1.3;
            margin-bottom: 4px;
          }
          .invoiceflow-link {
            font-size: 8px;
            color: #333333 !important;
            text-decoration: none;
          }
          /* Dark mode support - ensure readability on dark backgrounds */
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
            .message-section {
              background: #ffffff !important;
            }
            .footer {
              background: #ffffff !important;
              border-color: #e0e0e0 !important;
            }
            /* Ensure text is readable on dark backgrounds */
            .business-name,
            .invoice-title,
            .invoice-number,
            .amount {
              color: #FF6B35 !important;
            }
            .detail-section h3,
            .detail-section p,
            .message-section p,
            .payment-methods h3,
            .payment-method-name,
            .payment-notice p,
            .payment-method-details,
            .payment-security p,
            .footer p {
              color: #000000 !important;
            }
            .invoice-title,
            .invoice-number,
            .detail-section h3 {
              color: #333333 !important;
            }
            .business-contact,
            .invoiceflow-link {
              color: #333333 !important;
            }
          }
          @media only screen and (max-width: 600px) {
            .header {
              padding: 32px 20px !important;
            }
            .header-content {
              display: table !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            .business-info {
              display: table-cell !important;
              vertical-align: top !important;
              width: 50% !important;
            }
            .business-name {
              font-size: 18px !important;
            }
            .invoice-info {
              display: table-cell !important;
              vertical-align: top !important;
              text-align: right !important;
              width: 50% !important;
              padding-left: 12px !important;
            }
            .invoice-title {
              font-size: 18px !important;
            }
            .invoice-number {
              font-size: 9px !important;
            }
            .invoice-date-label,
            .invoice-due-label {
              font-size: 7px !important;
            }
            .amount {
              font-size: 28px !important;
            }
            .invoice-number {
              font-size: 14px !important;
            }
            .invoice-date-label {
              font-size: 12px !important;
            }
            .invoice-due-label {
              font-size: 12px !important;
            }
            .content {
              padding: 32px 24px !important;
            }
            .details-grid {
              display: block !important;
              grid-template-columns: none !important;
              gap: 0 !important;
              margin-bottom: 32px !important;
            }
            .detail-section {
              display: block !important;
              margin-bottom: 40px !important;
              width: 100% !important;
            }
            .detail-section:first-child {
              margin-bottom: 40px !important;
            }
            .detail-section:last-child {
              margin-bottom: 0 !important;
            }
            .detail-section p {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .detail-section h3 {
              margin-top: 0 !important;
              margin-bottom: 16px !important;
              padding-top: 0 !important;
            }
            .footer {
              padding: 24px 20px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name" style="color: ${primaryColor} !important; font-size: 20px; font-weight: 400; letter-spacing: 0; margin: 0; padding: 0;">${businessSettings.businessName}</div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title" style="color: ${primaryColor} !important; font-size: 20px; font-weight: 400; letter-spacing: 0; margin: 0 0 12px 0; padding: 0;">INVOICE</div>
                <div class="invoice-number" style="color: #000000 !important; font-size: 10px; font-weight: 700; margin: 0 0 8px 0;">#${invoice.invoice_number}</div>
                <div class="invoice-date-label" style="color: #808080 !important; font-size: 8px; margin: 0 0 4px 0;">Issue: ${formatDate(invoice.issue_date)}</div>
                <div class="invoice-due-label" style="color: #808080 !important; font-size: 8px; margin: 8px 0 0 0;">Due: ${formatDate(invoice.due_date)}</div>
                <div class="amount" style="color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;"><!--[if mso]><span style="color:#FF6B35;"><![endif]--><span style="color:#FF6B35;">${formatCurrency(invoice.total)}</span><!--[if mso]></span><![endif]--></div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="details-grid">
              <div class="detail-section">
                <h3>Bill To</h3>
                <p style="margin-bottom: 32px !important;">
                  ${invoice.clients.name}<br>
                  ${invoice.clients.company ? `${invoice.clients.company}<br>` : ''}
                  ${invoice.clients.email}
                </p>
              </div>
              <div class="detail-section">
                <h3>Invoice Details</h3>
                <p>
                  Issue Date: ${formatDate(invoice.issue_date)}<br>
                  Due Date: ${formatDate(invoice.due_date)}<br>
                  Status: Outstanding
                </p>
              </div>
            </div>

            <div class="message-section">
              <p>Thank you for your business. Please find your invoice details below.</p>
              ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
            </div>

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button">
                View Full Invoice
              </a>
            </div>

            ${(businessSettings.paypalEmail || businessSettings.cashappId || businessSettings.venmoId || businessSettings.googlePayUpi || businessSettings.applePayId || businessSettings.bankAccount || businessSettings.stripeAccount || businessSettings.paymentNotes) ? `
            <div class="payment-methods">
              <h3>Payment Methods</h3>
              <div class="payment-notice">
                <p>Please use one of the following payment methods to settle this invoice. All payments are processed securely.</p>
              </div>
              <div class="payment-list">
                ${businessSettings.paypalEmail ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">PAYPAL</div>
                    <div class="payment-method-details">Send payment to: ${businessSettings.paypalEmail}</div>
                  </div>
                ` : ''}
                ${businessSettings.cashappId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">CASH APP</div>
                    <div class="payment-method-details">Send to: ${businessSettings.cashappId.startsWith('$') ? businessSettings.cashappId : '$' + businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">VENMO</div>
                    <div class="payment-method-details">Send to: ${businessSettings.venmoId.startsWith('@') ? businessSettings.venmoId : '@' + businessSettings.venmoId}</div>
                  </div>
                ` : ''}
                ${businessSettings.googlePayUpi ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">GOOGLE PAY</div>
                    <div class="payment-method-details">UPI ID: ${businessSettings.googlePayUpi}</div>
                  </div>
                ` : ''}
                ${businessSettings.applePayId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">APPLE PAY</div>
                    <div class="payment-method-details">Send to: ${businessSettings.applePayId}</div>
                  </div>
                ` : ''}
                ${businessSettings.bankAccount ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">BANK TRANSFER</div>
                    <div class="payment-method-details">
                      Bank: ${businessSettings.bankAccount}
                      ${businessSettings.bankIfscSwift ? `<br>IFSC/SWIFT: ${businessSettings.bankIfscSwift}` : ''}
                      ${businessSettings.bankIban ? `<br>IBAN: ${businessSettings.bankIban}` : ''}
                    </div>
                  </div>
                ` : ''}
                ${businessSettings.stripeAccount ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">CREDIT/DEBIT CARD</div>
                    <div class="payment-method-details">Processed securely via Stripe</div>
                  </div>
                ` : ''}
                ${businessSettings.paymentNotes ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">OTHER</div>
                    <div class="payment-method-details">${businessSettings.paymentNotes}</div>
                  </div>
                ` : ''}
              </div>

              <div class="payment-security">
                <p>Security: All payment methods are secure and encrypted. Please include invoice number <strong>#${invoice.invoice_number}</strong> in your payment reference.</p>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="business-contact">
              ${businessSettings.businessName}<br>
              ${businessSettings.businessEmail}${businessSettings.businessPhone ? ` • ${businessSettings.businessPhone}` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Creative Email Template (Template 5 - Clean Minimal Design)
export function generateCreativeEmailTemplate(
  invoice: InvoiceData,
  businessSettings: BusinessSettings,
  publicUrl: string
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract colors from theme (use for accents only)
  const primaryColor = invoice.theme?.primary_color || '#8B5CF6';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
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
            border: 1px solid #e0e0e0;
          }
          .header {
            background: #f8f9fa;
            padding: 48px 40px;
            border-bottom: 1px solid #e0e0e0;
          }
          .header-content {
            display: table;
            width: 100%;
            max-width: 520px;
            margin: 0 auto;
            table-layout: fixed;
          }
          .business-name {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            letter-spacing: 0;
            margin: 0;
            padding: 0;
          }
          .business-info {
            display: table-cell;
            vertical-align: top;
            width: 50%;
          }
          .invoice-info {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 50%;
            padding-left: 24px;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            letter-spacing: 0;
            margin: 0 0 12px 0;
            padding: 0;
          }
          .invoice-number {
            font-size: 10px;
            color: #000000 !important;
            margin: 0 0 8px 0;
            font-weight: 700;
          }
          .invoice-date-label {
            font-size: 8px;
            color: #808080 !important;
            margin: 0 0 4px 0;
          }
          .invoice-due-label {
            font-size: 8px;
            color: #808080 !important;
            margin: 8px 0 0 0;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #FF6B35;
            letter-spacing: -0.5px;
            margin: 16px 0 0 0;
          }
          .content {
            padding: 48px 40px;
            background: #ffffff;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            margin-bottom: 48px;
          }
          .detail-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: ${primaryColor} !important;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0 0 16px 0;
          }
          .detail-section p {
            font-size: 14px;
            color: #000000;
            line-height: 1.6;
            margin: 0;
            font-weight: 500;
          }
          /* Add spacing between Bill To and Invoice Details sections for desktop Gmail */
          .details-grid .detail-section:first-child p {
            margin-bottom: 32px !important;
            padding-bottom: 0 !important;
          }
          @media only screen and (max-width: 600px) {
            .details-grid .detail-section:first-child p {
              margin-bottom: 0 !important;
            }
          }
          .message-section {
            background: #f8f9fa;
            padding: 32px;
            margin-bottom: 48px;
            border-radius: 6px;
          }
          .message-section p {
            margin: 0 0 16px 0;
            font-size: 14px;
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
            background: ${primaryColor} !important;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            letter-spacing: -0.01em;
          }
          .cta-button:hover {
            opacity: 0.9;
            color: #ffffff !important;
          }
          .payment-methods {
            margin: 40px 0;
          }
          .payment-methods h3 {
            font-size: 10px;
            font-weight: 600;
            color: ${primaryColor} !important;
            margin-bottom: 16px;
            text-align: center;
          }
          .payment-notice {
            background: #f8f8f8;
            padding: 16px;
            margin-bottom: 24px;
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
            color: ${primaryColor} !important;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .payment-method-details {
            font-size: 14px;
            color: #333333 !important;
            line-height: 1.4;
          }
          .payment-security {
            background: #f8f8f8;
            padding: 16px;
            text-align: center;
          }
          .payment-security p {
            margin: 0;
            font-size: 14px;
            color: #333333 !important;
            line-height: 1.4;
          }
          .footer {
            background: #f8f8f8;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
          }
          .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #000000;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          .business-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
            color: #333333 !important;
            font-size: 9px;
          }
          .invoiceflow-branding {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
          }
          .invoiceflow-disclaimer {
            font-size: 8px;
            color: #999999;
            line-height: 1.3;
            margin-bottom: 4px;
          }
          .invoiceflow-link {
            font-size: 8px;
            color: #333333 !important;
            text-decoration: none;
          }
          /* Dark mode support - ensure readability on dark backgrounds */
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
            .message-section {
              background: #ffffff !important;
            }
            .footer {
              background: #ffffff !important;
              border-color: #e0e0e0 !important;
            }
            /* Ensure text is readable on dark backgrounds */
            .business-name,
            .invoice-title,
            .invoice-number,
            .amount {
              color: #FF6B35 !important;
            }
            .detail-section h3,
            .detail-section p,
            .message-section p,
            .payment-methods h3,
            .payment-method-name,
            .payment-notice p,
            .payment-method-details,
            .payment-security p,
            .footer p {
              color: #000000 !important;
            }
            .invoice-title,
            .invoice-number,
            .detail-section h3 {
              color: #333333 !important;
            }
            .business-contact,
            .invoiceflow-link {
              color: #333333 !important;
            }
          }
          @media only screen and (max-width: 600px) {
            .header {
              padding: 32px 20px !important;
            }
            .header-content {
              display: table !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            .business-info {
              display: table-cell !important;
              vertical-align: top !important;
              width: 50% !important;
            }
            .business-name {
              font-size: 18px !important;
            }
            .invoice-info {
              display: table-cell !important;
              vertical-align: top !important;
              text-align: right !important;
              width: 50% !important;
              padding-left: 12px !important;
            }
            .invoice-title {
              font-size: 18px !important;
            }
            .invoice-number {
              font-size: 9px !important;
            }
            .invoice-date-label,
            .invoice-due-label {
              font-size: 7px !important;
            }
            .amount {
              font-size: 28px !important;
            }
            .invoice-number {
              font-size: 14px !important;
            }
            .invoice-date-label {
              font-size: 12px !important;
            }
            .invoice-due-label {
              font-size: 12px !important;
            }
            .content {
              padding: 32px 24px !important;
            }
            .details-grid {
              display: block !important;
              grid-template-columns: none !important;
              gap: 0 !important;
              margin-bottom: 32px !important;
            }
            .detail-section {
              display: block !important;
              margin-bottom: 40px !important;
              width: 100% !important;
            }
            .detail-section:first-child {
              margin-bottom: 40px !important;
            }
            .detail-section:last-child {
              margin-bottom: 0 !important;
            }
            .detail-section p {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .detail-section h3 {
              margin-top: 0 !important;
              margin-bottom: 16px !important;
              padding-top: 0 !important;
            }
            .footer {
              padding: 24px 20px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name" style="color: ${primaryColor} !important; font-size: 20px; font-weight: 400; letter-spacing: 0; margin: 0; padding: 0;">${businessSettings.businessName}</div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title" style="color: ${primaryColor} !important; font-size: 20px; font-weight: 400; letter-spacing: 0; margin: 0 0 12px 0; padding: 0;">INVOICE</div>
                <div class="invoice-number" style="color: #000000 !important; font-size: 10px; font-weight: 700; margin: 0 0 8px 0;">#${invoice.invoice_number}</div>
                <div class="invoice-date-label" style="color: #808080 !important; font-size: 8px; margin: 0 0 4px 0;">Issue: ${formatDate(invoice.issue_date)}</div>
                <div class="invoice-due-label" style="color: #808080 !important; font-size: 8px; margin: 8px 0 0 0;">Due: ${formatDate(invoice.due_date)}</div>
                <div class="amount" style="color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;"><!--[if mso]><span style="color:#FF6B35;"><![endif]--><span style="color:#FF6B35;">${formatCurrency(invoice.total)}</span><!--[if mso]></span><![endif]--></div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="details-grid">
              <div class="detail-section">
                <h3>Bill To</h3>
                <p style="margin-bottom: 32px !important;">
                          ${invoice.clients.name}<br>
                          ${invoice.clients.company ? `${invoice.clients.company}<br>` : ''}
                          ${invoice.clients.email}
                </p>
                        </div>
              <div class="detail-section">
                <h3>Invoice Details</h3>
                <p>
                          Issue Date: ${formatDate(invoice.issue_date)}<br>
                          Due Date: ${formatDate(invoice.due_date)}<br>
                          Status: Outstanding
                </p>
                        </div>
                        </div>

            <div class="message-section">
              <p>Thank you for your business. Please find your invoice details below.</p>
              ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
                        </div>

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button" style="background: ${primaryColor} !important; color: #ffffff !important; padding: 16px 32px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 6px; display: inline-block;">
                View Full Invoice
              </a>
            </div>

                  ${(businessSettings.paypalEmail || businessSettings.cashappId || businessSettings.venmoId || businessSettings.googlePayUpi || businessSettings.applePayId || businessSettings.bankAccount || businessSettings.stripeAccount || businessSettings.paymentNotes) ? `
            <div class="payment-methods">
              <h3 style="color: ${primaryColor} !important;">Payment Methods</h3>
              <div class="payment-notice">
                <p>Please use one of the following payment methods to settle this invoice. All payments are processed securely.</p>
                    </div>
                    <div class="payment-list">
                      ${businessSettings.paypalEmail ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">PAYPAL</div>
                    <div class="payment-method-details">Send payment to: ${businessSettings.paypalEmail}</div>
                        </div>
                      ` : ''}
                      ${businessSettings.cashappId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">CASH APP</div>
                    <div class="payment-method-details">Send to: ${businessSettings.cashappId.startsWith('$') ? businessSettings.cashappId : '$' + businessSettings.cashappId}</div>
                        </div>
                      ` : ''}
                      ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">VENMO</div>
                    <div class="payment-method-details">Send to: ${businessSettings.venmoId.startsWith('@') ? businessSettings.venmoId : '@' + businessSettings.venmoId}</div>
                        </div>
                      ` : ''}
                      ${businessSettings.googlePayUpi ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">GOOGLE PAY</div>
                    <div class="payment-method-details">UPI ID: ${businessSettings.googlePayUpi}</div>
                        </div>
                      ` : ''}
                      ${businessSettings.applePayId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">APPLE PAY</div>
                    <div class="payment-method-details">Send to: ${businessSettings.applePayId}</div>
                        </div>
                      ` : ''}
                      ${businessSettings.bankAccount ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">BANK TRANSFER</div>
                    <div class="payment-method-details">
                      Bank: ${businessSettings.bankAccount}
                      ${businessSettings.bankIfscSwift ? `<br>IFSC/SWIFT: ${businessSettings.bankIfscSwift}` : ''}
                      ${businessSettings.bankIban ? `<br>IBAN: ${businessSettings.bankIban}` : ''}
                    </div>
                        </div>
                      ` : ''}
                      ${businessSettings.stripeAccount ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">CREDIT/DEBIT CARD</div>
                    <div class="payment-method-details">Processed securely via Stripe</div>
                        </div>
                      ` : ''}
                      ${businessSettings.paymentNotes ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name" style="color: ${primaryColor} !important;">OTHER</div>
                    <div class="payment-method-details">${businessSettings.paymentNotes}</div>
                        </div>
                      ` : ''}
                    </div>

              <div class="payment-security">
                <p>Security: All payment methods are secure and encrypted. Please include invoice number <strong>#${invoice.invoice_number}</strong> in your payment reference.</p>
                    </div>
                  </div>
                  ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <div class="business-contact">
              ${businessSettings.businessName}<br>
              ${businessSettings.businessEmail}${businessSettings.businessPhone ? ` • ${businessSettings.businessPhone}` : ''}
            </div>

            <div class="invoiceflow-branding">
              <div class="invoiceflow-disclaimer">
                This invoice was created and sent using FlowInvoicer
              </div>
              <a href="https://invoiceflow.com" class="invoiceflow-link">
                Powered by FlowInvoicer
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Fast Invoice Email Template (Template 1 - 60-second invoice)
// Simple, clean, and short design
export function generateOriginalFastInvoiceEmailTemplate(
  invoice: InvoiceData,
  businessSettings: BusinessSettings,
  publicUrl: string
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .email-wrapper {
            background-color: #f5f5f5;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e0e0e0;
          }
          .header {
            padding: 32px 32px 24px;
          }
          .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 16px;
          }
          .message {
            font-size: 15px;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .invoice-details {
            background: #f8f9fa;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .detail-item {
            font-size: 14px;
            color: #000000;
            margin-bottom: 12px;
            line-height: 1.6;
          }
          .detail-item:last-child {
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #000000;
          }
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          .cta-button {
            display: inline-block;
            background: #8B5CF6;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
          }
          .footer {
            padding: 24px 32px;
            border-top: 1px solid #f0f0f0;
            font-size: 13px;
            color: #666666;
            line-height: 1.6;
          }
          .footer-name {
            font-weight: 600;
            color: #000000;
            margin-bottom: 4px;
          }
          .footer-contact {
            color: #666666;
          }
          .footer-link {
            color: #2563eb;
            text-decoration: underline;
          }
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .email-wrapper {
              background-color: #1a1a1a !important;
            }
            .email-container {
              background: #1f1f1f !important;
              border-color: #333333 !important;
            }
            .greeting,
            .detail-label,
            .footer-name {
              color: #ffffff !important;
            }
            .message,
            .detail-item,
            .footer-contact {
              color: #e5e5e5 !important;
            }
            .invoice-details {
              background: #2a2a2a !important;
          }
          .footer {
              border-color: #333333 !important;
            }
          }
          /* Mobile responsive */
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 10px;
            }
            .header {
              padding: 24px 20px 20px;
            }
            .invoice-details {
              padding: 16px;
            }
            .cta-button {
              display: block;
              width: 100%;
              box-sizing: border-box;
            }
            .footer {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="greeting">${businessSettings.businessName} sent you an invoice.</div>
              <div class="message">
                Dear ${invoice.clients.name},<br><br>
                We have generated a new invoice in the amount of <strong>${formatCurrency(invoice.total)}</strong>.<br><br>
                We would appreciate payment of this invoice by ${formatDate(invoice.due_date)}.
              </div>
              
              <div class="invoice-details">
                <div class="detail-item">
                  <span class="detail-label">Invoice:</span> #${invoice.invoice_number}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Due date:</span> ${formatDate(invoice.due_date)}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Amount due:</span> ${formatCurrency(invoice.total)}
                </div>
              </div>

              <div class="cta-section">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${publicUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="8%" stroke="f" fillcolor="#8B5CF6">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:600;">View Invoice</center>
                </v:roundrect>
                <![endif]-->
                <a href="${publicUrl}" class="cta-button" style="display: inline-block; background: #8B5CF6; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View Invoice</a>
              </div>
            </div>

            <div class="footer">
              <div class="footer-name">${businessSettings.businessName}</div>
              <div class="footer-contact">
                ${businessSettings.businessPhone ? `${businessSettings.businessPhone}` : ''}
                ${businessSettings.businessEmail ? `${businessSettings.businessPhone ? ' • ' : ''}<a href="mailto:${businessSettings.businessEmail}" class="footer-link">${businessSettings.businessEmail}</a>` : ''}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Estimate Email Template - Modern, Simple, Clean, Minimal
export function generateEstimateEmailTemplate(
  estimate: {
    estimate_number: string;
    total: number;
    subtotal: number;
    discount?: number;
    taxRate?: number;
    taxAmount?: number;
    issue_date: string;
    expiry_date?: string;
    notes?: string;
    clients: {
      name: string;
      email: string;
      company?: string;
    };
    estimate_items: Array<{
      description: string;
      qty: number;
      rate: number;
      line_total: number;
    }>;
  },
  businessSettings: BusinessSettings,
  publicUrl: string
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const primaryColor = '#1F2937';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estimate ${estimate.estimate_number}</title>
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
          /* Dark mode support - ensure readability */
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
            .footer {
              background: #ffffff !important;
              border-color: #e0e0e0 !important;
            }
            .business-name,
            .estimate-title,
            .bill-to-label,
            .detail-label {
              color: ${primaryColor} !important;
            }
            .estimate-number,
            .bill-to-content {
              color: #000000 !important;
            }
            .amount {
              color: #FF6B35 !important;
            }
            .business-details,
            .estimate-date-label,
            .bill-to-detail,
            .footer p,
            .business-contact {
              color: #333333 !important;
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
          .estimate-info {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 50%;
            padding-left: 24px;
          }
          .estimate-title {
            font-size: 20px;
            font-weight: 400;
            color: ${primaryColor} !important;
            margin: 0 0 12px 0;
            padding: 0;
            letter-spacing: 0;
          }
          .estimate-number {
            font-size: 14px;
            color: #000000 !important;
            margin: 0 0 12px 0;
            font-weight: 700;
          }
          .estimate-date-label {
            font-size: 12px;
            color: #808080 !important;
            margin: 0 0 4px 0;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #FF6B35 !important;
            letter-spacing: -0.5px;
            margin: 16px 0 0 0;
          }
          .content {
            padding: 32px 40px 40px 40px;
            background: #ffffff;
          }
          .bill-to-section {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e0e0e0;
          }
          .bill-to-label {
            font-size: 14px !important;
            font-weight: 400 !important;
            color: ${primaryColor} !important;
            margin: 0 0 16px 0 !important;
          }
          .bill-to-content {
            font-size: 14px !important;
            color: #000000 !important;
            line-height: 1.6 !important;
            margin: 4px 0 !important;
          }
          .bill-to-detail {
            font-size: 14px !important;
            color: #666666 !important;
            line-height: 1.6 !important;
            margin: 4px 0 !important;
          }
          .estimate-details-section {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e0e0e0;
          }
          .detail-row {
            display: table;
            width: 100%;
            margin-bottom: 12px;
          }
          .detail-label {
            font-size: 14px;
            color: ${primaryColor} !important;
            font-weight: 400;
            display: table-cell;
            padding-right: 16px;
            vertical-align: top;
          }
          .detail-value {
            font-size: 14px;
            color: #000000 !important;
            font-weight: 400;
            display: table-cell;
            vertical-align: top;
            text-align: right;
            padding-left: 16px;
          }
          .items-section {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e0e0e0;
          }
          .items-label {
            font-size: 14px;
            color: ${primaryColor} !important;
            font-weight: 400;
            margin-bottom: 12px;
          }
          .item-row {
            display: table;
            width: 100%;
            margin-bottom: 8px;
          }
          .item-description {
            font-size: 14px;
            color: #000000 !important;
            display: table-cell;
            vertical-align: top;
          }
          .item-amount {
            font-size: 14px;
            color: #000000 !important;
            display: table-cell;
            text-align: right;
            vertical-align: top;
            padding-left: 16px;
          }
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          .cta-button {
            display: inline-block;
            background: ${primaryColor};
            color: #ffffff !important;
            padding: 12px 32px;
            text-decoration: none;
            border-radius: 0;
            font-weight: 500;
            font-size: 14px;
            margin: 0;
            text-align: center;
            letter-spacing: 0.5px;
            border: none;
          }
          .footer {
            padding: 32px 40px;
            border-top: 1px solid #e0e0e0;
            text-align: left;
            background: #ffffff;
          }
          .footer p {
            margin: 0 0 12px 0 !important;
            font-size: 14px !important;
            color: #000000 !important;
            line-height: 1.6 !important;
          }
          .footer p:last-child {
            margin-bottom: 0 !important;
          }
          .business-contact {
            font-size: 14px;
            color: #333333 !important;
            margin-top: 12px;
          }
          @media only screen and (max-width: 600px) {
            .header {
              padding: 24px 20px 20px;
            }
            .header-content {
              display: block;
            }
            .business-info,
            .estimate-info {
              display: block;
              width: 100%;
              padding-left: 0;
              margin-bottom: 20px;
            }
            .estimate-info {
              text-align: left;
            }
            .content {
              padding: 24px 20px;
            }
            .footer {
              padding: 24px 20px;
            }
            .cta-button {
              display: block;
              width: 100%;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name">${businessSettings.businessName}</div>
                ${businessSettings.address ? `<div class="business-details">${businessSettings.address}</div>` : ''}
                ${businessSettings.businessPhone ? `<div class="business-details">${businessSettings.businessPhone}</div>` : ''}
                ${businessSettings.businessEmail ? `<div class="business-details">${businessSettings.businessEmail}</div>` : ''}
              </div>
              <div class="estimate-info">
                <div class="estimate-title">ESTIMATE</div>
                <div class="estimate-number">#${estimate.estimate_number}</div>
                <div class="estimate-date-label">Issue: ${formatDate(estimate.issue_date)}</div>
                ${estimate.expiry_date ? `<div class="estimate-date-label" style="margin-top: 8px;">Valid Until: ${formatDate(estimate.expiry_date)}</div>` : ''}
                <div class="amount">${formatCurrency(estimate.total)}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="bill-to-section">
              <div class="bill-to-label">Bill To</div>
              <div class="bill-to-content">${estimate.clients.name}</div>
              ${estimate.clients.company ? `<div class="bill-to-detail">${estimate.clients.company}</div>` : ''}
              ${estimate.clients.email ? `<div class="bill-to-detail">${estimate.clients.email}</div>` : ''}
            </div>

            ${estimate.estimate_items.length > 0 ? `
            <div class="items-section">
              <div class="items-label">Items</div>
              ${estimate.estimate_items.map(item => `
                <div class="item-row">
                  <div class="item-description">${item.description}</div>
                  <div class="item-amount">${formatCurrency(item.line_total)}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div class="estimate-details-section">
              <div class="detail-row">
                <div class="detail-label">Subtotal</div>
                <div class="detail-value">${formatCurrency(estimate.subtotal)}</div>
              </div>
              ${estimate.discount && estimate.discount > 0 ? `
              <div class="detail-row">
                <div class="detail-label">Discount${estimate.subtotal > 0 && estimate.discount < estimate.subtotal ? ` (${((estimate.discount / estimate.subtotal) * 100).toFixed(1)}%)` : ''}</div>
                <div class="detail-value">-${formatCurrency(estimate.discount)}</div>
              </div>
              ` : ''}
              ${estimate.taxAmount && estimate.taxAmount > 0 ? `
              <div class="detail-row">
                <div class="detail-label">Tax${estimate.taxRate && estimate.taxRate > 0 ? ` (${estimate.taxRate.toFixed(1)}%)` : ''}</div>
                <div class="detail-value">${formatCurrency(estimate.taxAmount)}</div>
              </div>
              ` : ''}
              <div class="detail-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                <div class="detail-label" style="font-weight: 600;">Total</div>
                <div class="detail-value" style="font-weight: 600;">${formatCurrency(estimate.total)}</div>
              </div>
            </div>

            ${estimate.notes ? `
            <div style="margin: 32px 0; padding: 16px 0; border-bottom: 1px solid #e0e0e0;">
              <p style="margin: 0 0 12px 0 !important; font-size: 14px !important; color: #000000 !important; line-height: 1.6 !important;">${estimate.notes}</p>
            </div>
            ` : ''}

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button">View Estimation</a>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this estimate, please don't hesitate to contact us.</p>
            <div class="business-contact">
              ${businessSettings.businessName}<br>
              ${businessSettings.businessEmail}${businessSettings.businessPhone ? ` • ${businessSettings.businessPhone}` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Main function to get the appropriate email template
export function getEmailTemplate(
  template: number,
  invoice: InvoiceData,
  businessSettings: BusinessSettings,
  publicUrl: string
): string {
  console.log(`Email Template Selection - Template: ${template}, Invoice Type: ${invoice.type}, Theme: ${JSON.stringify(invoice.theme)}`);
  
  switch (template) {
    case 1: // Fast Invoice (60-second) - use original template
      return generateOriginalFastInvoiceEmailTemplate(invoice, businessSettings, publicUrl);
    case 4: // Modern
      return generateModernEmailTemplate(invoice, businessSettings, publicUrl);
    case 5: // Creative
      return generateCreativeEmailTemplate(invoice, businessSettings, publicUrl);
    case 6: // Minimal - detailed invoice template
      return generateMinimalEmailTemplate(invoice, businessSettings, publicUrl);
    default:
      return generateOriginalFastInvoiceEmailTemplate(invoice, businessSettings, publicUrl);
  }
}
