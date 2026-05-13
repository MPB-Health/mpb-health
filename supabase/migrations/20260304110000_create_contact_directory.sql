-- Create advisor contact directory table
CREATE TABLE IF NOT EXISTS advisor_contact_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  extension TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Enable RLS
ALTER TABLE advisor_contact_directory ENABLE ROW LEVEL SECURITY;
-- Advisors and members can read active contacts
DROP POLICY IF EXISTS "authenticated_read_active_contacts" ON advisor_contact_directory;
CREATE POLICY "authenticated_read_active_contacts"
  ON advisor_contact_directory
  FOR SELECT
  TO authenticated
  USING (is_active = true);
-- Admins can read all contacts (including inactive)
DROP POLICY IF EXISTS "admin_read_all_contacts" ON advisor_contact_directory;
CREATE POLICY "admin_read_all_contacts"
  ON advisor_contact_directory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );
-- Admins can insert contacts
DROP POLICY IF EXISTS "admin_insert_contacts" ON advisor_contact_directory;
CREATE POLICY "admin_insert_contacts"
  ON advisor_contact_directory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );
-- Admins can update contacts
DROP POLICY IF EXISTS "admin_update_contacts" ON advisor_contact_directory;
CREATE POLICY "admin_update_contacts"
  ON advisor_contact_directory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );
-- Admins can delete contacts
DROP POLICY IF EXISTS "admin_delete_contacts" ON advisor_contact_directory;
CREATE POLICY "admin_delete_contacts"
  ON advisor_contact_directory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );
-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_contact_directory_display_order ON advisor_contact_directory (display_order);
CREATE INDEX IF NOT EXISTS idx_contact_directory_department ON advisor_contact_directory (department);
CREATE INDEX IF NOT EXISTS idx_contact_directory_is_active ON advisor_contact_directory (is_active);
