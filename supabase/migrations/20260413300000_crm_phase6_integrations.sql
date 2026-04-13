-- ============================================================================
-- Migration: CRM Phase 6 - Integrations & Polish
-- Description: LinkedIn config, Email A/B testing, automation CHECK fixes
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: LINKEDIN CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_linkedin_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    is_active boolean NOT NULL DEFAULT false,
    weekly_content_target jsonb NOT NULL DEFAULT '{"original_posts": 2, "shared_posts": 2, "shorts": 2}',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(org_id)
);

ALTER TABLE public.crm_linkedin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_linkedin_config_select ON public.crm_linkedin_config;
CREATE POLICY crm_linkedin_config_select ON public.crm_linkedin_config
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_linkedin_config_insert ON public.crm_linkedin_config;
CREATE POLICY crm_linkedin_config_insert ON public.crm_linkedin_config
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'settings.manage'));

DROP POLICY IF EXISTS crm_linkedin_config_update ON public.crm_linkedin_config;
CREATE POLICY crm_linkedin_config_update ON public.crm_linkedin_config
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'settings.manage'));

-- ============================================================================
-- SECTION 2: EMAIL A/B TESTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_email_ab_tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    template_id uuid,
    variant_a jsonb NOT NULL DEFAULT '{}',
    variant_b jsonb NOT NULL DEFAULT '{}',
    metric text NOT NULL DEFAULT 'open'
        CHECK (metric IN ('open', 'click', 'reply')),
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
    winner text CHECK (winner IN ('a', 'b', 'tie', NULL)),
    sample_size integer NOT NULL DEFAULT 100,
    variant_a_sent integer NOT NULL DEFAULT 0,
    variant_b_sent integer NOT NULL DEFAULT 0,
    variant_a_success integer NOT NULL DEFAULT 0,
    variant_b_success integer NOT NULL DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_ab_tests_org ON public.crm_email_ab_tests(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_ab_tests_status ON public.crm_email_ab_tests(status);

ALTER TABLE public.crm_email_ab_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_ab_tests_select ON public.crm_email_ab_tests;
CREATE POLICY crm_ab_tests_select ON public.crm_email_ab_tests
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_ab_tests_insert ON public.crm_email_ab_tests;
CREATE POLICY crm_ab_tests_insert ON public.crm_email_ab_tests
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'email.templates'));

DROP POLICY IF EXISTS crm_ab_tests_update ON public.crm_email_ab_tests;
CREATE POLICY crm_ab_tests_update ON public.crm_email_ab_tests
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'email.templates'));

DROP POLICY IF EXISTS crm_ab_tests_delete ON public.crm_email_ab_tests;
CREATE POLICY crm_ab_tests_delete ON public.crm_email_ab_tests
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'email.templates'));

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_crm_linkedin_config_updated ON public.crm_linkedin_config;
CREATE TRIGGER trg_crm_linkedin_config_updated BEFORE UPDATE ON public.crm_linkedin_config
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_ab_tests_updated ON public.crm_email_ab_tests;
CREATE TRIGGER trg_crm_ab_tests_updated BEFORE UPDATE ON public.crm_email_ab_tests
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

-- ============================================================================
-- SECTION 3: FIX AUTOMATION CHECK CONSTRAINTS
-- Expand ai_automation_rules trigger_type and action_type to match WorkflowBuilder
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_automation_rules'
    ) THEN
        ALTER TABLE public.ai_automation_rules
            DROP CONSTRAINT IF EXISTS ai_automation_rules_trigger_type_check;

        ALTER TABLE public.ai_automation_rules
            ADD CONSTRAINT ai_automation_rules_trigger_type_check
            CHECK (trigger_type IN (
                'lead_created', 'lead_updated', 'stage_changed', 'score_changed',
                'task_overdue', 'task_completed', 'email_opened', 'email_clicked',
                'email_replied', 'form_submitted', 'deal_created', 'deal_stage_changed',
                'deal_won', 'deal_lost', 'contact_created', 'activity_logged',
                'sla_breach', 'cadence_step_due', 'referral_received',
                'time_based', 'field_updated', 'no_activity'
            ));

        ALTER TABLE public.ai_automation_rules
            DROP CONSTRAINT IF EXISTS ai_automation_rules_action_type_check;

        ALTER TABLE public.ai_automation_rules
            ADD CONSTRAINT ai_automation_rules_action_type_check
            CHECK (action_type IN (
                'send_email', 'create_task', 'update_field', 'send_notification',
                'assign_owner', 'add_tag', 'remove_tag', 'move_stage',
                'create_activity', 'send_sms', 'webhook', 'ai_generate',
                'enroll_cadence', 'pause_cadence', 'escalate_sla',
                'round_robin_assign', 'update_score', 'create_deal'
            ));
    END IF;
END $$;

COMMIT;
