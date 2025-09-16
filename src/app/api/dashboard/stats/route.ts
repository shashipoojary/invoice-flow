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

    // Get total revenue (sum of paid invoices)
    const revenueResult = await query(
      'SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE user_id = $1 AND status = $2',
      [userId, 'paid']
    )
    const totalRevenue = parseFloat(revenueResult.rows[0]?.total || '0')

    // Get outstanding amount (sum of sent and overdue invoices)
    const outstandingResult = await query(
      'SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE user_id = $1 AND status IN ($2, $3)',
      [userId, 'sent', 'overdue']
    )
    const outstandingAmount = parseFloat(outstandingResult.rows[0]?.total || '0')

    // Get overdue count
    const overdueResult = await query(
      'SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND status = $2',
      [userId, 'overdue']
    )
    const overdueCount = parseInt(overdueResult.rows[0]?.count || '0')

    // Get total clients count
    const clientsResult = await query(
      'SELECT COUNT(*) as count FROM clients WHERE user_id = $1',
      [userId]
    )
    const totalClients = parseInt(clientsResult.rows[0]?.count || '0')

    return NextResponse.json({
      totalRevenue,
      outstandingAmount,
      overdueCount,
      totalClients
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
