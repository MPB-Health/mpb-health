-- CRM Saved Views for built-in modules (applied to dtmnkzllidaiqyheguhl)
CREATE TABLE IF NOT EXISTS public.crm_saved_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    sort_field TEXT,
    sort_direction TEXT DEFAULT 'desc' CHECK (sort_direction IN ('asc', 'desc')),
    columns JSONB,
    is_default BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, module, name, owner_id)
);
