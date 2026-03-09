-- ============================================================================
-- CRM Cases / Support Module
-- ============================================================================

DO $$ BEGIN CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE case_status AS ENUM ('new', 'assigned', 'in_progress', 'on_hold', 'escalated', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE case_origin AS ENUM ('email', 'phone', 'web', 'chat', 'social', 'internal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.crm_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    case_number TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL,
    description TEXT,
    status case_status NOT NULL DEFAULT 'new',
    priority case_priority NOT NULL DEFAULT 'medium',
    origin case_origin DEFAULT 'web',
    category TEXT,
    subcategory TEXT,
    account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION generate_case_number() RETURNS TRIGGER AS $$
DECLARE next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 'CASE-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_num FROM public.crm_cases WHERE org_id = NEW.org_id;
    NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_case_number ON public.crm_cases;
CREATE TRIGGER trg_generate_case_number BEFORE INSERT ON public.crm_cases
    FOR EACH ROW WHEN (NEW.case_number IS NULL OR NEW.case_number = '') EXECUTE FUNCTION generate_case_number();

CREATE OR REPLACE FUNCTION public.handle_crm_cases_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_cases_updated_at ON public.crm_cases;
CREATE TRIGGER trg_crm_cases_updated_at BEFORE UPDATE ON public.crm_cases
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_cases_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_case_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.crm_cases(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_crm_case_comments_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_case_comments_updated_at ON public.crm_case_comments;
CREATE TRIGGER trg_crm_case_comments_updated_at BEFORE UPDATE ON public.crm_case_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_crm_case_comments_updated_at();

CREATE INDEX IF NOT EXISTS idx_crm_cases_org_id ON public.crm_cases(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_cases_status ON public.crm_cases(status);
CREATE INDEX IF NOT EXISTS idx_crm_cases_priority ON public.crm_cases(priority);
CREATE INDEX IF NOT EXISTS idx_crm_cases_account_id ON public.crm_cases(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_cases_contact_id ON public.crm_cases(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_cases_assigned_to ON public.crm_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_cases_created_at ON public.crm_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_case_comments_case_id ON public.crm_case_comments(case_id);

ALTER TABLE public.crm_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_case_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_cases_select ON public.crm_cases;
CREATE POLICY crm_cases_select ON public.crm_cases FOR SELECT USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'cases.read'));
DROP POLICY IF EXISTS crm_cases_insert ON public.crm_cases;
CREATE POLICY crm_cases_insert ON public.crm_cases FOR INSERT WITH CHECK (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'cases.write'));
DROP POLICY IF EXISTS crm_cases_update ON public.crm_cases;
CREATE POLICY crm_cases_update ON public.crm_cases FOR UPDATE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'cases.write'));
DROP POLICY IF EXISTS crm_cases_delete ON public.crm_cases;
CREATE POLICY crm_cases_delete ON public.crm_cases FOR DELETE USING (public.is_org_member(org_id) AND public.has_org_permission(org_id, 'cases.delete'));

DROP POLICY IF EXISTS crm_case_comments_select ON public.crm_case_comments;
CREATE POLICY crm_case_comments_select ON public.crm_case_comments FOR SELECT USING (EXISTS (SELECT 1 FROM public.crm_cases c WHERE c.id = case_id AND public.is_org_member(c.org_id) AND public.has_org_permission(c.org_id, 'cases.read')));
DROP POLICY IF EXISTS crm_case_comments_insert ON public.crm_case_comments;
CREATE POLICY crm_case_comments_insert ON public.crm_case_comments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.crm_cases c WHERE c.id = case_id AND public.is_org_member(c.org_id) AND public.has_org_permission(c.org_id, 'cases.write')));
DROP POLICY IF EXISTS crm_case_comments_update ON public.crm_case_comments;
CREATE POLICY crm_case_comments_update ON public.crm_case_comments FOR UPDATE USING (author_id = auth.uid());
DROP POLICY IF EXISTS crm_case_comments_delete ON public.crm_case_comments;
CREATE POLICY crm_case_comments_delete ON public.crm_case_comments FOR DELETE USING (author_id = auth.uid());

INSERT INTO public.permissions (key, module, description) VALUES
    ('cases.read', 'cases', 'View cases'),
    ('cases.write', 'cases', 'Create and edit cases'),
    ('cases.delete', 'cases', 'Delete cases')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (org_id, role, permission_id) SELECT '00000000-0000-4000-a000-000000000001', 'owner', p.id FROM public.permissions p WHERE p.key IN ('cases.read', 'cases.write', 'cases.delete') ON CONFLICT (org_id, role, permission_id) DO NOTHING;
INSERT INTO public.role_permissions (org_id, role, permission_id) SELECT '00000000-0000-4000-a000-000000000001', 'admin', p.id FROM public.permissions p WHERE p.key IN ('cases.read', 'cases.write', 'cases.delete') ON CONFLICT (org_id, role, permission_id) DO NOTHING;
INSERT INTO public.role_permissions (org_id, role, permission_id) SELECT '00000000-0000-4000-a000-000000000001', 'manager', p.id FROM public.permissions p WHERE p.key IN ('cases.read', 'cases.write') ON CONFLICT (org_id, role, permission_id) DO NOTHING;
INSERT INTO public.role_permissions (org_id, role, permission_id) SELECT '00000000-0000-4000-a000-000000000001', 'agent', p.id FROM public.permissions p WHERE p.key IN ('cases.read', 'cases.write') ON CONFLICT (org_id, role, permission_id) DO NOTHING;
INSERT INTO public.role_permissions (org_id, role, permission_id) SELECT '00000000-0000-4000-a000-000000000001', 'member', p.id FROM public.permissions p WHERE p.key IN ('cases.read') ON CONFLICT (org_id, role, permission_id) DO NOTHING;
