-- ============================================================================
-- CRM rebuild — callable round-robin reassignment RPC
--
-- Phase 2's `crm_lead_after_insert_automation` trigger walks the round-robin
-- pool only on INSERT. There has never been a way to retroactively assign an
-- existing set of `lead_id`s through the pool, which is exactly what the
-- 2026-05-18 hotfix needs to dispose of the 229 unassigned backfilled leads
-- (companion migration `20260620610000_crm_lead_backfill_2026_05_18_tag.sql`).
--
-- This migration introduces `crm_assign_leads_round_robin(p_lead_ids uuid[],
-- p_org_id uuid)` — a SECURITY DEFINER helper that reuses the existing
-- `crm_round_robin_config` pool/position contract and emits matching audit
-- rows into `crm_round_robin_audit`, so the bulk reassignment is
-- indistinguishable in the audit log from an insert-time assignment.
--
-- Safety guarantees:
--   • Only fills `lead_submissions.assigned_to` when it IS NULL — never
--     reassigns a lead that already has an owner.
--   • Caller must hold `leads.assign` on the org (or be a global admin).
--   • Refuses to run if no active pool is configured (operator must seed
--     `crm_round_robin_config` first).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.crm_assign_leads_round_robin(
    p_lead_ids uuid[],
    p_org_id   uuid DEFAULT NULL
)
RETURNS TABLE (
    lead_id                uuid,
    assigned_to            uuid,
    position_at_assignment integer,
    was_skip               boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rr            RECORD;
    v_pool          jsonb;
    v_pool_len      int;
    v_pos           int;
    v_candidate     jsonb;
    v_attempts      int;
    v_was_skip      boolean;
    v_chosen_id     uuid;
    v_new_pos       int;
    v_lead_id       uuid;
    v_lead_org      uuid;
    v_authorized    boolean;
    v_first_lead    uuid;
BEGIN
    IF p_lead_ids IS NULL OR cardinality(p_lead_ids) = 0 THEN
        RETURN;
    END IF;

    -- Resolve org_id from caller payload, else from the first lead row.
    IF p_org_id IS NULL THEN
        v_first_lead := p_lead_ids[1];
        SELECT ls.org_id
          INTO v_lead_org
          FROM public.lead_submissions ls
         WHERE ls.id = v_first_lead;
        p_org_id := v_lead_org;
    END IF;

    IF p_org_id IS NULL THEN
        RAISE EXCEPTION 'crm_assign_leads_round_robin: unable to resolve org_id (lead not found or missing org_id)'
            USING ERRCODE = '22023';
    END IF;

    -- Permission gate: needs leads.assign on the org OR global admin.
    v_authorized := COALESCE(public.has_org_permission(p_org_id, 'leads.assign'), false)
                    OR COALESCE(public.current_user_has_admin_access(), false);
    IF NOT v_authorized THEN
        RAISE EXCEPTION 'crm_assign_leads_round_robin: not authorized (need leads.assign on org or admin)'
            USING ERRCODE = '42501';
    END IF;

    -- Pool config.
    SELECT * INTO v_rr
      FROM public.crm_round_robin_config
     WHERE org_id = p_org_id
       AND is_active = true
     LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'crm_assign_leads_round_robin: no active round-robin config for org %', p_org_id
            USING ERRCODE = '22023';
    END IF;

    v_pool     := v_rr.pool_members;
    v_pool_len := COALESCE(jsonb_array_length(v_pool), 0);

    IF v_pool_len = 0 THEN
        RAISE EXCEPTION 'crm_assign_leads_round_robin: pool is empty for org %', p_org_id
            USING ERRCODE = '22023';
    END IF;

    v_pos     := COALESCE(v_rr.current_position, -1);
    v_new_pos := v_pos;

    FOREACH v_lead_id IN ARRAY p_lead_ids LOOP
        -- Only operate on leads in the target org that are still unassigned.
        PERFORM 1
          FROM public.lead_submissions ls
         WHERE ls.id = v_lead_id
           AND ls.org_id = p_org_id
           AND ls.assigned_to IS NULL;
        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        v_chosen_id := NULL;
        v_was_skip  := false;
        v_attempts  := 0;

        LOOP
            EXIT WHEN v_attempts >= v_pool_len;
            v_attempts := v_attempts + 1;
            v_pos := (v_pos + 1) % v_pool_len;
            v_candidate := v_pool -> v_pos;

            IF (v_candidate ->> 'is_active')::boolean = true
               AND COALESCE((v_candidate ->> 'is_paused')::boolean, false) = false THEN
                v_chosen_id := (v_candidate ->> 'user_id')::uuid;
                v_new_pos := v_pos;
                EXIT;
            END IF;
            v_was_skip := true;
        END LOOP;

        IF v_chosen_id IS NULL THEN
            -- No active pool member at all; bail entire batch.
            EXIT;
        END IF;

        UPDATE public.lead_submissions
           SET assigned_to = v_chosen_id,
               updated_at  = now()
         WHERE id = v_lead_id
           AND assigned_to IS NULL;

        IF FOUND THEN
            INSERT INTO public.crm_round_robin_audit
                (org_id, lead_id, assigned_to, position_at_assignment, was_skip,
                 skip_reason, override_by, created_at)
            VALUES
                (p_org_id, v_lead_id, v_chosen_id, v_new_pos, v_was_skip,
                 CASE WHEN v_was_skip THEN 'inactive_or_paused_pool_member' ELSE NULL END,
                 auth.uid(), now());

            lead_id                := v_lead_id;
            assigned_to            := v_chosen_id;
            position_at_assignment := v_new_pos;
            was_skip               := v_was_skip;
            RETURN NEXT;
        END IF;
    END LOOP;

    -- Persist pool cursor once per batch (mirrors trigger behavior of
    -- updating per-assignment, just amortized across the batch since the
    -- net cursor advance is the same).
    IF v_new_pos <> COALESCE(v_rr.current_position, -1) THEN
        UPDATE public.crm_round_robin_config
           SET current_position = v_new_pos,
               updated_at       = now()
         WHERE id = v_rr.id;
    END IF;

    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_assign_leads_round_robin(uuid[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_assign_leads_round_robin(uuid[], uuid)
   TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_assign_leads_round_robin(uuid[], uuid) IS
    'Retroactive round-robin assigner. Walks `crm_round_robin_config.pool_members` '
    'and fills `lead_submissions.assigned_to` on the given leads, only when '
    'currently NULL. Emits matching `crm_round_robin_audit` rows so the bulk '
    'reassignment is observable in the same audit log used by Phase 2''s '
    'insert-time round-robin trigger. Requires `leads.assign` on the org or '
    'global admin access.';

COMMIT;
