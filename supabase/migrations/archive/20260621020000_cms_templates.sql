-- ============================================================================
-- CMS Templates & Global Blocks
-- ============================================================================
--
-- Reusable page templates and global block groups for the CMS page builder.
-- Templates store pre-built section layouts that admins can use as starting
-- points for new pages. Global Blocks are reusable section groups that can be
-- shared across multiple pages.

-- ── Templates ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text,
  sections jsonb NOT NULL DEFAULT '[]',
  category text DEFAULT 'custom',
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_templates_category_idx ON public.cms_templates (category);
CREATE INDEX IF NOT EXISTS cms_templates_created_at_idx ON public.cms_templates (created_at DESC);

CREATE OR REPLACE FUNCTION public.cms_templates_set_updated_at()
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

DROP TRIGGER IF EXISTS cms_templates_set_updated_at ON public.cms_templates;
CREATE TRIGGER cms_templates_set_updated_at
  BEFORE UPDATE ON public.cms_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_templates_set_updated_at();

ALTER TABLE public.cms_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_templates_admin_select" ON public.cms_templates;
CREATE POLICY "cms_templates_admin_select"
  ON public.cms_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_templates_admin_insert" ON public.cms_templates;
CREATE POLICY "cms_templates_admin_insert"
  ON public.cms_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_templates_admin_update" ON public.cms_templates;
CREATE POLICY "cms_templates_admin_update"
  ON public.cms_templates
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

DROP POLICY IF EXISTS "cms_templates_admin_delete" ON public.cms_templates;
CREATE POLICY "cms_templates_admin_delete"
  ON public.cms_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

GRANT ALL ON public.cms_templates TO authenticated;
GRANT ALL ON public.cms_templates TO service_role;

COMMENT ON TABLE public.cms_templates IS
  'Reusable page templates for the CMS page builder. Stores pre-built section layouts.';

-- ── Global Blocks ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_global_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  sections jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_global_blocks_created_at_idx ON public.cms_global_blocks (created_at DESC);

CREATE OR REPLACE FUNCTION public.cms_global_blocks_set_updated_at()
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

DROP TRIGGER IF EXISTS cms_global_blocks_set_updated_at ON public.cms_global_blocks;
CREATE TRIGGER cms_global_blocks_set_updated_at
  BEFORE UPDATE ON public.cms_global_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_global_blocks_set_updated_at();

ALTER TABLE public.cms_global_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_global_blocks_admin_select" ON public.cms_global_blocks;
CREATE POLICY "cms_global_blocks_admin_select"
  ON public.cms_global_blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_global_blocks_admin_insert" ON public.cms_global_blocks;
CREATE POLICY "cms_global_blocks_admin_insert"
  ON public.cms_global_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_global_blocks_admin_update" ON public.cms_global_blocks;
CREATE POLICY "cms_global_blocks_admin_update"
  ON public.cms_global_blocks
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

DROP POLICY IF EXISTS "cms_global_blocks_admin_delete" ON public.cms_global_blocks;
CREATE POLICY "cms_global_blocks_admin_delete"
  ON public.cms_global_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

GRANT ALL ON public.cms_global_blocks TO authenticated;
GRANT ALL ON public.cms_global_blocks TO service_role;

COMMENT ON TABLE public.cms_global_blocks IS
  'Reusable global block groups for the CMS. Shared section collections usable across multiple pages.';
