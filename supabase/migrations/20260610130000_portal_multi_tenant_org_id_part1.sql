-- Fix: resolve MPB org by slug (prod uses a0000000-… not 00000000-4000-…)

DO $$
DECLARE
  mpb_org_id uuid;
BEGIN
  SELECT id INTO mpb_org_id FROM public.organizations WHERE slug = 'mpb-health' LIMIT 1;
  IF mpb_org_id IS NULL THEN
    mpb_org_id := '00000000-0000-4000-a000-000000000001';
    INSERT INTO public.organizations (id, name, slug, subscription_tier, subscription_status)
    VALUES (mpb_org_id, 'MPB Health', 'mpb-health', 'enterprise', 'active')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- org_portal_access table + policies (idempotent)
  CREATE TABLE IF NOT EXISTS public.org_portal_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    portal_slug text NOT NULL CHECK (
      portal_slug IN ('admin', 'advisor', 'concierge', 'staff_hub', 'crm', 'member')
    ),
    enabled boolean NOT NULL DEFAULT true,
    custom_domain text,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT org_portal_access_org_portal_unique UNIQUE (org_id, portal_slug)
  );

  CREATE INDEX IF NOT EXISTS idx_org_portal_access_custom_domain
    ON public.org_portal_access (lower(custom_domain))
    WHERE custom_domain IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_org_portal_access_org_id
    ON public.org_portal_access (org_id);

  ALTER TABLE public.org_portal_access ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS org_portal_access_select ON public.org_portal_access;
  CREATE POLICY org_portal_access_select ON public.org_portal_access
    FOR SELECT TO anon, authenticated USING (true);

  DROP POLICY IF EXISTS org_portal_access_admin_write ON public.org_portal_access;
  CREATE POLICY org_portal_access_admin_write ON public.org_portal_access
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text IN ('super_admin', 'admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text IN ('super_admin', 'admin')
      )
    );

  GRANT SELECT ON public.org_portal_access TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.org_portal_access TO authenticated;

  INSERT INTO public.org_portal_access (org_id, portal_slug, enabled, custom_domain)
  VALUES
    (mpb_org_id, 'admin', true, 'admin.mpb.health'),
    (mpb_org_id, 'advisor', true, 'advisor.mpb.health'),
    (mpb_org_id, 'concierge', true, 'concierge.mpb.health'),
    (mpb_org_id, 'staff_hub', true, 'portal.mpb.health'),
    (mpb_org_id, 'crm', true, 'crm.mpb.health')
  ON CONFLICT (org_id, portal_slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    custom_domain = COALESCE(org_portal_access.custom_domain, EXCLUDED.custom_domain);
END $$;

CREATE OR REPLACE FUNCTION public.user_has_concierge_access_for_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_user_has_concierge_portal_access()
    AND (
      EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid() AND om.org_id = p_org_id AND om.status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text = 'super_admin'
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_concierge_access_for_org(uuid) TO authenticated;
