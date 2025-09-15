import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      clientId, 
      projectName, 
      milestoneName, 
      description, 
      items, 
      taxRate = 0,
      dueDate,
      userId 
    } = body

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastNumber = lastInvoice?.invoice_number || 'INV-000'
    const nextNumber = `INV-${String(parseInt(lastNumber.split('-')[1]) + 1).padStart(3, '0')}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        invoice_number: nextNumber,
        client_id: clientId,
        project_name: projectName,
        milestone_name: milestoneName,
        description,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        due_date: dueDate,
        public_token: uuidv4(),
        status: 'draft'
      })
      .select()
      .single()

    if (invoiceError) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    const invoiceItems = items.map((item: { description: string; quantity: number; rate: number; amount: number }) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      invoice: {
        ...invoice,
        items: invoiceItems
      }
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
