# API Route Migration Example

This document shows how to migrate an API route from Supabase to PostgreSQL.

## Example: Migrating `/api/invoices/route.ts`

### Before (Supabase):

```typescript
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: invoicesData, error: invoicesError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      clients (
        id,
        name,
        email,
        company,
        phone,
        address
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (invoicesError) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }

  // ... rest of the code
}
```

### After (PostgreSQL):

```typescript
import { sql, parseJsonb } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch invoices
  const invoicesData = await sql`
    SELECT 
      i.*,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'email', c.email,
        'company', c.company,
        'phone', c.phone,
        'address', c.address
      ) as clients
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ${user.id}::uuid
    ORDER BY i.created_at DESC
  `;

  // Parse JSONB columns
  const invoices = invoicesData.map(invoice => ({
    ...invoice,
    branding: parseJsonb(invoice.branding),
    reminder_settings: parseJsonb(invoice.reminder_settings),
    payment_terms: parseJsonb(invoice.payment_terms),
    theme: parseJsonb(invoice.theme),
    clients: invoice.clients ? parseJsonb(invoice.clients) : null,
  }));

  // ... rest of the code
}
```

## Key Changes:

1. **Import**: Replace `supabaseAdmin` with `sql` from `@/lib/postgres`
2. **Queries**: Convert Supabase query builder to SQL template literals
3. **JSONB**: Use `parseJsonb()` helper for JSONB columns
4. **Joins**: Use SQL JOINs instead of Supabase's nested select
5. **Error Handling**: Check for query errors directly

## Common Patterns:

### Pattern 1: Simple SELECT
```typescript
// Before
const { data } = await supabaseAdmin
  .from('invoices')
  .select('*')
  .eq('user_id', userId);

// After
const data = await sql`
  SELECT * FROM invoices
  WHERE user_id = ${userId}::uuid
`;
```

### Pattern 2: INSERT with RETURNING
```typescript
// Before
const { data } = await supabaseAdmin
  .from('invoices')
  .insert({ user_id: userId, total: 100 })
  .select()
  .single();

// After
const [data] = await sql`
  INSERT INTO invoices (user_id, total)
  VALUES (${userId}::uuid, ${100})
  RETURNING *
`;
```

### Pattern 3: UPDATE
```typescript
// Before
const { data } = await supabaseAdmin
  .from('invoices')
  .update({ status: 'paid' })
  .eq('id', invoiceId)
  .select()
  .single();

// After
const [data] = await sql`
  UPDATE invoices
  SET status = ${'paid'}, updated_at = NOW()
  WHERE id = ${invoiceId}::uuid
  RETURNING *
`;
```

### Pattern 4: DELETE
```typescript
// Before
await supabaseAdmin
  .from('invoices')
  .delete()
  .eq('id', invoiceId);

// After
await sql`
  DELETE FROM invoices
  WHERE id = ${invoiceId}::uuid
`;
```

### Pattern 5: Using RPC Functions
```typescript
// Before
const { data } = await supabase.rpc('generate_invoice_number', { 
  user_uuid: userId 
});

// After
import { generateInvoiceNumber } from '@/lib/db-functions';
const invoiceNumber = await generateInvoiceNumber(userId);
```

### Pattern 6: IN clause
```typescript
// Before
const { data } = await supabaseAdmin
  .from('invoice_items')
  .select('*')
  .in('invoice_id', invoiceIds);

// After
const data = await sql`
  SELECT * FROM invoice_items
  WHERE invoice_id = ANY(${invoiceIds}::uuid[])
`;
```

### Pattern 7: JSONB Operations
```typescript
// Before
const { data } = await supabaseAdmin
  .from('invoices')
  .select('branding')
  .eq('id', invoiceId)
  .single();

// After
const [invoice] = await sql`
  SELECT branding FROM invoices
  WHERE id = ${invoiceId}::uuid
`;
const branding = parseJsonb(invoice.branding);
```

