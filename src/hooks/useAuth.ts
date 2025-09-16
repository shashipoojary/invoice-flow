import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (simple localStorage check for demo)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Simple demo authentication - in production, this would call your API
    if (email && password) {
      const user = {
        id: '1',
        email: email,
        name: email.split('@')[0]
      }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      return { data: { user }, error: null }
    }
    return { data: null, error: new Error('Invalid credentials') }
  }

  const signUp = async (email: string, password: string) => {
    // Simple demo registration
    if (email && password) {
      const user = {
        id: '1',
        email: email,
        name: email.split('@')[0]
      }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      return { data: { user }, error: null }
    }
    return { data: null, error: new Error('Registration failed') }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('user')
    return { error: null }
  }

  const getAuthHeaders = () => {
    if (!user) return {}
    return {
      'Content-Type': 'application/json',
      'X-User-ID': user.id
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getAuthHeaders
  }
}
