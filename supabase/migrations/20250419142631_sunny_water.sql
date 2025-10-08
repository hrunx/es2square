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