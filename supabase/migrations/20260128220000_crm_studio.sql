-- ============================================================================
-- CRM STUDIO: Custom Modules, Fields, Layouts, Views, Validation Rules
-- Migration: 20260128220000_crm_studio.sql
-- ============================================================================

-- Custom Modules Registry
CREATE TABLE public.crm_studio_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Module Identity
    name TEXT NOT NULL,                    -- "Service Tickets"
    api_name TEXT NOT NULL,                -- "service_tickets" (used for table name)
    plural_name TEXT NOT NULL,             -- "Service Tickets"
    singular_name TEXT NOT NULL,           -- "Service Ticket"
    description TEXT,
    icon TEXT DEFAULT 'FileText',          -- Lucide icon name
    color TEXT DEFAULT 'blue',             -- Theme color

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,       -- Built-in modules can't be deleted
    allow_activities BOOLEAN DEFAULT true,
    allow_notes BOOLEAN DEFAULT true,
    allow_attachments BOOLEAN DEFAULT true,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(org_id, api_name)
);
-- Custom Fields
CREATE TABLE public.crm_studio_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES crm_studio_modules(id) ON DELETE CASCADE,

    -- Field Identity
    label TEXT NOT NULL,                   -- "Priority Level"
    api_name TEXT NOT NULL,                -- "priority_level"

    -- Field Type (enum)
    field_type TEXT NOT NULL CHECK (field_type IN (
        'text', 'textarea', 'number', 'decimal', 'currency', 'percent',
        'email', 'phone', 'url', 'date', 'datetime',
        'checkbox', 'picklist', 'multi_picklist',
        'lookup', 'multi_lookup', 'formula', 'auto_number'
    )),

    -- Field Configuration
    is_required BOOLEAN DEFAULT false,
    is_unique BOOLEAN DEFAULT false,
    is_searchable BOOLEAN DEFAULT true,
    is_filterable BOOLEAN DEFAULT true,
    default_value TEXT,
    help_text TEXT,
    placeholder TEXT,

    -- Type-Specific Config (JSONB)
    config JSONB DEFAULT '{}',
    -- For picklist: { "options": [{"value": "low", "label": "Low", "color": "green"}, ...] }
    -- For lookup: { "target_module": "crm_accounts", "display_field": "name", "allow_create": true }
    -- For formula: { "expression": "{amount} * {quantity}", "result_type": "currency" }
    -- For number: { "min": 0, "max": 100, "precision": 2 }
    -- For auto_number: { "prefix": "TKT-", "start": 1000, "padding": 5 }

    -- Display Order
    sort_order INT DEFAULT 0,

    -- System Field Flags
    is_system BOOLEAN DEFAULT false,       -- Name, Owner, Created are system fields
    is_name_field BOOLEAN DEFAULT false,   -- The primary display field

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(module_id, api_name)
);
-- Layouts (Form configurations)
CREATE TABLE public.crm_studio_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES crm_studio_modules(id) ON DELETE CASCADE,

    -- Layout Identity
    name TEXT NOT NULL,                    -- "Default", "Quick Create", "Mobile"
    api_name TEXT NOT NULL,
    layout_type TEXT NOT NULL CHECK (layout_type IN ('create', 'edit', 'view', 'quick_create')),

    -- Layout Definition (JSONB)
    sections JSONB NOT NULL DEFAULT '[]',
    -- [
    --   {
    --     "name": "Basic Information",
    --     "columns": 2,
    --     "collapsed": false,
    --     "fields": [
    --       { "field_id": "uuid", "read_only": false, "span": 1 },
    --       { "field_id": "uuid", "read_only": true, "span": 2 }
    --     ]
    --   }
    -- ]

    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(module_id, api_name)
);
-- Saved Views (List configurations)
CREATE TABLE public.crm_studio_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES crm_studio_modules(id) ON DELETE CASCADE,

    -- View Identity
    name TEXT NOT NULL,                    -- "My Open Tickets", "All High Priority"

    -- Column Configuration
    columns JSONB NOT NULL DEFAULT '[]',
    -- [
    --   { "field_id": "uuid", "width": 200, "sortable": true },
    --   { "field_id": "uuid", "width": 150, "sortable": false }
    -- ]

    -- Filter Criteria
    filters JSONB DEFAULT '[]',
    -- [
    --   { "field_id": "uuid", "operator": "equals", "value": "open" },
    --   { "field_id": "uuid", "operator": "greater_than", "value": "2024-01-01" }
    -- ]

    -- Sort Configuration
    sort_field_id UUID REFERENCES crm_studio_fields(id),
    sort_direction TEXT DEFAULT 'desc' CHECK (sort_direction IN ('asc', 'desc')),

    -- Sharing
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'org')),
    owner_id UUID REFERENCES auth.users(id),

    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Validation Rules
CREATE TABLE public.crm_studio_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES crm_studio_modules(id) ON DELETE CASCADE,

    -- Rule Identity
    name TEXT NOT NULL,                    -- "Amount must be positive"
    description TEXT,

    -- Rule Definition
    conditions JSONB NOT NULL DEFAULT '[]',
    -- [
    --   { "field_id": "uuid", "operator": "less_than", "value": 0 }
    -- ]
    -- Operators: equals, not_equals, contains, not_contains, starts_with, ends_with,
    --            greater_than, less_than, greater_or_equal, less_or_equal,
    --            is_empty, is_not_empty, in, not_in

    condition_logic TEXT DEFAULT 'AND',    -- 'AND' or 'OR' for multiple conditions

    -- Error Message
    error_message TEXT NOT NULL,           -- "Amount must be greater than 0"
    error_field_id UUID REFERENCES crm_studio_fields(id), -- Which field to show error on

    -- When to run
    run_on_create BOOLEAN DEFAULT true,
    run_on_update BOOLEAN DEFAULT true,

    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_studio_modules_org ON crm_studio_modules(org_id);
CREATE INDEX idx_studio_modules_api_name ON crm_studio_modules(org_id, api_name);
CREATE INDEX idx_studio_modules_active ON crm_studio_modules(org_id, is_active);
CREATE INDEX idx_studio_fields_module ON crm_studio_fields(module_id);
CREATE INDEX idx_studio_fields_org ON crm_studio_fields(org_id);
CREATE INDEX idx_studio_fields_api_name ON crm_studio_fields(module_id, api_name);
CREATE INDEX idx_studio_fields_sort ON crm_studio_fields(module_id, sort_order);
CREATE INDEX idx_studio_layouts_module ON crm_studio_layouts(module_id);
CREATE INDEX idx_studio_layouts_org ON crm_studio_layouts(org_id);
CREATE INDEX idx_studio_layouts_type ON crm_studio_layouts(module_id, layout_type);
CREATE INDEX idx_studio_layouts_default ON crm_studio_layouts(module_id, layout_type, is_default);
CREATE INDEX idx_studio_views_module ON crm_studio_views(module_id);
CREATE INDEX idx_studio_views_org ON crm_studio_views(org_id);
CREATE INDEX idx_studio_views_owner ON crm_studio_views(owner_id);
CREATE INDEX idx_studio_views_visibility ON crm_studio_views(module_id, visibility);
CREATE INDEX idx_studio_validation_module ON crm_studio_validation_rules(module_id);
CREATE INDEX idx_studio_validation_org ON crm_studio_validation_rules(org_id);
CREATE INDEX idx_studio_validation_active ON crm_studio_validation_rules(module_id, is_active);
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE crm_studio_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_studio_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_studio_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_studio_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_studio_validation_rules ENABLE ROW LEVEL SECURITY;
-- Org-scoped access for modules
CREATE POLICY "studio_modules_org_access" ON crm_studio_modules
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
-- Org-scoped access for fields
CREATE POLICY "studio_fields_org_access" ON crm_studio_fields
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
-- Org-scoped access for layouts
CREATE POLICY "studio_layouts_org_access" ON crm_studio_layouts
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
-- Views: org-scoped with visibility filtering
CREATE POLICY "studio_views_org_access" ON crm_studio_views
    FOR ALL USING (
        org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
        AND (
            visibility = 'org'
            OR visibility = 'team'
            OR owner_id = auth.uid()
            OR created_by = auth.uid()
        )
    );
-- Org-scoped access for validation rules
CREATE POLICY "studio_validation_org_access" ON crm_studio_validation_rules
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Generate permission keys for module
CREATE OR REPLACE FUNCTION generate_module_permissions(p_module_api_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN ARRAY[
        p_module_api_name || '.read',
        p_module_api_name || '.write',
        p_module_api_name || '.delete',
        p_module_api_name || '.export'
    ];
END;
$$;
-- Function: Create custom module table dynamically
-- This creates a dedicated table for each custom module with proper RLS
CREATE OR REPLACE FUNCTION create_custom_module_table(
    p_org_id UUID,
    p_api_name TEXT,
    p_fields JSONB  -- Array of field definitions
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name TEXT;
    field_record JSONB;
    sql_columns TEXT := '';
    sql_create TEXT;
    field_api_name TEXT;
    field_type TEXT;
    column_type TEXT;
BEGIN
    -- Table name: crm_custom_{org_id_short}_{api_name}
    table_name := 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;

    -- Build column definitions from fields
    FOR field_record IN SELECT * FROM jsonb_array_elements(p_fields)
    LOOP
        field_api_name := field_record->>'api_name';
        field_type := field_record->>'field_type';

        -- Map field types to PostgreSQL types
        column_type := CASE field_type
            WHEN 'text' THEN 'TEXT'
            WHEN 'textarea' THEN 'TEXT'
            WHEN 'number' THEN 'INTEGER'
            WHEN 'decimal' THEN 'DECIMAL(15,2)'
            WHEN 'currency' THEN 'DECIMAL(15,2)'
            WHEN 'percent' THEN 'DECIMAL(5,2)'
            WHEN 'email' THEN 'TEXT'
            WHEN 'phone' THEN 'TEXT'
            WHEN 'url' THEN 'TEXT'
            WHEN 'date' THEN 'DATE'
            WHEN 'datetime' THEN 'TIMESTAMPTZ'
            WHEN 'checkbox' THEN 'BOOLEAN DEFAULT false'
            WHEN 'picklist' THEN 'TEXT'
            WHEN 'multi_picklist' THEN 'TEXT[]'
            WHEN 'lookup' THEN 'UUID'
            WHEN 'multi_lookup' THEN 'UUID[]'
            WHEN 'auto_number' THEN 'TEXT'
            ELSE 'TEXT'
        END;

        sql_columns := sql_columns || ', ' || quote_ident(field_api_name) || ' ' || column_type;
    END LOOP;

    -- Create table with standard columns plus custom fields
    sql_create := format(
        'CREATE TABLE IF NOT EXISTS public.%I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            owner_id UUID REFERENCES auth.users(id),
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
            %s
        )',
        table_name, sql_columns
    );

    EXECUTE sql_create;

    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    -- Create RLS policy for org access
    EXECUTE format(
        'CREATE POLICY %I ON public.%I
         FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()))',
        table_name || '_org_access', table_name
    );

    -- Create org_id index
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (org_id)',
        'idx_' || table_name || '_org', table_name);

    -- Create name index for searching
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (org_id, name)',
        'idx_' || table_name || '_name', table_name);

    -- Create owner index
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (owner_id)',
        'idx_' || table_name || '_owner', table_name);
END;
$$;
-- Function: Add column to existing custom module table
CREATE OR REPLACE FUNCTION add_custom_module_column(
    p_org_id UUID,
    p_api_name TEXT,
    p_field_api_name TEXT,
    p_field_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name TEXT;
    column_type TEXT;
BEGIN
    table_name := 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;

    column_type := CASE p_field_type
        WHEN 'text' THEN 'TEXT'
        WHEN 'textarea' THEN 'TEXT'
        WHEN 'number' THEN 'INTEGER'
        WHEN 'decimal' THEN 'DECIMAL(15,2)'
        WHEN 'currency' THEN 'DECIMAL(15,2)'
        WHEN 'percent' THEN 'DECIMAL(5,2)'
        WHEN 'email' THEN 'TEXT'
        WHEN 'phone' THEN 'TEXT'
        WHEN 'url' THEN 'TEXT'
        WHEN 'date' THEN 'DATE'
        WHEN 'datetime' THEN 'TIMESTAMPTZ'
        WHEN 'checkbox' THEN 'BOOLEAN DEFAULT false'
        WHEN 'picklist' THEN 'TEXT'
        WHEN 'multi_picklist' THEN 'TEXT[]'
        WHEN 'lookup' THEN 'UUID'
        WHEN 'multi_lookup' THEN 'UUID[]'
        WHEN 'auto_number' THEN 'TEXT'
        ELSE 'TEXT'
    END;

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s',
        table_name, p_field_api_name, column_type);
END;
$$;
-- Function: Drop custom module table
CREATE OR REPLACE FUNCTION drop_custom_module_table(
    p_org_id UUID,
    p_api_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name TEXT;
BEGIN
    table_name := 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;

    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
END;
$$;
-- Function: Get custom module table name
CREATE OR REPLACE FUNCTION get_custom_module_table_name(
    p_org_id UUID,
    p_api_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;
END;
$$;
-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function (reuse if exists, otherwise create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
-- Apply updated_at triggers
CREATE TRIGGER update_crm_studio_modules_updated_at
    BEFORE UPDATE ON crm_studio_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_studio_fields_updated_at
    BEFORE UPDATE ON crm_studio_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_studio_layouts_updated_at
    BEFORE UPDATE ON crm_studio_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_studio_views_updated_at
    BEFORE UPDATE ON crm_studio_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_studio_validation_rules_updated_at
    BEFORE UPDATE ON crm_studio_validation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE crm_studio_modules IS 'Registry of custom CRM modules created via Studio';
COMMENT ON TABLE crm_studio_fields IS 'Custom field definitions for Studio modules';
COMMENT ON TABLE crm_studio_layouts IS 'Form layout configurations for Studio modules';
COMMENT ON TABLE crm_studio_views IS 'Saved list views with filters and column configs';
COMMENT ON TABLE crm_studio_validation_rules IS 'Server-side validation rules for custom modules';
COMMENT ON FUNCTION create_custom_module_table IS 'Creates a dedicated PostgreSQL table for a custom module with RLS';
COMMENT ON FUNCTION add_custom_module_column IS 'Adds a new column to an existing custom module table';
COMMENT ON FUNCTION drop_custom_module_table IS 'Drops a custom module table (use with caution)';
COMMENT ON FUNCTION get_custom_module_table_name IS 'Returns the table name for a custom module';
COMMENT ON FUNCTION generate_module_permissions IS 'Generates permission keys for a custom module';
