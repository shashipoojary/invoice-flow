import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

interface InvoiceItem {
  id: string;
  description: string;
  line_total: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoices with client data and items in one query
    const { data: invoicesData, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company
        ),
        invoice_items (
          id,
          description,
          line_total
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Process the data
    const invoices = (invoicesData || []).map(invoice => ({
      ...invoice,
      // Map database fields to frontend interface
      invoiceNumber: invoice.invoice_number,
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      client: invoice.clients,
      items: (invoice.invoice_items || []).map((item: InvoiceItem) => ({
        id: item.id,
        description: item.description,
        amount: item.line_total
      }))
    }))

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}