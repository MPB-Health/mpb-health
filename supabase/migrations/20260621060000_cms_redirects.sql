-- ============================================================================
-- CMS Redirect Manager
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text NOT NULL,
  to_path text NOT NULL,
  status_code integer NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  is_regex boolean NOT NULL DEFAULT false,
  hit_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_redirects_from_path_idx ON public.cms_redirects (from_path);
CREATE INDEX IF NOT EXISTS cms_redirects_active_idx ON public.cms_redirects (is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.cms_redirects_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS cms_redirects_set_updated_at ON public.cms_redirects;
CREATE TRIGGER cms_redirects_set_updated_at
  BEFORE UPDATE ON public.cms_redirects
  FOR EACH ROW EXECUTE FUNCTION public.cms_redirects_set_updated_at();

ALTER TABLE public.cms_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_redirects_admin_select" ON public.cms_redirects
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = ANY(ARRAY['admin','superadmin','staff']::text[])));

CREATE POLICY "cms_redirects_admin_insert" ON public.cms_redirects
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = ANY(ARRAY['admin','superadmin','staff']::text[])));

CREATE POLICY "cms_redirects_admin_update" ON public.cms_redirects
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = ANY(ARRAY['admin','superadmin','staff']::text[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = ANY(ARRAY['admin','superadmin','staff']::text[])));

CREATE POLICY "cms_redirects_admin_delete" ON public.cms_redirects
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = ANY(ARRAY['admin','superadmin','staff']::text[])));

-- Public read for the website to check redirects
CREATE POLICY "cms_redirects_public_read" ON public.cms_redirects
  FOR SELECT TO anon
  USING (is_active = true);

GRANT ALL ON public.cms_redirects TO authenticated;
GRANT SELECT ON public.cms_redirects TO anon;
GRANT ALL ON public.cms_redirects TO service_role;
