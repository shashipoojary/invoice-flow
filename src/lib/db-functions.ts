import { sql } from './postgres';

/**
 * Generate invoice number (replaces supabase.rpc('generate_invoice_number'))
 */
export async function generateInvoiceNumber(userId: string): Promise<string> {
  const [result] = await sql`
    SELECT generate_invoice_number(${userId}::uuid) as invoice_number
  `;
  return result.invoice_number;
}

/**
 * Generate estimate number (replaces supabase.rpc('generate_estimate_number'))
 */
export async function generateEstimateNumber(userId: string): Promise<string> {
  const [result] = await sql`
    SELECT generate_estimate_number(${userId}::uuid) as estimate_number
  `;
  return result.estimate_number;
}

/**
 * Generate public token (replaces supabase.rpc('generate_public_token'))
 */
export async function generatePublicToken(): Promise<string> {
  const [result] = await sql`
    SELECT generate_public_token() as token
  `;
  return result.token;
}

