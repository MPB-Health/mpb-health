-- Pin website quote Email #1 resolution to live MPB Health cadence/template IDs.
--
-- crm-website-lead-intake previously matched cadence/template by brittle names
-- ("Quote Response — 5-touch (Email)" / "Email #1"). Live CRM renamed the
-- active cadence to "Sales Cadence 2026" and archived "Email #1" in favor of
-- "Quote Response #1", so Email #1 stopped sending (~2026-08-04) while leads
-- still inserted correctly.
--
-- These settings are the durable SoT for the edge function; name matching
-- remains a fallback. Non-sensitive (IDs only, no PII).

BEGIN;

INSERT INTO public.system_settings (key, value, category, description, is_sensitive)
VALUES (
  'crm.website_quote_cadence_id',
  '1526bdd4-10e4-4a88-b830-604197e6df53',
  'crm',
  'Cadence id used by crm-website-lead-intake for website quote Email #1 enrollment (Sales Cadence 2026 on MPB Health).',
  false
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      is_sensitive = EXCLUDED.is_sensitive,
      updated_at = now();

INSERT INTO public.system_settings (key, value, category, description, is_sensitive)
VALUES (
  'crm.website_quote_email1_template_id',
  'dd699908-5394-4ba7-a14d-1f0b9aed80e7',
  'crm',
  'Master template id used by crm-website-lead-intake for website quote Email #1 (Quote Response #1 on MPB Health).',
  false
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      is_sensitive = EXCLUDED.is_sensitive,
      updated_at = now();

COMMIT;
