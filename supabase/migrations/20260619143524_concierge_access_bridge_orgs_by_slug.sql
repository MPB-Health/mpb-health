-- Fix: concierge portal 403 for non-super-admin staff (e.g. adam@mympb.com).
-- Root cause: concierge data FKs to public.organizations (MPB id a0000000-...-01),
-- but org_memberships FKs to public.orgs (MPB id 00000000-...4000-...0001). Same slug
-- 'mpb-health', different ids/tables, so the org-membership branch never matched and
-- only the super_admin bypass worked. Bridge the two org tables by slug. Additive +
-- reversible: only widens access for concierge/admin/super_admin users who are active
-- members of the same-slug legacy org. Preserves tenant isolation (slug-scoped).
CREATE OR REPLACE FUNCTION public.user_has_concierge_access_for_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT public.current_user_has_concierge_portal_access()
    AND (
      EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid() AND om.org_id = p_org_id AND om.status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM public.organizations og
        JOIN public.orgs o ON o.slug = og.slug
        JOIN public.org_memberships om
          ON om.org_id = o.id AND om.user_id = auth.uid() AND om.status = 'active'
        WHERE og.id = p_org_id
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text = 'super_admin'
      )
    );
$func$;

GRANT EXECUTE ON FUNCTION public.user_has_concierge_access_for_org(uuid) TO authenticated;;
