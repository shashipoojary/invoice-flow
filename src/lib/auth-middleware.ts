import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error) {
      // Check if it's a network error
      if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
        console.error('❌ Cannot connect to Supabase. Possible causes:')
        console.error('   1. Supabase project is paused (check Supabase dashboard)')
        console.error('   2. Network connectivity issue')
        console.error('   3. Incorrect NEXT_PUBLIC_SUPABASE_URL in .env.local')
        console.error('   Error:', error.message)
      } else {
        console.error('Auth error:', error.message)
      }
      return null
    }
    
    if (!user) {
      return null
    }

    return user
  } catch (error: any) {
    // Handle network errors specifically
    if (error?.code === 'ENOTFOUND' || error?.message?.includes('fetch failed')) {
      console.error('❌ Network error connecting to Supabase:')
      console.error('   - Check if your Supabase project is active (not paused)')
      console.error('   - Verify NEXT_PUBLIC_SUPABASE_URL in .env.local')
      console.error('   - Check your internet connection')
    } else {
      console.error('Auth middleware error:', error)
    }
    return null
  }
}
