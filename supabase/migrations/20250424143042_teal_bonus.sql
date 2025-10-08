-- Create detailed_reports table
CREATE TABLE IF NOT EXISTS detailed_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on detailed_reports
ALTER TABLE detailed_reports ENABLE ROW LEVEL SECURITY;

-- Add new columns to audits table
ALTER TABLE audits
ADD COLUMN IF NOT EXISTS key_metrics jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS executive_summary jsonb DEFAULT '{}'::jsonb;

-- Add status column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'status') 
  THEN
    ALTER TABLE audits ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Create index for status column
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- Create index for building_id and created_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_audits_building_created 
ON audits(building_id, created_at DESC);

-- Create index for detailed_reports audit_id
CREATE INDEX IF NOT EXISTS idx_detailed_reports_audit_id 
ON detailed_reports(audit_id);

-- Create index for detailed_reports generated_at
CREATE INDEX IF NOT EXISTS idx_detailed_reports_generated_at 
ON detailed_reports(generated_at);

-- Add policy for anonymous users to read detailed reports
CREATE POLICY "anon_select_detailed_reports"
ON detailed_reports
FOR SELECT
TO anon
USING (true);