-- ============================================================================
-- CMS Media Library
-- ============================================================================
--
-- Centralized media asset management for the CMS. Stores metadata about every
-- uploaded file (images, documents, videos) so admins can browse, search, tag,
-- and reuse assets across pages, blog posts, and other content.
--
-- Storage: files live in the existing `event-images` bucket (or a new
-- `cms-media` bucket if desired). This table tracks metadata only.

CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  url text NOT NULL,
  alt_text text DEFAULT '',
  caption text DEFAULT '',
  tags text[] DEFAULT '{}',
  folder text DEFAULT '/',
  mime_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  width integer,
  height integer,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_media_folder_idx ON public.cms_media (folder);
CREATE INDEX IF NOT EXISTS cms_media_mime_type_idx ON public.cms_media (mime_type);
CREATE INDEX IF NOT EXISTS cms_media_created_at_idx ON public.cms_media (created_at DESC);
CREATE INDEX IF NOT EXISTS cms_media_tags_idx ON public.cms_media USING gin (tags);

CREATE OR REPLACE FUNCTION public.cms_media_set_updated_at()
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

DROP TRIGGER IF EXISTS cms_media_set_updated_at ON public.cms_media;
CREATE TRIGGER cms_media_set_updated_at
  BEFORE UPDATE ON public.cms_media
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_media_set_updated_at();

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- Admin / superadmin / staff can read all media
DROP POLICY IF EXISTS "cms_media_admin_select" ON public.cms_media;
CREATE POLICY "cms_media_admin_select"
  ON public.cms_media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_media_admin_insert" ON public.cms_media;
CREATE POLICY "cms_media_admin_insert"
  ON public.cms_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_media_admin_update" ON public.cms_media;
CREATE POLICY "cms_media_admin_update"
  ON public.cms_media
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

DROP POLICY IF EXISTS "cms_media_admin_delete" ON public.cms_media;
CREATE POLICY "cms_media_admin_delete"
  ON public.cms_media
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

GRANT ALL ON public.cms_media TO authenticated;
GRANT ALL ON public.cms_media TO service_role;

COMMENT ON TABLE public.cms_media IS
  'Centralized media library for CMS assets. Tracks metadata for uploaded files stored in Supabase Storage.';
