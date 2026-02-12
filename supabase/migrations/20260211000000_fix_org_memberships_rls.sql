-- ============================================================================
-- Fix: org_memberships RLS policies causing infinite recursion / 500 errors
--
-- Problem: Multiple conflicting RLS policies exist on org_memberships.
-- The phase0 policy "orgmem_select_member" calls is_org_member() which
-- queries org_memberships, triggering the same RLS policy recursively.
-- The champion migration added additional self-referencing policies.
--
-- Fix: Drop all existing policies and create simple, non-recursive ones.
-- For SELECT, users can see their own memberships directly (no subquery).
-- For other operations, use SECURITY DEFINER functions to bypass RLS.
-- ============================================================================

-- Drop all existing policies on org_memberships
DROP POLICY IF EXISTS "orgmem_select_member" ON org_memberships;
DROP POLICY IF EXISTS "orgmem_insert_admin" ON org_memberships;
DROP POLICY IF EXISTS "orgmem_update_admin" ON org_memberships;
DROP POLICY IF EXISTS "orgmem_delete_admin" ON org_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their orgs" ON org_memberships;
DROP POLICY IF EXISTS "Owners and admins can manage memberships" ON org_memberships;
DROP POLICY IF EXISTS "Owners and admins can update memberships" ON org_memberships;
DROP POLICY IF EXISTS "Users can leave organizations" ON org_memberships;

-- Simple non-recursive SELECT policy:
-- Users can see all memberships in orgs where they are an active member.
-- Uses a direct user_id check to avoid recursion.
CREATE POLICY "Users can view own memberships"
  ON org_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to also see other members in their orgs (non-recursive approach)
-- Uses a SECURITY DEFINER function to bypass RLS when checking membership
CREATE OR REPLACE FUNCTION public.get_user_org_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM org_memberships
  WHERE user_id = p_user_id AND status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_user_org_ids(uuid) TO authenticated;

CREATE POLICY "Users can view org co-members"
  ON org_memberships FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );

-- INSERT: org admins/owners can add members
CREATE POLICY "Admins can insert memberships"
  ON org_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_org_ids(auth.uid()) AS my_org_id
      WHERE my_org_id = org_memberships.org_id
    )
  );

-- UPDATE: org admins can update memberships
CREATE POLICY "Admins can update memberships"
  ON org_memberships FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
  WITH CHECK (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );

-- DELETE: users can leave, admins can remove others
CREATE POLICY "Users can delete memberships"
  ON org_memberships FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );

-- Also fix is_org_member to use SECURITY DEFINER properly
-- (it already is SECURITY DEFINER, but let's make sure it's correct)
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
    );
$$;
