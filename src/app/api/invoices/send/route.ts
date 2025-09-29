import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { generateTemplatePDFBlob } from '@/lib/template-pdf-generator';

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, clientEmail, clientName } = await request.json();

    // Debug: Log the received data
    console.log('Send Invoice - Received data:', { invoiceId, clientEmail, clientName });

    if (!invoiceId || !clientEmail) {
      console.log('Send Invoice - Missing required fields:', { invoiceId, clientEmail });
      return NextResponse.json({ 
        error: 'Invoice ID and client email are required' 
      }, { status: 400 });
    }

    // Fetch invoice with client data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ 
        error: 'Invoice not found' 
      }, { status: 404 });
    }

    // Fetch invoice items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
    }

    // Fetch user settings for business details
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

    // Prepare invoice data for PDF generation
    const mappedInvoice = {
      ...invoice,
      invoiceNumber: invoice.invoice_number,
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      client: invoice.clients,
      items: (itemsData || []).map(item => ({
        id: item.id,
        description: item.description,
        amount: item.line_total
      }))
    };

    // Prepare business settings for PDF
    const businessSettings = {
      businessName: settingsData?.business_name || 'Your Business Name',
      businessEmail: settingsData?.business_email || 'your-email@example.com',
      businessPhone: settingsData?.business_phone || '',
      address: settingsData?.business_address || '',
      logo: settingsData?.logo || '',
      paypalEmail: settingsData?.paypal_email || '',
      cashappId: settingsData?.cashapp_id || '',
      venmoId: settingsData?.venmo_id || '',
      googlePayUpi: settingsData?.google_pay_upi || '',
      applePayId: settingsData?.apple_pay_id || '',
      bankAccount: settingsData?.bank_account || '',
      bankIfscSwift: settingsData?.bank_ifsc_swift || '',
      bankIban: settingsData?.bank_iban || '',
      stripeAccount: settingsData?.stripe_account || '',
      paymentNotes: settingsData?.payment_notes || ''
    };

    // Debug: Log the data being passed to PDF generation
    console.log('Email PDF - Mapped Invoice:', JSON.stringify(mappedInvoice, null, 2));
    console.log('Email PDF - Business Settings:', JSON.stringify(businessSettings, null, 2));
    console.log('Email PDF - Logo URL:', businessSettings.logo);

    // Generate PDF with template
    const invoiceTheme = invoice.theme as { template?: number; primary_color?: string; secondary_color?: string } | undefined;
    const template = invoiceTheme?.template || 1;
    const primaryColor = invoiceTheme?.primary_color || '#5C2D91';
    const secondaryColor = invoiceTheme?.secondary_color || '#8B5CF6';
    
    const pdfBlob = await generateTemplatePDFBlob(
      mappedInvoice, 
      businessSettings, 
      template, 
      primaryColor, 
      secondaryColor
    );
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Create clean, minimal email template like Wave/Google
    const emailHtml = `
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
                </div>
                <div class="invoice-info">
                  <div class="invoice-title">Invoice</div>
                  <div class="invoice-number">#${invoice.invoice_number}</div>
                  <div class="amount">$${invoice.total.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div class="content">
              <div class="details-section">
                <div class="detail-row">
                  <span class="detail-label">Client</span>
                  <span class="detail-value">${clientName || invoice.clients?.name || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value">${new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value" style="text-transform: capitalize;">Sent</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Created</span>
                  <span class="detail-value">${new Date(invoice.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="message-section">
                <p><strong>Hello ${clientName || invoice.clients?.name || 'there'},</strong></p>
                <p>Please find attached your invoice #${invoice.invoice_number} for the amount of <strong>$${invoice.total.toFixed(2)}</strong>.</p>
                <p>Payment is due by <strong>${new Date(invoice.due_date).toLocaleDateString()}</strong>.</p>
                ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
              </div>

                 <div class="cta-section">
                   <a href="https://invoice-flow-vert.vercel.app/invoice/${invoice.public_token}" 
                      class="cta-button">
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
                      <div class="payment-info">${businessSettings.bankAccount}${businessSettings.bankIfscSwift ? `<br>IFSC/SWIFT: ${businessSettings.bankIfscSwift}` : ''}${businessSettings.bankIban ? `<br>IBAN: ${businessSettings.bankIban}` : ''}</div>
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
                      <div class="payment-method">Other Payment Methods</div>
                      <div class="payment-info">${businessSettings.paymentNotes}</div>
                    </div>
                  ` : ''}
                </div>
                <div class="payment-security">
                  <p><strong>Security:</strong> All payment methods are secure and encrypted. Please include invoice number #${invoice.invoice_number} in your payment reference.</p>
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
                  ${businessSettings.businessEmail}<br>
                  ${businessSettings.businessPhone}
                </div>
              </div>
              
              <div class="invoiceflow-branding">
                <div class="invoiceflow-disclaimer">
                  This invoice was generated using InvoiceFlow
                </div>
                <a href="https://invoice-flow-vert.vercel.app/" class="invoiceflow-link">
                  invoice-flow-vert.vercel.app
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' 
      }, { status: 500 });
    }

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: `${businessSettings.businessName} <onboarding@resend.dev>`, // Using Resend's onboarding domain for free plan
      to: [clientEmail],
      subject: `Invoice #${invoice.invoice_number} - $${invoice.total.toFixed(2)}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error('Resend email error:', error);
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 });
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      await supabaseAdmin
      .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      emailId: data?.id 
    });

  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}