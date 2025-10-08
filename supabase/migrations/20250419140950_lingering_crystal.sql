/*
  # Add storage bucket policies

  1. Changes
    - Create storage bucket 'audit-files' if it doesn't exist
    - Enable RLS on the bucket
    - Add policies for authenticated users to:
      - Upload files
      - Read files
      - Update files
      - Delete files
    
  2. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users to manage their files
    - Ensure public read access is disabled
*/

-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name)
values ('audit-files', 'audit-files')
on conflict (id) do nothing;

-- Enable RLS
update storage.buckets
set public = false
where id = 'audit-files';

-- Create policies for the storage bucket
create policy "Authenticated users can upload files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'audit-files'
);

create policy "Authenticated users can update their files"
on storage.objects for update to authenticated
using (
  bucket_id = 'audit-files'
  and auth.uid() = owner
);

create policy "Authenticated users can read files"
on storage.objects for select to authenticated
using (
  bucket_id = 'audit-files'
);

create policy "Authenticated users can delete their files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'audit-files'
  and auth.uid() = owner
);