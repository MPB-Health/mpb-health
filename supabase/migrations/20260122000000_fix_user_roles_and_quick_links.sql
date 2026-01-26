-- ============================================================================
-- Migration: Fix User Roles RLS and Update Quick Links Categories
-- Description:
--   1. Fix user_roles RLS policies to prevent 500 errors for users without roles
--   2. Update quick_links categories to new structure
-- ============================================================================

-- ============================================================================
-- PART 1: Fix User Roles RLS Policies
-- ============================================================================

-- Drop existing policies that may cause issues
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- Create simpler, non-recursive policies

-- Policy 1: Users can always read their own roles (even if empty result)
CREATE POLICY "Users can read own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Admins can read all roles using a security definer function
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    ) INTO is_admin;
    RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can read all roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.current_user_is_admin());

-- Policy 3: Super admins can insert roles
CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_super BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    ) INTO is_super;
    RETURN COALESCE(is_super, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Super admins can insert roles"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_is_super_admin());

-- Policy 4: Super admins can update roles
CREATE POLICY "Super admins can update roles"
    ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (public.current_user_is_super_admin());

-- Policy 5: Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
    ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (public.current_user_is_super_admin());

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_super_admin() TO authenticated;

-- ============================================================================
-- PART 2: Update Quick Links Categories
-- ============================================================================

-- Step 1: Drop existing check constraint FIRST
ALTER TABLE public.advisor_quick_links
DROP CONSTRAINT IF EXISTS advisor_quick_links_category_check;

-- Step 2: Clear existing data (we'll re-seed with new structure)
DELETE FROM public.advisor_quick_links;

-- Step 3: Update default value
ALTER TABLE public.advisor_quick_links
ALTER COLUMN category SET DEFAULT 'resources';

-- Step 4: Add new check constraint with updated categories
ALTER TABLE public.advisor_quick_links
ADD CONSTRAINT advisor_quick_links_category_check
CHECK (category IN ('resources', 'advisor_forms', 'employer_forms', 'member_forms', 'bulletins'));

-- ============================================================================
-- Seed Resources (General tools and documents)
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Current Price Sheets', '#', 'FileSpreadsheet', 'resources', 'Latest pricing information', 1, FALSE, TRUE),
('Cost of MEC', '#', 'Calculator', 'resources', 'Tax Deductible for Employers', 2, FALSE, TRUE),
('Current Promo Videos', '#', 'Video', 'resources', 'Marketing videos', 3, TRUE, TRUE),
('Brochures & Marketing Materials', '#', 'BookOpen', 'resources', 'Downloadable materials', 4, FALSE, TRUE),
('PHCS Network Search', 'https://www.multiplan.com/webcenter/portal/ProviderSearch', 'Search', 'resources', 'Find in-network providers', 5, TRUE, TRUE),
('Prescription Drug Search', '#', 'Pill', 'resources', 'Drug pricing lookup', 6, TRUE, TRUE);

-- ============================================================================
-- Seed Advisor Forms
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Commission Structure', '#', 'DollarSign', 'advisor_forms', 'View commission details', 1, FALSE, TRUE),
('Advisor Agreement', '#', 'FileText', 'advisor_forms', 'Sign advisor agreement', 2, FALSE, TRUE),
('Enroll E&O', '#', 'Shield', 'advisor_forms', 'Enroll in E&O insurance', 3, FALSE, TRUE),
('Media Release Consent', '#', 'Camera', 'advisor_forms', 'Marketing consent form', 4, FALSE, TRUE),
('Update E&O', '#', 'RefreshCw', 'advisor_forms', 'Update E&O information', 5, FALSE, TRUE),
('Advisor Termination Request', '#', 'UserMinus', 'advisor_forms', 'Request termination', 6, FALSE, TRUE);

-- ============================================================================
-- Seed Employer Forms
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Employer Application', '#', 'Building2', 'employer_forms', 'New employer enrollment', 1, FALSE, TRUE),
('List-Bill Conversion', '#', 'FileCheck', 'employer_forms', 'Convert to list-bill', 2, FALSE, TRUE),
('Group Census Template', '#', 'Users', 'employer_forms', 'Employee census form', 3, FALSE, TRUE),
('Employer Agreement', '#', 'FileText', 'employer_forms', 'Employer contract', 4, FALSE, TRUE);

-- ============================================================================
-- Seed Member Forms
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Schedule a Welcome Call', '#', 'Calendar', 'member_forms', 'Book member orientation', 1, TRUE, TRUE),
('HSA Setup Instructions', '#', 'CreditCard', 'member_forms', 'How to set up HSA', 2, FALSE, TRUE),
('How to Login to the App', '#', 'Smartphone', 'member_forms', 'App login guide', 3, FALSE, TRUE),
('Find Your Member Card', '#', 'CreditCard', 'member_forms', 'Access member ID card', 4, FALSE, TRUE),
('Change of Address Form', '#', 'MapPin', 'member_forms', 'Update member address', 5, FALSE, TRUE),
('Add Dependent Form', '#', 'UserPlus', 'member_forms', 'Add family members', 6, FALSE, TRUE);

-- ============================================================================
-- Seed Bulletins (News and announcements)
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Latest Bulletins', '/advisor/content?type=bulletin', 'Newspaper', 'bulletins', 'View all bulletins', 1, FALSE, TRUE),
('2026 Rate Updates', '#', 'TrendingUp', 'bulletins', 'New pricing effective Jan 2026', 2, FALSE, TRUE),
('Product Updates', '#', 'Sparkles', 'bulletins', 'Latest product changes', 3, FALSE, TRUE);

-- Update column comment
COMMENT ON COLUMN public.advisor_quick_links.category IS
'Toolkit category: resources, advisor_forms, employer_forms, member_forms, bulletins';

-- ============================================================================
-- PART 3: Cleanup - Remove any orphaned data
-- ============================================================================

-- Remove training progress for modules that no longer exist
DELETE FROM public.training_progress
WHERE module_id NOT IN (SELECT id FROM public.training_modules);

-- ============================================================================
-- PART 4: Ensure proper indexes exist
-- ============================================================================

-- Quick links indexes
CREATE INDEX IF NOT EXISTS idx_advisor_quick_links_category
ON public.advisor_quick_links(category);

CREATE INDEX IF NOT EXISTS idx_advisor_quick_links_active
ON public.advisor_quick_links(is_active) WHERE is_active = TRUE;

-- User roles indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================================
-- Done
-- ============================================================================
