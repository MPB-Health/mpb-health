-- ============================================================================
-- CRM rebuild — Phase 3 — STEP 2 of 2
-- Cadence schema v2 + Quote Response default seed + engagement/enroll RPCs
-- ============================================================================
--
-- Section 13/14: cadences gain multi-channel steps (email/sms/phone) and
-- engagement / opt-out interrupts so the Quote Response cadence behaves to
-- spec the moment a reply lands or an opt-out keyword fires.
--
-- v2 step jsonb shape:
--   {
--     step: int,
--     channel: 'email' | 'sms' | 'phone',
--     template_id: uuid | null,        -- crm_master_templates.id
--     day_offset: int,                 -- days from enrollment
--     send_window: { start_hour: int, end_hour: int, tz: text } | null,
--     halt_on_engagement: bool,
--     description: text | null
--   }
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Cadence v2 columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_follow_up_cadences
    ADD COLUMN IF NOT EXISTS halt_on_engagement boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS halt_on_optout boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1;
COMMENT ON COLUMN public.crm_follow_up_cadences.halt_on_engagement IS
    'CRM rebuild P3 — when true, any engagement signal pauses the cadence and routes Working/Quoted → Engaged.';
COMMENT ON COLUMN public.crm_follow_up_cadences.halt_on_optout IS
    'CRM rebuild P3 — when true, any opt-out keyword in a reply pauses the cadence and routes the lead to Lost / DNC.';
COMMENT ON COLUMN public.crm_follow_up_cadences.schema_version IS
    'Cadence steps schema version. v1 = legacy {step,delay_hours,channel,label}. v2 = adds template_id, send_window, halt_on_engagement.';
-- ----------------------------------------------------------------------------
-- 2. Quote Response cadence v2 placeholder
-- ----------------------------------------------------------------------------
-- The verbatim copy from `Quote Response Email Cadence (Call to Action
-- LinkedIn).docx` still has to be supplied; this seeds the 6-step structure
-- so `crm-website-lead-intake` and the cadence builder UI can both
-- reference a stable cadence id per org. Admins fill in the actual subject
-- + body in Settings → Cadences before the website auto-response goes live.

INSERT INTO public.crm_follow_up_cadences (
    org_id, pipeline_stage_id, name, description, steps,
    is_default, is_active, halt_on_engagement, halt_on_optout, schema_version,
    created_at, updated_at
)
SELECT
    o.id,
    NULL::uuid,
    'Quote Response',
    'Section 13 / Round 7 — the website Get-a-Quote auto-response. Email #1 fires from sales@mympb.com and TP#1–TP#5 follow on Day 3/7/14/21/30. Halts on engagement or opt-out.',
    jsonb_build_array(
        jsonb_build_object('step', 1, 'channel', 'email', 'day_offset', 0,  'template_id', null, 'description', 'Email #1 — preliminary quote (auto from website)',          'halt_on_engagement', true, 'send_window', null),
        jsonb_build_object('step', 2, 'channel', 'email', 'day_offset', 3,  'template_id', null, 'description', 'TP#1 — Day 3 follow-up',                                     'halt_on_engagement', true, 'send_window', null),
        jsonb_build_object('step', 3, 'channel', 'email', 'day_offset', 7,  'template_id', null, 'description', 'TP#2 — Day 7 follow-up',                                     'halt_on_engagement', true, 'send_window', null),
        jsonb_build_object('step', 4, 'channel', 'email', 'day_offset', 14, 'template_id', null, 'description', 'TP#3 — Day 14 follow-up',                                    'halt_on_engagement', true, 'send_window', null),
        jsonb_build_object('step', 5, 'channel', 'email', 'day_offset', 21, 'template_id', null, 'description', 'TP#4 — Day 21 follow-up',                                    'halt_on_engagement', true, 'send_window', null),
        jsonb_build_object('step', 6, 'channel', 'email', 'day_offset', 30, 'template_id', null, 'description', 'TP#5 — Day 30 final follow-up before nurture promotion',     'halt_on_engagement', true, 'send_window', null)
    ),
    false, true, true, true, 2, now(), now()
FROM public.orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_follow_up_cadences c
    WHERE c.org_id = o.id AND c.name = 'Quote Response'
);
-- ----------------------------------------------------------------------------
-- 3. Engagement signal RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_register_engagement_signal(
    p_lead_id uuid,
    p_signal_type text DEFAULT 'reply'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead public.lead_submissions%ROWTYPE;
BEGIN
    SELECT * INTO v_lead FROM public.lead_submissions WHERE id = p_lead_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'lead % not found', p_lead_id USING ERRCODE = 'no_data_found';
    END IF;

    UPDATE public.crm_lead_cadence_state s
       SET paused = true,
           paused_reason = COALESCE(s.paused_reason, 'engagement_detected:' || p_signal_type),
           updated_at = now()
      FROM public.crm_follow_up_cadences c
     WHERE s.cadence_id = c.id
       AND s.lead_id = p_lead_id
       AND s.paused = false
       AND s.completed_at IS NULL
       AND c.halt_on_engagement = true;

    UPDATE public.lead_submissions
       SET engagement_detected_at = COALESCE(engagement_detected_at, now()),
           pipeline_stage = CASE
               WHEN pipeline_stage IN ('quoted', 'working') THEN 'engaged'
               ELSE pipeline_stage
           END,
           stage_changed_at = CASE
               WHEN pipeline_stage IN ('quoted', 'working') THEN now()
               ELSE stage_changed_at
           END,
           last_touched_at = now(),
           updated_at = now()
     WHERE id = p_lead_id;

    -- crm_activities.activity_type CHECK accepts 'other'; signal kind goes
    -- in subject so the unified timeline shows it. created_by is required
    -- (NOT NULL); fall back to the lead's assigned rep or system uuid 0.
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'crm_activities'
    ) THEN
        INSERT INTO public.crm_activities (
            org_id, lead_id, activity_type, subject, description,
            created_by, created_at, updated_at
        ) VALUES (
            v_lead.org_id, p_lead_id, 'other',
            'Engagement signal: ' || p_signal_type,
            'Cadence halted by halt_on_engagement; lead routed to engaged.',
            COALESCE(v_lead.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid),
            now(), now()
        );
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_register_engagement_signal(uuid, text) TO authenticated, service_role;
-- ----------------------------------------------------------------------------
-- 4. Cadence enrollment helper RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_enroll_lead_in_cadence(
    p_lead_id uuid,
    p_cadence_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead public.lead_submissions%ROWTYPE;
    v_cad public.crm_follow_up_cadences%ROWTYPE;
    v_first_step jsonb;
    v_day_offset int;
    v_next timestamptz;
    v_state_id uuid;
BEGIN
    SELECT * INTO v_lead FROM public.lead_submissions WHERE id = p_lead_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'lead % not found', p_lead_id USING ERRCODE = 'no_data_found'; END IF;
    SELECT * INTO v_cad FROM public.crm_follow_up_cadences WHERE id = p_cadence_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'cadence % not found', p_cadence_id USING ERRCODE = 'no_data_found'; END IF;
    IF v_cad.org_id <> v_lead.org_id THEN
        RAISE EXCEPTION 'cadence and lead orgs do not match';
    END IF;

    v_first_step := v_cad.steps -> 0;
    v_day_offset := COALESCE(
        (v_first_step ->> 'day_offset')::int,
        ((v_first_step ->> 'delay_hours')::int / 24),
        0
    );
    v_next := now() + make_interval(days => v_day_offset);

    INSERT INTO public.crm_lead_cadence_state (
        lead_id, cadence_id, org_id, current_step,
        next_action_at, paused, paused_reason, completed_at
    ) VALUES (
        p_lead_id, p_cadence_id, v_lead.org_id, 0,
        v_next, false, NULL, NULL
    )
    ON CONFLICT (lead_id, cadence_id) DO UPDATE
        SET paused = false,
            paused_reason = NULL,
            completed_at = NULL,
            next_action_at = COALESCE(crm_lead_cadence_state.next_action_at, EXCLUDED.next_action_at),
            updated_at = now()
    RETURNING id INTO v_state_id;

    RETURN v_state_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_enroll_lead_in_cadence(uuid, uuid) TO authenticated, service_role;
COMMIT;
