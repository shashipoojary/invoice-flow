// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    // Get total revenue (sum of paid invoices)
    const { data: revenueData } = await supabase
      .from('invoices')
      .select('total')
      .eq('user_id', user.id)
      .eq('status', 'paid')

    const totalRevenue = revenueData?.reduce((sum, invoice) => sum + invoice.total, 0) || 0

    // Get outstanding amount (sum of sent and overdue invoices)
    const { data: outstandingData } = await supabase
      .from('invoices')
      .select('total')
      .eq('user_id', user.id)
      .in('status', ['sent', 'overdue'])

    const outstandingAmount = outstandingData?.reduce((sum, invoice) => sum + invoice.total, 0) || 0

    // Get overdue count
    const { count: overdueCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'overdue')

    // Get total clients count
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

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
