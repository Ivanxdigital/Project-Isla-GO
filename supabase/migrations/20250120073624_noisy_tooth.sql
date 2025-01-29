-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Only admins can manage staff roles" ON staff_roles;

-- Create separate policies for each operation
CREATE POLICY "Admins can view all staff roles"
  ON staff_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid() 
      AND sr.role = 'admin'
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins can insert staff roles"
  ON staff_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid() 
      AND sr.role = 'admin'
    )
  );

CREATE POLICY "Admins can update staff roles"
  ON staff_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid() 
      AND sr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid() 
      AND sr.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete staff roles"
  ON staff_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid() 
      AND sr.role = 'admin'
    )
  );