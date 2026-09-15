-- Repair: Create user_preferences table and RPC function
-- The original migration (20260128800000) was recorded as applied but these objects are missing.

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Display
    theme TEXT DEFAULT 'system',
    sidebar_collapsed BOOLEAN DEFAULT false,
    compact_mode BOOLEAN DEFAULT false,
    timezone TEXT,
    language TEXT,

    -- Dashboard
    dashboard_layout JSONB DEFAULT '{}',
    pinned_items JSONB DEFAULT '[]',

    -- Power List
    default_lane_id UUID,
    power_list_view TEXT DEFAULT 'cards',
    auto_advance_after_complete BOOLEAN DEFAULT true,

    -- Inbox
    inbox_preview_lines INTEGER DEFAULT 2,
    inbox_group_by TEXT DEFAULT 'none',
    inbox_sort_order TEXT DEFAULT 'newest',

    -- Keyboard shortcuts enabled
    keyboard_shortcuts_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, org_id)
);
-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences') THEN
    CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update own preferences') THEN
    CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert own preferences') THEN
    CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
-- RPC function
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
-- Updated_at trigger
CREATE OR REPLACE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
