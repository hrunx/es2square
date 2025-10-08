/*
  # Add OCR text storage columns
  
  1. Changes
    - Add ocr_text column to audit_files table
    - Add extracted_data column to audit_files table for structured data
    - Add room_data column to rooms table for OCR-extracted dimensions
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add OCR text column to audit_files
ALTER TABLE audit_files
ADD COLUMN IF NOT EXISTS ocr_text text,
ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT '{}'::jsonb;

-- Add room_data column to rooms for OCR-extracted info
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS room_data jsonb DEFAULT '{}'::jsonb;

-- Create function to extract room dimensions
CREATE OR REPLACE FUNCTION extract_room_dimensions(room_text text)
RETURNS jsonb AS $$
DECLARE
  dimensions jsonb;
  matches text[];
  dim_text text;
BEGIN
  -- Initialize empty JSON object
  dimensions := '{}'::jsonb;
  
  -- Extract dimensions using regex pattern for common formats
  -- Matches patterns like:
  -- "BEDROOM 12'6" × 11'2""
  -- "LIVING ROOM 15' x 20'"
  -- "KITCHEN (10'8" x 12'4")"
  FOR matches IN
    SELECT regexp_matches(
      room_text,
      '([A-Z][A-Z\s]+)[\s\(]*(\d+''(?:\d+")?)\s*(?:[xX×])\s*(\d+''(?:\d+")?)',
      'g'
    )
  LOOP
    -- Convert matched groups to JSON
    dimensions := jsonb_build_object(
      'name', trim(matches[1]),
      'width', matches[2],
      'length', matches[3]
    );
  END LOOP;

  RETURN dimensions;
END;
$$ LANGUAGE plpgsql;