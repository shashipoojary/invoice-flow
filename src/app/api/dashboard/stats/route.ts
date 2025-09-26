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

    // Get total revenue (sum of paid invoices)
    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('invoices')
      .select('total')
      .eq('user_id', user.id)
      .eq('status', 'paid')

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError)
      return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 })
    }

    const totalRevenue = revenueData?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0

    // Get outstanding amount (sum of sent and overdue invoices)
    const { data: outstandingData, error: outstandingError } = await supabaseAdmin
      .from('invoices')
      .select('total')
      .eq('user_id', user.id)
      .in('status', ['sent', 'overdue'])

    if (outstandingError) {
      console.error('Error fetching outstanding amount:', outstandingError)
      return NextResponse.json({ error: 'Failed to fetch outstanding amount' }, { status: 500 })
    }

    const outstandingAmount = outstandingData?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0

    // Get overdue count
    const { count: overdueCount, error: overdueError } = await supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'overdue')

    if (overdueError) {
      console.error('Error fetching overdue count:', overdueError)
      return NextResponse.json({ error: 'Failed to fetch overdue count' }, { status: 500 })
    }

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