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

    // Fetch clients from Supabase
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({ clients: data || [] })

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, company, phone, address } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Create client in Supabase
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({
        user_id: user.id,
        name,
        email,
        company,
        phone,
        address
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ client: data })

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
