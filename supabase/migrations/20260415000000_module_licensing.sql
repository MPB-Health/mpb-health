-- ============================================================================
-- Module Licensing & Feature Gating System
-- Enables SaaS packaging: core modules, add-ons, and feature flags per org
-- ============================================================================

-- Product modules available in the ecosystem
CREATE TABLE IF NOT EXISTS product_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('core', 'addon', 'standalone')),

    -- Standalone means it can be purchased without the core
    is_standalone BOOLEAN NOT NULL DEFAULT false,
    -- Whether this module is included in core subscription
    included_in_core BOOLEAN NOT NULL DEFAULT false,

    -- Pricing (used when purchased as add-on)
    addon_price_monthly NUMERIC(10,2),
    addon_price_yearly NUMERIC(10,2),
    setup_fee NUMERIC(10,2) DEFAULT 0,

    -- Stripe product mapping
    stripe_product_id TEXT,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,

    -- Module metadata
    icon TEXT,
    color TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true,

    -- Dependencies (other module slugs required)
    requires_modules TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which modules each organization has access to
CREATE TABLE IF NOT EXISTS org_module_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    module_id UUID NOT NULL REFERENCES product_modules(id) ON DELETE CASCADE,

    -- License status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'suspended', 'expired', 'canceled')),

    -- Source of access (core subscription includes it, or standalone purchase)
    license_source TEXT NOT NULL DEFAULT 'addon' CHECK (license_source IN ('core_included', 'addon', 'standalone', 'trial', 'custom')),

    -- Trial info
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Billing link
    stripe_subscription_item_id TEXT,

    -- Dates
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,

    -- Limits override per org (e.g. max users for this module)
    custom_limits JSONB DEFAULT '{}',

    -- Metadata
    notes TEXT,
    granted_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(org_id, module_id)
);

-- Granular feature flags per module or plan
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,

    -- Which module this feature belongs to (NULL = global/platform feature)
    module_id UUID REFERENCES product_modules(id) ON DELETE CASCADE,

    -- Default state
    enabled_by_default BOOLEAN NOT NULL DEFAULT false,

    -- Plan tier gating (NULL = available to all tiers)
    min_plan_tier TEXT CHECK (min_plan_tier IS NULL OR min_plan_tier IN ('starter', 'professional', 'business', 'enterprise')),

    -- Feature metadata
    category TEXT,
    is_beta BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-org feature flag overrides
CREATE TABLE IF NOT EXISTS org_feature_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    feature_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL,
    reason TEXT,
    set_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(org_id, feature_id)
);

-- ============================================================================
-- Seed default product modules
-- ============================================================================

INSERT INTO product_modules (slug, name, description, category, included_in_core, is_standalone, addon_price_monthly, addon_price_yearly, icon, color, sort_order)
VALUES
    ('crm', 'CRM Platform', 'Full-featured CRM with sales pipeline, contacts, deals, email, reporting, and CRM Studio', 'core', true, false, NULL, NULL, 'BarChart3', '#2a6b8f', 1),
    ('admin-command-center', 'Admin Command Center', 'Operations center with user management, CMS, analytics, messaging, and system configuration', 'core', true, false, NULL, NULL, 'Settings', '#6b5cae', 2),
    ('advisor-portal', 'Advisor Portal', 'Field advisor command center with training, SOPs, chat, tickets, AI assistant, and bulletins', 'core', true, false, NULL, NULL, 'Award', '#2d8f6b', 3),
    ('champion-ems', 'Champion EMS', 'Enrollment Management System with multi-product enrollment, billing, commissions, and payment processing', 'addon', false, true, 299.00, 2990.00, 'ClipboardList', '#34d399', 4),
    ('itsts', 'ITSTS', 'IT Support Ticketing System with ITSM, SLA policies, workflows, knowledge base, and AI reply suggestions', 'addon', false, true, 199.00, 1990.00, 'Headphones', '#c45c3e', 5),
    ('orbit', 'Orbit', 'Project management with boards, workspaces, automation engine, tool catalog, and team collaboration', 'addon', false, true, 149.00, 1490.00, 'Orbit', '#6b5cae', 6),
    ('white-label-mobile', 'White-Label Mobile App', 'Custom-branded mobile app with member portal, push notifications, SSO, and App Store publishing', 'addon', false, false, 399.00, 3990.00, 'Smartphone', '#b8860b', 7),
    ('app-admin', 'App Admin Dashboard', 'Member and app management with analytics, push notifications, content management, and white-label configuration', 'addon', false, false, 99.00, 990.00, 'LayoutDashboard', '#1a5c5c', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Seed default feature flags
-- ============================================================================

INSERT INTO feature_flags (slug, name, description, module_id, enabled_by_default, min_plan_tier, category)
VALUES
    ('crm.studio', 'CRM Studio', 'Custom modules, fields, layouts, and views builder', (SELECT id FROM product_modules WHERE slug = 'crm'), false, 'professional', 'customization'),
    ('crm.email_sequences', 'Email Sequences', 'Automated email sequences with templates', (SELECT id FROM product_modules WHERE slug = 'crm'), false, 'professional', 'automation'),
    ('crm.ai_insights', 'AI Insights', 'AI-powered lead scoring and deal predictions', (SELECT id FROM product_modules WHERE slug = 'crm'), false, 'business', 'ai'),
    ('crm.forecasting', 'Sales Forecasting', 'Revenue forecasting and pipeline analytics', (SELECT id FROM product_modules WHERE slug = 'crm'), false, 'professional', 'analytics'),
    ('crm.cpq', 'CPQ Lite', 'Configure-price-quote with vendors and purchase orders', (SELECT id FROM product_modules WHERE slug = 'crm'), false, 'business', 'sales'),
    ('advisor.ai_assistant', 'AI Assistant', 'AI-powered advisor terminal agent', (SELECT id FROM product_modules WHERE slug = 'advisor-portal'), false, 'professional', 'ai'),
    ('advisor.gamification', 'Gamification', 'Achievements, leaderboards, and engagement scoring', (SELECT id FROM product_modules WHERE slug = 'advisor-portal'), true, NULL, 'engagement'),
    ('ems.commissions', 'Commission Engine', 'Multi-tier commission calculations and tracking', (SELECT id FROM product_modules WHERE slug = 'champion-ems'), true, NULL, 'billing'),
    ('ems.promo_codes', 'Promo Codes', 'Promotional code creation and redemption tracking', (SELECT id FROM product_modules WHERE slug = 'champion-ems'), true, NULL, 'marketing'),
    ('itsts.ai_replies', 'AI Reply Suggestions', 'AI-powered suggested replies for support agents', (SELECT id FROM product_modules WHERE slug = 'itsts'), false, 'professional', 'ai'),
    ('itsts.sla_engine', 'SLA Engine', 'Multi-level SLA policies with escalation rules', (SELECT id FROM product_modules WHERE slug = 'itsts'), true, NULL, 'operations'),
    ('orbit.automation', 'Workflow Automation', 'Board automation rules and triggers', (SELECT id FROM product_modules WHERE slug = 'orbit'), false, 'professional', 'automation'),
    ('mobile.push_notifications', 'Push Notifications', 'Targeted push notification campaigns', (SELECT id FROM product_modules WHERE slug = 'white-label-mobile'), true, NULL, 'engagement'),
    ('mobile.custom_domain', 'Custom Domain', 'Custom domain for white-label app', (SELECT id FROM product_modules WHERE slug = 'white-label-mobile'), false, 'business', 'branding'),
    ('platform.api_access', 'API Access', 'REST API access for third-party integrations', NULL, false, 'business', 'integrations'),
    ('platform.sso', 'SSO / SAML', 'Single sign-on with SAML 2.0 identity providers', NULL, false, 'enterprise', 'security'),
    ('platform.audit_logs', 'Advanced Audit Logs', 'Detailed audit logging with export and retention', NULL, false, 'professional', 'compliance'),
    ('platform.white_label_branding', 'White-Label Branding', 'Remove MPB branding, custom logos and colors', NULL, false, 'enterprise', 'branding')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Check if an org has access to a specific module
CREATE OR REPLACE FUNCTION org_has_module(p_org_id UUID, p_module_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM org_module_licenses oml
        JOIN product_modules pm ON pm.id = oml.module_id
        WHERE oml.org_id = p_org_id
          AND pm.slug = p_module_slug
          AND oml.status IN ('active', 'trialing')
          AND (oml.expires_at IS NULL OR oml.expires_at > now())
    );
END;
$$;

-- Check if an org has a specific feature enabled
CREATE OR REPLACE FUNCTION org_has_feature(p_org_id UUID, p_feature_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_feature feature_flags%ROWTYPE;
    v_override BOOLEAN;
    v_org_tier TEXT;
    v_tier_rank INT;
    v_min_rank INT;
BEGIN
    SELECT * INTO v_feature FROM feature_flags WHERE slug = p_feature_slug;
    IF NOT FOUND THEN RETURN false; END IF;

    -- Check for per-org override first
    SELECT enabled INTO v_override
    FROM org_feature_overrides
    WHERE org_id = p_org_id AND feature_id = v_feature.id;

    IF FOUND THEN RETURN v_override; END IF;

    -- If feature belongs to a module, check module access
    IF v_feature.module_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM org_module_licenses oml
            WHERE oml.org_id = p_org_id
              AND oml.module_id = v_feature.module_id
              AND oml.status IN ('active', 'trialing')
              AND (oml.expires_at IS NULL OR oml.expires_at > now())
        ) THEN
            RETURN false;
        END IF;
    END IF;

    -- Check plan tier requirement
    IF v_feature.min_plan_tier IS NOT NULL THEN
        SELECT sp.tier INTO v_org_tier
        FROM organization_subscriptions os
        JOIN subscription_plans sp ON sp.id = os.plan_id
        WHERE os.org_id = p_org_id AND os.status IN ('active', 'trialing')
        LIMIT 1;

        IF v_org_tier IS NULL THEN RETURN v_feature.enabled_by_default; END IF;

        v_tier_rank := CASE v_org_tier
            WHEN 'starter' THEN 1
            WHEN 'professional' THEN 2
            WHEN 'business' THEN 3
            WHEN 'enterprise' THEN 4
            ELSE 0
        END;

        v_min_rank := CASE v_feature.min_plan_tier
            WHEN 'starter' THEN 1
            WHEN 'professional' THEN 2
            WHEN 'business' THEN 3
            WHEN 'enterprise' THEN 4
            ELSE 0
        END;

        RETURN v_tier_rank >= v_min_rank;
    END IF;

    RETURN v_feature.enabled_by_default;
END;
$$;

-- Get all active modules for an org
CREATE OR REPLACE FUNCTION get_org_modules(p_org_id UUID)
RETURNS TABLE (
    module_slug TEXT,
    module_name TEXT,
    category TEXT,
    license_source TEXT,
    status TEXT,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pm.slug,
        pm.name,
        pm.category,
        oml.license_source,
        oml.status,
        oml.activated_at,
        oml.expires_at
    FROM org_module_licenses oml
    JOIN product_modules pm ON pm.id = oml.module_id
    WHERE oml.org_id = p_org_id
      AND oml.status IN ('active', 'trialing')
      AND (oml.expires_at IS NULL OR oml.expires_at > now())
    ORDER BY pm.sort_order;
END;
$$;

-- Get all enabled features for an org
CREATE OR REPLACE FUNCTION get_org_features(p_org_id UUID)
RETURNS TABLE (
    feature_slug TEXT,
    feature_name TEXT,
    category TEXT,
    source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ff.slug,
        ff.name,
        ff.category,
        CASE
            WHEN ofo.id IS NOT NULL THEN 'override'
            WHEN ff.enabled_by_default THEN 'default'
            ELSE 'plan_tier'
        END AS source
    FROM feature_flags ff
    LEFT JOIN org_feature_overrides ofo ON ofo.feature_id = ff.id AND ofo.org_id = p_org_id
    WHERE org_has_feature(p_org_id, ff.slug) = true
    ORDER BY ff.slug;
END;
$$;

-- Activate a module for an org
CREATE OR REPLACE FUNCTION activate_module_for_org(
    p_org_id UUID,
    p_module_slug TEXT,
    p_license_source TEXT DEFAULT 'addon',
    p_trial_days INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_module_id UUID;
    v_license_id UUID;
    v_status TEXT := 'active';
    v_trial_start TIMESTAMPTZ;
    v_trial_end TIMESTAMPTZ;
BEGIN
    SELECT id INTO v_module_id FROM product_modules WHERE slug = p_module_slug AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Module % not found or inactive', p_module_slug;
    END IF;

    IF p_trial_days IS NOT NULL THEN
        v_status := 'trialing';
        v_trial_start := now();
        v_trial_end := now() + (p_trial_days || ' days')::INTERVAL;
    END IF;

    INSERT INTO org_module_licenses (org_id, module_id, status, license_source, trial_start, trial_end)
    VALUES (p_org_id, v_module_id, v_status, p_license_source, v_trial_start, v_trial_end)
    ON CONFLICT (org_id, module_id) DO UPDATE SET
        status = EXCLUDED.status,
        license_source = EXCLUDED.license_source,
        trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        activated_at = now(),
        updated_at = now()
    RETURNING id INTO v_license_id;

    RETURN v_license_id;
END;
$$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE product_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_module_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Product modules are readable by all authenticated users
CREATE POLICY "product_modules_read" ON product_modules
    FOR SELECT TO authenticated
    USING (is_active = true AND is_public = true);

-- Org module licenses visible to org members
CREATE POLICY "org_module_licenses_read" ON org_module_licenses
    FOR SELECT TO authenticated
    USING (
        org_id IN (
            SELECT om.org_id FROM org_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- Feature flags readable by all authenticated users
CREATE POLICY "feature_flags_read" ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

-- Org feature overrides visible to org members
CREATE POLICY "org_feature_overrides_read" ON org_feature_overrides
    FOR SELECT TO authenticated
    USING (
        org_id IN (
            SELECT om.org_id FROM org_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_module_licenses_org ON org_module_licenses(org_id);
CREATE INDEX IF NOT EXISTS idx_org_module_licenses_module ON org_module_licenses(module_id);
CREATE INDEX IF NOT EXISTS idx_org_module_licenses_status ON org_module_licenses(status);
CREATE INDEX IF NOT EXISTS idx_feature_flags_module ON feature_flags(module_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_slug ON feature_flags(slug);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org ON org_feature_overrides(org_id);

-- ============================================================================
-- Updated-at triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_modules_updated') THEN
        CREATE TRIGGER trg_product_modules_updated BEFORE UPDATE ON product_modules
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_org_module_licenses_updated') THEN
        CREATE TRIGGER trg_org_module_licenses_updated BEFORE UPDATE ON org_module_licenses
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_feature_flags_updated') THEN
        CREATE TRIGGER trg_feature_flags_updated BEFORE UPDATE ON feature_flags
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_org_feature_overrides_updated') THEN
        CREATE TRIGGER trg_org_feature_overrides_updated BEFORE UPDATE ON org_feature_overrides
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
