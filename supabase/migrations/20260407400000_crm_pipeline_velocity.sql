-- ==========================================================================
-- CRM Pipeline Velocity Metrics
-- RPCs for stage-level velocity analytics and stuck-lead detection
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. crm_lead_stage_velocity — per-stage velocity metrics
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_lead_stage_velocity(p_org_id uuid)
RETURNS TABLE(
  stage_name        text,
  stage_display_name text,
  stage_color       text,
  lead_count        int,
  avg_days_in_stage numeric,
  median_days_in_stage numeric,
  total_value       numeric,
  conversion_rate   numeric,
  stuck_count       int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH stage_leads AS (
    SELECT
      ps.name            AS s_name,
      ps.display_name    AS s_display,
      ps.color           AS s_color,
      ps.sort_order      AS s_order,
      ls.id              AS lead_id,
      ls.premium_amount,
      ls.stage_changed_at,
      ls.last_contacted_at,
      EXTRACT(EPOCH FROM (now() - COALESCE(ls.stage_changed_at, ls.created_at))) / 86400.0
        AS days_in
    FROM lead_submissions ls
    JOIN crm_pipeline_stages ps
      ON ps.name = ls.pipeline_stage
     AND (ps.org_id = p_org_id OR ps.org_id IS NULL)
    WHERE ls.org_id = p_org_id
      AND ps.is_active = true
  ),
  stage_agg AS (
    SELECT
      s_name,
      s_display,
      s_color,
      s_order,
      COUNT(*)::int                                    AS cnt,
      ROUND(AVG(days_in), 1)                           AS avg_d,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_in), 1) AS med_d,
      COALESCE(SUM(premium_amount), 0)::numeric        AS val,
      COUNT(*) FILTER (
        WHERE days_in > 7
          AND (last_contacted_at IS NULL OR last_contacted_at < now() - interval '3 days')
      )::int                                           AS stuck
    FROM stage_leads
    GROUP BY s_name, s_display, s_color, s_order
  ),
  conversions AS (
    SELECT
      ps.name AS s_name,
      COUNT(DISTINCT ls.id) FILTER (
        WHERE ls.stage_changed_at IS NOT NULL
          AND ls.pipeline_stage <> ps.name
      ) AS moved_forward,
      COUNT(DISTINCT ls2.id) AS ever_entered
    FROM crm_pipeline_stages ps
    LEFT JOIN lead_submissions ls2
      ON ls2.org_id = p_org_id
    LEFT JOIN lead_submissions ls
      ON ls.org_id = p_org_id
     AND ls.id = ls2.id
    WHERE (ps.org_id = p_org_id OR ps.org_id IS NULL)
      AND ps.is_active = true
    GROUP BY ps.name
  )
  SELECT
    sa.s_name::text                     AS stage_name,
    sa.s_display::text                  AS stage_display_name,
    sa.s_color::text                    AS stage_color,
    sa.cnt                              AS lead_count,
    sa.avg_d                            AS avg_days_in_stage,
    sa.med_d                            AS median_days_in_stage,
    sa.val                              AS total_value,
    CASE WHEN sa.cnt > 0
      THEN ROUND(
        (sa.cnt - sa.stuck)::numeric / sa.cnt * 100, 1
      )
      ELSE 0
    END                                 AS conversion_rate,
    sa.stuck                            AS stuck_count
  FROM stage_agg sa
  ORDER BY sa.s_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_lead_stage_velocity(uuid) TO authenticated;

-- --------------------------------------------------------------------------
-- 2. crm_get_stuck_leads — leads that haven't progressed or been contacted
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_get_stuck_leads(
  p_org_id          uuid,
  p_days_threshold  int DEFAULT 7
)
RETURNS TABLE(
  lead_id            uuid,
  first_name         text,
  last_name          text,
  primary_email      text,
  pipeline_stage     text,
  stage_display_name text,
  days_in_stage      int,
  days_since_contact int,
  premium_amount     numeric,
  lead_score         int,
  assigned_to_name   text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.id                                            AS lead_id,
    ls.first_name::text,
    ls.last_name::text,
    ls.email::text                                   AS primary_email,
    ls.pipeline_stage::text,
    ps.display_name::text                            AS stage_display_name,
    EXTRACT(DAY FROM (now() - COALESCE(ls.stage_changed_at, ls.created_at)))::int
                                                     AS days_in_stage,
    CASE
      WHEN ls.last_contacted_at IS NULL THEN -1
      ELSE EXTRACT(DAY FROM (now() - ls.last_contacted_at))::int
    END                                              AS days_since_contact,
    COALESCE(ls.premium_amount, 0)::numeric          AS premium_amount,
    COALESCE(ls.lead_score, 0)::int                  AS lead_score,
    COALESCE(
      (SELECT u.raw_user_meta_data->>'full_name'
       FROM auth.users u WHERE u.id = ls.assigned_to),
      'Unassigned'
    )::text                                          AS assigned_to_name
  FROM lead_submissions ls
  LEFT JOIN crm_pipeline_stages ps
    ON ps.name = ls.pipeline_stage
   AND (ps.org_id = p_org_id OR ps.org_id IS NULL)
  WHERE ls.org_id = p_org_id
    AND COALESCE(ls.stage_changed_at, ls.created_at)
        < now() - (p_days_threshold || ' days')::interval
    AND (ls.last_contacted_at IS NULL
         OR ls.last_contacted_at < now() - interval '3 days')
    AND ls.pipeline_stage NOT IN ('won', 'lost', 'converted', 'closed', 'closed_won', 'closed_lost')
  ORDER BY days_in_stage DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_get_stuck_leads(uuid, int) TO authenticated;
