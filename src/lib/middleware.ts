import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthenticatedUser {
  userId: string
  email: string
}

export function verifyToken(request: NextRequest): AuthenticatedUser | null {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      email: decoded.email
    }
  } catch (error) {
    return null
  }
}

