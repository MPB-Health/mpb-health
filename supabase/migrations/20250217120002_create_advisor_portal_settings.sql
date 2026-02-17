-- Advisor Portal Settings — key-value store for portal configuration
CREATE TABLE IF NOT EXISTS public.advisor_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.advisor_portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read portal settings" ON public.advisor_portal_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage portal settings" ON public.advisor_portal_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Seed with default settings
INSERT INTO public.advisor_portal_settings (key, value, label, description, category) VALUES
  ('contact_phone', '(561) 922-9647', 'Contact Phone', 'Main contact phone number displayed on the Contact page', 'contact'),
  ('contact_email', 'support@mpb.health', 'Contact Email', 'Main contact email address', 'contact'),
  ('teams_meeting_url', '', 'Teams Meeting URL', 'Microsoft Teams recurring meeting link for advisor meetings', 'meetings'),
  ('affiliate_form_url', 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448', 'Affiliate Form URL', 'Cognito Forms URL for the advisor application form', 'affiliates'),
  ('schedule_call_url', 'https://calendly.com/rebalarney-mympb/time-with-reba', 'Schedule Call URL', 'Calendly URL for scheduling advisor calls', 'affiliates'),
  ('affiliate_phone', '(855) 816-4650', 'Affiliate Phone', 'Phone number shown on the affiliate referral modal', 'affiliates'),
  ('advisor_landing_page_url', 'https://advisorlandingpage.mpb.health/', 'Advisor Landing Page', 'URL to the My Advisor Page', 'general');

CREATE OR REPLACE FUNCTION update_advisor_portal_settings_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER advisor_portal_settings_updated_at
  BEFORE UPDATE ON public.advisor_portal_settings
  FOR EACH ROW EXECUTE FUNCTION update_advisor_portal_settings_updated_at();
