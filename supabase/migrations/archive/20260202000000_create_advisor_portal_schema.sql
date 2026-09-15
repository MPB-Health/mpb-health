-- ============================================================================
-- Comprehensive Advisor Portal Schema Migration
-- Creates all missing tables, functions, and fixes schema issues
-- ============================================================================

-- ============================================================================
-- 1. QUICK ACTIONS TABLE (fix schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'Zap',
  description TEXT,
  category TEXT DEFAULT 'dashboard_actions',
  display_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  is_external BOOLEAN DEFAULT false,
  requires_auth BOOLEAN DEFAULT false,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 2. USER ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 3. COMPLIANCE DOCUMENTS & ACKNOWLEDGMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  due_date DATE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.compliance_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'expired')),
  acknowledged_at TIMESTAMPTZ,
  due_date DATE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);
-- ============================================================================
-- 4. PERFORMANCE GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 5. LEADS TABLE (if missing columns)
-- ============================================================================
DO $$
BEGIN
  -- Add missing columns to leads if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_advisor_id') THEN
      ALTER TABLE public.leads ADD COLUMN assigned_advisor_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
      ALTER TABLE public.leads ADD COLUMN status TEXT DEFAULT 'new';
    END IF;
  END IF;
END $$;
-- ============================================================================
-- 6. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID,
  conversation_id UUID,
  subject TEXT,
  body TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'chat', 'call')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 7. TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 8. ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 9. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  channel TEXT DEFAULT 'email',
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 10. SEQUENCES (for email/outreach sequences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  steps JSONB DEFAULT '[]'::jsonb,
  enrollment_count INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 11. AUTOMATION TEMPLATES & RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  trigger_type TEXT NOT NULL,
  actions JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.ai_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 12. FORM SUBMISSIONS (for advisor forms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID,
  advisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_name TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 13. SOP DOCUMENTS & CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Folder',
  order_index INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.sop_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$
BEGIN
  -- Create sop_documents if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sop_documents' AND table_schema = 'public') THEN
    CREATE TABLE public.sop_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      content TEXT,
      category_id UUID,
      is_published BOOLEAN DEFAULT false,
      view_count INTEGER DEFAULT 0,
      version TEXT DEFAULT '1.0',
      author_id UUID,
      tags TEXT[] DEFAULT '{}',
      metadata JSONB DEFAULT '{}'::jsonb,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add missing columns to existing table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_documents' AND column_name = 'is_published') THEN
      ALTER TABLE public.sop_documents ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_documents' AND column_name = 'view_count') THEN
      ALTER TABLE public.sop_documents ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_documents' AND column_name = 'slug') THEN
      ALTER TABLE public.sop_documents ADD COLUMN slug TEXT;
    END IF;
  END IF;
END $$;
-- ============================================================================
-- 14. FIX ZOHO_LEAD_SUBMISSIONS COLUMNS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zoho_lead_submissions' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zoho_lead_submissions' AND column_name = 'assigned_to') THEN
      ALTER TABLE public.zoho_lead_submissions ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zoho_lead_submissions' AND column_name = 'pipeline_stage_id') THEN
      ALTER TABLE public.zoho_lead_submissions ADD COLUMN pipeline_stage_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zoho_lead_submissions' AND column_name = 'pipeline_stage') THEN
      ALTER TABLE public.zoho_lead_submissions ADD COLUMN pipeline_stage TEXT DEFAULT 'new';
    END IF;
  END IF;
END $$;
-- ============================================================================
-- 15. CRM PIPELINE STAGES (add missing columns if table exists)
-- ============================================================================
DO $$
BEGIN
  -- Create table if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_pipeline_stages' AND table_schema = 'public') THEN
    CREATE TABLE public.crm_pipeline_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      org_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_pipeline_stages' AND column_name = 'slug') THEN
    ALTER TABLE public.crm_pipeline_stages ADD COLUMN slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_pipeline_stages' AND column_name = 'order_index') THEN
    ALTER TABLE public.crm_pipeline_stages ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_pipeline_stages' AND column_name = 'color') THEN
    ALTER TABLE public.crm_pipeline_stages ADD COLUMN color TEXT DEFAULT '#3B82F6';
  END IF;
END $$;
-- Seed default pipeline stages - skip if we can't insert due to schema mismatch
-- The table may already be seeded or have different required columns
DO $$ 
BEGIN
  -- Only try to insert if the table is empty
  IF NOT EXISTS (SELECT 1 FROM public.crm_pipeline_stages LIMIT 1) THEN
    BEGIN
      -- Try inserting with name and display_name if display_name exists
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_pipeline_stages' AND column_name = 'display_name') THEN
        INSERT INTO public.crm_pipeline_stages (name, display_name) VALUES
          ('New', 'New'),
          ('Contacted', 'Contacted'),
          ('Qualified', 'Qualified'),
          ('Proposal', 'Proposal'),
          ('Negotiation', 'Negotiation'),
          ('Closed Won', 'Closed Won'),
          ('Closed Lost', 'Closed Lost');
      ELSE
        INSERT INTO public.crm_pipeline_stages (name) VALUES
          ('New'), ('Contacted'), ('Qualified'), ('Proposal'), ('Negotiation'), ('Closed Won'), ('Closed Lost');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore insertion errors
      NULL;
    END;
  END IF;
END $$;
-- ============================================================================
-- RPC FUNCTIONS (Drop existing first to allow signature changes)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_compliance_status(UUID);
DROP FUNCTION IF EXISTS public.get_recent_searches(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_activity_feed(UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_leaderboard(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_metric_timeseries(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS public.get_automation_stats(UUID);
DROP FUNCTION IF EXISTS public.get_inbox_summary(UUID, UUID);
-- 1. get_user_compliance_status
CREATE OR REPLACE FUNCTION public.get_user_compliance_status(p_user_id UUID)
RETURNS TABLE (
  total_documents INTEGER,
  acknowledged INTEGER,
  pending INTEGER,
  expired INTEGER,
  compliance_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_documents,
    COUNT(*) FILTER (WHERE ca.status = 'acknowledged')::INTEGER as acknowledged,
    COUNT(*) FILTER (WHERE ca.status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE ca.status = 'expired')::INTEGER as expired,
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND((COUNT(*) FILTER (WHERE ca.status = 'acknowledged')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    END as compliance_rate
  FROM public.compliance_documents cd
  LEFT JOIN public.compliance_acknowledgments ca ON cd.id = ca.document_id AND ca.user_id = p_user_id
  WHERE cd.is_active = true;
END;
$$;
-- 2. get_recent_searches
CREATE OR REPLACE FUNCTION public.get_recent_searches(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  query TEXT,
  result_count INTEGER,
  searched_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Return empty for now - can be populated later
  RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 0::INTEGER, NULL::TIMESTAMPTZ WHERE FALSE;
END;
$$;
-- 3. get_activity_feed
CREATE OR REPLACE FUNCTION public.get_activity_feed(
  p_user_id UUID,
  p_org_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.activity_type,
    a.description,
    a.entity_type,
    a.entity_id,
    a.metadata,
    a.created_at
  FROM public.activities a
  WHERE a.user_id = p_user_id
    AND (p_org_id IS NULL OR a.org_id = p_org_id)
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
-- 4. get_leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_org_id UUID DEFAULT NULL,
  p_period TEXT DEFAULT 'month',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  user_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  deals_closed INTEGER,
  revenue NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ua.points), 0) DESC)::INTEGER as rank,
    p.id as user_id,
    COALESCE(p.full_name, 'Unknown') as user_name,
    p.avatar_url,
    COALESCE(SUM(ua.points), 0)::INTEGER as total_points,
    0::INTEGER as deals_closed,
    0::NUMERIC as revenue
  FROM public.profiles p
  LEFT JOIN public.user_achievements ua ON p.id = ua.user_id
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY total_points DESC
  LIMIT p_limit;
END;
$$;
-- 5. get_metric_timeseries (simplified version)
CREATE OR REPLACE FUNCTION public.get_metric_timeseries(
  p_metric_name TEXT,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_granularity TEXT DEFAULT 'day'
)
RETURNS TABLE (
  date TIMESTAMPTZ,
  value NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Return placeholder data - should be connected to actual metrics
  RETURN QUERY
  SELECT 
    generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::TIMESTAMPTZ as date,
    (random() * 100)::NUMERIC as value;
END;
$$;
-- 6. get_automation_stats
CREATE OR REPLACE FUNCTION public.get_automation_stats(p_org_id UUID)
RETURNS TABLE (
  total_rules INTEGER,
  active_rules INTEGER,
  total_runs INTEGER,
  success_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_rules,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_rules,
    COALESCE(SUM(run_count), 0)::INTEGER as total_runs,
    100::NUMERIC as success_rate
  FROM public.ai_automation_rules
  WHERE org_id = p_org_id OR org_id IS NULL;
END;
$$;
-- 7. get_inbox_summary
CREATE OR REPLACE FUNCTION public.get_inbox_summary(p_user_id UUID, p_org_id UUID)
RETURNS TABLE (
  total_conversations INTEGER,
  unread_count INTEGER,
  active_count INTEGER,
  archived_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_conversations,
    COALESCE(SUM(c.unread_count), 0)::INTEGER as unread_count,
    COUNT(*) FILTER (WHERE c.status = 'active')::INTEGER as active_count,
    COUNT(*) FILTER (WHERE c.status = 'archived')::INTEGER as archived_count
  FROM public.conversations c
  WHERE c.org_id = p_org_id
    AND (c.assigned_to = p_user_id OR c.assigned_to IS NULL);
END;
$$;
-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables (ignore errors if already enabled)
DO $$ BEGIN ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.compliance_acknowledgments ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ai_automation_rules ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.sop_documents ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "quick_actions_select" ON public.quick_actions;
DROP POLICY IF EXISTS "user_achievements_select" ON public.user_achievements;
DROP POLICY IF EXISTS "compliance_documents_select" ON public.compliance_documents;
DROP POLICY IF EXISTS "compliance_acknowledgments_select" ON public.compliance_acknowledgments;
DROP POLICY IF EXISTS "compliance_acknowledgments_insert" ON public.compliance_acknowledgments;
DROP POLICY IF EXISTS "compliance_acknowledgments_update" ON public.compliance_acknowledgments;
DROP POLICY IF EXISTS "performance_goals_select" ON public.performance_goals;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "activities_select" ON public.activities;
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "sequences_select" ON public.sequences;
DROP POLICY IF EXISTS "automation_templates_select" ON public.automation_templates;
DROP POLICY IF EXISTS "ai_automation_rules_select" ON public.ai_automation_rules;
DROP POLICY IF EXISTS "form_submissions_select" ON public.form_submissions;
DROP POLICY IF EXISTS "sop_categories_select" ON public.sop_categories;
DROP POLICY IF EXISTS "sop_documents_select" ON public.sop_documents;
DROP POLICY IF EXISTS "crm_pipeline_stages_select" ON public.crm_pipeline_stages;
-- Quick Actions - authenticated users can read
CREATE POLICY "quick_actions_select" ON public.quick_actions FOR SELECT TO authenticated USING (true);
-- User Achievements - authenticated users can read
CREATE POLICY "user_achievements_select" ON public.user_achievements FOR SELECT TO authenticated USING (true);
-- Compliance Documents - authenticated users can read
CREATE POLICY "compliance_documents_select" ON public.compliance_documents FOR SELECT TO authenticated USING (true);
-- Compliance Acknowledgments - authenticated users can manage
CREATE POLICY "compliance_acknowledgments_select" ON public.compliance_acknowledgments FOR SELECT TO authenticated USING (true);
CREATE POLICY "compliance_acknowledgments_insert" ON public.compliance_acknowledgments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "compliance_acknowledgments_update" ON public.compliance_acknowledgments FOR UPDATE TO authenticated USING (true);
-- Performance Goals - authenticated users can read
CREATE POLICY "performance_goals_select" ON public.performance_goals FOR SELECT TO authenticated USING (true);
-- Messages - authenticated users can access (simplified)
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
-- Tasks - users can manage their own (simplified for existing table schema)
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated 
  USING (assigned_to = auth.uid());
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated 
  USING (assigned_to = auth.uid());
-- Activities - authenticated users can read
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated USING (true);
-- Conversations - authenticated users can read org conversations
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT TO authenticated USING (true);
-- Sequences - authenticated users can read org sequences
CREATE POLICY "sequences_select" ON public.sequences FOR SELECT TO authenticated USING (true);
-- Automation Templates - everyone can read
CREATE POLICY "automation_templates_select" ON public.automation_templates FOR SELECT TO authenticated USING (true);
-- AI Automation Rules - authenticated users can read
CREATE POLICY "ai_automation_rules_select" ON public.ai_automation_rules FOR SELECT TO authenticated USING (true);
-- Form Submissions - authenticated users can read
CREATE POLICY "form_submissions_select" ON public.form_submissions FOR SELECT TO authenticated USING (true);
-- SOP Categories - everyone can read
CREATE POLICY "sop_categories_select" ON public.sop_categories FOR SELECT TO authenticated USING (true);
-- SOP Documents - everyone can read
CREATE POLICY "sop_documents_select" ON public.sop_documents FOR SELECT TO authenticated USING (true);
-- CRM Pipeline Stages - everyone can read
CREATE POLICY "crm_pipeline_stages_select" ON public.crm_pipeline_stages FOR SELECT TO authenticated USING (true);
-- ============================================================================
-- SEED DEFAULT DATA
-- ============================================================================

-- Seed SOP Categories
INSERT INTO public.sop_categories (name, slug, description, icon, order_index) VALUES
  ('Getting Started', 'getting-started', 'Onboarding and initial setup procedures', 'Rocket', 1),
  ('Sales Process', 'sales-process', 'Sales methodologies and best practices', 'TrendingUp', 2),
  ('Client Management', 'client-management', 'Managing client relationships', 'Users', 3),
  ('Compliance', 'compliance', 'Regulatory and compliance procedures', 'Shield', 4),
  ('Product Knowledge', 'product-knowledge', 'Understanding our products and services', 'BookOpen', 5)
ON CONFLICT (slug) DO NOTHING;
-- Seed Automation Templates
INSERT INTO public.automation_templates (name, description, category, trigger_type, is_popular) VALUES
  ('Welcome Email Sequence', 'Automatically send welcome emails to new leads', 'onboarding', 'lead_created', true),
  ('Follow-up Reminder', 'Remind advisors to follow up after 3 days', 'follow_up', 'time_delay', true),
  ('Lead Scoring', 'Automatically score leads based on engagement', 'scoring', 'engagement', true),
  ('Birthday Greeting', 'Send birthday greetings to clients', 'engagement', 'date_trigger', false),
  ('Re-engagement Campaign', 'Reach out to inactive leads', 'engagement', 'inactivity', true)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- INDEXES FOR PERFORMANCE (only create if columns exist)
-- ============================================================================
DO $$
BEGIN
  -- User achievements
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
  END IF;
  
  -- Compliance acknowledgments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_acknowledgments' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_compliance_acknowledgments_user_id ON public.compliance_acknowledgments(user_id);
  END IF;
  
  -- Messages
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
  END IF;
  
  -- Tasks
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
  END IF;
  
  -- Activities
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
  END IF;
  
  -- Conversations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'org_id') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON public.conversations(org_id);
  END IF;
  
  -- Sequences
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sequences' AND column_name = 'org_id') THEN
    CREATE INDEX IF NOT EXISTS idx_sequences_org_id ON public.sequences(org_id);
  END IF;
  
  -- SOP documents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_documents' AND column_name = 'category_id') THEN
    CREATE INDEX IF NOT EXISTS idx_sop_documents_category_id ON public.sop_documents(category_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_documents' AND column_name = 'is_published') THEN
    CREATE INDEX IF NOT EXISTS idx_sop_documents_is_published ON public.sop_documents(is_published);
  END IF;
END $$;
