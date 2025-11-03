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
        } else {
          // Mark as failed
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'failed',
              failure_reason: (emailResult.error as any)?.message || 'Email sending failed'
            })
            .eq('id', reminder.id);

          console.error(`❌ Failed to send reminder for ${invoice.invoice_number}:`, emailResult.error);
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

async function sendReminderEmail(invoice: any, reminderType: string, reason: string) {
  try {
    // Get user business settings
    const { data: businessSettings } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    // Create reminder message based on type
    const reminderMessages = {
      friendly: 'This is a friendly reminder that your invoice is now due. Please make payment at your earliest convenience.',
      polite: 'This is a polite reminder that your invoice is overdue. Please arrange payment as soon as possible.',
      firm: 'This is a firm reminder that your invoice is significantly overdue. Please make payment immediately to avoid further action.',
      urgent: 'This is an urgent final notice. Your invoice is severely overdue and requires immediate payment.'
    };

    const reminderMessage = reminderMessages[reminderType as keyof typeof reminderMessages] || reminderMessages.friendly;

    // Create professional reminder email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background-color: #0D9488; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 1px;">
                PAYMENT REMINDER
              </h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 32px 24px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div style="flex: 0 0 auto; max-width: 50%;">
                  <h2 style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 600;">
                    Invoice #${invoice.invoice_number}
                  </h2>
                  <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">
                    ${businessSettings?.business_name || 'Business Name'}
                  </p>
                </div>
                <div style="text-align: right;">
                  <div style="color: #dc2626; font-size: 18px; font-weight: 600;">
                    $${invoice.total.toLocaleString()}
                  </div>
                  <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">
                    Due: ${new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 500;">
                  ${reminderMessage}
                </p>
              </div>

              <p style="margin: 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear ${invoice.clients?.name || 'Valued Customer'},
              </p>

              <p style="margin: 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We hope this message finds you well. This is an automated reminder regarding your outstanding invoice.
              </p>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Invoice Details</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b;">Invoice Number:</span>
                  <span style="color: #1e293b; font-weight: 500;">#${invoice.invoice_number}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b;">Amount Due:</span>
                  <span style="color: #1e293b; font-weight: 500;">$${invoice.total.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b;">Due Date:</span>
                  <span style="color: #1e293b; font-weight: 500;">${new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Days Overdue:</span>
                  <span style="color: #dc2626; font-weight: 500;">${Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))}</span>
                </div>
              </div>

              <p style="margin: 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Please review your invoice and make payment at your earliest convenience. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.
              </p>

              ${businessSettings?.payment_notes ? `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <h4 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 14px; font-weight: 600;">Payment Information</h4>
                  <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.5;">
                    ${businessSettings.payment_notes}
                  </p>
                </div>
              ` : ''}

              <!-- View Invoice Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}" 
                   style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                  View Invoice Online
                </a>
              </div>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                If you have already made payment, please disregard this reminder. Thank you for your business.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Powered by <a href="https://flowinvoicer.com" style="color: #3b82f6; text-decoration: none;">FlowInvoicer</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'FlowInvoicer <onboarding@resend.dev>',
      to: invoice.clients?.email || '',
      subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
      html: emailHtml,
    });

    if (emailResult.error) {
      return { success: false, error: emailResult.error };
    }

    return { success: true, emailId: emailResult.data?.id };

  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error };
  }
}
