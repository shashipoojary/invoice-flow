-- Create contact_messages table for support/contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert contact messages (for public contact form)
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to read contact messages (for admin)
CREATE POLICY "Authenticated users can read contact messages" ON public.contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update contact messages (for admin)
CREATE POLICY "Authenticated users can update contact messages" ON public.contact_messages
  FOR UPDATE USING (auth.role() = 'authenticated');
