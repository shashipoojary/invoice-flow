import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId } = await params

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Get client from Supabase
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id) // Ensure user can only access their own clients
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client: data })

  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId } = await params

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, company, phone, address } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Update client in Supabase
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update({
        name,
        email,
        company,
        phone,
        address
      })
      .eq('id', clientId)
      .eq('user_id', user.id) // Ensure user can only update their own clients
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client: data })

  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId } = await params

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Delete client from Supabase
    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id) // Ensure user can only delete their own clients

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully' })

  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
