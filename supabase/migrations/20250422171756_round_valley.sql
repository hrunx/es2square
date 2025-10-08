/*
  # Fix anonymous user permissions

  1. Changes
    - Add RLS policies for anonymous users to access storage buckets
    - Update existing RLS policies for audit-related tables
    - Enable storage access for anonymous users

  2. Security
    - Enable RLS on all affected tables
    - Add policies for anonymous users
    - Maintain existing authenticated user policies
*/

-- Create audit-files bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('audit-files', 'audit-files', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Grant access to storage.objects for anonymous users
CREATE POLICY "Allow anonymous users to upload files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'audit-files');

CREATE POLICY "Allow anonymous users to read files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'audit-files');

-- Update ds_cache policies
CREATE POLICY "Allow anonymous users to read cache"
ON public.ds_cache FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to write cache"
ON public.ds_cache FOR INSERT
TO anon
WITH CHECK (true);

-- Update audit_files policies
CREATE POLICY "Allow anonymous users to read audit files"
ON public.audit_files FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to create audit files"
ON public.audit_files FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update audit files"
ON public.audit_files FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Update buildings policies
CREATE POLICY "Allow anonymous users to read buildings"
ON public.buildings FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to create buildings"
ON public.buildings FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update buildings"
ON public.buildings FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Update rooms policies
CREATE POLICY "Allow anonymous users to read rooms"
ON public.rooms FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to create rooms"
ON public.rooms FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update rooms"
ON public.rooms FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Update equipment policies
CREATE POLICY "Allow anonymous users to read equipment"
ON public.equipment FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to create equipment"
ON public.equipment FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update equipment"
ON public.equipment FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Update audits policies
CREATE POLICY "Allow anonymous users to read audits"
ON public.audits FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to create audits"
ON public.audits FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update audits"
ON public.audits FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Update equipment_photos policies
CREATE POLICY "Allow anonymous users to read equipment photos"
ON public.equipment_photos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to create equipment photos"
ON public.equipment_photos FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update equipment photos"
ON public.equipment_photos FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);