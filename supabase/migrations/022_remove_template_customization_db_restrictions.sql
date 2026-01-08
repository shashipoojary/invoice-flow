-- Remove any database-level template/customization restrictions
-- Templates and customization are handled in API layer only
-- Database should only enforce invoice/client/estimate/reminder limits

-- ============================================
-- VERIFY AND FIX INVOICE LIMIT TRIGGER
-- ============================================
-- Ensure the trigger ONLY checks invoice count, NOT templates or customization
CREATE OR REPLACE FUNCTION check_subscription_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  current_month_count integer;
  start_of_month timestamptz;
  end_of_month timestamptz;
BEGIN
  -- Get user's subscription plan (with explicit error handling)
  SELECT COALESCE(subscription_plan, 'free') INTO user_plan
  FROM public.users
  WHERE id = NEW.user_id;

  -- If user not found, default to free plan (fail closed)
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Calculate current month boundaries (using UTC to avoid timezone issues)
    start_of_month := date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    end_of_month := (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '1 month' - interval '1 day')::date + interval '23 hours 59 minutes 59 seconds';

    -- Count invoices created this month by this user
    -- Exclude the invoice being inserted (BEFORE INSERT trigger)
    SELECT COUNT(*) INTO current_month_count
    FROM public.invoices
    WHERE user_id = NEW.user_id
      AND created_at >= start_of_month
      AND created_at <= end_of_month
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid); -- Exclude current insert

    -- Check if limit is reached (5 invoices per month for free plan)
    -- If current_month_count is 5 or more, this would be the 6th invoice
    IF current_month_count >= 5 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 5 invoices per month. Please upgrade to create more invoices.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- IMPORTANT: Do NOT check templates or customization here
  -- Templates and customization are handled in the API layer only
  -- Database trigger should ONLY check invoice count limits

  -- Allow insertion for monthly and pay_per_invoice plans, or if under limit
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists and is correct
DROP TRIGGER IF EXISTS enforce_subscription_limit_trigger ON public.invoices;
CREATE TRIGGER enforce_subscription_limit_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limit();

-- Add comment for documentation
COMMENT ON FUNCTION check_subscription_limit() IS 
  'Enforces subscription limits at database level. Free plan users are limited to 5 invoices per month. This ONLY checks invoice count - templates and customization are handled in API layer. Uses UTC for consistent month boundaries.';

COMMENT ON TRIGGER enforce_subscription_limit_trigger ON public.invoices IS 
  'Prevents invoice creation if subscription limit is exceeded. This is the final enforcement layer for invoice count limits only. Templates and customization are NOT checked here.';

-- ============================================
-- VERIFY NO OTHER TRIGGERS CHECK TEMPLATES/CUSTOMIZATION
-- ============================================
-- List all triggers on invoices table to verify
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE 'Checking all triggers on invoices table...';
  FOR trigger_record IN 
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'invoices'
  LOOP
    RAISE NOTICE 'Trigger: % | Event: % | Statement: %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation,
      trigger_record.action_statement;
  END LOOP;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
-- This migration ensures:
-- 1. Database trigger ONLY checks invoice count (5 per month for free plan)
-- 2. NO database-level template restrictions
-- 3. NO database-level customization restrictions
-- 4. Templates and customization are handled in API layer only
-- 5. Database is the final enforcement for invoice count limits only

