-- =====================================================
-- SUBSCRIPTION LIMITS ENFORCEMENT
-- =====================================================
-- Database-level subscription limit enforcement
-- This ensures subscription limits cannot be bypassed even if API checks are skipped

-- =====================================================
-- 1. INVOICE LIMIT FUNCTION & TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION check_subscription_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  current_month_count integer;
  start_of_month timestamptz;
  end_of_month timestamptz;
  pay_per_invoice_activated timestamptz;
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

    -- Count free plan invoices created this month by this user
    -- IMPORTANT: Use the SAME logic as countFreePlanInvoices() to ensure consistency
    -- This means excluding:
    -- 1. Draft invoices (status != 'draft')
    -- 2. Invoices with billing records (charged invoices = pay_per_invoice invoices)
    -- 3. Invoices created after pay_per_invoice_activated_at (if it exists)
    
    -- Get pay_per_invoice activation date if it exists
    SELECT pay_per_invoice_activated_at INTO pay_per_invoice_activated
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- Count only free plan invoices (non-draft, no billing records, before activation if applicable)
    SELECT COUNT(*) INTO current_month_count
    FROM public.invoices i
    WHERE i.user_id = NEW.user_id
      AND i.created_at >= start_of_month
      AND i.created_at <= end_of_month
      AND i.status != 'draft'  -- Exclude drafts - only count sent/paid invoices
      AND i.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)  -- Exclude current insert
      -- Exclude invoices with billing records (charged = pay_per_invoice invoices)
      AND NOT EXISTS (
        SELECT 1 FROM public.billing_records br
        WHERE br.invoice_id = i.id
          AND br.user_id = NEW.user_id
          AND br.type = 'per_invoice_fee'
      )
      -- Exclude invoices created after pay_per_invoice activation (if activation date exists)
      AND (pay_per_invoice_activated IS NULL OR i.created_at < pay_per_invoice_activated);

    -- Check if limit is reached (5 invoices per month for free plan)
    -- If current_month_count is 5 or more, this would be the 6th invoice
    IF current_month_count >= 5 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 5 invoices per month. Please upgrade to create more invoices.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Allow insertion for monthly and pay_per_invoice plans, or if under limit
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS enforce_subscription_limit_trigger ON public.invoices;
CREATE TRIGGER enforce_subscription_limit_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limit();

-- =====================================================
-- 2. CLIENT LIMIT FUNCTION & TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION check_client_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  client_count integer;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(subscription_plan, 'free') INTO user_plan
  FROM public.users
  WHERE id = NEW.user_id;

  -- If user not found, default to free plan (fail closed)
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Count existing clients for this user (excluding the one being inserted)
    SELECT COUNT(*) INTO client_count
    FROM public.clients
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Check if limit is reached (1 client for free plan)
    IF client_count >= 1 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 1 client. Please upgrade to create more clients.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS enforce_client_limit_trigger ON public.clients;
CREATE TRIGGER enforce_client_limit_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION check_client_limit();

-- =====================================================
-- 3. ESTIMATE LIMIT FUNCTION & TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION check_estimate_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  estimate_count integer;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(subscription_plan, 'free') INTO user_plan
  FROM public.users
  WHERE id = NEW.user_id;

  -- If user not found, default to free plan (fail closed)
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Count existing estimates for this user (excluding the one being inserted)
    SELECT COUNT(*) INTO estimate_count
    FROM public.estimates
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Check if limit is reached (1 estimate for free plan)
    IF estimate_count >= 1 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 1 estimate. Please upgrade to create more estimates.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS enforce_estimate_limit_trigger ON public.estimates;
CREATE TRIGGER enforce_estimate_limit_trigger
  BEFORE INSERT ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION check_estimate_limit();

-- =====================================================
-- 4. REMINDER LIMIT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION check_reminder_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_plan text;
  reminder_count integer;
  start_of_month timestamptz;
  end_of_month timestamptz;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(subscription_plan, 'free') INTO user_plan
  FROM public.users
  WHERE id = p_user_id;

  -- If user not found, default to free plan (fail closed)
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Calculate current month boundaries (using UTC to avoid timezone issues)
    start_of_month := date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    end_of_month := (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '1 month' - interval '1 day')::date + interval '23 hours 59 minutes 59 seconds';

    -- Count reminders sent this month (from invoice_reminders joined with invoices)
    SELECT COUNT(*) INTO reminder_count
    FROM public.invoice_reminders ir
    INNER JOIN public.invoices i ON ir.invoice_id = i.id
    WHERE i.user_id = p_user_id
      AND ir.reminder_status = 'sent'
      AND ir.sent_at >= start_of_month
      AND ir.sent_at <= end_of_month;

    -- Check if limit is reached (4 reminders per month for free plan)
    IF reminder_count >= 4 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can send up to 4 auto reminders per month. Please upgrade for unlimited reminders.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON FUNCTION check_subscription_limit() IS 
  'Enforces subscription limits at database level. Free plan users are limited to 5 invoices per month. This cannot be bypassed by API calls. Uses UTC for consistent month boundaries.';

COMMENT ON FUNCTION check_client_limit() IS 
  'Enforces client limits at database level. Free plan users are limited to 1 client. This cannot be bypassed.';

COMMENT ON FUNCTION check_estimate_limit() IS 
  'Enforces estimate limits at database level. Free plan users are limited to 1 estimate. This cannot be bypassed.';

COMMENT ON FUNCTION check_reminder_limit(uuid) IS 
  'Enforces reminder limits at database level. Free plan users are limited to 4 reminders per month (global). This cannot be bypassed. Uses UTC for consistent month boundaries.';

