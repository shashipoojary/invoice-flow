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

    // Fetch clients
    const result = await query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    return NextResponse.json({ clients: result.rows })

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, company, phone, address } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create client
    const result = await query(
      'INSERT INTO clients (user_id, name, email, company, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, email, company, phone, address]
    )

    return NextResponse.json({ client: result.rows[0] })

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
