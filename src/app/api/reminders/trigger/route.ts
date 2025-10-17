import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get overdue invoices for the user
    const today = new Date();
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        due_date,
        status,
        total,
        reminder_count,
        last_reminder_sent,
        reminder_settings,
        clients (
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'sent')
      .lt('due_date', today.toISOString());

    if (invoicesError) {
      console.error('Error fetching overdue invoices:', invoicesError);
      return NextResponse.json({ 
        error: 'Failed to fetch invoices', 
        details: invoicesError.message,
        code: invoicesError.code 
      }, { status: 500 });
    }

    const remindersToSend = [];

    for (const invoice of overdueInvoices || []) {
      // Check if auto reminders are enabled for this invoice
      let reminderSettings = null;
      try {
        reminderSettings = invoice.reminder_settings ? JSON.parse(invoice.reminder_settings) : null;
      } catch {
        console.log(`⚠️ Invalid reminder settings for invoice ${invoice.invoice_number}`);
      }

      // Skip if auto reminders are not enabled
      if (!reminderSettings || !reminderSettings.enabled) {
        continue;
      }

      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const reminderCount = invoice.reminder_count || 0;

      // Only show invoices that can still receive reminders (max 3)
      if (reminderCount >= 3) {
        continue;
      }

      // Determine reminder type based on settings
      let reminderType = 'first';
      
      if (reminderSettings.useSystemDefaults) {
        // Use system defaults - determine type by count
        if (reminderCount === 1) reminderType = 'second';
        if (reminderCount === 2) reminderType = 'final';
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
            reminderType = matchingRule.type || 'friendly';
          }
        }
      }

      remindersToSend.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
         clientName: invoice.clients?.[0]?.name || 'Unknown',
         clientEmail: invoice.clients?.[0]?.email || 'No email',
        daysOverdue,
        reminderType,
        total: invoice.total
      });
    }

    return NextResponse.json({
      success: true,
      overdueInvoices: remindersToSend,
      count: remindersToSend.length,
      debug: {
        totalOverdueFound: overdueInvoices?.length || 0,
        filteredCount: remindersToSend.length,
        userId: userId
      }
    });

  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
