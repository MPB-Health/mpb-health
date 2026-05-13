-- =====================================================
-- Phase 8: Reports, Email/Comm, Settings Completion
-- =====================================================

-- =====================================================
-- SECTION 1: SAVED REPORTS ENGINE
-- =====================================================

-- Saved report configurations (filters/templates)
CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- 'conversion_funnel', 'lead_sources', 'team_performance', 'interaction', 'custom'
    filters JSONB DEFAULT '{}', -- Saved filter configuration
    columns JSONB DEFAULT '[]', -- Selected columns for display
    sort_config JSONB DEFAULT '{}', -- Sort settings
    chart_config JSONB DEFAULT '{}', -- Chart visualization settings
    is_default BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false, -- Shared with org
    schedule_config JSONB, -- Optional scheduling: {frequency, recipients, format}
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Report export archive
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    saved_report_id UUID REFERENCES saved_reports(id) ON DELETE SET NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    export_format VARCHAR(20) NOT NULL, -- 'csv', 'xlsx', 'pdf'
    file_path TEXT, -- Storage path
    file_size_bytes BIGINT,
    row_count INTEGER,
    filters_used JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    exported_by UUID REFERENCES auth.users(id),
    exported_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
-- User presence tracking (online now)
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'online', -- 'online', 'away', 'busy', 'offline'
    current_page TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    session_started_at TIMESTAMPTZ DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(user_id)
);
-- Member/Agent interaction tracking
CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    member_id UUID,
    agent_id UUID REFERENCES auth.users(id),
    interaction_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'chat', 'meeting', 'note'
    direction VARCHAR(20), -- 'inbound', 'outbound'
    subject TEXT,
    summary TEXT,
    duration_seconds INTEGER,
    outcome VARCHAR(50), -- 'completed', 'no_answer', 'voicemail', 'callback_requested'
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- SECTION 2: EMAIL SCHEDULING & TRACKING
-- =====================================================

-- Email schedules
CREATE TABLE IF NOT EXISTS email_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES crm_templates(id) ON DELETE SET NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'leads', 'members', 'agents', 'custom'
    recipient_filter JSONB DEFAULT '{}', -- Filter criteria for recipients
    recipient_list JSONB DEFAULT '[]', -- Explicit list of recipient IDs
    schedule_type VARCHAR(50) NOT NULL, -- 'once', 'daily', 'weekly', 'monthly', 'custom'
    schedule_config JSONB NOT NULL, -- {time, timezone, days_of_week, day_of_month, etc}
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'failed'
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Email tracking (opens, clicks)
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_log_id UUID REFERENCES crm_email_log(id) ON DELETE CASCADE,
    tracking_type VARCHAR(20) NOT NULL, -- 'open', 'click'
    link_url TEXT, -- For click tracking
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    location_country VARCHAR(2),
    location_city VARCHAR(100),
    tracked_at TIMESTAMPTZ DEFAULT now()
);
-- Add tracking columns to email log if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'crm_email_log' AND column_name = 'tracking_id') THEN
        ALTER TABLE crm_email_log ADD COLUMN tracking_id UUID DEFAULT gen_random_uuid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'crm_email_log' AND column_name = 'open_count') THEN
        ALTER TABLE crm_email_log ADD COLUMN open_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'crm_email_log' AND column_name = 'click_count') THEN
        ALTER TABLE crm_email_log ADD COLUMN click_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'crm_email_log' AND column_name = 'first_opened_at') THEN
        ALTER TABLE crm_email_log ADD COLUMN first_opened_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'crm_email_log' AND column_name = 'last_opened_at') THEN
        ALTER TABLE crm_email_log ADD COLUMN last_opened_at TIMESTAMPTZ;
    END IF;
END $$;
-- =====================================================
-- SECTION 3: SETTINGS - PAYMENT PROCESSORS
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_processors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'square', 'paypal', 'authorize_net', 'braintree'
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- Encrypted API keys, merchant IDs, etc.
    supported_methods JSONB DEFAULT '["card"]', -- 'card', 'ach', 'apple_pay', 'google_pay'
    fee_structure JSONB DEFAULT '{}', -- {percentage, flat_fee, monthly_fee}
    webhook_url TEXT,
    webhook_secret TEXT,
    last_transaction_at TIMESTAMPTZ,
    total_processed NUMERIC(12,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- SECTION 4: SETTINGS - SMS ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'twilio', 'vonage', 'plivo', 'messagebird'
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- API credentials
    phone_numbers JSONB DEFAULT '[]', -- List of phone numbers
    monthly_limit INTEGER,
    current_month_sent INTEGER DEFAULT 0,
    webhook_url TEXT,
    last_message_at TIMESTAMPTZ,
    total_sent INTEGER DEFAULT 0,
    total_received INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- SMS message log
CREATE TABLE IF NOT EXISTS sms_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    sms_account_id UUID REFERENCES sms_accounts(id) ON DELETE SET NULL,
    template_id UUID REFERENCES crm_templates(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL, -- 'outbound', 'inbound'
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'received'
    provider_message_id TEXT,
    error_message TEXT,
    segments INTEGER DEFAULT 1,
    cost NUMERIC(8,4),
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ
);
-- =====================================================
-- SECTION 5: SETTINGS - PROMO CODES
-- =====================================================

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed', 'free_months'
    discount_value NUMERIC(10,2) NOT NULL,
    applies_to JSONB DEFAULT '["all"]', -- Product/plan IDs or 'all'
    min_purchase_amount NUMERIC(10,2),
    max_discount_amount NUMERIC(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    stackable BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, code)
);
-- Promo code usage tracking
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    member_id UUID,
    order_id UUID,
    discount_applied NUMERIC(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- SECTION 6: SETTINGS - CODE INVENTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS code_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    code_type VARCHAR(50) NOT NULL, -- 'enrollment', 'referral', 'activation', 'voucher'
    code VARCHAR(100) NOT NULL,
    batch_id UUID, -- For batch-generated codes
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'assigned', 'used', 'expired', 'revoked'
    value NUMERIC(10,2), -- Monetary value if applicable
    assigned_to_user UUID REFERENCES auth.users(id),
    assigned_to_member UUID,
    assigned_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, code_type, code)
);
-- Code batches for bulk generation
CREATE TABLE IF NOT EXISTS code_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20),
    total_codes INTEGER NOT NULL,
    codes_used INTEGER DEFAULT 0,
    value_per_code NUMERIC(10,2),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- SECTION 7: SETTINGS - RESOURCES
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'document', 'template', 'guide', 'video', 'link'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT,
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    external_url TEXT,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    access_roles JSONB DEFAULT '["admin"]', -- Roles that can access
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- SECTION 8: SETTINGS - E-SIGNATURE
-- =====================================================

CREATE TABLE IF NOT EXISTS esignature_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'docusign', 'hellosign', 'adobe_sign', 'pandadoc'
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- API credentials, account info
    webhook_url TEXT,
    templates_synced INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- E-signature documents
CREATE TABLE IF NOT EXISTS esignature_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES esignature_providers(id) ON DELETE SET NULL,
    external_document_id TEXT,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'signed', 'completed', 'declined', 'voided'
    signers JSONB DEFAULT '[]', -- [{email, name, status, signed_at}]
    document_type VARCHAR(50), -- 'enrollment', 'agreement', 'amendment', 'consent'
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    signed_document_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- SECTION 9: PERMISSION DEFINITIONS
-- =====================================================

-- Insert permission definitions
INSERT INTO permissions (key, module, description) VALUES
-- Reports permissions
('reports.read', 'reports', 'View reports and analytics'),
('reports.export', 'reports', 'Export reports to CSV/Excel/PDF'),
('reports.create', 'reports', 'Create and save custom reports'),
('reports.manage', 'reports', 'Manage saved reports and schedules'),
-- Email permissions
('email.read', 'email', 'View email logs and history'),
('email.send', 'email', 'Send emails to members and agents'),
('email.templates', 'email', 'Manage email templates'),
('email.schedules', 'email', 'Manage email schedules'),
('email.bulk', 'email', 'Send bulk emails'),
-- SMS permissions
('sms.read', 'sms', 'View SMS logs and history'),
('sms.send', 'sms', 'Send SMS messages'),
('sms.templates', 'sms', 'Manage SMS templates'),
-- Settings permissions
('settings.view', 'settings', 'View system settings'),
('settings.admin', 'settings', 'Manage all system settings'),
('settings.payment', 'settings', 'Manage payment processor settings'),
('settings.sms', 'settings', 'Manage SMS account settings'),
('settings.esignature', 'settings', 'Manage e-signature settings'),
('settings.codes', 'settings', 'Manage promo codes and inventory'),
('settings.resources', 'settings', 'Manage admin resources')
ON CONFLICT (key) DO NOTHING;
-- Assign permissions to roles
INSERT INTO role_permissions (org_id, role, permission_id)
SELECT o.id, r.role, p.id
FROM orgs o
CROSS JOIN (VALUES ('owner'), ('admin')) AS r(role)
CROSS JOIN permissions p
WHERE p.module IN ('reports', 'email', 'sms', 'settings')
ON CONFLICT DO NOTHING;
-- Manager gets read + limited permissions
INSERT INTO role_permissions (org_id, role, permission_id)
SELECT o.id, 'manager', p.id
FROM orgs o
CROSS JOIN permissions p
WHERE p.key IN ('reports.read', 'reports.export', 'email.read', 'email.send', 'email.templates', 'sms.read', 'sms.send', 'settings.view')
ON CONFLICT DO NOTHING;
-- Agent gets minimal permissions
INSERT INTO role_permissions (org_id, role, permission_id)
SELECT o.id, 'agent', p.id
FROM orgs o
CROSS JOIN permissions p
WHERE p.key IN ('reports.read', 'email.read', 'email.send', 'sms.read', 'sms.send')
ON CONFLICT DO NOTHING;
-- =====================================================
-- SECTION 10: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_saved_reports_org ON saved_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON saved_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_saved_reports_created_by ON saved_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_report_exports_org ON report_exports(org_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_exported_at ON report_exports(exported_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_org ON user_presence(org_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity ON user_presence(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_org ON interaction_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_member ON interaction_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_agent ON interaction_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created ON interaction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_schedules_org ON email_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_email_schedules_status ON email_schedules(status);
CREATE INDEX IF NOT EXISTS idx_email_schedules_next_run ON email_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_log ON email_tracking(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking(tracking_type);
CREATE INDEX IF NOT EXISTS idx_payment_processors_org ON payment_processors(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_org ON sms_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_org ON sms_log(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_at ON sms_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_codes_org ON promo_codes(org_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_code_inventory_org ON code_inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_code_inventory_status ON code_inventory(status);
CREATE INDEX IF NOT EXISTS idx_code_inventory_type ON code_inventory(code_type);
CREATE INDEX IF NOT EXISTS idx_admin_resources_org ON admin_resources(org_id);
CREATE INDEX IF NOT EXISTS idx_admin_resources_category ON admin_resources(category);
CREATE INDEX IF NOT EXISTS idx_esignature_providers_org ON esignature_providers(org_id);
CREATE INDEX IF NOT EXISTS idx_esignature_documents_org ON esignature_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_esignature_documents_status ON esignature_documents(status);
-- =====================================================
-- SECTION 11: RLS POLICIES
-- =====================================================

ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE esignature_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE esignature_documents ENABLE ROW LEVEL SECURITY;
-- Generic org-based policies for authenticated users
CREATE POLICY "Users can access their org saved_reports" ON saved_reports
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org report_exports" ON report_exports
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org user_presence" ON user_presence
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org interaction_logs" ON interaction_logs
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org email_schedules" ON email_schedules
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access email_tracking for their emails" ON email_tracking
    FOR ALL USING (email_log_id IN (
        SELECT id FROM crm_email_log WHERE org_id IN (
            SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
        )
    ));
CREATE POLICY "Users can access their org payment_processors" ON payment_processors
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org sms_accounts" ON sms_accounts
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org sms_log" ON sms_log
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org promo_codes" ON promo_codes
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access promo_code_usage" ON promo_code_usage
    FOR ALL USING (promo_code_id IN (
        SELECT id FROM promo_codes WHERE org_id IN (
            SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
        )
    ));
CREATE POLICY "Users can access their org code_inventory" ON code_inventory
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org code_batches" ON code_batches
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org admin_resources" ON admin_resources
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org esignature_providers" ON esignature_providers
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Users can access their org esignature_documents" ON esignature_documents
    FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));
-- =====================================================
-- SECTION 12: TRIGGER FUNCTIONS
-- =====================================================

-- Update presence on activity
CREATE OR REPLACE FUNCTION update_user_presence()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_user_presence
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence();
-- Increment email tracking counters
CREATE OR REPLACE FUNCTION increment_email_tracking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_type = 'open' THEN
        UPDATE crm_email_log
        SET open_count = open_count + 1,
            first_opened_at = COALESCE(first_opened_at, NEW.tracked_at),
            last_opened_at = NEW.tracked_at
        WHERE id = NEW.email_log_id;
    ELSIF NEW.tracking_type = 'click' THEN
        UPDATE crm_email_log
        SET click_count = click_count + 1
        WHERE id = NEW.email_log_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_increment_email_tracking
    AFTER INSERT ON email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION increment_email_tracking();
-- Increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE promo_codes
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = NEW.promo_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_increment_promo_usage
    AFTER INSERT ON promo_code_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_promo_usage();
-- Update schedule stats after email send
CREATE OR REPLACE FUNCTION update_schedule_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
        -- Check if this email was from a schedule (would need schedule_id column)
        -- For now, this is a placeholder for future enhancement
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
