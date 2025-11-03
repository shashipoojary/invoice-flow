import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// Function to create scheduled reminders
async function createScheduledReminders(invoiceId: string, reminderSettings: any, dueDate: string, paymentTerms?: any, invoiceStatus?: string, updatedAt?: string) {
  try {
    // For "Due on Receipt" invoices, use updated_at (when sent) as base date, otherwise use due_date
    let baseDate = new Date(dueDate);
    if (paymentTerms?.enabled && paymentTerms.terms === 'Due on Receipt' && invoiceStatus !== 'draft' && updatedAt) {
      baseDate = new Date(updatedAt);
    }
    
    // First, delete any existing scheduled reminders for this invoice to avoid duplicates
    await supabaseAdmin
      .from('invoice_reminders')
      .delete()
      .eq('invoice_id', invoiceId)
      .eq('reminder_status', 'scheduled');
    
    const scheduledReminders = [];

    // Prioritize custom rules over system defaults if custom rules exist
    if (reminderSettings.customRules && reminderSettings.customRules.length > 0) {
      // Use custom reminder rules
      const enabledRules = reminderSettings.customRules.filter((rule: any) => rule.enabled);
      
      // Create reminders with their scheduled dates first
      const remindersWithDates = enabledRules.map((rule: any) => {
        const scheduledDate = new Date(baseDate);
        
        // Validate rule days is a valid number
        const days = typeof rule.days === 'number' && !isNaN(rule.days) ? rule.days : 0;
        
        // Fix scheduling logic: for "before" reminders, subtract days; for "after", add days
        if (rule.type === 'before') {
          scheduledDate.setDate(scheduledDate.getDate() - days);
        } else {
          scheduledDate.setDate(scheduledDate.getDate() + days);
        }
        
        // Validate the scheduled date is valid
        if (isNaN(scheduledDate.getTime())) {
          console.error(`Invalid scheduled date calculated for rule:`, rule);
          throw new Error(`Invalid scheduled date for reminder rule with ${days} days`);
        }
        
        return {
          rule,
          scheduledDate,
          overdue_days: rule.type === 'before' ? -days : days
        };
      });
      
      // Sort by scheduled date (earliest first) to get correct chronological order
      remindersWithDates.sort((a: any, b: any) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
      
      // Determine reminder types based on chronological sequence
      const reminderTypes = ['friendly', 'polite', 'firm', 'urgent'];
      
      for (let i = 0; i < remindersWithDates.length; i++) {
        const { rule, scheduledDate, overdue_days } = remindersWithDates[i];
        
        // Assign reminder type based on chronological sequence (friendly -> polite -> firm -> urgent)
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
    } else if (reminderSettings.useSystemDefaults) {
      // Use system default reminder schedule
      const defaultSchedule = [
        { type: 'friendly', days: 1 }, // 1 day before due
        { type: 'polite', days: 0 },   // On due date
        { type: 'firm', days: -3 },    // 3 days after due
        { type: 'urgent', days: -7 }   // 7 days after due
      ];

      for (const reminder of defaultSchedule) {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(scheduledDate.getDate() + reminder.days);
        
        // Validate the scheduled date is valid
        if (isNaN(scheduledDate.getTime())) {
          console.error(`Invalid scheduled date calculated for default reminder:`, reminder);
          continue; // Skip invalid reminders instead of failing
        }
        
        scheduledReminders.push({
          invoice_id: invoiceId,
          reminder_type: reminder.type,
          overdue_days: reminder.days,
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

    // Insert new invoice items and calculate totals
    let subtotal = 0;
    let total = 0;
    
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

      // Calculate subtotal from items
      subtotal = items.reduce((sum: number, item: any) => sum + (item.line_total || 0), 0);
      
      // Calculate total with discount
      const discountAmount = discount || 0;
      total = subtotal - discountAmount;
    }

    // Update invoice with calculated totals
    if (items && items.length > 0) {
      const { error: updateTotalsError } = await supabaseAdmin
        .from('invoices')
        .update({
          subtotal,
          total,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (updateTotalsError) {
        console.error('Error updating invoice totals:', updateTotalsError)
        return NextResponse.json({ error: 'Failed to update invoice totals' }, { status: 500 })
      }
    }

    // Handle client data if provided (for new clients)
    if (client_data && !client_id) {
      // First check if a client with this email already exists
      const { data: existingClient, error: checkError } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', client_data.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing client:', checkError);
        // Don't fail the entire operation for client check error
      } else if (!existingClient) {
        // Only create new client if one doesn't exist
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
    }

    // Update scheduled reminders if reminder settings changed
    if (reminderSettings) {
      try {
        // Delete existing scheduled reminders for this invoice (createScheduledReminders will also delete, but we do it here for clarity)
        await supabaseAdmin
          .from('invoice_reminders')
          .delete()
          .eq('invoice_id', invoiceId)
          .eq('reminder_status', 'scheduled');

        // Create new scheduled reminders if enabled
        // Note: createScheduledReminders also deletes existing scheduled reminders, but this ensures cleanup happens even if function has issues
        if (reminderSettings.enabled) {
          await createScheduledReminders(
            invoiceId, 
            reminderSettings, 
            due_date,
            payment_terms,
            invoice.status,
            new Date().toISOString()
          );
        }
      } catch (reminderError) {
        console.error('Error updating scheduled reminders:', reminderError);
        // Don't fail the invoice update if reminder update fails
      }
    }

    // Fetch the complete updated invoice with client data and items
    const { data: completeInvoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          company,
          address,
          phone,
          created_at
        ),
        invoice_items (
          id,
          description,
          rate,
          line_total
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated invoice:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated invoice' }, { status: 500 });
    }

    // Map database fields to frontend interface
    const mappedInvoice = {
      ...completeInvoice,
      invoiceNumber: completeInvoice.invoice_number,
      issueDate: completeInvoice.issue_date,
      dueDate: completeInvoice.due_date,
      createdAt: completeInvoice.created_at,
      client: completeInvoice.clients,
      clientId: completeInvoice.client_id,
      clientName: completeInvoice.clients?.name,
      clientEmail: completeInvoice.clients?.email,
      discount: completeInvoice.discount || 0,
      // Map invoice items to expected format
      items: completeInvoice.invoice_items?.map((item: any) => ({
        id: item.id,
        description: item.description,
        rate: item.rate,
        amount: item.rate, // For compatibility with FastInvoiceModal
        line_total: item.line_total
      })) || [],
      // Parse JSON fields with fallbacks
      paymentTerms: completeInvoice.payment_terms ? JSON.parse(completeInvoice.payment_terms) : undefined,
      lateFees: completeInvoice.late_fees ? JSON.parse(completeInvoice.late_fees) : undefined,
      reminders: completeInvoice.reminder_settings ? JSON.parse(completeInvoice.reminder_settings) : undefined,
      theme: completeInvoice.theme ? JSON.parse(completeInvoice.theme) : undefined,
    };

    // Log edited event (non-blocking)
    try {
      await supabaseAdmin.from('invoice_events').insert({ invoice_id: invoiceId, type: 'edited' })
    } catch {}

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice updated successfully',
      invoice: mappedInvoice 
    })

  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // (moved logging before return)
}
