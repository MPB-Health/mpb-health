-- ============================================================================
-- CRM 2026 Upgrade — Phase 1: Foundations
--
-- Closes gaps identified in apps/crm/docs/UPGRADE-PLAN-2026.md:
--   1. Adds outside_advisor_id + referral_partner_id FK columns to lead_submissions
--      so Outside-Advisor and Referral-Partner reporting can roll up by entity
--      instead of by heuristic / remainder math.
--   2. Hardens the lead_source / is_self_generated pair with a BEFORE INSERT/UPDATE
--      trigger that validates lead_source against crm_lead_source_types.slug and
--      always derives is_self_generated from the lookup, eliminating drift.
--   3. Introduces a "lead_manager" permission key and seeds it to owner/admin/manager.
--   4. Provides crm_seed_sales_plan_2026_demo(p_org_id) — an operator-callable
--      helper that finds Leonardo/Tupac/Adam in auth.users by email and wires them
--      into org_memberships + round-robin pool for a demo org.
--
-- This migration is additive and idempotent.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. FK columns on lead_submissions
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_submissions
    ADD COLUMN IF NOT EXISTS outside_advisor_id uuid,
    ADD COLUMN IF NOT EXISTS referral_partner_id uuid;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'lead_submissions'
          AND constraint_name = 'lead_submissions_outside_advisor_id_fkey'
    ) THEN
        ALTER TABLE public.lead_submissions
            ADD CONSTRAINT lead_submissions_outside_advisor_id_fkey
            FOREIGN KEY (outside_advisor_id)
            REFERENCES public.crm_outside_advisors(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'lead_submissions'
          AND constraint_name = 'lead_submissions_referral_partner_id_fkey'
    ) THEN
        ALTER TABLE public.lead_submissions
            ADD CONSTRAINT lead_submissions_referral_partner_id_fkey
            FOREIGN KEY (referral_partner_id)
            REFERENCES public.crm_referral_partners(id)
            ON DELETE SET NULL;
    END IF;
END
$$;
CREATE INDEX IF NOT EXISTS idx_lead_submissions_outside_advisor_id
    ON public.lead_submissions(outside_advisor_id)
    WHERE outside_advisor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_submissions_referral_partner_id
    ON public.lead_submissions(referral_partner_id)
    WHERE referral_partner_id IS NOT NULL;
-- ----------------------------------------------------------------------------
-- 2. lead_source validation + is_self_generated auto-population
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_validate_lead_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_self_gen boolean;
    v_source_exists boolean;
BEGIN
    -- Default to the required pipeline source when intake paths haven't set one
    -- yet. Explicit source on a subsequent UPDATE will still be validated below.
    IF NEW.lead_source IS NULL OR NEW.lead_source = '' THEN
        NEW.lead_source := 'inhouse_round_robin';
    END IF;

    SELECT is_self_generated
      INTO v_is_self_gen
    FROM public.crm_lead_source_types
    WHERE slug = NEW.lead_source
      AND is_active = true;

    GET DIAGNOSTICS v_source_exists = ROW_COUNT;

    IF NOT FOUND THEN
        RAISE EXCEPTION
          'Invalid lead_source: %. Valid slugs live in crm_lead_source_types (is_active=true).',
          NEW.lead_source
          USING ERRCODE = '23514';
    END IF;

    -- Always derive is_self_generated from the source lookup so the split that
    -- drives every 2026 report cannot drift from the picklist.
    NEW.is_self_generated := COALESCE(v_is_self_gen, false);

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_submissions_validate_lead_source ON public.lead_submissions;
CREATE TRIGGER trg_lead_submissions_validate_lead_source
    BEFORE INSERT OR UPDATE OF lead_source ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_validate_lead_source();
-- Backfill NULL lead_source rows (existing data) so reports don't throw NULLs.
UPDATE public.lead_submissions
SET lead_source = 'inhouse_round_robin'
WHERE lead_source IS NULL
   OR lead_source = '';
-- ----------------------------------------------------------------------------
-- 3. "lead_manager" permission
-- ----------------------------------------------------------------------------

INSERT INTO public.permissions (key, module, description) VALUES
    ('lead_manager', 'lead_manager',
     'Lead Manager bundle — controls round-robin, SLA overrides, cross-rep reports, and escalation routing'),
    ('reports.export', 'reports',
     'Export CRM reports to XLSX / PDF')
ON CONFLICT (key) DO NOTHING;
-- Grant lead_manager to owner + admin + manager for the seed org; reports.export
-- is broader and also goes to agents (any rep should be able to export their own).
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', r.role, p.id
FROM (VALUES ('owner'), ('admin'), ('manager')) AS r(role)
CROSS JOIN public.permissions p
WHERE p.key = 'lead_manager'
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', r.role, p.id
FROM (VALUES ('owner'), ('admin'), ('manager'), ('agent')) AS r(role)
CROSS JOIN public.permissions p
WHERE p.key = 'reports.export'
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- Propagate to all existing orgs
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT DISTINCT o.id, rp.role, rp.permission_id
FROM public.orgs o
CROSS JOIN public.role_permissions rp
WHERE rp.org_id = '00000000-0000-4000-a000-000000000001'
  AND o.id != '00000000-0000-4000-a000-000000000001'
  AND rp.permission_id IN (
      SELECT id FROM public.permissions WHERE key IN ('lead_manager', 'reports.export')
  )
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- ----------------------------------------------------------------------------
-- 4. crm_is_lead_manager(p_org_id) — callable from RPCs / RLS policies
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_is_lead_manager(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        JOIN public.role_permissions rp
          ON rp.org_id = om.org_id
         AND rp.role = om.role
        JOIN public.permissions p
          ON p.id = rp.permission_id
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND p.key = 'lead_manager'
    );
$$;
REVOKE ALL ON FUNCTION public.crm_is_lead_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_is_lead_manager(uuid) TO authenticated;
COMMENT ON FUNCTION public.crm_is_lead_manager(uuid) IS
  'Returns true when the caller holds the lead_manager permission bundle in the given org.';
-- ----------------------------------------------------------------------------
-- 5. crm_seed_sales_plan_2026_demo(p_org_id) — operator-runbook entry point
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_seed_sales_plan_2026_demo(
    p_org_id uuid,
    p_leonardo_email text DEFAULT 'leonardo@mympb.com',
    p_tupac_email text DEFAULT 'tupac@mympb.com',
    p_adam_email text DEFAULT 'adam@mympb.com'
)
RETURNS TABLE (
    email text,
    user_id uuid,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_leo uuid;
    v_tup uuid;
    v_adm uuid;
    v_pool jsonb;
BEGIN
    SELECT id INTO v_leo FROM auth.users WHERE lower(email) = lower(p_leonardo_email);
    SELECT id INTO v_tup FROM auth.users WHERE lower(email) = lower(p_tupac_email);
    SELECT id INTO v_adm FROM auth.users WHERE lower(email) = lower(p_adam_email);

    -- Org membership: Leonardo is manager (Lead Manager), the others are agents.
    IF v_leo IS NOT NULL THEN
        INSERT INTO public.org_memberships (org_id, user_id, role, status)
        VALUES (p_org_id, v_leo, 'manager', 'active')
        ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role, status = 'active';
    END IF;
    IF v_tup IS NOT NULL THEN
        INSERT INTO public.org_memberships (org_id, user_id, role, status)
        VALUES (p_org_id, v_tup, 'agent', 'active')
        ON CONFLICT (user_id, org_id) DO NOTHING;
    END IF;
    IF v_adm IS NOT NULL THEN
        INSERT INTO public.org_memberships (org_id, user_id, role, status)
        VALUES (p_org_id, v_adm, 'agent', 'active')
        ON CONFLICT (user_id, org_id) DO NOTHING;
    END IF;

    -- Round-robin pool (skip members we couldn't find)
    v_pool := '[]'::jsonb;
    IF v_leo IS NOT NULL THEN
        v_pool := v_pool || jsonb_build_array(jsonb_build_object(
            'user_id', v_leo, 'is_active', true, 'is_paused', false, 'weight', 1
        ));
    END IF;
    IF v_tup IS NOT NULL THEN
        v_pool := v_pool || jsonb_build_array(jsonb_build_object(
            'user_id', v_tup, 'is_active', true, 'is_paused', false, 'weight', 1
        ));
    END IF;
    IF v_adm IS NOT NULL THEN
        v_pool := v_pool || jsonb_build_array(jsonb_build_object(
            'user_id', v_adm, 'is_active', true, 'is_paused', false, 'weight', 1
        ));
    END IF;

    IF jsonb_array_length(v_pool) > 0 THEN
        INSERT INTO public.crm_round_robin_config (
            org_id, is_active, pool_members, current_position,
            tie_breaking_rule, skip_unavailable, updated_by
        )
        VALUES (p_org_id, true, v_pool, -1, 'sequential', true, v_leo)
        ON CONFLICT (org_id) DO UPDATE SET
            is_active = true,
            pool_members = EXCLUDED.pool_members,
            updated_by = EXCLUDED.updated_by;
    END IF;

    -- Return one row per target user with their status
    RETURN QUERY VALUES
        (p_leonardo_email, v_leo, CASE WHEN v_leo IS NULL THEN 'not_found_in_auth_users' ELSE 'seeded_as_manager' END),
        (p_tupac_email,    v_tup, CASE WHEN v_tup IS NULL THEN 'not_found_in_auth_users' ELSE 'seeded_as_agent' END),
        (p_adam_email,     v_adm, CASE WHEN v_adm IS NULL THEN 'not_found_in_auth_users' ELSE 'seeded_as_agent' END);
END;
$$;
REVOKE ALL ON FUNCTION public.crm_seed_sales_plan_2026_demo(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_seed_sales_plan_2026_demo(uuid, text, text, text) TO service_role;
COMMENT ON FUNCTION public.crm_seed_sales_plan_2026_demo(uuid, text, text, text) IS
  'Operator helper: seeds Leonardo/Tupac/Adam into org_memberships + round-robin pool for p_org_id. '
  'Must be run AFTER creating the auth.users entries (Supabase Dashboard → Authentication → Users). '
  'Returns one row per target user with status (seeded_as_* or not_found_in_auth_users).';
COMMIT;
