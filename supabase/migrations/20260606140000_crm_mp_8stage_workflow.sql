-- ============================================================================
-- CRM MP 8-stage pipeline + workflow subsections (spec: Changes to the CRM.docx)
--   • Normalize crm_pipeline_stages + map legacy lead_submissions.pipeline_stage
--   • workflow_subsection, LinkedIn workflow, automation timestamps, DNC flag
--   • crm_lead_quote_history, crm_lead_time_entries, crm_rep_message_templates
--   • crm_rep_daily_log_entries, crm_oe_reactivation_runs
--   • Triggers: subsection routing, new→working on assign, stage timestamps
--   • RPCs: quote sent, engagement, opt-out, enroll won, opt-out text check
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Pipeline stages: allow per-org names (drop unsafe global unique on name)
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_pipeline_stages
    DROP CONSTRAINT IF EXISTS crm_pipeline_stages_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_pipeline_stages_org_name
    ON public.crm_pipeline_stages (org_id, name)
    WHERE org_id IS NOT NULL;
-- ----------------------------------------------------------------------------
-- 2. Per-org 8-stage pipeline: deactivate legacy rows, insert canonical set
-- ----------------------------------------------------------------------------

UPDATE public.crm_pipeline_stages
SET is_active = false, updated_at = now()
WHERE name IN ('contacted', 'proposal', 'qualified', 'negotiation')
   OR name NOT IN (
    'new', 'working', 'quoted', 'engaged', 'application_in_progress',
    'won', 'nurture', 'lost'
    );
-- Align sort_order / labels on any pre-existing canonical rows
UPDATE public.crm_pipeline_stages SET display_name = 'New', sort_order = 1,
    is_won_stage = false, is_lost_stage = false, is_active = true, updated_at = now() WHERE name = 'new';
UPDATE public.crm_pipeline_stages SET display_name = 'Won — Enrolled', sort_order = 6,
    is_won_stage = true, is_lost_stage = false, is_active = true, updated_at = now() WHERE name = 'won';
UPDATE public.crm_pipeline_stages SET display_name = 'Lost', sort_order = 8,
    is_won_stage = false, is_lost_stage = true, is_active = true, updated_at = now() WHERE name = 'lost';
INSERT INTO public.crm_pipeline_stages (
    org_id, name, display_name, color, sort_order, is_active, is_won_stage, is_lost_stage
)
SELECT o.id, v.name, v.display_name, v.color, v.sort_order, true, v.is_won, v.is_lost
FROM public.orgs o
CROSS JOIN (
    VALUES
        ('new', 'New', '#3B82F6', 1, false, false),
        ('working', 'Working', '#6366F1', 2, false, false),
        ('quoted', 'Quoted', '#8B5CF6', 3, false, false),
        ('engaged', 'Engaged / Qualifying', '#10B981', 4, false, false),
        ('application_in_progress', 'Application in Progress', '#F59E0B', 5, false, false),
        ('won', 'Won — Enrolled', '#22C55E', 6, true, false),
        ('nurture', 'Nurture', '#64748B', 7, false, false),
        ('lost', 'Lost', '#EF4444', 8, false, true)
) AS v(name, display_name, color, sort_order, is_won, is_lost)
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_pipeline_stages ps
    WHERE ps.org_id IS NOT DISTINCT FROM o.id AND ps.name = v.name
);
-- ----------------------------------------------------------------------------
-- 3. lead_submissions: workflow + automation columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_submissions
    ADD COLUMN IF NOT EXISTS workflow_subsection text
        CHECK (workflow_subsection IS NULL OR workflow_subsection IN (
            'working', 'nurture', 'linkedin', 'do_not_contact'
        )),
    ADD COLUMN IF NOT EXISTS linkedin_workflow_status text,
    ADD COLUMN IF NOT EXISTS do_not_contact boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS preliminary_quote_sent_at timestamptz,
    ADD COLUMN IF NOT EXISTS quote_cadence_started_at timestamptz,
    ADD COLUMN IF NOT EXISTS engagement_detected_at timestamptz,
    ADD COLUMN IF NOT EXISTS concierge_handoff_at timestamptz,
    ADD COLUMN IF NOT EXISTS last_opt_out_signal_at timestamptz,
    ADD COLUMN IF NOT EXISTS enrollment_approved_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_lead_submissions_workflow_subsection
    ON public.lead_submissions (org_id, workflow_subsection)
    WHERE workflow_subsection IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_submissions_dnc
             ON public.lead_submissions (org_id)
             WHERE do_not_contact = true;
COMMENT ON COLUMN public.lead_submissions.workflow_subsection IS
    'Leads module subsection: working | nurture | linkedin | do_not_contact';
COMMENT ON COLUMN public.lead_submissions.linkedin_workflow_status IS
    'Manual LinkedIn funnel status (Connection Sent, Connected, etc.)';
-- ----------------------------------------------------------------------------
-- 4. Map existing lead pipeline_stage values → 8-stage slugs
-- ----------------------------------------------------------------------------

UPDATE public.lead_submissions
SET pipeline_stage = CASE pipeline_stage
        WHEN 'contacted' THEN 'working'
        WHEN 'proposal' THEN 'quoted'
        WHEN 'qualified' THEN 'engaged'
        WHEN 'negotiation' THEN 'application_in_progress'
        WHEN 'converted' THEN 'won'
        WHEN 'closed_won' THEN 'won'
        WHEN 'closed_lost' THEN 'lost'
        WHEN 'enrolled' THEN 'won'
        ELSE pipeline_stage
    END,
    workflow_subsection = CASE
        WHEN pipeline_stage IN ('lost', 'closed_lost') THEN 'do_not_contact'
        WHEN pipeline_stage = 'nurture' THEN 'nurture'
        WHEN do_not_contact THEN 'do_not_contact'
        WHEN lead_source = 'linkedin' AND workflow_subsection IS NULL THEN 'linkedin'
        ELSE COALESCE(workflow_subsection, 'working')
    END,
    do_not_contact = CASE
        WHEN pipeline_stage IN ('lost', 'closed_lost') THEN true
        ELSE COALESCE(do_not_contact, false)
    END,
    updated_at = now()
WHERE pipeline_stage IS NOT NULL;
-- ----------------------------------------------------------------------------
-- 5. Quote history
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_lead_quote_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.lead_submissions(id) ON DELETE CASCADE,
    plan_name text NOT NULL,
    plan_structure text,
    monthly_price numeric(12, 2),
    quote_date date NOT NULL DEFAULT CURRENT_DATE,
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_lead_quote_history_lead
    ON public.crm_lead_quote_history (lead_id, quote_date DESC);
ALTER TABLE public.crm_lead_quote_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_lead_quote_history_select ON public.crm_lead_quote_history;
CREATE POLICY crm_lead_quote_history_select ON public.crm_lead_quote_history
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_lead_quote_history_insert ON public.crm_lead_quote_history;
CREATE POLICY crm_lead_quote_history_insert ON public.crm_lead_quote_history
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_lead_quote_history_update ON public.crm_lead_quote_history;
CREATE POLICY crm_lead_quote_history_update ON public.crm_lead_quote_history
    FOR UPDATE TO authenticated
    USING (public.is_org_member(org_id))
    WITH CHECK (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_lead_quote_history_delete ON public.crm_lead_quote_history;
CREATE POLICY crm_lead_quote_history_delete ON public.crm_lead_quote_history
    FOR DELETE TO authenticated
    USING (public.is_org_member(org_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_lead_quote_history TO authenticated;
GRANT ALL ON public.crm_lead_quote_history TO service_role;
-- ----------------------------------------------------------------------------
-- 6. Time entries (auto + manual)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_lead_time_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.lead_submissions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    source text NOT NULL CHECK (source IN ('manual', 'call', 'email', 'profile', 'activity', 'integration')),
    duration_seconds integer NOT NULL CHECK (duration_seconds >= 0),
    description text,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_lead_time_entries_lead
    ON public.crm_lead_time_entries (lead_id, occurred_at DESC);
ALTER TABLE public.crm_lead_time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_lead_time_entries_select ON public.crm_lead_time_entries;
CREATE POLICY crm_lead_time_entries_select ON public.crm_lead_time_entries
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_lead_time_entries_insert ON public.crm_lead_time_entries;
CREATE POLICY crm_lead_time_entries_insert ON public.crm_lead_time_entries
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_lead_time_entries_delete ON public.crm_lead_time_entries;
CREATE POLICY crm_lead_time_entries_delete ON public.crm_lead_time_entries
    FOR DELETE TO authenticated
    USING (public.is_org_member(org_id));
GRANT SELECT, INSERT, DELETE ON public.crm_lead_time_entries TO authenticated;
GRANT ALL ON public.crm_lead_time_entries TO service_role;
-- ----------------------------------------------------------------------------
-- 7. Per-rep message templates (email / phone script / SMS)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_rep_message_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel text NOT NULL CHECK (channel IN ('email', 'phone_script', 'sms')),
    name text NOT NULL,
    body text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_rep_templates_org_user
    ON public.crm_rep_message_templates (org_id, user_id, channel);
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_rep_templates_name
    ON public.crm_rep_message_templates (org_id, user_id, channel, name);
ALTER TABLE public.crm_rep_message_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_rep_templates_select ON public.crm_rep_message_templates;
CREATE POLICY crm_rep_templates_select ON public.crm_rep_message_templates
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_rep_templates_mutate ON public.crm_rep_message_templates;
CREATE POLICY crm_rep_templates_mutate ON public.crm_rep_message_templates
    FOR ALL TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_rep_message_templates TO authenticated;
GRANT ALL ON public.crm_rep_message_templates TO service_role;
-- ----------------------------------------------------------------------------
-- 8. Daily log (rep activity journal)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_rep_daily_log_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    calls_made integer DEFAULT 0,
    emails_sent integer DEFAULT 0,
    linkedin_touches integer DEFAULT 0,
    meetings_held integer DEFAULT 0,
    leads_worked integer DEFAULT 0,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, user_id, log_date)
);
ALTER TABLE public.crm_rep_daily_log_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_rep_daily_log_select ON public.crm_rep_daily_log_entries;
CREATE POLICY crm_rep_daily_log_select ON public.crm_rep_daily_log_entries
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
DROP POLICY IF EXISTS crm_rep_daily_log_mutate ON public.crm_rep_daily_log_entries;
CREATE POLICY crm_rep_daily_log_mutate ON public.crm_rep_daily_log_entries
    FOR ALL TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_rep_daily_log_entries TO authenticated;
GRANT ALL ON public.crm_rep_daily_log_entries TO service_role;
-- ----------------------------------------------------------------------------
-- 9. OE Reactivation run log (Sep 15 bulk job metadata)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_oe_reactivation_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    run_year integer NOT NULL,
    scheduled_for date NOT NULL,
    started_at timestamptz,
    completed_at timestamptz,
    leads_targeted integer DEFAULT 0,
    cadence_id uuid REFERENCES public.crm_follow_up_cadences(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, run_year)
);
ALTER TABLE public.crm_oe_reactivation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_oe_reactivation_runs_all ON public.crm_oe_reactivation_runs;
CREATE POLICY crm_oe_reactivation_runs_all ON public.crm_oe_reactivation_runs
    FOR ALL TO authenticated
    USING (public.is_org_member(org_id))
    WITH CHECK (public.is_org_member(org_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_oe_reactivation_runs TO authenticated;
GRANT ALL ON public.crm_oe_reactivation_runs TO service_role;
-- ----------------------------------------------------------------------------
-- 10. Integration connection placeholders (credentials via app settings / vault)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_integration_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('microsoft_outlook', 'goto_connect', 'linkedin')),
    status text NOT NULL DEFAULT 'disconnected' CHECK (
        status IN ('disconnected', 'connected', 'error')
    ),
    external_user_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, user_id, provider)
);
ALTER TABLE public.crm_integration_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_integration_accounts_mutate ON public.crm_integration_accounts;
CREATE POLICY crm_integration_accounts_mutate ON public.crm_integration_accounts
    FOR ALL TO authenticated
    USING (
        public.is_org_member(org_id)
        AND (user_id IS NULL OR user_id = auth.uid())
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND (user_id IS NULL OR user_id = auth.uid())
    );
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_integration_accounts TO authenticated;
GRANT ALL ON public.crm_integration_accounts TO service_role;
-- ----------------------------------------------------------------------------
-- 11. Stage → subsection sync + DNC defaults
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_workflow_subsection_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.workflow_subsection IS NULL THEN
            NEW.workflow_subsection := CASE
                WHEN NEW.lead_source = 'linkedin' THEN 'linkedin'
                ELSE 'working'
            END;
        END IF;
    END IF;

    IF NEW.pipeline_stage = 'nurture' THEN
        NEW.workflow_subsection := 'nurture';
        NEW.do_not_contact := false;
    ELSIF NEW.pipeline_stage = 'lost' THEN
        NEW.workflow_subsection := 'do_not_contact';
        NEW.do_not_contact := true;
    END IF;

    IF TG_OP = 'UPDATE'
       AND NEW.pipeline_stage = 'won'
       AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
        NEW.concierge_handoff_at := COALESCE(NEW.concierge_handoff_at, now());
    END IF;

    IF NEW.do_not_contact AND NEW.pipeline_stage <> 'lost' THEN
        NEW.pipeline_stage := 'lost';
        NEW.workflow_subsection := 'do_not_contact';
    END IF;

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_workflow_subsection_sync ON public.lead_submissions;
DROP TRIGGER IF EXISTS trg_lead_submissions_workflow_subsection_sync ON public.lead_submissions;
CREATE TRIGGER trg_lead_submissions_workflow_subsection_sync
    BEFORE INSERT OR UPDATE OF pipeline_stage, do_not_contact, lead_source, workflow_subsection
    ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_workflow_subsection_sync();
-- ----------------------------------------------------------------------------
-- 12. Assignment → New to Working (runs after RR fills assigned_to)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_assignment_stage_promote()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL
       AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
       AND COALESCE(NEW.pipeline_stage, 'new') IN ('new', '') THEN
        NEW.pipeline_stage := 'working';
        NEW.stage_changed_at := now();
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_assignment_stage_promote_ins ON public.lead_submissions;
DROP TRIGGER IF EXISTS trg_lead_assignment_stage_promote_upd ON public.lead_submissions;
CREATE TRIGGER trg_lead_assignment_stage_promote_upd
    BEFORE UPDATE OF assigned_to ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_assignment_stage_promote();
-- ----------------------------------------------------------------------------
-- 13. Quoted stage timestamps
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_stage_quote_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.pipeline_stage = 'quoted'
       AND (OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage) THEN
        NEW.preliminary_quote_sent_at := COALESCE(NEW.preliminary_quote_sent_at, now());
        NEW.quote_cadence_started_at := COALESCE(NEW.quote_cadence_started_at, now());
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_stage_quote_ts ON public.lead_submissions;
CREATE TRIGGER trg_lead_stage_quote_ts
    BEFORE UPDATE OF pipeline_stage ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_stage_quote_timestamps();
-- ----------------------------------------------------------------------------
-- 14. Opt-out keyword detector (subset — expand in app config / follow-up migration)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_detect_opt_out_keywords(p_body text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_norm text;
BEGIN
    IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
        RETURN false;
    END IF;
    v_norm := lower(p_body);
    IF v_norm ~ '(stop|unsubscribe|remove me|do not contact|don''t contact|opt\s*out|cease\s*contact)' THEN
        RETURN true;
    END IF;
    IF v_norm ~ '\b(no\s*thank\s*you|not\s*interested|leave\s*me\s*alone)\b' THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_detect_opt_out_keywords(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_detect_opt_out_keywords(text) TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_detect_opt_out_keywords IS
    'Returns true when inbound text matches spec opt-out / DNC phrases (review at 60 days).';
-- ----------------------------------------------------------------------------
-- 15. RPCs for automation hooks (callable from Edge Functions + app)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_mark_preliminary_quote_sent(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
BEGIN
    SELECT org_id INTO v_org FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org IS NULL OR NOT public.is_org_member(v_org) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    UPDATE public.lead_submissions
    SET
        preliminary_quote_sent_at = now(),
        quote_cadence_started_at = COALESCE(quote_cadence_started_at, now()),
        pipeline_stage = CASE
            WHEN pipeline_stage IN ('new', 'working') THEN 'quoted'
            ELSE pipeline_stage
        END,
        stage_changed_at = CASE
            WHEN pipeline_stage IN ('new', 'working') THEN now()
            ELSE stage_changed_at
        END,
        updated_at = now()
    WHERE id = p_lead_id;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_mark_preliminary_quote_sent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_mark_preliminary_quote_sent(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.crm_record_lead_engagement(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
BEGIN
    SELECT org_id INTO v_org FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org IS NULL OR NOT public.is_org_member(v_org) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    UPDATE public.lead_submissions
    SET
        engagement_detected_at = now(),
        last_contacted_at = COALESCE(last_contacted_at, now()),
        pipeline_stage = CASE
            WHEN pipeline_stage = 'quoted' THEN 'engaged'
            ELSE pipeline_stage
        END,
        stage_changed_at = CASE
            WHEN pipeline_stage = 'quoted' THEN now()
            ELSE stage_changed_at
        END,
        updated_at = now()
    WHERE id = p_lead_id;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_record_lead_engagement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_record_lead_engagement(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.crm_apply_lead_opt_out(
    p_lead_id uuid,
    p_reason text DEFAULT 'opt_out_signal'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
BEGIN
    SELECT org_id INTO v_org FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org IS NULL OR NOT public.is_org_member(v_org) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    UPDATE public.lead_submissions
    SET
        pipeline_stage = 'lost',
        lost_reason = COALESCE(p_reason, lost_reason),
        do_not_contact = true,
        workflow_subsection = 'do_not_contact',
        last_opt_out_signal_at = now(),
        updated_at = now()
    WHERE id = p_lead_id;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_apply_lead_opt_out(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_apply_lead_opt_out(uuid, text) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.crm_apply_enrollment_won(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
BEGIN
    SELECT org_id INTO v_org FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org IS NULL OR NOT public.is_org_member(v_org) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    UPDATE public.lead_submissions
    SET
        pipeline_stage = 'won',
        enrollment_approved_at = now(),
        converted_at = COALESCE(converted_at, now()),
        concierge_handoff_at = COALESCE(concierge_handoff_at, now()),
        stage_changed_at = now(),
        updated_at = now()
    WHERE id = p_lead_id;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_apply_enrollment_won(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_apply_enrollment_won(uuid) TO authenticated, service_role;
-- Day-30 nurture promotion (quoted/engaged, no engagement, cadence window elapsed)
CREATE OR REPLACE FUNCTION public.crm_promote_stale_quotes_to_nurture(
    p_org_id uuid,
    p_stale_after interval DEFAULT interval '30 days'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.orgs WHERE id = p_org_id) THEN
        RAISE EXCEPTION 'invalid_org';
    END IF;

    WITH c AS (
        UPDATE public.lead_submissions ls
        SET
            pipeline_stage = 'nurture',
            workflow_subsection = 'nurture',
            stage_changed_at = now(),
            updated_at = now()
        WHERE ls.org_id = p_org_id
          AND ls.pipeline_stage IN ('quoted', 'engaged')
          AND ls.engagement_detected_at IS NULL
          AND ls.do_not_contact IS NOT TRUE
          AND ls.quote_cadence_started_at IS NOT NULL
          AND ls.quote_cadence_started_at <= now() - p_stale_after
        RETURNING 1
    )
    SELECT COUNT(*)::int INTO v_count FROM c;

    RETURN COALESCE(v_count, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.crm_promote_stale_quotes_to_nurture(uuid, interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_promote_stale_quotes_to_nurture(uuid, interval) TO service_role;
-- ----------------------------------------------------------------------------
-- 16. Seed Quote-Response + OE Reactivation cadence shells (per org, idempotent)
-- ----------------------------------------------------------------------------

INSERT INTO public.crm_follow_up_cadences (
    org_id, pipeline_stage_id, name, steps, is_default, is_active, created_at, updated_at
)
SELECT
    o.id,
    NULL::uuid,
    'Quote Response — 5-touch (Email)',
    jsonb_build_array(
        jsonb_build_object('step', 1, 'delay_hours', 0, 'channel', 'email', 'label', 'Email #1 preliminary quote'),
        jsonb_build_object('step', 2, 'delay_hours', 72, 'channel', 'email', 'label', 'Touch 2'),
        jsonb_build_object('step', 3, 'delay_hours', 168, 'channel', 'email', 'label', 'Touch 3'),
        jsonb_build_object('step', 4, 'delay_hours', 240, 'channel', 'email', 'label', 'Touch 4'),
        jsonb_build_object('step', 5, 'delay_hours', 720, 'channel', 'email', 'label', 'Touch 5 (Day 30)')
    ),
    false,
    true,
    now(),
    now()
FROM public.orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_follow_up_cadences c
    WHERE c.org_id = o.id AND c.name = 'Quote Response — 5-touch (Email)'
);
INSERT INTO public.crm_follow_up_cadences (
    org_id, pipeline_stage_id, name, steps, is_default, is_active, created_at, updated_at
)
SELECT
    o.id,
    NULL::uuid,
    'OE Reactivation — Nurture bulk',
    jsonb_build_array(
        jsonb_build_object('step', 1, 'delay_hours', 0, 'channel', 'email', 'label', 'OE kickoff email'),
        jsonb_build_object('step', 2, 'delay_hours', 120, 'channel', 'call', 'label', 'Follow-up call task')
    ),
    false,
    true,
    now(),
    now()
FROM public.orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_follow_up_cadences c
    WHERE c.org_id = o.id AND c.name = 'OE Reactivation — Nurture bulk'
);
-- ----------------------------------------------------------------------------
-- 17. Insert automation: promote New → Working after round-robin assignment
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_after_insert_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rr            RECORD;
    v_sla           RECORD;
    v_cad           RECORD;
    v_pool          jsonb;
    v_pool_len      int;
    v_pos           int;
    v_candidate     jsonb;
    v_attempts      int := 0;
    v_was_skip      boolean := false;
    v_chosen_id     uuid := NULL;
    v_new_pos       int := -1;
    v_deadline      timestamptz;
    v_task_id       uuid;
    v_step          jsonb;
    v_delay_hours   numeric;
BEGIN
    IF NEW.assigned_to IS NULL AND NEW.org_id IS NOT NULL THEN
        SELECT * INTO v_rr
        FROM public.crm_round_robin_config
        WHERE org_id = NEW.org_id AND is_active = true
        LIMIT 1;

        IF FOUND THEN
            v_pool := v_rr.pool_members;
            v_pool_len := COALESCE(jsonb_array_length(v_pool), 0);

            IF v_pool_len > 0 THEN
                v_pos := COALESCE(v_rr.current_position, -1);
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

                IF v_chosen_id IS NOT NULL THEN
                    NEW.assigned_to := v_chosen_id;

                    UPDATE public.crm_round_robin_config
                       SET current_position = v_new_pos
                     WHERE id = v_rr.id;

                    INSERT INTO public.crm_round_robin_audit
                        (org_id, lead_id, assigned_to, position_at_assignment, was_skip)
                    VALUES
                        (NEW.org_id, NEW.id, v_chosen_id, v_new_pos, v_was_skip);
                END IF;
            END IF;
        END IF;
    END IF;

    SELECT * INTO v_sla
    FROM public.crm_sla_config
    WHERE org_id = NEW.org_id AND is_active = true
    LIMIT 1;

    IF FOUND THEN
        v_deadline := public.crm_calc_business_hour_deadline(
            NEW.created_at,
            v_sla.sla_hours,
            v_sla.business_hours_start,
            v_sla.business_hours_end,
            v_sla.business_days,
            v_sla.timezone
        );

        INSERT INTO public.lead_tasks (
            lead_id, title, description, task_type, due_date, priority,
            assigned_to, completed, created_by
        ) VALUES (
            NEW.id,
            'Initial Contact — ' || TRIM(COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.last_name,'')),
            'SLA: Make initial contact within ' || v_sla.sla_hours || ' business hours.',
            'call',
            v_deadline,
            'high',
            NEW.assigned_to,
            false,
            NEW.assigned_to
        )
        RETURNING id INTO v_task_id;

        NEW.next_followup_at := v_deadline;
    END IF;

    SELECT * INTO v_cad
    FROM public.crm_follow_up_cadences
    WHERE org_id = NEW.org_id AND is_default = true AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND AND jsonb_array_length(v_cad.steps) > 0 THEN
        v_step := v_cad.steps -> 0;
        v_delay_hours := COALESCE((v_step ->> 'delay_hours')::numeric, 24);

        INSERT INTO public.crm_lead_cadence_state (
            lead_id, cadence_id, org_id, current_step,
            next_action_at, paused, paused_reason, completed_at
        ) VALUES (
            NEW.id, v_cad.id, NEW.org_id, 0,
            NEW.created_at + (v_delay_hours || ' hours')::interval,
            false, NULL, NULL
        )
        ON CONFLICT (lead_id, cadence_id) DO NOTHING;
    END IF;

    -- MP 8-stage: assignment (incl. round-robin) ⇒ move out of New bucket
    IF NEW.assigned_to IS NOT NULL
       AND COALESCE(NEW.pipeline_stage, 'new') IN ('new', '') THEN
        NEW.pipeline_stage := 'working';
        NEW.stage_changed_at := COALESCE(NEW.stage_changed_at, now());
    END IF;

    RETURN NEW;
END;
$$;
-- ----------------------------------------------------------------------------
-- 18. Cadence auto-pause: existing trigger covers won/lost only (not nurture)
-- ----------------------------------------------------------------------------

COMMIT;
