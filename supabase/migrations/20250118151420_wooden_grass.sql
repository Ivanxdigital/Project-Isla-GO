/*
  # Allow anonymous bookings
  
  1. Changes
    - Make user_id column nullable in bookings table
    - Update RLS policies to allow anonymous access
*/

-- Make user_id nullable
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert access for all users" ON bookings;
DROP POLICY IF EXISTS "Enable select access for all users" ON bookings;

-- Create new policies that explicitly handle anonymous access
CREATE POLICY "Allow anonymous bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow viewing own bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (
    user_id IS NULL OR  -- Allow viewing anonymous bookings
    (auth.uid() = user_id)  -- Or own bookings when authenticated
  );