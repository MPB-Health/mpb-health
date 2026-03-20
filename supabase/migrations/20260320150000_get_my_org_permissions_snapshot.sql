-- ============================================================================
-- Batched org permission snapshot for CRM (single round-trip vs chained PostgREST)
-- SECURITY INVOKER: runs with caller privileges; RLS applies to underlying tables.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_org_permissions_snapshot(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_perms text[];
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'not_authenticated',
      'membership', 'null'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  SELECT om.role INTO v_role
  FROM public.org_memberships om
  WHERE om.user_id = v_uid
    AND om.org_id = p_org_id
    AND om.status = 'active'
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'no_membership',
      'membership', 'null'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(array_agg(DISTINCT p.key ORDER BY p.key), ARRAY[]::text[])
  INTO v_perms
  FROM public.role_permissions rp
  INNER JOIN public.permissions p ON p.id = rp.permission_id
  WHERE rp.org_id = p_org_id
    AND rp.role = v_role;

  RETURN jsonb_build_object(
    'error', NULL,
    'membership', jsonb_build_object('role', v_role),
    'permissions', to_jsonb(COALESCE(v_perms, ARRAY[]::text[]))
  );
END;
$$;

COMMENT ON FUNCTION public.get_my_org_permissions_snapshot(uuid) IS
  'Returns membership role + effective permission keys for auth.uid() in one call (CRM OrgContext).';

GRANT EXECUTE ON FUNCTION public.get_my_org_permissions_snapshot(uuid) TO authenticated;
