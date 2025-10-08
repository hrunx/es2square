/*
  # Fix Storage Policies for Anonymous Access

  1. Changes
    - Drop and recreate storage policies for audit-files bucket
    - Ensure bucket exists and is public
    - Update RLS policies for anonymous access
  
  2. Security
    - Enable anonymous access to required resources
    - Maintain existing security model
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous users to read files" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_storage" ON storage.objects;
DROP POLICY IF EXISTS "anon_select_storage" ON storage.objects;

-- Create more permissive policies for anonymous access
CREATE POLICY "anon_insert_storage" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'audit-files');

CREATE POLICY "anon_select_storage" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'audit-files');

-- Ensure audit-files bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-files', 'audit-files', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "anon_insert_audit_files" ON audit_files;
DROP POLICY IF EXISTS "anon_select_audit_files" ON audit_files;
DROP POLICY IF EXISTS "anon_insert_ds_cache" ON ds_cache;
DROP POLICY IF EXISTS "anon_select_ds_cache" ON ds_cache;

-- Add policies for audit_files table
CREATE POLICY "anon_insert_audit_files" ON audit_files
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "anon_select_audit_files" ON audit_files
FOR SELECT TO anon
USING (true);

-- Add policies for ds_cache table
CREATE POLICY "anon_insert_ds_cache" ON ds_cache
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "anon_select_ds_cache" ON ds_cache
FOR SELECT TO anon
USING (true);