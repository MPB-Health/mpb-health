-- ============================================================================
-- Phase 2: Covering index for permission resolution by org + role
-- Speeds up loadUserPermissions / role_permissions lookups used on every CRM
-- workspace load. RLS policies unchanged — index is btree on filter columns only.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_org_role
  ON public.role_permissions (org_id, role);
