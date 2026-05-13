-- Create the admin_users table for the admin portal
-- This table is used by UserService and AnalyticsService in @mpbhealth/admin-core

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'manager', 'staff')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();
-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- Admins and super_admins can read all admin users
CREATE POLICY "admin_users_select" ON admin_users
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );
-- Only super_admins can insert admin users
CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );
-- Admins can update their own record; super_admins can update anyone
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
-- Allow service_role full access (for edge functions)
CREATE POLICY "admin_users_service_role" ON admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
-- Seed existing admin/super_admin users from user_roles into admin_users
-- This pulls email from auth.users and name from advisor_profiles (if available)
INSERT INTO admin_users (id, email, first_name, last_name, role, status, permissions)
SELECT
  ur.user_id AS id,
  COALESCE(au.email, '') AS email,
  COALESCE(ap.first_name, '') AS first_name,
  COALESCE(ap.last_name, '') AS last_name,
  CASE
    WHEN ur.role = 'super_admin' THEN 'super_admin'
    WHEN ur.role = 'admin' THEN 'admin'
    ELSE 'staff'
  END AS role,
  'active' AS status,
  '{}' AS permissions
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN advisor_profiles ap ON ap.id = ur.user_id
WHERE ur.role IN ('super_admin', 'admin')
ON CONFLICT (id) DO NOTHING;
