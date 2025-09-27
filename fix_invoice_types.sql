-- Fix invoice types for existing invoices
-- Run this in your Supabase SQL Editor

-- Check current invoice types
SELECT id, invoice_number, type, created_at 
FROM public.invoices 
ORDER BY created_at DESC;

-- Update any invoices that don't have a type set
UPDATE public.invoices 
SET type = 'detailed' 
WHERE type IS NULL OR type = '';

-- If you want to set specific invoices as 'fast' based on some criteria, you can do:
-- UPDATE public.invoices 
-- SET type = 'fast' 
-- WHERE [your criteria here];

-- Verify the changes
SELECT id, invoice_number, type, created_at 
FROM public.invoices 
ORDER BY created_at DESC;
