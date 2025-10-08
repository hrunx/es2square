/*
  # Create audit files storage bucket and tables

  1. New Tables
    - `audit_files`
      - `id` (uuid, primary key)
      - `file_url` (text)
      - `file_name` (text)
      - `file_type` (text)
      - `building_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `audit_files` table
    - Add policy for authenticated users to manage their files
*/

-- Create audit_files table
CREATE TABLE IF NOT EXISTS audit_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_files ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their building files"
  ON audit_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = audit_files.building_id
      AND buildings.user_id = auth.uid()
    )
  );

-- Create storage bucket for audit files
INSERT INTO storage.buckets (id, name)
VALUES ('audit-files', 'audit-files')
ON CONFLICT (id) DO NOTHING;

-- Set up storage bucket policy
CREATE POLICY "Authenticated users can upload audit files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'audit-files')
  WITH CHECK (bucket_id = 'audit-files');