-- Invoice activity events table
CREATE TABLE IF NOT EXISTS public.invoice_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice events" ON public.invoice_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i WHERE i.id = invoice_events.invoice_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice events" ON public.invoice_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i WHERE i.id = invoice_events.invoice_id AND i.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice_id ON public.invoice_events(invoice_id);


