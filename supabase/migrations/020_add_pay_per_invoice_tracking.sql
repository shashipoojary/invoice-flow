-- Add tracking for Pay Per Invoice plan activation
-- This allows us to give users their first 5 invoices free when switching to Pay Per Invoice

-- Add column to track when user switched to Pay Per Invoice
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pay_per_invoice_activated_at timestamptz;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_pay_per_invoice_activated_at 
ON public.users(pay_per_invoice_activated_at) 
WHERE pay_per_invoice_activated_at IS NOT NULL;

-- Update existing Pay Per Invoice users to set activation date to their subscription start
-- (or current time if we don't have that data)
UPDATE public.users 
SET pay_per_invoice_activated_at = COALESCE(
  (SELECT MIN(created_at) FROM public.invoices WHERE user_id = users.id),
  NOW()
)
WHERE subscription_plan = 'pay_per_invoice' 
  AND pay_per_invoice_activated_at IS NULL;

-- Function to get free invoice count for Pay Per Invoice users
CREATE OR REPLACE FUNCTION get_pay_per_invoice_free_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  user_plan text;
  activation_date timestamptz;
  invoice_count integer;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(subscription_plan, 'free'), pay_per_invoice_activated_at
  INTO user_plan, activation_date
  FROM public.users
  WHERE id = p_user_id;

  -- Only for Pay Per Invoice users
  IF user_plan = 'pay_per_invoice' AND activation_date IS NOT NULL THEN
    -- Count invoices created after switching to Pay Per Invoice
    SELECT COUNT(*) INTO invoice_count
    FROM public.invoices
    WHERE user_id = p_user_id
      AND created_at >= activation_date
      AND status != 'draft'; -- Only count non-draft invoices (drafts don't count)
    
    RETURN invoice_count;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pay_per_invoice_free_count(uuid) IS 
  'Returns the count of invoices created by a Pay Per Invoice user after switching to the plan. First 5 are free.';

