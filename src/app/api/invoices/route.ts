import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoices with client data
    const { data: invoicesData, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Fetch invoice items for each invoice
    const invoices = await Promise.all(
      (invoicesData || []).map(async (invoice) => {
        const { data: itemsData, error: itemsError } = await supabaseAdmin
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id)

        if (itemsError) {
          console.error('Error fetching invoice items:', itemsError)
        }

        return {
          ...invoice,
          client: invoice.clients,
          invoice_items: itemsData || []
        }
      })
    )

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}