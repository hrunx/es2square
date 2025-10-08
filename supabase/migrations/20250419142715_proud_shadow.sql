/*
  # Remove storage policies for public bucket
  
  1. Changes
    - Drop all existing storage policies for audit-files bucket
    - No need to recreate policies since bucket is public
*/

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON storage.objects;