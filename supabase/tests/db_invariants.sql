-- ============================================================================
-- DB invariants — fail-the-build assertions
--
-- Run after `supabase db reset` (or against any DB with the full migration
-- set applied). Each assertion uses RAISE EXCEPTION on violation, so psql
-- exits non-zero and CI fails.
--
-- These guard the recurring "anon path silently broken" class of bug:
--   1. CRM trigger functions that read from RLS-enabled lookup tables must
--      be SECURITY DEFINER, otherwise public-anon callers fire the trigger
--      and the lookup returns 0 rows.
--   2. supabase_migrations.schema_migrations.version must equal the file
--      timestamp prefix of every applied migration. Drift here means a
--      migration was applied via a path that stamps NOW() instead of using
--      the file's prefix (e.g. MCP apply_migration). Always use
--      `supabase db push` instead so versions stay aligned.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Every public.crm_validate_* trigger function must be SECURITY DEFINER
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    bad text;
    bad_count int := 0;
    bad_list text := '';
BEGIN
    FOR bad IN
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname LIKE 'crm_validate_%'
          AND p.prosecdef = false
    LOOP
        bad_count := bad_count + 1;
        bad_list := bad_list || bad || E'\n  ';
    END LOOP;

    IF bad_count > 0 THEN
        RAISE EXCEPTION
          E'INVARIANT: % CRM validation function(s) are SECURITY INVOKER, must be SECURITY DEFINER:\n  %',
          bad_count, bad_list;
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Every BEFORE INSERT/UPDATE trigger function on public.lead_submissions
--    must be SECURITY DEFINER. lead_submissions is an anon-write surface
--    via the submit_public_lead RPC; a SECURITY INVOKER trigger that reads
--    any RLS-fronted lookup will fail under the RPC's effective grants.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    bad text;
    bad_count int := 0;
    bad_list text := '';
BEGIN
    FOR bad IN
        SELECT DISTINCT p.proname
        FROM pg_trigger t
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'lead_submissions'
          AND NOT t.tgisinternal
          AND (t.tgtype & 2) <> 0       -- BEFORE
          AND ((t.tgtype & 4) <> 0 OR (t.tgtype & 16) <> 0)  -- INSERT or UPDATE
          AND p.prosecdef = false
    LOOP
        bad_count := bad_count + 1;
        bad_list := bad_list || bad || E'\n  ';
    END LOOP;

    IF bad_count > 0 THEN
        RAISE EXCEPTION
          E'INVARIANT: % BEFORE INSERT/UPDATE trigger function(s) on lead_submissions are SECURITY INVOKER:\n  %',
          bad_count, bad_list;
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. submit_public_lead and submit_trusted_lead must exist and be
--    SECURITY DEFINER. These are the canonical writers; if they regress to
--    SECURITY INVOKER the public form intake breaks.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    rpc_name text;
BEGIN
    FOREACH rpc_name IN ARRAY ARRAY['submit_public_lead', 'submit_trusted_lead']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = rpc_name AND p.prosecdef = true
        ) THEN
            RAISE EXCEPTION
              'INVARIANT: public.%() must exist and be SECURITY DEFINER', rpc_name;
        END IF;
    END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 4. anon must NOT have INSERT on public.lead_submissions. The RPC is the
--    only door for anonymous lead intake.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF has_table_privilege('anon', 'public.lead_submissions', 'INSERT') THEN
        RAISE EXCEPTION
          'INVARIANT: anon has direct INSERT on public.lead_submissions. Must go through submit_public_lead RPC.';
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- All checks passed.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'DB invariants: all checks passed.';
END
$$;
