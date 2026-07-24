-- Concierge tenant CMS + org admin helpers (concierge.aryxcloud.com path tenants only at app layer)

CREATE TABLE IF NOT EXISTS public.concierge_portal_config (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  nav_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  training_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  log_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_portal_config_updated
  ON public.concierge_portal_config (updated_at DESC);

COMMENT ON TABLE public.concierge_portal_config IS
  'Per-org concierge portal content for ARYX path tenants (concierge.aryxcloud.com/{slug}). MPB uses hardcoded defaults.';

-- Org admin for concierge tenant: global concierge/super_admin + org owner/admin membership
CREATE OR REPLACE FUNCTION public.is_concierge_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_has_concierge_portal_access()
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text = 'super_admin'
      )
      OR EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND om.role IN ('owner', 'admin')
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_concierge_org_admin(uuid) TO authenticated;

ALTER TABLE public.concierge_portal_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concierge_portal_config_select ON public.concierge_portal_config;
CREATE POLICY concierge_portal_config_select ON public.concierge_portal_config
  FOR SELECT TO authenticated
  USING (public.user_has_concierge_access_for_org(org_id));

DROP POLICY IF EXISTS concierge_portal_config_write ON public.concierge_portal_config;
CREATE POLICY concierge_portal_config_write ON public.concierge_portal_config
  FOR ALL TO authenticated
  USING (public.is_concierge_org_admin(org_id))
  WITH CHECK (public.is_concierge_org_admin(org_id));

GRANT SELECT ON public.concierge_portal_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.concierge_portal_config TO authenticated;

-- Empty config rows for ARYX path tenants (SaudeMAX starts clean)
INSERT INTO public.concierge_portal_config (org_id)
SELECT o.id
FROM public.organizations o
WHERE o.slug = 'saudemax'
ON CONFLICT (org_id) DO NOTHING;;
