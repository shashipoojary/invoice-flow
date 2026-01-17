import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';
import { canEnableReminder } from '@/lib/subscription-validator';
import { getBaseUrlFromRequest } from '@/lib/get-base-url';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Queue handler for sending reminders
 * Called by QStash when job is processed
 */
async function handler(request: NextRequest) {
  try {
    const payload = await request.json();
    const { invoiceId, reminderType, daysOverdue, clientEmail, clientName } = payload;

    console.log(`📧 Processing queued reminder: ${invoiceId}`);

    if (!invoiceId || !reminderType) {
      throw new Error('Missing required fields: invoiceId and reminderType');
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Fetch payment data for partial payments
    const { data: payments } = await supabaseAdmin
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId);

    const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
    const remainingBalance = Math.max(0, invoice.total - totalPaid);

    // Check subscription limit
    const reminderLimitCheck = await canEnableReminder(invoice.user_id, invoice.id);
    if (!reminderLimitCheck.allowed) {
      throw new Error(reminderLimitCheck.reason || 'Reminder limit reached');
    }

    // Get reminder email template
    const baseUrl = getBaseUrlFromRequest(request);
    // Build template invoice object similar to main route
    const templateInvoice = {
      invoiceNumber: invoice.invoice_number,
      total: remainingBalance,
      baseTotal: remainingBalance,
      originalTotal: invoice.total,
      lateFees: 0,
      hasLateFees: false,
      totalPaid: totalPaid,
      remainingBalance: remainingBalance,
      dueDate: invoice.due_date,
      publicToken: invoice.public_token,
    };
    const templateBusinessSettings = {
      businessName: 'FlowInvoicer',
      email: '',
      phone: '',
      website: '',
      logo: '',
      tagline: '',
      paymentNotes: ''
    };
    const reminderTemplate = getReminderEmailTemplate(
      templateInvoice,
      templateBusinessSettings,
      reminderType as 'friendly' | 'polite' | 'firm' | 'urgent',
      daysOverdue || 0,
      baseUrl
    );

    // Send email
    const fromAddress = 'FlowInvoicer <onboarding@resend.dev>';
    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: clientEmail || invoice.clients?.email || '',
      subject: reminderTemplate.subject,
      html: reminderTemplate.html,
    });

    if (emailResult.error) {
      throw new Error(`Failed to send reminder email: ${emailResult.error.message}`);
    }

    // Find or create reminder record
    const { data: existingReminders } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id')
      .eq('invoice_id', invoice.id)
      .eq('reminder_type', reminderType)
      .in('reminder_status', ['scheduled', 'failed'])
      .order('created_at', { ascending: false })
      .limit(1);

    let reminderId: string | null = null;

    if (existingReminders && existingReminders.length > 0) {
      // Update existing reminder
      const { data: updateData } = await supabaseAdmin
        .from('invoice_reminders')
        .update({
          reminder_status: 'sent',
          email_id: emailResult.data?.id || null,
          sent_at: new Date().toISOString(),
          overdue_days: daysOverdue || 0,
          failure_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReminders[0].id)
        .select('id')
        .single();

      reminderId = updateData?.id || null;
    } else {
      // Create new reminder record
      const { data: insertData } = await supabaseAdmin
        .from('invoice_reminders')
        .insert({
          invoice_id: invoice.id,
          reminder_type: reminderType,
          reminder_status: 'sent',
          email_id: emailResult.data?.id || null,
          sent_at: new Date().toISOString(),
          overdue_days: daysOverdue || 0,
          failure_reason: null
        })
        .select('id')
        .single();

      reminderId = insertData?.id || null;
    }

    // Final limit check before updating invoice
    const finalLimitCheck = await canEnableReminder(invoice.user_id, invoice.id);
    if (!finalLimitCheck.allowed && reminderId) {
      await supabaseAdmin
        .from('invoice_reminders')
        .update({
          reminder_status: 'cancelled',
          failure_reason: 'Limit reached'
        })
        .eq('id', reminderId);
      throw new Error(finalLimitCheck.reason || 'Reminder limit reached');
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

    console.log(`✅ Reminder sent for invoice ${invoice.invoice_number}`);

    return NextResponse.json({ 
      success: true,
      reminderId,
      emailId: emailResult.data?.id 
    });
  } catch (error) {
    console.error('Error processing send_reminder job:', error);
    // Re-throw to trigger QStash retry
    throw error;
  }
}

// Queue handler - processes jobs from QStash
// Note: Signature verification can be added later for production security
// For now, we rely on QStash's built-in security and the fact that only QStash knows the endpoint URL
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return handler(new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(payload),
    }));
  } catch (error) {
    console.error('Queue handler error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

