-- ============================================================================
-- CMS Popups / Modal Builder
-- ============================================================================
--
-- Stores popup/modal definitions for the public website. Each popup has a block
-- content payload (same JSON structure as the page builder), trigger rules
-- (exit intent, time delay, scroll %, etc.), targeting rules (which pages,
-- visitor type), and frequency controls.  Admins manage via the admin portal;
-- the website fetches active popups via anon SELECT.

CREATE TABLE IF NOT EXISTS public.cms_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]',
  trigger_config jsonb NOT NULL DEFAULT '{"type": "time_delay", "delay_ms": 5000}',
  targeting jsonb NOT NULL DEFAULT '{"pages": "all"}',
  frequency text DEFAULT 'once_per_session'
    CHECK (frequency IN ('once', 'once_per_session', 'always')),
  is_active boolean DEFAULT false,
  impressions integer DEFAULT 0,
  closes integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS cms_popups_is_active_idx ON public.cms_popups (is_active);
CREATE INDEX IF NOT EXISTS cms_popups_created_at_idx ON public.cms_popups (created_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.cms_popups_set_updated_at()
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

DROP TRIGGER IF EXISTS cms_popups_set_updated_at ON public.cms_popups;
CREATE TRIGGER cms_popups_set_updated_at
  BEFORE UPDATE ON public.cms_popups
  FOR EACH ROW
  EXECUTE FUNCTION public.cms_popups_set_updated_at();

-- Row-level security
ALTER TABLE public.cms_popups ENABLE ROW LEVEL SECURITY;

-- Admin / superadmin / staff — full CRUD
DROP POLICY IF EXISTS "cms_popups_admin_select" ON public.cms_popups;
CREATE POLICY "cms_popups_admin_select"
  ON public.cms_popups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_popups_admin_insert" ON public.cms_popups;
CREATE POLICY "cms_popups_admin_insert"
  ON public.cms_popups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

DROP POLICY IF EXISTS "cms_popups_admin_update" ON public.cms_popups;
CREATE POLICY "cms_popups_admin_update"
  ON public.cms_popups
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

DROP POLICY IF EXISTS "cms_popups_admin_delete" ON public.cms_popups;
CREATE POLICY "cms_popups_admin_delete"
  ON public.cms_popups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin','superadmin','staff']::text[])
    )
  );

-- Anon can read active popups (for public website)
DROP POLICY IF EXISTS "cms_popups_anon_select" ON public.cms_popups;
CREATE POLICY "cms_popups_anon_select"
  ON public.cms_popups
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Grants
GRANT ALL ON public.cms_popups TO authenticated;
GRANT ALL ON public.cms_popups TO service_role;

COMMENT ON TABLE public.cms_popups IS
  'CMS popup/modal definitions for the public website with trigger rules, targeting, and analytics counters.';
