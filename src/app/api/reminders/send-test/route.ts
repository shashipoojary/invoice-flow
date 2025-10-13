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
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice details with user settings
    const { data: invoice, error: invoiceError } = await supabase
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
        clients (
          name,
          email,
          company
        ),
        user_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
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
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (!isOverdue) {
      return NextResponse.json({ error: 'Invoice is not overdue yet' }, { status: 400 });
    }

    // Get user settings for payment methods and business info
    const { data: userData } = await supabase
      .from('user_settings')
      .select('business_settings, payment_methods')
      .eq('user_id', invoice.user_id)
      .single();

    const userSettings = userData?.payment_methods || {};
    const businessSettings = userData?.business_settings || {};

    // Determine reminder type based on settings
    const reminderCount = invoice.reminder_count || 0;
    let actualReminderType = 'first';
    
    if (reminderSettings.useSystemDefaults) {
      // Use system defaults - determine type by count
      if (reminderCount >= 2) {
        actualReminderType = 'final';
      } else if (reminderCount >= 1) {
        actualReminderType = 'second';
      }
    } else {
      // Use custom rules - handle both before and after due date
      const customRules = reminderSettings.customRules || reminderSettings.rules || [];
      const enabledRules = customRules.filter((rule: any) => rule.enabled);
      
      if (enabledRules.length > 0) {
        let matchingRule = null;
        
        if (daysOverdue < 0) {
          // Invoice is not yet due - check for "before" reminders
          const daysUntilDue = Math.abs(daysOverdue);
          const beforeRules = enabledRules.filter((rule: any) => rule.type === 'before');
          matchingRule = beforeRules
            .sort((a: any, b: any) => a.days - b.days) // Sort by days ascending (closest first)
            .find((rule: any) => daysUntilDue <= rule.days);
        } else {
          // Invoice is overdue - check for "after" reminders
          const afterRules = enabledRules.filter((rule: any) => rule.type === 'after');
          matchingRule = afterRules
            .sort((a: any, b: any) => b.days - a.days) // Sort by days descending (highest first)
            .find((rule: any) => daysOverdue >= rule.days);
        }
        
        if (matchingRule) {
          actualReminderType = matchingRule.type || 'friendly';
        }
      }
    }

    // Create reminder message based on type
    const reminderMessages = {
      first: 'Your invoice is now overdue. Please make payment as soon as possible.',
      second: 'This is a second reminder for your overdue invoice.',
      final: 'This is a final notice for your overdue invoice.'
    };
    const reminderMessage = reminderMessages[actualReminderType as keyof typeof reminderMessages] || reminderMessages.first;

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
                <a href="https://invoice-flow-vert.vercel.app/invoice/${invoice.public_token}" 
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

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'InvoiceFlow <noreply@invoiceflow.com>',
      to: invoice.clients?.[0]?.email || '',
      subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      return NextResponse.json({ 
        error: 'Failed to send reminder email', 
        details: emailResult.error.message || emailResult.error,
        hasApiKey: !!process.env.RESEND_API_KEY
      }, { status: 500 });
    }

    // Update invoice with reminder count
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update reminder count:', updateError);
      // Don't fail the request if we can't update the count
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.clients?.[0]?.name || 'Unknown',
        clientEmail: invoice.clients?.[0]?.email || 'No email',
        daysOverdue,
        total: invoice.total
      },
      reminderType: actualReminderType,
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error in send-test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
