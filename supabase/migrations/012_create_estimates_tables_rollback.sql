-- Rollback script for estimates feature migration
-- This will remove all tables, functions, triggers, and policies created by the migration
-- USE WITH CAUTION: This will delete all estimate data!

-- =====================================================
-- 1. DROP TRIGGERS FIRST
-- =====================================================
DROP TRIGGER IF EXISTS update_estimates_updated_at ON public.estimates;

-- =====================================================
-- 2. DROP FUNCTIONS
-- =====================================================
DROP FUNCTION IF EXISTS public.update_estimates_updated_at();
DROP FUNCTION IF EXISTS public.generate_estimate_number(UUID);

-- =====================================================
-- 3. DROP POLICIES (RLS)
-- =====================================================
-- Estimate events policies
DROP POLICY IF EXISTS "Users can insert own estimate events" ON public.estimate_events;
DROP POLICY IF EXISTS "Users can view own estimate events" ON public.estimate_events;

-- Estimate items policies
DROP POLICY IF EXISTS "Users can delete own estimate items" ON public.estimate_items;
DROP POLICY IF EXISTS "Users can update own estimate items" ON public.estimate_items;
DROP POLICY IF EXISTS "Users can insert own estimate items" ON public.estimate_items;
DROP POLICY IF EXISTS "Users can view own estimate items" ON public.estimate_items;

-- Estimates policies
DROP POLICY IF EXISTS "Users can delete own estimates" ON public.estimates;
DROP POLICY IF EXISTS "Users can update own estimates" ON public.estimates;
DROP POLICY IF EXISTS "Users can insert own estimates" ON public.estimates;
DROP POLICY IF EXISTS "Users can view own estimates" ON public.estimates;

-- =====================================================
-- 4. DROP INDEXES
-- =====================================================
DROP INDEX IF EXISTS public.idx_estimate_events_estimate_id;
DROP INDEX IF EXISTS public.idx_estimate_items_estimate_id;
DROP INDEX IF EXISTS public.idx_estimates_public_token;
DROP INDEX IF EXISTS public.idx_estimates_approval_status;
DROP INDEX IF EXISTS public.idx_estimates_status;
DROP INDEX IF EXISTS public.idx_estimates_client_id;
DROP INDEX IF EXISTS public.idx_estimates_user_id;

-- =====================================================
-- 5. DROP TABLES (in reverse order due to foreign keys)
-- =====================================================
-- Drop tables that reference estimates first
DROP TABLE IF EXISTS public.estimate_events CASCADE;
DROP TABLE IF EXISTS public.estimate_items CASCADE;

-- Drop the main estimates table
DROP TABLE IF EXISTS public.estimates CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this script, you can verify by checking:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'estimate%';
-- This should return no rows if rollback was successful

