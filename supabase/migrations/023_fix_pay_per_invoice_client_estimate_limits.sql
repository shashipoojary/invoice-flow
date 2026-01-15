-- Fix Pay Per Invoice Plan Limits for Clients and Estimates
-- Pay Per Invoice plan should have same limits as Free plan (1 client, 1 estimate)
-- Only Monthly plan has unlimited clients and estimates

-- ============================================
-- FIX CLIENT LIMIT TRIGGER
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

  -- If user not found, default to free plan (fail closed)
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Check limits for free plan AND pay_per_invoice plan (both have 1 client limit)
  -- Only monthly plan has unlimited clients
  IF user_plan = 'free' OR user_plan = 'pay_per_invoice' THEN
    -- Count existing clients for this user (excluding the one being inserted)
    SELECT COUNT(*) INTO client_count
    FROM public.clients
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Check if limit is reached (1 client for free and pay_per_invoice plans)
    IF client_count >= 1 THEN
      IF user_plan = 'pay_per_invoice' THEN
        RAISE EXCEPTION 'Subscription limit reached. Pay Per Invoice plan users can create up to 1 client. Please upgrade to Monthly plan to create unlimited clients.'
          USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 1 client. Please upgrade to create more clients.'
          USING ERRCODE = 'P0001';
      END IF;
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

-- ============================================
-- FIX ESTIMATE LIMIT TRIGGER
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

  -- If user not found, default to free plan (fail closed)
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Check limits for free plan AND pay_per_invoice plan (both have 1 estimate limit)
  -- Only monthly plan has unlimited estimates
  IF user_plan = 'free' OR user_plan = 'pay_per_invoice' THEN
    -- Count existing estimates for this user (excluding the one being inserted)
    SELECT COUNT(*) INTO estimate_count
    FROM public.estimates
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    -- Check if limit is reached (1 estimate for free and pay_per_invoice plans)
    IF estimate_count >= 1 THEN
      IF user_plan = 'pay_per_invoice' THEN
        RAISE EXCEPTION 'Subscription limit reached. Pay Per Invoice plan users can create up to 1 estimate. Please upgrade to Monthly plan to create unlimited estimates.'
          USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'Subscription limit reached. Free plan users can create up to 1 estimate. Please upgrade to create more estimates.'
          USING ERRCODE = 'P0001';
      END IF;
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

