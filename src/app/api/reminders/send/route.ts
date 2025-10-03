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
    const { invoiceId, reminderType = 'first' } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice details with client and user settings
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company
        ),
        users!invoices_user_id_fkey (
          id,
          business_settings,
          user_settings
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice is overdue
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const isOverdue = today > dueDate;

    if (!isOverdue && reminderType === 'first') {
      return NextResponse.json({ error: 'Invoice is not overdue yet' }, { status: 400 });
    }

    // Get user settings for reminder preferences
    const userSettings = invoice.users?.user_settings || {};
    const businessSettings = invoice.users?.business_settings || {};

    // Check reminder frequency settings
    const reminderSettings = userSettings.reminders || {
      enabled: true,
      frequency: 'weekly',
      maxReminders: 3,
      templates: {
        first: 'Your invoice is now overdue. Please make payment as soon as possible.',
        second: 'This is a second reminder for your overdue invoice.',
        final: 'This is a final notice for your overdue invoice.'
      }
    };

    if (!reminderSettings.enabled) {
      return NextResponse.json({ error: 'Auto reminders are disabled' }, { status: 400 });
    }

    // Check if we've already sent the maximum number of reminders
    const reminderCount = invoice.reminder_count || 0;
    if (reminderCount >= reminderSettings.maxReminders) {
      return NextResponse.json({ error: 'Maximum reminders already sent' }, { status: 400 });
    }

    // Calculate days overdue
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get reminder template based on type
    const reminderMessage = reminderSettings.templates[reminderType] || reminderSettings.templates.first;

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
            <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h1 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 600;">
                ${businessSettings.businessName || 'Invoice Reminder'}
              </h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
                Payment Reminder
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px; line-height: 1.5;">
                Dear ${invoice.clients.name || 'Valued Client'},
              </p>
              
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px; line-height: 1.5;">
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
                  <span style="color: #64748b; font-size: 14px;">Amount:</span>
                  <span style="color: #1e293b; font-size: 14px; font-weight: 500;">$${invoice.total.toLocaleString()}</span>
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
              ${userSettings.paymentMethods ? `
                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin: 0 0 16px 0; color: #0369a1; font-size: 16px; font-weight: 600;">
                    Payment Methods
                  </h3>
                  <div style="color: #0369a1; font-size: 14px; line-height: 1.5;">
                    ${Object.entries(userSettings.paymentMethods)
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
                        return `<div style="margin-bottom: 8px;"><strong>${methodNames[method as keyof typeof methodNames] || method}:</strong> ${details}</div>`;
                      }).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- View Invoice Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.publicToken}" 
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
                Powered by <a href="https://invoiceflow.com" style="color: #3b82f6; text-decoration: none;">InvoiceFlow</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'InvoiceFlow <noreply@invoiceflow.com>',
      to: invoice.clients.email,
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

    // Update invoice with reminder count and last reminder date
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        reminder_count: reminderCount + 1,
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
      reminderCount: reminderCount + 1,
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
