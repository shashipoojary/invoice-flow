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

    // Get invoice details with reminder settings
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
                Dear ${invoice.clients?.[0]?.name || 'Valued Customer'},
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
                  <span style="color: #dc2626; font-weight: 500;">${Math.max(0, daysOverdue)}</span>
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
      to: invoice.clients?.[0]?.email || '',
      subject: `Payment Reminder - Invoice #${invoice.invoice_number}`,
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      
      // Record failed reminder
      const { error: reminderError } = await supabaseAdmin
        .from('invoice_reminders')
        .insert({
          invoice_id: invoice.id,
          reminder_type: reminderType,
          overdue_days: daysOverdue,
          email_id: null,
          reminder_status: 'failed',
          failure_reason: emailResult.error.message || 'Email sending failed'
        });

      return NextResponse.json({ 
        error: 'Failed to send reminder email', 
        details: emailResult.error.message || emailResult.error,
        hasApiKey: !!process.env.RESEND_API_KEY
      }, { status: 500 });
    }

    // Record successful reminder
    const { data: reminderData, error: reminderError } = await supabaseAdmin
      .from('invoice_reminders')
      .insert({
        invoice_id: invoice.id,
        reminder_type: reminderType,
        overdue_days: daysOverdue,
        email_id: emailResult.data?.id,
        reminder_status: 'sent'
      })
      .select()
      .single();

    if (reminderError) {
      console.error('Error recording reminder:', reminderError);
    }

    // Update invoice with reminder count
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice reminder count:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully',
      reminderId: reminderData?.id,
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}