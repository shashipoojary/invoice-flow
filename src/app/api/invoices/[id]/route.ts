import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Fetch invoice from Supabase
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id) // Ensure user can only access their own invoices
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch invoice items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError)
    }

    return NextResponse.json({ 
      invoice: {
        ...invoice,
        // Map database fields to frontend interface
        invoiceNumber: invoice.invoice_number,
        dueDate: invoice.due_date,
        issueDate: invoice.issue_date,
        issue_date: invoice.issue_date,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        clientId: invoice.client_id, // Map client_id to clientId
        client: invoice.clients,
        items: (itemsData || []).map(item => ({
          id: item.id,
          description: item.description,
          amount: item.line_total
        })),
        // Parse JSON fields with fallbacks for existing invoices (only for detailed invoices)
        paymentTerms: invoice.type === 'fast' ? undefined : 
          (invoice.payment_terms ? 
            (typeof invoice.payment_terms === 'string' ? JSON.parse(invoice.payment_terms) : invoice.payment_terms) : 
            { enabled: true, terms: 'Net 30' }),
        lateFees: invoice.type === 'fast' ? undefined : 
          (invoice.late_fees ? 
            (typeof invoice.late_fees === 'string' ? JSON.parse(invoice.late_fees) : invoice.late_fees) : 
            { enabled: true, type: 'fixed', amount: 50, gracePeriod: 7 }),
        reminders: invoice.type === 'fast' ? undefined : 
          (invoice.reminder_settings ? 
            (() => {
              const settings = typeof invoice.reminder_settings === 'string' ? JSON.parse(invoice.reminder_settings) : invoice.reminder_settings;
              // Convert customRules to rules for frontend compatibility and ensure enabled property
              const rules = settings.customRules || settings.rules || [];
              const rulesWithEnabled = rules.map((rule: any) => ({
                ...rule,
                enabled: rule.enabled !== undefined ? rule.enabled : true
              }));
              return {
                ...settings,
                rules: rulesWithEnabled
              };
            })() : 
            { enabled: false, useSystemDefaults: true, rules: [] }),
        theme: invoice.type === 'fast' ? undefined : 
          (invoice.theme ? 
            (typeof invoice.theme === 'string' ? JSON.parse(invoice.theme) : invoice.theme) : 
            undefined),
        // Write-off fields
        writeOffAmount: invoice.write_off_amount || 0,
        writeOffNotes: invoice.write_off_notes || undefined,
      }
    })

  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, notes } = body

    // CRITICAL: Check current invoice status before allowing status changes
    const { data: currentInvoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // CRITICAL: Prevent changing status from sent/paid/pending back to draft
    // This prevents reverting sent invoices back to draft
    if (status && status === 'draft' && currentInvoice.status !== 'draft') {
      return NextResponse.json({ 
        error: `Cannot change invoice status from "${currentInvoice.status}" to "draft". Once an invoice is sent, it cannot be reverted to draft.` 
      }, { status: 400 })
    }

    // CRITICAL: Prevent editing sent/paid invoices (only allow status changes for specific cases)
    // Allow status changes: draft -> sent, sent -> paid, etc.
    // But prevent: sent -> draft, paid -> draft, etc.
    if (status && currentInvoice.status === 'paid' && status !== 'paid') {
      return NextResponse.json({ 
        error: 'Cannot change status of a paid invoice.' 
      }, { status: 400 })
    }

    // Update invoice in Supabase
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({
        status,
        notes
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id) // Ensure user can only update their own invoices
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // CRITICAL: If invoice is being marked as paid, cancel ONLY scheduled reminders
    // This prevents reminders from being sent after payment is received
    // Sent and cancelled reminders should NOT be affected
    if (status === 'paid' && currentInvoice.status !== 'paid') {
      try {
        const { error: reminderError } = await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'cancelled',
            failure_reason: 'Invoice marked as paid - scheduled reminders cancelled'
          })
          .eq('invoice_id', invoiceId)
          .eq('reminder_status', 'scheduled') // Only update scheduled reminders, not sent/cancelled

        if (reminderError) {
          console.error('Error cancelling scheduled reminders:', reminderError)
          // Don't fail the invoice update if reminder cancellation fails
        } else {
          console.log(`✅ Cancelled scheduled reminders for invoice ${invoiceId} (marked as paid)`)
        }
        
        // Log the "paid" event - this serves as the cutoff point for activity tracking
        // For privacy and legal compliance, no activities are tracked after this event
        try {
          await supabaseAdmin.from('invoice_events').insert({ 
            invoice_id: invoiceId, 
            type: 'paid' 
          });
        } catch (eventError) {
          console.error('Error logging paid event:', eventError)
          // Don't fail the invoice update if event logging fails
        }
      } catch (reminderCancelError) {
        console.error('Error cancelling scheduled reminders:', reminderCancelError)
        // Don't fail the invoice update if reminder cancellation fails
      }
    }

    return NextResponse.json({ invoice: data })

  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { reminderSettings, paymentTerms, lateFees, theme } = body

    // Prepare update data
    const updateData: any = {}
    
    if (reminderSettings !== undefined) {
      updateData.reminder_settings = JSON.stringify(reminderSettings)
    }
    
    if (paymentTerms !== undefined) {
      updateData.payment_terms = JSON.stringify(paymentTerms)
    }
    
    if (lateFees !== undefined) {
      updateData.late_fees = JSON.stringify(lateFees)
    }
    
    if (theme !== undefined) {
      updateData.theme = JSON.stringify(theme)
    }

    // Update invoice in Supabase
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('user_id', user.id) // Ensure user can only update their own invoices
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice: data })

  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Delete invoice from Supabase
    const { error } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id) // Ensure user can only delete their own invoices

    if (error) {
      console.error('Error deleting invoice:', error)
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' })

  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
