-- ============================================================================
-- Migration: Create advisor_access table for My Advisor Page button visibility
-- ============================================================================
-- Stores which advisors can see the "My Advisor Page" button on the Dashboard.
-- Admins always see it; this table controls additional advisor-level access.

CREATE TABLE IF NOT EXISTS public.advisor_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  has_advisor_page_access boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_advisor_access_email ON public.advisor_access (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_advisor_access_has_access ON public.advisor_access (has_advisor_page_access) WHERE has_advisor_page_access = true;

ALTER TABLE public.advisor_access ENABLE ROW LEVEL SECURITY;

-- Advisors can read their own access (by email match)
CREATE POLICY "advisor_access_select_own"
  ON public.advisor_access FOR SELECT
  TO authenticated
  USING (
    LOWER(email) = LOWER((SELECT email FROM advisor_profiles WHERE id = auth.uid() LIMIT 1))
  );

-- Admins can manage all
CREATE POLICY "advisor_access_admin_all"
  ON public.advisor_access FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_advisor_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_advisor_access_updated_at ON public.advisor_access;
CREATE TRIGGER trigger_update_advisor_access_updated_at
  BEFORE UPDATE ON public.advisor_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advisor_access_updated_at();

-- Seed existing whitelist
INSERT INTO public.advisor_access (email, first_name, has_advisor_page_access)
VALUES
  ('rebalarney@mympb.com', 'Reba', true),
  ('vrt@mympb.com', NULL, true),
  ('aba@mympb.com', NULL, true),
  ('leonardo@mympb.com', NULL, true)
ON CONFLICT (email) DO NOTHING;
