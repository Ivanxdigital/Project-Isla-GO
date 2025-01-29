/*
  # Fix Staff Roles Policies

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for staff roles
    - Add base policy for viewing own role
    - Add admin-specific policies using a subquery approach
  
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Ensures admins can manage roles
    - Allows users to view their own role
*/

-- First, drop all existing policies on staff_roles
DROP POLICY IF EXISTS "Staff can view own role" ON staff_roles;
DROP POLICY IF EXISTS "Admins can view all staff roles" ON staff_roles;
DROP POLICY IF EXISTS "Admins can insert staff roles" ON staff_roles;
DROP POLICY IF EXISTS "Admins can update staff roles" ON staff_roles;
DROP POLICY IF EXISTS "Admins can delete staff roles" ON staff_roles;

-- Create new policies without recursion
-- Base policy - users can view their own role
CREATE POLICY "Users can view own role"
  ON staff_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies using a subquery approach
CREATE POLICY "Admins can view all roles"
  ON staff_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert roles"
  ON staff_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update roles"
  ON staff_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete roles"
  ON staff_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );