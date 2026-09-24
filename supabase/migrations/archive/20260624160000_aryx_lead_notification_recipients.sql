-- ARYX CRM (knelbprqqbjggqfqvfmc): configurable staff "new lead" notification recipients.
--
-- Background: the website fired a single, hardcoded staff notification
-- (sales@mympb.com) client-side, fire-and-forget. We are moving the staff
-- notification server-side into crm-website-lead-intake so it is reliable and
-- tenant-isolated. Recipients are stored here as a per-org JSON map so each
-- tenant only ever notifies its own people.
--
-- Format: value is a JSON object (stored as text) keyed by org_id -> array of
-- email strings. An optional "*" key may be used as a default for orgs without
-- an explicit entry. The intake function reads this via the service role (RLS
-- bypassed). Marked is_sensitive = true so the staff email list is NOT exposed
-- to anon / non-admin authenticated callers (the existing "Anon can view
-- non-sensitive settings" policy). Admins still see it via the "Admins can view
-- all settings" policy, and the settings UI's admin surface continues to work.

BEGIN;

INSERT INTO public.system_settings (key, value, category, description, is_sensitive)
VALUES (
  'crm.lead_notification_recipients',
  '{"00000000-0000-4000-a000-000000000001":["sales@mympb.com","julia@mympb.com","catherine@mympb.com"]}',
  'crm',
  'Per-org JSON map (org_id -> [emails]) of staff who receive the immediate "new lead" notification from crm-website-lead-intake. Optional "*" key = default for orgs without an explicit entry.',
  true
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      is_sensitive = EXCLUDED.is_sensitive,
      updated_at = now();

COMMIT;
