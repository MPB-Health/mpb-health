-- ============================================================================
-- pg_cron schedules for crm-scheduled-jobs Edge Function
--   • Nightly: promote stale quoted/engaged leads to Nurture (Day-30)
--   • Annual:  Sept 15 OE Reactivation enrolment
-- Skips silently if pg_cron / pg_net are unavailable (parity with existing
-- crm-sla-breach-scan job in 20260423200000).
-- ============================================================================

BEGIN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron')
       AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

        -- Drop existing schedules (idempotent re-runs)
        BEGIN
            PERFORM cron.unschedule('crm-promote-stale-nurture');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        BEGIN
            PERFORM cron.unschedule('crm-oe-reactivation');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        -- Nightly 02:00 UTC: promote stale quoted/engaged leads to Nurture
        PERFORM cron.schedule(
            'crm-promote-stale-nurture',
            '0 2 * * *',
            $cmd$
              SELECT
                CASE WHEN current_setting('app.supabase_service_role_key', true) IS NULL THEN NULL
                ELSE net.http_post(
                  url := current_setting('app.supabase_functions_url', true) || '/crm-scheduled-jobs',
                  headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true),
                    'Content-Type', 'application/json'
                  ),
                  body := jsonb_build_object('job', 'promote_stale_nurture')
                ) END
            $cmd$
        );

        -- Sept 15 at 08:00 UTC each year: OE Reactivation enrollment
        PERFORM cron.schedule(
            'crm-oe-reactivation',
            '0 8 15 9 *',
            $cmd$
              SELECT
                CASE WHEN current_setting('app.supabase_service_role_key', true) IS NULL THEN NULL
                ELSE net.http_post(
                  url := current_setting('app.supabase_functions_url', true) || '/crm-scheduled-jobs',
                  headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true),
                    'Content-Type', 'application/json'
                  ),
                  body := jsonb_build_object('job', 'oe_reactivation')
                ) END
            $cmd$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling skipped (extension or net helper missing): %', SQLERRM;
END
$$;
COMMIT;
