-- ============================================================================
-- Migration: CRM Sales Plan 2026
-- Description: New entities, column additions, CHECK expansions, RPC fixes,
--   and permission seeds to operationalize the Sales Plan 2026 and the
--   Sales Reports & Dashboards 2026 workbook.
--
-- Safety: All new columns are nullable or have defaults.
--         All CHECK changes use DROP + ADD (safe for existing data).
--         No table drops or renames.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: LEAD SOURCE TYPES (lookup / enforced picklist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_lead_source_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    label text NOT NULL,
    is_self_generated boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.crm_lead_source_types (slug, label, is_self_generated, sort_order) VALUES
    ('linkedin',            'LinkedIn',               true,  1),
    ('networking',          'Networking',              true,  2),
    ('referrals',           'Referrals',               true,  3),
    ('community',           'Community',               true,  4),
    ('reactivation',        'Reactivation',            true,  5),
    ('inhouse_round_robin', 'Inhouse (Round-Robin)',    false, 6),
    ('church_partnership',  'Church Partnership',       true,  7),
    ('hydration_booth',     'Hydration Booth',          true,  8),
    ('chamber_bni_sbdc',    'Chamber/BNI/SBDC',         true,  9),
    ('outside_advisors',    'Outside Advisors',         false, 10),
    ('sunbiz_prospect',     'sunbiz.org Prospect',      true,  11)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.crm_lead_source_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_lead_source_types_select ON public.crm_lead_source_types;
CREATE POLICY crm_lead_source_types_select ON public.crm_lead_source_types
    FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- SECTION 2: ROUND-ROBIN CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_round_robin_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    is_active boolean NOT NULL DEFAULT false,
    pool_members jsonb NOT NULL DEFAULT '[]',
    current_position integer NOT NULL DEFAULT 0,
    tie_breaking_rule text NOT NULL DEFAULT 'sequential'
        CHECK (tie_breaking_rule IN ('sequential', 'least_leads', 'random')),
    skip_unavailable boolean NOT NULL DEFAULT true,
    updated_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(org_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_round_robin_config_org ON public.crm_round_robin_config(org_id);

ALTER TABLE public.crm_round_robin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_rr_config_select ON public.crm_round_robin_config;
CREATE POLICY crm_rr_config_select ON public.crm_round_robin_config
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_rr_config_insert ON public.crm_round_robin_config;
CREATE POLICY crm_rr_config_insert ON public.crm_round_robin_config
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'round_robin.manage'));

DROP POLICY IF EXISTS crm_rr_config_update ON public.crm_round_robin_config;
CREATE POLICY crm_rr_config_update ON public.crm_round_robin_config
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'round_robin.manage'));

-- ============================================================================
-- SECTION 3: ROUND-ROBIN AUDIT TRAIL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_round_robin_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL,
    assigned_to uuid NOT NULL REFERENCES auth.users(id),
    position_at_assignment integer NOT NULL DEFAULT 0,
    was_skip boolean NOT NULL DEFAULT false,
    skip_reason text,
    override_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_rr_audit_org ON public.crm_round_robin_audit(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_rr_audit_lead ON public.crm_round_robin_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_rr_audit_assigned ON public.crm_round_robin_audit(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_rr_audit_created ON public.crm_round_robin_audit(created_at DESC);

ALTER TABLE public.crm_round_robin_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_rr_audit_select ON public.crm_round_robin_audit;
CREATE POLICY crm_rr_audit_select ON public.crm_round_robin_audit
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_rr_audit_insert ON public.crm_round_robin_audit;
CREATE POLICY crm_rr_audit_insert ON public.crm_round_robin_audit
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- ============================================================================
-- SECTION 4: SLA CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_sla_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    sla_hours integer NOT NULL DEFAULT 24,
    business_hours_start time NOT NULL DEFAULT '09:00',
    business_hours_end time NOT NULL DEFAULT '17:00',
    business_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
    timezone text NOT NULL DEFAULT 'America/New_York',
    escalation_to uuid[] DEFAULT '{}',
    escalation_email boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(org_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_sla_config_org ON public.crm_sla_config(org_id);

ALTER TABLE public.crm_sla_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_sla_config_select ON public.crm_sla_config;
CREATE POLICY crm_sla_config_select ON public.crm_sla_config
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_sla_config_insert ON public.crm_sla_config;
CREATE POLICY crm_sla_config_insert ON public.crm_sla_config
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'sla.manage'));

DROP POLICY IF EXISTS crm_sla_config_update ON public.crm_sla_config;
CREATE POLICY crm_sla_config_update ON public.crm_sla_config
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'sla.manage'));

-- ============================================================================
-- SECTION 5: FOLLOW-UP CADENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_follow_up_cadences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    pipeline_stage_id uuid REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
    name text NOT NULL,
    steps jsonb NOT NULL DEFAULT '[]',
    is_default boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_cadences_org ON public.crm_follow_up_cadences(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_cadences_default ON public.crm_follow_up_cadences(org_id, is_default) WHERE is_default = true;

ALTER TABLE public.crm_follow_up_cadences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_cadences_select ON public.crm_follow_up_cadences;
CREATE POLICY crm_cadences_select ON public.crm_follow_up_cadences
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_cadences_insert ON public.crm_follow_up_cadences;
CREATE POLICY crm_cadences_insert ON public.crm_follow_up_cadences
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'settings.manage'));

DROP POLICY IF EXISTS crm_cadences_update ON public.crm_follow_up_cadences;
CREATE POLICY crm_cadences_update ON public.crm_follow_up_cadences
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'settings.manage'));

DROP POLICY IF EXISTS crm_cadences_delete ON public.crm_follow_up_cadences;
CREATE POLICY crm_cadences_delete ON public.crm_follow_up_cadences
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'settings.manage'));

-- ============================================================================
-- SECTION 6: LEAD CADENCE STATE (per-lead tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_lead_cadence_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL,
    cadence_id uuid NOT NULL REFERENCES public.crm_follow_up_cadences(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    current_step integer NOT NULL DEFAULT 0,
    next_action_at timestamptz,
    paused boolean NOT NULL DEFAULT false,
    paused_reason text,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(lead_id, cadence_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_cadence_lead ON public.crm_lead_cadence_state(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_cadence_org ON public.crm_lead_cadence_state(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_cadence_next ON public.crm_lead_cadence_state(next_action_at)
    WHERE completed_at IS NULL AND paused = false;

ALTER TABLE public.crm_lead_cadence_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_lead_cadence_select ON public.crm_lead_cadence_state;
CREATE POLICY crm_lead_cadence_select ON public.crm_lead_cadence_state
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_lead_cadence_insert ON public.crm_lead_cadence_state;
CREATE POLICY crm_lead_cadence_insert ON public.crm_lead_cadence_state
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_lead_cadence_update ON public.crm_lead_cadence_state;
CREATE POLICY crm_lead_cadence_update ON public.crm_lead_cadence_state
    FOR UPDATE USING (public.is_org_member(org_id));

-- ============================================================================
-- SECTION 7: REFERRAL PARTNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_referral_partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    partner_type text NOT NULL DEFAULT 'other'
        CHECK (partner_type IN ('financial_advisor', 'cpa', 'hr_consultant', 'attorney', 'payroll_company', 'other')),
    company text,
    email text,
    phone text,
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_referral_partners_org ON public.crm_referral_partners(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_referral_partners_type ON public.crm_referral_partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_crm_referral_partners_active ON public.crm_referral_partners(org_id, is_active);

ALTER TABLE public.crm_referral_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_ref_partners_select ON public.crm_referral_partners;
CREATE POLICY crm_ref_partners_select ON public.crm_referral_partners
    FOR SELECT USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.read'));

DROP POLICY IF EXISTS crm_ref_partners_insert ON public.crm_referral_partners;
CREATE POLICY crm_ref_partners_insert ON public.crm_referral_partners
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.write'));

DROP POLICY IF EXISTS crm_ref_partners_update ON public.crm_referral_partners;
CREATE POLICY crm_ref_partners_update ON public.crm_referral_partners
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.write'));

DROP POLICY IF EXISTS crm_ref_partners_delete ON public.crm_referral_partners;
CREATE POLICY crm_ref_partners_delete ON public.crm_referral_partners
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.write'));

-- ============================================================================
-- SECTION 8: REFERRALS (tracking requested/received per rep)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    partner_id uuid NOT NULL REFERENCES public.crm_referral_partners(id) ON DELETE CASCADE,
    lead_id uuid,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    referred_by uuid NOT NULL REFERENCES auth.users(id),
    direction text NOT NULL CHECK (direction IN ('requested', 'received')),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'contacted', 'converted', 'lost', 'declined')),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_referrals_org ON public.crm_referrals(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_referrals_partner ON public.crm_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_crm_referrals_lead ON public.crm_referrals(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_referrals_referred_by ON public.crm_referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_crm_referrals_direction ON public.crm_referrals(org_id, direction);
CREATE INDEX IF NOT EXISTS idx_crm_referrals_created ON public.crm_referrals(created_at DESC);

ALTER TABLE public.crm_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_referrals_select ON public.crm_referrals;
CREATE POLICY crm_referrals_select ON public.crm_referrals
    FOR SELECT USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.read'));

DROP POLICY IF EXISTS crm_referrals_insert ON public.crm_referrals;
CREATE POLICY crm_referrals_insert ON public.crm_referrals
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.write'));

DROP POLICY IF EXISTS crm_referrals_update ON public.crm_referrals;
CREATE POLICY crm_referrals_update ON public.crm_referrals
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.write'));

DROP POLICY IF EXISTS crm_referrals_delete ON public.crm_referrals;
CREATE POLICY crm_referrals_delete ON public.crm_referrals
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'referrals.write'));

-- ============================================================================
-- SECTION 9: OUTSIDE ADVISORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_outside_advisors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    is_active boolean NOT NULL DEFAULT true,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_outside_advisors_org ON public.crm_outside_advisors(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_outside_advisors_active ON public.crm_outside_advisors(org_id, is_active);

ALTER TABLE public.crm_outside_advisors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_oa_select ON public.crm_outside_advisors;
CREATE POLICY crm_oa_select ON public.crm_outside_advisors
    FOR SELECT USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'outside_advisors.read'));

DROP POLICY IF EXISTS crm_oa_insert ON public.crm_outside_advisors;
CREATE POLICY crm_oa_insert ON public.crm_outside_advisors
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'outside_advisors.write'));

DROP POLICY IF EXISTS crm_oa_update ON public.crm_outside_advisors;
CREATE POLICY crm_oa_update ON public.crm_outside_advisors
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'outside_advisors.write'));

DROP POLICY IF EXISTS crm_oa_delete ON public.crm_outside_advisors;
CREATE POLICY crm_oa_delete ON public.crm_outside_advisors
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'outside_advisors.write'));

-- ============================================================================
-- SECTION 10: COMMUNITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_community_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    event_type text NOT NULL DEFAULT 'other'
        CHECK (event_type IN ('church_partnership', 'hydration_booth', 'chamber_bni_sbdc', 'health_fair', 'co_sponsored', 'other')),
    event_date date NOT NULL,
    location text,
    contacts_captured integer NOT NULL DEFAULT 0,
    leads_generated integer NOT NULL DEFAULT 0,
    rep_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_community_events_org ON public.crm_community_events(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_community_events_date ON public.crm_community_events(org_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_community_events_type ON public.crm_community_events(event_type);
CREATE INDEX IF NOT EXISTS idx_crm_community_events_rep ON public.crm_community_events(rep_id);

ALTER TABLE public.crm_community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_ce_select ON public.crm_community_events;
CREATE POLICY crm_ce_select ON public.crm_community_events
    FOR SELECT USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'community_events.read'));

DROP POLICY IF EXISTS crm_ce_insert ON public.crm_community_events;
CREATE POLICY crm_ce_insert ON public.crm_community_events
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'community_events.write'));

DROP POLICY IF EXISTS crm_ce_update ON public.crm_community_events;
CREATE POLICY crm_ce_update ON public.crm_community_events
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'community_events.write'));

DROP POLICY IF EXISTS crm_ce_delete ON public.crm_community_events;
CREATE POLICY crm_ce_delete ON public.crm_community_events
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'community_events.write'));

-- ============================================================================
-- SECTION 11: ACTIVITY TARGETS (monthly per-rep + quarterly team)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_activity_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    target_type text NOT NULL CHECK (target_type IN ('monthly_rep', 'quarterly_team')),
    rep_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    targets jsonb NOT NULL DEFAULT '{}',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_targets_org ON public.crm_activity_targets(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_targets_type ON public.crm_activity_targets(org_id, target_type);
CREATE INDEX IF NOT EXISTS idx_crm_activity_targets_period ON public.crm_activity_targets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_crm_activity_targets_rep ON public.crm_activity_targets(rep_id);

ALTER TABLE public.crm_activity_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_targets_select ON public.crm_activity_targets;
CREATE POLICY crm_targets_select ON public.crm_activity_targets
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_targets_insert ON public.crm_activity_targets;
CREATE POLICY crm_targets_insert ON public.crm_activity_targets
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'targets.manage'));

DROP POLICY IF EXISTS crm_targets_update ON public.crm_activity_targets;
CREATE POLICY crm_targets_update ON public.crm_activity_targets
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'targets.manage'));

DROP POLICY IF EXISTS crm_targets_delete ON public.crm_activity_targets;
CREATE POLICY crm_targets_delete ON public.crm_activity_targets
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'targets.manage'));

-- ============================================================================
-- SECTION 12: QUARTERLY MILESTONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_quarterly_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    year integer NOT NULL,
    quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    phase_name text NOT NULL,
    lead_target integer NOT NULL DEFAULT 0,
    sales_target integer NOT NULL DEFAULT 0,
    revenue_target numeric(15,2) NOT NULL DEFAULT 0,
    linkedin_follower_target integer NOT NULL DEFAULT 0,
    referral_partner_target integer NOT NULL DEFAULT 0,
    community_event_target integer NOT NULL DEFAULT 0,
    actuals jsonb NOT NULL DEFAULT '{}',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(org_id, year, quarter)
);

CREATE INDEX IF NOT EXISTS idx_crm_milestones_org ON public.crm_quarterly_milestones(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_milestones_period ON public.crm_quarterly_milestones(org_id, year, quarter);

ALTER TABLE public.crm_quarterly_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_milestones_select ON public.crm_quarterly_milestones;
CREATE POLICY crm_milestones_select ON public.crm_quarterly_milestones
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_milestones_insert ON public.crm_quarterly_milestones;
CREATE POLICY crm_milestones_insert ON public.crm_quarterly_milestones
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'targets.manage'));

DROP POLICY IF EXISTS crm_milestones_update ON public.crm_quarterly_milestones;
CREATE POLICY crm_milestones_update ON public.crm_quarterly_milestones
    FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'targets.manage'));

DROP POLICY IF EXISTS crm_milestones_delete ON public.crm_quarterly_milestones;
CREATE POLICY crm_milestones_delete ON public.crm_quarterly_milestones
    FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'targets.manage'));

-- Seed default 2026 milestones (will be inserted per-org by the app)
-- These are the team-level targets from the Sales Plan deck.

-- ============================================================================
-- SECTION 13: ALTER EXISTING TABLES (safe additions)
-- ============================================================================

-- Add lead_source and is_self_generated to lead submissions
ALTER TABLE public.zoho_lead_submissions
    ADD COLUMN IF NOT EXISTS lead_source text,
    ADD COLUMN IF NOT EXISTS is_self_generated boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS reactivation_source_lead_id uuid;

CREATE INDEX IF NOT EXISTS idx_zls_lead_source ON public.zoho_lead_submissions(lead_source);
CREATE INDEX IF NOT EXISTS idx_zls_is_self_generated ON public.zoho_lead_submissions(is_self_generated);
CREATE INDEX IF NOT EXISTS idx_zls_reactivation_source ON public.zoho_lead_submissions(reactivation_source_lead_id)
    WHERE reactivation_source_lead_id IS NOT NULL;

-- ============================================================================
-- SECTION 14: EXPAND ACTIVITY TYPE CHECK CONSTRAINTS
-- ============================================================================

-- lead_activities: drop old constraint, add expanded one
ALTER TABLE public.lead_activities
    DROP CONSTRAINT IF EXISTS lead_activities_activity_type_check;

ALTER TABLE public.lead_activities
    ADD CONSTRAINT lead_activities_activity_type_check
    CHECK (activity_type IN (
        'note', 'call', 'email', 'meeting', 'sms',
        'status_change', 'stage_change', 'assignment',
        'task_created', 'task_completed',
        'linkedin_connection_sent', 'linkedin_connection_accepted',
        'linkedin_message', 'linkedin_post', 'linkedin_engagement',
        'presentation', 'networking_event', 'community_outreach',
        'referral_requested', 'live_chat', 'crm_lead_entered',
        'proposal_sent'
    ));

-- crm_activities: drop old constraint, add expanded one
ALTER TABLE public.crm_activities
    DROP CONSTRAINT IF EXISTS crm_activities_activity_type_check;

ALTER TABLE public.crm_activities
    ADD CONSTRAINT crm_activities_activity_type_check
    CHECK (activity_type IN (
        'call', 'email', 'meeting', 'task', 'note', 'sms',
        'social', 'webinar', 'demo', 'other',
        'linkedin_connection_sent', 'linkedin_connection_accepted',
        'linkedin_message', 'linkedin_post', 'linkedin_engagement',
        'presentation', 'networking_event', 'community_outreach',
        'referral_requested', 'live_chat', 'crm_lead_entered',
        'proposal_sent'
    ));

-- ============================================================================
-- SECTION 15: FIX BROKEN RPCs
-- ============================================================================

-- Fix crm_advisor_performance: references crm_lead_tasks -> lead_tasks,
-- crm_lead_activities -> lead_activities
CREATE OR REPLACE FUNCTION public.crm_advisor_performance(
    p_org_id uuid
)
RETURNS TABLE (
    advisor_id uuid,
    advisor_email text,
    advisor_name text,
    total_leads bigint,
    new_leads_this_month bigint,
    converted_leads bigint,
    open_tasks bigint,
    overdue_tasks bigint,
    activities_this_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS advisor_id,
        u.email::text AS advisor_email,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS advisor_name,
        COUNT(DISTINCT l.id)::bigint AS total_leads,
        COUNT(DISTINCT l.id) FILTER (
            WHERE l.created_at >= date_trunc('month', CURRENT_DATE)
        )::bigint AS new_leads_this_month,
        COUNT(DISTINCT l.id) FILTER (
            WHERE l.pipeline_stage IN ('converted', 'won', 'closed_won')
        )::bigint AS converted_leads,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.completed = false
        ) AS open_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.completed = false
            AND t.due_date < CURRENT_DATE
        ) AS overdue_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_activities a
            WHERE a.created_by = u.id
            AND a.created_at >= date_trunc('month', CURRENT_DATE)
        ) AS activities_this_month
    FROM auth.users u
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.zoho_lead_submissions l ON l.assigned_to = u.id AND l.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY total_leads DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_advisor_performance(uuid) TO authenticated;

-- Fix crm_pipeline_breakdown: 'traditional' -> 'traditional_insurance'
CREATE OR REPLACE FUNCTION public.crm_pipeline_breakdown(
    p_org_id uuid
)
RETURNS TABLE (
    stage_name text,
    stage_display_name text,
    stage_color text,
    total_in_stage bigint,
    healthshare_count bigint,
    traditional_count bigint,
    unspecified_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.name::text AS stage_name,
        ps.display_name::text AS stage_display_name,
        ps.color::text AS stage_color,
        COUNT(l.id)::bigint AS total_in_stage,
        COUNT(l.id) FILTER (WHERE l.plan_type = 'healthshare')::bigint AS healthshare_count,
        COUNT(l.id) FILTER (WHERE l.plan_type IN ('traditional', 'traditional_insurance'))::bigint AS traditional_count,
        COUNT(l.id) FILTER (WHERE l.plan_type IS NULL OR l.plan_type NOT IN ('healthshare', 'traditional', 'traditional_insurance'))::bigint AS unspecified_count
    FROM public.crm_pipeline_stages ps
    LEFT JOIN public.zoho_lead_submissions l
        ON l.pipeline_stage = ps.name
        AND l.org_id = p_org_id
    WHERE ps.org_id = p_org_id
    AND ps.is_active = true
    ORDER BY ps.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_pipeline_breakdown(uuid) TO authenticated;

-- ============================================================================
-- SECTION 16: UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_sp2026_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_crm_rr_config_updated ON public.crm_round_robin_config;
CREATE TRIGGER trg_crm_rr_config_updated BEFORE UPDATE ON public.crm_round_robin_config
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_sla_config_updated ON public.crm_sla_config;
CREATE TRIGGER trg_crm_sla_config_updated BEFORE UPDATE ON public.crm_sla_config
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_cadences_updated ON public.crm_follow_up_cadences;
CREATE TRIGGER trg_crm_cadences_updated BEFORE UPDATE ON public.crm_follow_up_cadences
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_lead_cadence_updated ON public.crm_lead_cadence_state;
CREATE TRIGGER trg_crm_lead_cadence_updated BEFORE UPDATE ON public.crm_lead_cadence_state
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_ref_partners_updated ON public.crm_referral_partners;
CREATE TRIGGER trg_crm_ref_partners_updated BEFORE UPDATE ON public.crm_referral_partners
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_referrals_updated ON public.crm_referrals;
CREATE TRIGGER trg_crm_referrals_updated BEFORE UPDATE ON public.crm_referrals
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_outside_advisors_updated ON public.crm_outside_advisors;
CREATE TRIGGER trg_crm_outside_advisors_updated BEFORE UPDATE ON public.crm_outside_advisors
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_community_events_updated ON public.crm_community_events;
CREATE TRIGGER trg_crm_community_events_updated BEFORE UPDATE ON public.crm_community_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_activity_targets_updated ON public.crm_activity_targets;
CREATE TRIGGER trg_crm_activity_targets_updated BEFORE UPDATE ON public.crm_activity_targets
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

DROP TRIGGER IF EXISTS trg_crm_milestones_updated ON public.crm_quarterly_milestones;
CREATE TRIGGER trg_crm_milestones_updated BEFORE UPDATE ON public.crm_quarterly_milestones
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_sp2026_updated_at();

-- ============================================================================
-- SECTION 17: SEED PERMISSIONS
-- ============================================================================

INSERT INTO public.permissions (key, module, description) VALUES
    -- Missing UI permissions (used but never seeded)
    ('leads.create',          'leads',            'Create leads'),
    ('leads.update',          'leads',            'Update leads'),
    ('approvals.read',        'approvals',        'View approvals'),
    ('custom_modules.read',   'custom_modules',   'View custom modules'),
    ('price_books.read',      'price_books',      'View price books'),
    ('price_books.write',     'price_books',      'Create and edit price books'),

    -- Sales Plan 2026 new modules
    ('round_robin.read',      'round_robin',      'View round-robin configuration'),
    ('round_robin.manage',    'round_robin',      'Configure round-robin distribution'),
    ('sla.manage',            'sla',              'Configure SLA rules'),
    ('referrals.read',        'referrals',        'View referral partners and referrals'),
    ('referrals.write',       'referrals',        'Create and edit referrals'),
    ('outside_advisors.read', 'outside_advisors', 'View outside advisors'),
    ('outside_advisors.write','outside_advisors',  'Create and edit outside advisors'),
    ('community_events.read', 'community_events', 'View community events'),
    ('community_events.write','community_events',  'Create and edit community events'),
    ('targets.read',          'targets',          'View activity targets'),
    ('targets.manage',        'targets',          'Configure activity targets and milestones')
ON CONFLICT (key) DO NOTHING;

-- Grant to owner (all)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', 'owner', p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.create', 'leads.update', 'approvals.read', 'custom_modules.read',
    'price_books.read', 'price_books.write',
    'round_robin.read', 'round_robin.manage', 'sla.manage',
    'referrals.read', 'referrals.write',
    'outside_advisors.read', 'outside_advisors.write',
    'community_events.read', 'community_events.write',
    'targets.read', 'targets.manage'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- Grant to admin (all)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', 'admin', p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.create', 'leads.update', 'approvals.read', 'custom_modules.read',
    'price_books.read', 'price_books.write',
    'round_robin.read', 'round_robin.manage', 'sla.manage',
    'referrals.read', 'referrals.write',
    'outside_advisors.read', 'outside_advisors.write',
    'community_events.read', 'community_events.write',
    'targets.read', 'targets.manage'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- Grant to manager (read + write, manage targets, no round-robin/sla manage)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', 'manager', p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.create', 'leads.update', 'approvals.read', 'custom_modules.read',
    'price_books.read', 'price_books.write',
    'round_robin.read',
    'referrals.read', 'referrals.write',
    'outside_advisors.read', 'outside_advisors.write',
    'community_events.read', 'community_events.write',
    'targets.read', 'targets.manage'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- Grant to agent (read/write, limited manage)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', 'agent', p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.create', 'leads.update', 'approvals.read', 'custom_modules.read',
    'price_books.read',
    'round_robin.read',
    'referrals.read', 'referrals.write',
    'outside_advisors.read',
    'community_events.read', 'community_events.write',
    'targets.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- Grant to member (read only)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT '00000000-0000-4000-a000-000000000001', 'member', p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.create', 'leads.update', 'approvals.read', 'custom_modules.read',
    'price_books.read',
    'round_robin.read',
    'referrals.read',
    'outside_advisors.read',
    'community_events.read',
    'targets.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- Propagate to all existing orgs
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT DISTINCT o.id, rp.role, rp.permission_id
FROM public.organizations o
CROSS JOIN public.role_permissions rp
WHERE rp.org_id = '00000000-0000-4000-a000-000000000001'
  AND o.id != '00000000-0000-4000-a000-000000000001'
  AND rp.permission_id IN (
      SELECT id FROM public.permissions WHERE key IN (
          'leads.create', 'leads.update', 'approvals.read', 'custom_modules.read',
          'price_books.read', 'price_books.write',
          'round_robin.read', 'round_robin.manage', 'sla.manage',
          'referrals.read', 'referrals.write',
          'outside_advisors.read', 'outside_advisors.write',
          'community_events.read', 'community_events.write',
          'targets.read', 'targets.manage'
      )
  )
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

COMMIT;
