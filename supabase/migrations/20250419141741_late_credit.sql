/*
  # Update RLS policies for audit files

  1. Changes
    - Drop existing policy if it exists
    - Recreate policy for authenticated users
    - Update storage bucket policies
  
  2. Security
    - Ensure RLS is enabled
    - Update policies to properly link files to buildings and users
*/

-- Drop existing policy first
DROP POLICY IF EXISTS "Users can manage their building files" ON audit_files;

-- Enable RLS (idempotent)
ALTER TABLE audit_files ENABLE ROW LEVEL SECURITY;

-- Recreate the policy
CREATE POLICY "Users can manage their building files"
ON audit_files
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM buildings
    WHERE buildings.id = audit_files.building_id
    AND buildings.user_id = auth.uid()
  )
);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON storage.objects;

-- Create storage policies for audit-files bucket
CREATE POLICY "Enable read access for authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audit-files');

CREATE POLICY "Enable insert access for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audit-files');

CREATE POLICY "Enable update access for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audit-files');

CREATE POLICY "Enable delete access for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audit-files');