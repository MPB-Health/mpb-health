-- ============================================================================
-- Migration: Advisor Portal CMS Sync
-- Description: Ensure all tables and functions needed for CMS-Portal sync exist
-- ============================================================================

-- ============================================================================
-- PART 1: Create function to increment advisor_content view count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_advisor_content_view_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advisor_content
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION increment_advisor_content_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_advisor_content_view_count(UUID) TO anon;

-- ============================================================================
-- PART 2: Add dashboard_actions category to advisor_quick_links
-- ============================================================================

-- First update the check constraint to allow dashboard_actions category
ALTER TABLE public.advisor_quick_links
DROP CONSTRAINT IF EXISTS advisor_quick_links_category_check;

ALTER TABLE public.advisor_quick_links
ADD CONSTRAINT advisor_quick_links_category_check
CHECK (category IN ('resources', 'advisor_forms', 'employer_forms', 'member_forms', 'bulletins', 'dashboard_actions'));

-- Seed dashboard actions if they don't exist
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) 
VALUES
    ('Power List', '/power-list', 'Zap', 'dashboard_actions', 'Access your priority leads', 1, FALSE, TRUE),
    ('My Leads', '/leads', 'Users', 'dashboard_actions', 'View and manage your leads', 2, FALSE, TRUE),
    ('Training', '/training', 'GraduationCap', 'dashboard_actions', 'Continue your training', 3, FALSE, TRUE),
    ('Forms', '/forms', 'FileText', 'dashboard_actions', 'Access common forms', 4, FALSE, TRUE),
    ('SOPs', '/sops', 'FileText', 'dashboard_actions', 'View standard procedures', 5, FALSE, TRUE),
    ('Compliance', '/compliance', 'Shield', 'dashboard_actions', 'Check compliance status', 6, FALSE, TRUE),
    ('Profile', '/profile', 'User', 'dashboard_actions', 'View your profile', 7, FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 3: Seed advisor_nav_menu with current navigation if empty
-- ============================================================================
INSERT INTO public.advisor_nav_menu (label, url, icon, order_index, is_active) 
SELECT * FROM (VALUES
    ('Dashboard', '/', 'LayoutDashboard', 1, TRUE),
    ('Power List', '/power-list', 'Zap', 2, TRUE),
    ('Inbox', '/inbox', 'Inbox', 3, TRUE),
    ('Sequences', '/sequences', 'Workflow', 4, TRUE),
    ('Automations', '/automations', 'Bot', 5, TRUE),
    ('My Leads', '/leads', 'Users', 6, TRUE),
    ('Compliance', '/compliance', 'Shield', 7, TRUE),
    ('Analytics', '/analytics', 'BarChart3', 8, TRUE),
    ('Leaderboard', '/leaderboard', 'Trophy', 9, TRUE),
    ('Activity', '/activity', 'Activity', 10, TRUE),
    ('Billing', '/billing', 'CreditCard', 11, TRUE),
    ('Training', '/training', 'GraduationCap', 12, TRUE),
    ('Meetings', '/meetings', 'Video', 13, TRUE),
    ('Forms', '/forms', 'FileText', 14, TRUE),
    ('SOPs & Playbooks', '/sops', 'BookOpen', 15, TRUE),
    ('Bulletins', '/bulletins', 'Bell', 16, TRUE),
    ('Settings', '/settings', 'Settings', 17, TRUE)
) AS v(label, url, icon, order_index, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM public.advisor_nav_menu WHERE url = v.url
);

-- ============================================================================
-- PART 4: Seed default bulletin categories if empty
-- ============================================================================
INSERT INTO public.advisor_content_categories (name, slug, description, display_order)
VALUES
    ('Announcements', 'announcement', 'Important company announcements', 1),
    ('Updates', 'update', 'Product and system updates', 2),
    ('Alerts', 'alert', 'Urgent alerts requiring attention', 3),
    ('News', 'news', 'Industry and company news', 4),
    ('Training', 'training', 'Training-related bulletins', 5),
    ('Compliance', 'compliance', 'Compliance and regulatory updates', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 5: Ensure RLS policies allow advisors to read content
-- ============================================================================

-- Allow authenticated users to view advisor_content
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'advisor_content' 
        AND policyname = 'Advisors can read published content'
    ) THEN
        CREATE POLICY "Advisors can read published content"
        ON public.advisor_content
        FOR SELECT
        TO authenticated
        USING (is_published = TRUE);
    END IF;
END $$;

-- Allow authenticated users to read categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'advisor_content_categories' 
        AND policyname = 'Anyone can read categories'
    ) THEN
        CREATE POLICY "Anyone can read categories"
        ON public.advisor_content_categories
        FOR SELECT
        TO authenticated
        USING (TRUE);
    END IF;
END $$;

-- Allow authenticated users to manage their own views
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'advisor_content_views' 
        AND policyname = 'Users can manage their own views'
    ) THEN
        CREATE POLICY "Users can manage their own views"
        ON public.advisor_content_views
        FOR ALL
        TO authenticated
        USING (advisor_id = auth.uid())
        WITH CHECK (advisor_id = auth.uid());
    END IF;
END $$;

-- Allow authenticated users to manage their own bookmarks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'advisor_content_bookmarks' 
        AND policyname = 'Users can manage their own bookmarks'
    ) THEN
        CREATE POLICY "Users can manage their own bookmarks"
        ON public.advisor_content_bookmarks
        FOR ALL
        TO authenticated
        USING (advisor_id = auth.uid())
        WITH CHECK (advisor_id = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- PART 6: Add indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_advisor_content_published_bulletins
ON public.advisor_content(published_date DESC)
WHERE content_type = 'bulletin' AND is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_advisor_content_category_published
ON public.advisor_content(category_id, is_published);

CREATE INDEX IF NOT EXISTS idx_advisor_quick_links_dashboard_actions
ON public.advisor_quick_links(order_index)
WHERE category = 'dashboard_actions' AND is_active = TRUE;

-- ============================================================================
-- Done
-- ============================================================================
COMMENT ON FUNCTION increment_advisor_content_view_count(UUID) IS 
'Increment view count for advisor content. Called when advisors view bulletins.';
