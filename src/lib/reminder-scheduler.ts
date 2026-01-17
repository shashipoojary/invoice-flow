import { supabaseAdmin } from './supabase';

/**
 * Create scheduled reminders for an invoice
 * Extracted to shared utility to be used by both sync and async routes
 */
export async function createScheduledReminders(
  invoiceId: string, 
  reminderSettings: any, 
  dueDate: string, 
  paymentTerms?: any, 
  invoiceStatus?: string, 
  updatedAt?: string
): Promise<void> {
  try {
    // CRITICAL: Do not schedule reminders for draft or paid invoices
    if (invoiceStatus === 'draft' || invoiceStatus === 'paid') {
      console.log(`⏭️ Skipping reminder scheduling for invoice ${invoiceId} - invoice is in ${invoiceStatus} status`);
      // Delete any existing scheduled reminders for draft or paid invoices
      await supabaseAdmin
        .from('invoice_reminders')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('reminder_status', 'scheduled');
      return;
    }

    // Parse payment terms if it's a string
    let parsedPaymentTerms = paymentTerms;
    if (typeof paymentTerms === 'string') {
      try {
        parsedPaymentTerms = JSON.parse(paymentTerms);
      } catch (e) {
        console.error('Failed to parse payment terms:', e);
        parsedPaymentTerms = null;
      }
    }
    
    // For "Due on Receipt" invoices, use updated_at (when sent) as base date, otherwise use due_date
    let baseDate = new Date(dueDate);
    if (parsedPaymentTerms?.enabled && (parsedPaymentTerms.terms === 'Due on Receipt' || parsedPaymentTerms.defaultOption === 'Due on Receipt') && invoiceStatus !== 'draft' && updatedAt) {
      baseDate = new Date(updatedAt);
    }
    
    // First, aggressively delete any existing scheduled reminders and duplicate failed reminders for this invoice
    const { data: existingReminders } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id, reminder_type, reminder_status, created_at')
      .eq('invoice_id', invoiceId);
    
    if (existingReminders && existingReminders.length > 0) {
      // Delete ALL scheduled reminders (they will be recreated below)
      await supabaseAdmin
        .from('invoice_reminders')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('reminder_status', 'scheduled');
      
      // Clean up duplicate failed reminders (keep only most recent per type)
      const failedByType = new Map<string, any[]>();
      for (const reminder of existingReminders) {
        if (reminder.reminder_status === 'failed') {
          const key = reminder.reminder_type || 'friendly';
          if (!failedByType.has(key)) {
            failedByType.set(key, []);
          }
          failedByType.get(key)!.push(reminder);
        }
      }
      
      // Delete duplicate failed reminders (keep most recent)
      for (const [type, reminders] of failedByType.entries()) {
        if (reminders.length > 1) {
          reminders.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          });
          const duplicateIds = reminders.slice(1).map(r => r.id);
          if (duplicateIds.length > 0) {
            await supabaseAdmin
              .from('invoice_reminders')
              .delete()
              .in('id', duplicateIds);
          }
        }
      }
    }
    
    const scheduledReminders = [];

    // Check useSystemDefaults flag FIRST - if true, use smart reminders regardless of custom rules
    if (reminderSettings.useSystemDefaults) {
      // Smart reminder system - adapts based on payment terms
      let smartSchedule: Array<{ type: string; days: number }> = [];
      
      const paymentTerm = parsedPaymentTerms?.terms || parsedPaymentTerms?.defaultOption || 'Net 30';
      
      if (paymentTerm === 'Due on Receipt') {
        smartSchedule = [
          { type: 'friendly', days: 1 },
          { type: 'polite', days: 3 },
          { type: 'firm', days: 7 },
          { type: 'urgent', days: 14 }
        ];
      } else if (paymentTerm === 'Net 15') {
        smartSchedule = [
          { type: 'friendly', days: -2 },
          { type: 'polite', days: 2 },
          { type: 'firm', days: 7 },
          { type: 'urgent', days: 15 }
        ];
      } else if (paymentTerm === 'Net 30') {
        smartSchedule = [
          { type: 'friendly', days: -3 },
          { type: 'polite', days: 3 },
          { type: 'firm', days: 10 },
          { type: 'urgent', days: 20 }
        ];
      } else if (paymentTerm === 'Net 60') {
        smartSchedule = [
          { type: 'friendly', days: -5 },
          { type: 'polite', days: 5 },
          { type: 'firm', days: 15 },
          { type: 'urgent', days: 30 }
        ];
      } else {
        // Default to Net 30 schedule
        smartSchedule = [
          { type: 'friendly', days: -3 },
          { type: 'polite', days: 3 },
          { type: 'firm', days: 10 },
          { type: 'urgent', days: 20 }
        ];
      }
      
      for (const schedule of smartSchedule) {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(scheduledDate.getDate() + schedule.days);
        
        scheduledReminders.push({
          invoice_id: invoiceId,
          reminder_type: schedule.type,
          overdue_days: schedule.days,
          sent_at: scheduledDate.toISOString(),
          reminder_status: 'scheduled',
          email_id: null
        });
      }
    } else if (reminderSettings.rules && Array.isArray(reminderSettings.rules)) {
      // Custom reminder rules
      const remindersWithDates = reminderSettings.rules
        .filter((rule: any) => rule.enabled)
        .map((rule: any) => {
          const scheduledDate = new Date(baseDate);
          const days = rule.days || 0;
          
          if (rule.type === 'before') {
            scheduledDate.setDate(scheduledDate.getDate() - days);
          } else {
            scheduledDate.setDate(scheduledDate.getDate() + days);
          }
          
          return {
            rule,
            scheduledDate,
            overdue_days: rule.type === 'before' ? -days : days
          };
        });
      
      remindersWithDates.sort((a: any, b: any) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
      
      const reminderTypes = ['friendly', 'polite', 'firm', 'urgent'];
      
      for (let i = 0; i < remindersWithDates.length; i++) {
        const { rule, scheduledDate, overdue_days } = remindersWithDates[i];
        const reminderType = reminderTypes[Math.min(i, reminderTypes.length - 1)];
        
        scheduledReminders.push({
          invoice_id: invoiceId,
          reminder_type: reminderType,
          overdue_days,
          sent_at: scheduledDate.toISOString(),
          reminder_status: 'scheduled',
          email_id: null
        });
      }
    }

    // Insert scheduled reminders
    if (scheduledReminders.length > 0) {
      const { error } = await supabaseAdmin
        .from('invoice_reminders')
        .insert(scheduledReminders);

      if (error) {
        console.error('Error creating scheduled reminders:', error);
        throw error;
      }

      console.log(`Created ${scheduledReminders.length} scheduled reminders for invoice ${invoiceId}`);
    }
  } catch (error) {
    console.error('Error in createScheduledReminders:', error);
    throw error;
  }
}

