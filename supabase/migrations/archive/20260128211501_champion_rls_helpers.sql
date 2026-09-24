/*
  # Champion Phase 0: RLS Helper Functions

  ## Purpose
  Create reusable helper functions for org-scoped Row Level Security policies.
  These functions simplify RLS policy definitions and improve performance.

  ## Functions
  - get_user_org_ids(): Returns array of org IDs the user belongs to
  - get_user_primary_org_id(): Returns the user's primary/first org
  - user_has_org_access(org_id): Checks if user has access to a specific org
  - user_has_org_role(org_id, roles[]): Checks if user has specific role(s) in an org
  - user_is_org_owner_or_admin(org_id): Shorthand for owner/admin check
  - get_user_org_role(org_id): Returns the user's role in an org
*/

-- ============================================
-- GET USER ORG IDS
-- Returns all active org IDs for the current user
-- ============================================
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(org_id),
    ARRAY[]::uuid[]
  )
  FROM org_memberships
  WHERE user_id = auth.uid()
  AND status = 'active';
$$;
-- ============================================
-- GET USER PRIMARY ORG ID
-- Returns the first/primary org for the current user
-- Used when user context doesn't specify an org
-- ============================================
CREATE OR REPLACE FUNCTION get_user_primary_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM org_memberships
  WHERE user_id = auth.uid()
  AND status = 'active'
  ORDER BY
    CASE WHEN role = 'owner' THEN 0
         WHEN role = 'admin' THEN 1
         WHEN role = 'manager' THEN 2
         ELSE 3
    END,
    joined_at ASC
  LIMIT 1;
$$;
-- ============================================
-- USER HAS ORG ACCESS
-- Checks if user is an active member of the specified org
-- ============================================
CREATE OR REPLACE FUNCTION user_has_org_access(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_memberships
    WHERE org_id = check_org_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;
-- ============================================
-- USER HAS ORG ROLE
-- Checks if user has any of the specified roles in an org
-- ============================================
CREATE OR REPLACE FUNCTION user_has_org_role(check_org_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_memberships
    WHERE org_id = check_org_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role = ANY(allowed_roles)
  );
$$;
-- ============================================
-- USER IS ORG OWNER OR ADMIN
-- Shorthand for checking owner/admin access
-- ============================================
CREATE OR REPLACE FUNCTION user_is_org_owner_or_admin(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_has_org_role(check_org_id, ARRAY['owner', 'admin']);
$$;
-- ============================================
-- USER IS ORG MANAGER OR ABOVE
-- Shorthand for checking manager+ access
-- ============================================
CREATE OR REPLACE FUNCTION user_is_org_manager_or_above(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_has_org_role(check_org_id, ARRAY['owner', 'admin', 'manager']);
$$;
-- ============================================
-- GET USER ORG ROLE
-- Returns the user's role in a specific org (or null)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_org_role(check_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM org_memberships
  WHERE org_id = check_org_id
  AND user_id = auth.uid()
  AND status = 'active'
  LIMIT 1;
$$;
-- ============================================
-- CAN USER MANAGE USER IN ORG
-- Checks if current user can manage another user
-- (owner/admin can manage anyone, manager can manage advisors)
-- ============================================
CREATE OR REPLACE FUNCTION can_user_manage_user_in_org(
  check_org_id uuid,
  target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_role text;
  target_role text;
BEGIN
  -- Get my role
  SELECT role INTO my_role
  FROM org_memberships
  WHERE org_id = check_org_id
  AND user_id = auth.uid()
  AND status = 'active';

  -- No membership = no access
  IF my_role IS NULL THEN
    RETURN false;
  END IF;

  -- Owners can manage anyone
  IF my_role = 'owner' THEN
    RETURN true;
  END IF;

  -- Get target's role
  SELECT role INTO target_role
  FROM org_memberships
  WHERE org_id = check_org_id
  AND user_id = target_user_id
  AND status = 'active';

  -- Admin can manage non-owners
  IF my_role = 'admin' AND target_role != 'owner' THEN
    RETURN true;
  END IF;

  -- Manager can only manage advisors
  IF my_role = 'manager' AND target_role = 'advisor' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_primary_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_org_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_org_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_org_owner_or_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_org_manager_or_above(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_org_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_manage_user_in_org(uuid, uuid) TO authenticated;
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_user_org_ids IS 'Returns array of org IDs the current user is an active member of';
COMMENT ON FUNCTION get_user_primary_org_id IS 'Returns the primary org ID for the current user (prioritizes owner/admin roles)';
COMMENT ON FUNCTION user_has_org_access IS 'Checks if current user has active membership in the specified org';
COMMENT ON FUNCTION user_has_org_role IS 'Checks if current user has any of the specified roles in an org';
COMMENT ON FUNCTION user_is_org_owner_or_admin IS 'Shorthand: checks if user is owner or admin in an org';
COMMENT ON FUNCTION user_is_org_manager_or_above IS 'Shorthand: checks if user is manager, admin, or owner in an org';
COMMENT ON FUNCTION get_user_org_role IS 'Returns the users role in a specific org, or null if not a member';
COMMENT ON FUNCTION can_user_manage_user_in_org IS 'Checks if current user can manage another user based on role hierarchy';
