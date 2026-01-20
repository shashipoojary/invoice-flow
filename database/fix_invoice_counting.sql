-- SQL Script to Fix Invoice Counting Issue
-- This script helps identify and fix users who have incorrect invoice counts
-- due to combining free plan and pay_per_invoice invoices

-- Step 1: Identify users who are on free plan but have pay_per_invoice_activated_at set
-- These users should have pay_per_invoice_activated_at cleared
SELECT 
  id,
  email,
  subscription_plan,
  pay_per_invoice_activated_at,
  created_at
FROM users
WHERE subscription_plan = 'free'
  AND pay_per_invoice_activated_at IS NOT NULL;

-- Step 2: Clear pay_per_invoice_activated_at for users currently on free plan
-- This ensures free and pay_per_invoice data are kept separate
UPDATE users
SET pay_per_invoice_activated_at = NULL,
    updated_at = NOW()
WHERE subscription_plan = 'free'
  AND pay_per_invoice_activated_at IS NOT NULL;

-- Step 3: Verify the fix
-- Check that all free plan users have pay_per_invoice_activated_at = NULL
SELECT 
  id,
  email,
  subscription_plan,
  pay_per_invoice_activated_at
FROM users
WHERE subscription_plan = 'free'
ORDER BY updated_at DESC;

-- Step 4: Optional - Check invoice counts for free plan users
-- This helps verify that the counting logic is working correctly
SELECT 
  u.id,
  u.email,
  u.subscription_plan,
  COUNT(i.id) as total_invoices_this_month,
  COUNT(CASE WHEN br.id IS NOT NULL THEN 1 END) as charged_invoices,
  COUNT(CASE WHEN br.id IS NULL THEN 1 END) as free_invoices
FROM users u
LEFT JOIN invoices i ON i.user_id = u.id
  AND i.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND i.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND i.status != 'draft'
LEFT JOIN billing_records br ON br.invoice_id = i.id
  AND br.type = 'per_invoice_fee'
WHERE u.subscription_plan = 'free'
GROUP BY u.id, u.email, u.subscription_plan
ORDER BY total_invoices_this_month DESC;

