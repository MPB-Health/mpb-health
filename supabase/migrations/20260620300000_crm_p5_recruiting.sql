-- ============================================================================
-- CRM rebuild — Phase 5
-- Recruiting module clone — 7 locked stages + records + subsections
-- ============================================================================
-- Section 9 + Round 5 Addendum: a fully-separate Recruiting module that
-- mirrors Leads. Different table set, different RLS predicate
-- (recruiting.read / recruiting.write permissions, seeded in Phase 1), and
-- the same daily-log auto-capture trigger fires off `crm_activities`
-- regardless of source — so call/email/note logging flows through to the
-- Daily Log v2 page automatically.
--
-- Stage taxonomy (locked):
--   prospect → contacted → interviewing → contracted →
--   onboarding → active → inactive
--
-- Subsections mirror Leads for now (placeholder per the plan):
--   working | nurture | linkedin | do_not_contact
--
-- Recruiting data is fully separate from Members/Leads. No commingling.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Pipeline stages — exactly 7 rows per org, locked sort order
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_recruiting_pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    display_name text NOT NULL,
    color text NOT NULL DEFAULT '#64748B',
    icon text,
    sort_order integer NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    is_terminal boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_recruiting_stages_org_sort
    ON public.crm_recruiting_pipeline_stages (org_id, sort_order);

ALTER TABLE public.crm_recruiting_pipeline_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruiting_stages_select ON public.crm_recruiting_pipeline_stages;
DROP POLICY IF EXISTS recruiting_stages_write ON public.crm_recruiting_pipeline_stages;
DROP POLICY IF EXISTS recruiting_stages_service ON public.crm_recruiting_pipeline_stages;

CREATE POLICY recruiting_stages_select ON public.crm_recruiting_pipeline_stages
    FOR SELECT TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.read')
    );

CREATE POLICY recruiting_stages_write ON public.crm_recruiting_pipeline_stages
    FOR ALL TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.write')
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.write')
    );

CREATE POLICY recruiting_stages_service ON public.crm_recruiting_pipeline_stages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_recruiting_pipeline_stages TO authenticated;
GRANT ALL ON public.crm_recruiting_pipeline_stages TO service_role;

-- Seed exactly the 7 locked stages per org.
INSERT INTO public.crm_recruiting_pipeline_stages (org_id, name, display_name, color, sort_order, is_terminal)
SELECT o.id, s.name, s.display_name, s.color, s.sort_order, s.is_terminal
FROM public.orgs o
CROSS JOIN (VALUES
    ('prospect',     'Prospect',     '#3B82F6', 1, false),
    ('contacted',    'Contacted',    '#6366F1', 2, false),
    ('interviewing', 'Interviewing', '#8B5CF6', 3, false),
    ('contracted',   'Contracted',   '#F59E0B', 4, false),
    ('onboarding',   'Onboarding',   '#10B981', 5, false),
    ('active',       'Active',       '#22C55E', 6, true),
    ('inactive',     'Inactive',     '#EF4444', 7, true)
) AS s(name, display_name, color, sort_order, is_terminal)
ON CONFLICT (org_id, name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Recruiting records — analogous to lead_submissions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_recruiting_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    -- Agent-specific attributes
    license_number text,
    npn text,
    appointed_carriers text[] NOT NULL DEFAULT '{}'::text[],
    agency_affiliation text,
    state text,
    city text,
    -- Pipeline + workflow
    pipeline_stage text NOT NULL DEFAULT 'prospect',
    workflow_subsection text NOT NULL DEFAULT 'working' CHECK (
        workflow_subsection IN ('working', 'nurture', 'linkedin', 'do_not_contact')
    ),
    linkedin_workflow_status text,
    do_not_contact boolean NOT NULL DEFAULT false,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    tags text[] NOT NULL DEFAULT '{}'::text[],
    notes text,
    -- Lifecycle
    last_contacted_at timestamptz,
    last_touched_at timestamptz,
    stage_changed_at timestamptz,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruiting_records_org ON public.crm_recruiting_records(org_id);
CREATE INDEX IF NOT EXISTS idx_recruiting_records_stage ON public.crm_recruiting_records(org_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_recruiting_records_subsection ON public.crm_recruiting_records(org_id, workflow_subsection);
CREATE INDEX IF NOT EXISTS idx_recruiting_records_assigned ON public.crm_recruiting_records(assigned_to);
CREATE INDEX IF NOT EXISTS idx_recruiting_records_last_touched ON public.crm_recruiting_records(last_touched_at);

ALTER TABLE public.crm_recruiting_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruiting_records_select ON public.crm_recruiting_records;
DROP POLICY IF EXISTS recruiting_records_insert ON public.crm_recruiting_records;
DROP POLICY IF EXISTS recruiting_records_update ON public.crm_recruiting_records;
DROP POLICY IF EXISTS recruiting_records_delete ON public.crm_recruiting_records;
DROP POLICY IF EXISTS recruiting_records_service ON public.crm_recruiting_records;

CREATE POLICY recruiting_records_select ON public.crm_recruiting_records
    FOR SELECT TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.read')
    );

CREATE POLICY recruiting_records_insert ON public.crm_recruiting_records
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.write')
    );

CREATE POLICY recruiting_records_update ON public.crm_recruiting_records
    FOR UPDATE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.write')
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.write')
    );

CREATE POLICY recruiting_records_delete ON public.crm_recruiting_records
    FOR DELETE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'recruiting.write')
    );

CREATE POLICY recruiting_records_service ON public.crm_recruiting_records
    FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_recruiting_records TO authenticated;
GRANT ALL ON public.crm_recruiting_records TO service_role;

-- updated_at + last_touched_at + stage_changed_at trigger.
CREATE OR REPLACE FUNCTION public.crm_recruiting_records_touch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    IF TG_OP = 'UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
        NEW.stage_changed_at := now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recruiting_records_touch ON public.crm_recruiting_records;
CREATE TRIGGER trg_recruiting_records_touch
    BEFORE UPDATE ON public.crm_recruiting_records
    FOR EACH ROW EXECUTE FUNCTION public.crm_recruiting_records_touch();

COMMIT;
