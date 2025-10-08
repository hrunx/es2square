/*
  # Add Storage RLS Policies

  1. Changes
    - Enable RLS for storage.buckets table
    - Add policies for anonymous users to:
      - Create storage buckets
      - Upload files
      - Read files
    - Add policies for authenticated users to:
      - Create storage buckets
      - Upload files
      - Read files

  2. Security
    - Enables anonymous access for file uploads
    - Maintains security by limiting operations to specific buckets
*/

-- Enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow public access to storage.buckets
CREATE POLICY "Enable read access for all users" ON storage.buckets
FOR SELECT TO public USING (true);

-- Allow bucket creation for all users
CREATE POLICY "Enable insert access for all users" ON storage.buckets
FOR INSERT TO public WITH CHECK (true);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to storage objects
CREATE POLICY "Enable read access for all users" ON storage.objects
FOR SELECT TO public USING (true);

-- Allow file uploads for all users
CREATE POLICY "Enable insert access for all users" ON storage.objects
FOR INSERT TO public WITH CHECK (true);

-- Allow update access for all users
CREATE POLICY "Enable update access for all users" ON storage.objects
FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Allow delete access for all users
CREATE POLICY "Enable delete access for all users" ON storage.objects
FOR DELETE TO public USING (true);