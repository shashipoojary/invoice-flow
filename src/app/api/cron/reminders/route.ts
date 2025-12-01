import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you can add authentication here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting automated reminder cron job...');

    // Get all scheduled reminders that are due to be sent today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data: scheduledReminders, error: remindersError } = await supabaseAdmin
      .from('invoice_reminders')
      .select(`
        *,
        invoices!inner (
          id,
          invoice_number,
          due_date,
          status,
          total,
          public_token,
          reminder_count,
          last_reminder_sent,
          user_id,
          clients (
            name,
            email,
            company,
            phone,
            address
          )
        )
      `)
      .eq('reminder_status', 'scheduled')
      .eq('invoices.status', 'sent')
      .gte('sent_at', todayStart.toISOString())
      .lt('sent_at', todayEnd.toISOString());

    if (remindersError) {
      console.error('Error fetching scheduled reminders:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch scheduled reminders' }, { status: 500 });
    }

    if (!scheduledReminders || scheduledReminders.length === 0) {
      console.log('✅ No scheduled reminders found for today');
      return NextResponse.json({ message: 'No scheduled reminders found for today' });
    }

    console.log(`📊 Found ${scheduledReminders.length} scheduled reminders to send today`);

    let remindersSent = 0;
    let errors = 0;

    // Helper function to delay execution (respects Resend rate limit: 2 requests per second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const reminder of scheduledReminders) {
      try {
        const invoice = reminder.invoices;
        console.log(`📧 Processing scheduled reminder for ${invoice.invoice_number} (${reminder.reminder_type})`);
        
        // Send the reminder email
        const emailResult = await sendReminderEmail(invoice, reminder.reminder_type, `Scheduled ${reminder.reminder_type} reminder`);
        
        if (emailResult.success) {
          // Update the reminder status to sent
          const { error: updateError } = await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'sent',
              email_id: emailResult.emailId,
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          if (updateError) {
            console.error(`Error updating reminder status for ${invoice.invoice_number}:`, updateError);
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

          remindersSent++;
          console.log(`✅ Reminder sent for ${invoice.invoice_number}`);
          
          // Rate limiting: Wait 600ms between email sends to respect Resend's free plan limit of 2 requests/second
          // Free plan: max 2 requests/second = minimum 500ms between requests
          // Using 600ms to be safe and avoid hitting the limit
          // Note: This can be reduced if upgrading to a paid Resend plan with higher limits
          await delay(600);
        } else {
          // Mark as failed with helpful error message
          const failureReason = emailResult.failureReason || (emailResult.error as any)?.message || 'Email sending failed';
          
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'failed',
              failure_reason: failureReason,
              updated_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          console.error(`❌ Failed to send reminder for ${invoice.invoice_number}:`, {
            error: emailResult.error,
            failureReason,
            isDomainError: emailResult.isDomainError,
            isRateLimitError: emailResult.isRateLimitError,
            isSendingToOwnEmail: emailResult.isSendingToOwnEmail
          });
          errors++;
        }

      } catch (error) {
        console.error(`Error processing reminder for ${reminder.invoices.invoice_number}:`, error);
        
        // Mark as failed
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', reminder.id);
        
        errors++;
      }
    }

    const result = {
      message: 'Automated reminder cron job completed',
      scheduledRemindersFound: scheduledReminders.length,
      remindersSent,
      errors
    };

    console.log('✅ Automated reminder cron job completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in automated reminder cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendReminderEmail(invoice: any, reminderType: string, _reason: string) {
  try {
    // Validate client email
    const clientEmail = invoice.clients?.email;
    if (!clientEmail || typeof clientEmail !== 'string') {
      throw new Error('Client email is required and must be valid');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = clientEmail.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Invalid email format');
    }

    // Get user email to verify if sending to own email (for free plan check)
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
    
    const recipientEmail = cleanEmail;
    const isSendingToOwnEmail = userEmail && recipientEmail === userEmail;
    
    console.log('Auto reminder email check:', {
      userEmail,
      recipientEmail,
      isSendingToOwnEmail,
      invoiceNumber: invoice.invoice_number
    });

    // Get ALL user business settings from user_settings table (properly isolated per user)
    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, business_email, business_phone, business_address, email_from_address, payment_notes, paypal_email, cashapp_id, venmo_id, google_pay_upi, apple_pay_id, bank_account, bank_ifsc_swift, bank_iban, stripe_account')
      .eq('user_id', invoice.user_id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

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
          return `Hi ${invoice.clients?.name || 'there'},`;
        case 'polite':
          return `Dear ${invoice.clients?.name || 'Valued Customer'},`;
        case 'firm':
          return `Hello ${invoice.clients?.name || 'Valued Customer'},`;
        case 'urgent':
          return `${invoice.clients?.name || 'Valued Customer'},`;
        default:
          return `Dear ${invoice.clients?.name || 'Valued Customer'},`;
      }
    };

    const getMessage = () => {
      const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));
      
      switch (reminderType) {
        case 'friendly':
          return `This is a friendly reminder that invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is now due.`;
        case 'polite':
          return `This is a reminder that invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue.`;
        case 'firm':
          return `Invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is ${overdueDays} days overdue. Immediate payment is required.`;
        case 'urgent':
          return `URGENT: Invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is ${overdueDays} days overdue. Payment required immediately.`;
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

    const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));

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
                      ${businessSettings?.business_name || 'Invoice Reminder'}
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
                          <p class="amount" style="margin:0;padding:0;color:#000000;font-size:36px;font-weight:700;letter-spacing:-1px;line-height:1;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">$${invoice.total.toLocaleString()}</p>
                        </td>
                        <td align="right" valign="top">
                          ${overdueDays > 0 ? `
                          <p style="margin:0;padding:0;color:#d32f2f;font-size:13px;font-weight:500;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue</p>
                          ` : `
                          <p style="margin:0;padding:0;color:#666666;font-size:13px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Due ${new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          `}
                        </td>
                      </tr>
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
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="0%" stroke="f" fillcolor="#000000">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:500;">View Invoice</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}" 
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

    // Determine the from address using businessSettings we already fetched above
    // Use Resend free plan default email address
    const fromAddress = `${businessSettings.business_name || 'FlowInvoicer'} <onboarding@resend.dev>`;

    // Send email using Resend (use plain email address for free plan compatibility)
    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
      html: emailHtml,
    });

    if (emailResult.error) {
      const errorMessage = emailResult.error.message || '';
      
      // Check for free plan limitations
      const isDomainError = errorMessage.includes('domain is not verified') || 
                           errorMessage.includes('verify your domain') ||
                           errorMessage.includes('only send testing emails to your own email');
      const isRateLimitError = errorMessage.includes('Too many requests') || 
                              errorMessage.includes('rate limit') ||
                              errorMessage.includes('2 requests per second');
      
      // Provide helpful error messages for free plan issues
      let failureReason = errorMessage;
      if (isDomainError && !isSendingToOwnEmail) {
        failureReason = 'Free plan restriction: Can only send to your own email. Verify domain at resend.com/domains to send to clients.';
      } else if (isDomainError && isSendingToOwnEmail) {
        failureReason = `Email sending failed: ${errorMessage}. If sending to own email, check Resend API key configuration.`;
      } else if (isRateLimitError) {
        failureReason = 'Rate limit exceeded (Free plan: 2 requests/second). Please wait and try again.';
      }
      
      console.error('Email sending failed:', {
        errorMessage,
        recipientEmail,
        userEmail,
        isSendingToOwnEmail,
        fromAddress,
        failureReason
      });
      
      return { 
        success: false, 
        error: emailResult.error,
        failureReason,
        isDomainError,
        isRateLimitError,
        isSendingToOwnEmail
      };
    }

    return { success: true, emailId: emailResult.data?.id };

  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error };
  }
}
