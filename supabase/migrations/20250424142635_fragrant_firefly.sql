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