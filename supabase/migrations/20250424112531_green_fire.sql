/*
  # Add detailed reports table
  
  1. New Tables
    - detailed_reports
      - id (uuid, primary key)
      - audit_id (uuid, references audits)
      - content (jsonb)
      - generated_at (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS detailed_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE detailed_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their detailed reports"
ON detailed_reports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM audits
    JOIN buildings ON buildings.id = audits.building_id
    WHERE audits.id = detailed_reports.audit_id
    AND buildings.user_id = auth.uid()
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_detailed_reports_audit_id ON detailed_reports(audit_id);