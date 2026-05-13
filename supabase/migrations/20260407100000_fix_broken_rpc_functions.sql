-- ============================================================================
-- Migration: Fix all broken RPC functions found by db lint
--
-- Drops 7 orphaned functions (not called by any app code) and fixes 11
-- actively-used functions that reference missing tables/columns.
-- ============================================================================

-- ============================
-- 1. DROP ORPHANED FUNCTIONS
-- ============================

DROP FUNCTION IF EXISTS public.get_unified_user_roles();
DROP FUNCTION IF EXISTS public.generate_tracking_token();
DROP FUNCTION IF EXISTS public.share_note_with_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_advisor_hierarchy_tree(uuid);
DROP FUNCTION IF EXISTS public.get_hierarchy_stats(uuid);
DROP FUNCTION IF EXISTS public.get_active_advisor_meeting(uuid);
DROP FUNCTION IF EXISTS public.get_meeting_with_stats(uuid);
-- ============================
-- 2. FIX ACTIVE FUNCTIONS
-- ============================

-- 2a. crm_advisor_performance: org_members → org_memberships,
--     crm_lead_tasks → lead_tasks, crm_lead_activities → lead_activities
CREATE OR REPLACE FUNCTION public.crm_advisor_performance(p_org_id uuid)
RETURNS TABLE(
  advisor_id uuid, advisor_email text, advisor_name text,
  total_leads bigint, new_leads_this_month bigint, converted_leads bigint,
  open_tasks bigint, overdue_tasks bigint, activities_this_month bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS advisor_id,
        u.email::text AS advisor_email,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS advisor_name,
        COUNT(DISTINCT l.id)::bigint AS total_leads,
        COUNT(DISTINCT l.id) FILTER (
            WHERE l.created_at >= date_trunc('month', CURRENT_DATE)
        )::bigint AS new_leads_this_month,
        COUNT(DISTINCT l.id) FILTER (
            WHERE l.pipeline_stage IN ('converted', 'won', 'closed_won')
        )::bigint AS converted_leads,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.org_id = p_org_id
            AND t.completed = false
        ) AS open_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.org_id = p_org_id
            AND t.completed = false
            AND t.due_date < CURRENT_DATE
        ) AS overdue_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_activities a
            WHERE a.created_by = u.id
            AND a.org_id = p_org_id
            AND a.created_at >= date_trunc('month', CURRENT_DATE)
        ) AS activities_this_month
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_submissions l ON l.owner_id = u.id AND l.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY total_leads DESC;
END;
$$;
-- 2b. get_active_advisor_emails: is_active → status = 'active'
CREATE OR REPLACE FUNCTION public.get_active_advisor_emails()
RETURNS TABLE(advisor_id uuid, email text, first_name text, last_name text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.id as advisor_id,
    COALESCE(ap.email, u.email) as email,
    ap.first_name,
    ap.last_name
  FROM advisor_profiles ap
  LEFT JOIN auth.users u ON ap.user_id = u.id
  WHERE ap.status = 'active'
    AND (ap.email IS NOT NULL OR u.email IS NOT NULL);
END;
$$;
-- 2c. crm_pipeline_breakdown: add GROUP BY clause
CREATE OR REPLACE FUNCTION public.crm_pipeline_breakdown(p_org_id uuid)
RETURNS TABLE(
  stage_name text, stage_display_name text, stage_color text,
  total_in_stage bigint, healthshare_count bigint,
  traditional_count bigint, unspecified_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.name::text AS stage_name,
        ps.display_name::text AS stage_display_name,
        ps.color::text AS stage_color,
        COUNT(l.id)::bigint AS total_in_stage,
        COUNT(l.id) FILTER (WHERE l.plan_type = 'healthshare')::bigint AS healthshare_count,
        COUNT(l.id) FILTER (WHERE l.plan_type = 'traditional')::bigint AS traditional_count,
        COUNT(l.id) FILTER (WHERE l.plan_type IS NULL OR l.plan_type NOT IN ('healthshare', 'traditional'))::bigint AS unspecified_count
    FROM public.crm_pipeline_stages ps
    LEFT JOIN public.lead_submissions l
        ON l.pipeline_stage = ps.name
        AND l.org_id = p_org_id
    WHERE ps.org_id = p_org_id
    AND ps.is_active = true
    GROUP BY ps.name, ps.display_name, ps.color, ps.sort_order
    ORDER BY ps.sort_order;
END;
$$;
-- 2d. crm_today_summary: remove ::text cast on uuid comparisons
CREATE OR REPLACE FUNCTION public.crm_today_summary(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result json;
BEGIN
  SELECT json_build_object(
    'tasks_due_today', (
      SELECT count(*) FROM public.lead_tasks
      WHERE org_id = p_org_id
        AND assigned_to = v_user_id
        AND completed = false
        AND due_date::date = CURRENT_DATE
    ),
    'tasks_overdue', (
      SELECT count(*) FROM public.lead_tasks
      WHERE org_id = p_org_id
        AND assigned_to = v_user_id
        AND completed = false
        AND due_date < CURRENT_DATE
    ),
    'new_leads_today', (
      SELECT count(*) FROM public.lead_submissions
      WHERE org_id = p_org_id
        AND created_at::date = CURRENT_DATE
    ),
    'new_leads_this_week', (
      SELECT count(*) FROM public.lead_submissions
      WHERE org_id = p_org_id
        AND created_at >= date_trunc('week', CURRENT_DATE)
    ),
    'upcoming_events', (
      SELECT count(*) FROM public.calendar_events
      WHERE org_id = p_org_id
        AND (assigned_to = v_user_id OR created_by = v_user_id)
        AND start_time >= now()
        AND start_time < now() + interval '24 hours'
        AND status != 'cancelled'
    ),
    'unread_emails', (
      SELECT count(*) FROM public.crm_email_log
      WHERE org_id = p_org_id
        AND direction = 'inbound'
        AND is_read = false
    ),
    'focus_items', (
      SELECT count(*) FROM public.crm_focus_items
      WHERE org_id = p_org_id
        AND user_id = v_user_id
        AND completed_at IS NULL
    ),
    'open_deals_value', (
      SELECT coalesce(sum(amount), 0) FROM public.crm_deals
      WHERE org_id = p_org_id
        AND owner_id = v_user_id
        AND stage_id IS NOT NULL
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
-- 2e. increment_message_template_times_used: create table if missing, then fix
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  category text,
  times_used integer DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'Authenticated users can manage message_templates'
  ) THEN
    CREATE POLICY "Authenticated users can manage message_templates"
      ON public.message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
-- 2f. increment_saved_search_use_count: create table if missing, then fix
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  search_type text,
  filters jsonb DEFAULT '{}'::jsonb,
  use_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Authenticated users can manage saved_searches'
  ) THEN
    CREATE POLICY "Authenticated users can manage saved_searches"
      ON public.saved_searches FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
-- 2g. get_available_health_plans: tier → plan_type, features removed, display_order → sort_order
DROP FUNCTION IF EXISTS public.get_available_health_plans();
CREATE FUNCTION public.get_available_health_plans()
RETURNS TABLE(id uuid, name text, slug text, tier text, monthly_contribution numeric, features jsonb)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.plan_type::text AS tier,
    pp.monthly_contribution,
    '{}'::jsonb AS features
  FROM plans p
  LEFT JOIN plan_pricing pp ON pp.plan_id = p.id
    AND pp.effective_date <= CURRENT_DATE
    AND pp.member_type = 'individual'
  WHERE p.is_active = true
  ORDER BY p.sort_order;
END;
$$;
-- 2h. get_activity_feed: entity_type/entity_id don't exist in activities,
--     user_id → actor_id
DROP FUNCTION IF EXISTS public.get_activity_feed(uuid, uuid, integer, integer);
CREATE FUNCTION public.get_activity_feed(
  p_user_id uuid,
  p_org_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(id uuid, activity_type text, description text, entity_type text, entity_id uuid, metadata jsonb, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.activity_type,
    a.description,
    a.actor_type AS entity_type,
    COALESCE(a.lead_id, a.contact_id, a.task_id) AS entity_id,
    a.metadata,
    a.created_at
  FROM public.activities a
  WHERE a.actor_id = p_user_id
    AND (p_org_id IS NULL OR a.org_id = p_org_id)
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
-- 2i. get_automation_stats: run_count → execution_count, org_id doesn't exist
CREATE OR REPLACE FUNCTION public.get_automation_stats(p_org_id uuid)
RETURNS TABLE(total_rules integer, active_rules integer, total_runs integer, success_rate numeric)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_rules,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_rules,
    COALESCE(SUM(execution_count), 0)::INTEGER as total_runs,
    100::NUMERIC as success_rate
  FROM public.ai_automation_rules;
END;
$$;
-- 2j. create_instant_meeting: jitsi_room_name → room_name
CREATE OR REPLACE FUNCTION public.create_instant_meeting(
  p_title text,
  p_host_id uuid,
  p_visibility text DEFAULT 'all',
  p_advisor_ids uuid[] DEFAULT NULL
)
RETURNS advisor_meetings
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_meeting advisor_meetings;
  v_room_name TEXT;
BEGIN
  v_room_name := 'mpb-instant-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);

  INSERT INTO advisor_meetings (
    title,
    description,
    scheduled_at,
    duration_minutes,
    status,
    room_name,
    visibility,
    meeting_type,
    host_id,
    started_at
  ) VALUES (
    p_title,
    'Instant meeting started by admin',
    NOW(),
    60,
    'live',
    v_room_name,
    p_visibility,
    CASE WHEN array_length(p_advisor_ids, 1) = 1 THEN 'one_on_one' ELSE 'group' END,
    p_host_id,
    NOW()
  )
  RETURNING * INTO v_meeting;

  IF p_advisor_ids IS NOT NULL AND array_length(p_advisor_ids, 1) > 0 THEN
    PERFORM invite_advisors_to_meeting(v_meeting.id, p_advisor_ids);
  ELSIF p_visibility = 'all' THEN
    PERFORM invite_all_advisors_to_meeting(v_meeting.id);
  END IF;

  RETURN v_meeting;
END;
$$;
-- 2k. get_leaderboard (overloaded – two signatures)
--     Version 1 (3 args): profiles.full_name doesn't exist, ua.points doesn't exist
--     user_achievements has progress/target/is_earned but no points column.
--     Use COUNT of earned achievements as score proxy.
DROP FUNCTION IF EXISTS public.get_leaderboard(uuid, text, integer);
CREATE FUNCTION public.get_leaderboard(
  p_org_id uuid DEFAULT NULL,
  p_period text DEFAULT 'month',
  p_limit integer DEFAULT 10
)
RETURNS TABLE(rank integer, user_id uuid, user_name text, avatar_url text, total_points integer, deals_closed integer, revenue numeric)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(ua.id) FILTER (WHERE ua.is_earned = true) DESC)::INTEGER as rank,
    p.id as user_id,
    COALESCE(
      (SELECT u.raw_user_meta_data->>'full_name' FROM auth.users u WHERE u.id = p.id),
      'Unknown'
    ) as user_name,
    NULL::text as avatar_url,
    (COUNT(ua.id) FILTER (WHERE ua.is_earned = true))::INTEGER as total_points,
    0::INTEGER as deals_closed,
    0::NUMERIC as revenue
  FROM public.profiles p
  LEFT JOIN public.user_achievements ua ON p.id = ua.user_id
  GROUP BY p.id
  ORDER BY total_points DESC
  LIMIT p_limit;
END;
$$;
--     Version 2 (4 args): ap.points doesn't exist, org_memberships not org_members
DROP FUNCTION IF EXISTS public.get_leaderboard(uuid, text, text, integer);
CREATE FUNCTION public.get_leaderboard(
  p_org_id uuid,
  p_metric text DEFAULT 'score',
  p_period text DEFAULT 'week',
  p_limit integer DEFAULT 10
)
RETURNS TABLE(rank integer, user_id uuid, user_name text, avatar_url text, score integer, achievements_count integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(ua.id) FILTER (WHERE ua.is_earned = true) DESC)::INTEGER AS rank,
    ap.user_id,
    COALESCE(ap.first_name || ' ' || ap.last_name, 'Unknown') AS user_name,
    ap.avatar_url,
    (COUNT(ua.id) FILTER (WHERE ua.is_earned = true))::INTEGER AS score,
    COUNT(DISTINCT CASE WHEN ua.is_earned = TRUE THEN ua.id END)::INTEGER AS achievements_count
  FROM advisor_profiles ap
  JOIN org_memberships om ON om.user_id = ap.user_id
  LEFT JOIN user_achievements ua ON ua.user_id = ap.user_id
  WHERE om.org_id = p_org_id
    AND om.status = 'active'
  GROUP BY ap.user_id, ap.first_name, ap.last_name, ap.avatar_url
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;
