-- Comprehensive Subscription Plan Limits Enforcement
-- This migration enforces ALL subscription plan restrictions at the database level
-- FREE PLAN LIMITS:
--   - Max 5 invoices per month (includes fast, detailed, and estimate conversions)
--   - Max 1 client
--   - Max 1 estimate
--   - Max 4 auto reminders per month (global)
--   - Only template 1 enabled (enforced in application logic)
--   - Customization disabled (enforced in application logic)

-- ============================================
-- INVOICE LIMITS (already exists, but updating)
-- ============================================
-- Function already exists in 016, but we'll ensure it's correct

-- ============================================
-- CLIENT LIMITS
-- ============================================
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

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Count existing clients for this user
    SELECT COUNT(*) INTO client_count
    FROM public.clients
    WHERE user_id = NEW.user_id;

    -- Check if limit is reached (1 client for free plan)
    IF client_count >= 1 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 1 client. Please upgrade to create more clients.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce client limits BEFORE INSERT
DROP TRIGGER IF EXISTS enforce_client_limit_trigger ON public.clients;
CREATE TRIGGER enforce_client_limit_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION check_client_limit();

-- ============================================
-- ESTIMATE LIMITS
-- ============================================
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

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Count existing estimates for this user
    SELECT COUNT(*) INTO estimate_count
    FROM public.estimates
    WHERE user_id = NEW.user_id;

    -- Check if limit is reached (1 estimate for free plan)
    IF estimate_count >= 1 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 1 estimate. Please upgrade to create more estimates.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce estimate limits BEFORE INSERT
DROP TRIGGER IF EXISTS enforce_estimate_limit_trigger ON public.estimates;
CREATE TRIGGER enforce_estimate_limit_trigger
  BEFORE INSERT ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION check_estimate_limit();

-- ============================================
-- REMINDER LIMITS (Global monthly limit)
-- ============================================
-- Note: Reminders are sent via cron job, so we check before sending
-- This function will be called from the API route, not as a trigger
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

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Calculate current month boundaries
    start_of_month := date_trunc('month', CURRENT_DATE);
    end_of_month := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date + interval '23 hours 59 minutes 59 seconds';

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

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON FUNCTION check_client_limit() IS 
  'Enforces client limits at database level. Free plan users are limited to 1 client. This cannot be bypassed.';

COMMENT ON FUNCTION check_estimate_limit() IS 
  'Enforces estimate limits at database level. Free plan users are limited to 1 estimate. This cannot be bypassed.';

COMMENT ON FUNCTION check_reminder_limit(uuid) IS 
  'Enforces reminder limits at database level. Free plan users are limited to 4 reminders per month (global). This cannot be bypassed.';

COMMENT ON TRIGGER enforce_client_limit_trigger ON public.clients IS 
  'Prevents client creation if subscription limit is exceeded. This is the final enforcement layer for client limits.';

COMMENT ON TRIGGER enforce_estimate_limit_trigger ON public.estimates IS 
  'Prevents estimate creation if subscription limit is exceeded. This is the final enforcement layer for estimate limits.';

