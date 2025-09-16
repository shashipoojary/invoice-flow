// Required env vars: DATABASE_URL
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoices with client and items
    const invoicesResult = await query(
      `SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [userId]
    )

    // Fetch invoice items for each invoice
    const invoices = await Promise.all(
      invoicesResult.rows.map(async (invoice) => {
        const itemsResult = await query(
          'SELECT * FROM invoice_items WHERE invoice_id = $1',
          [invoice.id]
        )
        return {
          ...invoice,
          clients: {
            name: invoice.client_name,
            email: invoice.client_email,
            company: invoice.client_company
          },
          invoice_items: itemsResult.rows
        }
      })
    )

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
