import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Client-side Supabase client (singleton)
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )
  }
  return supabaseInstance
})()

// Server-side client for API routes (singleton)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceKey || supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return supabaseAdminInstance
})()
