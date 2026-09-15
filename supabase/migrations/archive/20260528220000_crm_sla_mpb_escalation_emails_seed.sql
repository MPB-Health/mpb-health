-- ============================================================================
-- Seed MPB Health's SLA escalation emails
-- ============================================================================
-- Wires `ops@mympb.com` and `vincent@mympb.com` into the SLA breach email
-- fan-out for the MPB Health tenant. Idempotent: re-running just refreshes
-- the array. Other tenants are left untouched.
-- ============================================================================

UPDATE public.crm_sla_config
SET escalation_email  = true,
    escalation_emails = ARRAY['ops@mympb.com', 'vincent@mympb.com']::text[],
    updated_at        = now()
WHERE org_id = (SELECT id FROM public.orgs WHERE slug = 'mpb-health' LIMIT 1)
  AND (
    escalation_emails IS DISTINCT FROM ARRAY['ops@mympb.com', 'vincent@mympb.com']::text[]
    OR escalation_email IS DISTINCT FROM true
  );
