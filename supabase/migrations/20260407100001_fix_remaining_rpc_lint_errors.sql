-- ============================================================================
-- Migration: Fix remaining 6 DB lint errors from previous migration
-- ============================================================================

-- 1. Drop orphaned functions with correct signatures
DROP FUNCTION IF EXISTS public.share_note_with_role(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_advisor_hierarchy_tree(text);
DROP FUNCTION IF EXISTS public.get_hierarchy_stats(text);
DROP FUNCTION IF EXISTS public.get_active_advisor_meeting();

-- 2. Fix crm_advisor_performance: l.owner_id → l.assigned_to
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
    LEFT JOIN public.lead_submissions l ON l.assigned_to = u.id AND l.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY total_leads DESC;
END;
$$;

-- 3. Fix get_activity_feed: cast activity_type enum to text
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
    a.activity_type::text,
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
