-- ============================================================================
-- Migration: CRM Deal Stages Table
-- Description: Configurable pipeline stages for deals/opportunities
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_deal_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Stage Info
    name text NOT NULL,
    display_name text NOT NULL,
    color text DEFAULT '#3B82F6',
    icon text,

    -- Probability (for forecasting)
    probability integer DEFAULT 0
        CHECK (probability >= 0 AND probability <= 100),

    -- Ordering
    sort_order integer NOT NULL,

    -- Stage Classification
    is_won_stage boolean DEFAULT false,
    is_lost_stage boolean DEFAULT false,
    is_active boolean DEFAULT true,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Unique stage name per org
    UNIQUE(org_id, name)
);
-- ============================================================================
-- SECTION B: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_deal_stages_org_id
    ON public.crm_deal_stages (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_stages_sort_order
    ON public.crm_deal_stages (org_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_crm_deal_stages_active
    ON public.crm_deal_stages (org_id, is_active);
-- ============================================================================
-- SECTION C: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_deal_stages ENABLE ROW LEVEL SECURITY;
-- SELECT: org members
CREATE POLICY "crm_deal_stages_select"
    ON public.crm_deal_stages
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
-- INSERT: org admins only
CREATE POLICY "crm_deal_stages_insert"
    ON public.crm_deal_stages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_org_admin(org_id)
    );
-- UPDATE: org admins only
CREATE POLICY "crm_deal_stages_update"
    ON public.crm_deal_stages
    FOR UPDATE
    TO authenticated
    USING (
        public.is_org_admin(org_id)
    )
    WITH CHECK (
        public.is_org_admin(org_id)
    );
-- DELETE: org admins only
CREATE POLICY "crm_deal_stages_delete"
    ON public.crm_deal_stages
    FOR DELETE
    TO authenticated
    USING (
        public.is_org_admin(org_id)
    );
-- ============================================================================
-- SECTION D: SEED DEFAULT STAGES
-- ============================================================================

INSERT INTO public.crm_deal_stages (org_id, name, display_name, color, probability, sort_order, is_won_stage, is_lost_stage) VALUES
    ('00000000-0000-4000-a000-000000000001', 'qualification',     'Qualification',         '#6B7280', 10,  1, false, false),
    ('00000000-0000-4000-a000-000000000001', 'needs_analysis',    'Needs Analysis',        '#3B82F6', 20,  2, false, false),
    ('00000000-0000-4000-a000-000000000001', 'value_proposition', 'Value Proposition',     '#8B5CF6', 40,  3, false, false),
    ('00000000-0000-4000-a000-000000000001', 'id_decision_makers','Identify Decision Makers','#EC4899', 50, 4, false, false),
    ('00000000-0000-4000-a000-000000000001', 'proposal',          'Proposal/Price Quote',  '#F59E0B', 60,  5, false, false),
    ('00000000-0000-4000-a000-000000000001', 'negotiation',       'Negotiation/Review',    '#EF4444', 80,  6, false, false),
    ('00000000-0000-4000-a000-000000000001', 'closed_won',        'Closed Won',            '#10B981', 100, 7, true,  false),
    ('00000000-0000-4000-a000-000000000001', 'closed_lost',       'Closed Lost',           '#DC2626', 0,   8, false, true)
ON CONFLICT (org_id, name) DO NOTHING;
-- ============================================================================
-- SECTION E: UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_deal_stages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_deal_stages_updated_at ON public.crm_deal_stages;
CREATE TRIGGER trigger_crm_deal_stages_updated_at
    BEFORE UPDATE ON public.crm_deal_stages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_deal_stages_updated_at();
COMMIT;
