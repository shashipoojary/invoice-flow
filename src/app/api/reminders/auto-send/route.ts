import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getReminderSchedule } from '@/lib/reminder-email-templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  return NextResponse.json({ 
    message: 'Auto-send reminders endpoint is working',
    cronSchedule: '0 9 * * * (Daily at 9:00 AM UTC)',
    status: 'active'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get all sent invoices that are overdue
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .eq('status', 'sent')
      .lt('due_date', new Date().toISOString());

    if (invoicesError) {
      console.error('Error fetching overdue invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    const reminderSchedule = getReminderSchedule();
    const sentReminders = [];

    for (const invoice of overdueInvoices || []) {
      // Check user-level reminder settings first
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('reminders')
        .eq('user_id', invoice.user_id)
        .single();

      // Skip if user has disabled reminders globally
      if (userSettings?.reminders?.enabled === false) {
        continue;
      }

      // Parse reminder settings first
      let reminderSettings = null;
      try {
        reminderSettings = typeof invoice.reminder_settings === 'string' 
          ? JSON.parse(invoice.reminder_settings) 
          : invoice.reminder_settings;
      } catch (error) {
        console.log(`Failed to parse reminder settings for invoice ${invoice.id}:`, error);
        continue;
      }

      // Skip if reminders are disabled for this invoice
      if (!reminderSettings?.enabled) {
        continue;
      }

      const dueDate = new Date(invoice.due_date);
      const currentDate = new Date();
      const overdueDays = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Parse payment terms for smart logic
      let paymentTerms = null;
      try {
        paymentTerms = invoice.payment_terms ? 
          (typeof invoice.payment_terms === 'string' ? JSON.parse(invoice.payment_terms) : invoice.payment_terms) : 
          null;
      } catch (error) {
        console.log(`Failed to parse payment terms for invoice ${invoice.id}:`, error);
      }

      // Determine which reminder schedule to use
      let reminderConfig = null;
      
      if (reminderSettings.useSystemDefaults) {
        // Smart system defaults based on payment terms
        if (paymentTerms?.enabled && paymentTerms.terms === 'Due on Receipt') {
          // Special logic for "Due on Receipt" - only send after due date
          if (overdueDays === 1) {
            reminderConfig = { type: 'after', days: 1 };
          } else if (overdueDays === 3) {
            reminderConfig = { type: 'after', days: 3 };
          } else if (overdueDays === 7) {
            reminderConfig = { type: 'after', days: 7 };
          } else if (overdueDays === 14) {
            reminderConfig = { type: 'after', days: 14 };
          }
        } else {
          // Standard logic for other payment terms
          if (overdueDays < 0) {
            // Before due date
            const daysUntilDue = Math.abs(overdueDays);
            if (daysUntilDue === 7) {
              reminderConfig = { type: 'before', days: 7 };
            } else if (daysUntilDue === 3) {
              reminderConfig = { type: 'before', days: 3 };
            }
          } else {
            // After due date
            if (overdueDays === 1) {
              reminderConfig = { type: 'after', days: 1 };
            } else if (overdueDays === 7) {
              reminderConfig = { type: 'after', days: 7 };
            }
          }
        }
      } else {
        // Use custom rules
        const customRules = reminderSettings.customRules || reminderSettings.rules || [];
        const enabledRules = customRules.filter((rule: any) => rule.enabled);
        
        if (enabledRules.length === 0) {
          continue;
        }
        
        // Handle both before and after due date reminders
        if (overdueDays < 0) {
          // Invoice is not yet due - check for "before" reminders
          const daysUntilDue = Math.abs(overdueDays);
          const beforeRules = enabledRules.filter((rule: any) => rule.type === 'before');
          reminderConfig = beforeRules
            .sort((a: any, b: any) => a.days - b.days) // Sort by days ascending (closest first)
            .find((rule: any) => daysUntilDue <= rule.days);
        } else {
          // Invoice is overdue - check for "after" reminders
          const afterRules = enabledRules.filter((rule: any) => rule.type === 'after');
          reminderConfig = afterRules
            .sort((a: any, b: any) => b.days - a.days) // Sort by days descending (highest first)
            .find((rule: any) => overdueDays >= rule.days);
        }
      }

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