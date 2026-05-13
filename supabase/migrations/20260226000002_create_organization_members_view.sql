-- ============================================================================
-- Migration: Create organization_members view
-- Description: Champion search migration references organization_members but
--              the actual table is org_memberships. Create view as alias.
-- ============================================================================

CREATE OR REPLACE VIEW public.organization_members AS
SELECT
  user_id,
  org_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
FROM org_memberships
WHERE status = 'active';
GRANT SELECT ON public.organization_members TO authenticated;
