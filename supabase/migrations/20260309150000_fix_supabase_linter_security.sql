-- ============================================================================
-- Migration: Fix Supabase Database Linter Security Issues
-- Description:
--   1. Set immutable search_path on all public schema functions (fixes 0011)
--   2. Move pg_trgm extension from public to extensions schema (fixes 0014)
--
-- References:
--   - https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--   - https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Set search_path on all public schema functions
-- ============================================================================
-- Functions without search_path set are vulnerable to search_path manipulation.
-- We set search_path = public, pg_temp for all functions in the public schema.

DO $$
DECLARE
  r RECORD;
  alter_sql TEXT;
BEGIN
  FOR r IN
    SELECT
      p.oid,
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS arg_types
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_roles rl ON p.proowner = rl.oid
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')  -- functions and procedures only
      AND rl.rolname = current_user  -- only alter functions we own
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) cfg
          WHERE cfg LIKE 'search_path=%'
        )
      )
  LOOP
    BEGIN
      alter_sql := format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
        r.schema_name,
        r.func_name,
        r.arg_types
      );
      EXECUTE alter_sql;
    EXCEPTION
      WHEN insufficient_privilege THEN NULL;  -- skip functions we can't alter
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- PART 2: Move pg_trgm extension from public to extensions schema
-- ============================================================================
-- Extensions in public schema can expose internal objects. Move to extensions.

-- Ensure extensions schema exists (Supabase creates it by default)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop from public and recreate in extensions
-- Note: pg_trgm may be used by objects - we need to recreate any dependent objects
-- The typical approach: drop, create in extensions. Trigram indexes use the
-- extension's operators; they should work with extensions in search_path.
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Recreate trigram indexes that were dropped by CASCADE
-- (From crm_global_search - use extensions.gin_trgm_ops since pg_trgm is now in extensions schema)
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name_trgm
  ON public.crm_accounts USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_name_trgm
  ON public.crm_contacts USING gin ((first_name || ' ' || last_name) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email_trgm
  ON public.crm_contacts USING gin (email extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_deals_name_trgm
  ON public.crm_deals USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_products_name_trgm
  ON public.crm_products USING gin (name extensions.gin_trgm_ops);

COMMIT;

-- ============================================================================
-- REMAINING LINTER ITEMS (require manual/dashboard action)
-- ============================================================================
-- rls_policy_always_true: Fixed in 20260309160000_fix_rls_permissive_policies.sql
--
-- password_requirements_min_length: Set in Supabase Dashboard:
--   Authentication > Settings > Password minimum length (recommend 12)
--   https://supabase.com/docs/guides/platform/going-into-prod#security
