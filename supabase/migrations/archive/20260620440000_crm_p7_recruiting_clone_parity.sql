-- ============================================================================
-- CRM rebuild — Phase 7 / Section 9 — Recruiting clone parity (Round 5)
-- ============================================================================
-- Spec ("New Section — Recruiting" + "Clone From Leads Module"):
--   • Recruiting inherits subsection bar, profile layout, top action row,
--     Pin↔Unpin, in-profile email composer with template insert, bulk-assign
--     and mass-email, per-rep templates and master template library, and the
--     multi-channel cadence builder ("recruiting-specific cadences live
--     here").
--   • Daily Log auto-capture (Section 8) for every recruiting activity.
--
-- This migration ships the schema half of the parity work:
--   1. Cadences gain `module_scope` (`leads` | `recruiting`) so reps can
--      author recruiting-only cadences without commingling with consumer
--      lead cadences. Existing rows backfill to `'leads'`.
--   2. `crm_enroll_lead_in_cadence` learns to reject recruiting-scoped
--      cadences with a clear error so a Lead Profile dropdown can never
--      enroll a consumer lead in an agent-recruitment sequence.
--   3. `crm_focus_items.entity_type` accepts `'recruiting'` so Pin↔Unpin
--      from the Recruit Profile reuses the existing focus_items table.
--   4. A small audit log helper for recruit-side cadence enrollments lands
--      now (`crm_recruit_cadence_state`) so the next round can wire up the
--      in-profile "Enroll in cadence" dropdown without another schema
--      migration. Empty + RLS-locked at creation time.
--
-- Daily Log auto-capture for recruiting was already wired in Phase 4 — the
-- `crm_dl_emit_from_activity` trigger emits regardless of `related_to_type`
-- (it stores `related_to_type` and `related_to_id` in the event metadata),
-- so a `crm_activities` row with `related_to_type='recruiting'` lands in
-- `crm_daily_log_events` for the rep automatically. No changes here.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. crm_follow_up_cadences.module_scope
-- ---------------------------------------------------------------------------

ALTER TABLE public.crm_follow_up_cadences
    ADD COLUMN IF NOT EXISTS module_scope text NOT NULL DEFAULT 'leads';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.crm_follow_up_cadences'::regclass
           AND conname  = 'crm_follow_up_cadences_module_scope_check'
    ) THEN
        ALTER TABLE public.crm_follow_up_cadences
            ADD CONSTRAINT crm_follow_up_cadences_module_scope_check
            CHECK (module_scope IN ('leads', 'recruiting'));
    END IF;
END$$;

UPDATE public.crm_follow_up_cadences
   SET module_scope = 'leads'
 WHERE module_scope IS NULL;

CREATE INDEX IF NOT EXISTS idx_crm_cadences_org_scope_active
    ON public.crm_follow_up_cadences (org_id, module_scope, is_active);

COMMENT ON COLUMN public.crm_follow_up_cadences.module_scope IS
    'Section 9 / Round 5: which CRM module the cadence belongs to. '
    '"leads" cadences enroll consumer leads via crm_enroll_lead_in_cadence; '
    '"recruiting" cadences enroll agent recruits (P5+ enrollment plumbing). '
    'Recruiting and Leads cadences must not commingle per spec.';

-- ---------------------------------------------------------------------------
-- 2. crm_enroll_lead_in_cadence — guard against recruiting-scoped cadences
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_enroll_lead_in_cadence(
    p_lead_id uuid,
    p_cadence_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_org_id uuid;
    v_cadence record;
    v_existing_id uuid;
    v_now timestamptz := now();
BEGIN
    SELECT org_id INTO v_org_id FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Lead % not found', p_lead_id;
    END IF;

    SELECT id, org_id, is_active, COALESCE(module_scope, 'leads') AS module_scope
      INTO v_cadence
      FROM public.crm_follow_up_cadences
     WHERE id = p_cadence_id;

    IF v_cadence IS NULL THEN
        RAISE EXCEPTION 'Cadence % not found', p_cadence_id;
    END IF;
    IF v_cadence.org_id <> v_org_id THEN
        RAISE EXCEPTION 'Cadence % belongs to a different org', p_cadence_id;
    END IF;
    IF v_cadence.module_scope <> 'leads' THEN
        RAISE EXCEPTION 'Cadence % is scoped to %, cannot enroll consumer leads',
            p_cadence_id, v_cadence.module_scope;
    END IF;
    IF NOT v_cadence.is_active THEN
        RAISE EXCEPTION 'Cadence % is inactive', p_cadence_id;
    END IF;

    -- Idempotent: re-enrolling the same lead into the same cadence reuses
    -- the existing state row (and unpauses it).
    SELECT id INTO v_existing_id
      FROM public.crm_lead_cadence_state
     WHERE lead_id = p_lead_id AND cadence_id = p_cadence_id;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.crm_lead_cadence_state
           SET paused = false,
               paused_reason = NULL,
               next_action_at = v_now,
               updated_at = v_now
         WHERE id = v_existing_id;
        RETURN v_existing_id;
    END IF;

    INSERT INTO public.crm_lead_cadence_state (
        lead_id, cadence_id, org_id,
        current_step, next_action_at, paused
    ) VALUES (
        p_lead_id, p_cadence_id, v_org_id,
        0, v_now, false
    )
    RETURNING id INTO v_existing_id;

    RETURN v_existing_id;
END;
$function$;

COMMENT ON FUNCTION public.crm_enroll_lead_in_cadence(uuid, uuid) IS
    'Section 13 + Section 9 Round 5: enrolls a consumer lead into a leads-scoped '
    'cadence. Refuses recruiting-scoped cadences. Idempotent.';

-- ---------------------------------------------------------------------------
-- 3. crm_focus_items.entity_type — accept 'recruiting'
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.crm_focus_items'::regclass
           AND conname  = 'crm_focus_items_entity_type_check'
    ) THEN
        ALTER TABLE public.crm_focus_items
            DROP CONSTRAINT crm_focus_items_entity_type_check;
    END IF;

    ALTER TABLE public.crm_focus_items
        ADD CONSTRAINT crm_focus_items_entity_type_check
        CHECK (entity_type IN ('lead', 'contact', 'deal', 'task', 'case', 'recruiting'));
END$$;

COMMENT ON COLUMN public.crm_focus_items.entity_type IS
    'Section 6 / Round 5: which CRM record is pinned to Today. '
    '"recruiting" is the agent-recruiting clone introduced in Phase 5; '
    'reps Pin↔Unpin recruits the same way they do leads.';

-- ---------------------------------------------------------------------------
-- 4. crm_recruit_cadence_state — empty audit table for the future round
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_recruit_cadence_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recruit_id uuid NOT NULL REFERENCES public.crm_recruiting_records(id) ON DELETE CASCADE,
    cadence_id uuid NOT NULL REFERENCES public.crm_follow_up_cadences(id) ON DELETE CASCADE,
    org_id uuid NOT NULL,
    current_step integer NOT NULL DEFAULT 0,
    next_action_at timestamptz,
    paused boolean NOT NULL DEFAULT false,
    paused_reason text,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (recruit_id, cadence_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_recruit_cadence_state_org
    ON public.crm_recruit_cadence_state (org_id, paused, next_action_at);

ALTER TABLE public.crm_recruit_cadence_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruit_cadence_state_org_select ON public.crm_recruit_cadence_state;
DROP POLICY IF EXISTS recruit_cadence_state_org_write  ON public.crm_recruit_cadence_state;

CREATE POLICY recruit_cadence_state_org_select
    ON public.crm_recruit_cadence_state
    FOR SELECT
    USING (public.is_org_member(org_id));

CREATE POLICY recruit_cadence_state_org_write
    ON public.crm_recruit_cadence_state
    FOR ALL
    USING (public.has_org_permission(org_id, 'recruiting.write'))
    WITH CHECK (public.has_org_permission(org_id, 'recruiting.write'));

COMMENT ON TABLE public.crm_recruit_cadence_state IS
    'Section 9 Round 5: per-recruit cadence enrollment audit. The actual '
    'scheduled-send worker for recruiting cadences ships in a future round; '
    'this table is created empty + RLS-locked so the schema is stable when it '
    'does. Mirrors crm_lead_cadence_state.';

COMMIT;
