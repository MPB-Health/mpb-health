-- ============================================================================
-- CRM rebuild — Phase 3 — STEP 1 of 2
-- Master template library
-- ============================================================================
--
-- Section 7 (Round 4 Addendum): admin-controlled master templates that reps
-- consume read-only via cadence references and "Push to all reps" actions.
-- Reps still own their personal templates in `crm_rep_message_templates`.
--
-- The cadence v2 schema migration is split into a sibling file
-- (20260620110000_crm_p3_cadence_v2_schema.sql) so each migration is small
-- enough to pass through MCP `apply_migration` without truncation.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. crm_master_templates — admin-only template library
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_master_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    channel text NOT NULL CHECK (channel IN ('email', 'sms', 'phone_script')),
    name text NOT NULL,
    -- For email: subject is required. For sms / phone_script: subject is null.
    subject text,
    body text NOT NULL,
    -- Versioning so admins can edit while keeping cadence references stable.
    version integer NOT NULL DEFAULT 1,
    parent_template_id uuid REFERENCES public.crm_master_templates(id) ON DELETE SET NULL,
    archived_at timestamptz,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    -- Loose tags for filtering inside the admin library; not used by RLS.
    tags text[] NOT NULL DEFAULT '{}'::text[]
);
CREATE INDEX IF NOT EXISTS idx_crm_master_templates_org ON public.crm_master_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_master_templates_channel ON public.crm_master_templates(org_id, channel) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_master_templates_name_version
    ON public.crm_master_templates(org_id, channel, name, version)
    WHERE archived_at IS NULL;
ALTER TABLE public.crm_master_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_master_templates_select ON public.crm_master_templates;
DROP POLICY IF EXISTS crm_master_templates_insert ON public.crm_master_templates;
DROP POLICY IF EXISTS crm_master_templates_update ON public.crm_master_templates;
DROP POLICY IF EXISTS crm_master_templates_delete ON public.crm_master_templates;
DROP POLICY IF EXISTS crm_master_templates_service ON public.crm_master_templates;
-- All org members can READ master templates so cadence step UI can render
-- the linked subject preview without exposing the editable surface. The
-- templates.master.manage permission gates writes only.
CREATE POLICY crm_master_templates_select ON public.crm_master_templates
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));
CREATE POLICY crm_master_templates_insert ON public.crm_master_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'templates.master.manage')
    );
CREATE POLICY crm_master_templates_update ON public.crm_master_templates
    FOR UPDATE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'templates.master.manage')
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'templates.master.manage')
    );
CREATE POLICY crm_master_templates_delete ON public.crm_master_templates
    FOR DELETE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'templates.master.manage')
    );
CREATE POLICY crm_master_templates_service ON public.crm_master_templates
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_master_templates TO authenticated;
GRANT ALL ON public.crm_master_templates TO service_role;
-- updated_at trigger — local helper so we don't depend on a global one.
CREATE OR REPLACE FUNCTION public.crm_master_templates_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_crm_master_templates_touch ON public.crm_master_templates;
CREATE TRIGGER trg_crm_master_templates_touch
    BEFORE UPDATE ON public.crm_master_templates
    FOR EACH ROW EXECUTE FUNCTION public.crm_master_templates_touch_updated_at();
COMMIT;
