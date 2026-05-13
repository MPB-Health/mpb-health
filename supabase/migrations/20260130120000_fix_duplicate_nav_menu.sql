-- ============================================================================
-- Migration: Fix Duplicate Nav Menu Entries
-- Description: Clean up duplicate advisor_nav_menu entries and re-seed with correct paths
-- ============================================================================

-- Step 1: Clear all existing nav menu entries (they contain duplicates and old paths)
DELETE FROM public.advisor_nav_menu;
-- Step 2: Re-seed with correct navigation items (matching advisor-portal routes)
INSERT INTO public.advisor_nav_menu (label, url, icon, order_index, is_active) VALUES
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
    ('Settings', '/settings', 'Settings', 17, TRUE);
-- Step 3: Add unique constraint on url to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_advisor_nav_menu_url_unique 
ON public.advisor_nav_menu(url) 
WHERE url IS NOT NULL;
-- ============================================================================
-- Done
-- ============================================================================;
