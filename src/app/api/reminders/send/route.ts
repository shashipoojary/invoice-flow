import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderType = 'friendly' } = await request.json();
    
    // Get base URL for invoice links
    const getBaseUrl = () => {
      if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      const host = request.headers.get('x-forwarded-host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      if (host) return `${proto}://${host}`;
      return '';
    };
    const baseUrl = getBaseUrl();

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
      .select('business_name, business_email, business_phone, business_address, website, payment_notes, paypal_email, cashapp_id, venmo_id, google_pay_upi, apple_pay_id, bank_account, bank_ifsc_swift, bank_iban, stripe_account')
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
    // Get greeting and message based on reminder type
    const getGreeting = () => {
      switch (reminderType) {
        case 'friendly':
          return `Hi ${clientName},`;
        case 'polite':
          return `Dear ${clientName},`;
        case 'firm':
          return `Hello ${clientName},`;
        case 'urgent':
          return `${clientName},`;
        default:
          return `Dear ${clientName},`;
      }
    };

    const getMessage = () => {
      switch (reminderType) {
        case 'friendly':
          return `This is a friendly reminder that invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is now due.`;
        case 'polite':
          return `This is a reminder that invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.`;
        case 'firm':
          return `Invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is ${daysOverdue} days overdue. Immediate payment is required.`;
        case 'urgent':
          return `URGENT: Invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is ${daysOverdue} days overdue. Payment required immediately.`;
        default:
          return `This is a reminder regarding invoice #${invoice.invoice_number}.`;
      }
    };

    const getClosing = () => {
      switch (reminderType) {
        case 'friendly':
          return `Thank you for your prompt attention.`;
        case 'polite':
          return `We appreciate your immediate attention to this matter.`;
        case 'firm':
          return `We require immediate payment to resolve this matter.`;
        case 'urgent':
          return `This matter requires immediate attention.`;
        default:
          return `Thank you for your attention.`;
      }
    };

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

    // Create custom, unique reminder email design
    const emailHtml = `
      <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #0a0a0a !important; }
      .dark-text { color: #f5f5f5 !important; }
      .dark-border { border-color: #2a2a2a !important; }
            }
            @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .pad { padding: 20px !important; }
      .amount { font-size: 28px !important; }
            }
          </style>
        </head>
<body style="margin:0;padding:0;width:100%;background-color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width:560px;width:100%;background-color:#ffffff;">
          
          <!-- Top accent line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, #000000 0%, #333333 100%);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td class="pad" style="padding:40px 40px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;padding:0;color:#000000;font-size:20px;font-weight:600;letter-spacing:-0.3px;line-height:1.3;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${(businessSettings?.business_name || '').trim() || 'Invoice Reminder'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice amount highlight -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px;background-color:#fafafa;border:1px solid #e8e8e8;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 8px 0;padding:0;color:#666666;font-size:12px;letter-spacing:0.3px;text-transform:uppercase;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Invoice #${invoice.invoice_number}</p>
                          <p class="amount" style="margin:0;padding:0;color:#000000;font-size:36px;font-weight:700;letter-spacing:-1px;line-height:1;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">$${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </td>
                        <td align="right" valign="top">
                          ${daysOverdue > 0 ? `
                          <p style="margin:0;padding:0;color:#d32f2f;font-size:13px;font-weight:500;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</p>
                          ` : `
                          <p style="margin:0;padding:0;color:#666666;font-size:13px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Due ${new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          `}
                        </td>
                      </tr>
                      ${lateFeesAmount > 0 ? `
                      <tr>
                        <td colspan="2" style="padding-top:16px;border-top:1px solid #e8e8e8;">
                          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;padding:0;color:#666666;font-size:13px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Late fee</p>
                              </td>
                              <td align="right">
                                <p style="margin:0;padding:0;color:#d32f2f;font-size:15px;font-weight:600;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">+$${lateFeesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td class="pad" style="padding:0 40px;">
              <p style="margin:0 0 12px 0;padding:0;color:#000000;font-size:16px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${getGreeting()}
              </p>
              <p style="margin:0 0 32px 0;padding:0;color:#333333;font-size:15px;line-height:1.7;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${getMessage()}
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${baseUrl}/invoice/${encodeURIComponent(invoice.public_token)}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="0%" stroke="f" fillcolor="#000000">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:500;">View Invoice</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${baseUrl}/invoice/${encodeURIComponent(invoice.public_token)}" 
                       style="display:inline-block;width:240px;background-color:#000000;color:#ffffff;text-decoration:none;padding:14px 0;text-align:center;font-size:15px;font-weight:500;letter-spacing:0.2px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;mso-hide:all;">
                      View Invoice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td class="pad" style="padding:0 40px 24px;">
              <p style="margin:0;padding:0;color:#333333;font-size:15px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${getClosing()}
              </p>
            </td>
          </tr>

          ${businessSettings?.payment_notes ? `
          <!-- Payment Info -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e8e8;padding-top:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;padding:0;color:#000000;font-size:13px;font-weight:500;letter-spacing:0.2px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Payment Details</p>
                    <p style="margin:0;padding:0;color:#666666;font-size:14px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${businessSettings.payment_notes}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td class="pad" style="padding:32px 40px;border-top:1px solid #f0f0f0;">
              <p style="margin:0 0 4px 0;padding:0;color:#999999;font-size:12px;line-height:1.5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${businessSettings?.business_email ? businessSettings.business_email : ''}
              </p>
              <p style="margin:0;padding:0;color:#999999;font-size:11px;line-height:1.5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Automated reminder
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
