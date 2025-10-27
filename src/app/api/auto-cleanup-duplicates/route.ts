import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all clients for this user, ordered by created_at
    const { data: allClients, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching clients:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    if (!allClients || allClients.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No clients found',
        duplicatesRemoved: 0
      })
    }

    // Group clients by email (case insensitive)
    const emailGroups = new Map()
    allClients.forEach(client => {
      const email = client.email.toLowerCase().trim()
      if (!emailGroups.has(email)) {
        emailGroups.set(email, [])
      }
      emailGroups.get(email).push(client)
    })

    let duplicatesRemoved = 0

    // Process each email group
    for (const [email, clients] of emailGroups) {
      if (clients.length > 1) {
        // Keep the most recent client (first in the array since we ordered by created_at DESC)
        // Delete the rest (duplicates)
        const duplicateIds = clients.slice(1).map((c: any) => c.id)
        duplicatesRemoved += duplicateIds.length

        // Delete duplicates
        for (const duplicateId of duplicateIds) {
          const { error: deleteError } = await supabaseAdmin
            .from('clients')
            .delete()
            .eq('id', duplicateId)
          
          if (deleteError) {
            console.error(`Error deleting duplicate client ${duplicateId}:`, deleteError)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: duplicatesRemoved > 0 ? `Cleaned up ${duplicatesRemoved} duplicate clients` : 'No duplicates found',
      duplicatesRemoved
    })

  } catch (error) {
    console.error('Error in auto-cleanup-duplicates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
