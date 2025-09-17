// Required env vars: DATABASE_URL
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://invoice_user:invoice_password@localhost:5432/invoice_flow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export { pool }

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper function to get a client for transactions
export async function getClient() {
  return await pool.connect()
}
