-- Fix remaining functions that still reference zoho_lead_submissions
-- All function signatures remain unchanged; only table references in the body are updated.


CREATE OR REPLACE FUNCTION public.calculate_lead_score_factors(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_lead RECORD;
  v_factors JSONB := '[]'::jsonb;
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_lead FROM lead_submissions WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Household size scoring
  IF v_lead.household_size IS NOT NULL THEN
    IF v_lead.household_size >= 4 THEN
      v_factors := v_factors || jsonb_build_object('factor', 'Large household', 'points', 15, 'positive', true);
      v_score := v_score + 15;
    ELSIF v_lead.household_size >= 2 THEN
      v_factors := v_factors || jsonb_build_object('factor', 'Family household', 'points', 10, 'positive', true);
      v_score := v_score + 10;
    END IF;
  END IF;
  
  -- Contact preference scoring
  IF v_lead.contact_preference = 'call' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Prefers phone calls', 'points', 20, 'positive', true);
    v_score := v_score + 20;
  ELSIF v_lead.contact_preference IS NOT NULL THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Has contact preference', 'points', 10, 'positive', true);
    v_score := v_score + 10;
  END IF;
  
  -- Primary concern scoring
  IF v_lead.primary_concern IN ('cost', 'coverage', 'both') THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Clear primary concern', 'points', 15, 'positive', true);
    v_score := v_score + 15;
  END IF;
  
  -- Lead age scoring (fresher = better)
  IF v_lead.created_at > NOW() - INTERVAL '24 hours' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Fresh lead (< 24h)', 'points', 20, 'positive', true);
    v_score := v_score + 20;
  ELSIF v_lead.created_at > NOW() - INTERVAL '72 hours' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Recent lead (< 3 days)', 'points', 10, 'positive', true);
    v_score := v_score + 10;
  ELSIF v_lead.created_at < NOW() - INTERVAL '7 days' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Aging lead (> 7 days)', 'points', -10, 'positive', false);
    v_score := v_score - 10;
  END IF;
  
  -- Pipeline stage scoring
  IF v_lead.pipeline_stage = 'qualified' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Qualified status', 'points', 15, 'positive', true);
    v_score := v_score + 15;
  ELSIF v_lead.pipeline_stage = 'proposal' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'In proposal stage', 'points', 25, 'positive', true);
    v_score := v_score + 25;
  END IF;
  
  -- Cap score between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score + 30)); -- Base score of 30
  
  -- Upsert the insights
  INSERT INTO ai_lead_insights (lead_id, ai_score, score_factors, last_analyzed_at)
  VALUES (p_lead_id, v_score, v_factors, NOW())
  ON CONFLICT (lead_id) DO UPDATE SET
    ai_score = EXCLUDED.ai_score,
    score_factors = EXCLUDED.score_factors,
    last_analyzed_at = NOW(),
    updated_at = NOW();
  
  RETURN jsonb_build_object('score', v_score, 'factors', v_factors);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_repeat_lead(p_email text, p_phone text)
 RETURNS TABLE(is_repeat boolean, previous_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  email_count INTEGER;
  phone_count INTEGER;
BEGIN
  -- Count previous submissions with same email
  SELECT COUNT(*) INTO email_count
  FROM lead_submissions
  WHERE LOWER(email) = LOWER(p_email)
    AND created_at < now() - interval '5 minutes';
  
  -- Count previous submissions with same phone (if provided)
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT COUNT(*) INTO phone_count
    FROM lead_submissions
    WHERE phone = p_phone
      AND created_at < now() - interval '5 minutes';
  ELSE
    phone_count := 0;
  END IF;
  
  is_repeat := (email_count > 0 OR phone_count > 0);
  previous_count := GREATEST(email_count, phone_count);
  
  RETURN NEXT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_advisor_performance(p_org_id uuid)
 RETURNS TABLE(advisor_id uuid, advisor_email text, advisor_name text, total_leads bigint, new_leads_this_month bigint, converted_leads bigint, open_tasks bigint, overdue_tasks bigint, activities_this_month bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            FROM public.crm_lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.org_id = p_org_id
            AND t.status != 'completed'
        ) AS open_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.crm_lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.org_id = p_org_id
            AND t.status != 'completed'
            AND t.due_date < CURRENT_DATE
        ) AS overdue_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.crm_lead_activities a
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
$function$
;

CREATE OR REPLACE FUNCTION public.crm_pipeline_breakdown(p_org_id uuid)
 RETURNS TABLE(stage_name text, stage_display_name text, stage_color text, total_in_stage bigint, healthshare_count bigint, traditional_count bigint, unspecified_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    ORDER BY ps.sort_order;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_plan_type_stats(p_org_id uuid)
 RETURNS TABLE(plan_type text, total_count bigint, new_today bigint, new_this_week bigint, new_this_month bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(l.plan_type, 'unspecified')::text AS plan_type,
        COUNT(*)::bigint AS total_count,
        COUNT(*) FILTER (WHERE l.created_at >= CURRENT_DATE)::bigint AS new_today,
        COUNT(*) FILTER (WHERE l.created_at >= date_trunc('week', CURRENT_DATE))::bigint AS new_this_week,
        COUNT(*) FILTER (WHERE l.created_at >= date_trunc('month', CURRENT_DATE))::bigint AS new_this_month
    FROM public.lead_submissions l
    WHERE l.org_id = p_org_id
    GROUP BY COALESCE(l.plan_type, 'unspecified')
    ORDER BY total_count DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_today_summary(p_org_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_result json;
BEGIN
  SELECT json_build_object(
    'tasks_due_today', (
      SELECT count(*) FROM public.lead_tasks
      WHERE org_id = p_org_id
        AND assigned_to = v_user_id::text
        AND completed = false
        AND due_date::date = CURRENT_DATE
    ),
    'tasks_overdue', (
      SELECT count(*) FROM public.lead_tasks
      WHERE org_id = p_org_id
        AND assigned_to = v_user_id::text
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
        AND (assigned_to = v_user_id::text OR created_by = v_user_id::text)
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_crm_dashboard_stats()
 RETURNS TABLE(total_leads bigint, new_leads bigint, leads_by_stage jsonb, leads_by_priority jsonb, overdue_tasks bigint, tasks_due_today bigint, conversion_rate numeric, avg_days_to_close numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_leads,
    COUNT(*) FILTER (WHERE pipeline_stage = 'new')::bigint AS new_leads,
    (
      SELECT jsonb_object_agg(pipeline_stage, count)
      FROM (
        SELECT pipeline_stage, COUNT(*)::integer as count
        FROM lead_submissions
        GROUP BY pipeline_stage
      ) stage_counts
    ) AS leads_by_stage,
    (
      SELECT jsonb_object_agg(priority, count)
      FROM (
        SELECT COALESCE(priority, 'medium') as priority, COUNT(*)::integer as count
        FROM lead_submissions
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
  FROM lead_submissions;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lead_with_insights(p_lead_id uuid)
 RETURNS TABLE(lead jsonb, insights jsonb, activities jsonb, tasks jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(l.*) as lead,
    to_jsonb(i.*) as insights,
    COALESCE((
      SELECT jsonb_agg(a.* ORDER BY a.created_at DESC)
      FROM lead_activities a
      WHERE a.lead_id = p_lead_id
      LIMIT 10
    ), '[]'::jsonb) as activities,
    COALESCE((
      SELECT jsonb_agg(t.* ORDER BY t.due_date ASC)
      FROM lead_tasks t
      WHERE t.lead_id = p_lead_id AND t.completed = false
    ), '[]'::jsonb) as tasks
  FROM lead_submissions l
  LEFT JOIN ai_lead_insights i ON i.lead_id = l.id
  WHERE l.id = p_lead_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_power_list(p_org_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(item_id uuid, lane_id uuid, lane_name text, lane_color text, lead_id uuid, contact_id uuid, person_name text, person_email text, reason text, score integer, rank integer, last_action_at timestamp with time zone, next_action_at timestamp with time zone, snoozed_until timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    pi.id AS item_id,
    pi.lane_id,
    pl.name AS lane_name,
    pl.color AS lane_color,
    pi.lead_id,
    pi.contact_id,
    COALESCE(
      CONCAT(l.first_name, ' ', l.last_name),
      'Unknown'
    ) AS person_name,
    l.email AS person_email,
    pi.reason,
    pi.score,
    pi.rank,
    pi.last_action_at,
    pi.next_action_at,
    pi.snoozed_until
  FROM priority_items pi
  JOIN priority_lanes pl ON pl.id = pi.lane_id
  LEFT JOIN lead_submissions l ON l.id = pi.lead_id
  WHERE pi.org_id = p_org_id
    AND pi.completed_at IS NULL
    AND (pi.snoozed_until IS NULL OR pi.snoozed_until < now())
    AND (p_user_id IS NULL OR pi.owner_user_id = p_user_id OR pi.owner_user_id IS NULL)
  ORDER BY
    pl.order_index ASC,
    pi.score DESC,
    pi.rank ASC NULLS LAST
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_upcoming_events(p_user_id uuid, p_days integer DEFAULT 7)
 RETURNS TABLE(id uuid, title text, event_type text, start_time timestamp with time zone, end_time timestamp with time zone, lead_id uuid, lead_name text, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.event_type,
    e.start_time,
    e.end_time,
    e.lead_id,
    CONCAT(l.first_name, ' ', l.last_name) as lead_name,
    e.status
  FROM calendar_events e
  LEFT JOIN lead_submissions l ON l.id = e.lead_id
  WHERE e.assigned_to = p_user_id
    AND e.start_time >= NOW()
    AND e.start_time <= NOW() + (p_days || ' days')::INTERVAL
    AND e.status NOT IN ('cancelled')
  ORDER BY e.start_time ASC;
END;
$function$
;


CREATE OR REPLACE FUNCTION public.crm_global_search(p_org_id uuid, p_query text, p_limit integer DEFAULT 50)
 RETURNS TABLE(entity_type text, entity_id uuid, title text, subtitle text, extra_info text, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_tsquery tsquery;
    v_query_lower text;
    v_per_type_limit integer;
BEGIN
    v_query_lower := lower(trim(p_query));
    v_tsquery := plainto_tsquery('english', p_query);
    v_per_type_limit := GREATEST(p_limit / 4, 5);

    RETURN QUERY

    -- ── Leads ──
    (
        SELECT
            'lead'::text AS entity_type,
            l.id AS entity_id,
            (COALESCE(l.first_name, '') || ' ' || COALESCE(l.last_name, ''))::text AS title,
            COALESCE(l.email, 'No email')::text AS subtitle,
            COALESCE(l.pipeline_stage, 'new')::text AS extra_info,
            (CASE
                WHEN lower(l.first_name || ' ' || l.last_name) = v_query_lower THEN 2.0
                WHEN lower(l.first_name || ' ' || l.last_name) LIKE v_query_lower || '%' THEN 1.5
                WHEN lower(l.email) = v_query_lower THEN 1.4
                WHEN lower(l.email) LIKE v_query_lower || '%' THEN 1.0
                ELSE 0.5
            END)::real AS rank
        FROM public.lead_submissions l
        WHERE l.org_id = p_org_id
        AND (
            (l.first_name || ' ' || l.last_name) ILIKE '%' || p_query || '%'
            OR l.email ILIKE '%' || p_query || '%'
            OR l.phone ILIKE '%' || p_query || '%'
            OR l.first_name ILIKE '%' || p_query || '%'
            OR l.last_name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Contacts ──
    (
        SELECT
            'contact'::text,
            c.id,
            (c.first_name || ' ' || c.last_name)::text,
            COALESCE(c.email, 'No email')::text,
            COALESCE(c.title, '')::text,
            (ts_rank(c.search_vector, v_tsquery) +
            CASE
                WHEN lower(c.first_name || ' ' || c.last_name) = v_query_lower THEN 2.0
                WHEN lower(c.first_name || ' ' || c.last_name) LIKE v_query_lower || '%' THEN 1.5
                WHEN lower(c.email) LIKE v_query_lower || '%' THEN 1.0
                ELSE 0.0
            END)::real
        FROM public.crm_contacts c
        WHERE c.org_id = p_org_id
        AND (
            c.search_vector @@ v_tsquery
            OR (c.first_name || ' ' || c.last_name) ILIKE '%' || p_query || '%'
            OR c.email ILIKE '%' || p_query || '%'
            OR c.phone ILIKE '%' || p_query || '%'
            OR c.mobile ILIKE '%' || p_query || '%'
            OR c.first_name ILIKE '%' || p_query || '%'
            OR c.last_name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Family Members (spouse / dependent search → links to parent lead or contact) ──
    (
        SELECT
            CASE
                WHEN fm.lead_id IS NOT NULL THEN 'lead'::text
                ELSE 'contact'::text
            END,
            COALESCE(fm.lead_id, fm.contact_id) AS entity_id,
            (fm.first_name || ' ' || fm.last_name)::text AS title,
            ('Family of ' ||
                CASE
                    WHEN fm.lead_id IS NOT NULL THEN (
                        SELECT COALESCE(ls.first_name || ' ' || ls.last_name, ls.email)
                        FROM lead_submissions ls WHERE ls.id = fm.lead_id
                    )
                    ELSE (
                        SELECT cc.first_name || ' ' || cc.last_name
                        FROM crm_contacts cc WHERE cc.id = fm.contact_id
                    )
                END
            )::text AS subtitle,
            fm.relationship::text AS extra_info,
            (CASE
                WHEN lower(fm.first_name || ' ' || fm.last_name) = v_query_lower THEN 1.8
                WHEN lower(fm.first_name || ' ' || fm.last_name) LIKE v_query_lower || '%' THEN 1.3
                ELSE 0.6
            END)::real AS rank
        FROM public.crm_family_members fm
        WHERE fm.org_id = p_org_id
        AND (
            (fm.first_name || ' ' || fm.last_name) ILIKE '%' || p_query || '%'
            OR fm.first_name ILIKE '%' || p_query || '%'
            OR fm.last_name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Phone Numbers (search by number → links to owner) ──
    (
        SELECT
            pn.owner_type::text AS entity_type,
            pn.owner_id AS entity_id,
            pn.phone_number::text AS title,
            ('Phone for ' ||
                CASE pn.owner_type
                    WHEN 'lead' THEN (
                        SELECT COALESCE(ls.first_name || ' ' || ls.last_name, ls.email)
                        FROM lead_submissions ls WHERE ls.id = pn.owner_id
                    )
                    WHEN 'contact' THEN (
                        SELECT cc.first_name || ' ' || cc.last_name
                        FROM crm_contacts cc WHERE cc.id = pn.owner_id
                    )
                    WHEN 'family_member' THEN (
                        SELECT fmx.first_name || ' ' || fmx.last_name
                        FROM crm_family_members fmx WHERE fmx.id = pn.owner_id
                    )
                    ELSE 'Unknown'
                END
            )::text AS subtitle,
            pn.phone_type::text AS extra_info,
            0.7::real AS rank
        FROM public.crm_phone_numbers pn
        WHERE pn.org_id = p_org_id
        AND pn.phone_number ILIKE '%' || p_query || '%'
        ORDER BY rank DESC
        LIMIT LEAST(v_per_type_limit, 5)
    )

    UNION ALL

    -- ── Accounts ──
    (
        SELECT
            'account'::text,
            a.id,
            a.name::text,
            COALESCE(a.industry, 'No industry')::text,
            a.account_type::text,
            (ts_rank(a.search_vector, v_tsquery) +
            CASE
                WHEN lower(a.name) = v_query_lower THEN 2.0
                WHEN lower(a.name) LIKE v_query_lower || '%' THEN 1.5
                ELSE 0.0
            END)::real
        FROM public.crm_accounts a
        WHERE a.org_id = p_org_id
        AND (
            a.search_vector @@ v_tsquery
            OR a.name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Deals ──
    (
        SELECT
            'deal'::text,
            d.id,
            d.name::text,
            COALESCE('$' || d.amount::text, 'No amount')::text,
            COALESCE(ds.display_name, '')::text,
            (ts_rank(d.search_vector, v_tsquery) +
            CASE
                WHEN lower(d.name) LIKE v_query_lower || '%' THEN 1.5
                ELSE 0.0
            END)::real
        FROM public.crm_deals d
        LEFT JOIN public.crm_deal_stages ds ON ds.id = d.stage_id
        WHERE d.org_id = p_org_id
        AND (
            d.search_vector @@ v_tsquery
            OR d.name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Products ──
    (
        SELECT
            'product'::text,
            p.id,
            p.name::text,
            COALESCE('$' || p.unit_price::text, 'No price')::text,
            COALESCE(p.category, '')::text,
            (ts_rank(p.search_vector, v_tsquery) +
            CASE
                WHEN lower(p.name) LIKE v_query_lower || '%' THEN 1.5
                ELSE 0.0
            END)::real
        FROM public.crm_products p
        WHERE p.org_id = p_org_id
        AND p.is_active = true
        AND (
            p.search_vector @@ v_tsquery
            OR p.name ILIKE '%' || p_query || '%'
            OR p.code ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    ORDER BY rank DESC
    LIMIT p_limit;
END;
$function$
;
