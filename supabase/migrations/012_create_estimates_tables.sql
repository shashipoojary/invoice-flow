-- Estimates feature migration
-- Creates tables for estimate management with approval/rejection workflow

-- =====================================================
-- 1. ESTIMATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  estimate_number TEXT NOT NULL,
  public_token TEXT NOT NULL UNIQUE,
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_to_invoice_id UUID REFERENCES public.invoices(id),
  branding JSONB DEFAULT '{}',
  notes TEXT,
  issue_date DATE,
  payment_terms JSONB DEFAULT '{}',
  theme JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ESTIMATE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimate_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC DEFAULT 1,
  rate NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ESTIMATE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimate_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'sent', 'viewed', 'approved', 'rejected', 'converted'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON public.estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON public.estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON public.estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_approval_status ON public.estimates(approval_status);
CREATE INDEX IF NOT EXISTS idx_estimates_public_token ON public.estimates(public_token);
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON public.estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_events_estimate_id ON public.estimate_events(estimate_id);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_events ENABLE ROW LEVEL SECURITY;

-- Estimates policies
CREATE POLICY "Users can view own estimates" ON public.estimates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own estimates" ON public.estimates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own estimates" ON public.estimates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own estimates" ON public.estimates
  FOR DELETE USING (user_id = auth.uid());

-- Estimate items policies
CREATE POLICY "Users can view own estimate items" ON public.estimate_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.estimates e 
      WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own estimate items" ON public.estimate_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estimates e 
      WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own estimate items" ON public.estimate_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.estimates e 
      WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own estimate items" ON public.estimate_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.estimates e 
      WHERE e.id = estimate_items.estimate_id AND e.user_id = auth.uid()
    )
  );

-- Estimate events policies
CREATE POLICY "Users can view own estimate events" ON public.estimate_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.estimates e 
      WHERE e.id = estimate_events.estimate_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own estimate events" ON public.estimate_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estimates e 
      WHERE e.id = estimate_events.estimate_id AND e.user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. ESTIMATE NUMBER GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_estimate_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  estimate_count INTEGER;
  estimate_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO estimate_count 
  FROM public.estimates 
  WHERE user_id = user_uuid;
  
  estimate_number := 'EST-' || LPAD(estimate_count::TEXT, 4, '0');
  
  RETURN estimate_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. UPDATE TRIGGER FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_estimates_updated_at();

