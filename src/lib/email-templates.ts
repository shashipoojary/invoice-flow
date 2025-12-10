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
                <!--[if mso]>
                <div class="amount" style="color: #FF6B35; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;"><span style="color: #FF6B35;">${formatCurrency(invoice.total)}</span></div>
                <![endif]-->
                <!--[if !mso]><!-->
                <div class="amount" style="color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;">${formatCurrency(invoice.total)}</div>
                <!--<![endif]-->
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
          /* Add spacing between Bill To and Invoice Details sections for desktop Gmail */
          .details-grid .detail-section:nth-child(2) h3 {
            margin-top: 24px;
          }
          @media only screen and (max-width: 600px) {
            .details-grid .detail-section:nth-child(2) h3 {
              margin-top: 0;
            }
          }
          .detail-section p {
            font-size: 14px;
            color: #000000;
            line-height: 1.6;
            margin: 0;
            font-weight: 500;
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
                <div class="amount" style="color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;">${formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="details-grid">
              <div class="detail-section">
                <h3>Bill To</h3>
                <p>
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
          /* Add spacing between Bill To and Invoice Details sections for desktop Gmail */
          .details-grid .detail-section:nth-child(2) h3 {
            margin-top: 24px;
          }
          @media only screen and (max-width: 600px) {
            .details-grid .detail-section:nth-child(2) h3 {
              margin-top: 0;
            }
          }
          .detail-section p {
            font-size: 14px;
            color: #000000;
            line-height: 1.6;
            margin: 0;
            font-weight: 500;
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
                <div class="amount" style="color: #FF6B35 !important; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 16px 0 0 0;">${formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="details-grid">
              <div class="detail-section">
                <h3>Bill To</h3>
                <p>
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

// Original Fast Invoice Email Template (Template 1 - 60-second invoice)
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
            width: 100%;
          }
          .business-info {
            flex: 0 0 auto;
            max-width: 50%;
          }
          .business-name {
            font-size: 22px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 4px;
          }
          .business-details {
            font-size: 13px;
            color: #333333 !important;
            line-height: 1.4;
          }
          .invoice-info {
            text-align: right;
            flex: 0 0 auto;
            max-width: 50%;
            margin-left: auto;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 4px;
          }
          .invoice-number {
            font-size: 13px;
            color: #333333 !important;
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
            color: #333333 !important;
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
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .cta-button:hover {
            background: #1557b0;
            transform: translateY(-1px);
          }
          .payment-methods {
            margin: 32px 0;
            width: 100%;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
          }
          .payment-methods::before {
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            width: 50px;
            height: 50px;
            background: #8B5CF608;
            border-radius: 12px;
            transform: rotate(-15deg);
            z-index: 0;
          }
          .payment-methods::after {
            content: '';
            position: absolute;
            bottom: -15px;
            right: -15px;
            width: 35px;
            height: 35px;
            background: #3B82F615;
            border-radius: 50%;
            z-index: 0;
          }
          .payment-methods h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-notice {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 24px;
            width: 100%;
            box-sizing: border-box;
          }
          .payment-notice p {
            margin: 0;
            font-size: 14px;
            color: #1e40af;
            line-height: 1.5;
            font-weight: 500;
          }
          .payment-list {
            margin-bottom: 28px;
            width: 100%;
            box-sizing: border-box;
          }
          .payment-method-item {
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .payment-method-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .payment-item {
            margin-bottom: 16px;
            padding: 0;
          }
          .payment-method-name {
            font-size: 14px;
            font-weight: 700;
            color: #1a73e8;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-method-details {
            font-size: 14px;
            color: #333333 !important;
            line-height: 1.4;
          }
          .payment-method {
            font-size: 16px;
            font-weight: 600;
            color: #1a73e8;
            margin-bottom: 4px;
          }
          .payment-info {
            font-size: 14px;
            color: #333333 !important;
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
            color: #333333 !important;
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
            color: #333333 !important;
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
            color: #333333 !important;
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
            color: #333333 !important;
            line-height: 1.3;
            margin-bottom: 8px;
          }
          .invoiceflow-link {
            font-size: 11px;
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
            .amount,
            .detail-label,
            .detail-value,
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
            .detail-label,
            .payment-method-details {
              color: #333333 !important;
            }
            .business-contact,
            .invoiceflow-link,
            .invoiceflow-disclaimer {
              color: #333333 !important;
            }
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
            table {
              width: 100% !important;
              max-width: 100% !important;
            }
            .header {
              padding: 20px 16px !important;
            }
            .header-content {
              display: block !important;
              flex-direction: column !important;
              width: 100% !important;
            }
            .business-info {
              max-width: 100% !important;
              width: 100% !important;
              margin-bottom: 20px !important;
              display: block !important;
            }
            .invoice-info {
              max-width: 100% !important;
              width: 100% !important;
              text-align: left !important;
              margin-left: 0 !important;
              display: block !important;
            }
            .business-name {
              font-size: 20px !important;
            }
            .invoice-title {
              font-size: 18px !important;
            }
            .invoice-number {
              font-size: 12px !important;
            }
            .amount {
              font-size: 20px !important;
            }
            .content {
              padding: 20px 16px !important;
            }
            .details-section {
              margin-bottom: 24px !important;
            }
            .detail-row {
              display: block !important;
              flex-direction: column !important;
              padding: 12px 0 !important;
              width: 100% !important;
            }
            .detail-label {
              font-size: 13px !important;
              margin-bottom: 4px !important;
              display: block !important;
              width: 100% !important;
            }
            .detail-value {
              font-size: 13px !important;
              display: block !important;
              width: 100% !important;
              word-break: break-word !important;
            }
            .message-section {
              margin: 24px 0 !important;
              padding: 16px 0 !important;
            }
            .message-section p {
              font-size: 13px !important;
              line-height: 1.5 !important;
            }
            .cta-section {
              margin: 24px 0 !important;
            }
            .cta-button {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              text-align: center !important;
              padding: 14px 20px !important;
              font-size: 16px !important;
              margin: 16px 0 !important;
              box-sizing: border-box !important;
            }
            .payment-methods {
              margin: 24px 0 !important;
              width: 100% !important;
              padding: 0 !important;
            }
            .payment-methods::before,
            .payment-methods::after {
              display: none !important;
            }
            .payment-methods h3 {
              font-size: 16px !important;
              margin-bottom: 16px !important;
            }
            .payment-notice {
              padding: 16px !important;
              margin-bottom: 16px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .payment-notice p {
              font-size: 13px !important;
              line-height: 1.5 !important;
            }
            .payment-list {
              width: 100% !important;
              margin-bottom: 20px !important;
              box-sizing: border-box !important;
            }
            .payment-method-item {
              margin-bottom: 16px !important;
              padding-bottom: 16px !important;
              width: 100% !important;
              display: block !important;
            }
            .payment-method-name {
              font-size: 13px !important;
              margin-bottom: 6px !important;
            }
            .payment-method-details {
              font-size: 12px !important;
              line-height: 1.5 !important;
              word-break: break-word !important;
            }
            .payment-method {
              font-size: 14px !important;
            }
            .payment-info {
              font-size: 13px !important;
              word-break: break-word !important;
            }
            .payment-security {
              padding: 16px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .payment-security p {
              font-size: 13px !important;
              line-height: 1.5 !important;
              word-break: break-word !important;
            }
            .footer {
              padding: 20px 16px !important;
            }
            .footer p {
              font-size: 13px !important;
              line-height: 1.5 !important;
            }
            .business-info {
              margin-top: 16px !important;
              padding-top: 16px !important;
            }
            .business-name {
              font-size: 16px !important;
            }
            .business-contact {
              font-size: 13px !important;
              word-break: break-word !important;
            }
            .invoiceflow-branding {
              margin-top: 20px !important;
              padding-top: 16px !important;
            }
            .invoiceflow-disclaimer {
              font-size: 10px !important;
              line-height: 1.4 !important;
            }
            .invoiceflow-link {
              font-size: 10px !important;
            }
          }
          @media only screen and (max-width: 480px) {
            .header {
              padding: 16px 12px !important;
            }
            .content {
              padding: 16px 12px !important;
            }
            .footer {
              padding: 16px 12px !important;
            }
            .cta-button {
              padding: 12px 16px !important;
              font-size: 15px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-info">
                <div class="business-name" style="color: #000000 !important; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0; padding: 0;">${businessSettings.businessName}</div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title" style="color: #333333 !important; font-size: 16px; font-weight: 500; margin-bottom: 4px;">Invoice</div>
                <div class="invoice-number" style="color: #333333 !important; font-size: 16px; margin-bottom: 8px; font-weight: 500;">#${invoice.invoice_number}</div>
                <div class="amount" style="color: #000000 !important; font-size: 32px; font-weight: 800; letter-spacing: -0.03em;">${formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="details-section">
              <div class="detail-row">
                <div class="detail-label">Bill to:</div>
                <div class="detail-value">${invoice.clients.name}${invoice.clients.company ? `, ${invoice.clients.company}` : ''}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Issue date:</div>
                <div class="detail-value">${formatDate(invoice.issue_date)}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Due date:</div>
                <div class="detail-value">${formatDate(invoice.due_date)}</div>
              </div>
            </div>

            <div class="message-section">
              <p style="margin: 0 0 12px 0 !important; font-size: 14px !important; color: #000000 !important; line-height: 1.6 !important;">Please find attached your invoice for the services provided.</p>
              ${invoice.notes ? `<p style="margin: 0 !important; font-size: 14px !important; color: #000000 !important; line-height: 1.6 !important;">${invoice.notes}</p>` : ''}
            </div>

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button">
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
            
            <div class="business-info">
              <div class="business-name">${businessSettings.businessName}</div>
              <div class="business-contact">
                ${businessSettings.businessEmail}${businessSettings.businessPhone ? ` • ${businessSettings.businessPhone}` : ''}
              </div>
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
