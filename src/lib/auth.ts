import bcrypt from 'bcryptjs'
import { insert, queryOne } from './database-simple'

export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  created_at: string
  updated_at: string
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 12)
  
  const result = insert(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, hashedPassword, name]
  )
  
  if (!result.insertId) {
    throw new Error('Failed to create user - no insert ID returned')
  }
  
  // Get the created user
  const userResult = queryOne(
    'SELECT * FROM users WHERE id = ?',
    [result.insertId]
  )
  
  if (!userResult.rows[0]) {
    throw new Error('Failed to retrieve created user')
  }
  
  return userResult.rows[0]
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = queryOne(
    'SELECT * FROM users WHERE email = ?',
    [email]
  )
  
  return result.rows[0] || null
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function getUserById(id: string): Promise<User | null> {
  const result = queryOne(
    'SELECT * FROM users WHERE id = ?',
    [id]
  )
  
  return result.rows[0] || null
}

