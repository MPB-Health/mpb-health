-- ============================================================================
-- Migration: Handbooks CMS
-- Description: Create table for managing member handbooks dynamically from admin
-- ============================================================================

-- Create the handbooks table
CREATE TABLE IF NOT EXISTS public.handbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    pdf_path TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('individual', 'family', 'employer', 'hsa', 'general')),
    color TEXT DEFAULT 'blue',
    icon TEXT DEFAULT 'BookOpen',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_handbooks_slug ON public.handbooks(slug);
CREATE INDEX IF NOT EXISTS idx_handbooks_plan_type ON public.handbooks(plan_type);
CREATE INDEX IF NOT EXISTS idx_handbooks_active ON public.handbooks(is_active);
CREATE INDEX IF NOT EXISTS idx_handbooks_sort ON public.handbooks(sort_order);
-- Enable RLS
ALTER TABLE public.handbooks ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Allow anyone to read active handbooks (for public handbook pages)
DROP POLICY IF EXISTS "Allow public read active handbooks" ON public.handbooks;
CREATE POLICY "Allow public read active handbooks" 
    ON public.handbooks 
    FOR SELECT 
    USING (is_active = true);
-- Allow authenticated users to read all handbooks (for admin)
DROP POLICY IF EXISTS "Allow authenticated read all handbooks" ON public.handbooks;
CREATE POLICY "Allow authenticated read all handbooks" 
    ON public.handbooks 
    FOR SELECT 
    TO authenticated 
    USING (true);
-- Allow authenticated users to insert handbooks
DROP POLICY IF EXISTS "Allow authenticated insert handbooks" ON public.handbooks;
CREATE POLICY "Allow authenticated insert handbooks" 
    ON public.handbooks 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
-- Allow authenticated users to update handbooks
DROP POLICY IF EXISTS "Allow authenticated update handbooks" ON public.handbooks;
CREATE POLICY "Allow authenticated update handbooks" 
    ON public.handbooks 
    FOR UPDATE 
    TO authenticated 
    USING (true);
-- Allow authenticated users to delete handbooks
DROP POLICY IF EXISTS "Allow authenticated delete handbooks" ON public.handbooks;
CREATE POLICY "Allow authenticated delete handbooks" 
    ON public.handbooks 
    FOR DELETE 
    TO authenticated 
    USING (true);
-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_handbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_handbooks_updated_at ON public.handbooks;
CREATE TRIGGER trigger_handbooks_updated_at
    BEFORE UPDATE ON public.handbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_handbooks_updated_at();
-- Seed with existing handbooks from current config
INSERT INTO public.handbooks (slug, name, description, pdf_path, plan_type, color, icon, features, is_active, sort_order) VALUES
    ('careplus', 'Care+ Handbook', 'Comprehensive membership for individuals and families seeking enhanced care options.', '/docs/Care+ Handbook-New Members (3).pdf', 'family', 'blue', 'Heart', '["Enhanced benefits", "Telehealth included", "Prescription membership"]'::jsonb, true, 1),
    ('direct-handbook', 'Direct Handbook', 'Streamlined healthcare access with direct provider relationships.', '/docs/Direct Handbook-New Members (2).pdf', 'individual', 'green', 'Zap', '["Direct access", "No referrals needed", "Fast appointments"]'::jsonb, true, 2),
    ('secure-hsa', 'Secure HSA Handbook', 'Health Savings Account compatible plan with tax advantages.', '/docs/Secure HSA Handbook-New Members.pdf', 'hsa', 'emerald', 'Shield', '["HSA compatible", "Tax benefits", "Rollover savings"]'::jsonb, true, 3),
    ('premium-hsa', 'Premium HSA Handbook', 'Premium Health Savings Account compatible plan with enhanced benefits.', '/docs/Secure HSA Handbook-New Members.pdf', 'hsa', 'emerald', 'Shield', '["HSA compatible", "Premium benefits", "Tax advantages"]'::jsonb, true, 4),
    ('essentials', 'Essentials Handbook', 'Essential membership for basic healthcare needs at an affordable price.', '/docs/Essentials Handbook-New Members 1.pdf', 'individual', 'sky', 'Star', '["Affordable", "Basic membership", "Preventive care"]'::jsonb, true, 5),
    ('mecessentials-handbook', 'MEC+ Essentials Handbook', 'Minimum Essential Coverage plus additional benefits for comprehensive protection.', '/docs/MEC+Essentials Handbook-New Members 1.pdf', 'employer', 'purple', 'Building2', '["ACA compliant", "Employer plans", "Group rates"]'::jsonb, true, 6),
    ('zion-guidelines', 'Zion Member Guidelines', 'Comprehensive member guidelines for Zion HealthShare participants.', '/docs/Zion Member Guidelines.pdf', 'general', 'slate', 'BookOpen', '["Member guidelines", "Sharing rules", "Eligibility info"]'::jsonb, true, 7),
    ('sedera-guidelines', 'Sedera Community Guidelines', 'Community guidelines for Sedera HealthShare members.', '/docs/Sedera-Community-Guidelines-2 (1).pdf', 'general', 'teal', 'Users', '["Community guidelines", "Sharing rules", "Membership info"]'::jsonb, true, 8)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    pdf_path = EXCLUDED.pdf_path,
    plan_type = EXCLUDED.plan_type,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    features = EXCLUDED.features,
    updated_at = NOW();
-- Grant permissions
GRANT SELECT ON public.handbooks TO anon;
GRANT ALL ON public.handbooks TO authenticated;
