-- CRM Documents Vault (applied to dtmnkzllidaiqyheguhl)
-- See migration crm_documents_vault for full SQL
CREATE TABLE IF NOT EXISTS public.crm_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'contract', 'proposal', 'invoice', 'report', 'other')),
    entity_type TEXT,
    entity_id UUID,
    folder TEXT,
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
