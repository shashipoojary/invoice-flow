# How to Run Migration 020

## Migration: `020_add_pay_per_invoice_tracking.sql`

This migration adds tracking for Pay Per Invoice plan activation to give users their first 5 invoices free.

## Option 1: Supabase Dashboard (Easiest) ✅

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/020_add_pay_per_invoice_tracking.sql`
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

## Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're in the project root directory
cd subscription-pause-tool

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

## What This Migration Does:

1. ✅ Adds `pay_per_invoice_activated_at` column to `users` table
2. ✅ Creates an index for performance
3. ✅ Sets activation dates for existing Pay Per Invoice users
4. ✅ Creates a helper function `get_pay_per_invoice_free_count()` to track free invoices

## Verify Migration Success:

After running, you can verify it worked by running this query in SQL Editor:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'pay_per_invoice_activated_at';

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_pay_per_invoice_free_count';
```

Both should return results if the migration was successful.

