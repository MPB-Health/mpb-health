-- ============================================================================
-- CMS Theme / Global Styles
-- ============================================================================
--
-- Single-row table storing the global theme configuration for the public
-- website. Admins manage colors, typography, button styles, spacing, and
-- branding assets from the Theme Editor in the admin portal.
--
-- Design: one row per site (enforced by convention — the service always
-- upserts/updates the single row). A CHECK constraint ensures at most one row.

CREATE TABLE IF NOT EXISTS public.cms_theme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT cms_theme_single_row CHECK (id IS NOT NULL)
);

-- Enforce single-row: unique partial index trick
CREATE UNIQUE INDEX IF NOT EXISTS cms_theme_singleton_idx ON public.cms_theme ((true));

-- Seed the default row
INSERT INTO public.cms_theme (settings)
VALUES ('{
  "colors": {
    "primary": "#1e40af",
    "secondary": "#0f766e",
    "accent": "#7c3aed",
    "background": "#ffffff",
    "text_primary": "#1e293b",
    "text_secondary": "#64748b"
  },
  "typography": {
    "heading_font": "Inter",
    "body_font": "Inter",
    "base_size": 16
  },
  "buttons": {
    "border_radius": 8,
    "shadow": true
  },
  "spacing_multiplier": 1,
  "logo_url": "",
  "favicon_url": "",
  "custom_css": ""
}'::jsonb)
ON CONFLICT DO NOTHING;

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.cms_theme_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cms_theme_set_updated_at ON public.cms_theme;
CREATE TRIGGER cms_theme_set_updated_at
  BEFORE UPDATE ON public.cms_theme
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_theme_set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.cms_theme ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin/staff can read
DROP POLICY IF EXISTS "cms_theme_admin_select" ON public.cms_theme;
CREATE POLICY "cms_theme_admin_select"
  ON public.cms_theme
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

-- Admin/superadmin/staff can update
DROP POLICY IF EXISTS "cms_theme_admin_update" ON public.cms_theme;
CREATE POLICY "cms_theme_admin_update"
  ON public.cms_theme
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

-- Public (anon) can read the theme for the website
DROP POLICY IF EXISTS "cms_theme_anon_select" ON public.cms_theme;
CREATE POLICY "cms_theme_anon_select"
  ON public.cms_theme
  FOR SELECT
  TO anon
  USING (true);

-- ── Grants ──────────────────────────────────────────────────────────────────
GRANT ALL ON public.cms_theme TO authenticated;
GRANT ALL ON public.cms_theme TO service_role;
GRANT SELECT ON public.cms_theme TO anon;

COMMENT ON TABLE public.cms_theme IS
  'Single-row global theme/styles configuration for the public website. Managed via the admin Theme Editor.';
