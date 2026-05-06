-- ============================================================================
-- Re-wire pg_cron schedules to read the service-role key from Supabase Vault.
--
-- Background: ALTER DATABASE postgres SET app.* requires superuser, which is
-- not available on Supabase hosted Postgres. The earlier schedules (and the
-- existing crm-sla-breach-scan cron from 20260423200000) read the key via
-- current_setting('app.supabase_service_role_key', true) and silently
-- short-circuited to NULL because that setting could never be applied.
--
-- This migration drops the three existing schedules and re-creates them
-- pulling the key from vault.decrypted_secrets. The function URLs are
-- inlined (project-pinned, not secret).
--
-- ONE-TIME PREREQ — store the key in Vault before this cron can fire:
--   SELECT vault.create_secret(
--     '<service-role JWT from Project Settings → API>',
--     'supabase_service_role_key'
--   );
--
-- Idempotent: re-running drops + re-creates the three schedules.
-- ============================================================================

BEGIN;

DO $$
DECLARE
    fn_base_url constant text := 'https://dtmnkzllidaiqyheguhl.supabase.co/functions/v1';
BEGIN
    IF NOT (EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')) THEN
        RAISE NOTICE 'pg_cron not installed; skipping schedule rewrite.';
        RETURN;
    END IF;

    -- Drop existing (possibly broken) schedules
    BEGIN PERFORM cron.unschedule('crm-sla-breach-scan');         EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('crm-promote-stale-nurture');   EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('crm-oe-reactivation');         EXCEPTION WHEN OTHERS THEN NULL; END;

    -- SLA breach scan: every 15 minutes (parity with original 20260423200000)
    PERFORM cron.schedule(
        'crm-sla-breach-scan',
        '*/15 * * * *',
        format($cmd$
          SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
              'Authorization', 'Bearer ' || (
                SELECT decrypted_secret FROM vault.decrypted_secrets
                WHERE name = 'supabase_service_role_key' LIMIT 1
              ),
              'Content-Type', 'application/json'
            ),
            body := '{}'::jsonb
          )
        $cmd$, fn_base_url || '/sla-breach-scan')
    );

    -- Nightly 02:00 UTC: promote stale quoted/engaged leads to Nurture
    PERFORM cron.schedule(
        'crm-promote-stale-nurture',
        '0 2 * * *',
        format($cmd$
          SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
              'Authorization', 'Bearer ' || (
                SELECT decrypted_secret FROM vault.decrypted_secrets
                WHERE name = 'supabase_service_role_key' LIMIT 1
              ),
              'Content-Type', 'application/json'
            ),
            body := jsonb_build_object('job', 'promote_stale_nurture')
          )
        $cmd$, fn_base_url || '/crm-scheduled-jobs')
    );

    -- Sept 15 at 08:00 UTC each year: OE Reactivation enrollment
    PERFORM cron.schedule(
        'crm-oe-reactivation',
        '0 8 15 9 *',
        format($cmd$
          SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
              'Authorization', 'Bearer ' || (
                SELECT decrypted_secret FROM vault.decrypted_secrets
                WHERE name = 'supabase_service_role_key' LIMIT 1
              ),
              'Content-Type', 'application/json'
            ),
            body := jsonb_build_object('job', 'oe_reactivation')
          )
        $cmd$, fn_base_url || '/crm-scheduled-jobs')
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule rewrite skipped: %', SQLERRM;
END
$$;

COMMIT;
