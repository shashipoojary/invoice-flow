import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL client
// This replaces the Supabase client
export const sql = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
  transform: {
    // Transform PostgreSQL types to JavaScript types
    undefined: null,
  },
});

// Helper function to handle JSONB columns
export function parseJsonb<T = any>(value: any): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

// Helper function to stringify JSONB
export function stringifyJsonb(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value; // Already stringified
  return JSON.stringify(value);
}

// Helper to safely convert UUID strings to PostgreSQL UUID type
export function toUUID(value: string): string {
  return value;
}

