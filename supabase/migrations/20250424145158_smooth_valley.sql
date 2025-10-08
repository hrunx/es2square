/*
  # Fix detailed reports RLS policies
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate RLS policies for anonymous access
    - Add performance indexes
  
  2. Security
    - Enable RLS
    - Add policies for anonymous access
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "anon_select_detailed_reports" ON detailed_reports;
DROP POLICY IF EXISTS "anon_insert_detailed_reports" ON detailed_reports;
DROP POLICY IF EXISTS "anon_update_detailed_reports" ON detailed_reports;

-- Enable RLS on detailed_reports table
ALTER TABLE detailed_reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read detailed reports
CREATE POLICY "anon_select_detailed_reports"
  ON detailed_reports
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert detailed reports
CREATE POLICY "anon_insert_detailed_reports"
  ON detailed_reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update detailed reports
CREATE POLICY "anon_update_detailed_reports"
  ON detailed_reports
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_detailed_reports_audit_id
  ON detailed_reports(audit_id);

CREATE INDEX IF NOT EXISTS idx_detailed_reports_generated_at
  ON detailed_reports(generated_at);