import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (optional security)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Auto reminder job started...');

    // Get all overdue invoices that need reminders
    const { data: overdueInvoices, error: invoicesError } = await supabase
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
        reminders,
        clients (
          name,
          email,
          company
        ),
        user_id
      `)
      .eq('status', 'sent')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (invoicesError) {
      console.error('Error fetching overdue invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      console.log('✅ No overdue invoices found');
      return NextResponse.json({ 
        success: true, 
        message: 'No overdue invoices found',
        processed: 0 
      });
    }

    console.log(`📧 Found ${overdueInvoices.length} overdue invoices`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const invoice of overdueInvoices) {
      try {
        processedCount++;
        
        // Check if auto reminders are enabled for this invoice
        let reminderSettings = null;
        try {
          reminderSettings = invoice.reminders ? JSON.parse(invoice.reminders) : null;
        } catch {
          console.log(`⚠️ Invalid reminder settings for invoice ${invoice.invoice_number}`);
        }

        // Skip if auto reminders are not enabled
        if (!reminderSettings || !reminderSettings.enabled) {
          console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - auto reminders disabled`);
          continue;
        }
        
        // Determine reminder type based on count
        const reminderCount = invoice.reminder_count || 0;
        let reminderType = 'first';
        
        if (reminderCount >= 2) {
          reminderType = 'final';
        } else if (reminderCount >= 1) {
          reminderType = 'second';
        }

        // Check if we should send a reminder (max 3 reminders)
        if (reminderCount >= 3) {
          console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - max reminders reached`);
          continue;
        }

        // Check if we sent a reminder recently (avoid spam - wait 24 hours between reminders)
        if (invoice.last_reminder_sent) {
          const lastSent = new Date(invoice.last_reminder_sent);
          const hoursSinceLastSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastSent < 24) {
            console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - reminder sent recently`);
            continue;
          }
        }

        console.log(`📤 Sending ${reminderType} reminder for invoice ${invoice.invoice_number} to ${invoice.clients?.[0]?.email}`);

        // Get user settings for payment methods and business info
        const { data: userData } = await supabase
          .from('user_settings')
          .select('business_settings, payment_methods')
          .eq('user_id', invoice.user_id)
          .single();

        const userSettings = userData?.payment_methods || {};
        const businessSettings = userData?.business_settings || {};

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Create reminder message
        const reminderMessages = {
          first: 'Your invoice is now overdue. Please make payment as soon as possible.',
          second: 'This is a second reminder for your overdue invoice. Please arrange payment to avoid further delays.',
          final: 'This is a final notice for your overdue invoice. Please contact us immediately to resolve this matter.'
        };
        const reminderMessage = reminderMessages[reminderType as keyof typeof reminderMessages];

        // Create clean overdue email template (similar to fast invoice)
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
                        ${businessSettings.businessName || 'Business Name'}
                      </h2>
                    </div>
                    <div style="text-align: right; flex: 0 0 auto; max-width: 50%; margin-left: auto;">
                      <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Amount Due</div>
                      <div style="color: #dc2626; font-size: 24px; font-weight: 700;">$${invoice.total.toLocaleString()}</div>
                    </div>
                  </div>
                  
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px; line-height: 1.5;">
                Dear ${invoice.clients?.[0]?.name || 'Valued Client'},
              </p>
                  
                  <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.5;">
                    ${reminderMessage}
                  </p>

                  <!-- Invoice Details -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                      Invoice Details
                    </h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #64748b; font-size: 14px;">Invoice #:</span>
                      <span style="color: #1e293b; font-size: 14px; font-weight: 500;">${invoice.invoice_number}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #64748b; font-size: 14px;">Due Date:</span>
                      <span style="color: #1e293b; font-size: 14px; font-weight: 500;">${new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #64748b; font-size: 14px;">Days Overdue:</span>
                      <span style="color: #dc2626; font-size: 14px; font-weight: 500;">${daysOverdue} days</span>
                    </div>
                  </div>

                  <!-- Payment Information -->
                  ${userSettings && Object.keys(userSettings).length > 0 ? `
                    <div style="margin: 24px 0;">
                      <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                        Payment Methods
                      </h3>
                      <div style="color: #475569; font-size: 14px; line-height: 1.6;">
                        ${Object.entries(userSettings)
                          .filter(([, value]) => value && value !== '')
                          .map(([method, details]) => {
                            const methodNames = {
                              paypal: 'PayPal',
                              cashapp: 'Cash App',
                              venmo: 'Venmo',
                              googlepay: 'Google Pay',
                              applepay: 'Apple Pay',
                              bankTransfer: 'Bank Transfer',
                              stripe: 'Stripe',
                              other: 'Other'
                            };
                            return `<div style="margin-bottom: 12px;"><strong>${methodNames[method as keyof typeof methodNames] || method}:</strong> ${details}</div>`;
                          }).join('')}
                      </div>
                    </div>
                  ` : ''}

                  <!-- View Invoice Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}" 
                       style="display: inline-block; background-color: #0D9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;">
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
                    Powered by <a href="https://invoiceflow.com" style="color: #0D9488; text-decoration: none;">InvoiceFlow</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

        // Send email
        const emailResult = await resend.emails.send({
          from: 'InvoiceFlow <noreply@invoiceflow.com>',
          to: invoice.clients?.[0]?.email || '',
          subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
          html: emailHtml,
        });

        if (emailResult.error) {
          console.error(`❌ Failed to send email for invoice ${invoice.invoice_number}:`, emailResult.error);
          errorCount++;
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            status: 'error',
            error: emailResult.error.message || 'Email sending failed'
          });
          continue;
        }

        // Update invoice with reminder count
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            reminder_count: reminderCount + 1,
            last_reminder_sent: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        if (updateError) {
          console.error(`⚠️ Failed to update reminder count for invoice ${invoice.invoice_number}:`, updateError);
        }

        successCount++;
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          clientEmail: invoice.clients?.[0]?.email,
          reminderType,
          daysOverdue,
          status: 'success',
          emailId: emailResult.data?.id
        });

        console.log(`✅ Sent ${reminderType} reminder for invoice ${invoice.invoice_number}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.invoice_number}:`, error);
        errorCount++;
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Auto reminder job completed: ${successCount} sent, ${errorCount} errors, ${processedCount} processed`);

    return NextResponse.json({
      success: true,
      message: 'Auto reminder job completed',
      summary: {
        totalFound: overdueInvoices.length,
        processed: processedCount,
        success: successCount,
        errors: errorCount
      },
      results
    });

  } catch (error) {
    console.error('❌ Auto reminder job failed:', error);
    return NextResponse.json(
      { error: 'Auto reminder job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}