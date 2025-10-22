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

// Minimal Email Template (Template 6 - Clean with subtle differences)
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
            background-color: #f5f5f5;
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
            padding: 24px;
            background: #ffffff;
            border-bottom: 2px solid #e0e0e0;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          .business-info {
            flex: 1;
          }
          .business-name {
            font-size: 20px;
            font-weight: 600;
            color: #202124;
            margin-bottom: 6px;
          }
          .business-details {
            font-size: 14px;
            color: #5f6368;
            line-height: 1.4;
          }
          .invoice-info {
            text-align: right;
            flex: 0 0 auto;
            margin-left: 24px;
          }
          .invoice-title {
            font-size: 16px;
            font-weight: 500;
            color: #5f6368;
            margin-bottom: 4px;
          }
          .invoice-number {
            font-size: 14px;
            color: #202124;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .amount {
            font-size: 28px;
            font-weight: 700;
            color: #137333;
          }
          .content {
            padding: 24px;
          }
          .invoice-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 24px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e8eaed;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-size: 14px;
            color: #5f6368;
            font-weight: 500;
          }
          .detail-value {
            font-size: 14px;
            color: #202124;
            font-weight: 400;
          }
          .message-section {
            margin: 24px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
          }
          .message-section p {
            margin-bottom: 12px;
            font-size: 15px;
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
            margin-bottom: 12px;
            padding: 12px;
            background: #ffffff;
            border-radius: 4px;
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
            color: #5f6368;
            line-height: 1.4;
          }
          .payment-method {
            font-size: 15px;
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
            background: #e8f5e8;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #c8e6c9;
            text-align: center;
          }
          .payment-security p {
            margin: 0;
            font-size: 14px;
            color: #2e7d32;
            line-height: 1.4;
            font-weight: 500;
          }
          .footer {
            padding: 24px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            background: #f8f9fa;
          }
          .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #5f6368;
          }
          .footer p:last-child {
            margin-bottom: 0;
          }
          .business-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
            color: #5f6368;
            font-size: 14px;
            font-weight: 500;
          }
          .invoiceflow-branding {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
          }
          .invoiceflow-disclaimer {
            font-size: 12px;
            color: #9aa0a6;
            line-height: 1.3;
            margin-bottom: 8px;
          }
          .invoiceflow-link {
            font-size: 12px;
            color: #5f6368;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .header {
              padding: 20px;
            }
            .header-content {
              flex-direction: column;
              gap: 16px;
            }
            .business-info {
              text-align: center;
            }
            .invoice-info {
              text-align: center;
              margin-left: 0;
            }
            .content {
              padding: 20px;
            }
            .footer {
              padding: 20px;
            }
            .payment-methods h3 {
              font-size: 16px;
            }
            .payment-item {
              padding: 16px;
              margin-bottom: 16px;
            }
            .payment-method {
              font-size: 14px;
            }
            .payment-info {
              font-size: 13px;
            }
            .payment-notice {
              padding: 20px;
            }
            .payment-notice p {
              font-size: 13px;
            }
            .cta-button {
              display: block;
              width: 100%;
              text-align: center;
              padding: 14px 28px;
              font-size: 16px;
              margin: 24px 0;
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
              </div>
              <div class="invoice-info">
                <div class="invoice-title">Invoice</div>
                <div class="invoice-number">#${invoice.invoice_number}</div>
                <div class="amount">${formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="invoice-details">
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
                    <div class="payment-method-details">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">VENMO</div>
                    <div class="payment-method-details">Send to: @${businessSettings.venmoId}</div>
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
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
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
          .invoice-details {
            text-align: right;
          }
          .invoice-number {
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
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            margin-bottom: 48px;
          }
          .detail-section h3 {
            font-size: 13px;
            font-weight: 600;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0 0 16px 0;
          }
          .detail-section p {
            font-size: 15px;
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
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            letter-spacing: -0.01em;
          }
          .cta-button:hover {
            background: #262626;
            transform: translateY(-1px);
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
          .payment-security {
            background: #f8f8f8;
            padding: 16px;
            text-align: center;
          }
          .payment-security p {
            margin: 0;
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
          .business-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
            color: #666666;
            font-size: 13px;
          }
          .invoiceflow-branding {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
          }
          .invoiceflow-disclaimer {
            font-size: 11px;
            color: #999999;
            line-height: 1.3;
            margin-bottom: 4px;
          }
          .invoiceflow-link {
            font-size: 11px;
            color: #666666;
            text-decoration: none;
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
            .invoice-details {
              text-align: center;
            }
            .content {
              padding: 32px 24px;
            }
            .details-grid {
              grid-template-columns: 1fr;
              gap: 24px;
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
              <div class="invoice-details">
                <div class="invoice-number">#${invoice.invoice_number}</div>
                <div class="amount">${formatCurrency(invoice.total)}</div>
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
                    <div class="payment-method-details">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">VENMO</div>
                    <div class="payment-method-details">Send to: @${businessSettings.venmoId}</div>
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
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
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

// Creative Email Template (Template 5 - Professional Creative Design)
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
            border-radius: 6px;
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
          .invoice-details {
            text-align: right;
            flex: 1;
          }
          .invoice-number {
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
            border-radius: 6px;
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
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
          }
          .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-item {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
          }
          .detail-item strong {
            color: #374151;
            font-weight: 600;
          }
          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            background: #ffffff;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .services-table th {
            background: ${primaryColor};
            color: white;
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .services-table td {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          .services-table tr:last-child td {
            border-bottom: none;
          }
          .services-table tr:nth-child(even) {
            background: #f8fafc;
          }
          .totals-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 24px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .total-row.final {
            border-top: 2px solid ${primaryColor};
            padding-top: 12px;
            margin-top: 12px;
            font-size: 16px;
            font-weight: 700;
            color: ${primaryColor};
          }
          .cta-button {
            display: inline-block;
            background: ${primaryColor};
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 24px 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .cta-button:hover {
            background: ${secondaryColor};
            transform: translateY(-1px);
          }
          .payment-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 24px 0;
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
            background: ${secondaryColor}08;
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
            background: ${accentColor}15;
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
          .payment-method-name {
            font-size: 14px;
            font-weight: 700;
            color: ${primaryColor};
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-method-details {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
            font-weight: 400;
          }
          .payment-security {
            background: #fef3c7;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #f59e0b;
            text-align: center;
            width: 100%;
            margin-top: 24px;
            box-sizing: border-box;
          }
          .payment-security p {
            margin: 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.4;
            font-weight: 500;
          }
          .footer {
            background: #1e293b;
            padding: 40px 24px;
            text-align: center;
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
            .email-container {
              margin: 0;
              border-radius: 0;
            }
            .email-container::before {
              width: 60px;
              height: 60px;
              top: -30px;
              right: -30px;
            }
            .email-container::after {
              width: 40px;
              height: 40px;
              bottom: -20px;
              left: -20px;
            }
            .header {
              padding: 32px 16px;
            }
            .header-content {
              flex-direction: column;
              text-align: center;
              gap: 20px;
            }
            .business-name {
              font-size: 24px;
              flex: none;
            }
            .invoice-details {
              text-align: center;
              flex: none;
            }
            .invoice-number {
              font-size: 14px;
            }
            .amount {
              font-size: 32px;
            }
            .content {
              padding: 24px 16px;
            }
            .content::before {
              width: 25px;
              height: 25px;
              top: 15px;
              right: 15px;
            }
            .content::after {
              width: 20px;
              height: 20px;
              bottom: 15px;
              left: 15px;
            }
            .info-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            .info-section {
              padding: 16px;
            }
            .services-table th,
            .services-table td {
              padding: 12px 16px;
            }
            .payment-methods {
              margin: 24px 0;
            }
            .payment-methods::before {
              width: 30px;
              height: 30px;
              top: -5px;
              left: -5px;
            }
            .payment-methods::after {
              width: 25px;
              height: 25px;
              bottom: -10px;
              right: -10px;
            }
            .payment-methods h3 {
              font-size: 16px;
            }
            .payment-notice {
              padding: 16px;
              margin-bottom: 20px;
            }
            .payment-notice p {
              font-size: 14px;
              line-height: 1.5;
            }
            .payment-method-item {
              margin-bottom: 16px;
              padding-bottom: 16px;
            }
            .payment-method-name {
              font-size: 13px;
            }
            .payment-method-details {
              font-size: 13px;
            }
            .payment-security {
              padding: 16px;
              margin-top: 20px;
            }
            .payment-security p {
              font-size: 13px;
              line-height: 1.5;
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
              <div class="business-name">${businessSettings.businessName}</div>
              <div class="invoice-details">
                <div class="invoice-number">#${invoice.invoice_number}</div>
                <div class="amount">${formatCurrency(invoice.total)}</div>
              </div>
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
                    <div class="payment-method-details">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">VENMO</div>
                    <div class="payment-method-details">Send to: @${businessSettings.venmoId}</div>
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
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
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
            color: #5f6368;
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
            .email-container {
              max-width: 100%;
              margin: 0;
            }
            .header {
              padding: 20px 16px;
            }
            .header-content {
              flex-direction: column;
              gap: 20px;
            }
            .business-info {
              max-width: 100%;
              order: 2;
            }
            .invoice-info {
              max-width: 100%;
              text-align: left;
              margin-left: 0;
              order: 1;
            }
            .business-name {
              font-size: 16px;
            }
            .business-details {
              font-size: 12px;
            }
            .invoice-title {
              font-size: 18px;
            }
            .invoice-number {
              font-size: 12px;
            }
            .amount {
              font-size: 20px;
            }
            .content {
              padding: 20px 16px;
            }
            .detail-row {
              flex-direction: column;
              gap: 4px;
              padding: 16px 0;
            }
            .detail-label {
              font-size: 13px;
              margin-bottom: 4px;
            }
            .detail-value {
              font-size: 13px;
            }
            .message-section {
              margin: 24px 0;
              padding: 20px 0;
            }
            .message-section p {
              font-size: 13px;
            }
            .cta-section {
              margin: 24px 0;
            }
            .cta-button {
              display: block;
              width: 100%;
              text-align: center;
              padding: 14px 28px;
              font-size: 16px;
              margin: 24px 0;
            }
            .payment-methods {
              margin: 24px 0;
            }
            .payment-methods h3 {
              font-size: 16px;
            }
            .payment-notice {
              padding: 12px;
              margin-bottom: 16px;
            }
            .payment-notice p {
              font-size: 13px;
            }
            .payment-method {
              font-size: 14px;
            }
            .payment-info {
              font-size: 13px;
            }
            .payment-security {
              padding: 12px;
            }
            .payment-security p {
              font-size: 13px;
            }
            .footer {
              padding: 20px 16px;
            }
            .footer p {
              font-size: 13px;
            }
            .business-name {
              font-size: 14px;
            }
            .business-contact {
              font-size: 13px;
            }
            .invoiceflow-disclaimer {
              font-size: 10px;
            }
            .invoiceflow-link {
              font-size: 10px;
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
                    <div class="payment-method-details">Send to: $${businessSettings.cashappId}</div>
                  </div>
                ` : ''}
                ${businessSettings.venmoId ? `
                  <div class="payment-method-item">
                    <div class="payment-method-name">VENMO</div>
                    <div class="payment-method-details">Send to: @${businessSettings.venmoId}</div>
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
                      Bank: ${businessSettings.bankAccount}<br>
                      ${businessSettings.bankIfscSwift ? `IFSC/SWIFT: ${businessSettings.bankIfscSwift}<br>` : ''}
                      ${businessSettings.bankIban ? `IBAN: ${businessSettings.bankIban}` : ''}
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
