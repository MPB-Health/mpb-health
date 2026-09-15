-- ============================================================================
-- Migration: Fix Supabase Database Linter Issues
-- Description:
--   1. auth_rls_initplan (0003): Wrap auth.uid(), auth.jwt(), auth.role() in
--      (select ...) so they're evaluated once in InitPlan instead of per row.
--   2. duplicate_index (0009): Drop idx_user_achievements_user (duplicate of
--      idx_user_achievements_user_id on user_achievements.user_id).
--
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================================

BEGIN;
-- ============================================================================
-- 1. DUPLICATE INDEX: user_achievements has idx_user_achievements_user and
--    idx_user_achievements_user_id on the same column - drop the redundant one
-- ============================================================================
DROP INDEX IF EXISTS public.idx_user_achievements_user;
-- ============================================================================
-- 2. AUTH RLS INITPLAN: Wrap auth.uid(), auth.jwt(), auth.role() in (select ...)
--    so PostgreSQL evaluates them once in the InitPlan instead of per row.
--    Uses dynamic SQL to drop and recreate affected policies.
-- ============================================================================
DO $$
DECLARE
  pol RECORD;
  new_qual TEXT;
  new_with_check TEXT;
  qual_changed BOOLEAN := FALSE;
  with_check_changed BOOLEAN := FALSE;
  roles_str TEXT;
  cmd_str TEXT;
BEGIN
  FOR pol IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual::TEXT AS qual,
      with_check::TEXT AS with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND (
          qual::TEXT ~ 'auth\.uid\(\)' OR
          qual::TEXT ~ 'auth\.jwt\(\)' OR
          qual::TEXT ~ 'auth\.role\(\)' OR
          qual::TEXT ~ 'current_setting\s*\('
        ) AND qual::TEXT !~ '\(select\s+auth\.(uid|jwt|role)\(\)\)')
        OR
        (with_check IS NOT NULL AND (
          with_check::TEXT ~ 'auth\.uid\(\)' OR
          with_check::TEXT ~ 'auth\.jwt\(\)' OR
          with_check::TEXT ~ 'auth\.role\(\)' OR
          with_check::TEXT ~ 'current_setting\s*\('
        ) AND with_check::TEXT !~ '\(select\s+auth\.(uid|jwt|role)\(\)\)')
      )
  LOOP
    new_qual := pol.qual;
    new_with_check := pol.with_check;
    qual_changed := FALSE;
    with_check_changed := FALSE;

    -- Helper to wrap auth.uid(), auth.jwt(), auth.role() in (select ...)
    -- Avoid double-wrapping by replacing (select auth.X()) with placeholder first
    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '\(select\s+auth\.uid\(\)\)', '__AUTH_UID__', 'g');
      new_qual := regexp_replace(new_qual, '\(select\s+auth\.jwt\(\)\)', '__AUTH_JWT__', 'g');
      new_qual := regexp_replace(new_qual, '\(select\s+auth\.role\(\)\)', '__AUTH_ROLE__', 'g');
      new_qual := regexp_replace(new_qual, '\mauth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '\mauth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, '\mauth\.role\(\)', '(select auth.role())', 'g');
      new_qual := regexp_replace(new_qual, '__AUTH_UID__', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '__AUTH_JWT__', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, '__AUTH_ROLE__', '(select auth.role())', 'g');
      qual_changed := (new_qual IS DISTINCT FROM pol.qual);
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, '\(select\s+auth\.uid\(\)\)', '__AUTH_UID__', 'g');
      new_with_check := regexp_replace(new_with_check, '\(select\s+auth\.jwt\(\)\)', '__AUTH_JWT__', 'g');
      new_with_check := regexp_replace(new_with_check, '\(select\s+auth\.role\(\)\)', '__AUTH_ROLE__', 'g');
      new_with_check := regexp_replace(new_with_check, '\mauth\.uid\(\)', '(select auth.uid())', 'g');
      new_with_check := regexp_replace(new_with_check, '\mauth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_with_check := regexp_replace(new_with_check, '\mauth\.role\(\)', '(select auth.role())', 'g');
      new_with_check := regexp_replace(new_with_check, '__AUTH_UID__', '(select auth.uid())', 'g');
      new_with_check := regexp_replace(new_with_check, '__AUTH_JWT__', '(select auth.jwt())', 'g');
      new_with_check := regexp_replace(new_with_check, '__AUTH_ROLE__', '(select auth.role())', 'g');
      with_check_changed := (new_with_check IS DISTINCT FROM pol.with_check);
    END IF;

    IF qual_changed OR with_check_changed THEN
      roles_str := COALESCE(
        (SELECT string_agg(quote_ident(rol::text), ', ') FROM unnest(pol.roles) AS rol),
        'PUBLIC'
      );
      cmd_str := CASE pol.cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
        ELSE 'SELECT'
      END;

      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        pol.policyname,
        pol.schemaname,
        pol.tablename
      );

      -- WITH CHECK only applies to INSERT/UPDATE/ALL; SELECT/DELETE use USING only
      IF pol.permissive = 'PERMISSIVE' THEN
        IF new_qual IS NOT NULL AND new_with_check IS NOT NULL AND pol.cmd IN ('a', 'w', '*') THEN
          EXECUTE format(
            'CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s) WITH CHECK (%s)',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            cmd_str,
            roles_str,
            new_qual,
            new_with_check
          );
        ELSIF new_qual IS NOT NULL THEN
          EXECUTE format(
            'CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s)',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            cmd_str,
            roles_str,
            new_qual
          );
        ELSIF new_with_check IS NOT NULL AND pol.cmd IN ('a', 'w', '*') THEN
          EXECUTE format(
            'CREATE POLICY %I ON %I.%I FOR %s TO %s WITH CHECK (%s)',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            cmd_str,
            roles_str,
            new_with_check
          );
        END IF;
      ELSE
        IF new_qual IS NOT NULL AND new_with_check IS NOT NULL AND pol.cmd IN ('a', 'w', '*') THEN
          EXECUTE format(
            'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO %s USING (%s) WITH CHECK (%s)',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            cmd_str,
            roles_str,
            new_qual,
            new_with_check
          );
        ELSIF new_qual IS NOT NULL THEN
          EXECUTE format(
            'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO %s USING (%s)',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            cmd_str,
            roles_str,
            new_qual
          );
        ELSIF new_with_check IS NOT NULL AND pol.cmd IN ('a', 'w', '*') THEN
          EXECUTE format(
            'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO %s WITH CHECK (%s)',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            cmd_str,
            roles_str,
            new_with_check
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;
COMMIT;
