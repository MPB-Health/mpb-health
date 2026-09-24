-- ============================================================================
-- CMS Revision History
-- ============================================================================
--
-- Stores point-in-time snapshots of pages and blog posts so editors can
-- view history, compare changes, and restore previous versions.

CREATE TABLE IF NOT EXISTS public.cms_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('page', 'blog_post')),
  entity_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  data_snapshot jsonb NOT NULL,
  change_summary text DEFAULT '',
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);

CREATE INDEX IF NOT EXISTS cms_revisions_entity_idx
  ON public.cms_revisions (entity_type, entity_id, version DESC);
CREATE INDEX IF NOT EXISTS cms_revisions_created_idx
  ON public.cms_revisions (created_at DESC);

ALTER TABLE public.cms_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_revisions_admin_select" ON public.cms_revisions;
CREATE POLICY "cms_revisions_admin_select"
  ON public.cms_revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_revisions_admin_insert" ON public.cms_revisions;
CREATE POLICY "cms_revisions_admin_insert"
  ON public.cms_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_revisions_admin_delete" ON public.cms_revisions;
CREATE POLICY "cms_revisions_admin_delete"
  ON public.cms_revisions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

GRANT ALL ON public.cms_revisions TO authenticated;
GRANT ALL ON public.cms_revisions TO service_role;

COMMENT ON TABLE public.cms_revisions IS
  'Stores version snapshots of CMS pages and blog posts for revision history, diffs, and restore.';
