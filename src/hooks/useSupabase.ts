import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to refresh session
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session) {
        setSession(session)
        setUser(session.user ?? null)
      } else if (error) {
        // Only clear if it's a real error, not just expired token
        if (!error.message?.includes('expired') && !error.message?.includes('refresh_token_not_found')) {
          console.error('Session refresh error:', error)
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  useEffect(() => {
    // Check if we're in the browser and have valid Supabase config
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Handle visibility change - refresh session when app comes back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App came back to foreground, refresh session
        refreshSession()
      }
    }

    // Handle focus - refresh session when window regains focus
    const handleFocus = () => {
      refreshSession()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })
      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
