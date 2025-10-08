/*
  # Update buildings table to allow null user_id
  
  1. Changes
    - Modify buildings table to allow null values for user_id column
    - Update foreign key constraint to maintain referential integrity
  
  2. Security
    - Maintain existing RLS policies
    - Keep foreign key relationship with users table
*/

-- Temporarily disable the foreign key constraint
ALTER TABLE buildings
DROP CONSTRAINT IF EXISTS buildings_user_id_fkey;

-- Allow null values for user_id
ALTER TABLE buildings
ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the foreign key constraint allowing null values
ALTER TABLE buildings
ADD CONSTRAINT buildings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;