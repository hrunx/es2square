/*
  # Add ai_raw column to audits table

  1. Changes
    - Add `ai_raw` column to store original AI response data
    - Column type is `jsonb` to store structured JSON data
    - Default value is empty JSON object
*/

ALTER TABLE audits
  ADD COLUMN IF NOT EXISTS ai_raw jsonb DEFAULT '{}'::jsonb;