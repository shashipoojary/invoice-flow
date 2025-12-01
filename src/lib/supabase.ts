import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'your-supabase-project-url' || supabaseUrl.includes('placeholder')) {
  console.error('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set or invalid. Please check your .env.local file.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key' || supabaseAnonKey.includes('placeholder')) {
  console.error('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid. Please check your .env.local file.')
}

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Client-side Supabase client (singleton)
export const supabase = (() => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration is missing. Dashboard will not work properly.')
    }
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
    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      console.error('❌ Supabase admin configuration is missing. API routes will not work properly.')
    }
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
