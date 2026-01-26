-- Advisor Command Center Schema
-- Creates tables and functions for advisor hierarchy, member management, and CSV imports

-- ============================================
-- ADVISORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS advisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT UNIQUE NOT NULL,
    parent_id TEXT REFERENCES advisors(agent_id) ON DELETE SET NULL,
    agent_label TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    hire_date TIMESTAMPTZ,
    territory TEXT,
    commission_rate DECIMAL(5, 2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisors_agent_id ON advisors(agent_id);
CREATE INDEX IF NOT EXISTS idx_advisors_parent_id ON advisors(parent_id);
CREATE INDEX IF NOT EXISTS idx_advisors_is_active ON advisors(is_active);

-- ============================================
-- ADD COMMAND CENTER COLUMNS TO MEMBER_PROFILES
-- ============================================
DO $$
BEGIN
    -- Add status column if not exists (different from membership_status)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'status') THEN
        ALTER TABLE member_profiles ADD COLUMN status TEXT DEFAULT 'pending'
            CHECK (status IN ('active', 'pending', 'inactive', 'cancelled', 'suspended'));
    END IF;

    -- Add plan_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'plan_type') THEN
        ALTER TABLE member_profiles ADD COLUMN plan_type TEXT
            CHECK (plan_type IN ('basic', 'standard', 'premium', 'enterprise'));
    END IF;

    -- Add plan_name column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'plan_name') THEN
        ALTER TABLE member_profiles ADD COLUMN plan_name TEXT;
    END IF;

    -- Add enrollment_date column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'enrollment_date') THEN
        ALTER TABLE member_profiles ADD COLUMN enrollment_date DATE;
    END IF;

    -- Add renewal_date column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'renewal_date') THEN
        ALTER TABLE member_profiles ADD COLUMN renewal_date DATE;
    END IF;

    -- Add last_contact_date column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'last_contact_date') THEN
        ALTER TABLE member_profiles ADD COLUMN last_contact_date TIMESTAMPTZ;
    END IF;

    -- Add notes column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'notes') THEN
        ALTER TABLE member_profiles ADD COLUMN notes TEXT;
    END IF;

    -- Add tags column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'member_profiles' AND column_name = 'tags') THEN
        ALTER TABLE member_profiles ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Create index on assigned_advisor_id if not exists
CREATE INDEX IF NOT EXISTS idx_member_profiles_advisor ON member_profiles(assigned_advisor_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_enrollment_date ON member_profiles(enrollment_date);

-- ============================================
-- MEMBER IMPORT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS member_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_member_import_logs_advisor ON member_import_logs(advisor_id);
CREATE INDEX IF NOT EXISTS idx_member_import_logs_status ON member_import_logs(status);
CREATE INDEX IF NOT EXISTS idx_member_import_logs_created ON member_import_logs(created_at DESC);

-- ============================================
-- HIERARCHY FUNCTIONS
-- ============================================

-- Function to get all downline advisor IDs (recursive)
CREATE OR REPLACE FUNCTION get_downline_advisor_ids(root_advisor_id TEXT)
RETURNS TABLE(agent_id TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE advisor_tree AS (
        -- Base case: the root advisor
        SELECT a.agent_id
        FROM advisors a
        WHERE a.agent_id = root_advisor_id

        UNION ALL

        -- Recursive case: children of current level
        SELECT a.agent_id
        FROM advisors a
        JOIN advisor_tree t ON a.parent_id = t.agent_id
        WHERE a.is_active = true
    )
    SELECT advisor_tree.agent_id FROM advisor_tree;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get advisor hierarchy tree with levels
CREATE OR REPLACE FUNCTION get_advisor_hierarchy_tree(root_advisor_id TEXT)
RETURNS TABLE(
    id UUID,
    agent_id TEXT,
    parent_id TEXT,
    agent_label TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN,
    hire_date TIMESTAMPTZ,
    territory TEXT,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE advisor_tree AS (
        -- Base case: the root advisor at level 0
        SELECT
            a.id,
            a.agent_id,
            a.parent_id,
            a.agent_label,
            a.full_name,
            a.email,
            a.phone,
            a.is_active,
            a.hire_date,
            a.territory,
            0 as level
        FROM advisors a
        WHERE a.agent_id = root_advisor_id

        UNION ALL

        -- Recursive case: children with incremented level
        SELECT
            a.id,
            a.agent_id,
            a.parent_id,
            a.agent_label,
            a.full_name,
            a.email,
            a.phone,
            a.is_active,
            a.hire_date,
            a.territory,
            t.level + 1
        FROM advisors a
        JOIN advisor_tree t ON a.parent_id = t.agent_id
        WHERE a.is_active = true
    )
    SELECT * FROM advisor_tree ORDER BY level, full_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get hierarchy statistics
CREATE OR REPLACE FUNCTION get_hierarchy_stats(root_advisor_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    advisor_ids TEXT[];
    total_advisors INTEGER;
    active_advisors INTEGER;
    total_members INTEGER;
    max_depth INTEGER;
    members_per_level JSONB;
BEGIN
    -- Get all advisor IDs in hierarchy
    SELECT ARRAY_AGG(agent_id) INTO advisor_ids
    FROM get_downline_advisor_ids(root_advisor_id);

    -- Count advisors
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO total_advisors, active_advisors
    FROM advisors
    WHERE agent_id = ANY(advisor_ids);

    -- Count members
    SELECT COUNT(*)
    INTO total_members
    FROM member_profiles
    WHERE assigned_advisor_id = ANY(advisor_ids);

    -- Get max depth
    SELECT COALESCE(MAX(level), 0)
    INTO max_depth
    FROM get_advisor_hierarchy_tree(root_advisor_id);

    -- Get members per level
    WITH level_counts AS (
        SELECT
            t.level,
            COUNT(m.id) as member_count
        FROM get_advisor_hierarchy_tree(root_advisor_id) t
        LEFT JOIN member_profiles m ON m.assigned_advisor_id = t.agent_id
        GROUP BY t.level
    )
    SELECT jsonb_object_agg(level::text, member_count)
    INTO members_per_level
    FROM level_counts;

    result := jsonb_build_object(
        'total_advisors', total_advisors,
        'active_advisors', active_advisors,
        'total_members', total_members,
        'members_per_level', COALESCE(members_per_level, '{}'::jsonb),
        'depth', max_depth + 1
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_import_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "advisors_select_policy" ON advisors;
DROP POLICY IF EXISTS "advisors_insert_policy" ON advisors;
DROP POLICY IF EXISTS "advisors_update_policy" ON advisors;
DROP POLICY IF EXISTS "advisors_delete_policy" ON advisors;
DROP POLICY IF EXISTS "member_import_logs_select_policy" ON member_import_logs;
DROP POLICY IF EXISTS "member_import_logs_insert_policy" ON member_import_logs;
DROP POLICY IF EXISTS "member_import_logs_update_policy" ON member_import_logs;

-- Advisors: Allow authenticated users with admin/staff roles to manage
CREATE POLICY "advisors_select_policy" ON advisors FOR SELECT USING (
    auth.role() = 'authenticated'
);

CREATE POLICY "advisors_insert_policy" ON advisors FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'advisor', 'staff'))
);

CREATE POLICY "advisors_update_policy" ON advisors FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'advisor', 'staff'))
);

CREATE POLICY "advisors_delete_policy" ON advisors FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin'))
);

-- Member Import Logs: Advisors can see their own imports, admins can see all
CREATE POLICY "member_import_logs_select_policy" ON member_import_logs FOR SELECT USING (
    auth.role() = 'authenticated'
);

CREATE POLICY "member_import_logs_insert_policy" ON member_import_logs FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

CREATE POLICY "member_import_logs_update_policy" ON member_import_logs FOR UPDATE USING (
    auth.role() = 'authenticated'
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_advisors_updated_at ON advisors;
CREATE TRIGGER update_advisors_updated_at
    BEFORE UPDATE ON advisors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON advisors TO authenticated;
GRANT ALL ON member_import_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_downline_advisor_ids(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_advisor_hierarchy_tree(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_hierarchy_stats(TEXT) TO authenticated;
