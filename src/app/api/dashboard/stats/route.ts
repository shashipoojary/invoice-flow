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

    // Get all invoice data in one query
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('total, status')
      .eq('user_id', user.id)

    if (invoiceError) {
      console.error('Error fetching invoices:', invoiceError)
      return NextResponse.json({ error: 'Failed to fetch invoice data' }, { status: 500 })
    }

    // Calculate stats from the single query result
    const totalRevenue = invoiceData
      ?.filter(invoice => invoice.status === 'paid')
      ?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0

    const outstandingAmount = invoiceData
      ?.filter(invoice => ['sent', 'overdue'].includes(invoice.status))
      ?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0

    const overdueCount = invoiceData
      ?.filter(invoice => invoice.status === 'overdue')
      ?.length || 0

    // Get total clients count
    const { count: totalClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Error fetching clients count:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients count' }, { status: 500 })
    }

    return NextResponse.json({
      totalRevenue,
      outstandingAmount,
      overdueCount: overdueCount || 0,
      totalClients: totalClients || 0
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}