/*
  # Add status column to ds_cache table

  1. Changes
    - Add status column to ds_cache table
    - Add type column to ds_cache table
    - Add indexes for better query performance
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add status and type columns to ds_cache
ALTER TABLE ds_cache
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS type text;

-- Add index for status column
CREATE INDEX IF NOT EXISTS idx_ds_cache_status ON ds_cache(status);

-- Add index for type column
CREATE INDEX IF NOT EXISTS idx_ds_cache_type ON ds_cache(type);

-- Add index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_ds_cache_created_at ON ds_cache(created_at);