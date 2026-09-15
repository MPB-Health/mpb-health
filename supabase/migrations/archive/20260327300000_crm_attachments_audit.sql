-- ============================================================================
-- Migration: CRM Attachments + Centralized Audit Log
-- Polymorphic attachment model and unified audit trail.
-- ============================================================================

BEGIN;
-- ============================================================================
-- 1. CRM Attachments
-- Polymorphic: any entity type (lead, contact, deal, case, account) can own
-- attachments via entity_type + entity_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_attachments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL DEFAULT 0,
    mime_type text NOT NULL DEFAULT 'application/octet-stream',
    category text NOT NULL DEFAULT 'general',
    description text,
    uploaded_by uuid NOT NULL REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_attachments_entity
    ON public.crm_attachments (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_attachments_org
    ON public.crm_attachments (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_attachments_uploaded_by
    ON public.crm_attachments (uploaded_by);
ALTER TABLE public.crm_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_org_access" ON public.crm_attachments
    FOR ALL
    USING (
        org_id IN (
            SELECT om.org_id FROM public.org_memberships om
            WHERE om.user_id = auth.uid()
        )
    );
-- ============================================================================
-- 2. Centralized Audit Log
-- Records major CRM actions for compliance and operational review.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    changes jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_entity
    ON public.crm_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_org_date
    ON public.crm_audit_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_user
    ON public.crm_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_action
    ON public.crm_audit_log (action);
ALTER TABLE public.crm_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_org_read" ON public.crm_audit_log
    FOR SELECT
    USING (
        org_id IN (
            SELECT om.org_id FROM public.org_memberships om
            WHERE om.user_id = auth.uid()
        )
    );
CREATE POLICY "audit_org_insert" ON public.crm_audit_log
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT om.org_id FROM public.org_memberships om
            WHERE om.user_id = auth.uid()
        )
    );
-- ============================================================================
-- 3. Trigger: auto-update updated_at on crm_attachments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trg_crm_attachments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_crm_attachments_updated_at ON public.crm_attachments;
CREATE TRIGGER trg_crm_attachments_updated_at
    BEFORE UPDATE ON public.crm_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_crm_attachments_updated_at();
-- ============================================================================
-- 4. Supabase Storage bucket for CRM attachments (idempotent)
-- Note: Bucket creation via SQL is Supabase-specific.
-- If the bucket already exists this will be a no-op.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-attachments', 'crm-attachments', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "crm_attachments_bucket_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'crm-attachments');
CREATE POLICY "crm_attachments_bucket_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'crm-attachments');
CREATE POLICY "crm_attachments_bucket_delete" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'crm-attachments');
COMMIT;
