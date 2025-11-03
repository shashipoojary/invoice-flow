import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

// Initialize Resend only if API key exists
let resend: Resend | null = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

// Shared processing logic for both GET (cron) and POST (manual)
async function processReminders(request: NextRequest) {
  try {
    // Log environment for debugging
    console.log('🚀 Auto-send reminders cron job started');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Timestamp:', new Date().toISOString());
    
    // Check if email service is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error('❌ RESEND_API_KEY not configured - cannot send reminder emails');
      return NextResponse.json({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY is required to send reminder emails'
      }, { status: 500 });
    }
    
    // Verify cron job authorization
    // Vercel cron jobs automatically include the x-vercel-cron header
    const cronTrigger = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow if called by Vercel cron (x-vercel-cron header present)
    // OR if authorization header matches CRON_SECRET (for manual testing)
    // If CRON_SECRET is not set, allow all (development mode)
    if (!cronTrigger && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized request - missing cron trigger or invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (cronTrigger) {
      console.log('✅ Authorized: Vercel cron job detected');
    } else if (authHeader) {
      console.log('✅ Authorized: Manual trigger with secret');
    } else {
      console.log('⚠️ No authorization header - proceeding in development mode');
    }

    // Get all scheduled reminders that are due to be sent
    // Query reminders where sent_at is less than or equal to now
    const now = new Date().toISOString();
    console.log('📅 Looking for reminders scheduled before:', now);
    
    const { data: scheduledReminders, error: remindersError } = await supabaseAdmin
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
      console.error('❌ Error fetching scheduled reminders:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch scheduled reminders' }, { status: 500 });
    }

    if (!scheduledReminders || scheduledReminders.length === 0) {
      console.log('✅ No scheduled reminders found to send');
      return NextResponse.json({ 
        message: 'No scheduled reminders found to send',
        summary: { totalFound: 0, processed: 0, success: 0, errors: 0 }
      });
    }

    console.log(`📧 Found ${scheduledReminders.length} scheduled reminder(s) to process`);

    const sentReminders = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const reminder of scheduledReminders) {
      const invoice = reminder.invoices;
      
      // Skip if invoice doesn't exist or is null
      if (!invoice) {
        console.log(`⏭️ Skipping reminder ${reminder.id} - invoice not found`);
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Invoice not found'
          })
          .eq('id', reminder.id);
        skippedCount++;
        continue;
      }
      
      // Skip if invoice is paid (always skip paid invoices)
      if (invoice.status === 'paid') {
        console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - invoice is already paid`);
        // Update reminder status to indicate it was skipped
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Invoice already paid'
          })
          .eq('id', reminder.id);
        skippedCount++;
        continue;
      }
      
      // Skip if invoice is not in 'sent' or 'pending' status (both can receive reminders)
      if (invoice.status !== 'sent' && invoice.status !== 'pending') {
        console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - status is ${invoice.status}`);
        skippedCount++;
        continue;
      }
      
      // Skip if client email is missing
      if (!invoice.clients || !invoice.clients.email) {
        console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - client email missing`);
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Client email missing'
          })
          .eq('id', reminder.id);
        errorCount++;
        continue;
      }

      try {
        // Double-check reminder is still scheduled before processing (prevent race conditions)
        const { data: currentReminder } = await supabaseAdmin
          .from('invoice_reminders')
          .select('reminder_status')
          .eq('id', reminder.id)
          .single();
        
        if (currentReminder?.reminder_status !== 'scheduled') {
          console.log(`⏭️ Skipping reminder ${reminder.id} - already processed (status: ${currentReminder?.reminder_status})`);
          skippedCount++;
          continue;
        }
        
        console.log(`📤 Sending ${reminder.reminder_type} reminder for invoice ${invoice.invoice_number} to ${invoice.clients.email}`);
        
        // Send the reminder email
        const emailResult = await sendReminderEmail(invoice, reminder.reminder_type, reminder.overdue_days);
        
        console.log(`✅ Email sent successfully - ID: ${emailResult.id}`);
        
        const now = new Date().toISOString();
        
        // Update reminder status to sent with actual sent timestamp
        const { error: updateError } = await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'sent',
            email_id: emailResult.id || null,
            sent_at: now // Update to actual sent time
          })
          .eq('id', reminder.id);
        
        if (updateError) {
          console.error(`❌ Failed to update reminder ${reminder.id} status:`, updateError);
        } else {
          console.log(`✅ Updated reminder ${reminder.id} status to 'sent'`);
          
          // Also update invoice reminder count and last reminder sent date
          await supabaseAdmin
            .from('invoices')
            .update({
              reminder_count: ((invoice.reminder_count || 0) + 1),
              last_reminder_sent: now,
              updated_at: now
            })
            .eq('id', invoice.id);
        }

        sentReminders.push({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.clients.name,
          status: 'sent',
          emailId: emailResult.id
        });

        successCount++;
        console.log(`✅ Successfully sent ${reminder.reminder_type} reminder for invoice ${invoice.invoice_number}`);
      } catch (error) {
        console.error(`❌ Failed to send reminder for invoice ${invoice.invoice_number}:`, error);
        
        // Update reminder status to failed
        await supabaseAdmin
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
      errors: errorCount,
      skipped: skippedCount
    };

    console.log(`📊 Reminder processing complete:`, JSON.stringify(summary, null, 2));
    console.log('🏁 Auto-send reminders cron job finished');

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

// Function to send reminder email
async function sendReminderEmail(invoice: any, reminderType: string, overdueDays: number) {
  if (!resend) {
    throw new Error('Resend client not initialized - RESEND_API_KEY missing');
  }
  
  // Sanitize and validate email inputs
  const clientName = invoice.clients?.name || 'Valued Customer';
  const clientEmail = invoice.clients?.email;
  const invoiceNumber = invoice.invoice_number || 'N/A';
  const invoiceTotal = typeof invoice.total === 'number' ? invoice.total.toFixed(2) : '0.00';
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A';
  
  if (!clientEmail) {
    throw new Error('Client email is required');
  }
  
  // Escape HTML to prevent XSS (basic protection)
  const escapeHtml = (text: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };
  
  const { data, error } = await resend.emails.send({
    from: 'FlowInvoicer <onboarding@resend.dev>',
    to: [clientEmail],
    subject: `Payment Reminder - Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        <p>Dear ${escapeHtml(clientName)},</p>
        <p>This is a ${reminderType} reminder that payment is ${overdueDays > 0 ? 'overdue' : 'due'} for Invoice ${escapeHtml(invoiceNumber)}.</p>
        <p><strong>Amount Due:</strong> $${escapeHtml(invoiceTotal)}</p>
        <p><strong>Due Date:</strong> ${escapeHtml(dueDate)}</p>
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

// Vercel cron jobs call GET by default, so we need to process reminders in GET
export async function GET(request: NextRequest) {
  // Use the same processing logic as POST
  return await processReminders(request);
}

// POST handler for manual testing (also calls the shared processing logic)
export async function POST(request: NextRequest) {
  return await processReminders(request);
}
