-- ============================================================================
-- crm_sla_config: external email escalation recipients
-- ============================================================================
-- Adds `escalation_emails text[]` so SLA breach alerts can be sent to people
-- who don't (or shouldn't) have an auth.users row — e.g. ops@..., a shared
-- inbox, or a manager whose primary login is on another tenant.
--
-- Existing `escalation_to uuid[]` continues to drive in-app notifications and
-- email-by-user-lookup behavior for org users. The new column is purely
-- additive: the sla-breach-scan edge function fans out to both lists.
-- ============================================================================

ALTER TABLE public.crm_sla_config
    ADD COLUMN IF NOT EXISTS escalation_emails text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.crm_sla_config.escalation_emails IS
    'External (non-auth-user) email addresses to also notify on SLA breach. '
    'Sent in addition to escalation_to user UUIDs and the lead''s assigned rep.';

-- Light validation via trigger: every entry must look like an email address.
-- Keeps a typo from silently swallowing alerts. Postgres CHECK constraints
-- can't contain subqueries, so we use a trigger instead.
CREATE OR REPLACE FUNCTION public.crm_sla_config_validate_escalation_emails()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
AS $$
DECLARE
    v_bad text;
BEGIN
    IF NEW.escalation_emails IS NOT NULL AND array_length(NEW.escalation_emails, 1) IS NOT NULL THEN
        SELECT e INTO v_bad
        FROM unnest(NEW.escalation_emails) AS e
        WHERE e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
        LIMIT 1;

        IF v_bad IS NOT NULL THEN
            RAISE EXCEPTION 'crm_sla_config.escalation_emails contains invalid address: %', v_bad
                USING HINT = 'Each entry must be a plain email address (no display name).';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_sla_config_validate_emails ON public.crm_sla_config;
CREATE TRIGGER trg_crm_sla_config_validate_emails
    BEFORE INSERT OR UPDATE OF escalation_emails ON public.crm_sla_config
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_sla_config_validate_escalation_emails();
