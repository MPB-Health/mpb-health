-- ============================================================================
-- CRM rebuild — Phase 7 / Section 11 Round 6 (Daily Log accordion alignment)
-- ============================================================================
-- Spec ("11. Round 6 Adjustments — Daily Log Sections & Performance Alerts"):
--
-- Section order, top to bottom:
--   Lead Communication → LinkedIn Activity → Pipeline → Deals Closed →
--   Activities → Content Creation → Special Projects.
--
-- Section contents (strict reading):
--   • Lead Communication: Calls, Texts, Emails, Cancellation Calls.
--   • LinkedIn Activity: connection requests, messages, replies, profile
--     views, etc. (per Section 2 LinkedIn subsection statuses).
--   • Pipeline: stage advances, manual stage overrides, "Mark as Lost,"
--     transfers between subsections.
--   • Deals Closed: leads moved into Won → Enrolled for the day.
--   • Activities: rep actions not captured by the other sections
--     (catch-all).
--   • Content Creation: emails / templates created, LinkedIn posts.
--   • Special Projects: non-pipeline work with time capture.
--
-- This migration tightens the bucketing so the existing accordion
-- displays exactly the rows the spec calls for:
--
--   1. `crm_classify_log_section` rewritten so:
--        • meetings / tasks / demos / proposals / live_chat / referrals /
--          networking events / community outreach all route to
--          `'activities'` (Pipeline is reserved for actual stage moves);
--        • `mark_lost`, `stage_change`, `subsection_transfer`,
--          `profile_edit`, `crm_lead_entered` all route to `'pipeline'`;
--        • `linkedin_post` routes to `'content_creation'` (the act of
--          drafting/publishing the post) while the rest of the
--          `linkedin_*` events remain in `'linkedin_activity'`;
--        • `linkedin_reply`, `linkedin_profile_view` are recognised
--          explicitly per Section 2;
--        • `template_created`, `signature_created` route to
--          `'content_creation'`.
--
--   2. `crm_dl_emit_from_lead_profile_edit` extended to track
--        `pipeline_stage` so:
--        • a transition INTO `'lost'` emits `activity_type = 'mark_lost'`
--          carrying `metadata.previous_stage`;
--        • any other stage move emits `activity_type = 'stage_change'`
--          carrying `metadata.from / metadata.to`;
--        • `workflow_subsection` changes emit
--          `activity_type = 'subsection_transfer'` carrying
--          `metadata.from / metadata.to`;
--        • residual profile-only edits keep their old
--          `activity_type = 'profile_edit'` shape.
--
--   3. New triggers `crm_dl_emit_from_template_create`,
--      `crm_dl_emit_from_master_template_create`, and
--      `crm_dl_emit_from_signature_create` log Content Creation events
--      when a rep authors a template or signature.
--
-- Existing rows in `crm_daily_log_events` are reclassified opportunistically
-- so the accordion shows the right buckets immediately after deploy.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. crm_classify_log_section — strict bucketing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_classify_log_section(
    p_activity_type text,
    p_source text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
    -- LinkedIn Activity (Section 2 subsection statuses): connection
    -- requests, messages, replies, profile views, engagement.
    -- linkedin_post itself is the *act of creating content* and is
    -- bucketed under Content Creation per the spec, not LinkedIn
    -- Activity.
    IF p_activity_type IN (
        'linkedin_connection_sent',
        'linkedin_connection_accepted',
        'linkedin_message',
        'linkedin_reply',
        'linkedin_profile_view',
        'linkedin_engagement',
        'linkedin_short'
    ) THEN
        RETURN 'linkedin_activity';
    END IF;

    -- Lead Communication: calls, texts, emails, notes, cancellation
    -- calls (the cancellation flag rides on activity_subtype).
    IF p_activity_type IN ('call', 'email', 'sms', 'text', 'note') THEN
        RETURN 'lead_communication';
    END IF;

    -- Pipeline (strict): stage moves, manual stage overrides, Mark
    -- Lost, subsection transfers, lead entry, lead profile edits that
    -- mutate pipeline-relevant fields.
    IF p_activity_type IN (
        'stage_change',
        'stage_advance',
        'mark_lost',
        'subsection_transfer',
        'profile_edit',
        'crm_lead_entered'
    ) THEN
        RETURN 'pipeline';
    END IF;

    -- Deals Closed: leads moved into Won → Enrolled.
    IF p_activity_type IN ('quote_sent', 'enrollment_won', 'deals_closed', 'won') THEN
        RETURN 'deals_closed';
    END IF;

    -- Content Creation: drafting / publishing content. LinkedIn posts
    -- are creation acts and live here, not in LinkedIn Activity.
    IF p_activity_type IN (
        'content_creation',
        'content',
        'webinar',
        'social',
        'linkedin_post',
        'template_created',
        'signature_created',
        'master_template_created'
    ) THEN
        RETURN 'content_creation';
    END IF;

    -- Activities: catch-all for rep actions that aren't in the other
    -- buckets — meetings, tasks, demos, proposals, live chat,
    -- networking, community outreach, referrals.
    IF p_activity_type IN (
        'meeting',
        'task',
        'demo',
        'proposal_sent',
        'presentation',
        'live_chat',
        'networking_event',
        'community_outreach',
        'referral_requested'
    ) THEN
        RETURN 'activities';
    END IF;

    -- Special Projects come in via crm_special_projects regardless of
    -- activity_type.
    IF p_source = 'crm_special_projects' THEN
        RETURN 'special_projects';
    END IF;

    -- Default to 'activities' so nothing gets dropped silently.
    RETURN 'activities';
END;
$function$;

COMMENT ON FUNCTION public.crm_classify_log_section(text, text) IS
    'Section 11 / Round 6: strict-spec bucketing of rep activity into '
    'the seven Daily Log accordion sections. Pipeline is reserved for '
    'actual stage moves; meetings/tasks/demos go to Activities; '
    'linkedin_post lives in Content Creation per spec.';

-- ---------------------------------------------------------------------------
-- 2. Lead profile edit trigger — emit stage_change / mark_lost /
--    subsection_transfer events distinctly so the Pipeline section shows
--    them with the right semantics.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_lead_profile_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user uuid := auth.uid();
    v_changes jsonb := '{}'::jsonb;
    v_lead_label text;
    v_stage_changed boolean := false;
    v_subsection_changed boolean := false;
    v_other_changed boolean := false;
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
    IF v_user IS NULL THEN RETURN NEW; END IF;

    v_lead_label := COALESCE(
        NULLIF(trim(both ' ' FROM COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''),
        'Lead'
    );

    -- Pipeline-relevant diffs first
    IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
        v_stage_changed := true;
    END IF;
    IF NEW.workflow_subsection IS DISTINCT FROM OLD.workflow_subsection THEN
        v_subsection_changed := true;
    END IF;

    -- Profile diffs (catch-all)
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
        v_changes := v_changes || jsonb_build_object('first_name', jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name));
        v_other_changed := true;
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
        v_changes := v_changes || jsonb_build_object('last_name', jsonb_build_object('old', OLD.last_name, 'new', NEW.last_name));
        v_other_changed := true;
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        v_changes := v_changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
        v_other_changed := true;
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
        v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
        v_other_changed := true;
    END IF;
    IF NEW.do_not_contact IS DISTINCT FROM OLD.do_not_contact THEN
        v_changes := v_changes || jsonb_build_object('do_not_contact', jsonb_build_object('old', OLD.do_not_contact, 'new', NEW.do_not_contact));
        v_other_changed := true;
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
        v_changes := v_changes || jsonb_build_object('assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to));
        v_other_changed := true;
    END IF;
    IF NEW.lead_source IS DISTINCT FROM OLD.lead_source THEN
        v_changes := v_changes || jsonb_build_object('lead_source', jsonb_build_object('old', OLD.lead_source, 'new', NEW.lead_source));
        v_other_changed := true;
    END IF;
    IF NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN
        v_changes := v_changes || jsonb_build_object('plan_type', jsonb_build_object('old', OLD.plan_type, 'new', NEW.plan_type));
        v_other_changed := true;
    END IF;

    -- Pipeline event #1: stage transitions. Mark Lost = transition into 'lost'.
    IF v_stage_changed THEN
        IF NEW.pipeline_stage = 'lost' THEN
            INSERT INTO public.crm_daily_log_events (
                org_id, user_id, log_date, source, source_id,
                section, activity_type, activity_subtype,
                description, metadata, manual, occurred_at
            ) VALUES (
                NEW.org_id, v_user, current_date, 'crm_activities', NEW.id,
                'pipeline', 'mark_lost', OLD.pipeline_stage,
                v_lead_label || ' marked Lost',
                jsonb_build_object('lead_id', NEW.id, 'previous_stage', OLD.pipeline_stage),
                false, now()
            );
        ELSE
            INSERT INTO public.crm_daily_log_events (
                org_id, user_id, log_date, source, source_id,
                section, activity_type, activity_subtype,
                description, metadata, manual, occurred_at
            ) VALUES (
                NEW.org_id, v_user, current_date, 'crm_activities', NEW.id,
                'pipeline', 'stage_change', NEW.pipeline_stage,
                v_lead_label || ' stage: ' || COALESCE(OLD.pipeline_stage, 'none') || ' → ' || NEW.pipeline_stage,
                jsonb_build_object('lead_id', NEW.id, 'from', OLD.pipeline_stage, 'to', NEW.pipeline_stage),
                false, now()
            );
        END IF;
    END IF;

    -- Pipeline event #2: subsection transfers (Working ↔ Nurture ↔ LinkedIn ↔ DNC).
    IF v_subsection_changed THEN
        INSERT INTO public.crm_daily_log_events (
            org_id, user_id, log_date, source, source_id,
            section, activity_type, activity_subtype,
            description, metadata, manual, occurred_at
        ) VALUES (
            NEW.org_id, v_user, current_date, 'crm_activities', NEW.id,
            'pipeline', 'subsection_transfer', NEW.workflow_subsection,
            v_lead_label || ' moved: ' || COALESCE(OLD.workflow_subsection, 'none') || ' → ' || NEW.workflow_subsection,
            jsonb_build_object(
                'lead_id', NEW.id,
                'from', OLD.workflow_subsection,
                'to', NEW.workflow_subsection
            ),
            false, now()
        );
    END IF;

    -- Profile-only catch-all diff (still bucketed to pipeline; the spec
    -- defines Pipeline broadly enough to cover lead-profile edits that
    -- aren't stage / subsection moves).
    IF v_other_changed THEN
        INSERT INTO public.crm_daily_log_events (
            org_id, user_id, log_date, source, source_id,
            section, activity_type, activity_subtype,
            description, metadata, manual, occurred_at
        ) VALUES (
            NEW.org_id, v_user, current_date, 'crm_activities', NEW.id,
            'pipeline', 'profile_edit', NULL,
            v_lead_label || ' profile updated',
            jsonb_build_object('lead_id', NEW.id, 'changes', v_changes),
            false, now()
        );
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.crm_dl_emit_from_lead_profile_edit() IS
    'Section 11 / Round 6: emits dedicated Pipeline events for stage '
    'changes (incl. mark_lost), subsection transfers, and residual '
    'profile edits so the Daily Log accordion shows them with the '
    'correct semantics.';

-- ---------------------------------------------------------------------------
-- 3. Content Creation triggers — log a Daily Log event when a rep
--    authors a template (per-rep or master) or a signature.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_template_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NEW.created_by IS NULL THEN
        RETURN NEW;
    END IF;
    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id, NEW.created_by, current_date, TG_TABLE_NAME, NEW.id,
        'content_creation',
        CASE WHEN TG_TABLE_NAME = 'crm_master_templates'
             THEN 'master_template_created'
             ELSE 'template_created' END,
        NEW.channel,
        COALESCE(NEW.name, 'Template') || ' (' || COALESCE(NEW.channel, 'email') || ')',
        jsonb_build_object('template_id', NEW.id, 'channel', NEW.channel),
        false, COALESCE(NEW.created_at, now())
    );
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_dl_emit_from_template_create ON public.crm_templates;
CREATE TRIGGER trg_dl_emit_from_template_create
    AFTER INSERT ON public.crm_templates
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_template_create();

DROP TRIGGER IF EXISTS trg_dl_emit_from_master_template_create ON public.crm_master_templates;
CREATE TRIGGER trg_dl_emit_from_master_template_create
    AFTER INSERT ON public.crm_master_templates
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_template_create();

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_signature_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user uuid;
    v_org uuid;
BEGIN
    -- crm_email_signatures may key by user_id or rep_id; pick whichever
    -- column is present in the row. Same for org_id.
    BEGIN
        v_user := NEW.user_id;
    EXCEPTION WHEN undefined_column THEN
        BEGIN
            v_user := NEW.rep_id;
        EXCEPTION WHEN undefined_column THEN
            v_user := NULL;
        END;
    END;
    BEGIN
        v_org := NEW.org_id;
    EXCEPTION WHEN undefined_column THEN
        v_org := NULL;
    END;
    IF v_user IS NULL OR v_org IS NULL THEN RETURN NEW; END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        v_org, v_user, current_date, 'crm_email_signatures', NEW.id,
        'content_creation', 'signature_created', NULL,
        'Email signature created',
        jsonb_build_object('signature_id', NEW.id),
        false, now()
    );
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_dl_emit_from_signature_create ON public.crm_email_signatures;
CREATE TRIGGER trg_dl_emit_from_signature_create
    AFTER INSERT ON public.crm_email_signatures
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_signature_create();

-- ---------------------------------------------------------------------------
-- 4. Reclassify existing rows so the accordion buckets are correct
--    immediately after deploy.
-- ---------------------------------------------------------------------------

UPDATE public.crm_daily_log_events
   SET section = public.crm_classify_log_section(activity_type, source)
 WHERE section IS DISTINCT FROM public.crm_classify_log_section(activity_type, source);

COMMIT;
