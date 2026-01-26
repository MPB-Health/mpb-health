/*
  # CRM System Tables and Fields

  ## Overview
  Creates the database infrastructure for the admin CRM suite including:
  - Extended fields on zoho_lead_submissions for pipeline management
  - Lead activities table for tracking interactions
  - Lead tasks table for follow-up reminders
  - Pipeline stages configuration

  ## Changes
  1. Add CRM columns to zoho_lead_submissions
  2. Create lead_activities table
  3. Create lead_tasks table
  4. Create crm_pipeline_stages table for configurable stages
  5. Add RLS policies for all new tables
*/

-- ============================================================================
-- PART 1: Add CRM fields to zoho_lead_submissions
-- ============================================================================

ALTER TABLE zoho_lead_submissions 
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text;

-- Create indexes for CRM queries
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_pipeline_stage ON zoho_lead_submissions(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_assigned_to ON zoho_lead_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_priority ON zoho_lead_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_next_followup ON zoho_lead_submissions(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_tags ON zoho_lead_submissions USING gin(tags);

-- ============================================================================
-- PART 2: Create CRM Pipeline Stages table
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  color text DEFAULT '#6B7280',
  icon text,
  sort_order integer NOT NULL,
  is_active boolean DEFAULT true,
  is_won_stage boolean DEFAULT false,
  is_lost_stage boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default pipeline stages
INSERT INTO crm_pipeline_stages (name, display_name, color, sort_order, is_won_stage, is_lost_stage) VALUES
  ('new', 'New', '#3B82F6', 1, false, false),
  ('contacted', 'Contacted', '#8B5CF6', 2, false, false),
  ('qualified', 'Qualified', '#10B981', 3, false, false),
  ('proposal', 'Proposal', '#F59E0B', 4, false, false),
  ('negotiation', 'Negotiation', '#EC4899', 5, false, false),
  ('won', 'Won', '#22C55E', 6, true, false),
  ('lost', 'Lost', '#EF4444', 7, false, true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pipeline stages"
  ON crm_pipeline_stages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- PART 3: Create Lead Activities table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('note', 'call', 'email', 'meeting', 'status_change', 'assignment', 'task_created', 'task_completed')),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_by ON lead_activities(created_by);

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all lead activities"
  ON lead_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can create lead activities"
  ON lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update lead activities"
  ON lead_activities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete lead activities"
  ON lead_activities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- PART 4: Create Lead Tasks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text DEFAULT 'follow_up' CHECK (task_type IN ('follow_up', 'call', 'email', 'meeting', 'other')),
  due_date timestamptz NOT NULL,
  due_time time,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON lead_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_completed ON lead_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_overdue ON lead_tasks(due_date) WHERE completed = false;

ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all lead tasks"
  ON lead_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can create lead tasks"
  ON lead_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update lead tasks"
  ON lead_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete lead tasks"
  ON lead_tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- PART 5: Helper Functions
-- ============================================================================

-- Function to update stage_changed_at when pipeline_stage changes
CREATE OR REPLACE FUNCTION update_lead_stage_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.stage_changed_at = now();
    
    -- Set converted_at if moving to won stage
    IF NEW.pipeline_stage = 'won' AND OLD.pipeline_stage != 'won' THEN
      NEW.converted_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_stage_changed ON zoho_lead_submissions;
CREATE TRIGGER trigger_lead_stage_changed
  BEFORE UPDATE ON zoho_lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_stage_changed_at();

-- Function to update updated_at on lead_tasks
CREATE OR REPLACE FUNCTION update_lead_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_task_updated ON lead_tasks;
CREATE TRIGGER trigger_lead_task_updated
  BEFORE UPDATE ON lead_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_task_updated_at();

-- Function to get CRM dashboard stats
CREATE OR REPLACE FUNCTION get_crm_dashboard_stats()
RETURNS TABLE (
  total_leads bigint,
  new_leads bigint,
  leads_by_stage jsonb,
  leads_by_priority jsonb,
  overdue_tasks bigint,
  tasks_due_today bigint,
  conversion_rate numeric,
  avg_days_to_close numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_leads,
    COUNT(*) FILTER (WHERE pipeline_stage = 'new')::bigint AS new_leads,
    (
      SELECT jsonb_object_agg(pipeline_stage, count)
      FROM (
        SELECT pipeline_stage, COUNT(*)::integer as count
        FROM zoho_lead_submissions
        GROUP BY pipeline_stage
      ) stage_counts
    ) AS leads_by_stage,
    (
      SELECT jsonb_object_agg(priority, count)
      FROM (
        SELECT COALESCE(priority, 'medium') as priority, COUNT(*)::integer as count
        FROM zoho_lead_submissions
        GROUP BY priority
      ) priority_counts
    ) AS leads_by_priority,
    (
      SELECT COUNT(*)::bigint
      FROM lead_tasks
      WHERE completed = false AND due_date < CURRENT_DATE
    ) AS overdue_tasks,
    (
      SELECT COUNT(*)::bigint
      FROM lead_tasks
      WHERE completed = false AND due_date::date = CURRENT_DATE
    ) AS tasks_due_today,
    CASE 
      WHEN COUNT(*) FILTER (WHERE pipeline_stage IN ('won', 'lost')) > 0 
      THEN ROUND(
        COUNT(*) FILTER (WHERE pipeline_stage = 'won')::numeric * 100 / 
        NULLIF(COUNT(*) FILTER (WHERE pipeline_stage IN ('won', 'lost')), 0),
        1
      )
      ELSE 0
    END AS conversion_rate,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (converted_at - created_at)) / 86400
      ) FILTER (WHERE converted_at IS NOT NULL),
      0
    )::numeric AS avg_days_to_close
  FROM zoho_lead_submissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leads with filters
CREATE OR REPLACE FUNCTION get_filtered_leads(
  p_stage text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  zip_code text,
  pipeline_stage text,
  priority text,
  assigned_to uuid,
  lead_score integer,
  source_cta text,
  source_page text,
  created_at timestamptz,
  stage_changed_at timestamptz,
  next_followup_at timestamptz,
  tags text[],
  zoho_lead_id text,
  zoho_sync_status text,
  total_count bigint
) AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO v_total_count
  FROM zoho_lead_submissions zls
  WHERE (p_stage IS NULL OR zls.pipeline_stage = p_stage)
    AND (p_priority IS NULL OR zls.priority = p_priority)
    AND (p_assigned_to IS NULL OR zls.assigned_to = p_assigned_to)
    AND (p_date_from IS NULL OR zls.created_at >= p_date_from)
    AND (p_date_to IS NULL OR zls.created_at <= p_date_to)
    AND (p_search IS NULL OR (
      zls.first_name ILIKE '%' || p_search || '%' OR
      zls.last_name ILIKE '%' || p_search || '%' OR
      zls.email ILIKE '%' || p_search || '%' OR
      zls.phone ILIKE '%' || p_search || '%'
    ));

  RETURN QUERY
  SELECT
    zls.id,
    zls.first_name,
    zls.last_name,
    zls.email,
    zls.phone,
    zls.zip_code,
    zls.pipeline_stage,
    zls.priority,
    zls.assigned_to,
    zls.lead_score,
    zls.source_cta,
    zls.source_page,
    zls.created_at,
    zls.stage_changed_at,
    zls.next_followup_at,
    zls.tags,
    zls.zoho_lead_id,
    zls.zoho_sync_status,
    v_total_count
  FROM zoho_lead_submissions zls
  WHERE (p_stage IS NULL OR zls.pipeline_stage = p_stage)
    AND (p_priority IS NULL OR zls.priority = p_priority)
    AND (p_assigned_to IS NULL OR zls.assigned_to = p_assigned_to)
    AND (p_date_from IS NULL OR zls.created_at >= p_date_from)
    AND (p_date_to IS NULL OR zls.created_at <= p_date_to)
    AND (p_search IS NULL OR (
      zls.first_name ILIKE '%' || p_search || '%' OR
      zls.last_name ILIKE '%' || p_search || '%' OR
      zls.email ILIKE '%' || p_search || '%' OR
      zls.phone ILIKE '%' || p_search || '%'
    ))
  ORDER BY zls.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
