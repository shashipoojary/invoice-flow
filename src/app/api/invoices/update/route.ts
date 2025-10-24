import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

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
        reminder_settings: reminderSettings ? JSON.stringify(reminderSettings) : null,
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
