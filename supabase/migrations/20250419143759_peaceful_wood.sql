/*
  # Update buildings table RLS policies
  
  1. Changes
    - Drop existing RLS policy
    - Create new policy allowing both authenticated and anonymous users to insert
    - Maintain existing policy for other operations
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own buildings" ON buildings;

-- Create policy for insert operations (both authenticated and anonymous)
CREATE POLICY "Anyone can create buildings"
ON buildings
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy for other operations (authenticated users only)
CREATE POLICY "Users can manage their own buildings"
ON buildings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);