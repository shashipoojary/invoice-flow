import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice with reminder settings
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        invoice_number,
        due_date,
        status,
        total,
        reminder_settings,
        clients (
          name,
          email
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Parse reminder settings
    let reminderSettings = null;
    try {
      reminderSettings = invoice.reminder_settings ? JSON.parse(invoice.reminder_settings) : null;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid reminder settings format' }, { status: 400 });
    }

    // Check if reminders are enabled
    if (!reminderSettings || !reminderSettings.enabled) {
      return NextResponse.json({ 
        error: 'Reminders are not enabled for this invoice',
        reminderSettings 
      }, { status: 400 });
    }

    // Calculate days
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const isOverdue = today >= dueDate;
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Test reminder logic
    let shouldSendReminder = false;
    let reminderType = 'friendly';
    let reminderReason = '';

    if (reminderSettings.useSystemDefaults) {
      // System defaults: 1 day after due, 7 days after due, 14 days after due
      if (isOverdue && daysOverdue >= 1 && daysOverdue <= 2) {
        shouldSendReminder = true;
        reminderType = 'friendly';
        reminderReason = 'First overdue reminder (system default)';
      } else if (isOverdue && daysOverdue >= 7 && daysOverdue <= 8) {
        shouldSendReminder = true;
        reminderType = 'polite';
        reminderReason = 'Second overdue reminder (system default)';
      } else if (isOverdue && daysOverdue >= 14 && daysOverdue <= 15) {
        shouldSendReminder = true;
        reminderType = 'firm';
        reminderReason = 'Final overdue reminder (system default)';
      }
    } else {
      // Custom rules
      const customRules = reminderSettings.customRules || reminderSettings.rules || [];
      const enabledRules = customRules.filter((rule: any) => rule.enabled);
      const reminderTypes = ['friendly', 'polite', 'firm', 'urgent'];

      for (let i = 0; i < enabledRules.length; i++) {
        const rule = enabledRules[i];
        const reminderTypeForRule = reminderTypes[Math.min(i, reminderTypes.length - 1)];
        
        if (rule.type === 'before' && daysUntilDue <= rule.days && daysUntilDue > 0) {
          shouldSendReminder = true;
          reminderType = reminderTypeForRule;
          reminderReason = `Before due date reminder (${rule.days} days before)`;
          break;
        } else if (rule.type === 'after' && isOverdue && daysOverdue >= rule.days) {
          shouldSendReminder = true;
          reminderType = reminderTypeForRule;
          reminderReason = `After due date reminder (${rule.days} days after)`;
          break;
        }
      }
    }

    // Get existing reminders for this invoice
    const { data: existingReminders, error: remindersError } = await supabaseAdmin
      .from('invoice_reminders')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sent_at', { ascending: false });

    if (remindersError) {
      console.error('Error fetching existing reminders:', remindersError);
    }

    // Test result
    const testResult = {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        due_date: invoice.due_date,
        status: invoice.status,
        client_name: invoice.clients?.[0]?.name,
        client_email: invoice.clients?.[0]?.email
      },
      reminderSettings,
      timing: {
        isOverdue,
        daysOverdue,
        daysUntilDue,
        dueDate: dueDate.toISOString(),
        today: today.toISOString()
      },
      reminderLogic: {
        shouldSendReminder,
        reminderType,
        reminderReason,
        useSystemDefaults: reminderSettings.useSystemDefaults,
        customRules: reminderSettings.customRules || reminderSettings.rules || []
      },
      existingReminders: existingReminders || [],
      recommendations: [] as string[]
    };

    // Add recommendations
    if (!shouldSendReminder) {
      if (!isOverdue) {
        testResult.recommendations.push(`Invoice is not overdue yet (${daysUntilDue} days until due)`);
      } else {
        testResult.recommendations.push(`No matching reminder rules for ${daysOverdue} days overdue`);
      }
    } else {
      testResult.recommendations.push(`Reminder should be sent: ${reminderReason}`);
    }

    if (existingReminders && existingReminders.length > 0) {
      const lastReminder = existingReminders[0];
      const lastReminderDate = new Date(lastReminder.sent_at);
      const hoursSinceLastReminder = (today.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastReminder < 24) {
        testResult.recommendations.push(`Last reminder sent ${hoursSinceLastReminder.toFixed(1)} hours ago (wait 24 hours)`);
      }
    }

    return NextResponse.json({
      success: true,
      testResult
    });

  } catch (error) {
    console.error('Error testing reminder system:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
