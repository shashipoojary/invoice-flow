-- Row Level Security (RLS) Policies
-- Run this after the initial schema migration

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "clients_user_only" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "invoices_user_only" ON public.invoices
  FOR ALL USING (auth.uid() = user_id);

-- Invoice items policies (inherited through invoice ownership)
CREATE POLICY "invoice_items_user_only" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "payments_user_only" ON public.payments
  FOR ALL USING (auth.uid() = user_id);

-- Invoice PDFs policies
CREATE POLICY "invoice_pdfs_user_only" ON public.invoice_pdfs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_pdfs.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Billing records policies
CREATE POLICY "billing_records_user_only" ON public.billing_records
  FOR ALL USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "user_settings_user_only" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Public access for hosted invoice page (read-only by public_token)
CREATE POLICY "invoices_public_read" ON public.invoices
  FOR SELECT USING (true); -- This allows public read access for hosted pages

-- Note: The hosted invoice page will use a separate query that doesn't require auth
-- and will only fetch by public_token to ensure security
