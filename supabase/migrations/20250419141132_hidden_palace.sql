-- Drop existing policies to avoid conflicts
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Authenticated users can update their files" on storage.objects;
drop policy if exists "Authenticated users can read files" on storage.objects;
drop policy if exists "Authenticated users can delete their files" on storage.objects;

-- Create more permissive policies for the audit-files bucket
create policy "Enable read access for authenticated users"
on storage.objects for select
to authenticated
using (bucket_id = 'audit-files');

create policy "Enable insert access for authenticated users"
on storage.objects for insert
to authenticated
with check (bucket_id = 'audit-files');

create policy "Enable update access for authenticated users"
on storage.objects for update
to authenticated
using (bucket_id = 'audit-files');

create policy "Enable delete access for authenticated users"
on storage.objects for delete
to authenticated
using (bucket_id = 'audit-files');

-- Ensure the bucket exists and is properly configured
insert into storage.buckets (id, name, public)
values ('audit-files', 'audit-files', false)
on conflict (id) do update
set public = false;