-- ============================================================================
-- CMS Pages v1 — WordPress-style page builder
-- ============================================================================
--
-- Adds a `cms_pages` table that powers admin-driven static pages on the
-- public website. Each page has a unique `path` (e.g. `/about`, `/pricing`)
-- and a JSONB `sections` array describing the block layout.
--
-- Sections shape (example):
--   [
--     { "id":"abc", "kind":"hero",      "props":{ "title":"...", "subtitle":"..." } },
--     { "id":"def", "kind":"rich_text", "props":{ "html":"<p>...</p>" } }
--   ]
--
-- RLS:
--   - anon + authenticated can SELECT only published rows
--   - admin/superadmin/staff can do everything (matches the existing pattern
--     used by `events`, `bulletins`, etc.)

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  -- Per-page SEO override. Edge middleware (see apps/website/middleware.ts)
  -- already prefers `seo_metadata` rows by path; admin can either fill those
  -- or store the overrides here. Both work — `seo_metadata` wins.
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cms_pages_path_unique UNIQUE (path),
  CONSTRAINT cms_pages_slug_unique UNIQUE (slug),
  CONSTRAINT cms_pages_path_format CHECK (path ~ '^/[a-zA-Z0-9/_-]*$')
);

CREATE INDEX IF NOT EXISTS cms_pages_path_idx
  ON public.cms_pages (path);

CREATE INDEX IF NOT EXISTS cms_pages_published_idx
  ON public.cms_pages (is_published)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS cms_pages_updated_at_idx
  ON public.cms_pages (updated_at DESC);

-- Keep updated_at fresh on any change.
CREATE OR REPLACE FUNCTION public.cms_pages_set_updated_at()
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

DROP TRIGGER IF EXISTS cms_pages_set_updated_at ON public.cms_pages;
CREATE TRIGGER cms_pages_set_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_pages_set_updated_at();

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Public visitors (anon + authenticated members) can read published pages.
DROP POLICY IF EXISTS "cms_pages_select_published" ON public.cms_pages;
CREATE POLICY "cms_pages_select_published"
  ON public.cms_pages
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Admin / superadmin / staff can read EVERYTHING (drafts + published).
DROP POLICY IF EXISTS "cms_pages_admin_select_all" ON public.cms_pages;
CREATE POLICY "cms_pages_admin_select_all"
  ON public.cms_pages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_pages_admin_insert" ON public.cms_pages;
CREATE POLICY "cms_pages_admin_insert"
  ON public.cms_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_pages_admin_update" ON public.cms_pages;
CREATE POLICY "cms_pages_admin_update"
  ON public.cms_pages
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

DROP POLICY IF EXISTS "cms_pages_admin_delete" ON public.cms_pages;
CREATE POLICY "cms_pages_admin_delete"
  ON public.cms_pages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

-- Allow PostgREST to publish change events for Realtime subscriptions.
-- The replica identity needs to be FULL so UPDATE events carry old row data
-- (useful when the admin wants to subscribe to draft-->published transitions).
ALTER TABLE public.cms_pages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cms_pages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_pages;
  END IF;
END $$;

GRANT SELECT ON public.cms_pages TO anon;
GRANT ALL ON public.cms_pages TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;

COMMENT ON TABLE public.cms_pages IS
  'Admin-driven CMS pages for the public website. Each row is a single page identified by its URL path. The sections JSONB array defines the block layout rendered by apps/website/src/components/CmsPage.tsx.';

COMMENT ON COLUMN public.cms_pages.sections IS
  'Ordered list of blocks: [{id, kind, props}]. See apps/website/src/components/cms-blocks/index.ts for the supported `kind` values and the props each accepts.';

-- ----------------------------------------------------------------------------
-- Starter content: a draft About page so the admin has something to play with.
-- Marked is_published=false so the public site shows nothing until an admin
-- explicitly publishes. Idempotent: skipped if the path already exists.
-- ----------------------------------------------------------------------------

INSERT INTO public.cms_pages (path, slug, title, description, sections, is_published)
SELECT
  '/p/about-mpb',
  'about-mpb',
  'About MPB Health',
  'Sample CMS page — edit me in the admin to see live updates on the public site.',
  jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'kind', 'hero',
      'props', jsonb_build_object(
        'title', 'About MPB Health',
        'subtitle', 'Affordable healthcare built around the patient, not the paperwork.',
        'background_image', '',
        'primary_cta', jsonb_build_object('label', 'Get a Quote', 'href', '/quote'),
        'secondary_cta', jsonb_build_object('label', 'Talk to an Advisor', 'href', '/contact')
      )
    ),
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'kind', 'rich_text',
      'props', jsonb_build_object(
        'html', '<h2>Our mission</h2><p>We help families and businesses access transparent, high-quality healthcare through medical cost sharing and member-first programs.</p>'
      )
    ),
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'kind', 'stats',
      'props', jsonb_build_object(
        'items', jsonb_build_array(
          jsonb_build_object('value', '50,000+', 'label', 'Members served'),
          jsonb_build_object('value', '20+',     'label', 'States covered'),
          jsonb_build_object('value', '$1B+',    'label', 'Shared in eligible expenses')
        )
      )
    ),
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'kind', 'cta_band',
      'props', jsonb_build_object(
        'title', 'Ready to learn more?',
        'subtitle', 'Speak with a member advisor today.',
        'cta', jsonb_build_object('label', 'Contact Us', 'href', '/contact')
      )
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_pages WHERE path = '/p/about-mpb'
);
