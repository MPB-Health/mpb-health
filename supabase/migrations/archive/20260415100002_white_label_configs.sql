-- ============================================================================
-- White-Label Configuration System
-- Stores per-org branding, theming, and mobile app configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS white_label_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL UNIQUE,

    -- Branding
    company_name TEXT NOT NULL,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    app_icon_url TEXT,
    splash_screen_url TEXT,

    -- Colors
    primary_color TEXT NOT NULL DEFAULT '#1a5c5c',
    secondary_color TEXT NOT NULL DEFAULT '#2d8f6b',
    accent_color TEXT NOT NULL DEFAULT '#34d399',
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#0f2929',
    header_color TEXT,
    sidebar_color TEXT,

    -- Typography
    font_family TEXT DEFAULT 'DM Sans',
    heading_font_family TEXT DEFAULT 'Fraunces',

    -- Custom domain
    custom_domain TEXT,
    domain_verified BOOLEAN NOT NULL DEFAULT false,
    domain_verified_at TIMESTAMPTZ,
    ssl_certificate_status TEXT DEFAULT 'pending' CHECK (ssl_certificate_status IN ('pending', 'active', 'expired', 'error')),

    -- Mobile app config
    mobile_app_name TEXT,
    mobile_bundle_id_ios TEXT,
    mobile_bundle_id_android TEXT,
    app_store_url TEXT,
    play_store_url TEXT,
    mobile_build_status TEXT DEFAULT 'not_started' CHECK (mobile_build_status IN ('not_started', 'queued', 'building', 'ready', 'published', 'error')),
    last_build_at TIMESTAMPTZ,

    -- Feature toggles for white-label
    show_powered_by BOOLEAN NOT NULL DEFAULT true,
    custom_login_page BOOLEAN NOT NULL DEFAULT false,
    custom_email_templates BOOLEAN NOT NULL DEFAULT false,
    custom_sms_sender_id TEXT,

    -- SEO / metadata
    meta_title TEXT,
    meta_description TEXT,
    og_image_url TEXT,

    -- Support
    support_email TEXT,
    support_phone TEXT,
    support_url TEXT,

    -- Legal
    terms_url TEXT,
    privacy_url TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Custom email templates per white-label tenant
CREATE TABLE IF NOT EXISTS white_label_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    template_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(org_id, template_type)
);
-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "white_label_configs_read" ON white_label_configs
    FOR SELECT TO authenticated
    USING (
        org_id IN (
            SELECT om.org_id FROM org_memberships om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );
CREATE POLICY "white_label_email_templates_read" ON white_label_email_templates
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

CREATE INDEX IF NOT EXISTS idx_white_label_configs_org ON white_label_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_domain ON white_label_configs(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_white_label_email_templates_org ON white_label_email_templates(org_id);
-- ============================================================================
-- Triggers
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_white_label_configs_updated') THEN
        CREATE TRIGGER trg_white_label_configs_updated BEFORE UPDATE ON white_label_configs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_white_label_email_templates_updated') THEN
        CREATE TRIGGER trg_white_label_email_templates_updated BEFORE UPDATE ON white_label_email_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
