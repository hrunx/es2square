/*
  # Add anonymous access policies for ai_raw column

  1. Changes
    - Add policies for anonymous users to:
      - Read ai_raw data
      - Insert ai_raw data
      - Update ai_raw data
    - Ensure proper access control
  
  2. Security
    - Enable RLS
    - Add policies for anonymous access
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "anon_select_audits" ON audits;
DROP POLICY IF EXISTS "anon_insert_audits" ON audits;
DROP POLICY IF EXISTS "anon_update_audits" ON audits;

-- Enable RLS on audits table (idempotent)
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read audits (including ai_raw)
CREATE POLICY "anon_select_audits"
  ON audits
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert audits with ai_raw
CREATE POLICY "anon_insert_audits"
  ON audits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update audits including ai_raw
CREATE POLICY "anon_update_audits"
  ON audits
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create index for better query performance when filtering by ai_raw
CREATE INDEX IF NOT EXISTS idx_audits_ai_raw
  ON audits USING gin(ai_raw);