-- Fix admin_users RLS policies
-- The baseline dump recorded admin_users_update and admin_users_delete as
-- FOR SELECT instead of FOR UPDATE / FOR DELETE, and the INSERT policy was
-- missing entirely.  This blocks all write operations from authenticated
-- users and causes the "Failed to update user" error in the admin portal.

-- Drop the broken policies (they are FOR SELECT under the wrong names)
DROP POLICY IF EXISTS "admin_users_update" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert" ON admin_users;

-- Recreate with the correct operation types

-- Super_admins can insert new admin users
CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );

-- Users can update their own record; super_admins can update anyone
CREATE POLICY "admin_users_update" ON admin_users
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );

-- Only super_admins can delete
CREATE POLICY "admin_users_delete" ON admin_users
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );
