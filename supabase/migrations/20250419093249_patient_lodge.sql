/*
  # Add translations table
  
  1. New Tables
    - translations
      - id (uuid, primary key)
      - key (text)
      - value (text)
      - locale (text)
      - type (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for authenticated users to manage translations
*/

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value text not null,
  locale text not null,
  type text default 'general',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create unique constraint on key + locale
create unique index if not exists translations_key_locale_idx on translations (key, locale);

-- Enable RLS
alter table translations enable row level security;

-- Allow public read access
create policy "Anyone can read translations"
  on translations
  for select
  using (true);

-- Allow authenticated users to manage translations
create policy "Authenticated users can manage translations"
  on translations
  for all
  to authenticated
  using (true)
  with check (true);

-- Create function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_translations_updated_at
  before update on translations
  for each row
  execute function update_updated_at_column();