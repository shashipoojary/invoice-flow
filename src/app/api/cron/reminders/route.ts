import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getReminderSchedule } from '@/lib/reminder-email-templates';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(_request: NextRequest) {
  try {
    console.log('🔄 Starting auto-reminder cron job...');
    
    // Get all sent invoices that are overdue
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (invoicesError) {
      console.error('❌ Error fetching overdue invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    console.log(`📊 Found ${overdueInvoices?.length || 0} overdue invoices`);

    const reminderSchedule = getReminderSchedule();
    const sentReminders = [];
    const errors = [];

    for (const invoice of overdueInvoices || []) {
      try {
        // Skip if reminders are disabled for this invoice
        if (!invoice.reminder_settings?.enabled) {
          console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - reminders disabled`);
          continue;
        }

        const dueDate = new Date(invoice.due_date);
        const currentDate = new Date();
        const overdueDays = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Find the appropriate reminder type based on overdue days
        const reminderConfig = reminderSchedule
          .sort((a, b) => b.days - a.days) // Sort by days descending
          .find(config => overdueDays >= config.days);

        if (!reminderConfig) {
          console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - no matching reminder config`);
          continue;
        }

        // Check if we've already sent this type of reminder for this invoice
        const { data: existingReminder } = await supabase
          .from('invoice_reminders')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', reminderConfig.type)
          .single();

        if (existingReminder) {
          console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - ${reminderConfig.type} reminder already sent`);
          continue;
        }

        // Fetch business settings for this invoice
        const { data: businessSettings, error: settingsError } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', invoice.user_id)
          .single();

        if (settingsError || !businessSettings) {
          console.error(`❌ Business settings not found for invoice ${invoice.invoice_number}`);
          errors.push(`Business settings not found for invoice ${invoice.invoice_number}`);
          continue;
        }

        // Generate email template
        const emailTemplate = getReminderEmailTemplate(
          invoice,
          businessSettings,
          reminderConfig.type,
          overdueDays
        );

        // Send email
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: `${businessSettings.business_name} <${businessSettings.email || 'noreply@invoiceflow.com'}>`,
          to: [invoice.clients.email],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        if (emailError) {
          console.error(`❌ Error sending email for invoice ${invoice.invoice_number}:`, emailError);
          errors.push(`Failed to send email for invoice ${invoice.invoice_number}`);
          continue;
        }

        // Log the reminder in database
        const { error: logError } = await supabase
          .from('invoice_reminders')
          .insert({
            invoice_id: invoice.id,
            reminder_type: reminderConfig.type,
            overdue_days: overdueDays,
            sent_at: new Date().toISOString(),
            email_id: emailData?.id
          });

        if (logError) {
          console.error(`❌ Error logging reminder for invoice ${invoice.invoice_number}:`, logError);
        }

        sentReminders.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          reminderType: reminderConfig.type,
          overdueDays: overdueDays,
          clientEmail: invoice.clients.email
        });

        console.log(`✅ Sent ${reminderConfig.type} reminder for invoice ${invoice.invoice_number} to ${invoice.clients.email}`);

      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.invoice_number}:`, error);
        errors.push(`Error processing invoice ${invoice.invoice_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const result = {
      success: true,
      message: `Auto-reminder cron job completed`,
      processed: overdueInvoices?.length || 0,
      sentReminders: sentReminders.length,
      errors: errors.length,
      details: {
        sentReminders,
        errors
      }
    };

    console.log('✅ Auto-reminder cron job completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error in auto-reminder cron job:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
