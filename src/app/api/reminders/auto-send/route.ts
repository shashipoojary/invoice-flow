import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  return NextResponse.json({ 
    message: 'Auto-send reminders endpoint is working',
    cronSchedule: '0 9 * * * (Daily at 9:00 AM UTC)',
    status: 'active'
  });
}

// Function to send reminder email
async function sendReminderEmail(invoice: any, reminderType: string, overdueDays: number) {
  const { data, error } = await resend.emails.send({
    from: 'FlowInvoicer <noreply@flowinvoicer.com>',
    to: [invoice.clients.email],
    subject: `Payment Reminder - Invoice ${invoice.invoice_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        <p>Dear ${invoice.clients.name},</p>
        <p>This is a ${reminderType} reminder that payment is ${overdueDays > 0 ? 'overdue' : 'due'} for Invoice ${invoice.invoice_number}.</p>
        <p><strong>Amount Due:</strong> $${invoice.total.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p>Please remit payment at your earliest convenience.</p>
        <p>Thank you for your business!</p>
      </div>
    `
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    // Log environment for debugging (optional)
    console.log('Cron job running in:', process.env.NODE_ENV);
    
    // Verify cron job authorization
    // Vercel cron jobs automatically include the x-vercel-cron header
    const cronTrigger = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow if called by Vercel cron (x-vercel-cron header present)
    // OR if authorization header matches CRON_SECRET (for manual testing)
    // If CRON_SECRET is not set, allow all (development mode)
    if (!cronTrigger && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all scheduled reminders that are due to be sent
    // Query reminders where sent_at is less than or equal to now
    const now = new Date().toISOString();
    const { data: scheduledReminders, error: remindersError } = await supabase
      .from('invoice_reminders')
      .select(`
        *,
        invoices (
          *,
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
      .lte('sent_at', now);

    if (remindersError) {
      console.error('Error fetching scheduled reminders:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch scheduled reminders' }, { status: 500 });
    }

    if (!scheduledReminders || scheduledReminders.length === 0) {
      console.log('✅ No scheduled reminders found to send');
      return NextResponse.json({ 
        message: 'No scheduled reminders found to send',
        summary: { totalFound: 0, processed: 0, success: 0, errors: 0 }
      });
    }

    const sentReminders = [];
    let successCount = 0;
    let errorCount = 0;

    for (const reminder of scheduledReminders) {
      const invoice = reminder.invoices;
      
      // Skip if invoice doesn't exist or is null
      if (!invoice) {
        console.log(`Skipping reminder ${reminder.id} - invoice not found`);
        continue;
      }
      
      // Skip if invoice is paid (always skip paid invoices)
      if (invoice.status === 'paid') {
        console.log(`Skipping reminder for invoice ${invoice.invoice_number} - invoice is already paid`);
        // Update reminder status to indicate it was skipped
        await supabase
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Invoice already paid'
          })
          .eq('id', reminder.id);
        continue;
      }
      
      // Skip if invoice is not in 'sent' or 'pending' status (both can receive reminders)
      if (invoice.status !== 'sent' && invoice.status !== 'pending') {
        console.log(`Skipping reminder for invoice ${invoice.invoice_number} - status is ${invoice.status}`);
        continue;
      }
      
      // Skip if client email is missing
      if (!invoice.clients || !invoice.clients.email) {
        console.log(`Skipping reminder for invoice ${invoice.invoice_number} - client email missing`);
        await supabase
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Client email missing'
          })
          .eq('id', reminder.id);
        continue;
      }

      try {
        // Send the reminder email
        const emailResult = await sendReminderEmail(invoice, reminder.reminder_type, reminder.overdue_days);
        
        // Update reminder status to sent with actual sent timestamp
        const { error: updateError } = await supabase
          .from('invoice_reminders')
          .update({
            reminder_status: 'sent',
            email_id: emailResult.id || null,
            sent_at: new Date().toISOString() // Update to actual sent time
          })
          .eq('id', reminder.id);
        
        if (updateError) {
          console.error(`Failed to update reminder ${reminder.id} status:`, updateError);
        }

        sentReminders.push({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.clients.name,
          status: 'sent',
          emailId: emailResult.id
        });

        successCount++;
        console.log(`✅ Sent ${reminder.reminder_type} reminder for invoice ${invoice.invoice_number}`);
      } catch (error) {
        console.error(`❌ Failed to send reminder for invoice ${invoice.invoice_number}:`, error);
        
        // Update reminder status to failed
        await supabase
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', reminder.id);

        sentReminders.push({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.clients.name,
          status: 'failed'
        });

        errorCount++;
      }
    }

    const summary = {
      totalFound: scheduledReminders.length,
      processed: sentReminders.length,
      success: successCount,
      errors: errorCount
    };

    console.log(`📊 Reminder processing complete:`, summary);

    return NextResponse.json({
      success: true,
      message: `Processed ${sentReminders.length} scheduled reminders`,
      summary,
      results: sentReminders
    });

  } catch (error) {
    console.error('❌ Auto-send reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
