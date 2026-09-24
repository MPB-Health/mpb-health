-- ARYX CRM (knelbprqqbjggqfqvfmc): create system_settings required by submit_public_lead.
-- submit_public_lead was deployed referencing system_settings.crm.intake_default_org_id
-- but the table was never created on this project, breaking all public lead intake
-- (homepage hero calculator, get-a-quote, etc.).

BEGIN;

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  description text DEFAULT '',
  is_sensitive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings (category);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view non-sensitive settings" ON public.system_settings;
CREATE POLICY "Anon can view non-sensitive settings"
  ON public.system_settings
  FOR SELECT
  TO anon
  USING (is_sensitive = false);

DROP POLICY IF EXISTS "Authenticated can view non-sensitive settings" ON public.system_settings;
CREATE POLICY "Authenticated can view non-sensitive settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (is_sensitive = false);

DROP POLICY IF EXISTS "Admins can view all settings" ON public.system_settings;
CREATE POLICY "Admins can view all settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

INSERT INTO public.system_settings (key, value, category, description, is_sensitive)
VALUES (
  'crm.intake_default_org_id',
  '00000000-0000-4000-a000-000000000001',
  'crm',
  'org_id stamped on every public lead intake (submit_public_lead) when the caller does not supply one.',
  false
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      is_sensitive = EXCLUDED.is_sensitive,
      updated_at = now();

CREATE OR REPLACE FUNCTION public.crm_lead_default_org_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT NULLIF(value, '')::uuid
      INTO NEW.org_id
      FROM public.system_settings
     WHERE key = 'crm.intake_default_org_id'
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_default_org ON public.lead_submissions;
CREATE TRIGGER trg_lead_default_org
  BEFORE INSERT ON public.lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_lead_default_org_on_insert();

-- Backfill leads that landed with org_id IS NULL while intake was broken.
UPDATE public.lead_submissions
   SET org_id = '00000000-0000-4000-a000-000000000001'::uuid,
       updated_at = now()
 WHERE org_id IS NULL;

GRANT SELECT ON TABLE public.system_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.system_settings TO service_role;

COMMIT;
