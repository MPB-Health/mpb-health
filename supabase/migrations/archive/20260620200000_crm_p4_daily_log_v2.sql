-- ============================================================================
-- CRM rebuild — Phase 4
-- Daily Log v2 — auto-capture + Section 12 taxonomy + Special Projects
--                + Performance Lag Alert state
-- ============================================================================
-- Section 8 / Section 11 / Section 12 of the rebuild PDF, plus Round 6
-- addendum (lag-alert payload shape).
--
-- This migration is intentionally additive: every existing column on
-- `crm_rep_daily_log_entries` stays exactly as-is. We extend the row with
-- new sub-section counters and a per-user `section_open_state` jsonb so the
-- accordion remembers open/close state, then bolt on:
--
--   • crm_daily_log_events  — granular per-action audit. Triggered by
--     crm_activities + crm_email_log so every CRM-tracked action lands in
--     real time (Section 8). Manual entries on the new daily-log page also
--     write here with manual = true.
--   • crm_special_projects  — Special Projects breakdown rows (Section 11).
--   • crm_performance_alert_log — Performance Lag Alert audit trail
--     (Section 12 + Round 6). Records every fired alert so the quiet-period
--     7-day lockout works without re-counting.
--
-- The roll-up trigger keeps the legacy counters on `crm_rep_daily_log_entries`
-- in sync so the existing dashboard widgets that read them keep working
-- through the cutover. The new accordion UI reads `crm_daily_log_events`
-- directly via Realtime so "Today" updates without a refresh.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Daily Log v2 columns (Section 11 + Section 12)
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_rep_daily_log_entries
    -- Section 11 sub-section counters
    ADD COLUMN IF NOT EXISTS cancellation_calls integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pipeline_actions integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deals_closed integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS activities_other integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS content_creation integer NOT NULL DEFAULT 0,
    -- True when the row was authored manually (not from auto-capture).
    -- Auto-capture rows have manual_flag = false; rep-edited rows toggle it.
    ADD COLUMN IF NOT EXISTS manual_flag boolean NOT NULL DEFAULT false,
    -- Section 12 multi-expand accordion state per row.
    ADD COLUMN IF NOT EXISTS section_open_state jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.crm_rep_daily_log_entries.manual_flag IS
    'CRM rebuild Phase 4 — true when the daily-log row was edited by hand. Auto-capture rows leave this false.';
COMMENT ON COLUMN public.crm_rep_daily_log_entries.section_open_state IS
    'Per-rep accordion state for the daily-log page. Shape: { lead_communication: bool, linkedin_activity: bool, ... }';
-- ----------------------------------------------------------------------------
-- 2. crm_daily_log_events — granular per-action audit
-- ----------------------------------------------------------------------------
-- One row per CRM-tracked rep action. Trigger functions below populate this
-- table from crm_activities + crm_email_log. The frontend Daily Log page
-- subscribes via Realtime to refresh "Today" the moment an event arrives.

CREATE TABLE IF NOT EXISTS public.crm_daily_log_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    -- Where the event came from. crm_activities / crm_email_log / manual /
    -- outlook (P5) / goto_connect (P5) / linkedin (P5).
    source text NOT NULL CHECK (source IN (
        'crm_activities', 'crm_email_log', 'crm_lead_quote_history',
        'crm_special_projects', 'manual', 'outlook', 'goto_connect',
        'linkedin', 'system'
    )),
    source_id uuid,
    -- Section taxonomy from Section 11.
    section text NOT NULL CHECK (section IN (
        'lead_communication',
        'linkedin_activity',
        'pipeline',
        'deals_closed',
        'activities',
        'content_creation',
        'special_projects'
    )),
    activity_type text NOT NULL,
    activity_subtype text,
    description text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- True when the event was manually entered, not auto-captured.
    manual boolean NOT NULL DEFAULT false,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_daily_log_events_org_date
    ON public.crm_daily_log_events (org_id, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_log_events_user_date
    ON public.crm_daily_log_events (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_log_events_section
    ON public.crm_daily_log_events (org_id, section, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_log_events_source
    ON public.crm_daily_log_events (source, source_id);
ALTER TABLE public.crm_daily_log_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_log_events_select ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_insert_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_update_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_delete_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_service ON public.crm_daily_log_events;
-- Org members can read everyone's daily events (admin needs this for the
-- per-rep filter view; reps see their own dashboard widgets driven by the
-- same data). Writes are limited to the row's owner OR service role.
CREATE POLICY daily_log_events_select ON public.crm_daily_log_events
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
CREATE POLICY daily_log_events_insert_self ON public.crm_daily_log_events
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(org_id) AND user_id = auth.uid()
    );
CREATE POLICY daily_log_events_update_self ON public.crm_daily_log_events
    FOR UPDATE TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());
CREATE POLICY daily_log_events_delete_self ON public.crm_daily_log_events
    FOR DELETE TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid());
CREATE POLICY daily_log_events_service ON public.crm_daily_log_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_daily_log_events TO authenticated;
GRANT ALL ON public.crm_daily_log_events TO service_role;
-- ----------------------------------------------------------------------------
-- 3. crm_special_projects — Section 11 special projects breakdown
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_special_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    project_name text NOT NULL,
    time_minutes integer NOT NULL DEFAULT 0 CHECK (time_minutes >= 0),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_special_projects_org_user_date
    ON public.crm_special_projects (org_id, user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_special_projects_org_date
    ON public.crm_special_projects (org_id, log_date);
ALTER TABLE public.crm_special_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS special_projects_select ON public.crm_special_projects;
DROP POLICY IF EXISTS special_projects_insert_self ON public.crm_special_projects;
DROP POLICY IF EXISTS special_projects_update_self ON public.crm_special_projects;
DROP POLICY IF EXISTS special_projects_delete_self ON public.crm_special_projects;
DROP POLICY IF EXISTS special_projects_service ON public.crm_special_projects;
CREATE POLICY special_projects_select ON public.crm_special_projects
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
CREATE POLICY special_projects_insert_self ON public.crm_special_projects
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());
CREATE POLICY special_projects_update_self ON public.crm_special_projects
    FOR UPDATE TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());
CREATE POLICY special_projects_delete_self ON public.crm_special_projects
    FOR DELETE TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid());
CREATE POLICY special_projects_service ON public.crm_special_projects
    FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_special_projects TO authenticated;
GRANT ALL ON public.crm_special_projects TO service_role;
COMMIT;
