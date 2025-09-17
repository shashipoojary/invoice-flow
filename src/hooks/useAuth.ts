'use client'

import { useState, useEffect, useCallback } from 'react'

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
  getAuthHeaders: () => { [key: string]: string }
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
      }
    }
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: new Error(data.error || 'Login failed') }
      }

      // Store user and token
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      setUser(data.user)

      return { data: { user: data.user }, error: null }
    } catch (err) {
      console.error('Login error:', err)
      return { data: null, error: new Error('Network error') }
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: new Error(data.error || 'Registration failed') }
      }

      // Store user and token from registration
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      setUser(data.user)

      return { data: { user: data.user }, error: null }
    } catch (err) {
      console.error('Signup error:', err)
      return { data: null, error: new Error('Network error') }
    } finally {
      setLoading(false)
    }
  }, [signIn])

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
    setUser(null)
    return { error: null }
  }, [])

  const getAuthHeaders = useCallback(() => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    }
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    
    return headers
  }, [])

  return { user, loading, signIn, signUp, signOut, getAuthHeaders }
}