-- Database-level subscription limit enforcement
-- This trigger ensures subscription limits cannot be bypassed even if API checks are skipped

-- Function to check subscription limits before invoice creation
CREATE OR REPLACE FUNCTION check_subscription_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  current_month_count integer;
  start_of_month timestamptz;
  end_of_month timestamptz;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(subscription_plan, 'free') INTO user_plan
  FROM public.users
  WHERE id = NEW.user_id;

  -- Only check limits for free plan users
  IF user_plan = 'free' THEN
    -- Calculate current month boundaries
    start_of_month := date_trunc('month', CURRENT_DATE);
    end_of_month := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date + interval '23 hours 59 minutes 59 seconds';

    -- Count invoices created this month by this user
    SELECT COUNT(*) INTO current_month_count
    FROM public.invoices
    WHERE user_id = NEW.user_id
      AND created_at >= start_of_month
      AND created_at <= end_of_month;

    -- Check if limit is reached (5 invoices per month for free plan)
    IF current_month_count >= 5 THEN
      RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 5 invoices per month. Please upgrade to create more invoices.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Allow insertion for monthly and pay_per_invoice plans, or if under limit
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce subscription limits BEFORE INSERT
-- This runs before the row is inserted, so it prevents the insert if limit is exceeded
CREATE TRIGGER enforce_subscription_limit_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limit();

-- Add comment for documentation
COMMENT ON FUNCTION check_subscription_limit() IS 
  'Enforces subscription limits at database level. Free plan users are limited to 5 invoices per month. This cannot be bypassed by API calls.';

COMMENT ON TRIGGER enforce_subscription_limit_trigger ON public.invoices IS 
  'Prevents invoice creation if subscription limit is exceeded. This is the final enforcement layer for subscription limits.';

