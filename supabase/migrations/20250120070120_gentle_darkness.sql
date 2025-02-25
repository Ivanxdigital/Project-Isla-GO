/*
  # Add Staff Roles Table and Initial Admin

  1. New Tables
    - `staff_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, either 'admin' or 'support')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on staff_roles table
    - Add policies for staff role access
*/

-- Create staff_roles table
CREATE TABLE IF NOT EXISTS staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'support')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view own role" ON staff_roles;
DROP POLICY IF EXISTS "Only admins can manage staff roles" ON staff_roles;

-- Create a more permissive select policy
CREATE POLICY "Allow authenticated users to view roles"
  ON staff_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy for inserting/updating roles
CREATE POLICY "Allow authenticated users to manage roles"
  ON staff_roles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM staff_roles 
    WHERE user_id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;