-- Advisor Enrollment Links table for CMS-managed enrollment pages
CREATE TABLE IF NOT EXISTS public.advisor_enrollment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advisor_enrollment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read enrollment links" ON public.advisor_enrollment_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage enrollment links" ON public.advisor_enrollment_links
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Seed with existing hardcoded options
INSERT INTO public.advisor_enrollment_links (label, url, order_index) VALUES
  ('Essentials', 'https://essentials.enrollmpb.com/?id=768413', 0),
  ('Care+', 'https://careplus.enrollmpb.com/?id=768413', 1),
  ('Secure HSA', 'https://securehsa.enrollmpb.com/?id=768413', 2),
  ('MEC + Essentials', 'https://mec.enrollmpb.com/?id=768413', 3);

CREATE OR REPLACE FUNCTION update_advisor_enrollment_links_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER advisor_enrollment_links_updated_at
  BEFORE UPDATE ON public.advisor_enrollment_links
  FOR EACH ROW EXECUTE FUNCTION update_advisor_enrollment_links_updated_at();
