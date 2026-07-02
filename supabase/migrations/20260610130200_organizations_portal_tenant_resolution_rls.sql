-- Allow portal hostname → org resolution without org_memberships.
-- TenantService reads organizations after matching org_portal_access; concierge
-- staff often have user_roles but no org_memberships row, and anon users hit
-- the login page before auth — both were blocked by membership-only SELECT RLS.

DROP POLICY IF EXISTS organizations_portal_tenant_resolution ON public.organizations;

CREATE POLICY organizations_portal_tenant_resolution
  ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_portal_access opa
      WHERE opa.org_id = organizations.id
        AND opa.enabled = true
    )
  );
