-- Phase 1: Org canonical mapping (additive only — no data changes, no FK changes, no drops)
-- Documents portal vs membership org UUIDs until a later reconciliation phase.

CREATE TABLE IF NOT EXISTS public.organization_id_map (
  slug text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('portal', 'membership')),
  org_id uuid NOT NULL,
  source_table text NOT NULL CHECK (source_table IN ('organizations', 'orgs')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug, purpose)
);

COMMENT ON TABLE public.organization_id_map IS
  'Maps tenant slug to org UUID by purpose. portal = organizations/org_portal_access; membership = org_memberships/CRM leads.';

-- Seed known tenants (idempotent)
INSERT INTO public.organization_id_map (slug, purpose, org_id, source_table, notes)
VALUES
  (
    'mpb-health',
    'portal',
    'a0000000-0000-0000-0000-000000000001',
    'organizations',
    'MPB portal registry (org_portal_access, path tenants, concierge CMS FK)'
  ),
  (
    'mpb-health',
    'membership',
    '00000000-0000-4000-a000-000000000001',
    'orgs',
    'MPB CRM memberships and lead_submissions org_id'
  ),
  (
    'saudemax',
    'portal',
    '00000000-0000-4000-a000-000000000002',
    'organizations',
    'SaudeMAX — unified UUID for portal and membership'
  ),
  (
    'saudemax',
    'membership',
    '00000000-0000-4000-a000-000000000002',
    'orgs',
    'SaudeMAX — unified UUID for portal and membership'
  )
ON CONFLICT (slug, purpose) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  source_table = EXCLUDED.source_table,
  notes = EXCLUDED.notes,
  updated_at = now();

CREATE OR REPLACE VIEW public.organizations_unified AS
SELECT
  COALESCE(orgn.slug, o.slug) AS slug,
  COALESCE(orgn.name, o.name) AS name,
  orgn.id AS organizations_id,
  o.id AS orgs_id,
  portal_map.org_id AS portal_org_id,
  membership_map.org_id AS membership_org_id
FROM public.organizations orgn
FULL OUTER JOIN public.orgs o ON o.slug = orgn.slug
LEFT JOIN public.organization_id_map portal_map
  ON portal_map.slug = COALESCE(orgn.slug, o.slug) AND portal_map.purpose = 'portal'
LEFT JOIN public.organization_id_map membership_map
  ON membership_map.slug = COALESCE(orgn.slug, o.slug) AND membership_map.purpose = 'membership';

COMMENT ON VIEW public.organizations_unified IS
  'Read-only join of organizations + orgs with mapped portal/membership UUIDs per slug.';

CREATE OR REPLACE FUNCTION public.resolve_org_id(
  p_slug text,
  p_purpose text DEFAULT 'membership'
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.org_id
  FROM public.organization_id_map m
  WHERE m.slug = lower(trim(p_slug))
    AND m.purpose = lower(trim(p_purpose))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolve_org_id(text, text) IS
  'Returns org UUID for slug + purpose (portal | membership). Additive helper for Phase 1.';

CREATE OR REPLACE FUNCTION public.translate_org_id(
  p_org_id uuid,
  p_target_purpose text DEFAULT 'membership'
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_translated uuid;
BEGIN
  IF p_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT slug INTO v_slug
  FROM (
    SELECT slug FROM public.organizations WHERE id = p_org_id
    UNION ALL
    SELECT slug FROM public.orgs WHERE id = p_org_id
  ) s
  LIMIT 1;

  IF v_slug IS NULL THEN
    RETURN p_org_id;
  END IF;

  SELECT public.resolve_org_id(v_slug, p_target_purpose) INTO v_translated;
  RETURN COALESCE(v_translated, p_org_id);
END;
$$;

COMMENT ON FUNCTION public.translate_org_id(uuid, text) IS
  'Maps any known org UUID to the UUID used for the target purpose (same slug).';

ALTER TABLE public.organization_id_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_id_map_select ON public.organization_id_map;
CREATE POLICY organization_id_map_select ON public.organization_id_map
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS organization_id_map_admin_write ON public.organization_id_map;
CREATE POLICY organization_id_map_admin_write ON public.organization_id_map
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

GRANT SELECT ON public.organization_id_map TO anon, authenticated;
GRANT SELECT ON public.organizations_unified TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_org_id(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.translate_org_id(uuid, text) TO anon, authenticated;;
