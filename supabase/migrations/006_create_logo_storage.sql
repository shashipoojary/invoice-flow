-- Create logos storage bucket
-- Run this in your Supabase SQL editor

-- Create the storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the logos bucket
CREATE POLICY "Users can upload their own logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view logos (for invoice display)
CREATE POLICY "Public can view logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');
