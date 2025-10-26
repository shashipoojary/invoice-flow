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
          name,
          email,
          company
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
