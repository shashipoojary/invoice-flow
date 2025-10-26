import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// Function to create scheduled reminders
async function createScheduledReminders(invoiceId: string, reminderSettings: any, dueDate: string) {
  try {
    const dueDateObj = new Date(dueDate);
    const scheduledReminders = [];

    if (reminderSettings.useSystemDefaults) {
      // Use system default reminder schedule
      const defaultSchedule = [
        { type: 'friendly', days: 1 }, // 1 day before due
        { type: 'polite', days: 0 },   // On due date
        { type: 'firm', days: -3 },    // 3 days after due
        { type: 'urgent', days: -7 }   // 7 days after due
      ];

      for (const reminder of defaultSchedule) {
        const scheduledDate = new Date(dueDateObj);
        scheduledDate.setDate(scheduledDate.getDate() + reminder.days);
        
        scheduledReminders.push({
          invoice_id: invoiceId,
          reminder_type: reminder.type,
          overdue_days: reminder.days,
          sent_at: scheduledDate.toISOString(),
          reminder_status: 'scheduled',
          email_id: null
        });
      }
    } else if (reminderSettings.customRules && reminderSettings.customRules.length > 0) {
      // Use custom reminder rules
      for (const rule of reminderSettings.customRules) {
        if (rule.enabled) {
          const scheduledDate = new Date(dueDateObj);
          scheduledDate.setDate(scheduledDate.getDate() + rule.days);
          
          scheduledReminders.push({
            invoice_id: invoiceId,
            reminder_type: rule.type,
            overdue_days: rule.days,
            sent_at: scheduledDate.toISOString(),
            reminder_status: 'scheduled',
            email_id: null
          });
        }
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

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      invoiceId,
      client_id,
      client_data,
      items,
      due_date,
      discount,
      notes,
      invoice_number,
      issue_date,
      reminderSettings,
      late_fees,
      payment_terms,
      theme
    } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Start a transaction to update invoice and items
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .update({
        client_id: client_id || null,
        due_date,
        discount: discount || 0,
        notes,
        invoice_number,
        issue_date,
        reminder_settings: reminderSettings ? (() => {
          // Ensure all rules have enabled property
          if (reminderSettings.rules) {
            reminderSettings.rules = reminderSettings.rules.map((rule: any) => ({
              ...rule,
              enabled: rule.enabled !== undefined ? rule.enabled : true
            }));
          }
          if (reminderSettings.customRules) {
            reminderSettings.customRules = reminderSettings.customRules.map((rule: any) => ({
              ...rule,
              enabled: rule.enabled !== undefined ? rule.enabled : true
            }));
          }
          return JSON.stringify(reminderSettings);
        })() : null,
        late_fees: late_fees ? JSON.stringify(late_fees) : null,
        payment_terms: payment_terms ? JSON.stringify(payment_terms) : null,
        theme: theme ? JSON.stringify(theme) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id) // Ensure user can only update their own invoices
      .select()
      .single()

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Delete existing invoice items
    const { error: deleteItemsError } = await supabaseAdmin
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId)

    if (deleteItemsError) {
      console.error('Error deleting existing items:', deleteItemsError)
      return NextResponse.json({ error: 'Failed to update invoice items' }, { status: 500 })
    }

    // Insert new invoice items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        invoice_id: invoiceId,
        description: item.description,
        rate: item.rate,
        line_total: item.line_total
      }))

      const { error: insertItemsError } = await supabaseAdmin
        .from('invoice_items')
        .insert(itemsToInsert)

      if (insertItemsError) {
        console.error('Error inserting new items:', insertItemsError)
        return NextResponse.json({ error: 'Failed to update invoice items' }, { status: 500 })
      }
    }

    // Handle client data if provided (for new clients)
    if (client_data && !client_id) {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: user.id,
          name: client_data.name,
          email: client_data.email,
          company: client_data.company || null,
          address: client_data.address || null
        })

      if (clientError) {
        console.error('Error creating client:', clientError)
        // Don't fail the entire operation for client creation error
      }
    }

    // Update scheduled reminders if reminder settings changed
    if (reminderSettings) {
      try {
        // Delete existing scheduled reminders for this invoice
        await supabaseAdmin
          .from('invoice_reminders')
          .delete()
          .eq('invoice_id', invoiceId)
          .eq('reminder_status', 'scheduled');

        // Create new scheduled reminders if enabled
        if (reminderSettings.enabled) {
          await createScheduledReminders(invoiceId, reminderSettings, due_date);
        }
      } catch (reminderError) {
        console.error('Error updating scheduled reminders:', reminderError);
        // Don't fail the invoice update if reminder update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice updated successfully',
      invoice 
    })

  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
