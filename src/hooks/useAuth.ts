'use client'

import { useCallback } from 'react'
import { useSupabase } from './useSupabase'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: { user: User } | null; error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ data: { user: User } | null; error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  getAuthHeaders: () => Promise<{ [key: string]: string }>
}

export function useAuth(): AuthContextType {
  const { user, loading, signIn: supabaseSignIn, signUp: supabaseSignUp, signOut: supabaseSignOut } = useSupabase()

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseSignIn(email, password)
      
      if (error) {
        return { data: null, error: new Error(error.message || 'Login failed') }
      }

      const userData = data?.user ? {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email || 'User'
      } : null

      return { data: userData ? { user: userData } : null, error: null }
    } catch {
      console.error('Sign in error')
      return { data: null, error: new Error('Login failed') }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabaseSignUp(email, password, name)
      
      if (error) {
        return { data: null, error: new Error(error.message || 'Registration failed') }
      }

      const userData = data?.user ? {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email || 'User'
      } : null

      return { data: userData ? { user: userData } : null, error: null }
    } catch {
      console.error('Sign up error')
      return { data: null, error: new Error('Registration failed') }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabaseSignOut()
      return { error: error ? new Error(error.message) : null }
    } catch {
      return { error: new Error('Sign out failed') }
    }
  }

  const getAuthHeaders = useCallback(async (): Promise<{ [key: string]: string }> => {
    // Get the current session token from Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    } catch (error) {
      console.error('Error getting session:', error)
    }
    
    return {
      'Content-Type': 'application/json',
    }
  }, [])

  return {
    user: user ? {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email || 'User'
    } : null,
    loading,
    signIn,
    signUp,
    signOut,
    getAuthHeaders,
  }
}