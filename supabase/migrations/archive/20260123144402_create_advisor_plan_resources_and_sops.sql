-- ============================================================================
-- Migration: Create Advisor Plan Resources and SOP Documents System
-- Description: Tables for managing plan resources (handbooks, flyers, QRGs)
--              and Standard Operating Procedures for the Advisor Portal
-- ============================================================================

-- ============================================================================
-- 1. ADVISOR PLAN RESOURCES TABLE
-- Stores plan information for the Resources landing page
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.advisor_plan_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_slug TEXT UNIQUE NOT NULL,
  plan_name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'FileText',
  color TEXT DEFAULT 'blue',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Content fields
  overview_content TEXT,
  pricing_content TEXT,

  -- Document URLs
  handbook_url TEXT,
  handbook_title TEXT,
  flyer_url TEXT,
  flyer_title TEXT,
  qrg_url TEXT,
  qrg_title TEXT,

  -- State guidelines as JSONB array
  state_guidelines JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_advisor_plan_resources_slug ON public.advisor_plan_resources(plan_slug);
CREATE INDEX IF NOT EXISTS idx_advisor_plan_resources_active ON public.advisor_plan_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_advisor_plan_resources_order ON public.advisor_plan_resources(order_index);
-- Enable RLS
ALTER TABLE public.advisor_plan_resources ENABLE ROW LEVEL SECURITY;
-- RLS Policies for advisor_plan_resources
DROP POLICY IF EXISTS "advisor_plan_resources_anon_select" ON public.advisor_plan_resources;
CREATE POLICY "advisor_plan_resources_anon_select" ON public.advisor_plan_resources
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
DROP POLICY IF EXISTS "advisor_plan_resources_admin_all" ON public.advisor_plan_resources;
CREATE POLICY "advisor_plan_resources_admin_all" ON public.advisor_plan_resources
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_advisor_plan_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trigger_update_advisor_plan_resources_updated_at ON public.advisor_plan_resources;
CREATE TRIGGER trigger_update_advisor_plan_resources_updated_at
  BEFORE UPDATE ON public.advisor_plan_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advisor_plan_resources_updated_at();
-- ============================================================================
-- 2. SOP DOCUMENTS TABLE UPDATES
-- Add missing columns if table exists, or create if not
-- ============================================================================

-- Add order_index column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sop_documents'
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.sop_documents ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;
-- Add version column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sop_documents'
    AND column_name = 'version'
  ) THEN
    ALTER TABLE public.sop_documents ADD COLUMN version TEXT DEFAULT '1.0';
  END IF;
END $$;
-- Create table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public.sop_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  content TEXT,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
-- Create indexes (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sop_documents'
    AND column_name = 'order_index'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_sop_documents_order ON public.sop_documents(order_index);
  END IF;
END $$;
-- Enable RLS
ALTER TABLE public.sop_documents ENABLE ROW LEVEL SECURITY;
-- RLS Policies for sop_documents
DROP POLICY IF EXISTS "sop_documents_anon_select" ON public.sop_documents;
CREATE POLICY "sop_documents_anon_select" ON public.sop_documents
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
DROP POLICY IF EXISTS "sop_documents_admin_all" ON public.sop_documents;
CREATE POLICY "sop_documents_admin_all" ON public.sop_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- Updated_at trigger for SOPs
CREATE OR REPLACE FUNCTION public.update_sop_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trigger_update_sop_documents_updated_at ON public.sop_documents;
CREATE TRIGGER trigger_update_sop_documents_updated_at
  BEFORE UPDATE ON public.sop_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sop_documents_updated_at();
-- ============================================================================
-- 3. SEED DEFAULT PLAN RESOURCES
-- ============================================================================

INSERT INTO public.advisor_plan_resources (plan_slug, plan_name, description, icon, color, order_index, overview_content, handbook_title, flyer_title, qrg_title)
VALUES
  ('secure-hsa', 'Secure HSA', 'Health Savings Account compatible plan with preventive care benefits', 'Shield', 'blue', 1,
   'The Secure HSA plan provides HSA-compatible health sharing with preventive care benefits. Members can contribute to a Health Savings Account while enjoying comprehensive health sharing coverage.',
   'Secure HSA Member Handbook', 'Secure HSA Plan Overview Flyer', 'Secure HSA Quick Reference Guide'),

  ('direct', 'Direct', 'Direct primary care membership with comprehensive coverage', 'Zap', 'purple', 2,
   'The Direct plan offers direct primary care access combined with health sharing coverage for larger medical needs.',
   'Direct Plan Member Handbook', 'Direct Plan Overview Flyer', 'Direct Plan Quick Reference Guide'),

  ('care-plus', 'Care+', 'Enhanced care plan with additional benefits and services', 'Heart', 'rose', 3,
   'Care+ is an enhanced health sharing plan that includes additional benefits and services beyond standard coverage.',
   'Care+ Member Handbook', 'Care+ Plan Overview Flyer', 'Care+ Quick Reference Guide'),

  ('premium-care', 'Premium Care', 'Premium tier membership with comprehensive health sharing', 'Star', 'amber', 4,
   'Premium Care offers our most comprehensive health sharing coverage with premium benefits and services.',
   'Premium Care Member Handbook', 'Premium Care Overview Flyer', 'Premium Care Quick Reference Guide'),

  ('premium-hsa', 'Premium HSA', 'Premium HSA-compatible plan with maximum benefits', 'Sparkles', 'emerald', 5,
   'Premium HSA combines our premium tier benefits with HSA compatibility for maximum flexibility and tax advantages.',
   'Premium HSA Member Handbook', 'Premium HSA Overview Flyer', 'Premium HSA Quick Reference Guide'),

  ('essentials', 'Essentials', 'Essential coverage plan for everyday healthcare needs', 'FileText', 'gray', 6,
   'The Essentials plan provides core health sharing coverage for everyday healthcare needs at an affordable rate.',
   'Essentials Member Handbook', 'Essentials Plan Overview Flyer', 'Essentials Quick Reference Guide'),

  ('mec-essentials', 'MEC+Essentials', 'Minimum Essential Coverage plus essential health benefits', 'Shield', 'indigo', 7,
   'MEC+Essentials combines Minimum Essential Coverage compliance with essential health sharing benefits.',
   'MEC+Essentials Member Handbook', 'MEC+Essentials Overview Flyer', 'MEC+Essentials Quick Reference Guide')
ON CONFLICT (plan_slug) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index,
  overview_content = COALESCE(public.advisor_plan_resources.overview_content, EXCLUDED.overview_content),
  handbook_title = COALESCE(public.advisor_plan_resources.handbook_title, EXCLUDED.handbook_title),
  flyer_title = COALESCE(public.advisor_plan_resources.flyer_title, EXCLUDED.flyer_title),
  qrg_title = COALESCE(public.advisor_plan_resources.qrg_title, EXCLUDED.qrg_title);
-- ============================================================================
-- 4. SEED SAMPLE SOP DOCUMENTS
-- ============================================================================

INSERT INTO public.sop_documents (title, description, category, tags, content, version, order_index)
VALUES
  ('New Member Enrollment Process', 'Step-by-step guide for enrolling new members', 'enrollment', ARRAY['enrollment', 'onboarding', 'new-member'],
   'This SOP covers the complete process for enrolling new members into MPB Health plans.', '1.0', 1),

  ('Claims Submission Guidelines', 'How to properly submit and process claims', 'claims', ARRAY['claims', 'submission', 'processing'],
   'Guidelines for advisors on how to help members submit claims correctly.', '1.0', 2),

  ('Member Support Best Practices', 'Best practices for providing excellent member support', 'support', ARRAY['support', 'customer-service', 'best-practices'],
   'Best practices and guidelines for providing exceptional member support.', '1.0', 3),

  ('Plan Comparison Guide', 'How to compare and recommend plans to prospects', 'sales', ARRAY['sales', 'comparison', 'plans'],
   'A comprehensive guide for comparing MPB Health plans and making recommendations.', '1.0', 4),

  ('Commission and Compensation', 'Understanding the commission structure', 'compensation', ARRAY['commission', 'compensation', 'payment'],
   'Detailed breakdown of the advisor commission and compensation structure.', '1.0', 5)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- 5. CREATE STORAGE BUCKET FOR PLAN DOCUMENTS
-- ============================================================================

-- Create bucket for advisor documents (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advisor-documents',
  'advisor-documents',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;
-- Storage policies for advisor-documents bucket
DROP POLICY IF EXISTS "advisor_documents_public_read" ON storage.objects;
CREATE POLICY "advisor_documents_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'advisor-documents');
DROP POLICY IF EXISTS "advisor_documents_admin_insert" ON storage.objects;
CREATE POLICY "advisor_documents_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'advisor-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
DROP POLICY IF EXISTS "advisor_documents_admin_update" ON storage.objects;
CREATE POLICY "advisor_documents_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'advisor-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
DROP POLICY IF EXISTS "advisor_documents_admin_delete" ON storage.objects;
CREATE POLICY "advisor_documents_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'advisor-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get plan resources by slug
CREATE OR REPLACE FUNCTION public.get_plan_resource_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  plan_slug TEXT,
  plan_name TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  overview_content TEXT,
  pricing_content TEXT,
  handbook_url TEXT,
  handbook_title TEXT,
  flyer_url TEXT,
  flyer_title TEXT,
  qrg_url TEXT,
  qrg_title TEXT,
  state_guidelines JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    apr.id,
    apr.plan_slug,
    apr.plan_name,
    apr.description,
    apr.icon,
    apr.color,
    apr.overview_content,
    apr.pricing_content,
    apr.handbook_url,
    apr.handbook_title,
    apr.flyer_url,
    apr.flyer_title,
    apr.qrg_url,
    apr.qrg_title,
    apr.state_guidelines
  FROM public.advisor_plan_resources apr
  WHERE apr.plan_slug = p_slug
    AND apr.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Function to get all active SOPs by category
CREATE OR REPLACE FUNCTION public.get_sops_by_category(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  content TEXT,
  file_url TEXT,
  version TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.id,
    sd.title,
    sd.description,
    sd.category,
    sd.tags,
    sd.content,
    sd.file_url,
    sd.version,
    sd.created_at,
    sd.updated_at
  FROM public.sop_documents sd
  WHERE sd.is_active = true
    AND (p_category IS NULL OR sd.category = p_category)
  ORDER BY sd.order_index, sd.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_plan_resource_by_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sops_by_category(TEXT) TO anon, authenticated;
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================;
