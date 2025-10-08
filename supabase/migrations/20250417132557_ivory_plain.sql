/*
  # Create DeepSeek cache table
  
  1. New Tables
    - `ds_cache` for storing cached responses
      - `hash` (text, primary key) - Hash of the input messages
      - `response` (jsonb) - Cached response from DeepSeek
      - `created_at` (timestamptz) - When the cache entry was created
  
  2. Security
    - Enable RLS on `ds_cache` table
    - Add policy for public read access
    - Add policy for Edge Function write access
*/

create table if not exists public.ds_cache (
  hash text primary key,
  response jsonb,
  created_at timestamptz default now()
);

alter table ds_cache enable row level security;

create policy "anyone can read cache" on ds_cache
  for select using (true);

create policy "edge can insert" on ds_cache
  for insert with check (true);