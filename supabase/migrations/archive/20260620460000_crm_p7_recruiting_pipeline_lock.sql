-- ============================================================================
-- CRM rebuild — Phase 7 / Section 10 (Round 5 Addendum, 2026-05-12)
-- ============================================================================
-- Spec: "Recruiting — Pipeline Stages (Locked)".
--   • Lock the Recruiting pipeline at 7 stages, in order:
--       Prospect → Contacted → Interviewing → Contracted →
--       Onboarding → Active → Inactive.
--   • Stage definitions and transition triggers to be drafted in the same
--     style as Section 1 (consumer pipeline) — to be authored in a
--     future round.
--   • These stages are independent of the consumer 8-stage pipeline; the
--     two pipelines do not share state or transitions.
--
-- Phase 5 already seeded these 7 stages per org; this round formalizes
-- the lock so admins (or future migrations) cannot drift the canonical
-- list before the future round drafts the official transitions:
--
--   1. CHECK constraints pin `name` to the canonical 7 enum values, pin
--      `sort_order` to 1..7, and pin `is_terminal` to the canonical
--      shape (Active + Inactive are terminal; the other five are not).
--   2. A BEFORE UPDATE OR DELETE trigger refuses any rename, reorder,
--      terminality flip, or deletion. Cosmetic columns (`color`,
--      `icon`, `display_name`) remain editable so brand teams can
--      retheme the chips without touching the underlying schema.
--   3. `crm_recruiting_records.pipeline_stage` gets a matching CHECK so
--      no recruit can be parked in a stage that doesn't exist.
--   4. The seed function is rebuilt to be idempotent + locked so newly
--      created orgs always get exactly the canonical 7 rows. Any org
--      that currently has < 7 rows is backfilled in this migration.
--
-- Invoices — Deferred:
--   The Round 5 Addendum also confirms that invoicing is removed from
--   top-level navigation and will eventually live inside the Member
--   profile as a Payment Profile subsection (deferred, not in current
--   scope). No data migration work is required now; that decision is
--   tagged in `docs/crm/section9-removals.md` and the spec-alignment
--   audit so it doesn't fall off the roadmap.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. CHECK constraints — pin the 7 canonical stages
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.crm_recruiting_pipeline_stages'::regclass
           AND conname = 'crm_recruiting_stage_name_check'
    ) THEN
        ALTER TABLE public.crm_recruiting_pipeline_stages
            DROP CONSTRAINT crm_recruiting_stage_name_check;
    END IF;
    ALTER TABLE public.crm_recruiting_pipeline_stages
        ADD CONSTRAINT crm_recruiting_stage_name_check
        CHECK (name IN (
            'prospect',
            'contacted',
            'interviewing',
            'contracted',
            'onboarding',
            'active',
            'inactive'
        ));

    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.crm_recruiting_pipeline_stages'::regclass
           AND conname = 'crm_recruiting_stage_sort_order_check'
    ) THEN
        ALTER TABLE public.crm_recruiting_pipeline_stages
            DROP CONSTRAINT crm_recruiting_stage_sort_order_check;
    END IF;
    ALTER TABLE public.crm_recruiting_pipeline_stages
        ADD CONSTRAINT crm_recruiting_stage_sort_order_check
        CHECK (sort_order BETWEEN 1 AND 7);

    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.crm_recruiting_pipeline_stages'::regclass
           AND conname = 'crm_recruiting_stage_terminal_shape_check'
    ) THEN
        ALTER TABLE public.crm_recruiting_pipeline_stages
            DROP CONSTRAINT crm_recruiting_stage_terminal_shape_check;
    END IF;
    -- Active and Inactive are terminal (no further movement / DNC);
    -- the other five are working stages. This matches the spec ordering
    -- and prevents an admin from flipping terminality on cosmetic edits.
    ALTER TABLE public.crm_recruiting_pipeline_stages
        ADD CONSTRAINT crm_recruiting_stage_terminal_shape_check
        CHECK (is_terminal = (name IN ('active', 'inactive')));
END$$;

-- ---------------------------------------------------------------------------
-- 2. Lock guard — reject any rename / reorder / terminality flip / delete
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_recruiting_pipeline_lock_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = format(
                'Recruiting pipeline stage "%s" is locked per Section 10 / Round 5 Addendum. '
                'Stage definitions and transition triggers are drafted in a future round.',
                OLD.name
            );
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.name <> OLD.name THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'Recruiting pipeline stage names are locked per Section 10 / Round 5 Addendum.';
        END IF;
        IF NEW.sort_order <> OLD.sort_order THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'Recruiting pipeline ordering is locked at 7 stages per Section 10 / Round 5 Addendum.';
        END IF;
        IF NEW.is_terminal <> OLD.is_terminal THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'Recruiting pipeline terminality is locked per Section 10 / Round 5 Addendum.';
        END IF;
        IF NEW.is_active <> OLD.is_active THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'Recruiting pipeline stages cannot be deactivated per Section 10 / Round 5 Addendum.';
        END IF;
        IF NEW.org_id <> OLD.org_id THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'Recruiting pipeline stages cannot be moved between orgs.';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS crm_recruiting_pipeline_lock_guard
    ON public.crm_recruiting_pipeline_stages;

CREATE TRIGGER crm_recruiting_pipeline_lock_guard
    BEFORE UPDATE OR DELETE ON public.crm_recruiting_pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION public.crm_recruiting_pipeline_lock_guard();

COMMENT ON FUNCTION public.crm_recruiting_pipeline_lock_guard() IS
    'Section 10 / Round 5 Addendum: refuses rename, reorder, terminality '
    'flip, or deletion of recruiting pipeline stages. Cosmetic columns '
    '(color, icon, display_name) remain editable so brand teams can '
    'retheme without touching the canonical schema.';

-- ---------------------------------------------------------------------------
-- 3. crm_recruiting_records.pipeline_stage — match the canonical 7 names
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.crm_recruiting_records'::regclass
           AND conname = 'crm_recruiting_records_pipeline_stage_check'
    ) THEN
        ALTER TABLE public.crm_recruiting_records
            DROP CONSTRAINT crm_recruiting_records_pipeline_stage_check;
    END IF;
    ALTER TABLE public.crm_recruiting_records
        ADD CONSTRAINT crm_recruiting_records_pipeline_stage_check
        CHECK (pipeline_stage IN (
            'prospect',
            'contacted',
            'interviewing',
            'contracted',
            'onboarding',
            'active',
            'inactive'
        ));
END$$;

COMMENT ON COLUMN public.crm_recruiting_records.pipeline_stage IS
    'Section 10 / Round 5 Addendum: locked to the canonical 7 recruiting '
    'stages (prospect → contacted → interviewing → contracted → onboarding '
    '→ active → inactive). Stage transitions are drafted in a future round.';

-- ---------------------------------------------------------------------------
-- 4. Idempotent seed — every org keeps exactly the canonical 7 rows
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_seed_recruiting_pipeline_stages(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    INSERT INTO public.crm_recruiting_pipeline_stages
        (org_id, name, display_name, color, sort_order, is_terminal)
    VALUES
        (p_org_id, 'prospect',     'Prospect',     '#3B82F6', 1, false),
        (p_org_id, 'contacted',    'Contacted',    '#6366F1', 2, false),
        (p_org_id, 'interviewing', 'Interviewing', '#8B5CF6', 3, false),
        (p_org_id, 'contracted',   'Contracted',   '#F59E0B', 4, false),
        (p_org_id, 'onboarding',   'Onboarding',   '#10B981', 5, false),
        (p_org_id, 'active',       'Active',       '#22C55E', 6, true),
        (p_org_id, 'inactive',     'Inactive',     '#EF4444', 7, true)
    ON CONFLICT (org_id, name) DO NOTHING;
END;
$function$;

COMMENT ON FUNCTION public.crm_seed_recruiting_pipeline_stages(uuid) IS
    'Section 10 / Round 5 Addendum: idempotent seed of the 7 canonical '
    'recruiting pipeline stages for an org. Safe to re-run.';

-- Backfill any org that currently has fewer than 7 stages so the lock
-- guard never trips on an org with a half-seeded pipeline.
DO $$
DECLARE
    v_org uuid;
BEGIN
    FOR v_org IN
        SELECT o.id
          FROM public.orgs o
          LEFT JOIN public.crm_recruiting_pipeline_stages s ON s.org_id = o.id
         GROUP BY o.id
        HAVING count(s.id) < 7
    LOOP
        PERFORM public.crm_seed_recruiting_pipeline_stages(v_org);
    END LOOP;
END$$;

COMMIT;
