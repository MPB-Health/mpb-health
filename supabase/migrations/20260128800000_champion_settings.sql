-- ============================================================================
-- Champion Advisor OS — Phase 5: Settings & Admin
-- ============================================================================

-- ============================================================================
-- ORGANIZATION SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#8B5CF6',

    -- Business Info
    business_name TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_address JSONB,
    website_url TEXT,

    -- Defaults
    default_timezone TEXT DEFAULT 'America/New_York',
    default_language TEXT DEFAULT 'en',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    time_format TEXT DEFAULT '12h', -- '12h' or '24h'
    currency TEXT DEFAULT 'USD',

    -- Business Hours (JSON array of day configs)
    business_hours JSONB DEFAULT '[
        {"day": 0, "enabled": false},
        {"day": 1, "enabled": true, "start": "09:00", "end": "17:00"},
        {"day": 2, "enabled": true, "start": "09:00", "end": "17:00"},
        {"day": 3, "enabled": true, "start": "09:00", "end": "17:00"},
        {"day": 4, "enabled": true, "start": "09:00", "end": "17:00"},
        {"day": 5, "enabled": true, "start": "09:00", "end": "17:00"},
        {"day": 6, "enabled": false}
    ]',

    -- Features
    features_enabled JSONB DEFAULT '{}',

    -- Messaging defaults
    default_sms_sender_id TEXT,
    default_email_from_name TEXT,
    default_email_from_address TEXT,
    email_signature TEXT,

    -- Compliance
    require_message_approval BOOLEAN DEFAULT false,
    message_disclaimer TEXT,
    hipaa_mode BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id)
);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Display
    theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
    sidebar_collapsed BOOLEAN DEFAULT false,
    compact_mode BOOLEAN DEFAULT false,
    timezone TEXT, -- Override org default
    language TEXT, -- Override org default

    -- Dashboard
    dashboard_layout JSONB DEFAULT '{}',
    pinned_items JSONB DEFAULT '[]',

    -- Power List
    default_lane_id UUID,
    power_list_view TEXT DEFAULT 'cards', -- 'cards', 'list', 'kanban'
    auto_advance_after_complete BOOLEAN DEFAULT true,

    -- Inbox
    inbox_preview_lines INTEGER DEFAULT 2,
    inbox_group_by TEXT DEFAULT 'none', -- 'none', 'lead', 'channel'
    inbox_sort_order TEXT DEFAULT 'newest', -- 'newest', 'oldest', 'unread'

    -- Keyboard shortcuts enabled
    keyboard_shortcuts_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, org_id)
);

-- ============================================================================
-- NOTIFICATION SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Email notifications
    email_enabled BOOLEAN DEFAULT true,
    email_new_lead BOOLEAN DEFAULT true,
    email_new_message BOOLEAN DEFAULT true,
    email_task_reminder BOOLEAN DEFAULT true,
    email_compliance_alert BOOLEAN DEFAULT true,
    email_weekly_digest BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,

    -- SMS notifications
    sms_enabled BOOLEAN DEFAULT false,
    sms_phone_number TEXT,
    sms_urgent_only BOOLEAN DEFAULT true,

    -- Push notifications
    push_enabled BOOLEAN DEFAULT true,
    push_new_lead BOOLEAN DEFAULT true,
    push_new_message BOOLEAN DEFAULT true,
    push_task_reminder BOOLEAN DEFAULT true,

    -- In-app notifications
    in_app_enabled BOOLEAN DEFAULT true,
    in_app_sound BOOLEAN DEFAULT true,
    in_app_desktop BOOLEAN DEFAULT true,

    -- Digest settings
    digest_frequency TEXT DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
    digest_time TEXT DEFAULT '09:00',
    digest_day INTEGER DEFAULT 1, -- For weekly: 0=Sun, 1=Mon, etc.

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '08:00',
    quiet_hours_timezone TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, org_id)
);

-- ============================================================================
-- INTEGRATION CONFIGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Integration info
    integration_type TEXT NOT NULL, -- 'crm', 'email', 'sms', 'calendar', 'storage', 'webhook'
    provider TEXT NOT NULL, -- 'salesforce', 'hubspot', 'twilio', 'sendgrid', etc.
    name TEXT NOT NULL,
    description TEXT,

    -- Status
    is_enabled BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,

    -- Configuration (encrypted sensitive data should use vault)
    config JSONB NOT NULL DEFAULT '{}',

    -- OAuth tokens (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Webhook config
    webhook_url TEXT,
    webhook_secret TEXT,

    -- Sync settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 60,
    sync_direction TEXT DEFAULT 'both', -- 'inbound', 'outbound', 'both'

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id, provider)
);

-- ============================================================================
-- API KEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Key info
    name TEXT NOT NULL,
    description TEXT,
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    key_hash TEXT NOT NULL, -- Hashed full key

    -- Permissions
    scopes TEXT[] DEFAULT '{}', -- 'read:leads', 'write:messages', etc.

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,

    -- Limits
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,

    -- Expiration
    expires_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================================================
-- ORGANIZATION INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Invitation details
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    message TEXT,

    -- Token
    token TEXT NOT NULL UNIQUE,
    token_expires_at TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'revoked'
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id),

    invited_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organization settings: members can read, admins can write
CREATE POLICY "Org members can view settings" ON organization_settings
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage settings" ON organization_settings
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- User preferences: users can manage their own
CREATE POLICY "Users can manage their preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Notification settings: users can manage their own
CREATE POLICY "Users can manage their notifications" ON notification_settings
    FOR ALL USING (user_id = auth.uid());

-- Integration configs: admins only
CREATE POLICY "Admins can manage integrations" ON integration_configs
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- API keys: admins can manage
CREATE POLICY "Admins can manage API keys" ON api_keys
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Invitations: admins can manage
CREATE POLICY "Admins can manage invitations" ON organization_invitations
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get or create organization settings
CREATE OR REPLACE FUNCTION get_or_create_org_settings(p_org_id UUID)
RETURNS organization_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings organization_settings;
BEGIN
    SELECT * INTO v_settings FROM organization_settings WHERE org_id = p_org_id;

    IF v_settings.id IS NULL THEN
        INSERT INTO organization_settings (org_id)
        VALUES (p_org_id)
        RETURNING * INTO v_settings;
    END IF;

    RETURN v_settings;
END;
$$;

-- Get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID, p_org_id UUID)
RETURNS user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prefs user_preferences;
BEGIN
    SELECT * INTO v_prefs FROM user_preferences
    WHERE user_id = p_user_id AND org_id = p_org_id;

    IF v_prefs.id IS NULL THEN
        INSERT INTO user_preferences (user_id, org_id)
        VALUES (p_user_id, p_org_id)
        RETURNING * INTO v_prefs;
    END IF;

    RETURN v_prefs;
END;
$$;

-- Get or create notification settings
CREATE OR REPLACE FUNCTION get_or_create_notification_settings(p_user_id UUID, p_org_id UUID)
RETURNS notification_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings notification_settings;
BEGIN
    SELECT * INTO v_settings FROM notification_settings
    WHERE user_id = p_user_id AND org_id = p_org_id;

    IF v_settings.id IS NULL THEN
        INSERT INTO notification_settings (user_id, org_id)
        VALUES (p_user_id, p_org_id)
        RETURNING * INTO v_settings;
    END IF;

    RETURN v_settings;
END;
$$;

-- Create organization invitation
CREATE OR REPLACE FUNCTION create_org_invitation(
    p_org_id UUID,
    p_email TEXT,
    p_role TEXT,
    p_message TEXT,
    p_invited_by UUID
)
RETURNS organization_invitations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation organization_invitations;
    v_token TEXT;
BEGIN
    -- Generate unique token
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Check if invitation already exists
    SELECT * INTO v_invitation FROM organization_invitations
    WHERE org_id = p_org_id AND email = p_email AND status = 'pending';

    IF v_invitation.id IS NOT NULL THEN
        -- Update existing invitation
        UPDATE organization_invitations
        SET token = v_token,
            token_expires_at = NOW() + INTERVAL '7 days',
            role = p_role,
            message = p_message,
            updated_at = NOW()
        WHERE id = v_invitation.id
        RETURNING * INTO v_invitation;
    ELSE
        -- Create new invitation
        INSERT INTO organization_invitations (
            org_id, email, role, message, token, token_expires_at, invited_by
        ) VALUES (
            p_org_id, p_email, p_role, p_message, v_token, NOW() + INTERVAL '7 days', p_invited_by
        )
        RETURNING * INTO v_invitation;
    END IF;

    RETURN v_invitation;
END;
$$;

-- Accept invitation
CREATE OR REPLACE FUNCTION accept_org_invitation(p_token TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation organization_invitations;
BEGIN
    -- Find valid invitation
    SELECT * INTO v_invitation FROM organization_invitations
    WHERE token = p_token
      AND status = 'pending'
      AND token_expires_at > NOW();

    IF v_invitation.id IS NULL THEN
        RETURN false;
    END IF;

    -- Add user to organization
    INSERT INTO user_organization_roles (user_id, org_id, role)
    VALUES (p_user_id, v_invitation.org_id, v_invitation.role)
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = v_invitation.role;

    -- Update invitation status
    UPDATE organization_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id,
        updated_at = NOW()
    WHERE id = v_invitation.id;

    RETURN true;
END;
$$;

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
    p_org_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_scopes TEXT[],
    p_created_by UUID,
    p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS TABLE(key_id UUID, api_key TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key_id UUID;
    v_full_key TEXT;
    v_key_prefix TEXT;
    v_key_hash TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate key
    v_full_key := 'champ_' || encode(gen_random_bytes(32), 'hex');
    v_key_prefix := substring(v_full_key from 1 for 12);
    v_key_hash := crypt(v_full_key, gen_salt('bf'));

    -- Calculate expiration
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;

    -- Insert key record
    INSERT INTO api_keys (org_id, name, description, key_prefix, key_hash, scopes, expires_at, created_by)
    VALUES (p_org_id, p_name, p_description, v_key_prefix, v_key_hash, p_scopes, v_expires_at, p_created_by)
    RETURNING id INTO v_key_id;

    RETURN QUERY SELECT v_key_id, v_full_key;
END;
$$;

-- Validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_api_key TEXT)
RETURNS TABLE(org_id UUID, scopes TEXT[], is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key api_keys;
    v_key_prefix TEXT;
BEGIN
    v_key_prefix := substring(p_api_key from 1 for 12);

    SELECT * INTO v_key FROM api_keys
    WHERE key_prefix = v_key_prefix
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW());

    IF v_key.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT[], false;
        RETURN;
    END IF;

    -- Verify hash
    IF v_key.key_hash = crypt(p_api_key, v_key.key_hash) THEN
        -- Update last used
        UPDATE api_keys
        SET last_used_at = NOW(), use_count = use_count + 1
        WHERE id = v_key.id;

        RETURN QUERY SELECT v_key.org_id, v_key.scopes, true;
    ELSE
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT[], false;
    END IF;
END;
$$;

-- Get org members with roles
CREATE OR REPLACE FUNCTION get_org_members(p_org_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        uor.role,
        uor.created_at AS joined_at,
        u.last_sign_in_at AS last_active_at
    FROM user_organization_roles uor
    JOIN auth.users u ON u.id = uor.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE uor.org_id = p_org_id
    ORDER BY uor.created_at;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER update_integration_configs_updated_at
    BEFORE UPDATE ON integration_configs
    FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER update_org_invitations_updated_at
    BEFORE UPDATE ON organization_invitations
    FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

-- Expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE organization_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND token_expires_at < NOW();
END;
$$;
