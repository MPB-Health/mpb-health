-- ============================================================================
-- CRM rebuild — Round 12 Addendum (2026-05-14):
--   Roster cleanup (Leo departed) + Adam goal lock (min/ideal split) +
--   Special Projects exemption converted from binary → pro-rated.
-- ============================================================================
-- Spec source: Round 12 Addendum image (2026-05-14):
--   • Active inside-sales roster is now Adam (PT) + Tupac (FT). Leo is
--     gone — historical Daily Log entries stay (reporting continuity);
--     only forward-looking automation needs to stop addressing him.
--     Reassignment of leads / tasks / cadences is an admin operational
--     task and is not enforced here.
--   • Adam (part-time): minimum 10 conversations/day, ideal 13/day.
--     Header chip displays toward IDEAL ("8 / 13 today"). End-of-day
--     alert threshold = MINIMUM (10). Falling below 10 fires the alert;
--     landing 10–12 hits min-but-not-ideal (no alert, but visible).
--   • Tupac (full-time): 25 conversations/day. Treat as both minimum
--     and ideal — single threshold (alert fires if < 25). Schema still
--     supports a separate min/ideal split should that change.
--   • REPLACE the Section 20 binary "any SP entry suppresses the alert"
--     rule with a pro-rated reduction.  Each rep has a standard
--     work-day length (Tupac = 8h, Adam = 4h — confirm with admin).
--     Effective goal = base goal × (work_day_hours – SP hours today)
--                                 ÷ work_day_hours.  Apply to both min
--     and ideal targets.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Org-level config — separate min/ideal targets + pro-rated exemption knob
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_conversation_goal_config
    ADD COLUMN IF NOT EXISTS full_time_minimum_target integer
        NOT NULL DEFAULT 25 CHECK (full_time_minimum_target BETWEEN 1 AND 200),
    ADD COLUMN IF NOT EXISTS full_time_ideal_target integer
        NOT NULL DEFAULT 25 CHECK (full_time_ideal_target BETWEEN 1 AND 200),
    ADD COLUMN IF NOT EXISTS full_time_work_day_hours numeric(4,2)
        NOT NULL DEFAULT 8.0 CHECK (full_time_work_day_hours BETWEEN 0.5 AND 24),
    ADD COLUMN IF NOT EXISTS part_time_default_minimum_target integer
        NOT NULL DEFAULT 10 CHECK (part_time_default_minimum_target BETWEEN 1 AND 200),
    ADD COLUMN IF NOT EXISTS part_time_default_ideal_target integer
        NOT NULL DEFAULT 13 CHECK (part_time_default_ideal_target BETWEEN 1 AND 200),
    ADD COLUMN IF NOT EXISTS part_time_default_work_day_hours numeric(4,2)
        NOT NULL DEFAULT 4.0 CHECK (part_time_default_work_day_hours BETWEEN 0.5 AND 24),
    -- Round 12 Addendum: pro-rated exemption is the new default. The
    -- binary `exempt_special_projects_days` knob stays callable so admins
    -- can opt back to the old behaviour, but the spec says always pro-
    -- rate going forward.
    ADD COLUMN IF NOT EXISTS prorate_special_projects_hours boolean
        NOT NULL DEFAULT true;

COMMENT ON COLUMN public.crm_conversation_goal_config.full_time_minimum_target IS
    'Round 12 Addendum (2026-05-14) — minimum daily conversation count for full-time reps. Alert fires below this. Tupac default = 25 (= ideal_target so single threshold).';
COMMENT ON COLUMN public.crm_conversation_goal_config.full_time_ideal_target IS
    'Round 12 Addendum — ideal daily conversation count for FT reps. Header chip shows progress toward this number.';
COMMENT ON COLUMN public.crm_conversation_goal_config.full_time_work_day_hours IS
    'Round 12 Addendum — standard work-day length for full-time reps (Tupac = 8 hours). Used as the denominator in the pro-rated SP exemption formula.';
COMMENT ON COLUMN public.crm_conversation_goal_config.part_time_default_minimum_target IS
    'Round 12 Addendum — default minimum daily conversation count for part-time reps. Adam = 10.';
COMMENT ON COLUMN public.crm_conversation_goal_config.part_time_default_ideal_target IS
    'Round 12 Addendum — default ideal daily conversation count for part-time reps. Adam = 13.';
COMMENT ON COLUMN public.crm_conversation_goal_config.part_time_default_work_day_hours IS
    'Round 12 Addendum — default work-day length for PT reps (Adam = 4 hours). Pro-ration denominator.';
COMMENT ON COLUMN public.crm_conversation_goal_config.prorate_special_projects_hours IS
    'Round 12 Addendum — when true (default), the Section 20 binary SP exemption is replaced by a pro-rated reduction: effective_goal = base_goal × (work_day_hours - sp_hours) / work_day_hours.';

-- Backfill: copy the legacy `full_time_target` into the new min/ideal
-- columns for existing orgs so behaviour is unchanged on day 0. Admins
-- who want the spec defaults can flip min=25 / ideal=25 manually (or
-- accept the seeded ones for new orgs).
UPDATE public.crm_conversation_goal_config
   SET full_time_minimum_target = full_time_target,
       full_time_ideal_target   = full_time_target
 WHERE full_time_minimum_target = 25 AND full_time_ideal_target = 25;

-- ----------------------------------------------------------------------------
-- 2. Per-user override — separate min/ideal + work-day length
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_user_conversation_goal_overrides
    ADD COLUMN IF NOT EXISTS minimum_target integer
        CHECK (minimum_target IS NULL OR minimum_target BETWEEN 0 AND 200),
    ADD COLUMN IF NOT EXISTS ideal_target integer
        CHECK (ideal_target IS NULL OR ideal_target BETWEEN 0 AND 200),
    ADD COLUMN IF NOT EXISTS work_day_hours numeric(4,2)
        CHECK (work_day_hours IS NULL OR (work_day_hours BETWEEN 0.5 AND 24));

COMMENT ON COLUMN public.crm_user_conversation_goal_overrides.minimum_target IS
    'Round 12 Addendum — per-user minimum conversation target. NULL falls back to org default for the rep''s is_part_time bucket. 0 marks the rep entirely exempt.';
COMMENT ON COLUMN public.crm_user_conversation_goal_overrides.ideal_target IS
    'Round 12 Addendum — per-user ideal conversation target (header display). NULL falls back to org default.';
COMMENT ON COLUMN public.crm_user_conversation_goal_overrides.work_day_hours IS
    'Round 12 Addendum — per-user work-day length in hours. Tupac = 8.0 (FT default), Adam = 4.0 (PT default — confirm with admin). Drives the pro-rated SP exemption formula.';

-- Backfill: any existing override row keeps its current `daily_target`
-- semantics (min = ideal = daily_target) until an admin updates it.
UPDATE public.crm_user_conversation_goal_overrides
   SET minimum_target = COALESCE(minimum_target, daily_target),
       ideal_target   = COALESCE(ideal_target, daily_target);

-- ----------------------------------------------------------------------------
-- 3. crm_count_conversations v2 — min/ideal + pro-rated SP exemption
-- ----------------------------------------------------------------------------
-- Drop the previous signature first (the return type changes, so a CREATE
-- OR REPLACE alone won't work).

DROP FUNCTION IF EXISTS public.crm_count_conversations(uuid, uuid, date);

CREATE OR REPLACE FUNCTION public.crm_count_conversations(
    p_org_id uuid,
    p_user_id uuid,
    p_date date
) RETURNS TABLE (
    conversation_count integer,
    -- Effective targets after pro-rating today's Special Projects hours.
    -- Header chip reads `effective_ideal`; alert engine reads `effective_minimum`.
    effective_minimum integer,
    effective_ideal integer,
    -- Base targets before pro-ration (for tooltip / "if you hadn't logged
    -- SP hours" UX).
    base_minimum integer,
    base_ideal integer,
    -- Sums used by the pro-ration formula so callers can render an
    -- explanation chip ("4h / 8h work-day; 1h SP today → goal pro-rated
    -- from 25 → 22").
    sp_hours_today numeric,
    work_day_hours numeric,
    is_special_projects_day boolean,
    -- True when daily_target = 0 (admin override entirely exempts the rep).
    is_exempt boolean,
    -- True when conversation_count < effective_minimum AND not exempt.
    is_below_minimum boolean,
    -- True when ≥ effective_minimum but < effective_ideal.
    is_at_minimum boolean,
    is_at_ideal boolean,
    target integer  -- legacy column (= effective_ideal) for callers still on v1
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_cfg public.crm_conversation_goal_config%ROWTYPE;
    v_override public.crm_user_conversation_goal_overrides%ROWTYPE;
    v_count integer := 0;
    v_base_min integer;
    v_base_ideal integer;
    v_eff_min integer;
    v_eff_ideal integer;
    v_work_hours numeric(5,2);
    v_sp_hours numeric(5,2) := 0;
    v_sp_minutes integer := 0;
    v_sp_day boolean := false;
    v_exempt boolean := false;
    v_is_part_time boolean := false;
    v_factor numeric(6,4);
BEGIN
    SELECT * INTO v_cfg FROM public.crm_conversation_goal_config WHERE org_id = p_org_id;
    IF NOT FOUND THEN
        v_cfg.full_time_target := 25;
        v_cfg.full_time_minimum_target := 25;
        v_cfg.full_time_ideal_target := 25;
        v_cfg.full_time_work_day_hours := 8.0;
        v_cfg.part_time_default_target := 10;
        v_cfg.part_time_default_minimum_target := 10;
        v_cfg.part_time_default_ideal_target := 13;
        v_cfg.part_time_default_work_day_hours := 4.0;
        v_cfg.exempt_special_projects_days := false;
        v_cfg.prorate_special_projects_hours := true;
        v_cfg.counted_sections := ARRAY['lead_communication','activities']::text[];
        v_cfg.counted_activity_types := ARRAY['call','email','sms','text','meeting','demo','presentation']::text[];
    END IF;

    SELECT * INTO v_override
      FROM public.crm_user_conversation_goal_overrides
     WHERE org_id = p_org_id AND user_id = p_user_id;

    v_is_part_time := COALESCE(v_override.is_part_time, false);

    IF FOUND THEN
        IF v_override.daily_target = 0 THEN
            v_exempt := true;
        END IF;
        v_base_min   := COALESCE(v_override.minimum_target,
                                 CASE WHEN v_is_part_time THEN v_cfg.part_time_default_minimum_target
                                      ELSE v_cfg.full_time_minimum_target END);
        v_base_ideal := COALESCE(v_override.ideal_target,
                                 CASE WHEN v_is_part_time THEN v_cfg.part_time_default_ideal_target
                                      ELSE v_cfg.full_time_ideal_target END);
        v_work_hours := COALESCE(v_override.work_day_hours,
                                 CASE WHEN v_is_part_time THEN v_cfg.part_time_default_work_day_hours
                                      ELSE v_cfg.full_time_work_day_hours END);
    ELSE
        v_base_min   := v_cfg.full_time_minimum_target;
        v_base_ideal := v_cfg.full_time_ideal_target;
        v_work_hours := v_cfg.full_time_work_day_hours;
    END IF;

    -- Sum today's Special Projects minutes for this rep.
    SELECT COALESCE(SUM(time_minutes), 0)::integer INTO v_sp_minutes
      FROM public.crm_special_projects
     WHERE org_id = p_org_id
       AND user_id = p_user_id
       AND log_date = p_date;
    v_sp_hours := round(v_sp_minutes::numeric / 60.0, 2);
    v_sp_day := v_sp_minutes > 0;

    IF v_cfg.prorate_special_projects_hours AND NOT v_exempt THEN
        -- Round 12 Addendum: pro-rated reduction. Floor effective hours
        -- at zero (a rep can't log more SP hours than the work day).
        v_factor := GREATEST(v_work_hours - v_sp_hours, 0::numeric) / NULLIF(v_work_hours, 0);
        v_factor := COALESCE(v_factor, 0);
        v_eff_min   := GREATEST(0, FLOOR(v_base_min   * v_factor)::integer);
        v_eff_ideal := GREATEST(0, FLOOR(v_base_ideal * v_factor)::integer);
    ELSIF v_cfg.exempt_special_projects_days AND NOT v_exempt THEN
        -- Legacy binary exemption (kept for orgs that opt out of pro-rating).
        IF v_sp_day THEN
            v_exempt := true;
            v_eff_min := 0;
            v_eff_ideal := 0;
        ELSE
            v_eff_min := v_base_min;
            v_eff_ideal := v_base_ideal;
        END IF;
    ELSE
        v_eff_min := v_base_min;
        v_eff_ideal := v_base_ideal;
    END IF;

    IF v_exempt THEN
        v_eff_min := 0;
        v_eff_ideal := 0;
    END IF;

    SELECT COUNT(*)::integer INTO v_count
      FROM public.crm_daily_log_events e
     WHERE e.org_id = p_org_id
       AND e.user_id = p_user_id
       AND e.log_date = p_date
       AND e.section = ANY (v_cfg.counted_sections)
       AND e.activity_type = ANY (v_cfg.counted_activity_types);

    conversation_count := v_count;
    effective_minimum := v_eff_min;
    effective_ideal := v_eff_ideal;
    base_minimum := v_base_min;
    base_ideal := v_base_ideal;
    sp_hours_today := v_sp_hours;
    work_day_hours := v_work_hours;
    is_special_projects_day := v_sp_day;
    is_exempt := v_exempt;
    is_below_minimum := (NOT v_exempt) AND (v_count < v_eff_min);
    is_at_minimum := (NOT v_exempt) AND (v_count >= v_eff_min) AND (v_count < v_eff_ideal);
    is_at_ideal := (NOT v_exempt) AND (v_count >= v_eff_ideal);
    target := v_eff_ideal;  -- backwards-compat field for v1 callers
    RETURN NEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_count_conversations(uuid, uuid, date)
    TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_count_conversations(uuid, uuid, date) IS
    'CRM rebuild Round 12 Addendum (2026-05-14) — returns conversation_count + effective_minimum / effective_ideal after pro-rating today''s Special Projects hours, plus base targets, work_day_hours, and alert flags.';

COMMIT;
