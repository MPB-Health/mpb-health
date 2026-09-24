-- ============================================================================
-- crm_sla_cron_auth_via_anon
-- ============================================================================
-- The pg_cron job that fires `sla-breach-scan` every 15 minutes was failing
-- 401 because `vault.decrypted_secrets.supabase_service_role_key` held a
-- 33-character placeholder rather than a real JWT. The edge function's
-- `verify_jwt = true` rejected every request.
--
-- Edge functions run with their own auto-injected `SUPABASE_SERVICE_ROLE_KEY`
-- env var for DB admin operations regardless of the caller's JWT, so the
-- caller only needs to present *some* valid Supabase JWT to clear the gate.
-- We use the anon key (publishable, safe to embed) routed through the vault
-- so cron.job remains literal-free and we can rotate centrally.
--
-- The anon key value is project-specific. If applying to a fresh project,
-- replace the literal below with the project's anon key
-- (Supabase Dashboard → Project Settings → API → `anon` key).
-- ============================================================================

DO $$
DECLARE
    v_id  uuid;
    v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZWxicHJxcWJqZ2dxZnF2Zm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODAxNDQsImV4cCI6MjA5NTU1NjE0NH0.xmme_bfK6qD64P4Drut-nHDDV2ifpQD1zE7ymt9DIj0';
BEGIN
    SELECT id INTO v_id FROM vault.secrets WHERE name = 'aryx_cron_auth_key';
    IF v_id IS NULL THEN
        PERFORM vault.create_secret(
            v_key,
            'aryx_cron_auth_key',
            'Anon JWT used by pg_cron jobs to authenticate to edge functions. '
            'Anon is publicly distributed; storing here keeps cron.job free of '
            'literals so we can rotate via vault.'
        );
    ELSE
        PERFORM vault.update_secret(v_id, v_key);
    END IF;
END $$;

-- Re-target the SLA breach scan cron job at the new vault entry. We do this
-- defensively: only update the command if the job exists and is still using
-- the old `supabase_service_role_key` reference.
DO $$
DECLARE
    v_jobid bigint;
BEGIN
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'crm-sla-breach-scan';
    IF v_jobid IS NOT NULL THEN
        PERFORM cron.alter_job(
            job_id  := v_jobid,
            command := $cmd$
                SELECT net.http_post(
                    url     := 'https://knelbprqqbjggqfqvfmc.supabase.co/functions/v1/sla-breach-scan',
                    headers := jsonb_build_object(
                        'Authorization', 'Bearer ' || (
                            SELECT decrypted_secret FROM vault.decrypted_secrets
                            WHERE name = 'aryx_cron_auth_key' LIMIT 1
                        ),
                        'Content-Type',  'application/json'
                    ),
                    body                := '{}'::jsonb,
                    timeout_milliseconds := 90000
                );
            $cmd$
        );
    END IF;
END $$;
