/*
  # Update OCR data tables and policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies for anonymous access
    - Update storage bucket settings
    - Add policies for OCR data tables
  
  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "anon_insert_storage" ON storage.objects;
DROP POLICY IF EXISTS "anon_select_storage" ON storage.objects;

-- Create more permissive policies for storage
CREATE POLICY "anon_insert_storage" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'audit-files');

CREATE POLICY "anon_select_storage" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audit-files');

-- Ensure audit-files bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-files', 'audit-files', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Create OCR data table
CREATE TABLE IF NOT EXISTS ocr_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES audit_files(id) ON DELETE CASCADE,
  raw_text text,
  processed_text jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on OCR data table
ALTER TABLE ocr_data ENABLE ROW LEVEL SECURITY;

-- Add policies for OCR data table
CREATE POLICY "anon_insert_ocr_data" ON ocr_data
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "anon_select_ocr_data" ON ocr_data
FOR SELECT TO public
USING (true);

CREATE POLICY "anon_update_ocr_data" ON ocr_data
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ocr_data_file_id ON ocr_data(file_id);
CREATE INDEX IF NOT EXISTS idx_ocr_data_created_at ON ocr_data(created_at);

-- Update audit_files table to reference OCR data
ALTER TABLE audit_files
ADD COLUMN IF NOT EXISTS ocr_data_id uuid REFERENCES ocr_data(id),
ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending';

-- Create function to process OCR text
CREATE OR REPLACE FUNCTION process_ocr_text()
RETURNS trigger AS $$
BEGIN
  IF NEW.ocr_text IS NOT NULL AND (OLD.ocr_text IS NULL OR NEW.ocr_text != OLD.ocr_text) THEN
    INSERT INTO ocr_data (file_id, raw_text)
    VALUES (NEW.id, NEW.ocr_text)
    RETURNING id INTO NEW.ocr_data_id;
    
    NEW.processing_status := 'processed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically process OCR text
DROP TRIGGER IF EXISTS process_ocr_text_trigger ON audit_files;
CREATE TRIGGER process_ocr_text_trigger
BEFORE UPDATE ON audit_files
FOR EACH ROW
WHEN (NEW.ocr_text IS NOT NULL AND (OLD.ocr_text IS NULL OR NEW.ocr_text != OLD.ocr_text))
EXECUTE FUNCTION process_ocr_text();