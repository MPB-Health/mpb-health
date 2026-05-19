-- ============================================================================
-- CMS Form Builder
-- ============================================================================
--
-- Dynamic form builder for the admin portal. Admins create forms with
-- configurable fields (text, email, select, file, etc.) and collect
-- submissions from the public or authenticated users.

CREATE TABLE IF NOT EXISTS public.cms_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  fields jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  notification_emails text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.cms_forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_form_submissions_form_id_idx
  ON public.cms_form_submissions (form_id);
CREATE INDEX IF NOT EXISTS cms_form_submissions_created_at_idx
  ON public.cms_form_submissions (created_at DESC);

-- updated_at trigger for cms_forms
CREATE OR REPLACE FUNCTION public.cms_forms_set_updated_at()
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

DROP TRIGGER IF EXISTS cms_forms_set_updated_at ON public.cms_forms;
CREATE TRIGGER cms_forms_set_updated_at
  BEFORE UPDATE ON public.cms_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_forms_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.cms_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_form_submissions ENABLE ROW LEVEL SECURITY;

-- cms_forms: admin/superadmin/staff full CRUD

DROP POLICY IF EXISTS "cms_forms_admin_select" ON public.cms_forms;
CREATE POLICY "cms_forms_admin_select"
  ON public.cms_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_forms_admin_insert" ON public.cms_forms;
CREATE POLICY "cms_forms_admin_insert"
  ON public.cms_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_forms_admin_update" ON public.cms_forms;
CREATE POLICY "cms_forms_admin_update"
  ON public.cms_forms
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

DROP POLICY IF EXISTS "cms_forms_admin_delete" ON public.cms_forms;
CREATE POLICY "cms_forms_admin_delete"
  ON public.cms_forms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

-- cms_form_submissions: admin/superadmin/staff full CRUD

DROP POLICY IF EXISTS "cms_form_submissions_admin_select" ON public.cms_form_submissions;
CREATE POLICY "cms_form_submissions_admin_select"
  ON public.cms_form_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_form_submissions_admin_insert" ON public.cms_form_submissions;
CREATE POLICY "cms_form_submissions_admin_insert"
  ON public.cms_form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_form_submissions_admin_update" ON public.cms_form_submissions;
CREATE POLICY "cms_form_submissions_admin_update"
  ON public.cms_form_submissions
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

DROP POLICY IF EXISTS "cms_form_submissions_admin_delete" ON public.cms_form_submissions;
CREATE POLICY "cms_form_submissions_admin_delete"
  ON public.cms_form_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

-- Anon / authenticated can INSERT submissions (public form submissions)
DROP POLICY IF EXISTS "cms_form_submissions_anon_insert" ON public.cms_form_submissions;
CREATE POLICY "cms_form_submissions_anon_insert"
  ON public.cms_form_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── Grants ───────────────────────────────────────────────────────────────────

GRANT ALL ON public.cms_forms TO authenticated;
GRANT ALL ON public.cms_forms TO service_role;
GRANT ALL ON public.cms_form_submissions TO authenticated;
GRANT ALL ON public.cms_form_submissions TO service_role;
GRANT INSERT ON public.cms_form_submissions TO anon;

COMMENT ON TABLE public.cms_forms IS
  'Dynamic forms created via the CMS form builder. Fields and settings stored as JSONB.';
COMMENT ON TABLE public.cms_form_submissions IS
  'Submissions collected from public-facing CMS forms.';
