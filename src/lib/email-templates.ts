// Email templates for different invoice designs
// Clean, professional designs like Google/Wave

interface InvoiceData {
  invoice_number: string;
  total: number;
  due_date: string;
  issue_date: string;
  notes?: string;
  clients: {
    name: string;
    email: string;
    company?: string;
  };
  invoice_items: Array<{
    description: string;
    line_total: number;
  }>;
  theme?: {
    template?: number;
    primary_color?: string;
    secondary_color?: string;
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

// Fast Invoice Email Template (Template 6 - Minimal)
export function generateFastInvoiceEmailTemplate(
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
            .header-content {
              flex-direction: column;
              gap: 16px;
            }
            .business-info {
              max-width: 100%;
            }
            .invoice-info {
              max-width: 100%;
              text-align: left;
              margin-left: 0;
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
                <div class="business-name">${businessSettings.businessName}</div>
                <div class="business-details">
                  ${businessSettings.address ? `${businessSettings.address}<br>` : ''}
                  ${businessSettings.businessPhone ? `${businessSettings.businessPhone}<br>` : ''}
                  ${businessSettings.businessEmail}
                </div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title">Invoice</div>
                <div class="invoice-number">#${invoice.invoice_number}</div>
                <div class="amount">${formatCurrency(invoice.total)}</div>
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
              <p>Please find attached your invoice for the services provided.</p>
              ${invoice.notes ? `<p>${invoice.notes}</p>` : ''}
            </div>

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button">
                View Invoice Online
              </a>
            </div>

            ${(businessSettings.paypalEmail || businessSettings.cashappId || businessSettings.venmoId || businessSettings.googlePayUpi || businessSettings.applePayId || businessSettings.bankAccount || businessSettings.stripeAccount || businessSettings.paymentNotes) ? `
            <div class="payment-methods">
              <h3>Payment Information</h3>
              <div class="payment-notice">
                <p>Please use one of the following payment methods to settle this invoice. All payments are processed securely.</p>
              </div>
              <div class="payment-list">
                ${businessSettings.paypalEmail ? `
                  <div class="payment-item">
                    <div class="payment-method">PayPal</div>
                    <div class="payment-info">Send payment to: ${businessSettings.paypalEmail}</div>
                  </div>
                ` : ''}
                ${businessSettings.cashappId ? `
                  <div class="payment-item">
                    <div class="payment-method">Cash App</div>
                    <div class="payment-info">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-item">
                    <div class="payment-method">Venmo</div>
                    <div class="payment-info">Send to: @${businessSettings.venmoId}</div>
                  </div>
                ` : ''}
                ${businessSettings.googlePayUpi ? `
                  <div class="payment-item">
                    <div class="payment-method">Google Pay</div>
                    <div class="payment-info">UPI ID: ${businessSettings.googlePayUpi}</div>
                  </div>
                ` : ''}
                ${businessSettings.applePayId ? `
                  <div class="payment-item">
                    <div class="payment-method">Apple Pay</div>
                    <div class="payment-info">Send to: ${businessSettings.applePayId}</div>
                  </div>
                ` : ''}
                ${businessSettings.bankAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Bank Transfer</div>
                    <div class="payment-info">
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
                    </div>
                  </div>
                ` : ''}
                ${businessSettings.stripeAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Credit/Debit Card</div>
                    <div class="payment-info">Processed securely via Stripe</div>
                  </div>
                ` : ''}
                ${businessSettings.paymentNotes ? `
                  <div class="payment-item">
                    <div class="payment-method">Other</div>
                    <div class="payment-info">${businessSettings.paymentNotes}</div>
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
                This invoice was created and sent using InvoiceFlow
              </div>
              <a href="https://invoiceflow.com" class="invoiceflow-link">
                Powered by InvoiceFlow
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

  // Extract colors from theme
  const primaryColor = invoice.theme?.primary_color || '#7C3AED';
  const secondaryColor = invoice.theme?.secondary_color || '#A855F7';

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
          }
          .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            padding: 32px 24px;
            color: white;
            text-align: center;
          }
          .business-name {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .invoice-title {
            font-size: 18px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 16px;
          }
          .invoice-number {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 8px;
          }
          .amount {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          .content {
            padding: 32px 24px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
          }
          .detail-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid ${primaryColor};
          }
          .detail-section h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-section p {
            margin: 0;
            font-size: 14px;
            color: #475569;
            line-height: 1.5;
          }
          .message-section {
            background: #f1f5f9;
            padding: 24px;
            border-radius: 6px;
            margin-bottom: 32px;
          }
          .message-section p {
            margin: 0 0 16px 0;
            font-size: 14px;
            color: #1e293b;
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
            background: ${primaryColor};
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
          }
          .cta-button:hover {
            background: ${secondaryColor};
            transform: translateY(-1px);
          }
          .payment-methods {
            margin: 32px 0;
          }
          .payment-methods h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: center;
          }
          .payment-notice {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 24px;
            border-left: 4px solid ${primaryColor};
          }
          .payment-notice p {
            margin: 0;
            font-size: 14px;
            color: #1e40af;
            line-height: 1.5;
            font-weight: 500;
          }
          .payment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .payment-item {
            background: #ffffff;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          }
          .payment-item:hover {
            border-color: ${primaryColor};
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .payment-method {
            font-size: 14px;
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 6px;
          }
          .payment-info {
            font-size: 13px;
            color: #64748b;
            line-height: 1.4;
          }
          .payment-security {
            background: #fef3c7;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #f59e0b;
            text-align: center;
          }
          .payment-security p {
            margin: 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.4;
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
            color: #64748b;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          .business-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
          .invoiceflow-branding {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          .invoiceflow-disclaimer {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.3;
            margin-bottom: 8px;
          }
          .invoiceflow-link {
            font-size: 11px;
            color: #64748b;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .header {
              padding: 24px 16px;
            }
            .content {
              padding: 24px 16px;
            }
            .details-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            .payment-grid {
              grid-template-columns: 1fr;
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
            <div class="business-name">${businessSettings.businessName}</div>
            <div class="invoice-title">Invoice</div>
            <div class="invoice-number">#${invoice.invoice_number}</div>
            <div class="amount">${formatCurrency(invoice.total)}</div>
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
              <div class="payment-grid">
                ${businessSettings.paypalEmail ? `
                  <div class="payment-item">
                    <div class="payment-method">PayPal</div>
                    <div class="payment-info">Send payment to: ${businessSettings.paypalEmail}</div>
                  </div>
                ` : ''}
                ${businessSettings.cashappId ? `
                  <div class="payment-item">
                    <div class="payment-method">Cash App</div>
                    <div class="payment-info">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-item">
                    <div class="payment-method">Venmo</div>
                    <div class="payment-info">Send to: @${businessSettings.venmoId}</div>
                  </div>
                ` : ''}
                ${businessSettings.googlePayUpi ? `
                  <div class="payment-item">
                    <div class="payment-method">Google Pay</div>
                    <div class="payment-info">UPI ID: ${businessSettings.googlePayUpi}</div>
                  </div>
                ` : ''}
                ${businessSettings.applePayId ? `
                  <div class="payment-item">
                    <div class="payment-method">Apple Pay</div>
                    <div class="payment-info">Send to: ${businessSettings.applePayId}</div>
                  </div>
                ` : ''}
                ${businessSettings.bankAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Bank Transfer</div>
                    <div class="payment-info">
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
                    </div>
                  </div>
                ` : ''}
                ${businessSettings.stripeAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Credit/Debit Card</div>
                    <div class="payment-info">Processed securely via Stripe</div>
                  </div>
                ` : ''}
                ${businessSettings.paymentNotes ? `
                  <div class="payment-item">
                    <div class="payment-method">Other</div>
                    <div class="payment-info">${businessSettings.paymentNotes}</div>
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
                This invoice was created and sent using InvoiceFlow
              </div>
              <a href="https://invoiceflow.com" class="invoiceflow-link">
                Powered by InvoiceFlow
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Creative Email Template (Template 5 - Creative Design)
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

  // Extract colors from theme
  const primaryColor = invoice.theme?.primary_color || '#8B5CF6';
  const secondaryColor = invoice.theme?.secondary_color || '#F59E0B';
  const accentColor = invoice.theme?.accent_color || '#EC4899';

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
            color: #1e293b;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${accentColor} 100%);
            padding: 40px 24px;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          .header-content {
            position: relative;
            z-index: 1;
          }
          .business-name {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .business-tagline {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 20px;
            font-style: italic;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .invoice-number {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 16px;
            font-weight: 500;
          }
          .amount {
            font-size: 36px;
            font-weight: 800;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            margin-bottom: 8px;
          }
          .content {
            padding: 40px 24px;
          }
          .creative-section {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 32px;
            border-left: 6px solid ${primaryColor};
            position: relative;
          }
          .creative-section::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, ${secondaryColor}20, ${accentColor}20);
            border-radius: 0 12px 0 100%;
          }
          .creative-section h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 700;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .creative-section p {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
          }
          .creative-section p:last-child {
            margin-bottom: 0;
          }
          .message-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 28px;
            border-radius: 12px;
            margin-bottom: 32px;
            border: 2px solid ${secondaryColor}40;
            position: relative;
          }
          .message-section::after {
            content: '✨';
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: 20px;
          }
          .message-section p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #92400e;
            line-height: 1.6;
            font-weight: 500;
          }
          .message-section p:last-child {
            margin-bottom: 0;
          }
          .cta-section {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          .cta-button:hover::before {
            left: 100%;
          }
          .payment-methods {
            margin: 40px 0;
          }
          .payment-methods h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 24px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .payment-notice {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 28px;
            border-left: 6px solid ${primaryColor};
            position: relative;
          }
          .payment-notice::before {
            content: '💳';
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
          }
          .payment-notice p {
            margin: 0;
            font-size: 15px;
            color: #1e40af;
            line-height: 1.6;
            font-weight: 600;
          }
          .payment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 28px;
          }
          .payment-item {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 20px;
            border-radius: 12px;
            border: 2px solid transparent;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .payment-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${accentColor});
          }
          .payment-item:hover {
            border-color: ${primaryColor};
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }
          .payment-method {
            font-size: 16px;
            font-weight: 700;
            color: ${primaryColor};
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-info {
            font-size: 14px;
            color: #64748b;
            line-height: 1.5;
            font-weight: 500;
          }
          .payment-security {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 20px;
            border-radius: 12px;
            border: 2px solid ${secondaryColor}40;
            text-align: center;
            position: relative;
          }
          .payment-security::before {
            content: '🔒';
            position: absolute;
            top: 16px;
            left: 20px;
            font-size: 20px;
          }
          .payment-security p {
            margin: 0;
            font-size: 14px;
            color: #92400e;
            line-height: 1.5;
            font-weight: 600;
          }
          .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 40px 24px;
            text-align: center;
            border-top: 3px solid ${primaryColor};
          }
          .footer p {
            margin-bottom: 12px;
            font-size: 15px;
            color: #64748b;
            font-weight: 500;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          .business-contact {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid ${primaryColor}40;
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
          }
          .invoiceflow-branding {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 2px solid ${primaryColor}40;
          }
          .invoiceflow-disclaimer {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.4;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .invoiceflow-link {
            font-size: 12px;
            color: #64748b;
            text-decoration: none;
            font-weight: 600;
          }
          @media (max-width: 600px) {
            .header {
              padding: 32px 16px;
            }
            .content {
              padding: 32px 16px;
            }
            .payment-grid {
              grid-template-columns: 1fr;
            }
            .footer {
              padding: 32px 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <div class="business-name">${businessSettings.businessName}</div>
              <div class="business-tagline">Bringing Ideas to Life</div>
              <div class="invoice-title">Invoice</div>
              <div class="invoice-number">#${invoice.invoice_number}</div>
              <div class="amount">${formatCurrency(invoice.total)}</div>
            </div>
          </div>

          <div class="content">
            <div class="creative-section">
              <h3>Bill To</h3>
              <p>
                <strong>${invoice.clients.name}</strong><br>
                ${invoice.clients.company ? `${invoice.clients.company}<br>` : ''}
                ${invoice.clients.email}
              </p>
            </div>

            <div class="creative-section">
              <h3>Invoice Details</h3>
              <p>
                <strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}<br>
                <strong>Due Date:</strong> ${formatDate(invoice.due_date)}<br>
                <strong>Status:</strong> Outstanding
              </p>
            </div>

            <div class="message-section">
              <p>Thank you for choosing our creative services! We're excited to bring your vision to life.</p>
              ${invoice.notes ? `<p><strong>Project Notes:</strong> ${invoice.notes}</p>` : ''}
            </div>

            <div class="cta-section">
              <a href="${publicUrl}" class="cta-button">
                View Creative Invoice
              </a>
            </div>

            ${(businessSettings.paypalEmail || businessSettings.cashappId || businessSettings.venmoId || businessSettings.googlePayUpi || businessSettings.applePayId || businessSettings.bankAccount || businessSettings.stripeAccount || businessSettings.paymentNotes) ? `
            <div class="payment-methods">
              <h3>Payment Methods</h3>
              <div class="payment-notice">
                <p>Please use one of the following payment methods to settle this invoice. All payments are processed securely.</p>
              </div>
              <div class="payment-grid">
                ${businessSettings.paypalEmail ? `
                  <div class="payment-item">
                    <div class="payment-method">PayPal</div>
                    <div class="payment-info">Send payment to: ${businessSettings.paypalEmail}</div>
                  </div>
                ` : ''}
                ${businessSettings.cashappId ? `
                  <div class="payment-item">
                    <div class="payment-method">Cash App</div>
                    <div class="payment-info">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-item">
                    <div class="payment-method">Venmo</div>
                    <div class="payment-info">Send to: @${businessSettings.venmoId}</div>
                  </div>
                ` : ''}
                ${businessSettings.googlePayUpi ? `
                  <div class="payment-item">
                    <div class="payment-method">Google Pay</div>
                    <div class="payment-info">UPI ID: ${businessSettings.googlePayUpi}</div>
                  </div>
                ` : ''}
                ${businessSettings.applePayId ? `
                  <div class="payment-item">
                    <div class="payment-method">Apple Pay</div>
                    <div class="payment-info">Send to: ${businessSettings.applePayId}</div>
                  </div>
                ` : ''}
                ${businessSettings.bankAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Bank Transfer</div>
                    <div class="payment-info">
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
                    </div>
                  </div>
                ` : ''}
                ${businessSettings.stripeAccount ? `
                  <div class="payment-item">
                    <div class="payment-method">Credit/Debit Card</div>
                    <div class="payment-info">Processed securely via Stripe</div>
                  </div>
                ` : ''}
                ${businessSettings.paymentNotes ? `
                  <div class="payment-item">
                    <div class="payment-method">Other</div>
                    <div class="payment-info">${businessSettings.paymentNotes}</div>
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
                This invoice was created and sent using InvoiceFlow
              </div>
              <a href="https://invoiceflow.com" class="invoiceflow-link">
                Powered by InvoiceFlow
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
  switch (template) {
    case 4: // Modern
      return generateModernEmailTemplate(invoice, businessSettings, publicUrl);
    case 5: // Creative
      return generateCreativeEmailTemplate(invoice, businessSettings, publicUrl);
    case 6: // Fast Invoice (Minimal)
    default:
      return generateFastInvoiceEmailTemplate(invoice, businessSettings, publicUrl);
  }
}
