// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      startDate, 
      endDate, 
      status, 
      clientId 
    } = body

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients (name, email, company),
        invoice_items (*)
      `)
      .eq('user_id', user.id)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: invoices, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Transform data for CSV
    const csvData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Client Name': invoice.clients.name,
      'Client Email': invoice.clients.email,
      'Client Company': invoice.clients.company,
      'Subtotal': invoice.subtotal,
      'Tax': invoice.tax,
      'Total': invoice.total,
      'Status': invoice.status,
      'Due Date': invoice.due_date,
      'Created Date': new Date(invoice.created_at).toLocaleDateString(),
      'Items Count': invoice.invoice_items.length,
      'Items': invoice.invoice_items.map(item => 
        `${item.description} (${item.qty} x ₹${item.rate})`
      ).join('; ')
    }))

    // Generate CSV
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ','
    })

    // Return CSV as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
