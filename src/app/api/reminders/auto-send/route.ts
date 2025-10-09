import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getReminderSchedule } from '@/lib/reminder-email-templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get all sent invoices that are overdue
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company
        ),
        business_settings (
          business_name,
          email,
          phone,
          logo,
          tagline
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (invoicesError) {
      console.error('Error fetching overdue invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    const reminderSchedule = getReminderSchedule();
    const sentReminders = [];

    for (const invoice of overdueInvoices || []) {
      const dueDate = new Date(invoice.due_date);
      const currentDate = new Date();
      const overdueDays = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Find the appropriate reminder type based on overdue days
      const reminderConfig = reminderSchedule
        .sort((a, b) => b.days - a.days) // Sort by days descending
        .find(config => overdueDays >= config.days);

      if (!reminderConfig) continue;

      // Check if we've already sent this type of reminder for this invoice
      const { data: existingReminder } = await supabase
        .from('invoice_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', reminderConfig.type)
        .single();

      if (existingReminder) continue;

      // Send the reminder
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reminders/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            reminderType: reminderConfig.type,
            overdueDays: overdueDays
          })
        });

        if (response.ok) {
          sentReminders.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            reminderType: reminderConfig.type,
            overdueDays: overdueDays
          });
        }
      } catch (error) {
        console.error(`Error sending reminder for invoice ${invoice.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueInvoices?.length || 0} overdue invoices`,
      sentReminders: sentReminders.length,
      reminders: sentReminders
    });

  } catch (error) {
    console.error('Error in auto-reminder scheduler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}