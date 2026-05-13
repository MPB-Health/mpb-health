-- ============================================================================
-- CRM rebuild — Phase 4 — STEP 2 of 2
-- Daily Log v2 triggers + Performance Lag Alert state + roll-up RPC
-- ============================================================================
-- Section 8 (real-time per-rep counters) + Section 12 (Performance Lag).
--
-- Auto-capture flow:
--   crm_activities INSERT  → trigger crm_dl_emit_from_activity   →
--   crm_email_log  INSERT  → trigger crm_dl_emit_from_email_log  →
--   crm_lead_quote_history INSERT → trigger crm_dl_emit_from_quote →
--                              all funnel into crm_daily_log_events.
--
-- A second trigger on crm_daily_log_events keeps the legacy counters on
-- crm_rep_daily_log_entries in sync so existing dashboard widgets (calls
-- made / emails sent / linkedin touches / meetings held) keep working
-- through cutover.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Section taxonomy classifier
-- ----------------------------------------------------------------------------
-- Maps an activity_type / source pair to one of the seven Section 11
-- sections. Returns NULL if the activity should be ignored (e.g. inbound
-- emails that aren't rep-initiated and shouldn't count toward a rep's
-- daily output). The classifier is in plpgsql to keep the trigger fast and
-- side-effect-free; the source-of-truth taxonomy mapping lives here.

CREATE OR REPLACE FUNCTION public.crm_classify_log_section(
    p_activity_type text,
    p_source text
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- LinkedIn-specific buckets first.
    IF p_activity_type IN (
        'linkedin_connection_sent', 'linkedin_connection_accepted',
        'linkedin_message', 'linkedin_post', 'linkedin_engagement',
        'linkedin_short'
    ) THEN
        RETURN 'linkedin_activity';
    END IF;

    -- Lead communication: calls / emails / sms / texts / notes.
    IF p_activity_type IN ('call', 'email', 'sms', 'text', 'note') THEN
        RETURN 'lead_communication';
    END IF;

    -- Pipeline: stage changes, lead routing, meetings, tasks, demos,
    -- proposals, presentations.
    IF p_activity_type IN (
        'meeting', 'task', 'demo', 'proposal_sent',
        'presentation', 'live_chat', 'crm_lead_entered'
    ) THEN
        RETURN 'pipeline';
    END IF;

    IF p_activity_type IN ('networking_event', 'community_outreach', 'referral_requested') THEN
        RETURN 'activities';
    END IF;

    IF p_activity_type IN ('content_creation', 'content', 'webinar', 'social') THEN
        RETURN 'content_creation';
    END IF;

    IF p_activity_type IN ('quote_sent', 'enrollment_won', 'deals_closed') THEN
        RETURN 'deals_closed';
    END IF;

    IF p_source = 'crm_special_projects' THEN
        RETURN 'special_projects';
    END IF;

    -- Default to "activities" so nothing gets dropped silently.
    RETURN 'activities';
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_classify_log_section(text, text) TO authenticated, service_role;
-- ----------------------------------------------------------------------------
-- 2. Roll-up trigger on crm_daily_log_events
-- ----------------------------------------------------------------------------
-- Bumps the matching counter on crm_rep_daily_log_entries the moment a
-- daily-log event lands. Inserts the row if it doesn't exist yet.

CREATE OR REPLACE FUNCTION public.crm_daily_log_rollup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_call_inc      integer := 0;
    v_email_inc     integer := 0;
    v_li_inc        integer := 0;
    v_meet_inc      integer := 0;
    v_cancel_inc    integer := 0;
    v_pipe_inc      integer := 0;
    v_deal_inc      integer := 0;
    v_other_inc     integer := 0;
    v_content_inc   integer := 0;
BEGIN
    -- Map activity_type → counter increments. We rely on the classifier
    -- already setting `section` correctly on insert; the activity_type
    -- here just decides which legacy column ticks.
    IF NEW.activity_type = 'call' THEN v_call_inc := 1; END IF;
    IF NEW.activity_type IN ('email', 'sms', 'text') THEN v_email_inc := 1; END IF;
    IF NEW.activity_type IN (
        'linkedin_connection_sent', 'linkedin_connection_accepted',
        'linkedin_message', 'linkedin_post', 'linkedin_engagement',
        'linkedin_short'
    ) THEN v_li_inc := 1; END IF;
    IF NEW.activity_type = 'meeting' THEN v_meet_inc := 1; END IF;

    -- Section 11 sub-section counters
    IF NEW.activity_subtype = 'cancellation_call' THEN v_cancel_inc := 1; END IF;
    IF NEW.section = 'pipeline' THEN v_pipe_inc := 1; END IF;
    IF NEW.section = 'deals_closed' THEN v_deal_inc := 1; END IF;
    IF NEW.section = 'content_creation' THEN v_content_inc := 1; END IF;
    IF NEW.section = 'activities' THEN v_other_inc := 1; END IF;

    INSERT INTO public.crm_rep_daily_log_entries AS d (
        org_id, user_id, log_date,
        calls_made, emails_sent, linkedin_touches, meetings_held,
        cancellation_calls, pipeline_actions, deals_closed,
        activities_other, content_creation,
        manual_flag, created_at, updated_at
    ) VALUES (
        NEW.org_id, NEW.user_id, NEW.log_date,
        v_call_inc, v_email_inc, v_li_inc, v_meet_inc,
        v_cancel_inc, v_pipe_inc, v_deal_inc,
        v_other_inc, v_content_inc,
        false, now(), now()
    )
    ON CONFLICT (org_id, user_id, log_date) DO UPDATE
       SET calls_made         = COALESCE(d.calls_made, 0)         + v_call_inc,
           emails_sent        = COALESCE(d.emails_sent, 0)        + v_email_inc,
           linkedin_touches   = COALESCE(d.linkedin_touches, 0)   + v_li_inc,
           meetings_held      = COALESCE(d.meetings_held, 0)      + v_meet_inc,
           cancellation_calls = COALESCE(d.cancellation_calls, 0) + v_cancel_inc,
           pipeline_actions   = COALESCE(d.pipeline_actions, 0)   + v_pipe_inc,
           deals_closed       = COALESCE(d.deals_closed, 0)       + v_deal_inc,
           activities_other   = COALESCE(d.activities_other, 0)   + v_other_inc,
           content_creation   = COALESCE(d.content_creation, 0)   + v_content_inc,
           manual_flag        = d.manual_flag OR NEW.manual,
           updated_at         = now();

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_daily_log_rollup ON public.crm_daily_log_events;
CREATE TRIGGER trg_daily_log_rollup
    AFTER INSERT ON public.crm_daily_log_events
    FOR EACH ROW EXECUTE FUNCTION public.crm_daily_log_rollup();
-- ----------------------------------------------------------------------------
-- 3. Auto-capture trigger from crm_activities
-- ----------------------------------------------------------------------------
-- Every rep-initiated activity becomes an event row. We skip inbound calls
-- (they're not "rep output") and rows where created_by is null/system, to
-- match Round 3's "rep-initiated activity only" rule for Last Touched and
-- Performance Lag.

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_subtype text;
BEGIN
    IF NEW.created_by IS NULL OR NEW.created_by = '00000000-0000-0000-0000-000000000000'::uuid THEN
        RETURN NEW;
    END IF;
    -- Skip inbound-direction call rows so a rep doesn't "earn" a call for
    -- an answered inbound. The classifier still treats the row as
    -- lead_communication.
    IF NEW.call_type = 'inbound' THEN
        RETURN NEW;
    END IF;

    v_subtype := NULL;
    IF NEW.activity_type = 'call' AND NEW.call_outcome = 'callback_requested' THEN
        v_subtype := 'callback_requested';
    END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id,
        NEW.created_by,
        COALESCE(NEW.completed_at, NEW.created_at)::date,
        'crm_activities',
        NEW.id,
        public.crm_classify_log_section(NEW.activity_type, 'crm_activities'),
        NEW.activity_type,
        v_subtype,
        NEW.subject,
        jsonb_build_object(
            'call_outcome', NEW.call_outcome,
            'call_duration_seconds', NEW.call_duration_seconds,
            'lead_id', NEW.lead_id,
            'related_to_type', NEW.related_to_type,
            'related_to_id', NEW.related_to_id
        ),
        false,
        COALESCE(NEW.completed_at, NEW.created_at)
    );
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_dl_emit_from_activity ON public.crm_activities;
CREATE TRIGGER trg_dl_emit_from_activity
    AFTER INSERT ON public.crm_activities
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_activity();
-- ----------------------------------------------------------------------------
-- 4. Auto-capture trigger from crm_email_log
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_email_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Outbound only. Inbound logs are not rep output (engagement signals
    -- are handled by crm_register_engagement_signal).
    IF NEW.direction <> 'outbound' THEN RETURN NEW; END IF;
    IF NEW.sent_by IS NULL THEN RETURN NEW; END IF;
    IF NEW.status NOT IN ('sent', 'delivered', NULL) THEN RETURN NEW; END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id,
        NEW.sent_by,
        COALESCE(NEW.sent_at, NEW.created_at)::date,
        'crm_email_log',
        NEW.id,
        'lead_communication',
        'email',
        NULL,
        NEW.subject,
        jsonb_build_object(
            'lead_id', NEW.lead_id,
            'thread_id', NEW.thread_id,
            'template_id', NEW.template_id
        ),
        false,
        COALESCE(NEW.sent_at, NEW.created_at)
    );
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_dl_emit_from_email_log ON public.crm_email_log;
CREATE TRIGGER trg_dl_emit_from_email_log
    AFTER INSERT ON public.crm_email_log
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_email_log();
-- ----------------------------------------------------------------------------
-- 5. Auto-capture trigger from crm_special_projects
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_special_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id, NEW.user_id, NEW.log_date,
        'crm_special_projects', NEW.id,
        'special_projects', 'special_project', NULL,
        NEW.project_name,
        jsonb_build_object('time_minutes', NEW.time_minutes, 'notes', NEW.notes),
        true,                            -- special projects are manual entries
        now()
    );
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_dl_emit_from_special_project ON public.crm_special_projects;
CREATE TRIGGER trg_dl_emit_from_special_project
    AFTER INSERT ON public.crm_special_projects
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_special_project();
-- ----------------------------------------------------------------------------
-- 6. Performance Lag Alert state
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_performance_alert_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    window_start date NOT NULL,
    window_end date NOT NULL,
    rep_count integer NOT NULL,
    team_avg numeric(10,2) NOT NULL,
    top_performer_count integer NOT NULL,
    fired_at timestamptz NOT NULL DEFAULT now(),
    quiet_until timestamptz NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_perf_alert_user ON public.crm_performance_alert_log (user_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_alert_org ON public.crm_performance_alert_log (org_id, fired_at DESC);
ALTER TABLE public.crm_performance_alert_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS perf_alert_select ON public.crm_performance_alert_log;
DROP POLICY IF EXISTS perf_alert_service ON public.crm_performance_alert_log;
CREATE POLICY perf_alert_select ON public.crm_performance_alert_log
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY perf_alert_service ON public.crm_performance_alert_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.crm_performance_alert_log TO authenticated;
GRANT ALL ON public.crm_performance_alert_log TO service_role;
-- ----------------------------------------------------------------------------
-- 7. Performance Lag scan RPC
-- ----------------------------------------------------------------------------
-- Section 12 + Round 6: rolling 5-business-day window, team average baseline
-- excluding the rep being evaluated, fire when rep < 80% of team avg, quiet
-- period 7 days after last fire. 1 count per activity, no weighting.

CREATE OR REPLACE FUNCTION public.crm_scan_performance_lag(p_org_id uuid)
RETURNS TABLE (
    user_id uuid,
    window_start date,
    window_end date,
    rep_count integer,
    team_avg numeric,
    top_performer_count integer,
    alert_fired boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today date := current_date;
    v_window_end date := v_today;
    v_window_start date := v_today - 4;     -- 5-day inclusive window
    v_threshold numeric := 0.80;
    v_quiet_period interval := interval '7 days';
    rec record;
    v_rep_count int;
    v_team_avg numeric;
    v_top_count int;
    v_quiet_until timestamptz;
    v_should_fire boolean;
BEGIN
    FOR rec IN
        SELECT m.user_id
          FROM public.org_memberships m
         WHERE m.org_id = p_org_id
           AND m.status = 'active'
           AND m.role IN ('rep', 'admin', 'manager', 'owner', 'agent')
    LOOP
        -- Per-rep activity count over the window.
        SELECT COALESCE(SUM(1), 0) INTO v_rep_count
          FROM public.crm_daily_log_events e
         WHERE e.org_id = p_org_id
           AND e.user_id = rec.user_id
           AND e.log_date BETWEEN v_window_start AND v_window_end;

        -- Team average excluding this rep.
        SELECT COALESCE(AVG(cnt), 0) INTO v_team_avg
          FROM (
            SELECT COUNT(*) AS cnt
              FROM public.crm_daily_log_events e2
             WHERE e2.org_id = p_org_id
               AND e2.user_id <> rec.user_id
               AND e2.log_date BETWEEN v_window_start AND v_window_end
             GROUP BY e2.user_id
          ) sub;

        -- Top performer count over the window.
        SELECT COALESCE(MAX(cnt), 0) INTO v_top_count
          FROM (
            SELECT COUNT(*) AS cnt
              FROM public.crm_daily_log_events e3
             WHERE e3.org_id = p_org_id
               AND e3.log_date BETWEEN v_window_start AND v_window_end
             GROUP BY e3.user_id
          ) tops;

        v_should_fire := (v_team_avg > 0)
                         AND (v_rep_count::numeric < v_team_avg * v_threshold);

        IF v_should_fire THEN
            -- Honor 7-day quiet period after last fire.
            IF EXISTS (
                SELECT 1
                  FROM public.crm_performance_alert_log a
                 WHERE a.org_id = p_org_id
                   AND a.user_id = rec.user_id
                   AND a.quiet_until > now()
            ) THEN
                v_should_fire := false;
            ELSE
                v_quiet_until := now() + v_quiet_period;
                INSERT INTO public.crm_performance_alert_log (
                    org_id, user_id,
                    window_start, window_end,
                    rep_count, team_avg, top_performer_count,
                    fired_at, quiet_until, payload
                ) VALUES (
                    p_org_id, rec.user_id,
                    v_window_start, v_window_end,
                    v_rep_count, v_team_avg, v_top_count,
                    now(), v_quiet_until,
                    jsonb_build_object(
                        'threshold_pct', 80,
                        'window_days', 5,
                        'quiet_days', 7
                    )
                );
            END IF;
        END IF;

        user_id := rec.user_id;
        window_start := v_window_start;
        window_end := v_window_end;
        rep_count := v_rep_count;
        team_avg := v_team_avg;
        top_performer_count := v_top_count;
        alert_fired := v_should_fire;
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_scan_performance_lag(uuid) TO authenticated, service_role;
COMMIT;
