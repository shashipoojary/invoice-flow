import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderType = 'friendly' } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice details with reminder settings and late fees settings
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        invoice_number,
        due_date,
        status,
        total,
        public_token,
        reminder_count,
        last_reminder_sent,
        reminder_settings,
        late_fees,
        clients (
          name,
          email,
          company,
          phone,
          address
        ),
        user_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Extract and validate client email
    // Supabase returns clients as an object (not array) when using .single()
    // Handle both array and object cases for type safety
    const clients = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
    const clientEmail = clients?.email;
    const clientName = clients?.name || 'Valued Customer';
    
    if (!clientEmail || typeof clientEmail !== 'string') {
      return NextResponse.json({ 
        error: 'Client email is required and must be valid',
        details: 'The invoice must have a valid client email address'
      }, { status: 400 });
    }

    // Validate email format (define regex once)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        details: 'The client email address is not in a valid format'
      }, { status: 400 });
    }

    // Check if auto reminders are enabled for this invoice
    let reminderSettings = null;
    try {
      reminderSettings = invoice.reminder_settings ? JSON.parse(invoice.reminder_settings) : null;
    } catch {
      console.log(`⚠️ Invalid reminder settings for invoice ${invoice.invoice_number}`);
    }

    // Check if auto reminders are enabled
    if (!reminderSettings || !reminderSettings.enabled) {
      return NextResponse.json({ error: 'Auto reminders are not enabled for this invoice' }, { status: 400 });
    }

    // Check if invoice is overdue
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const isOverdue = today > dueDate;
    let daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (!isOverdue) {
      return NextResponse.json({ error: 'Invoice is not overdue yet' }, { status: 400 });
    }

    // Get user email to verify if sending to own email (for free plan check)
    // Query auth.users table via RPC or direct query to get user email
    let userEmail = '';
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(invoice.user_id);
      userEmail = authUser?.user?.email?.toLowerCase() || '';
    } catch (error) {
      console.error('Error fetching user email:', error);
      // Try alternative: get from user_settings business_email
      const { data: settingsData } = await supabaseAdmin
        .from('user_settings')
        .select('business_email')
        .eq('user_id', invoice.user_id)
        .single();
      userEmail = settingsData?.business_email?.toLowerCase() || '';
    }
    
    const recipientEmail = clientEmail.trim().toLowerCase();
    const isSendingToOwnEmail = userEmail && recipientEmail === userEmail;
    
    console.log('Email recipient check:', {
      userEmail,
      recipientEmail,
      isSendingToOwnEmail,
      emailMatch: userEmail === recipientEmail
    });

    // Get ALL user business settings from user_settings table (properly isolated per user)
    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, business_email, business_phone, business_address, payment_notes, paypal_email, cashapp_id, venmo_id, google_pay_upi, apple_pay_id, bank_account, bank_ifsc_swift, bank_iban, stripe_account')
      .eq('user_id', invoice.user_id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

    // Use Resend free plan default email address
    const fromAddress = `${userSettings?.business_name || 'FlowInvoicer'} <onboarding@resend.dev>`;

    // Use userSettings as businessSettings (all business details are in user_settings table)
    const businessSettings: {
      business_name?: string;
      business_email?: string;
      business_phone?: string;
      business_address?: string;
      payment_notes?: string;
      paypal_email?: string;
      cashapp_id?: string;
      venmo_id?: string;
      google_pay_upi?: string;
      apple_pay_id?: string;
      bank_account?: string;
      bank_ifsc_swift?: string;
      bank_iban?: string;
      stripe_account?: string;
    } = userSettings || {};

    // Create reminder message based on type
    const reminderMessages = {
      friendly: 'This is a friendly reminder that your invoice payment is now due. We appreciate your prompt attention to this matter and look forward to receiving your payment at your earliest convenience.',
      polite: 'This is a polite reminder that your invoice payment is currently overdue. We kindly request that you arrange payment as soon as possible to avoid any inconvenience.',
      firm: 'This is a firm reminder that your invoice payment is significantly overdue. We require immediate payment to resolve this outstanding balance and avoid any further collection actions.',
      urgent: 'This is an urgent final notice regarding your severely overdue invoice payment. Immediate payment is required to prevent further escalation, which may include account suspension or referral to a collection agency.'
    };

    const reminderMessage = reminderMessages[reminderType as keyof typeof reminderMessages] || reminderMessages.friendly;

    // Calculate current total including late fees (same logic as public invoice page)
    const currentDate = new Date();
    const dueDateForCalc = new Date(invoice.due_date);
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dueDateStart = new Date(dueDateForCalc.getFullYear(), dueDateForCalc.getMonth(), dueDateForCalc.getDate());
    
    const isOverdueCalc = dueDateStart < todayStart && invoice.status !== 'paid';
    
    // ALWAYS calculate daysOverdue if invoice is overdue (regardless of late fees settings)
    if (isOverdueCalc && invoice.status !== 'paid') {
      daysOverdue = Math.round((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      daysOverdue = 0;
    }
    
    let lateFeesAmount = 0;
    let totalPayable = invoice.total;
    
    // Parse late fees settings
    let lateFeesSettings = null;
    if (invoice.late_fees) {
      try {
        lateFeesSettings = typeof invoice.late_fees === 'string' ? JSON.parse(invoice.late_fees) : invoice.late_fees;
      } catch (e) {
        console.log('Failed to parse late_fees JSON:', e);
        lateFeesSettings = null;
      }
    }
    
    // Calculate late fees if invoice is overdue and late fees are enabled
    if (isOverdueCalc && invoice.status !== 'paid' && lateFeesSettings && lateFeesSettings.enabled) {
      const gracePeriod = lateFeesSettings.gracePeriod || 0;
      const chargeableDays = Math.max(0, daysOverdue - gracePeriod);
      
      if (chargeableDays > 0) {
        if (lateFeesSettings.type === 'percentage') {
          lateFeesAmount = (invoice.total || 0) * ((lateFeesSettings.amount || 0) / 100);
        } else if (lateFeesSettings.type === 'fixed') {
          lateFeesAmount = lateFeesSettings.amount || 0;
        }
        totalPayable = invoice.total + lateFeesAmount;
      }
    }

    // Create modern professional reminder email (matching invoice email template style)
    const emailHtml = `
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
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              width: 100%;
            }
            table {
              width: 100%;
              max-width: 100%;
            }
            .header {
              background: #f8f9fa;
              padding: 48px 40px;
              border-bottom: 2px solid #e5e5e5;
            }
            .header-content {
              display: table;
              width: 100%;
              max-width: 520px;
              margin: 0 auto;
              table-layout: fixed;
            }
            .business-info {
              display: table-cell;
              vertical-align: top;
              width: 50%;
            }
            .business-name {
              font-size: 28px;
              font-weight: 700;
              color: #000000 !important;
              letter-spacing: -0.02em;
              margin: 0;
              padding: 0;
            }
            .invoice-info {
              display: table-cell;
              vertical-align: top;
              text-align: right;
              width: 50%;
              padding-left: 24px;
            }
            .invoice-title {
              font-size: 16px;
              font-weight: 500;
              color: #333333 !important;
              margin-bottom: 4px;
            }
            .invoice-number {
              font-size: 16px;
              color: #333333 !important;
              margin-bottom: 8px;
              font-weight: 500;
            }
            .amount {
              font-size: 32px;
              font-weight: 800;
              color: #dc2626;
              letter-spacing: -0.03em;
            }
            .content {
              padding: 48px 40px;
              background: #ffffff;
            }
            .message-section {
              background: #fff7ed;
              border-left: 4px solid #f59e0b;
              padding: 20px 24px;
              margin-bottom: 32px;
              border-radius: 4px;
            }
            .message-section p {
              margin: 0;
              font-size: 15px;
              color: #92400e;
              line-height: 1.6;
              font-weight: 500;
            }
            .greeting {
              margin: 0 0 16px 0;
              font-size: 15px;
              color: #000000;
              line-height: 1.6;
              font-weight: 400;
            }
            .intro-text {
              margin: 0 0 32px 0;
              font-size: 15px;
              color: #000000;
              line-height: 1.6;
              font-weight: 400;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 48px;
              margin-bottom: 48px;
            }
            .detail-section {
              flex: 1;
            }
            .detail-section h3 {
              font-size: 13px;
              font-weight: 600;
              color: #333333 !important;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 0 0 16px 0;
            }
            .detail-section p {
              font-size: 15px;
              color: #000000;
              line-height: 1.8;
              margin: 0;
              font-weight: 400;
            }
            .detail-section p strong {
              font-weight: 600;
              color: #000000;
            }
            .invoice-details-list {
              margin: 0;
              padding: 0;
              width: 100%;
              display: table;
            }
            .detail-item {
              display: table-row;
              margin-bottom: 0;
              width: 100%;
            }
            .detail-item.total-item {
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid #e5e5e5;
            }
            .detail-item.total-item .detail-label,
            .detail-item.total-item .detail-value {
              padding-top: 16px;
            }
            .detail-label {
              font-size: 15px;
              color: #333333 !important;
              font-weight: 400;
              text-align: left;
              padding-right: 20px;
              padding-bottom: 12px;
              display: table-cell;
              vertical-align: baseline;
            }
            .detail-value {
              font-size: 15px;
              color: #000000;
              font-weight: 500;
              text-align: right;
              white-space: nowrap;
              font-variant-numeric: tabular-nums;
              display: table-cell;
              vertical-align: baseline;
              padding-bottom: 12px;
              width: 1%;
            }
            .detail-value.late-fee-amount {
              color: #dc2626;
              font-weight: 600;
            }
            .detail-value.total-amount {
              font-size: 17px;
              color: #059669;
              font-weight: 700;
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
            .footer {
              background: #f8f9fa;
              padding: 32px;
              text-align: center;
              border-top: 2px solid #e5e5e5;
            }
            .footer p {
              margin: 0;
              font-size: 14px;
              color: #333333 !important;
              line-height: 1.5;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 0 !important;
                margin: 0 !important;
              }
              .email-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
              }
              .header {
                padding: 32px 20px !important;
                width: 100% !important;
              }
              .header-content {
                display: table !important;
                width: 100% !important;
                max-width: 100% !important;
                table-layout: fixed !important;
              }
              .business-info {
                display: table-cell !important;
                vertical-align: top !important;
                width: 50% !important;
                text-align: left !important;
              }
              .business-name {
                font-size: 22px !important;
                color: #000000 !important;
              }
              .invoice-info {
                display: table-cell !important;
                vertical-align: top !important;
                text-align: right !important;
                width: 50% !important;
                padding-left: 12px !important;
              }
              .invoice-title {
                color: #333333 !important;
              }
              .invoice-number {
                color: #333333 !important;
              }
              .amount {
                color: #dc2626 !important;
              }
              .invoice-title {
                font-size: 15px !important;
              }
              .invoice-number {
                font-size: 14px !important;
              }
              .amount {
                font-size: 26px !important;
              }
              .content {
                padding: 32px 20px !important;
                width: 100% !important;
              }
              .message-section {
                padding: 16px 20px !important;
                margin-bottom: 24px !important;
              }
              .message-section p {
                font-size: 14px !important;
              }
              .greeting {
                font-size: 14px !important;
                margin-bottom: 12px !important;
              }
              .intro-text {
                font-size: 14px !important;
                margin-bottom: 24px !important;
              }
              .details-grid {
                display: block !important;
                grid-template-columns: none !important;
                gap: 0 !important;
                margin-bottom: 32px !important;
              }
              .detail-section {
                display: block !important;
                margin-bottom: 32px !important;
                width: 100% !important;
              }
              .detail-section:first-child {
                margin-bottom: 32px !important;
              }
              .detail-section:last-child {
                margin-bottom: 0 !important;
              }
              .detail-section h3 {
                font-size: 12px !important;
                margin-bottom: 12px !important;
              }
              .detail-section p {
                font-size: 14px !important;
                line-height: 1.8 !important;
              }
              .invoice-details-list {
                width: 100% !important;
                display: table !important;
              }
              .detail-item {
                display: table-row !important;
                margin-bottom: 0 !important;
                width: 100% !important;
              }
              .detail-label {
                font-size: 14px !important;
                text-align: left !important;
                padding-right: 16px !important;
                padding-bottom: 12px !important;
                display: table-cell !important;
                vertical-align: baseline !important;
              }
              .detail-value {
                font-size: 14px !important;
                text-align: right !important;
                white-space: nowrap !important;
                font-variant-numeric: tabular-nums !important;
                display: table-cell !important;
                vertical-align: baseline !important;
                width: 1% !important;
                padding-bottom: 12px !important;
              }
              .detail-value.total-amount {
                font-size: 16px !important;
              }
              .detail-item.total-item {
                margin-top: 12px !important;
                padding-top: 0 !important;
              }
              .detail-item.total-item .detail-label,
              .detail-item.total-item .detail-value {
                padding-top: 16px !important;
                border-top: 1px solid #e5e5e5 !important;
              }
              .cta-section {
                margin: 32px 0 !important;
              }
              .cta-button {
                display: block !important;
                width: 100% !important;
                padding: 14px 24px !important;
                font-size: 15px !important;
                text-align: center !important;
                box-sizing: border-box !important;
              }
              .footer {
                padding: 24px 20px !important;
                width: 100% !important;
              }
              .footer p {
                font-size: 13px !important;
              }
            }
            @media only screen and (max-width: 480px) {
              .header {
                padding: 24px 16px !important;
              }
              .header-content {
                gap: 12px !important;
              }
              .business-name {
                font-size: 18px !important;
              }
              .invoice-title {
                font-size: 14px !important;
              }
              .invoice-number {
                font-size: 13px !important;
              }
              .amount {
                font-size: 22px !important;
              }
              .content {
                padding: 24px 16px !important;
              }
              .cta-button {
                padding: 12px 20px !important;
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
                  <div class="business-name" style="color: #000000 !important; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0; padding: 0;">${(businessSettings?.business_name || '').trim() || 'Business Name'}</div>
                </div>
                <div class="invoice-info">
                  <div class="invoice-title" style="color: #333333 !important; font-size: 16px; font-weight: 500; margin-bottom: 4px;">Payment Reminder</div>
                  <div class="invoice-number" style="color: #333333 !important; font-size: 16px; margin-bottom: 8px; font-weight: 500;">#${invoice.invoice_number}</div>
                  <div class="amount" style="color: #dc2626 !important; font-size: 32px; font-weight: 800; letter-spacing: -0.03em;">$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>

            <div class="content">
              <div class="message-section">
                <p>${reminderMessage}</p>
              </div>

              <p class="greeting">Dear ${clientName},</p>

              <p class="intro-text">We hope this message finds you well. This is an automated reminder regarding your outstanding invoice.</p>

              <div class="details-grid">
                <div class="detail-section">
                  <h3>Invoice Information</h3>
                  <div class="invoice-details-list">
                    ${lateFeesAmount > 0 ? `
                    <div class="detail-item">
                      <span class="detail-label">Invoice Amount:</span>
                      <span class="detail-value">$${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Late Fee (${daysOverdue} days):</span>
                      <span class="detail-value late-fee-amount">$${lateFeesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="detail-item total-item">
                      <span class="detail-label">Total Amount Due:</span>
                      <span class="detail-value total-amount">$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    ` : `
                    <div class="detail-item total-item">
                      <span class="detail-label">Amount Due:</span>
                      <span class="detail-value total-amount">$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                    `}
                </div>
                </div>
                <div class="detail-section">
                  <h3>Payment Due Date</h3>
                  <p>
                    ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
                    ${daysOverdue > 0 ? `<span style="color: #dc2626; font-weight: 600;">${daysOverdue} days overdue</span>` : '<span style="color: #059669;">Current</span>'}
                  </p>
                </div>
              </div>

              <p class="intro-text">Please review your invoice and make payment at your earliest convenience. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.</p>

              <div class="cta-section">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-flow-vert.vercel.app'}/invoice/${encodeURIComponent(invoice.public_token)}" class="cta-button">
                  View Invoice Online
                </a>
              </div>

              <p style="margin: 32px 0 0 0; color: #333333 !important; font-size: 14px; line-height: 1.5;">
                If you have already made payment, please disregard this reminder. Thank you for your business.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated reminder. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Format email for Resend - use simple email format (not "Name <email>") for better compatibility
    // Resend free plan works best with plain email addresses
    // Extract clean email address (remove any "Name <email>" formatting)
    let cleanEmail = clientEmail.trim();
    
    // Extract email if it's in "Name <email>" format
    if (cleanEmail.includes('<') && cleanEmail.includes('>')) {
      const emailMatch = cleanEmail.match(/<([^>]+)>/);
      if (emailMatch && emailMatch[1]) {
        cleanEmail = emailMatch[1].trim();
      }
    }
    
    // Validate clean email format
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format', 
        details: 'The recipient email address is not in a valid format. Please check the client email address.'
      }, { status: 400 });
    }
    
    // Use plain email address (Resend prefers this for free plan)
    // We'll pass just the email string, not "Name <email>" format
    const formattedEmail = cleanEmail;

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: formattedEmail,
      subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      
      // Check error type and provide helpful messages for free plan users
      const errorMessage = emailResult.error.message || '';
      const isDomainError = errorMessage.includes('domain is not verified') || 
                           errorMessage.includes('verify your domain') ||
                           errorMessage.includes('only send testing emails to your own email');
      const isRateLimitError = errorMessage.includes('Too many requests') || 
                              errorMessage.includes('rate limit') ||
                              errorMessage.includes('2 requests per second');
      
      // If we're sending to own email but still getting domain error, it might be a different issue
      // Log the full error for debugging
      console.error('Email error details:', {
        errorMessage,
        recipientEmail,
        userEmail,
        isSendingToOwnEmail,
        fromAddress
      });
      
      // Determine failure reason with helpful messages for free plan
      let failureReason = errorMessage;
      if (isDomainError && !isSendingToOwnEmail) {
        failureReason = 'Free plan restriction: Can only send to your own email. Verify domain at resend.com/domains to send to clients.';
      } else if (isDomainError && isSendingToOwnEmail) {
        // This shouldn't happen if sending to own email - might be a different issue
        failureReason = `Email sending failed: ${errorMessage}. If you're sending to your own email, check Resend API key configuration.`;
      } else if (isRateLimitError) {
        failureReason = 'Rate limit exceeded. Free plan allows 2 requests/second. Please wait and try again.';
      }
      
      // Try to find existing failed reminder for this invoice+type
      const { data: existingReminders, error: findError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', reminderType)
        .eq('reminder_status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1);

      const existingReminder = existingReminders && existingReminders.length > 0 ? existingReminders[0] : null;

      if (existingReminder) {
        // Update existing failed reminder instead of creating a new one
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            overdue_days: daysOverdue,
            sent_at: new Date().toISOString(),
            failure_reason: failureReason,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReminder.id);
      } else {
        // No existing failed reminder, create a new one
        await supabaseAdmin
        .from('invoice_reminders')
        .insert({
          invoice_id: invoice.id,
          reminder_type: reminderType,
          overdue_days: daysOverdue,
          email_id: null,
          reminder_status: 'failed',
            failure_reason: failureReason
          });
      }

      // Return appropriate error response based on error type
      if (isDomainError && !isSendingToOwnEmail) {
        // Only show domain error if NOT sending to own email
        return NextResponse.json({ 
          error: 'Free Plan Limitation', 
          details: 'Email sending is handled by FlowInvoicer. Please contact support if you encounter any issues.',
          requiresDomainVerification: true,
          isFreePlan: true
        }, { status: 422 });
      } else if (isDomainError && isSendingToOwnEmail) {
        // Unexpected error when sending to own email - show actual error
        return NextResponse.json({ 
          error: 'Email Configuration Issue', 
          details: `Email sending failed even though sending to your own email. Error: ${errorMessage}. Please check your Resend API key configuration or contact support.`,
          originalError: errorMessage,
          recipientEmail,
          userEmail
        }, { status: 500 });
      }
      
      if (isRateLimitError) {
        return NextResponse.json({ 
          error: 'Rate Limit Exceeded', 
          details: 'Resend free plan has a rate limit of 2 requests per second. Please wait a moment and try again, or upgrade your Resend plan for higher limits.',
          isRateLimit: true,
          retryAfter: 1
        }, { status: 429 });
      }

      // Generic error - reminder already recorded above
      return NextResponse.json({ 
        error: 'Failed to send reminder email', 
        details: errorMessage || 'Email sending failed',
        hasApiKey: !!process.env.RESEND_API_KEY,
        suggestion: 'Free plan limitations: 1) Can only send to your own email, 2) Rate limit is 2 requests/second'
      }, { status: 500 });
    }

    // Success - record the reminder
    const emailData = emailResult.data;

    // Check if there's an existing scheduled reminder for this invoice+type and update it instead of creating a new one
    const { data: existingScheduledReminders } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id')
      .eq('invoice_id', invoice.id)
      .eq('reminder_type', reminderType)
      .eq('reminder_status', 'scheduled')
      .order('created_at', { ascending: false })
      .limit(1);

    const existingScheduledReminder = existingScheduledReminders && existingScheduledReminders.length > 0 ? existingScheduledReminders[0] : null;

    let reminderUpdated = false;
    let reminderId: string | null = null;

    if (existingScheduledReminder) {
      // Update existing scheduled reminder to sent
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('invoice_reminders')
        .update({
          reminder_status: 'sent',
          email_id: emailData?.id || null,
          sent_at: new Date().toISOString(),
          overdue_days: daysOverdue,
          failure_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingScheduledReminder.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating scheduled reminder:', updateError);
        // Continue to try other methods
      } else if (updateData) {
        reminderUpdated = true;
        reminderId = updateData.id;
        console.log(`✅ Updated scheduled reminder ${updateData.id} to sent status`);
      }
    }

    // If scheduled update failed or didn't exist, check for failed reminder
    if (!reminderUpdated) {
      const { data: existingFailedReminders, error: failedQueryError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', reminderType)
        .eq('reminder_status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (failedQueryError) {
        console.error('Error querying failed reminders:', failedQueryError);
      }

      const existingFailedReminder = existingFailedReminders && existingFailedReminders.length > 0 ? existingFailedReminders[0] : null;

      if (existingFailedReminder) {
        // Update existing failed reminder to sent
        const { error: updateError, data: updateData } = await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'sent',
            email_id: emailData?.id || null,
            sent_at: new Date().toISOString(),
            overdue_days: daysOverdue,
            failure_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFailedReminder.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating failed reminder:', updateError);
          // Continue to create new record
        } else if (updateData) {
          reminderUpdated = true;
          reminderId = updateData.id;
          console.log(`✅ Updated failed reminder ${updateData.id} to sent status`);
        }
      }
    }

    // If no existing reminder was found or updated, create a new sent reminder record
    if (!reminderUpdated) {
      const { error: insertError, data: insertData } = await supabaseAdmin
      .from('invoice_reminders')
      .insert({
        invoice_id: invoice.id,
        reminder_type: reminderType,
          reminder_status: 'sent',
          email_id: emailData?.id || null,
          sent_at: new Date().toISOString(),
        overdue_days: daysOverdue,
          failure_reason: null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating sent reminder record:', insertError);
        // Log but don't fail the request since email was sent successfully
      } else if (insertData) {
        reminderId = insertData.id;
        console.log(`✅ Created new sent reminder record ${insertData.id}`);
      }
    }

    // Verify the reminder was actually saved with sent status
    if (reminderId) {
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id, reminder_status')
        .eq('id', reminderId)
      .single();

      if (verifyError || !verifyData || verifyData.reminder_status !== 'sent') {
        console.error('⚠️ WARNING: Reminder status verification failed:', {
          reminderId,
          verifyError,
          verifyData,
          expectedStatus: 'sent',
          actualStatus: verifyData?.reminder_status
        });
      } else {
        console.log(`✅ Verified reminder ${reminderId} is saved with 'sent' status`);
      }
    }

    // Update invoice reminder count
    await supabaseAdmin
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully',
      emailId: emailData?.id,
      totalPayable
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json({ 
      error: 'Failed to send reminder', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
