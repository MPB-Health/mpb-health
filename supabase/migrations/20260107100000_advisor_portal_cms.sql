-- ============================================================================
-- Advisor Portal CMS Migration
-- Creates tables for dynamic content management of the Advisor Portal
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: advisor_categories
-- Dynamic categories for training, SOPs, and content
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advisor_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3b82f6', -- Tailwind blue-500
    icon TEXT DEFAULT 'Folder',
    type TEXT NOT NULL DEFAULT 'training', -- 'training', 'sop', 'content', 'all'
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.advisor_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.advisor_categories FOR SELECT USING (TRUE);
CREATE POLICY "Enable write access for authenticated users" ON public.advisor_categories FOR ALL USING (auth.role() = 'authenticated');

-- Seed default categories from current hardcoded values
INSERT INTO public.advisor_categories (name, slug, description, type, order_index) VALUES
    ('Onboarding', 'onboarding', 'Essential training for all new advisors', 'training', 1),
    ('Product Knowledge', 'product_knowledge', 'Deep dive into MPB Health plans and benefits', 'training', 2),
    ('Claims Processing', 'claims_processing', 'Handle claims and help members navigate sharing', 'training', 3),
    ('Compliance', 'compliance', 'Legal requirements, HIPAA, and regulatory compliance', 'training', 4),
    ('Sales', 'sales', 'Advanced sales techniques and practice building', 'training', 5),
    ('Customer Service', 'customer_service', 'Customer support and communication skills', 'training', 6),
    ('Bulletin', 'bulletin', 'News and announcements for advisors', 'content', 1),
    ('Guideline', 'guideline', 'Process guidelines and best practices', 'content', 2),
    ('Form', 'form', 'Required forms and templates', 'content', 3),
    ('Resource', 'resource', 'General resources and materials', 'content', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Table: advisor_quick_links
-- Dashboard sidebar quick links
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advisor_quick_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT DEFAULT 'Link', -- Lucide icon name
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_external BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.advisor_quick_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.advisor_quick_links FOR SELECT USING (TRUE);
CREATE POLICY "Enable write access for authenticated users" ON public.advisor_quick_links FOR ALL USING (auth.role() = 'authenticated');

-- Seed default quick links from current hardcoded values
INSERT INTO public.advisor_quick_links (label, url, icon, order_index, is_external) VALUES
    ('Employer Forms', '/employer-forms/', 'Briefcase', 1, FALSE),
    ('Member Forms', '/member-forms/', 'Users', 2, FALSE),
    ('Resources & Bulletins', '/advisor/content', 'Newspaper', 3, FALSE),
    ('SOP Library', '/advisor/sops', 'FileText', 4, FALSE),
    ('My Profile', '/advisor/profile', 'Target', 5, FALSE),
    ('All Training', '/advisor/training', 'BookOpen', 6, FALSE),
    ('Get Support', 'https://support.mpb.health/login/advisor', 'HelpCircle', 7, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Table: advisor_learning_paths
-- Training University learning path cards
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advisor_learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category_slug TEXT REFERENCES public.advisor_categories(slug) ON DELETE SET NULL,
    icon TEXT DEFAULT 'BookOpen', -- Lucide icon name
    gradient TEXT DEFAULT 'bg-gradient-to-br from-blue-500 to-blue-600',
    estimated_hours DECIMAL(4, 1) DEFAULT 1.0,
    is_required BOOLEAN DEFAULT FALSE,
    unlock_requirements JSONB, -- e.g., {"category": "onboarding", "min_completed": 3}
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.advisor_learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.advisor_learning_paths FOR SELECT USING (TRUE);
CREATE POLICY "Enable write access for authenticated users" ON public.advisor_learning_paths FOR ALL USING (auth.role() = 'authenticated');

-- Seed default learning paths from current hardcoded values
INSERT INTO public.advisor_learning_paths (title, description, category_slug, icon, gradient, estimated_hours, is_required, unlock_requirements, order_index) VALUES
    (
        'Foundation (Onboarding)',
        'Essential training for all new advisors. Master the fundamentals of MPB Health and health sharing.',
        'onboarding',
        'BookOpen',
        'bg-gradient-to-br from-blue-500 to-blue-600',
        2.5,
        TRUE,
        NULL,
        1
    ),
    (
        'Product Knowledge',
        'Deep dive into MPB Health plans, pricing, and benefits. Become a product expert.',
        'product_knowledge',
        'Target',
        'bg-gradient-to-br from-purple-500 to-purple-600',
        4.0,
        TRUE,
        NULL,
        2
    ),
    (
        'Claims Processing',
        'Learn to handle claims efficiently and help members navigate the sharing process.',
        'claims_processing',
        'Award',
        'bg-gradient-to-br from-green-500 to-green-600',
        3.5,
        TRUE,
        '{"category": "onboarding", "min_completed": 3}',
        3
    ),
    (
        'Compliance & Regulations',
        'Understand legal requirements, HIPAA, and regulatory compliance for advisors.',
        'compliance',
        'BookOpen',
        'bg-gradient-to-br from-orange-500 to-orange-600',
        3.0,
        TRUE,
        NULL,
        4
    ),
    (
        'Advanced Sales Mastery',
        'Advanced techniques for consultative selling and building your advisor practice.',
        'sales',
        'TrendingUp',
        'bg-gradient-to-br from-indigo-500 to-indigo-600',
        4.0,
        FALSE,
        '{"categories": ["onboarding", "product_knowledge"], "min_completed": 8}',
        5
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Table: advisor_dashboard_widgets
-- Dashboard widget visibility and ordering
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advisor_dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_key TEXT NOT NULL UNIQUE, -- e.g., 'stats_cards', 'continue_learning', 'quick_links'
    label TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    grid_column TEXT DEFAULT 'full', -- 'full', 'left', 'right' (for 2-column layout)
    config JSONB, -- Widget-specific configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.advisor_dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.advisor_dashboard_widgets FOR SELECT USING (TRUE);
CREATE POLICY "Enable write access for authenticated users" ON public.advisor_dashboard_widgets FOR ALL USING (auth.role() = 'authenticated');

-- Seed default widgets
INSERT INTO public.advisor_dashboard_widgets (widget_key, label, description, order_index, grid_column) VALUES
    ('stats_cards', 'Statistics Cards', 'Show training progress, certifications, time invested, and quiz scores', 1, 'full'),
    ('continue_learning', 'Continue Learning', 'Show modules currently in progress', 2, 'left'),
    ('training_modules', 'Available Training', 'List of available training modules', 3, 'left'),
    ('latest_bulletins', 'Latest Bulletins', 'Recent news and announcements', 4, 'right'),
    ('certifications', 'Your Certifications', 'Display earned certifications', 5, 'right'),
    ('quick_links', 'Quick Links', 'Sidebar with useful links', 6, 'right'),
    ('need_help', 'Need Help?', 'Support card with contact info', 7, 'right')
ON CONFLICT (widget_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description;

-- ============================================================================
-- Table: advisor_nav_menu
-- Navigation menu items with hierarchy
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advisor_nav_menu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    url TEXT,
    icon TEXT DEFAULT 'Link', -- Lucide icon name
    parent_id UUID REFERENCES public.advisor_nav_menu(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_external BOOLEAN DEFAULT FALSE,
    requires_auth BOOLEAN DEFAULT TRUE,
    badge_text TEXT, -- e.g., 'New', 'Beta'
    badge_color TEXT DEFAULT 'blue',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.advisor_nav_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.advisor_nav_menu FOR SELECT USING (TRUE);
CREATE POLICY "Enable write access for authenticated users" ON public.advisor_nav_menu FOR ALL USING (auth.role() = 'authenticated');

-- Seed default navigation items
INSERT INTO public.advisor_nav_menu (label, url, icon, order_index) VALUES
    ('Dashboard', '/advisor/dashboard', 'LayoutDashboard', 1),
    ('Training', '/advisor/training', 'BookOpen', 2),
    ('University', '/advisor/university', 'GraduationCap', 3),
    ('Content Hub', '/advisor/content', 'Newspaper', 4),
    ('SOP Library', '/advisor/sops', 'FileText', 5),
    ('My Profile', '/advisor/profile', 'User', 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Table: advisor_announcements
-- Banner announcements for the advisor portal
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advisor_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    content_html TEXT, -- Rich text content
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_dismissible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    target_audience TEXT DEFAULT 'all', -- 'all', 'new_advisors', 'certified'
    link_url TEXT,
    link_text TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.advisor_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.advisor_announcements FOR SELECT USING (TRUE);
CREATE POLICY "Enable write access for authenticated users" ON public.advisor_announcements FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- Create updated_at trigger function if not exists
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['advisor_categories', 'advisor_quick_links', 'advisor_learning_paths', 'advisor_dashboard_widgets', 'advisor_nav_menu', 'advisor_announcements']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I;
            CREATE TRIGGER set_%s_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_advisor_categories_type ON public.advisor_categories(type);
CREATE INDEX IF NOT EXISTS idx_advisor_categories_slug ON public.advisor_categories(slug);
CREATE INDEX IF NOT EXISTS idx_advisor_quick_links_order ON public.advisor_quick_links(order_index);
CREATE INDEX IF NOT EXISTS idx_advisor_learning_paths_category ON public.advisor_learning_paths(category_slug);
CREATE INDEX IF NOT EXISTS idx_advisor_learning_paths_order ON public.advisor_learning_paths(order_index);
CREATE INDEX IF NOT EXISTS idx_advisor_nav_menu_parent ON public.advisor_nav_menu(parent_id);
CREATE INDEX IF NOT EXISTS idx_advisor_nav_menu_order ON public.advisor_nav_menu(order_index);
CREATE INDEX IF NOT EXISTS idx_advisor_announcements_dates ON public.advisor_announcements(start_date, end_date);

