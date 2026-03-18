-- ============================================================
-- BASELINE SCHEMA -- MPB Health Advisor Portal
-- ============================================================
-- Canonical starting point for new local environments.
-- Replaces the 88 pre-2026 migrations archived in supabase/migrations/archive/
--
-- Source:        dtmnkzllidaiqyheguhl (production)
-- Baseline date: 2026-01-01
-- Generated:     2026-03-18 (supabase db dump --linked --schema public)
--
-- Production:    Already marked applied in supabase_migrations.schema_migrations
--                (version '20260101000000' inserted 2026-03-18)
-- ============================================================
--
-- BEFORE RUNNING db push ON ANY NEW ENVIRONMENT:
-- The baseline is pre-applied on production. Mark it applied on the target:
--
--   INSERT INTO supabase_migrations.schema_migrations (version)
--   VALUES ('20260101000000')
--   ON CONFLICT DO NOTHING;
--
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."activity_type" AS ENUM (
    'lead_created',
    'lead_updated',
    'lead_assigned',
    'lead_status_changed',
    'lead_converted',
    'lead_lost',
    'message_sent',
    'message_received',
    'message_opened',
    'task_created',
    'task_completed',
    'task_overdue',
    'task_assigned',
    'compliance_completed',
    'compliance_due',
    'compliance_violation',
    'meeting_scheduled',
    'meeting_started',
    'meeting_completed',
    'meeting_cancelled',
    'sequence_enrolled',
    'sequence_completed',
    'sequence_paused',
    'member_joined',
    'member_left',
    'member_role_changed',
    'goal_achieved',
    'milestone_reached',
    'system_alert'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."case_origin" AS ENUM (
    'email',
    'phone',
    'web',
    'chat',
    'social',
    'internal'
);


ALTER TYPE "public"."case_origin" OWNER TO "postgres";


CREATE TYPE "public"."case_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."case_priority" OWNER TO "postgres";


CREATE TYPE "public"."case_status" AS ENUM (
    'new',
    'assigned',
    'in_progress',
    'on_hold',
    'escalated',
    'resolved',
    'closed'
);


ALTER TYPE "public"."case_status" OWNER TO "postgres";


CREATE TYPE "public"."domain_verification_status" AS ENUM (
    'pending',
    'verified',
    'failed',
    'expired'
);


ALTER TYPE "public"."domain_verification_status" OWNER TO "postgres";


CREATE TYPE "public"."forecast_category" AS ENUM (
    'committed',
    'best_case',
    'pipeline',
    'omitted'
);


ALTER TYPE "public"."forecast_category" OWNER TO "postgres";


CREATE TYPE "public"."forecast_status" AS ENUM (
    'draft',
    'active',
    'closed'
);


ALTER TYPE "public"."forecast_status" OWNER TO "postgres";


CREATE TYPE "public"."forecast_type" AS ENUM (
    'monthly',
    'quarterly',
    'annual'
);


ALTER TYPE "public"."forecast_type" OWNER TO "postgres";


CREATE TYPE "public"."mail_job_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."mail_job_status" OWNER TO "postgres";


CREATE TYPE "public"."mail_job_type" AS ENUM (
    'full_sync',
    'delta_sync',
    'send',
    'fetch_body',
    'webhook_process'
);


ALTER TYPE "public"."mail_job_type" OWNER TO "postgres";


CREATE TYPE "public"."mail_provider" AS ENUM (
    'microsoft365',
    'gmail',
    'imap'
);


ALTER TYPE "public"."mail_provider" OWNER TO "postgres";


CREATE TYPE "public"."mail_rule_action" AS ENUM (
    'move_to_folder',
    'add_label',
    'remove_label',
    'mark_read',
    'mark_flagged',
    'forward',
    'delete',
    'auto_reply',
    'assign_to_user'
);


ALTER TYPE "public"."mail_rule_action" OWNER TO "postgres";


CREATE TYPE "public"."mail_sync_status" AS ENUM (
    'idle',
    'syncing',
    'error',
    'disabled'
);


ALTER TYPE "public"."mail_sync_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_channel" AS ENUM (
    'in_app',
    'email',
    'sms',
    'push'
);


ALTER TYPE "public"."notification_channel" OWNER TO "postgres";


CREATE TYPE "public"."notification_priority" AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE "public"."notification_priority" OWNER TO "postgres";


CREATE TYPE "public"."user_role_type" AS ENUM (
    'super_admin',
    'admin',
    'advisor',
    'member',
    'manager',
    'staff',
    'guest',
    'crm_user'
);


ALTER TYPE "public"."user_role_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_org_invite"("invite_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invite org_invites%ROWTYPE;
  v_user_email text;
  v_org_id uuid;
  v_role text;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Find and validate the invite
  SELECT * INTO v_invite
  FROM org_invites
  WHERE token = invite_token
  AND status = 'pending'
  AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Check email matches
  IF v_invite.email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite was sent to a different email');
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_id = v_invite.org_id
    AND user_id = auth.uid()
  ) THEN
    -- Update invite to accepted anyway
    UPDATE org_invites
    SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
    WHERE id = v_invite.id;

    RETURN jsonb_build_object('success', true, 'message', 'Already a member', 'org_id', v_invite.org_id);
  END IF;

  -- Create membership
  INSERT INTO org_memberships (org_id, user_id, role, status, joined_at)
  VALUES (v_invite.org_id, auth.uid(), v_invite.role, 'active', now());

  -- Update invite
  UPDATE org_invites
  SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'org_id', v_invite.org_id, 'role', v_invite.role);
END;
$$;


ALTER FUNCTION "public"."accept_org_invite"("invite_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."accept_org_invite"("invite_token" "text") IS 'Accepts an org invite using the token';



CREATE OR REPLACE FUNCTION "public"."add_custom_module_column"("p_org_id" "uuid", "p_api_name" "text", "p_field_api_name" "text", "p_field_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    table_name TEXT;
    column_type TEXT;
BEGIN
    table_name := 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;

    column_type := CASE p_field_type
        WHEN 'text' THEN 'TEXT'
        WHEN 'textarea' THEN 'TEXT'
        WHEN 'number' THEN 'INTEGER'
        WHEN 'decimal' THEN 'DECIMAL(15,2)'
        WHEN 'currency' THEN 'DECIMAL(15,2)'
        WHEN 'percent' THEN 'DECIMAL(5,2)'
        WHEN 'email' THEN 'TEXT'
        WHEN 'phone' THEN 'TEXT'
        WHEN 'url' THEN 'TEXT'
        WHEN 'date' THEN 'DATE'
        WHEN 'datetime' THEN 'TIMESTAMPTZ'
        WHEN 'checkbox' THEN 'BOOLEAN DEFAULT false'
        WHEN 'picklist' THEN 'TEXT'
        WHEN 'multi_picklist' THEN 'TEXT[]'
        WHEN 'lookup' THEN 'UUID'
        WHEN 'multi_lookup' THEN 'UUID[]'
        WHEN 'auto_number' THEN 'TEXT'
        ELSE 'TEXT'
    END;

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s',
        table_name, p_field_api_name, column_type);
END;
$$;


ALTER FUNCTION "public"."add_custom_module_column"("p_org_id" "uuid", "p_api_name" "text", "p_field_api_name" "text", "p_field_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_custom_module_column"("p_org_id" "uuid", "p_api_name" "text", "p_field_api_name" "text", "p_field_type" "text") IS 'Adds a new column to an existing custom module table';



CREATE OR REPLACE FUNCTION "public"."add_to_priority_lane"("p_org_id" "uuid", "p_lane_id" "uuid", "p_lead_id" "uuid", "p_reason" "text" DEFAULT NULL::"text", "p_owner_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_item_id uuid;
  v_existing_id uuid;
BEGIN
  -- Check if already in this lane
  SELECT id INTO v_existing_id
  FROM priority_items
  WHERE org_id = p_org_id
    AND lane_id = p_lane_id
    AND lead_id = p_lead_id
    AND completed_at IS NULL;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing item
    UPDATE priority_items
    SET
      reason = COALESCE(p_reason, reason),
      owner_user_id = COALESCE(p_owner_user_id, owner_user_id),
      updated_at = now()
    WHERE id = v_existing_id;
    RETURN v_existing_id;
  END IF;

  -- Create new item
  INSERT INTO priority_items (
    org_id,
    lane_id,
    lead_id,
    reason,
    owner_user_id,
    score,
    source
  )
  VALUES (
    p_org_id,
    p_lane_id,
    p_lead_id,
    p_reason,
    COALESCE(p_owner_user_id, auth.uid()),
    50, -- Default score
    'manual'
  )
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$;


ALTER FUNCTION "public"."add_to_priority_lane"("p_org_id" "uuid", "p_lane_id" "uuid", "p_lead_id" "uuid", "p_reason" "text", "p_owner_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."aggregate_daily_analytics"("target_date" "date") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  summary_record RECORD;
BEGIN
  -- Calculate daily summary
  SELECT
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) as total_users,
    COUNT(DISTINCT CASE WHEN is_new_visitor THEN session_id END) as new_users,
    COUNT(DISTINCT CASE WHEN NOT is_new_visitor THEN session_id END) as returning_users,
    COALESCE(SUM(page_count), 0) as total_page_views,
    COALESCE(AVG(CASE WHEN is_bounce THEN 100 ELSE 0 END), 0) as bounce_rate,
    COALESCE(AVG(duration_seconds), 0) as avg_session_duration,
    COALESCE(AVG(page_count), 0) as pages_per_session,
    COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_sessions,
    COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_sessions,
    COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_sessions
  INTO summary_record
  FROM analytics_sessions
  WHERE DATE(started_at) = target_date;
  
  -- Upsert daily summary
  INSERT INTO daily_analytics_summary (
    date, total_sessions, total_users, new_users, returning_users,
    total_page_views, bounce_rate, avg_session_duration, pages_per_session,
    desktop_sessions, mobile_sessions, tablet_sessions, updated_at
  ) VALUES (
    target_date,
    COALESCE(summary_record.total_sessions, 0),
    COALESCE(summary_record.total_users, 0),
    COALESCE(summary_record.new_users, 0),
    COALESCE(summary_record.returning_users, 0),
    COALESCE(summary_record.total_page_views, 0),
    COALESCE(summary_record.bounce_rate, 0),
    COALESCE(summary_record.avg_session_duration, 0),
    COALESCE(summary_record.pages_per_session, 0),
    COALESCE(summary_record.desktop_sessions, 0),
    COALESCE(summary_record.mobile_sessions, 0),
    COALESCE(summary_record.tablet_sessions, 0),
    now()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    returning_users = EXCLUDED.returning_users,
    total_page_views = EXCLUDED.total_page_views,
    bounce_rate = EXCLUDED.bounce_rate,
    avg_session_duration = EXCLUDED.avg_session_duration,
    pages_per_session = EXCLUDED.pages_per_session,
    desktop_sessions = EXCLUDED.desktop_sessions,
    mobile_sessions = EXCLUDED.mobile_sessions,
    tablet_sessions = EXCLUDED.tablet_sessions,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."aggregate_daily_analytics"("target_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."array_append_unique"("arr" "text"[], "new_value" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF arr IS NULL THEN
    RETURN ARRAY[new_value];
  ELSIF new_value = ANY(arr) THEN
    RETURN arr;
  ELSE
    RETURN array_append(arr, new_value);
  END IF;
END;
$$;


ALTER FUNCTION "public"."array_append_unique"("arr" "text"[], "new_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_user_role"("target_user_id" "uuid", "target_role" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    new_row user_roles%ROWTYPE;
    default_org UUID := '00000000-0000-4000-a000-000000000001';
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: super_admin role required';
    END IF;

    -- Validate role value
    IF target_role NOT IN ('super_admin', 'admin', 'advisor', 'member', 'crm_user') THEN
        RAISE EXCEPTION 'Invalid role: %', target_role;
    END IF;

    -- Insert (or no-op on conflict)
    INSERT INTO user_roles (user_id, role, granted_by)
    VALUES (target_user_id, target_role::user_role_type, auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING
    RETURNING * INTO new_row;

    IF new_row.id IS NULL THEN
        -- Role already assigned, but still ensure org_memberships is correct
        IF target_role = 'crm_user' THEN
            INSERT INTO org_memberships (user_id, org_id, role, status, joined_at)
            VALUES (target_user_id, default_org, 'member', 'active', now())
            ON CONFLICT (user_id, org_id)
            DO UPDATE SET status = 'active', joined_at = COALESCE(org_memberships.joined_at, now());
        END IF;
        RETURN jsonb_build_object('success', true, 'message', 'Role already assigned');
    END IF;

    -- Sync org_memberships for CRM users
    IF target_role = 'crm_user' THEN
        INSERT INTO org_memberships (user_id, org_id, role, status, joined_at)
        VALUES (target_user_id, default_org, 'member', 'active', now())
        ON CONFLICT (user_id, org_id)
        DO UPDATE SET status = 'active', joined_at = COALESCE(org_memberships.joined_at, now());
    END IF;

    -- Sync admin_users for admin/super_admin roles
    IF target_role IN ('admin', 'super_admin') THEN
        INSERT INTO admin_users (id, email, role, status)
        SELECT target_user_id, u.email, target_role, 'active'
        FROM auth.users u WHERE u.id = target_user_id
        ON CONFLICT (id)
        DO UPDATE SET status = 'active';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', new_row.id,
        'user_id', new_row.user_id,
        'role', new_row.role::text,
        'created_at', new_row.created_at
    );
END;
$$;


ALTER FUNCTION "public"."assign_user_role"("target_user_id" "uuid", "target_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT auth.uid();
$$;


ALTER FUNCTION "public"."auth_uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_enrollment_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE advisor_lms_enrollments
  SET
    lessons_completed = (
      SELECT COUNT(*)
      FROM advisor_lesson_completions
      WHERE enrollment_id = NEW.enrollment_id AND status = 'completed'
    ),
    progress_percent = (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
           NULLIF(COUNT(*), 0)) * 100
        ), 0
      )
      FROM advisor_lesson_completions
      WHERE enrollment_id = NEW.enrollment_id
    ),
    status = CASE
      WHEN (
        SELECT COUNT(*) FILTER (WHERE status = 'completed') = COUNT(*)
        FROM advisor_lesson_completions
        WHERE enrollment_id = NEW.enrollment_id
      ) THEN 'completed'
      WHEN (
        SELECT COUNT(*) FILTER (WHERE status IN ('in_progress', 'completed')) > 0
        FROM advisor_lesson_completions
        WHERE enrollment_id = NEW.enrollment_id
      ) THEN 'in_progress'
      ELSE 'enrolled'
    END,
    completed_at = CASE
      WHEN (
        SELECT COUNT(*) FILTER (WHERE status = 'completed') = COUNT(*)
        FROM advisor_lesson_completions
        WHERE enrollment_id = NEW.enrollment_id
      ) THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_enrollment_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_keyword_ranking_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Get previous position
  SELECT position INTO NEW.previous_position
  FROM seo_keyword_rankings
  WHERE site_url = NEW.site_url
    AND keyword = NEW.keyword
    AND date < NEW.date
  ORDER BY date DESC
  LIMIT 1;
  
  -- Calculate change (negative = improvement)
  IF NEW.previous_position IS NOT NULL THEN
    NEW.position_change := NEW.position - NEW.previous_position;
    
    -- Determine trend
    IF NEW.position_change < -0.5 THEN
      NEW.trend := 'up';
    ELSIF NEW.position_change > 0.5 THEN
      NEW.trend := 'down';
    ELSE
      NEW.trend := 'stable';
    END IF;
  ELSE
    NEW.trend := 'new';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_keyword_ranking_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_lead_score_factors"("p_lead_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_lead RECORD;
  v_factors JSONB := '[]'::jsonb;
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_lead FROM zoho_lead_submissions WHERE id = p_lead_id;
  
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
$$;


ALTER FUNCTION "public"."calculate_lead_score_factors"("p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_newsletter_metrics"("campaign_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
UPDATE newsletter_campaigns
SET
open_rate = CASE
WHEN sent_count > 0 THEN (opened_count::numeric / sent_count::numeric) * 100
ELSE 0
END,
click_rate = CASE
WHEN sent_count > 0 THEN (clicked_count::numeric / sent_count::numeric) * 100
ELSE 0
END,
updated_at = now()
WHERE id = campaign_uuid;
END;
$$;


ALTER FUNCTION "public"."calculate_newsletter_metrics"("campaign_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_time_to_acknowledge"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
    NEW.time_to_acknowledge_seconds := EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.notified_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_time_to_acknowledge"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calendar_events_set_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calendar_events_set_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_manage_user_in_org"("check_org_id" "uuid", "target_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  my_role text;
  target_role text;
BEGIN
  -- Get my role
  SELECT role INTO my_role
  FROM org_memberships
  WHERE org_id = check_org_id
  AND user_id = auth.uid()
  AND status = 'active';

  -- No membership = no access
  IF my_role IS NULL THEN
    RETURN false;
  END IF;

  -- Owners can manage anyone
  IF my_role = 'owner' THEN
    RETURN true;
  END IF;

  -- Get target's role
  SELECT role INTO target_role
  FROM org_memberships
  WHERE org_id = check_org_id
  AND user_id = target_user_id
  AND status = 'active';

  -- Admin can manage non-owners
  IF my_role = 'admin' AND target_role != 'owner' THEN
    RETURN true;
  END IF;

  -- Manager can only manage advisors
  IF my_role = 'manager' AND target_role = 'advisor' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_user_manage_user_in_org"("check_org_id" "uuid", "target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_user_manage_user_in_org"("check_org_id" "uuid", "target_user_id" "uuid") IS 'Checks if current user can manage another user based on role hierarchy';



CREATE OR REPLACE FUNCTION "public"."check_repeat_lead"("p_email" "text", "p_phone" "text") RETURNS TABLE("is_repeat" boolean, "previous_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  email_count INTEGER;
  phone_count INTEGER;
BEGIN
  -- Count previous submissions with same email
  SELECT COUNT(*) INTO email_count
  FROM zoho_lead_submissions
  WHERE LOWER(email) = LOWER(p_email)
    AND created_at < now() - interval '5 minutes';
  
  -- Count previous submissions with same phone (if provided)
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT COUNT(*) INTO phone_count
    FROM zoho_lead_submissions
    WHERE phone = p_phone
      AND created_at < now() - interval '5 minutes';
  ELSE
    phone_count := 0;
  END IF;
  
  is_repeat := (email_count > 0 OR phone_count > 0);
  previous_count := GREATEST(email_count, phone_count);
  
  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."check_repeat_lead"("p_email" "text", "p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_page_views"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM page_views WHERE created_at < now() - interval '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_page_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_security_alert_logs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.security_alert_log
  WHERE sent_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_security_alert_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_security_alert_logs"() IS 'Removes security alert logs older than 30 days';



CREATE OR REPLACE FUNCTION "public"."clear_must_change_password_after_reset"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE advisor_profiles
  SET must_change_password = false
  WHERE id = auth.uid() OR (user_id IS NOT NULL AND user_id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."clear_must_change_password_after_reset"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_priority_item"("p_item_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE priority_items
  SET
    completed_at = now(),
    completed_reason = p_reason,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."complete_priority_item"("p_item_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_custom_module_table"("p_org_id" "uuid", "p_api_name" "text", "p_fields" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    table_name TEXT;
    field_record JSONB;
    sql_columns TEXT := '';
    sql_create TEXT;
    field_api_name TEXT;
    field_type TEXT;
    column_type TEXT;
BEGIN
    -- Table name: crm_custom_{org_id_short}_{api_name}
    table_name := 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;

    -- Build column definitions from fields
    FOR field_record IN SELECT * FROM jsonb_array_elements(p_fields)
    LOOP
        field_api_name := field_record->>'api_name';
        field_type := field_record->>'field_type';

        -- Map field types to PostgreSQL types
        column_type := CASE field_type
            WHEN 'text' THEN 'TEXT'
            WHEN 'textarea' THEN 'TEXT'
            WHEN 'number' THEN 'INTEGER'
            WHEN 'decimal' THEN 'DECIMAL(15,2)'
            WHEN 'currency' THEN 'DECIMAL(15,2)'
            WHEN 'percent' THEN 'DECIMAL(5,2)'
            WHEN 'email' THEN 'TEXT'
            WHEN 'phone' THEN 'TEXT'
            WHEN 'url' THEN 'TEXT'
            WHEN 'date' THEN 'DATE'
            WHEN 'datetime' THEN 'TIMESTAMPTZ'
            WHEN 'checkbox' THEN 'BOOLEAN DEFAULT false'
            WHEN 'picklist' THEN 'TEXT'
            WHEN 'multi_picklist' THEN 'TEXT[]'
            WHEN 'lookup' THEN 'UUID'
            WHEN 'multi_lookup' THEN 'UUID[]'
            WHEN 'auto_number' THEN 'TEXT'
            ELSE 'TEXT'
        END;

        sql_columns := sql_columns || ', ' || quote_ident(field_api_name) || ' ' || column_type;
    END LOOP;

    -- Create table with standard columns plus custom fields
    sql_create := format(
        'CREATE TABLE IF NOT EXISTS public.%I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            owner_id UUID REFERENCES auth.users(id),
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
            %s
        )',
        table_name, sql_columns
    );

    EXECUTE sql_create;

    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    -- Create RLS policy for org access
    EXECUTE format(
        'CREATE POLICY %I ON public.%I
         FOR ALL USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()))',
        table_name || '_org_access', table_name
    );

    -- Create org_id index
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (org_id)',
        'idx_' || table_name || '_org', table_name);

    -- Create name index for searching
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (org_id, name)',
        'idx_' || table_name || '_name', table_name);

    -- Create owner index
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (owner_id)',
        'idx_' || table_name || '_owner', table_name);
END;
$$;


ALTER FUNCTION "public"."create_custom_module_table"("p_org_id" "uuid", "p_api_name" "text", "p_fields" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_custom_module_table"("p_org_id" "uuid", "p_api_name" "text", "p_fields" "jsonb") IS 'Creates a dedicated PostgreSQL table for a custom module with RLS';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."advisor_meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "room_name" "text" NOT NULL,
    "room_password" "text",
    "host_id" "uuid",
    "host_name" "text",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "text",
    "recurrence_day" integer,
    "recurrence_time" time without time zone,
    "status" "text" DEFAULT 'scheduled'::"text",
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "recording_url" "text",
    "attendee_count" integer DEFAULT 0,
    "max_attendees" integer,
    "meeting_notes" "text",
    "agenda" "text",
    "resources" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "visibility" "text" DEFAULT 'all'::"text",
    "meeting_type" "text" DEFAULT 'group'::"text",
    "max_participants" integer,
    "require_registration" boolean DEFAULT false,
    "allow_guests" boolean DEFAULT false,
    "co_host_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "meeting_link" "text",
    "passcode" "text",
    "reminder_sent" boolean DEFAULT false,
    "reminder_minutes" integer DEFAULT 30,
    "auto_record" boolean DEFAULT false,
    "notes" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "org_id" "uuid",
    CONSTRAINT "advisor_meetings_meeting_type_check" CHECK (("meeting_type" = ANY (ARRAY['all_hands'::"text", 'group'::"text", 'one_on_one'::"text", 'training'::"text", 'webinar'::"text"]))),
    CONSTRAINT "advisor_meetings_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'live'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "advisor_meetings_visibility_check" CHECK (("visibility" = ANY (ARRAY['all'::"text", 'selected'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."advisor_meetings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_instant_meeting"("p_title" "text", "p_host_id" "uuid", "p_visibility" "text" DEFAULT 'all'::"text", "p_advisor_ids" "uuid"[] DEFAULT NULL::"uuid"[]) RETURNS "public"."advisor_meetings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_meeting advisor_meetings;
  v_room_name TEXT;
BEGIN
  -- Generate unique room name
  v_room_name := 'mpb-instant-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);

  -- Create the meeting
  INSERT INTO advisor_meetings (
    title,
    description,
    scheduled_at,
    duration_minutes,
    status,
    jitsi_room_name,
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

  -- Invite specific advisors if provided
  IF p_advisor_ids IS NOT NULL AND array_length(p_advisor_ids, 1) > 0 THEN
    PERFORM invite_advisors_to_meeting(v_meeting.id, p_advisor_ids);
  ELSIF p_visibility = 'all' THEN
    -- Invite all advisors for 'all' visibility meetings
    PERFORM invite_all_advisors_to_meeting(v_meeting.id);
  END IF;

  RETURN v_meeting;
END;
$$;


ALTER FUNCTION "public"."create_instant_meeting"("p_title" "text", "p_host_id" "uuid", "p_visibility" "text", "p_advisor_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "owner_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Add the creator as owner
  INSERT INTO org_memberships (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, owner_user_id, 'owner', 'active', now());

  RETURN new_org_id;
END;
$$;


ALTER FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "owner_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "owner_user_id" "uuid") IS 'Creates an org and adds the current user as owner';



CREATE OR REPLACE FUNCTION "public"."crm_global_search"("p_org_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 50) RETURNS TABLE("entity_type" "text", "entity_id" "uuid", "title" "text", "subtitle" "text", "extra_info" "text", "rank" real)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
    v_tsquery tsquery;
BEGIN
    -- Create tsquery from search text
    v_tsquery := plainto_tsquery('english', p_query);

    RETURN QUERY
    -- Accounts
    SELECT
        'account'::text as entity_type,
        a.id as entity_id,
        a.name as title,
        COALESCE(a.industry, 'No industry') as subtitle,
        a.account_type as extra_info,
        ts_rank(a.search_vector, v_tsquery) +
        CASE WHEN a.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END as rank
    FROM public.crm_accounts a
    WHERE a.org_id = p_org_id
    AND (
        a.search_vector @@ v_tsquery
        OR a.name ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Contacts
    SELECT
        'contact'::text,
        c.id,
        c.first_name || ' ' || c.last_name,
        COALESCE(c.email, 'No email'),
        COALESCE(c.title, ''),
        ts_rank(c.search_vector, v_tsquery) +
        CASE WHEN (c.first_name || ' ' || c.last_name) ILIKE p_query || '%' THEN 0.5 ELSE 0 END
    FROM public.crm_contacts c
    WHERE c.org_id = p_org_id
    AND (
        c.search_vector @@ v_tsquery
        OR (c.first_name || ' ' || c.last_name) ILIKE '%' || p_query || '%'
        OR c.email ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Deals
    SELECT
        'deal'::text,
        d.id,
        d.name,
        COALESCE('$' || d.amount::text, 'No amount'),
        COALESCE(ds.display_name, ''),
        ts_rank(d.search_vector, v_tsquery) +
        CASE WHEN d.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END
    FROM public.crm_deals d
    LEFT JOIN public.crm_deal_stages ds ON ds.id = d.stage_id
    WHERE d.org_id = p_org_id
    AND (
        d.search_vector @@ v_tsquery
        OR d.name ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Products
    SELECT
        'product'::text,
        p.id,
        p.name,
        COALESCE('$' || p.unit_price::text, 'No price'),
        COALESCE(p.category, ''),
        ts_rank(p.search_vector, v_tsquery) +
        CASE WHEN p.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END
    FROM public.crm_products p
    WHERE p.org_id = p_org_id
    AND p.is_active = true
    AND (
        p.search_vector @@ v_tsquery
        OR p.name ILIKE '%' || p_query || '%'
        OR p.code ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Leads (from existing zoho_lead_submissions)
    SELECT
        'lead'::text,
        l.id,
        COALESCE(l.first_name || ' ' || l.last_name, l.email),
        COALESCE(l.email, 'No email'),
        COALESCE(l.pipeline_stage, 'new'),
        CASE
            WHEN (l.first_name || ' ' || l.last_name) ILIKE p_query || '%' THEN 1.0
            WHEN l.email ILIKE p_query || '%' THEN 0.8
            ELSE 0.5
        END
    FROM public.zoho_lead_submissions l
    WHERE l.org_id = p_org_id
    AND (
        (l.first_name || ' ' || l.last_name) ILIKE '%' || p_query || '%'
        OR l.email ILIKE '%' || p_query || '%'
        OR l.phone ILIKE '%' || p_query || '%'
    )

    ORDER BY rank DESC
    LIMIT p_limit;
END;
$_$;


ALTER FUNCTION "public"."crm_global_search"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_admin_access"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'superadmin'))
  );
END;
$$;


ALTER FUNCTION "public"."current_user_has_admin_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_advisor_command_access"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'advisor'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'advisor', 'staff'))
  );
END;
$$;


ALTER FUNCTION "public"."current_user_has_advisor_command_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_advisor_or_admin_access"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'advisor'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'advisor'))
  );
END;
$$;


ALTER FUNCTION "public"."current_user_has_advisor_or_admin_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_extended_admin_access"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'advisor'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'superadmin', 'advisor'))
  );
END;
$$;


ALTER FUNCTION "public"."current_user_has_extended_admin_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_super_admin_access"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
END;
$$;


ALTER FUNCTION "public"."current_user_has_super_admin_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."current_user_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."current_user_is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_org_ids"() RETURNS "uuid"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT COALESCE(
        ARRAY_AGG(om.org_id),
        ARRAY[]::uuid[]
    )
    FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.status = 'active';
$$;


ALTER FUNCTION "public"."current_user_org_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_token"("encrypted" "bytea", "key" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'extensions', 'public'
    AS $$
  SELECT pgp_sym_decrypt(encrypted, key)
$$;


ALTER FUNCTION "public"."decrypt_token"("encrypted" "bytea", "key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drop_custom_module_table"("p_org_id" "uuid", "p_api_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    table_name TEXT;
BEGIN
    table_name := 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;

    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
END;
$$;


ALTER FUNCTION "public"."drop_custom_module_table"("p_org_id" "uuid", "p_api_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."drop_custom_module_table"("p_org_id" "uuid", "p_api_name" "text") IS 'Drops a custom module table (use with caution)';



CREATE OR REPLACE FUNCTION "public"."encrypt_token"("token" "text", "key" "text") RETURNS "bytea"
    LANGUAGE "sql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'extensions', 'public'
    AS $$
  SELECT pgp_sym_encrypt(token, key)
$$;


ALTER FUNCTION "public"."encrypt_token"("token" "text", "key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."end_advisor_meeting"("p_meeting_id" "uuid") RETURNS "public"."advisor_meetings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_meeting advisor_meetings;
BEGIN
  -- Update any attendees who haven't left
  UPDATE advisor_meeting_attendees
  SET
    left_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER
  WHERE meeting_id = p_meeting_id
  AND left_at IS NULL;

  -- Get attendee count
  UPDATE advisor_meetings
  SET
    status = 'completed',
    ended_at = NOW(),
    attendee_count = (
      SELECT COUNT(DISTINCT COALESCE(advisor_id, user_id))
      FROM advisor_meeting_attendees
      WHERE meeting_id = p_meeting_id
    )
  WHERE id = p_meeting_id
  RETURNING * INTO v_meeting;

  RETURN v_meeting;
END;
$$;


ALTER FUNCTION "public"."end_advisor_meeting"("p_meeting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enroll_advisor_in_course"("p_advisor_id" "uuid", "p_course_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_lessons INTEGER;
BEGIN
  -- Create enrollment if not exists
  INSERT INTO advisor_lms_enrollments (advisor_id, course_id, status)
  VALUES (p_advisor_id, p_course_id, 'enrolled')
  ON CONFLICT (advisor_id, course_id) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  -- Get total lessons
  SELECT COUNT(*) INTO v_total_lessons
  FROM external_lms_lessons WHERE course_id = p_course_id;

  -- Update total lessons
  UPDATE advisor_lms_enrollments
  SET total_lessons = v_total_lessons
  WHERE id = v_enrollment_id;

  -- Create lesson completion records for all lessons
  INSERT INTO advisor_lesson_completions (advisor_id, enrollment_id, lesson_id, status)
  SELECT p_advisor_id, v_enrollment_id, l.id, 'not_started'
  FROM external_lms_lessons l
  WHERE l.course_id = p_course_id
  ON CONFLICT (advisor_id, lesson_id) DO NOTHING;

  RETURN v_enrollment_id;
END;
$$;


ALTER FUNCTION "public"."enroll_advisor_in_course"("p_advisor_id" "uuid", "p_course_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_advisor_profile_on_role_grant"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only for advisor-portal roles
  IF NEW.role IN ('advisor', 'super_admin', 'admin') THEN
    INSERT INTO advisor_profiles (
      id,
      first_name,
      last_name,
      email,
      phone,
      specialization,
      status,
      onboarding_completed,
      onboarding_completed_at,
      metadata,
      created_at,
      updated_at
    )
    SELECT
      u.id,
      COALESCE(
        (u.raw_user_meta_data->>'first_name')::text,
        split_part(COALESCE((u.raw_user_meta_data->>'full_name')::text, u.email), ' ', 1),
        'Advisor'
      ),
      COALESCE(
        (u.raw_user_meta_data->>'last_name')::text,
        CASE
          WHEN (u.raw_user_meta_data->>'full_name')::text IS NOT NULL
            AND position(' ' in (u.raw_user_meta_data->>'full_name')::text) > 0
          THEN trim(substring((u.raw_user_meta_data->>'full_name')::text from position(' ' in (u.raw_user_meta_data->>'full_name')::text) + 1))
          ELSE ''
        END
      ),
      COALESCE(u.email, ''),
      COALESCE((u.raw_user_meta_data->>'phone')::text, ''),
      'Health Share',
      'active',
      true,
      now(),
      jsonb_build_object('provisioned_by', 'trigger_ensure_advisor_profile_on_role_grant', 'source', 'user_roles_insert'),
      now(),
      now()
    FROM auth.users u
    WHERE u.id = NEW.user_id
      AND NOT EXISTS (SELECT 1 FROM advisor_profiles ap WHERE ap.id = NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_advisor_profile_on_role_grant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fan_out_chat_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_conv RECORD;
  v_sender_name TEXT;
BEGIN
  -- Get conversation info
  SELECT type, name, org_id INTO v_conv FROM chat_conversations WHERE id = NEW.conversation_id;

  -- Get sender display name from advisor_profiles
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO v_sender_name
  FROM advisor_profiles WHERE id = NEW.sender_id;

  -- Fallback to auth.users email
  IF v_sender_name IS NULL THEN
    SELECT email INTO v_sender_name FROM auth.users WHERE id = NEW.sender_id;
  END IF;

  -- Insert notification_events for all members except sender (non-muted)
  INSERT INTO notification_events (user_id, org_id, event_type, title, body, action_url, source_type, source_id, actor_id, metadata)
  SELECT
    cm.user_id,
    v_conv.org_id,
    CASE WHEN v_conv.type = 'direct' THEN 'chat_dm' ELSE 'chat_message' END,
    CASE WHEN v_conv.type = 'direct'
      THEN COALESCE(v_sender_name, 'Someone')
      ELSE '#' || COALESCE(v_conv.name, 'chat')
    END,
    LEFT(NEW.content, 200),
    '/chat/' || NEW.conversation_id,
    'chat',
    NEW.id,
    NEW.sender_id,
    jsonb_build_object('conversation_type', v_conv.type)
  FROM chat_members cm
  WHERE cm.conversation_id = NEW.conversation_id
    AND cm.user_id != NEW.sender_id
    AND cm.is_muted = FALSE;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fan_out_chat_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_case_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 'CASE-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_num FROM public.crm_cases WHERE org_id = NEW.org_id;
    NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
    RETURN NEW;
END; $$;


ALTER FUNCTION "public"."generate_case_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_claim_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
RETURN 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 8);
END;
$$;


ALTER FUNCTION "public"."generate_claim_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_health_quote_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  year_prefix text;
  seq_num integer;
BEGIN
  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  seq_num := nextval('crm_health_quote_number_seq');
  RETURN 'HQ-' || year_prefix || '-' || lpad(seq_num::text, 5, '0');
END;
$$;


ALTER FUNCTION "public"."generate_health_quote_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_count integer;
    v_year text;
BEGIN
    v_year := to_char(now(), 'YYYY');

    SELECT COUNT(*) + 1 INTO v_count
    FROM public.crm_invoices
    WHERE org_id = p_org_id
    AND created_at >= date_trunc('year', now());

    RETURN 'INV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_meeting_room_name"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN 'mpb-advisor-' || substr(md5(random()::text), 1, 8);
END;
$$;


ALTER FUNCTION "public"."generate_meeting_room_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_module_permissions"("p_module_api_name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN ARRAY[
        p_module_api_name || '.read',
        p_module_api_name || '.write',
        p_module_api_name || '.delete',
        p_module_api_name || '.export'
    ];
END;
$$;


ALTER FUNCTION "public"."generate_module_permissions"("p_module_api_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_module_permissions"("p_module_api_name" "text") IS 'Generates permission keys for a custom module';



CREATE OR REPLACE FUNCTION "public"."generate_po_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CASE
            WHEN po_number ~ ('^PO-' || year_part || '-[0-9]+$')
            THEN CAST(SUBSTRING(po_number FROM 'PO-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO seq_num
    FROM public.crm_purchase_orders
    WHERE org_id = NEW.org_id;

    NEW.po_number := 'PO-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."generate_po_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_quote_number"("p_org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_count integer;
    v_year text;
BEGIN
    v_year := to_char(now(), 'YYYY');

    SELECT COUNT(*) + 1 INTO v_count
    FROM public.crm_quotes
    WHERE org_id = p_org_id
    AND created_at >= date_trunc('year', now());

    RETURN 'Q-' || v_year || '-' || LPAD(v_count::text, 5, '0');
END;
$$;


ALTER FUNCTION "public"."generate_quote_number"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_so_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CASE
            WHEN so_number ~ ('^SO-' || year_part || '-[0-9]+$')
            THEN CAST(SUBSTRING(so_number FROM 'SO-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO seq_num
    FROM public.crm_sales_orders
    WHERE org_id = NEW.org_id;

    NEW.so_number := 'SO-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."generate_so_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_ticket_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
RETURN 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 6);
END;
$$;


ALTER FUNCTION "public"."generate_ticket_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_tracking_token"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;


ALTER FUNCTION "public"."generate_tracking_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_advisor_emails"() RETURNS TABLE("advisor_id" "uuid", "email" "text", "first_name" "text", "last_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
  WHERE ap.is_active = true
    AND (ap.email IS NOT NULL OR u.email IS NOT NULL);
END;
$$;


ALTER FUNCTION "public"."get_active_advisor_emails"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_advisor_meeting"() RETURNS "public"."advisor_meetings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN (
    SELECT * FROM advisor_meetings
    WHERE status = 'live'
    ORDER BY started_at DESC
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_active_advisor_meeting"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_activity_feed"("p_user_id" "uuid", "p_org_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "activity_type" "text", "description" "text", "entity_type" "text", "entity_id" "uuid", "metadata" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_activity_feed"("p_user_id" "uuid", "p_org_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_advisor_hierarchy_tree"("root_advisor_id" "text") RETURNS TABLE("id" "uuid", "agent_id" "text", "parent_id" "text", "agent_label" "text", "full_name" "text", "email" "text", "phone" "text", "is_active" boolean, "hire_date" timestamp with time zone, "territory" "text", "level" integer)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE advisor_tree AS (
        -- Base case: the root advisor at level 0
        SELECT
            a.id,
            a.agent_id,
            a.parent_id,
            a.agent_label,
            a.full_name,
            a.email,
            a.phone,
            a.is_active,
            a.hire_date,
            a.territory,
            0 as level
        FROM advisors a
        WHERE a.agent_id = root_advisor_id

        UNION ALL

        -- Recursive case: children with incremented level
        SELECT
            a.id,
            a.agent_id,
            a.parent_id,
            a.agent_label,
            a.full_name,
            a.email,
            a.phone,
            a.is_active,
            a.hire_date,
            a.territory,
            t.level + 1
        FROM advisors a
        JOIN advisor_tree t ON a.parent_id = t.agent_id
        WHERE a.is_active = true
    )
    SELECT * FROM advisor_tree ORDER BY level, full_name;
END;
$$;


ALTER FUNCTION "public"."get_advisor_hierarchy_tree"("root_advisor_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_users_with_roles"() RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "user_created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
        u.created_at as user_created_at,
        u.last_sign_in_at,
        COALESCE(
            (SELECT ARRAY_AGG(ur.role::TEXT ORDER BY ur.role) 
             FROM public.user_roles ur 
             WHERE ur.user_id = u.id),
            ARRAY[]::TEXT[]
        ) as roles
    FROM auth.users u
    ORDER BY u.email;
END;
$$;


ALTER FUNCTION "public"."get_all_users_with_roles"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_users_with_roles"() IS 'Returns all users with their roles. Only accessible by admins.';



CREATE OR REPLACE FUNCTION "public"."get_automation_stats"("p_org_id" "uuid") RETURNS TABLE("total_rules" integer, "active_rules" integer, "total_runs" integer, "success_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_automation_stats"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_health_plans"() RETURNS TABLE("id" "uuid", "name" "text", "slug" "text", "tier" "text", "monthly_contribution" numeric, "features" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.tier,
    pp.monthly_contribution,
    p.features
  FROM plans p
  LEFT JOIN plan_pricing pp ON pp.plan_id = p.id
    AND pp.effective_date <= CURRENT_DATE
    AND pp.member_type = 'individual'
  WHERE p.is_active = true
  ORDER BY p.display_order;
END;
$$;


ALTER FUNCTION "public"."get_available_health_plans"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_chat_unread_counts"("p_user_id" "uuid") RETURNS TABLE("conversation_id" "uuid", "unread_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT cm.conversation_id,
         COUNT(msg.id)::BIGINT AS unread_count
  FROM chat_members cm
  JOIN chat_messages msg ON msg.conversation_id = cm.conversation_id
  WHERE cm.user_id = p_user_id
    AND msg.created_at > cm.last_read_at
    AND msg.sender_id != p_user_id
    AND msg.is_deleted = FALSE
  GROUP BY cm.conversation_id;
$$;


ALTER FUNCTION "public"."get_chat_unread_counts"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_crm_dashboard_stats"() RETURNS TABLE("total_leads" bigint, "new_leads" bigint, "leads_by_stage" "jsonb", "leads_by_priority" "jsonb", "overdue_tasks" bigint, "tasks_due_today" bigint, "conversion_rate" numeric, "avg_days_to_close" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_crm_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_custom_module_table_name"("p_org_id" "uuid", "p_api_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN 'crm_custom_' || REPLACE(LEFT(p_org_id::TEXT, 8), '-', '') || '_' || p_api_name;
END;
$$;


ALTER FUNCTION "public"."get_custom_module_table_name"("p_org_id" "uuid", "p_api_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_custom_module_table_name"("p_org_id" "uuid", "p_api_name" "text") IS 'Returns the table name for a custom module';



CREATE OR REPLACE FUNCTION "public"."get_downline_advisor_ids"("root_advisor_id" "text") RETURNS TABLE("agent_id" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE advisor_tree AS (
        -- Base case: the root advisor
        SELECT a.agent_id
        FROM advisors a
        WHERE a.agent_id = root_advisor_id

        UNION ALL

        -- Recursive case: children of current level
        SELECT a.agent_id
        FROM advisors a
        JOIN advisor_tree t ON a.parent_id = t.agent_id
        WHERE a.is_active = true
    )
    SELECT advisor_tree.agent_id FROM advisor_tree;
END;
$$;


ALTER FUNCTION "public"."get_downline_advisor_ids"("root_advisor_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_email_tracking_stats"("p_email_id" "uuid") RETURNS TABLE("total_opens" bigint, "unique_opens" bigint, "total_clicks" bigint, "unique_clicks" bigint, "opens_by_device" "jsonb", "top_clicked_links" "jsonb", "first_open" timestamp with time zone, "last_open" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE tracking_type = 'open')::bigint AS total_opens,
    COUNT(DISTINCT ip_address) FILTER (WHERE tracking_type = 'open')::bigint AS unique_opens,
    COUNT(*) FILTER (WHERE tracking_type = 'click')::bigint AS total_clicks,
    COUNT(DISTINCT ip_address) FILTER (WHERE tracking_type = 'click')::bigint AS unique_clicks,
    (
      SELECT jsonb_object_agg(COALESCE(device_type, 'unknown'), cnt)
      FROM (
        SELECT device_type, COUNT(*)::integer as cnt
        FROM crm_email_tracking
        WHERE email_log_id = p_email_id AND tracking_type = 'open'
        GROUP BY device_type
      ) d
    ) AS opens_by_device,
    (
      SELECT jsonb_agg(jsonb_build_object('url', link_url, 'count', cnt) ORDER BY cnt DESC)
      FROM (
        SELECT link_url, COUNT(*)::integer as cnt
        FROM crm_email_tracking
        WHERE email_log_id = p_email_id AND tracking_type = 'click' AND link_url IS NOT NULL
        GROUP BY link_url
        LIMIT 10
      ) c
    ) AS top_clicked_links,
    MIN(tracked_at) FILTER (WHERE tracking_type = 'open') AS first_open,
    MAX(tracked_at) FILTER (WHERE tracking_type = 'open') AS last_open
  FROM crm_email_tracking
  WHERE email_log_id = p_email_id;
END;
$$;


ALTER FUNCTION "public"."get_email_tracking_stats"("p_email_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtered_leads"("p_stage" "text" DEFAULT NULL::"text", "p_priority" "text" DEFAULT NULL::"text", "p_assigned_to" "uuid" DEFAULT NULL::"uuid", "p_search" "text" DEFAULT NULL::"text", "p_date_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_date_to" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "zip_code" "text", "pipeline_stage" "text", "priority" "text", "assigned_to" "uuid", "lead_score" integer, "source_cta" "text", "source_page" "text", "created_at" timestamp with time zone, "stage_changed_at" timestamp with time zone, "next_followup_at" timestamp with time zone, "tags" "text"[], "zoho_lead_id" "text", "zoho_sync_status" "text", "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_filtered_leads"("p_stage" "text", "p_priority" "text", "p_assigned_to" "uuid", "p_search" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_hierarchy_stats"("root_advisor_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    result JSONB;
    advisor_ids TEXT[];
    total_advisors INTEGER;
    active_advisors INTEGER;
    total_members INTEGER;
    max_depth INTEGER;
    members_per_level JSONB;
BEGIN
    -- Get all advisor IDs in hierarchy
    SELECT ARRAY_AGG(agent_id) INTO advisor_ids
    FROM get_downline_advisor_ids(root_advisor_id);

    -- Count advisors
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO total_advisors, active_advisors
    FROM advisors
    WHERE agent_id = ANY(advisor_ids);

    -- Count members
    SELECT COUNT(*)
    INTO total_members
    FROM member_profiles
    WHERE assigned_advisor_id = ANY(advisor_ids);

    -- Get max depth
    SELECT COALESCE(MAX(level), 0)
    INTO max_depth
    FROM get_advisor_hierarchy_tree(root_advisor_id);

    -- Get members per level
    WITH level_counts AS (
        SELECT
            t.level,
            COUNT(m.id) as member_count
        FROM get_advisor_hierarchy_tree(root_advisor_id) t
        LEFT JOIN member_profiles m ON m.assigned_advisor_id = t.agent_id
        GROUP BY t.level
    )
    SELECT jsonb_object_agg(level::text, member_count)
    INTO members_per_level
    FROM level_counts;

    result := jsonb_build_object(
        'total_advisors', total_advisors,
        'active_advisors', active_advisors,
        'total_members', total_members,
        'members_per_level', COALESCE(members_per_level, '{}'::jsonb),
        'depth', max_depth + 1
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_hierarchy_stats"("root_advisor_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_highest_role"("check_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT
        CASE
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'super_admin') THEN 'super_admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'admin') THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'manager') THEN 'manager'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'staff') THEN 'staff'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'advisor') THEN 'advisor'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'member') THEN 'member'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'guest') THEN 'guest'
            ELSE 'member'
        END
    INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_highest_role"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid", "p_org_id" "uuid") RETURNS TABLE("total_conversations" integer, "unread_count" integer, "active_count" integer, "archived_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid", "p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lead_health_quotes"("p_lead_id" "uuid") RETURNS TABLE("id" "uuid", "quote_number" "text", "status" "text", "household_type" "text", "member_count" integer, "primary_age" integer, "total_monthly" numeric, "total_annual" numeric, "valid_until" "date", "sent_at" timestamp with time zone, "created_at" timestamp with time zone, "quote_lines" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    lhq.id,
    lhq.quote_number,
    lhq.status,
    lhq.household_type,
    lhq.member_count,
    lhq.primary_age,
    lhq.total_monthly,
    lhq.total_annual,
    lhq.valid_until,
    lhq.sent_at,
    lhq.created_at,
    lhq.quote_lines
  FROM crm_lead_health_quotes lhq
  WHERE lhq.lead_id = p_lead_id
  ORDER BY lhq.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_lead_health_quotes"("p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lead_notification_stats"("days_back" integer DEFAULT 7) RETURNS TABLE("total_notifications" bigint, "acknowledged_count" bigint, "avg_response_time_seconds" numeric, "critical_count" bigint, "high_count" bigint, "repeat_lead_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_notifications,
    COUNT(*) FILTER (WHERE acknowledged_at IS NOT NULL)::BIGINT AS acknowledged_count,
    AVG(time_to_acknowledge_seconds) AS avg_response_time_seconds,
    COUNT(*) FILTER (WHERE priority = 'critical')::BIGINT AS critical_count,
    COUNT(*) FILTER (WHERE priority = 'high')::BIGINT AS high_count,
    COUNT(*) FILTER (WHERE is_repeat_lead = true)::BIGINT AS repeat_lead_count
  FROM lead_notifications
  WHERE notified_at >= now() - make_interval(days => days_back);
END;
$$;


ALTER FUNCTION "public"."get_lead_notification_stats"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lead_plan_interests"("p_lead_id" "uuid") RETURNS TABLE("id" "uuid", "plan_id" "uuid", "plan_name" "text", "plan_code" "text", "family_size" "text", "interest_level" "text", "quoted_monthly_rate" numeric, "quoted_at" timestamp with time zone, "quote_valid_until" timestamp with time zone, "primary_age" integer, "spouse_age" integer, "dependent_ages" integer[], "notes" "text", "created_at" timestamp with time zone, "created_by" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    lpi.id,
    lpi.plan_id,
    lpi.plan_name,
    lpi.plan_code,
    lpi.family_size,
    lpi.interest_level,
    lpi.quoted_monthly_rate,
    lpi.quoted_at,
    lpi.quote_valid_until,
    lpi.primary_age,
    lpi.spouse_age,
    lpi.dependent_ages,
    lpi.notes,
    lpi.created_at,
    lpi.created_by
  FROM crm_lead_plan_interests lpi
  WHERE lpi.lead_id = p_lead_id
  ORDER BY lpi.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_lead_plan_interests"("p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lead_with_insights"("p_lead_id" "uuid") RETURNS TABLE("lead" "jsonb", "insights" "jsonb", "activities" "jsonb", "tasks" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
  FROM zoho_lead_submissions l
  LEFT JOIN ai_lead_insights i ON i.lead_id = l.id
  WHERE l.id = p_lead_id;
END;
$$;


ALTER FUNCTION "public"."get_lead_with_insights"("p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaderboard"("p_org_id" "uuid" DEFAULT NULL::"uuid", "p_period" "text" DEFAULT 'month'::"text", "p_limit" integer DEFAULT 10) RETURNS TABLE("rank" integer, "user_id" "uuid", "user_name" "text", "avatar_url" "text", "total_points" integer, "deals_closed" integer, "revenue" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_period" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_metric" "text" DEFAULT 'score'::"text", "p_period" "text" DEFAULT 'week'::"text", "p_limit" integer DEFAULT 10) RETURNS TABLE("rank" integer, "user_id" "uuid", "user_name" "text", "avatar_url" "text", "score" integer, "achievements_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(ap.points, 0) DESC)::INTEGER AS rank,
    ap.user_id,
    COALESCE(ap.first_name || ' ' || ap.last_name, 'Unknown') AS user_name,
    ap.avatar_url,
    COALESCE(ap.points, 0)::INTEGER AS score,
    (SELECT COUNT(*)::INTEGER FROM user_achievements ua WHERE ua.user_id = ap.user_id AND ua.is_earned = TRUE) AS achievements_count
  FROM advisor_profiles ap
  JOIN org_memberships om ON om.user_id = ap.user_id
  WHERE om.org_id = p_org_id
  AND om.status = 'active'
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_metric" "text", "p_period" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_meeting_with_stats"("p_meeting_id" "uuid") RETURNS TABLE("meeting" "public"."advisor_meetings", "total_invited" bigint, "accepted" bigint, "declined" bigint, "pending" bigint, "tentative" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.*,
    COUNT(mi.id) as total_invited,
    COUNT(mi.id) FILTER (WHERE mi.status = 'accepted') as accepted,
    COUNT(mi.id) FILTER (WHERE mi.status = 'declined') as declined,
    COUNT(mi.id) FILTER (WHERE mi.status = 'pending') as pending,
    COUNT(mi.id) FILTER (WHERE mi.status = 'tentative') as tentative
  FROM advisor_meetings m
  LEFT JOIN meeting_invitations mi ON mi.meeting_id = m.id
  WHERE m.id = p_meeting_id
  GROUP BY m.id;
END;
$$;


ALTER FUNCTION "public"."get_meeting_with_stats"("p_meeting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_metric_timeseries"("p_metric_name" "text", "p_start_date" timestamp with time zone DEFAULT ("now"() - '30 days'::interval), "p_end_date" timestamp with time zone DEFAULT "now"(), "p_granularity" "text" DEFAULT 'day'::"text") RETURNS TABLE("date" timestamp with time zone, "value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Return placeholder data - should be connected to actual metrics
  RETURN QUERY
  SELECT 
    generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::TIMESTAMPTZ as date,
    (random() * 100)::NUMERIC as value;
END;
$$;


ALTER FUNCTION "public"."get_metric_timeseries"("p_metric_name" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_granularity" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_notification_events_unread_count"("p_user_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT COUNT(*)::BIGINT
  FROM notification_events
  WHERE user_id = p_user_id AND is_read = FALSE;
$$;


ALTER FUNCTION "public"."get_notification_events_unread_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_layout JSONB;
  v_default_widgets JSONB;
BEGIN
  -- Try to get existing layout
  SELECT to_jsonb(l.*) INTO v_layout
  FROM crm_dashboard_layouts l
  WHERE l.user_id = p_user_id
    AND l.org_id = p_org_id
    AND l.is_default = true;

  IF v_layout IS NOT NULL THEN
    RETURN v_layout;
  END IF;

  -- Get default template (org-specific or system default)
  SELECT widgets INTO v_default_widgets
  FROM crm_default_layout_templates
  WHERE (org_id = p_org_id OR org_id IS NULL)
    AND is_active = true
  ORDER BY org_id NULLS LAST
  LIMIT 1;

  IF v_default_widgets IS NULL THEN
    v_default_widgets := '[]'::jsonb;
  END IF;

  -- Create new layout for user
  INSERT INTO crm_dashboard_layouts (user_id, org_id, name, is_default, widgets)
  VALUES (p_user_id, p_org_id, 'Default', true, v_default_widgets)
  ON CONFLICT (user_id, org_id, name) DO UPDATE SET updated_at = NOW()
  RETURNING to_jsonb(crm_dashboard_layouts.*) INTO v_layout;

  RETURN v_layout;
END;
$$;


ALTER FUNCTION "public"."get_or_create_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_email_thread"("p_org_id" "uuid", "p_subject" "text", "p_lead_id" "uuid" DEFAULT NULL::"uuid", "p_participants" "text"[] DEFAULT '{}'::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_thread_id uuid;
  v_normalized_subject text;
BEGIN
  -- Normalize subject (remove Re:, Fwd:, etc.)
  v_normalized_subject := regexp_replace(
    p_subject,
    '^(Re:|Fwd:|FW:|RE:)\s*',
    '',
    'gi'
  );

  -- Look for existing thread
  SELECT id INTO v_thread_id
  FROM crm_email_threads
  WHERE org_id = p_org_id
    AND subject ILIKE '%' || v_normalized_subject || '%'
    AND (p_lead_id IS NULL OR lead_id = p_lead_id)
    AND created_at > now() - interval '30 days'
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  -- Create new thread if not found
  IF v_thread_id IS NULL THEN
    INSERT INTO crm_email_threads (org_id, subject, lead_id, participants)
    VALUES (p_org_id, v_normalized_subject, p_lead_id, p_participants)
    RETURNING id INTO v_thread_id;
  ELSE
    -- Update participants
    UPDATE crm_email_threads
    SET participants = array(
      SELECT DISTINCT unnest(participants || p_participants)
    ),
    updated_at = now()
    WHERE id = v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_email_thread"("p_org_id" "uuid", "p_subject" "text", "p_lead_id" "uuid", "p_participants" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_notification_settings"("p_user_id" "uuid", "p_org_id" "text" DEFAULT ''::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result jsonb;
  v_effective_org_id text;
BEGIN
  -- Normalize empty org_id
  v_effective_org_id := COALESCE(NULLIF(TRIM(p_org_id), ''), '');

  -- Try to find existing settings
  SELECT to_jsonb(ns.*) INTO v_result
  FROM notification_settings ns
  WHERE ns.user_id = p_user_id AND ns.org_id = v_effective_org_id;

  -- Auto-create if missing
  IF v_result IS NULL THEN
    INSERT INTO notification_settings (user_id, org_id)
    VALUES (p_user_id, v_effective_org_id)
    ON CONFLICT (user_id, org_id) DO NOTHING
    RETURNING to_jsonb(notification_settings.*) INTO v_result;

    -- In case of race condition (concurrent insert), re-read
    IF v_result IS NULL THEN
      SELECT to_jsonb(ns.*) INTO v_result
      FROM notification_settings ns
      WHERE ns.user_id = p_user_id AND ns.org_id = v_effective_org_id;
    END IF;
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_or_create_notification_settings"("p_user_id" "uuid", "p_org_id" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'system'::"text",
    "sidebar_collapsed" boolean DEFAULT false,
    "compact_mode" boolean DEFAULT false,
    "timezone" "text",
    "language" "text",
    "dashboard_layout" "jsonb" DEFAULT '{}'::"jsonb",
    "pinned_items" "jsonb" DEFAULT '[]'::"jsonb",
    "default_lane_id" "uuid",
    "power_list_view" "text" DEFAULT 'cards'::"text",
    "auto_advance_after_complete" boolean DEFAULT true,
    "inbox_preview_lines" integer DEFAULT 2,
    "inbox_group_by" "text" DEFAULT 'none'::"text",
    "inbox_sort_order" "text" DEFAULT 'newest'::"text",
    "keyboard_shortcuts_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_user_preferences"("p_user_id" "uuid", "p_org_id" "uuid") RETURNS "public"."user_preferences"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_prefs user_preferences;
BEGIN
    SELECT * INTO v_prefs FROM user_preferences
    WHERE user_id = p_user_id AND org_id = p_org_id;

    IF v_prefs.id IS NULL THEN
        INSERT INTO user_preferences (user_id, org_id)
        VALUES (p_user_id, p_org_id)
        RETURNING * INTO v_prefs;
    END IF;

    RETURN v_prefs;
END;
$$;


ALTER FUNCTION "public"."get_or_create_user_preferences"("p_user_id" "uuid", "p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_plan_rate"("p_plan_slug" "text", "p_age" integer, "p_member_type" "text", "p_iua_amount" numeric DEFAULT NULL::numeric, "p_effective_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("plan_id" "uuid", "plan_name" "text", "monthly_contribution" numeric, "enrollment_fee" numeric, "annual_membership_fee" numeric, "tobacco_surcharge_pct" numeric)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.id AS plan_id,
    pl.name AS plan_name,
    pp.monthly_contribution,
    pl.enrollment_fee,
    pl.annual_membership_fee,
    pl.tobacco_surcharge_pct
  FROM public.plans pl
  JOIN public.plan_pricing pp ON pp.plan_id = pl.id
  WHERE pl.slug = p_plan_slug
    AND pl.is_active = true
    AND pp.effective_date <= p_effective_date
    AND p_age >= pp.age_min
    AND p_age <= pp.age_max
    AND pp.member_type = p_member_type
    AND (p_iua_amount IS NULL AND pp.iua_amount IS NULL
         OR pp.iua_amount = p_iua_amount)
  ORDER BY pp.effective_date DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_plan_rate"("p_plan_slug" "text", "p_age" integer, "p_member_type" "text", "p_iua_amount" numeric, "p_effective_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_plan_resource_by_slug"("p_slug" "text") RETURNS TABLE("id" "uuid", "plan_slug" "text", "plan_name" "text", "description" "text", "icon" "text", "color" "text", "overview_content" "text", "pricing_content" "text", "handbook_url" "text", "handbook_title" "text", "flyer_url" "text", "flyer_title" "text", "qrg_url" "text", "qrg_title" "text", "state_guidelines" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_plan_resource_by_slug"("p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_power_list"("p_org_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 20) RETURNS TABLE("item_id" "uuid", "lane_id" "uuid", "lane_name" "text", "lane_color" "text", "lead_id" "uuid", "contact_id" "uuid", "person_name" "text", "person_email" "text", "reason" "text", "score" integer, "rank" integer, "last_action_at" timestamp with time zone, "next_action_at" timestamp with time zone, "snoozed_until" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
  LEFT JOIN zoho_lead_submissions l ON l.id = pi.lead_id
  WHERE pi.org_id = p_org_id
    AND pi.completed_at IS NULL
    AND (pi.snoozed_until IS NULL OR pi.snoozed_until < now())
    AND (p_user_id IS NULL OR pi.owner_user_id = p_user_id OR pi.owner_user_id IS NULL)
  ORDER BY
    pl.order_index ASC,
    pi.score DESC,
    pi.rank ASC NULLS LAST
  LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_power_list"("p_org_id" "uuid", "p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_power_list"("p_org_id" "uuid", "p_user_id" "uuid", "p_limit" integer) IS 'Get prioritized list of items for a user to action today';



CREATE OR REPLACE FUNCTION "public"."get_recent_searches"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "query" "text", "result_count" integer, "searched_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Return empty for now - can be populated later
  RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 0::INTEGER, NULL::TIMESTAMPTZ WHERE FALSE;
END;
$$;


ALTER FUNCTION "public"."get_recent_searches"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trending_keywords"("p_site_url" "text", "p_days" integer DEFAULT 7, "p_limit" integer DEFAULT 10, "p_direction" "text" DEFAULT 'up'::"text") RETURNS TABLE("keyword" "text", "current_position" numeric, "previous_position" numeric, "position_change" numeric, "clicks" integer, "impressions" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.keyword,
    r.position as current_position,
    r.previous_position,
    r.position_change,
    r.clicks,
    r.impressions
  FROM seo_keyword_rankings r
  WHERE r.site_url = p_site_url
    AND r.date >= CURRENT_DATE - p_days
    AND r.trend = p_direction
  ORDER BY 
    CASE WHEN p_direction = 'up' THEN r.position_change END ASC,
    CASE WHEN p_direction = 'down' THEN r.position_change END DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_trending_keywords"("p_site_url" "text", "p_days" integer, "p_limit" integer, "p_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_user_roles"() RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "profile_role" "text", "roles" "text"[], "highest_role" "text", "admin_role" "text", "admin_status" "text", "admin_permissions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT AS full_name,
        p.role::TEXT AS profile_role,
        COALESCE(
            (SELECT array_agg(ur.role::text ORDER BY
                CASE ur.role
                    WHEN 'super_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'manager' THEN 3
                    WHEN 'staff' THEN 4
                    WHEN 'advisor' THEN 5
                    WHEN 'member' THEN 6
                    WHEN 'guest' THEN 7
                END
            ) FROM user_roles ur WHERE ur.user_id = u.id),
            ARRAY[]::text[]
        ) AS roles,
        COALESCE(
            (SELECT ur.role::text FROM user_roles ur WHERE ur.user_id = u.id
             ORDER BY
                CASE ur.role
                    WHEN 'super_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'manager' THEN 3
                    WHEN 'staff' THEN 4
                    WHEN 'advisor' THEN 5
                    WHEN 'member' THEN 6
                    WHEN 'guest' THEN 7
                END
             LIMIT 1),
            'member'
        )::TEXT AS highest_role,
        au.role::TEXT AS admin_role,
        au.status::TEXT AS admin_status,
        au.permissions AS admin_permissions
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN admin_users au ON au.id = u.id
    ORDER BY u.email;
END;
$$;


ALTER FUNCTION "public"."get_unified_user_roles"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unified_user_roles"() IS 'Returns unified user roles (replaces unified_user_roles view). Only accessible by admins. Does not expose auth.users to API.';



CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
      AND is_dismissed = FALSE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_upcoming_advisor_meetings"("p_limit" integer DEFAULT 10) RETURNS SETOF "public"."advisor_meetings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM advisor_meetings
  WHERE status = 'scheduled'
  AND scheduled_at > NOW()
  ORDER BY scheduled_at ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_upcoming_advisor_meetings"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_upcoming_events"("p_user_id" "uuid", "p_days" integer DEFAULT 7) RETURNS TABLE("id" "uuid", "title" "text", "event_type" "text", "start_time" timestamp with time zone, "end_time" timestamp with time zone, "lead_id" "uuid", "lead_name" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
  LEFT JOIN zoho_lead_submissions l ON l.id = e.lead_id
  WHERE e.assigned_to = p_user_id
    AND e.start_time >= NOW()
    AND e.start_time <= NOW() + (p_days || ' days')::INTERVAL
    AND e.status NOT IN ('cancelled')
  ORDER BY e.start_time ASC;
END;
$$;


ALTER FUNCTION "public"."get_upcoming_events"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_compliance_status"("p_user_id" "uuid") RETURNS TABLE("total_documents" integer, "acknowledged" integer, "pending" integer, "expired" integer, "compliance_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."get_user_compliance_status"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_org_ids"() RETURNS "uuid"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    array_agg(org_id),
    ARRAY[]::uuid[]
  )
  FROM org_memberships
  WHERE user_id = auth.uid()
  AND status = 'active';
$$;


ALTER FUNCTION "public"."get_user_org_ids"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_org_ids"() IS 'Returns array of org IDs the current user is an active member of';



CREATE OR REPLACE FUNCTION "public"."get_user_org_ids"("p_user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT org_id FROM org_memberships
  WHERE user_id = p_user_id AND status = 'active';
$$;


ALTER FUNCTION "public"."get_user_org_ids"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_org_role"("check_org_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role
  FROM org_memberships
  WHERE org_id = check_org_id
  AND user_id = auth.uid()
  AND status = 'active'
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_org_role"("check_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_org_role"("check_org_id" "uuid") IS 'Returns the users role in a specific org, or null if not a member';



CREATE OR REPLACE FUNCTION "public"."get_user_primary_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT org_id
  FROM org_memberships
  WHERE user_id = auth.uid()
  AND status = 'active'
  ORDER BY
    CASE WHEN role = 'owner' THEN 0
         WHEN role = 'admin' THEN 1
         WHEN role = 'manager' THEN 2
         ELSE 3
    END,
    joined_at ASC
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_primary_org_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_primary_org_id"() IS 'Returns the primary org ID for the current user (prioritizes owner/admin roles)';



CREATE OR REPLACE FUNCTION "public"."get_user_roles"("check_user_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    roles TEXT[];
BEGIN
    SELECT ARRAY_AGG(role::TEXT) INTO roles
    FROM public.user_roles
    WHERE user_id = check_user_id;
    
    RETURN COALESCE(roles, ARRAY[]::TEXT[]);
END;
$$;


ALTER FUNCTION "public"."get_user_roles"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_with_roles"("target_user_id" "uuid") RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "user_created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT
        u.id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
        u.created_at as user_created_at,
        u.last_sign_in_at,
        COALESCE(
            (SELECT ARRAY_AGG(ur.role::TEXT ORDER BY ur.role)
             FROM public.user_roles ur
             WHERE ur.user_id = u.id),
            ARRAY[]::TEXT[]
        ) as roles
    FROM auth.users u
    WHERE u.id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_with_roles"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_with_roles"("target_user_id" "uuid") IS 'Returns a single user with their roles by ID. Only accessible by admins.';



CREATE OR REPLACE FUNCTION "public"."handle_crm_accounts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_accounts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_activities_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_activities_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_campaigns_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_campaigns_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_case_comments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."handle_crm_case_comments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_cases_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."handle_crm_cases_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_contacts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_contacts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_deal_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    -- Calculate total
    NEW.total = NEW.quantity * NEW.unit_price * (1 - COALESCE(NEW.discount_percent, 0) / 100);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_deal_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_deal_stages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_deal_stages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_deals_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    -- Log initial stage
    INSERT INTO public.crm_deal_stage_history (deal_id, from_stage_id, to_stage_id, changed_by)
    VALUES (NEW.id, NULL, NEW.stage_id, auth.uid());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_deals_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_documents_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."handle_crm_documents_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_forecast_entries_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    -- Auto-calculate weighted amount
    NEW.weighted_amount = ROUND(NEW.amount * NEW.probability / 100.0, 2);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_forecast_entries_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_forecasts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_forecasts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_invoice_line_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_invoice_line_items_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_invoices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    NEW.balance_due = NEW.total - COALESCE(NEW.amount_paid, 0);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_invoices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_price_book_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_price_book_items_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_price_books_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_price_books_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_quote_line_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_quote_line_items_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_quotes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_crm_quotes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_crm_saved_views_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."handle_crm_saved_views_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_deal_stage_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only log if stage actually changed
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO public.crm_deal_stage_history (deal_id, from_stage_id, to_stage_id, changed_by)
        VALUES (NEW.id, OLD.stage_id, NEW.stage_id, auth.uid());

        -- Update timestamps for won/lost
        IF EXISTS (SELECT 1 FROM public.crm_deal_stages WHERE id = NEW.stage_id AND is_won_stage = true) THEN
            NEW.won_at = now();
            NEW.actual_close_date = CURRENT_DATE;
        ELSIF EXISTS (SELECT 1 FROM public.crm_deal_stages WHERE id = NEW.stage_id AND is_lost_stage = true) THEN
            NEW.lost_at = now();
            NEW.actual_close_date = CURRENT_DATE;
        END IF;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_deal_stage_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := public.generate_invoice_number(NEW.org_id);
    END IF;
    -- Initialize balance_due
    NEW.balance_due := NEW.total - COALESCE(NEW.amount_paid, 0);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_invoice_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_paid numeric(15,2);
    v_invoice_total numeric(15,2);
BEGIN
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.crm_invoice_payments
    WHERE invoice_id = NEW.invoice_id;

    -- Get invoice total
    SELECT total INTO v_invoice_total
    FROM public.crm_invoices
    WHERE id = NEW.invoice_id;

    -- Update invoice
    UPDATE public.crm_invoices
    SET
        amount_paid = v_total_paid,
        balance_due = v_invoice_total - v_total_paid,
        status = CASE
            WHEN v_total_paid >= v_invoice_total THEN 'paid'
            WHEN v_total_paid > 0 THEN 'partial'
            ELSE status
        END,
        paid_date = CASE
            WHEN v_total_paid >= v_invoice_total THEN CURRENT_DATE
            ELSE paid_date
        END,
        updated_at = now()
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_invoice_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    -- Create profile with default member role
    BEGIN
        INSERT INTO public.profiles (id, role)
        VALUES (NEW.id, 'member')
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: profiles insert failed for %: %', NEW.id, SQLERRM;
    END;

    -- Create user_roles entry
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'member'::user_role_type)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: user_roles insert failed for %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_org_memberships_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_org_memberships_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_orgs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_orgs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_plans_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_plans_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_quote_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
        NEW.quote_number := public.generate_quote_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_quote_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_org_permission"("p_org_id" "uuid", "p_permission_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        JOIN public.role_permissions rp ON rp.org_id = om.org_id AND rp.role = om.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND p.key = p_permission_key
    );
$$;


ALTER FUNCTION "public"."has_org_permission"("p_org_id" "uuid", "p_permission_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("check_user_id" "uuid", "check_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = check_user_id 
        AND role::TEXT = check_role
    );
END;
$$;


ALTER FUNCTION "public"."has_role"("check_user_id" "uuid", "check_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_advisor_content_view_count"("content_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE advisor_content
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = content_id;
END;
$$;


ALTER FUNCTION "public"."increment_advisor_content_view_count"("content_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."increment_advisor_content_view_count"("content_id" "uuid") IS 'Increment view count for advisor content. Called when advisors view bulletins.';



CREATE OR REPLACE FUNCTION "public"."increment_email_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF NEW.tracking_type = 'open' THEN
        UPDATE crm_email_log
        SET open_count = open_count + 1,
            first_opened_at = COALESCE(first_opened_at, NEW.tracked_at),
            last_opened_at = NEW.tracked_at
        WHERE id = NEW.email_log_id;
    ELSIF NEW.tracking_type = 'click' THEN
        UPDATE crm_email_log
        SET click_count = click_count + 1
        WHERE id = NEW.email_log_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_email_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_message_template_times_used"("template_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE message_templates
  SET times_used = COALESCE(times_used, 0) + 1,
      last_used_at = NOW(),
      updated_at = NOW()
  WHERE id = template_id;
END;
$$;


ALTER FUNCTION "public"."increment_message_template_times_used"("template_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_promo_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    UPDATE promo_codes
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = NEW.promo_code_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_promo_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_saved_search_use_count"("search_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE saved_searches
  SET use_count = COALESCE(use_count, 0) + 1,
      last_used_at = NOW()
  WHERE id = search_id;
END;
$$;


ALTER FUNCTION "public"."increment_saved_search_use_count"("search_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_times_used"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  IF p_table = 'message_templates' AND p_id_col = 'id' THEN
    PERFORM increment_message_template_times_used(p_record_id);
  ELSE
    EXECUTE format(
      'UPDATE %I SET times_used = COALESCE(times_used, 0) + 1 WHERE %I = $1',
      p_table, p_id_col
    ) USING p_record_id;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."increment_times_used"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_use_count"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  IF p_table = 'saved_searches' AND p_id_col = 'id' THEN
    PERFORM increment_saved_search_use_count(p_record_id);
  ELSE
    EXECUTE format(
      'UPDATE %I SET use_count = COALESCE(use_count, 0) + 1 WHERE %I = $1',
      p_table, p_id_col
    ) USING p_record_id;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."increment_use_count"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_advisors_to_meeting"("p_meeting_id" "uuid", "p_advisor_ids" "uuid"[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_advisor_id UUID;
BEGIN
  FOREACH v_advisor_id IN ARRAY p_advisor_ids
  LOOP
    INSERT INTO meeting_invitations (meeting_id, advisor_id, status)
    VALUES (p_meeting_id, v_advisor_id, 'pending')
    ON CONFLICT (meeting_id, advisor_id) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."invite_advisors_to_meeting"("p_meeting_id" "uuid", "p_advisor_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_all_advisors_to_meeting"("p_meeting_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO meeting_invitations (meeting_id, advisor_id, status)
  SELECT p_meeting_id, id, 'pending'
  FROM advisor_profiles
  WHERE status = 'active'
  ON CONFLICT (meeting_id, advisor_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."invite_all_advisors_to_meeting"("p_meeting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("p_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND om.role IN ('owner', 'admin')
    );
$$;


ALTER FUNCTION "public"."is_org_admin"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("p_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
    );
$$;


ALTER FUNCTION "public"."is_org_member"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_role"("p_org_id" "uuid", "p_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND om.role = p_role
    );
$$;


ALTER FUNCTION "public"."is_org_role"("p_org_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT COALESCE((
    SELECT p.role IN ('admin','staff','superadmin') FROM public.profiles p WHERE p.id = auth.uid()
  ), false);
$$;


ALTER FUNCTION "public"."is_staff_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_document_access"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
INSERT INTO public.document_access_log (document_id, accessed_by, access_type)
VALUES (NEW.id, auth.uid(), 'view');
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_document_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_chat_conversation_read"("p_user_id" "uuid", "p_conversation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE chat_members
  SET last_read_at = now()
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id;
END;
$$;


ALTER FUNCTION "public"."mark_chat_conversation_read"("p_user_id" "uuid", "p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_priority_item"("p_item_id" "uuid", "p_new_lane_id" "uuid", "p_new_rank" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE priority_items
  SET
    lane_id = p_new_lane_id,
    rank = p_new_rank,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."move_priority_item"("p_item_id" "uuid", "p_new_lane_id" "uuid", "p_new_rank" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_deal_amount"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_deal_id uuid;
    v_total numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_deal_id := OLD.deal_id;
    ELSE
        v_deal_id := NEW.deal_id;
    END IF;

    SELECT COALESCE(SUM(total), 0) INTO v_total
    FROM public.crm_deal_products
    WHERE deal_id = v_deal_id;

    -- Only update if there are products
    IF v_total > 0 THEN
        UPDATE public.crm_deals
        SET amount = v_total, updated_at = now()
        WHERE id = v_deal_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."recalculate_deal_amount"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_invoice_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_invoice_id uuid;
    v_subtotal numeric(15,2);
    v_tax_amount numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT
        COALESCE(SUM(line_total - tax_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax_amount
    FROM public.crm_invoice_line_items
    WHERE invoice_id = v_invoice_id;

    UPDATE public.crm_invoices
    SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total = v_subtotal + v_tax_amount + COALESCE(shipping_amount, 0) + COALESCE(adjustment, 0) - COALESCE(discount_amount, 0),
        balance_due = v_subtotal + v_tax_amount + COALESCE(shipping_amount, 0) + COALESCE(adjustment, 0) - COALESCE(discount_amount, 0) - COALESCE(amount_paid, 0),
        updated_at = now()
    WHERE id = v_invoice_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."recalculate_invoice_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_quote_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_quote_id uuid;
    v_subtotal numeric(15,2);
    v_tax_amount numeric(15,2);
BEGIN
    -- Determine which quote to recalculate
    IF TG_OP = 'DELETE' THEN
        v_quote_id := OLD.quote_id;
    ELSE
        v_quote_id := NEW.quote_id;
    END IF;

    -- Calculate subtotal and tax from line items
    SELECT
        COALESCE(SUM(line_total - tax_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax_amount
    FROM public.crm_quote_line_items
    WHERE quote_id = v_quote_id;

    -- Update quote totals
    UPDATE public.crm_quotes
    SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total = v_subtotal + v_tax_amount + COALESCE(shipping_amount, 0) + COALESCE(adjustment, 0) - COALESCE(discount_amount, 0),
        updated_at = now()
    WHERE id = v_quote_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."recalculate_quote_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_user_role"("target_user_id" "uuid", "target_role" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count INT;
    default_org UUID := '00000000-0000-4000-a000-000000000001';
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: super_admin role required';
    END IF;

    -- Prevent removing your own super_admin role
    IF target_user_id = auth.uid() AND target_role = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot remove your own super_admin role';
    END IF;

    DELETE FROM user_roles
    WHERE user_id = target_user_id AND role::text = target_role;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Deactivate org membership when CRM role removed
    IF target_role = 'crm_user' THEN
        UPDATE org_memberships
        SET status = 'inactive'
        WHERE user_id = target_user_id AND org_id = default_org;
    END IF;

    -- Deactivate admin_users when admin/super_admin role removed
    IF target_role IN ('admin', 'super_admin') THEN
        -- Only deactivate if user has no other admin-level roles
        IF NOT EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = target_user_id AND role IN ('admin', 'super_admin')
        ) THEN
            UPDATE admin_users SET status = 'inactive' WHERE id = target_user_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'removed', deleted_count > 0
    );
END;
$$;


ALTER FUNCTION "public"."remove_user_role"("target_user_id" "uuid", "target_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."render_email_signature"("p_signature_id" "uuid", "p_override_vars" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_signature crm_email_signatures;
  v_result text;
  v_vars jsonb;
  v_key text;
  v_value text;
BEGIN
  -- Get signature
  SELECT * INTO v_signature FROM crm_email_signatures WHERE id = p_signature_id;
  IF NOT FOUND THEN
    RETURN '';
  END IF;

  v_result := v_signature.content;
  v_vars := v_signature.variables || p_override_vars;

  -- Replace variables
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(v_vars)
  LOOP
    v_result := replace(v_result, '{{' || v_key || '}}', COALESCE(v_value, ''));
  END LOOP;

  -- Replace logo placeholder
  IF v_signature.logo_url IS NOT NULL THEN
    v_result := replace(v_result, '{{logo_url}}', v_signature.logo_url);
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."render_email_signature"("p_signature_id" "uuid", "p_override_vars" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    "reminder_sent" boolean DEFAULT false,
    "reminder_sent_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "meeting_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'tentative'::"text", 'no_response'::"text"])))
);


ALTER TABLE "public"."meeting_invitations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_meeting_invitation"("p_invitation_id" "uuid", "p_response" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "public"."meeting_invitations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invitation meeting_invitations;
BEGIN
  UPDATE meeting_invitations
  SET
    status = p_response,
    responded_at = NOW(),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;


ALTER FUNCTION "public"."respond_to_meeting_invitation"("p_invitation_id" "uuid", "p_response" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid", "p_widgets" "jsonb", "p_name" "text" DEFAULT 'Default'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_layout JSONB;
BEGIN
  INSERT INTO crm_dashboard_layouts (user_id, org_id, name, widgets, is_default)
  VALUES (p_user_id, p_org_id, p_name, p_widgets, p_name = 'Default')
  ON CONFLICT (user_id, org_id, name)
  DO UPDATE SET
    widgets = p_widgets,
    updated_at = NOW()
  RETURNING to_jsonb(crm_dashboard_layouts.*) INTO v_layout;

  RETURN v_layout;
END;
$$;


ALTER FUNCTION "public"."save_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid", "p_widgets" "jsonb", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_chat_messages"("p_user_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "conversation_id" "uuid", "conversation_name" "text", "sender_id" "uuid", "sender_name" "text", "content" "text", "created_at" timestamp with time zone, "rank" real)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT
    m.id,
    m.conversation_id,
    cc.name AS conversation_name,
    m.sender_id,
    COALESCE(ap.first_name || ' ' || ap.last_name, 'Unknown') AS sender_name,
    m.content,
    m.created_at,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', p_query)) AS rank
  FROM chat_messages m
  JOIN chat_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = p_user_id
  JOIN chat_conversations cc ON cc.id = m.conversation_id
  LEFT JOIN advisor_profiles ap ON ap.id = m.sender_id
  WHERE m.is_deleted = FALSE
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;


ALTER FUNCTION "public"."search_chat_messages"("p_user_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "industry" "text",
    "website" "text",
    "phone" "text",
    "fax" "text",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "billing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_address" "jsonb" DEFAULT '{}'::"jsonb",
    "annual_revenue" numeric(15,2),
    "employee_count" integer,
    "account_type" "text" DEFAULT 'prospect'::"text" NOT NULL,
    "rating" "text",
    "owner_id" "uuid",
    "parent_account_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "linkedin_url" "text",
    "twitter_handle" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    CONSTRAINT "crm_accounts_account_type_check" CHECK (("account_type" = ANY (ARRAY['prospect'::"text", 'customer'::"text", 'partner'::"text", 'vendor'::"text", 'other'::"text"]))),
    CONSTRAINT "crm_accounts_rating_check" CHECK (("rating" = ANY (ARRAY['hot'::"text", 'warm'::"text", 'cold'::"text"])))
);


ALTER TABLE "public"."crm_accounts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_crm_accounts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 20) RETURNS SETOF "public"."crm_accounts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT a.*
    FROM public.crm_accounts a
    WHERE a.org_id = p_org_id
    AND (
        a.search_vector @@ plainto_tsquery('english', p_query)
        OR a.name ILIKE '%' || p_query || '%'
    )
    ORDER BY
        CASE WHEN a.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
        ts_rank(a.search_vector, plainto_tsquery('english', p_query)) DESC,
        a.name
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_crm_accounts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "account_id" "uuid",
    "salutation" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "fax" "text",
    "title" "text",
    "department" "text",
    "reports_to" "uuid",
    "mailing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "other_address" "jsonb" DEFAULT '{}'::"jsonb",
    "lead_source" "text",
    "converted_from_lead_id" "uuid",
    "converted_at" timestamp with time zone,
    "do_not_call" boolean DEFAULT false,
    "do_not_email" boolean DEFAULT false,
    "email_opt_out" boolean DEFAULT false,
    "owner_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "linkedin_url" "text",
    "twitter_handle" "text",
    "date_of_birth" "date",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    CONSTRAINT "crm_contacts_salutation_check" CHECK (("salutation" = ANY (ARRAY['Mr.'::"text", 'Ms.'::"text", 'Mrs.'::"text", 'Dr.'::"text", 'Prof.'::"text"])))
);


ALTER TABLE "public"."crm_contacts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_crm_contacts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 20) RETURNS SETOF "public"."crm_contacts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.*
    FROM public.crm_contacts c
    WHERE c.org_id = p_org_id
    AND (
        c.search_vector @@ plainto_tsquery('english', p_query)
        OR (c.first_name || ' ' || c.last_name) ILIKE '%' || p_query || '%'
        OR c.email ILIKE '%' || p_query || '%'
    )
    ORDER BY
        CASE WHEN (c.first_name || ' ' || c.last_name) ILIKE p_query || '%' THEN 0 ELSE 1 END,
        ts_rank(c.search_vector, plainto_tsquery('english', p_query)) DESC,
        c.first_name, c.last_name
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_crm_contacts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "account_id" "uuid",
    "contact_id" "uuid",
    "amount" numeric(15,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "stage_id" "uuid" NOT NULL,
    "probability" integer,
    "expected_close_date" "date",
    "actual_close_date" "date",
    "deal_type" "text" DEFAULT 'new_business'::"text",
    "lead_source" "text",
    "next_step" "text",
    "owner_id" "uuid",
    "won_at" timestamp with time zone,
    "lost_at" timestamp with time zone,
    "lost_reason" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "campaign_id" "uuid",
    "converted_from_lead_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    CONSTRAINT "crm_deals_deal_type_check" CHECK (("deal_type" = ANY (ARRAY['new_business'::"text", 'existing_business'::"text", 'renewal'::"text"]))),
    CONSTRAINT "crm_deals_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100)))
);


ALTER TABLE "public"."crm_deals" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_crm_deals"("p_org_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 20) RETURNS SETOF "public"."crm_deals"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT d.*
    FROM public.crm_deals d
    WHERE d.org_id = p_org_id
    AND (
        d.search_vector @@ plainto_tsquery('english', p_query)
        OR d.name ILIKE '%' || p_query || '%'
    )
    ORDER BY
        CASE WHEN d.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
        ts_rank(d.search_vector, plainto_tsquery('english', p_query)) DESC,
        d.name
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_crm_deals"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_users_with_roles"("search_email" "text") RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "user_created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
        u.created_at as user_created_at,
        u.last_sign_in_at,
        COALESCE(
            (SELECT ARRAY_AGG(ur.role::TEXT ORDER BY ur.role) 
             FROM public.user_roles ur 
             WHERE ur.user_id = u.id),
            ARRAY[]::TEXT[]
        ) as roles
    FROM auth.users u
    WHERE u.email ILIKE '%' || search_email || '%'
    ORDER BY u.email
    LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."search_users_with_roles"("search_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_users_with_roles"("search_email" "text") IS 'Search users by email and return with their roles. Only accessible by admins.';



CREATE OR REPLACE FUNCTION "public"."setup_catherine_superadmin_profile"("user_email" "text", "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES (
user_id,
'advisor',
now(),
now()
)
ON CONFLICT (id) DO UPDATE
SET
role = 'advisor',
updated_at = now();

INSERT INTO advisor_profiles (
id,
first_name,
last_name,
email,
phone,
specialization,
status,
onboarding_completed,
onboarding_completed_at,
metadata,
created_at,
updated_at
)
VALUES (
user_id,
'Catherine',
'Okubo',
user_email,
'555-0101',
'System Administration',
'active',
true,
now(),
jsonb_build_object(
'role', 'superadmin',
'access_level', 'full',
'license_number', 'ADMIN-002',
'notes', 'Superadmin account - Full system access for testing and administration'
),
now(),
now()
)
ON CONFLICT (id) DO UPDATE
SET
first_name = 'Catherine',
last_name = 'Okubo',
email = user_email,
phone = '555-0101',
specialization = 'System Administration',
status = 'active',
onboarding_completed = true,
onboarding_completed_at = now(),
metadata = jsonb_build_object(
'role', 'superadmin',
'access_level', 'full',
'license_number', 'ADMIN-002',
'notes', 'Superadmin account - Full system access for testing and administration'
),
updated_at = now();
END;
$$;


ALTER FUNCTION "public"."setup_catherine_superadmin_profile"("user_email" "text", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_superadmin_profile"("user_email" "text", "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES (
user_id,
'advisor',
now(),
now()
)
ON CONFLICT (id) DO UPDATE
SET 
role = 'advisor',
updated_at = now();

INSERT INTO advisor_profiles (
id,
first_name,
last_name,
email,
phone,
specialization,
status,
onboarding_completed,
onboarding_completed_at,
metadata,
created_at,
updated_at
)
VALUES (
user_id,
'Vinnie',
'Champion',
user_email,
'555-0100',
'System Administration',
'active',
true,
now(),
jsonb_build_object(
'role', 'superadmin',
'access_level', 'full',
'notes', 'Superadmin account for testing all portal experiences'
),
now(),
now()
)
ON CONFLICT (id) DO UPDATE
SET
first_name = 'Vinnie',
last_name = 'Champion',
email = user_email,
phone = '555-0100',
specialization = 'System Administration',
status = 'active',
onboarding_completed = true,
onboarding_completed_at = now(),
metadata = jsonb_build_object(
'role', 'superadmin',
'access_level', 'full',
'notes', 'Superadmin account for testing all portal experiences'
),
updated_at = now();
END;
$$;


ALTER FUNCTION "public"."setup_superadmin_profile"("user_email" "text", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_test_advisor_profile"("user_email" "text", "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Insert or update profile with advisor role
  INSERT INTO profiles (id, role, created_at, updated_at)
  VALUES (
    user_id,
    'advisor',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'advisor',
    updated_at = now();

  -- Create or update advisor profile
  INSERT INTO advisor_profiles (
    id,
    first_name,
    last_name,
    email,
    phone,
    specialization,
    status,
    onboarding_completed,
    onboarding_completed_at,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    'Test',
    'Advisor',
    user_email,
    '555-TEST-01',
    'Health Benefits',
    'active',
    true,
    now(),
    jsonb_build_object(
      'role', 'advisor',
      'access_level', 'standard',
      'license_number', 'TEST-001',
      'notes', 'Test advisor account for development and testing'
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = 'Test',
    last_name = 'Advisor',
    email = user_email,
    phone = '555-TEST-01',
    specialization = 'Health Benefits',
    status = 'active',
    onboarding_completed = true,
    onboarding_completed_at = now(),
    metadata = jsonb_build_object(
      'role', 'advisor',
      'access_level', 'standard',
      'license_number', 'TEST-001',
      'notes', 'Test advisor account for development and testing'
    ),
    updated_at = now();

  RAISE NOTICE 'Test advisor profile created/updated for %', user_email;
END;
$$;


ALTER FUNCTION "public"."setup_test_advisor_profile"("user_email" "text", "user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."setup_test_advisor_profile"("user_email" "text", "user_id" "uuid") IS 'Sets up a test advisor account. Call with email and user_id after creating the auth user.';



CREATE OR REPLACE FUNCTION "public"."share_note_with_role"("p_note_id" "uuid", "p_target_role" "text", "p_permission_level" "text" DEFAULT 'view'::"text", "p_share_message" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_note_owner uuid;
  v_target_users uuid[];
  v_user_id uuid;
  v_share_id uuid;
BEGIN
  -- Get the note owner
  SELECT created_by INTO v_note_owner FROM notes WHERE id = p_note_id;
  
  IF v_note_owner IS NULL THEN
    SELECT user_id INTO v_note_owner FROM notes WHERE id = p_note_id;
  END IF;
  
  IF v_note_owner IS NULL OR v_note_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to share this note');
  END IF;

  -- Get users with the target role
  SELECT ARRAY_AGG(id) INTO v_target_users
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = u.id 
    AND up.role = p_target_role
  );

  -- If no users found with that role, still create a role-based share
  INSERT INTO note_shares (note_id, shared_by_user_id, shared_with_role, permission_level, share_message)
  VALUES (p_note_id, auth.uid(), p_target_role, p_permission_level, p_share_message)
  ON CONFLICT DO NOTHING;

  -- Update the note to mark as shared
  UPDATE notes SET is_shared = true, is_collaborative = (p_permission_level = 'edit')
  WHERE id = p_note_id;

  -- Create notifications for target users
  IF v_target_users IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_target_users
    LOOP
      IF v_user_id != auth.uid() THEN
        INSERT INTO note_notifications (note_id, recipient_user_id, notification_type, metadata)
        VALUES (p_note_id, v_user_id, 'shared', jsonb_build_object('shared_by', auth.uid(), 'message', p_share_message));
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."share_note_with_role"("p_note_id" "uuid", "p_target_role" "text", "p_permission_level" "text", "p_share_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."snooze_priority_item"("p_item_id" "uuid", "p_until" timestamp with time zone, "p_reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE priority_items
  SET
    snoozed_until = p_until,
    snooze_reason = p_reason,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."snooze_priority_item"("p_item_id" "uuid", "p_until" timestamp with time zone, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_advisor_meeting"("p_meeting_id" "uuid") RETURNS "public"."advisor_meetings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_meeting advisor_meetings;
BEGIN
  UPDATE advisor_meetings
  SET
    status = 'live',
    started_at = NOW()
  WHERE id = p_meeting_id
  RETURNING * INTO v_meeting;

  RETURN v_meeting;
END;
$$;


ALTER FUNCTION "public"."start_advisor_meeting"("p_meeting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_bulletin_notification"("p_bulletin_id" "uuid", "p_sent_by" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_notification_id UUID;
  v_recipient_count INTEGER;
BEGIN
  -- Count active advisors
  SELECT COUNT(*) INTO v_recipient_count
  FROM get_active_advisor_emails();

  -- Create notification record
  INSERT INTO bulletin_email_notifications (
    bulletin_id,
    sent_by,
    total_recipients,
    status
  ) VALUES (
    p_bulletin_id,
    p_sent_by,
    v_recipient_count,
    'pending'
  )
  RETURNING id INTO v_notification_id;

  -- Create recipient records
  INSERT INTO bulletin_email_recipients (
    notification_id,
    advisor_id,
    email,
    status
  )
  SELECT
    v_notification_id,
    advisor_id,
    email,
    'pending'
  FROM get_active_advisor_emails();

  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."start_bulletin_notification"("p_bulletin_id" "uuid", "p_sent_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_admin_users_role_to_user_roles"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    -- On role change, ensure the new role exists in user_roles
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Insert new role
        INSERT INTO user_roles (user_id, role)
        VALUES (NEW.id, NEW.role::user_role_type)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_admin_users_role_to_user_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_advisor_profile_to_itsts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  _email       text;
  _roles       text[];
  _edge_fn_url text;
  _service_key text;
BEGIN
  SELECT au.email INTO _email
  FROM auth.users au
  WHERE au.id = NEW.id;

  IF _email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(ur.role) INTO _roles
  FROM user_roles ur
  WHERE ur.user_id = NEW.id;

  IF _roles IS NULL THEN
    _roles := ARRAY['advisor'];
  END IF;

  -- Fixed: fallback now points to THIS project (dtmnkzllidaiqyheguhl),
  -- not the ITSTS project (hhikjgrttgnvojtunmla).
  _edge_fn_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://dtmnkzllidaiqyheguhl.supabase.co'
  ) || '/functions/v1/sync-user-to-itsts';

  _service_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  PERFORM net.http_post(
    url     := _edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body    := jsonb_build_object(
      'user_id',        NEW.id::text,
      'email',          _email,
      'first_name',     coalesce(NEW.first_name, ''),
      'last_name',      coalesce(NEW.last_name,  ''),
      'roles',          _roles,
      'action',         CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      'phone',          NEW.phone,
      'specialization', NEW.specialization,
      'agent_id',       NEW.agent_id,
      'company_name',   NEW.company_name,
      'avatar_url',     NEW.avatar_url
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'advisor profile itsts sync trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_advisor_profile_to_itsts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_advisor_profile_to_itsts"() IS 'Async trigger that syncs advisor profile data to the ITSTS support ticketing system.';



CREATE OR REPLACE FUNCTION "public"."sync_roles_to_legacy"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    highest_role text;
    profile_role text;
BEGIN
    -- Calculate the highest privilege role for this user
    SELECT
        CASE
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'super_admin') THEN 'super_admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'admin') THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'manager') THEN 'manager'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'staff') THEN 'staff'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'advisor') THEN 'advisor'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'member') THEN 'member'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'guest') THEN 'guest'
            ELSE 'member'
        END
    INTO highest_role;

    -- Map to profiles.role (profiles uses: guest, member, advisor, admin, staff)
    profile_role := CASE highest_role
        WHEN 'super_admin' THEN 'admin'
        WHEN 'admin' THEN 'admin'
        WHEN 'manager' THEN 'staff'
        WHEN 'staff' THEN 'staff'
        WHEN 'advisor' THEN 'advisor'
        WHEN 'guest' THEN 'guest'
        ELSE 'member'
    END;

    -- Update profiles table
    UPDATE profiles
    SET role = profile_role, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    -- Update admin_users table (only if row exists)
    UPDATE admin_users
    SET role = highest_role, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."sync_roles_to_legacy"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_to_itsts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  _user_record record;
  _edge_fn_url text;
  _service_key text;
  _first_name  text;
  _last_name   text;
  _email       text;
  _roles       text[];
BEGIN
  SELECT
    au.email,
    coalesce(au.raw_user_meta_data->>'first_name',
             split_part(coalesce(au.raw_user_meta_data->>'full_name', ''), ' ', 1)) AS first_name,
    coalesce(au.raw_user_meta_data->>'last_name',
             split_part(coalesce(au.raw_user_meta_data->>'full_name', ''), ' ', 2)) AS last_name
  INTO _user_record
  FROM auth.users au
  WHERE au.id = NEW.user_id;

  IF _user_record IS NULL THEN
    RETURN NEW;
  END IF;

  _email      := _user_record.email;
  _first_name := coalesce(_user_record.first_name, '');
  _last_name  := coalesce(_user_record.last_name,  '');

  SELECT array_agg(ur.role)
  INTO _roles
  FROM user_roles ur
  WHERE ur.user_id = NEW.user_id;

  -- Fixed: fallback now points to THIS project (dtmnkzllidaiqyheguhl),
  -- not the ITSTS project (hhikjgrttgnvojtunmla).
  _edge_fn_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://dtmnkzllidaiqyheguhl.supabase.co'
  ) || '/functions/v1/sync-user-to-itsts';

  _service_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  PERFORM net.http_post(
    url     := _edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body    := jsonb_build_object(
      'user_id',    NEW.user_id::text,
      'email',      _email,
      'first_name', _first_name,
      'last_name',  _last_name,
      'roles',      _roles,
      'action',     CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'itsts sync trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_to_itsts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_user_to_itsts"() IS 'Async trigger that syncs users to the ITSTS support ticketing system whenever roles change.';



CREATE OR REPLACE FUNCTION "public"."trigger_calculate_lead_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  PERFORM calculate_lead_score_factors(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_calculate_lead_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_admin_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_advisor_access_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_advisor_access_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_advisor_enrollment_links_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_advisor_enrollment_links_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_advisor_plan_resources_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_advisor_plan_resources_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_advisor_portal_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_advisor_portal_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_advisor_videos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_advisor_videos_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_assignments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_assignments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bulletin_notification_status"("p_notification_id" "uuid", "p_status" "text", "p_successful" integer DEFAULT NULL::integer, "p_failed" integer DEFAULT NULL::integer, "p_error_message" "text" DEFAULT NULL::"text", "p_resend_batch_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE bulletin_email_notifications
  SET
    status = p_status,
    successful_sends = COALESCE(p_successful, successful_sends),
    failed_sends = COALESCE(p_failed, failed_sends),
    error_message = COALESCE(p_error_message, error_message),
    resend_batch_id = COALESCE(p_resend_batch_id, resend_batch_id),
    updated_at = NOW()
  WHERE id = p_notification_id;

  -- If completed, update the bulletin record
  IF p_status = 'completed' THEN
    UPDATE advisor_content
    SET
      notification_sent_at = NOW(),
      notification_count = notification_count + 1
    WHERE id = (
      SELECT bulletin_id
      FROM bulletin_email_notifications
      WHERE id = p_notification_id
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_bulletin_notification_status"("p_notification_id" "uuid", "p_status" "text", "p_successful" integer, "p_failed" integer, "p_error_message" "text", "p_resend_batch_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_campaign_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
UPDATE newsletter_campaigns
SET
sent_count = (
SELECT COUNT(*) FROM newsletter_queue
WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'opened', 'clicked')
),
delivered_count = (
SELECT COUNT(*) FROM newsletter_queue
WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'opened', 'clicked')
),
opened_count = (
SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_queue
WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL
),
clicked_count = (
SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_queue
WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL
),
bounced_count = (
SELECT COUNT(*) FROM newsletter_queue
WHERE campaign_id = NEW.campaign_id AND status = 'bounced'
)
WHERE id = NEW.campaign_id;

PERFORM calculate_newsletter_metrics(NEW.campaign_id);
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_campaign_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_campaign_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_campaign_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_campaign_id := OLD.campaign_id;
    ELSE
        v_campaign_id := NEW.campaign_id;
    END IF;

    -- Update campaign response metrics
    UPDATE public.crm_campaigns
    SET
        num_sent = (SELECT COUNT(*) FROM public.crm_campaign_members WHERE campaign_id = v_campaign_id AND status != 'planned'),
        actual_response = (SELECT COUNT(*) FROM public.crm_campaign_members WHERE campaign_id = v_campaign_id AND status IN ('responded', 'converted')),
        updated_at = now()
    WHERE id = v_campaign_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_campaign_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chat_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100),
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_chat_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chat_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_chat_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cognito_forms_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_cognito_forms_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_accounts_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.industry, '') || ' ' ||
        COALESCE(NEW.website, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_accounts_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_contacts_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.first_name, '') || ' ' ||
        COALESCE(NEW.last_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.mobile, '') || ' ' ||
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.department, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_contacts_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_deals_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.next_step, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_deals_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_plan_interest_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_plan_interest_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_products_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.code, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_products_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crm_web_forms_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crm_web_forms_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_email_signature_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_email_signature_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_enrollments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_enrollments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_goal_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Update leads_created goals
  IF TG_TABLE_NAME = 'zoho_lead_submissions' AND TG_OP = 'INSERT' THEN
    UPDATE crm_user_goals
    SET current_value = current_value + 1,
        updated_at = NOW(),
        status = CASE
          WHEN current_value + 1 >= target_value THEN 'completed'
          ELSE status
        END,
        completed_at = CASE
          WHEN current_value + 1 >= target_value THEN NOW()
          ELSE completed_at
        END
    WHERE metric_type = 'leads_created'
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
      AND org_id = NEW.org_id;  -- FIXED: was NEW.organization_id
  END IF;

  -- Update tasks_completed goals
  IF TG_TABLE_NAME = 'lead_tasks' AND TG_OP = 'UPDATE' THEN
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
      UPDATE crm_user_goals
      SET current_value = current_value + 1,
          updated_at = NOW(),
          status = CASE
            WHEN current_value + 1 >= target_value THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN current_value + 1 >= target_value THEN NOW()
            ELSE completed_at
          END
      WHERE metric_type = 'tasks_completed'
        AND status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
        AND user_id = NEW.assigned_to;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_goal_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_handbooks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_handbooks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lead_stage_changed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."update_lead_stage_changed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lead_task_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lead_task_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_mail_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_mail_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meeting_invitation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_meeting_invitation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meeting_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_meeting_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_newsletter_subscribers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_newsletter_subscribers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_onboarding_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_onboarding_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_outlook_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_outlook_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_routing_rules_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_routing_rules_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_schedule_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
        -- Check if this email was from a schedule (would need schedule_id column)
        -- For now, this is a placeholder for future enhancement
        NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_schedule_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_security_webhook_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_security_webhook_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_on_page_view"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE analytics_sessions
  SET 
    page_count = page_count + 1,
    is_bounce = false,
    exit_page = NEW.path,
    ended_at = NEW.created_at,
    duration_seconds = EXTRACT(EPOCH FROM (NEW.created_at - started_at))::integer,
    updated_at = now()
  WHERE session_id = NEW.session_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_session_on_page_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sop_documents_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sop_documents_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_thread_on_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE crm_email_threads
    SET
      message_count = message_count + 1,
      last_message_at = NEW.sent_at,
      last_message_preview = left(NEW.body_preview, 100),
      has_unread = CASE WHEN NEW.direction = 'inbound' THEN true ELSE has_unread END,
      updated_at = now()
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_thread_on_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_presence"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.last_activity_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_presence"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_roles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_roles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_zoho_lead_submission_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_zoho_lead_submission_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_org_access"("check_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_memberships
    WHERE org_id = check_org_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;


ALTER FUNCTION "public"."user_has_org_access"("check_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_org_access"("check_org_id" "uuid") IS 'Checks if current user has active membership in the specified org';



CREATE OR REPLACE FUNCTION "public"."user_has_org_role"("check_org_id" "uuid", "allowed_roles" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_memberships
    WHERE org_id = check_org_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role = ANY(allowed_roles)
  );
$$;


ALTER FUNCTION "public"."user_has_org_role"("check_org_id" "uuid", "allowed_roles" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_org_role"("check_org_id" "uuid", "allowed_roles" "text"[]) IS 'Checks if current user has any of the specified roles in an org';



CREATE OR REPLACE FUNCTION "public"."user_is_org_manager_or_above"("check_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT user_has_org_role(check_org_id, ARRAY['owner', 'admin', 'manager']);
$$;


ALTER FUNCTION "public"."user_is_org_manager_or_above"("check_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_is_org_manager_or_above"("check_org_id" "uuid") IS 'Shorthand: checks if user is manager, admin, or owner in an org';



CREATE OR REPLACE FUNCTION "public"."user_is_org_owner_or_admin"("check_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT user_has_org_role(check_org_id, ARRAY['owner', 'admin']);
$$;


ALTER FUNCTION "public"."user_is_org_owner_or_admin"("check_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_is_org_owner_or_admin"("check_org_id" "uuid") IS 'Shorthand: checks if user is owner or admin in an org';



CREATE OR REPLACE FUNCTION "public"."user_org_role"("p_org_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT om.role
    FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.org_id = p_org_id
      AND om.status = 'active'
    LIMIT 1;
$$;


ALTER FUNCTION "public"."user_org_role"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_organization_roles_delete_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE org_memberships
    SET status = 'left', updated_at = NOW()
    WHERE user_id = OLD.user_id AND org_id = OLD.org_id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."user_organization_roles_delete_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_organization_roles_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO org_memberships (user_id, org_id, role, status)
    VALUES (NEW.user_id, NEW.org_id, NEW.role, 'active')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active',
        updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."user_organization_roles_insert_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_organization_roles_update_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE org_memberships
    SET role = NEW.role, updated_at = NOW()
    WHERE user_id = NEW.user_id AND org_id = NEW.org_id AND status = 'active';
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."user_organization_roles_update_trigger"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "title" "text",
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "user_agent" "text",
    "referrer" "text",
    "country" "text",
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "time_on_page" integer DEFAULT 0,
    "scroll_depth" numeric(5,2) DEFAULT 0,
    "is_entry" boolean DEFAULT false,
    "is_exit" boolean DEFAULT false,
    CONSTRAINT "page_views_device_type_check" CHECK (("device_type" = ANY (ARRAY['desktop'::"text", 'mobile'::"text", 'tablet'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_sessions" WITH ("security_invoker"='on') AS
 SELECT "session_id",
    "max"("created_at") AS "last_activity",
    "count"(*) AS "page_count",
    "max"("device_type") AS "device_type",
    "max"("country") AS "country"
   FROM "public"."page_views"
  WHERE ("created_at" > ("now"() - '00:05:00'::interval))
  GROUP BY "session_id";


ALTER VIEW "public"."active_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "actor_type" "text" DEFAULT 'user'::"text" NOT NULL,
    "activity_type" "public"."activity_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "lead_id" "uuid",
    "contact_id" "uuid",
    "conversation_id" "uuid",
    "task_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_public" boolean DEFAULT true,
    "visible_to" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "category" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "file_path" "text",
    "file_type" character varying(50),
    "file_size_bytes" bigint,
    "external_url" "text",
    "is_public" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "access_roles" "jsonb" DEFAULT '["admin"]'::"jsonb",
    "download_count" integer DEFAULT 0,
    "last_downloaded_at" timestamp with time zone,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "permissions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "avatar_url" "text",
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'manager'::"text", 'staff'::"text"]))),
    CONSTRAINT "admin_users_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "has_advisor_page_access" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."advisor_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "content_html" "text",
    "type" "text" DEFAULT 'info'::"text",
    "start_date" timestamp with time zone DEFAULT "now"(),
    "end_date" timestamp with time zone,
    "is_dismissible" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "target_audience" "text" DEFAULT 'all'::"text",
    "link_url" "text",
    "link_text" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3b82f6'::"text",
    "icon" "text" DEFAULT 'Folder'::"text",
    "type" "text" DEFAULT 'training'::"text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_contact_directory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "title" "text",
    "department" "text",
    "email" "text",
    "phone" "text",
    "extension" "text",
    "avatar_url" "text",
    "bio" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."advisor_contact_directory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "content_type" "text" DEFAULT 'bulletin'::"text" NOT NULL,
    "category_id" "uuid",
    "published_date" timestamp with time zone DEFAULT "now"(),
    "featured_image_url" "text",
    "is_published" boolean DEFAULT true,
    "view_count" integer DEFAULT 0,
    "wordpress_id" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notification_sent_at" timestamp with time zone,
    "notification_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false
);


ALTER TABLE "public"."advisor_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_content_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_content_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_content_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_content_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_content_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_content_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_dashboard_widgets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "widget_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "grid_column" "text" DEFAULT 'full'::"text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_dashboard_widgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_enrollment_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."advisor_enrollment_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_external_training_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "module_id" "uuid",
    "external_course_id" "text",
    "external_lesson_id" "text",
    "lms_provider" "text" DEFAULT 'tutor_lms'::"text" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "external_progress_percent" integer DEFAULT 0,
    "external_score" integer,
    "certificate_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "advisor_external_training_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text", 'verified'::"text"])))
);


ALTER TABLE "public"."advisor_external_training_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_learning_paths" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category_slug" "text",
    "icon" "text" DEFAULT 'BookOpen'::"text",
    "gradient" "text" DEFAULT 'bg-gradient-to-br from-blue-500 to-blue-600'::"text",
    "estimated_hours" numeric(4,1) DEFAULT 1.0,
    "is_required" boolean DEFAULT false,
    "unlock_requirements" "jsonb",
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_learning_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_lesson_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "time_spent_minutes" integer DEFAULT 0,
    "quiz_score" integer,
    "quiz_passed" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "advisor_lesson_completions_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."advisor_lesson_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_lms_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'enrolled'::"text" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "progress_percent" integer DEFAULT 0,
    "lessons_completed" integer DEFAULT 0,
    "total_lessons" integer DEFAULT 0,
    "certificate_earned" boolean DEFAULT false,
    "certificate_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "advisor_lms_enrollments_status_check" CHECK (("status" = ANY (ARRAY['enrolled'::"text", 'in_progress'::"text", 'completed'::"text", 'certified'::"text"])))
);


ALTER TABLE "public"."advisor_lms_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_meeting_attendees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "advisor_id" "uuid",
    "user_id" "uuid",
    "email" "text",
    "name" "text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "left_at" timestamp with time zone,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_meeting_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_meeting_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "reminder_type" "text" NOT NULL,
    "send_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "advisor_meeting_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['email'::"text", 'in_app'::"text"]))),
    CONSTRAINT "advisor_meeting_reminders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."advisor_meeting_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_nav_menu" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "label" "text" NOT NULL,
    "url" "text",
    "icon" "text" DEFAULT 'Link'::"text",
    "parent_id" "uuid",
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_external" boolean DEFAULT false,
    "requires_auth" boolean DEFAULT true,
    "badge_text" "text",
    "badge_color" "text" DEFAULT 'blue'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_nav_menu" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_plan_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_slug" "text" NOT NULL,
    "plan_name" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'FileText'::"text",
    "color" "text" DEFAULT 'blue'::"text",
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "overview_content" "text",
    "pricing_content" "text",
    "handbook_url" "text",
    "handbook_title" "text",
    "flyer_url" "text",
    "flyer_title" "text",
    "qrg_url" "text",
    "qrg_title" "text",
    "state_guidelines" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."advisor_plan_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_portal_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid"
);


ALTER TABLE "public"."advisor_portal_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "specialization" "text" DEFAULT 'general'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "org_id" "uuid",
    "agent_id" "text",
    "company_name" "text",
    "must_change_password" boolean DEFAULT false NOT NULL,
    "avatar_url" "text",
    "user_id" "uuid",
    CONSTRAINT "advisor_profiles_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."advisor_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_quick_links" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "label" "text" NOT NULL,
    "url" "text" NOT NULL,
    "icon" "text" DEFAULT 'Link'::"text",
    "description" "text",
    "order_index" integer DEFAULT 0,
    "is_external" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "requires_auth" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'resources'::"text",
    "image_url" "text",
    "is_popup" boolean DEFAULT false
);


ALTER TABLE "public"."advisor_quick_links" OWNER TO "postgres";


COMMENT ON COLUMN "public"."advisor_quick_links"."category" IS 'Toolkit category: resources, advisor_forms, employer_forms, member_forms, bulletins';



CREATE TABLE IF NOT EXISTS "public"."advisor_terminal_commands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "command_text" "text" NOT NULL,
    "command_intent" "text",
    "tools_called" "jsonb" DEFAULT '[]'::"jsonb",
    "success" boolean DEFAULT false NOT NULL,
    "response_text" "text",
    "execution_time_ms" integer,
    "tokens_used" integer,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_terminal_commands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_terminal_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "total_commands" integer DEFAULT 0,
    "total_tools_executed" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisor_terminal_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_url" "text",
    "duration_minutes" integer DEFAULT 0,
    "order_index" integer DEFAULT 0,
    "is_required" boolean DEFAULT false,
    "prerequisites" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "content_html" "text",
    "thumbnail_url" "text",
    "external_lms_url" "text",
    "external_lms_course_id" "text",
    "external_lms_lesson_id" "text",
    "lms_provider" "text" DEFAULT 'internal'::"text",
    "requires_external_completion" boolean DEFAULT false,
    "external_course_name" "text",
    "org_id" "uuid",
    CONSTRAINT "training_modules_content_type_check" CHECK (("content_type" = ANY (ARRAY['video'::"text", 'document'::"text", 'interactive'::"text", 'quiz'::"text", 'external_link'::"text"]))),
    CONSTRAINT "training_modules_lms_provider_check" CHECK (("lms_provider" = ANY (ARRAY['internal'::"text", 'tutor_lms'::"text", 'external'::"text"])))
);


ALTER TABLE "public"."training_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "time_spent_minutes" integer DEFAULT 0,
    "quiz_score" integer,
    "attempts" integer DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "training_progress_quiz_score_check" CHECK ((("quiz_score" >= 0) AND ("quiz_score" <= 100))),
    CONSTRAINT "training_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."training_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."advisor_training_completion" WITH ("security_invoker"='true') AS
 SELECT "ap"."id" AS "advisor_id",
    "ap"."first_name",
    "ap"."last_name",
    "ap"."email",
    "count"(DISTINCT "tm"."id") FILTER (WHERE ("tm"."is_required" = true)) AS "total_required_modules",
    "count"(DISTINCT "tp"."module_id") FILTER (WHERE (("tp"."status" = 'completed'::"text") AND ("tm"."is_required" = true))) AS "completed_required_modules",
    "count"(DISTINCT "tm"."id") AS "total_modules",
    "count"(DISTINCT "tp"."module_id") FILTER (WHERE ("tp"."status" = 'completed'::"text")) AS "completed_all_modules",
    "round"(((("count"(DISTINCT "tp"."module_id") FILTER (WHERE (("tp"."status" = 'completed'::"text") AND ("tm"."is_required" = true))))::numeric / (NULLIF("count"(DISTINCT "tm"."id") FILTER (WHERE ("tm"."is_required" = true)), 0))::numeric) * (100)::numeric), 2) AS "required_completion_pct",
    "ap"."onboarding_completed"
   FROM (("public"."advisor_profiles" "ap"
     CROSS JOIN "public"."training_modules" "tm")
     LEFT JOIN "public"."training_progress" "tp" ON ((("tp"."advisor_id" = "ap"."id") AND ("tp"."module_id" = "tm"."id"))))
  WHERE ("tm"."is_active" = true)
  GROUP BY "ap"."id", "ap"."first_name", "ap"."last_name", "ap"."email", "ap"."onboarding_completed";


ALTER VIEW "public"."advisor_training_completion" OWNER TO "postgres";


COMMENT ON VIEW "public"."advisor_training_completion" IS 'Provides a summary of training completion rates for all advisors';



CREATE TABLE IF NOT EXISTS "public"."advisor_videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "vimeo_id" "text" NOT NULL,
    "vimeo_hash" "text",
    "thumbnail_url" "text",
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text" DEFAULT 'training'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "duration" "text"
);


ALTER TABLE "public"."advisor_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "text",
    "display_name" "text",
    "city" "text" DEFAULT ''::"text",
    "state" "text",
    "landing_url" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "agent_id" "text",
    "parent_id" "text",
    "parent_label" "text",
    "agent_label" "text",
    "first_name" "text",
    "last_name" "text",
    "company" "text",
    "address_1" "text",
    "address_2" "text",
    "zipcode" "text",
    "county" "text",
    "phone_1" "text",
    "phone_2" "text",
    "email_2" "text",
    "website_link" "text",
    "domain_name" "text",
    "agent_type" "text",
    "agent_type_2" "text",
    "agent_type_3" "text",
    "status" "text",
    "license_states" "text",
    "active_date" "date"
);


ALTER TABLE "public"."advisors" OWNER TO "postgres";


COMMENT ON TABLE "public"."advisors" IS 'Contains MPB Health advisor directory with contact information and landing pages. Updated from MPB Agent Landing Pages CSV file.';



CREATE TABLE IF NOT EXISTS "public"."ai_automation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "trigger_type" "text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "action_type" "text" NOT NULL,
    "action_config" "jsonb" DEFAULT '{}'::"jsonb",
    "delay_minutes" integer DEFAULT 0,
    "execution_count" integer DEFAULT 0,
    "last_executed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_automation_rules_action_type_check" CHECK (("action_type" = ANY (ARRAY['create_task'::"text", 'send_notification'::"text", 'assign_lead'::"text", 'update_priority'::"text", 'send_email'::"text", 'send_slack'::"text"]))),
    CONSTRAINT "ai_automation_rules_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['new_lead'::"text", 'stage_change'::"text", 'no_activity'::"text", 'high_score'::"text", 'task_overdue'::"text", 'scheduled_time'::"text", 'lead_activity'::"text"])))
);


ALTER TABLE "public"."ai_automation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_lead_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "ai_score" integer DEFAULT 0,
    "score_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "conversion_probability" numeric(5,2) DEFAULT 0,
    "engagement_level" "text" DEFAULT 'low'::"text",
    "response_likelihood" "text" DEFAULT 'medium'::"text",
    "recommended_action" "text",
    "recommended_channel" "text",
    "recommended_timing" timestamp with time zone,
    "follow_up_urgency" "text" DEFAULT 'normal'::"text",
    "conversation_summary" "text",
    "key_points" "jsonb" DEFAULT '[]'::"jsonb",
    "objections" "jsonb" DEFAULT '[]'::"jsonb",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "next_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "draft_email_subject" "text",
    "draft_email_body" "text",
    "draft_sms" "text",
    "last_analyzed_at" timestamp with time zone DEFAULT "now"(),
    "analysis_version" "text" DEFAULT '1.0'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_lead_insights_ai_score_check" CHECK ((("ai_score" >= 0) AND ("ai_score" <= 100))),
    CONSTRAINT "ai_lead_insights_engagement_level_check" CHECK (("engagement_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'very_high'::"text"]))),
    CONSTRAINT "ai_lead_insights_follow_up_urgency_check" CHECK (("follow_up_urgency" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "ai_lead_insights_recommended_channel_check" CHECK (("recommended_channel" = ANY (ARRAY['call'::"text", 'email'::"text", 'sms'::"text", 'meeting'::"text"]))),
    CONSTRAINT "ai_lead_insights_response_likelihood_check" CHECK (("response_likelihood" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."ai_lead_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_category" "text",
    "event_label" "text",
    "event_value" numeric,
    "page_path" "text" NOT NULL,
    "page_title" "text",
    "element_id" "text",
    "element_class" "text",
    "element_text" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "analytics_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['click'::"text", 'scroll'::"text", 'form_start'::"text", 'form_submit'::"text", 'form_abandon'::"text", 'video_play'::"text", 'video_complete'::"text", 'download'::"text", 'outbound_link'::"text", 'search'::"text", 'filter'::"text", 'add_to_cart'::"text", 'purchase'::"text", 'signup'::"text", 'cta_click'::"text", 'modal_open'::"text", 'modal_close'::"text", 'tab_switch'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_experiments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "experiment_name" "text" NOT NULL,
    "experiment_description" "text",
    "experiment_type" "text" DEFAULT 'ab_test'::"text",
    "hypothesis" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text",
    "traffic_allocation" numeric(5,2) DEFAULT 50,
    "variants" "jsonb" NOT NULL,
    "success_metric" "text" NOT NULL,
    "baseline_value" numeric(10,4),
    "target_value" numeric(10,4),
    "statistical_significance" numeric(5,2),
    "winner_variant" "text",
    "participants_count" integer DEFAULT 0,
    "conversions_count" integer DEFAULT 0,
    "results_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_experiments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer DEFAULT 0,
    "page_count" integer DEFAULT 1,
    "is_bounce" boolean DEFAULT true,
    "entry_page" "text" NOT NULL,
    "exit_page" "text",
    "referrer" "text",
    "referrer_source" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "country" "text",
    "region" "text",
    "city" "text",
    "is_new_visitor" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "analytics_sessions_device_type_check" CHECK (("device_type" = ANY (ARRAY['desktop'::"text", 'mobile'::"text", 'tablet'::"text", 'unknown'::"text"]))),
    CONSTRAINT "analytics_sessions_referrer_source_check" CHECK (("referrer_source" = ANY (ARRAY['direct'::"text", 'organic'::"text", 'referral'::"text", 'social'::"text", 'email'::"text", 'paid'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."analytics_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approved_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."approved_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "assignee_id" "uuid",
    "due_date" timestamp with time zone,
    "project_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assignments_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."assignments" IS 'Task assignments for the Daily Organizer feature';



CREATE TABLE IF NOT EXISTS "public"."audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "actor_user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "before_json" "jsonb",
    "after_json" "jsonb",
    "meta_json" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_execution_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_id" "uuid",
    "rule_name" "text" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "lead_id" "uuid",
    "status" "text" NOT NULL,
    "result_message" "text",
    "executed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "automation_execution_log_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."automation_execution_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text",
    "trigger_type" "text" NOT NULL,
    "actions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_popular" boolean DEFAULT false,
    "use_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."benefit_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "coverage_id" "uuid" NOT NULL,
    "benefit_category" "text" NOT NULL,
    "year" integer NOT NULL,
    "amount_used" numeric(10,2) DEFAULT 0,
    "amount_limit" numeric(10,2),
    "visits_used" integer DEFAULT 0,
    "visits_limit" integer,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."benefit_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "benefit_key" "text" NOT NULL,
    "icon" "text" DEFAULT 'Heart'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "angle" integer DEFAULT 0,
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text" DEFAULT ''::"text",
    "content" "text" DEFAULT ''::"text",
    "featured_image_url" "text" DEFAULT ''::"text",
    "category" "text" DEFAULT 'Healthcare'::"text",
    "author" "text" DEFAULT 'MPB Health'::"text",
    "published_date" timestamp with time zone DEFAULT "now"(),
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "icon" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_generation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid",
    "prompt_used" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "content_generated" "text",
    "success" boolean DEFAULT false,
    "error_message" "text",
    "generation_time_ms" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_generation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bulletin_email_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bulletin_id" "uuid" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "sent_by" "uuid",
    "total_recipients" integer DEFAULT 0,
    "successful_sends" integer DEFAULT 0,
    "failed_sends" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "resend_batch_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bulletin_email_notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."bulletin_email_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."bulletin_email_notifications" IS 'Tracks bulletin email notification campaigns sent to advisors';



CREATE TABLE IF NOT EXISTS "public"."bulletin_email_recipients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "advisor_id" "uuid",
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "resend_message_id" "text",
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bulletin_email_recipients_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."bulletin_email_recipients" OWNER TO "postgres";


COMMENT ON TABLE "public"."bulletin_email_recipients" IS 'Tracks individual email sends to advisors for bulletin notifications';



CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "text" DEFAULT 'meeting'::"text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false,
    "timezone" "text" DEFAULT 'America/New_York'::"text",
    "location" "text",
    "meeting_link" "text",
    "lead_id" "uuid",
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'scheduled'::"text",
    "reminder_sent" boolean DEFAULT false,
    "reminder_minutes" integer DEFAULT 30,
    "external_calendar_id" "text",
    "external_event_id" "text",
    "last_synced_at" timestamp with time zone,
    "notes" "text",
    "outcome" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "recurrence_rule" "text",
    "recurrence_end" timestamp with time zone,
    "original_event_id" "uuid",
    "color" "text" DEFAULT '#6366F1'::"text",
    "attendees" "jsonb" DEFAULT '[]'::"jsonb",
    "reminders" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "calendar_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['call'::"text", 'meeting'::"text", 'follow_up'::"text", 'demo'::"text", 'other'::"text"]))),
    CONSTRAINT "calendar_events_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "certification_type" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "badge_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "name" "text",
    "description" "text",
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "issuer" "text" DEFAULT 'MPB Health'::"text",
    "credential_id" "text",
    "certificate_url" "text"
);


ALTER TABLE "public"."certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text",
    "slug" "text",
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "is_admin_only_posting" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "last_message_at" timestamp with time zone,
    "last_message_preview" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_conversations_type_check" CHECK (("type" = ANY (ARRAY['direct'::"text", 'group'::"text", 'channel'::"text"])))
);


ALTER TABLE "public"."chat_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone DEFAULT "now"(),
    "is_muted" boolean DEFAULT false,
    CONSTRAINT "chat_members_role_check" CHECK (("role" = ANY (ARRAY['member'::"text", 'admin'::"text", 'owner'::"text"])))
);


ALTER TABLE "public"."chat_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_deleted" boolean DEFAULT false,
    "deleted_by" "uuid",
    "deleted_at" timestamp with time zone,
    "reply_to_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_messages_content_check" CHECK (("length"("content") <= 10000))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claim_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "procedure_code" "text",
    "quantity" integer DEFAULT 1,
    "unit_price" numeric(10,2) NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "eligible_amount" numeric(10,2),
    "approved_amount" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."claim_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "claim_number" "text" NOT NULL,
    "claim_type" "text" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text",
    "provider_name" "text" NOT NULL,
    "provider_id" "uuid",
    "patient_name" "text" NOT NULL,
    "patient_type" "text",
    "dependent_id" "uuid",
    "service_date" "date" NOT NULL,
    "diagnosis_codes" "text"[],
    "total_amount" numeric(10,2) NOT NULL,
    "eligible_amount" numeric(10,2),
    "approved_amount" numeric(10,2),
    "paid_amount" numeric(10,2) DEFAULT 0,
    "denial_reason" "text",
    "processing_notes" "text",
    "submitted_date" timestamp with time zone DEFAULT "now"(),
    "reviewed_date" timestamp with time zone,
    "approved_date" timestamp with time zone,
    "paid_date" timestamp with time zone,
    "reviewed_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "claims_claim_type_check" CHECK (("claim_type" = ANY (ARRAY['medical'::"text", 'dental'::"text", 'vision'::"text", 'prescription'::"text", 'other'::"text"]))),
    CONSTRAINT "claims_patient_type_check" CHECK (("patient_type" = ANY (ARRAY['member'::"text", 'dependent'::"text"]))),
    CONSTRAINT "claims_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'under_review'::"text", 'pending_info'::"text", 'approved'::"text", 'partially_approved'::"text", 'denied'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."code_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(255) NOT NULL,
    "code_type" character varying(50) NOT NULL,
    "prefix" character varying(20),
    "total_codes" integer NOT NULL,
    "codes_used" integer DEFAULT 0,
    "value_per_code" numeric(10,2),
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."code_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."code_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "code_type" character varying(50) NOT NULL,
    "code" character varying(100) NOT NULL,
    "batch_id" "uuid",
    "status" character varying(20) DEFAULT 'available'::character varying,
    "value" numeric(10,2),
    "assigned_to_user" "uuid",
    "assigned_to_member" "uuid",
    "assigned_at" timestamp with time zone,
    "used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."code_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cognito_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'FileText'::"text",
    "estimated_minutes" integer DEFAULT 5,
    "cognito_embed" "text",
    "is_active" boolean DEFAULT true,
    "requires_auth" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "show_in_menu" boolean DEFAULT false,
    "menu_section" "text" DEFAULT 'member-forms'::"text",
    "menu_order" integer DEFAULT 99,
    CONSTRAINT "cognito_forms_category_check" CHECK (("category" = ANY (ARRAY['employer'::"text", 'member'::"text", 'advisor'::"text"])))
);


ALTER TABLE "public"."cognito_forms" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cognito_forms"."show_in_menu" IS 'Whether this form appears in the navigation mega menu';



COMMENT ON COLUMN "public"."cognito_forms"."menu_section" IS 'Which section of the mega menu to display in: member-forms, requests-scheduling, onboarding, employer-forms';



COMMENT ON COLUMN "public"."cognito_forms"."menu_order" IS 'Order within the menu section';



CREATE TABLE IF NOT EXISTS "public"."compliance_acknowledgments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "acknowledged_at" timestamp with time zone,
    "due_date" "date",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "compliance_acknowledgments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'acknowledged'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."compliance_acknowledgments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "document_type" "text" NOT NULL,
    "content" "text",
    "file_url" "text",
    "version" "text" DEFAULT '1.0'::"text",
    "is_required" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "due_date" "date",
    "org_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."compliance_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "avg_time_on_page" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "scroll_depth_avg" numeric(5,2) DEFAULT 0,
    "cta_clicks" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "engagement_score" numeric(10,2) DEFAULT 0,
    "traffic_sources" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "lead_id" "uuid",
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "channel" "text" DEFAULT 'email'::"text",
    "subject" "text",
    "last_message_at" timestamp with time zone,
    "message_count" integer DEFAULT 0,
    "unread_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversion_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_name" "text" NOT NULL,
    "event_display_name" "text" NOT NULL,
    "event_category" "text" NOT NULL,
    "event_description" "text",
    "is_active" boolean DEFAULT true,
    "track_value" boolean DEFAULT false,
    "track_currency" boolean DEFAULT false,
    "platform_mappings" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_properties" "jsonb" DEFAULT '{}'::"jsonb",
    "funnel_step" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversion_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wordpress_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wp_course_id" integer NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "summary_bullets" "text"[] DEFAULT ARRAY[]::"text"[],
    "category" "text",
    "level" "text" DEFAULT 'all_levels'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "language" "text" DEFAULT 'en'::"text",
    "is_password_protected" boolean DEFAULT false,
    "password" "text",
    "password_hint" "text",
    "thumbnail_url" "text",
    "duration_minutes" integer DEFAULT 0,
    "completions_count" integer DEFAULT 0,
    "start_timestamp" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    CONSTRAINT "wordpress_courses_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'pt-BR'::"text", 'es'::"text"]))),
    CONSTRAINT "wordpress_courses_status_check" CHECK (("status" = ANY (ARRAY['publish'::"text", 'draft'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."wordpress_courses" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."course_catalog" WITH ("security_invoker"='true') AS
 SELECT "id",
    "wp_course_id",
    "slug",
    "title",
    "description",
    "summary_bullets",
    "category",
    "level",
    "status",
    "language",
    "is_password_protected",
    "password_hint",
    "thumbnail_url",
    "duration_minutes",
    "completions_count",
        CASE
            WHEN ("level" = 'beginner'::"text") THEN 1
            WHEN ("level" = 'intermediate'::"text") THEN 2
            WHEN ("level" = 'advanced'::"text") THEN 3
            ELSE 0
        END AS "level_order",
    "created_at",
    "updated_at"
   FROM "public"."wordpress_courses"
  WHERE (("is_active" = true) AND ("status" = 'publish'::"text"))
  ORDER BY "completions_count" DESC, "created_at" DESC;


ALTER VIEW "public"."course_catalog" OWNER TO "postgres";


COMMENT ON VIEW "public"."course_catalog" IS 'Public course catalog with active, published courses sorted by popularity';



CREATE TABLE IF NOT EXISTS "public"."coverage_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coverage_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "effective_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coverage_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['certificate'::"text", 'summary'::"text", 'guidelines'::"text", 'id_card'::"text", 'amendment'::"text"])))
);


ALTER TABLE "public"."coverage_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "scheduled_at" timestamp with time zone,
    "due_at" timestamp with time zone,
    "duration_minutes" integer,
    "completed_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "call_type" "text",
    "call_outcome" "text",
    "call_duration_seconds" integer,
    "email_status" "text",
    "location" "text",
    "meeting_link" "text",
    "account_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "lead_id" "uuid",
    "related_to_type" "text",
    "related_to_id" "uuid",
    "owner_id" "uuid",
    "assigned_to" "uuid",
    "reminder_at" timestamp with time zone,
    "reminder_sent" boolean DEFAULT false,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['call'::"text", 'email'::"text", 'meeting'::"text", 'task'::"text", 'note'::"text", 'sms'::"text", 'social'::"text", 'webinar'::"text", 'demo'::"text", 'other'::"text"]))),
    CONSTRAINT "crm_activities_call_outcome_check" CHECK (("call_outcome" = ANY (ARRAY['answered'::"text", 'no_answer'::"text", 'busy'::"text", 'voicemail'::"text", 'wrong_number'::"text", 'callback_requested'::"text"]))),
    CONSTRAINT "crm_activities_call_type_check" CHECK (("call_type" = ANY (ARRAY['outbound'::"text", 'inbound'::"text", 'missed'::"text"]))),
    CONSTRAINT "crm_activities_email_status_check" CHECK (("email_status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'delivered'::"text", 'opened'::"text", 'clicked'::"text", 'bounced'::"text", 'unsubscribed'::"text"]))),
    CONSTRAINT "crm_activities_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "crm_activities_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'deferred'::"text"])))
);


ALTER TABLE "public"."crm_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_approval_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "approver_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "comments" "text",
    "acted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_approval_actions_action_check" CHECK (("action" = ANY (ARRAY['approved'::"text", 'rejected'::"text", 'delegated'::"text"])))
);


ALTER TABLE "public"."crm_approval_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_approval_processes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "entity_type" "text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_approval_processes_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['deal'::"text", 'quote'::"text", 'invoice'::"text", 'discount'::"text"])))
);


ALTER TABLE "public"."crm_approval_processes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_approval_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "current_step" integer DEFAULT 1 NOT NULL,
    "notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "crm_approval_requests_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['deal'::"text", 'quote'::"text", 'invoice'::"text", 'discount'::"text"]))),
    CONSTRAINT "crm_approval_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'recalled'::"text"])))
);


ALTER TABLE "public"."crm_approval_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_approval_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "process_id" "uuid" NOT NULL,
    "step_order" integer DEFAULT 1 NOT NULL,
    "approver_type" "text" NOT NULL,
    "approver_id" "uuid",
    "role_name" "text",
    "action_on_reject" "text" DEFAULT 'reject'::"text" NOT NULL,
    "auto_approve_after_hours" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_approval_steps_action_on_reject_check" CHECK (("action_on_reject" = ANY (ARRAY['reject'::"text", 'go_back'::"text", 'notify'::"text"]))),
    CONSTRAINT "crm_approval_steps_approver_type_check" CHECK (("approver_type" = ANY (ARRAY['user'::"text", 'role'::"text", 'manager'::"text"])))
);


ALTER TABLE "public"."crm_approval_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_calendar_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "access_token_encrypted" "text",
    "refresh_token_encrypted" "text",
    "token_expires_at" timestamp with time zone,
    "calendar_id" "text",
    "sync_enabled" boolean DEFAULT true,
    "last_sync_at" timestamp with time zone,
    "sync_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_calendar_integrations_provider_check" CHECK (("provider" = ANY (ARRAY['google'::"text", 'outlook'::"text", 'apple'::"text"])))
);


ALTER TABLE "public"."crm_calendar_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_campaign_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "lead_id" "uuid",
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "first_responded_at" timestamp with time zone,
    "converted_at" timestamp with time zone,
    "notes" "text",
    "added_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_member_target" CHECK (((("contact_id" IS NOT NULL) AND ("lead_id" IS NULL)) OR (("contact_id" IS NULL) AND ("lead_id" IS NOT NULL)))),
    CONSTRAINT "crm_campaign_members_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'sent'::"text", 'opened'::"text", 'clicked'::"text", 'responded'::"text", 'converted'::"text", 'unsubscribed'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."crm_campaign_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'other'::"text" NOT NULL,
    "status" "text" DEFAULT 'planning'::"text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "budget" numeric(15,2),
    "actual_cost" numeric(15,2) DEFAULT 0,
    "expected_revenue" numeric(15,2),
    "actual_revenue" numeric(15,2) DEFAULT 0,
    "num_sent" integer DEFAULT 0,
    "expected_response" integer,
    "actual_response" integer DEFAULT 0,
    "leads_generated" integer DEFAULT 0,
    "deals_generated" integer DEFAULT 0,
    "deals_won" integer DEFAULT 0,
    "parent_campaign_id" "uuid",
    "owner_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_campaigns_status_check" CHECK (("status" = ANY (ARRAY['planning'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text", 'paused'::"text"]))),
    CONSTRAINT "crm_campaigns_type_check" CHECK (("type" = ANY (ARRAY['email'::"text", 'webinar'::"text", 'conference'::"text", 'advertisement'::"text", 'referral'::"text", 'social'::"text", 'banner_ads'::"text", 'direct_mail'::"text", 'telemarketing'::"text", 'partners'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."crm_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_case_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "author_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_case_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "case_number" "text" DEFAULT ''::"text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "status" "public"."case_status" DEFAULT 'new'::"public"."case_status" NOT NULL,
    "priority" "public"."case_priority" DEFAULT 'medium'::"public"."case_priority" NOT NULL,
    "origin" "public"."case_origin" DEFAULT 'web'::"public"."case_origin",
    "category" "text",
    "subcategory" "text",
    "account_id" "uuid",
    "contact_id" "uuid",
    "owner_id" "uuid",
    "assigned_to" "uuid",
    "resolution" "text",
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "first_response_at" timestamp with time zone,
    "escalated_at" timestamp with time zone,
    "escalated_to" "uuid",
    "due_date" timestamp with time zone,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_dashboard_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Default'::"text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "widgets" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "grid_columns" integer DEFAULT 12,
    "row_height" integer DEFAULT 100,
    "theme" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_dashboard_layouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_dashboard_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "color" "text" DEFAULT 'default'::"text",
    "linked_entity_type" "text",
    "linked_entity_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_dashboard_notes_color_check" CHECK (("color" = ANY (ARRAY['default'::"text", 'yellow'::"text", 'green'::"text", 'blue'::"text", 'purple'::"text", 'red'::"text", 'orange'::"text"])))
);


ALTER TABLE "public"."crm_dashboard_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_deal_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "role" "text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_deal_contacts_role_check" CHECK (("role" = ANY (ARRAY['decision_maker'::"text", 'influencer'::"text", 'technical_buyer'::"text", 'economic_buyer'::"text", 'champion'::"text", 'blocker'::"text", 'user'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."crm_deal_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_deal_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1,
    "unit_price" numeric(15,2),
    "discount_percent" numeric(5,2) DEFAULT 0,
    "total" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_deal_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_deal_stage_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "from_stage_id" "uuid",
    "to_stage_id" "uuid" NOT NULL,
    "changed_by" "uuid",
    "notes" "text",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_deal_stage_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_deal_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text",
    "icon" "text",
    "probability" integer DEFAULT 0,
    "sort_order" integer NOT NULL,
    "is_won_stage" boolean DEFAULT false,
    "is_lost_stage" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_deal_stages_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100)))
);


ALTER TABLE "public"."crm_deal_stages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."crm_deal_stage_metrics" WITH ("security_invoker"='true') AS
 WITH "stage_durations" AS (
         SELECT "h"."deal_id",
            "h"."to_stage_id",
            (EXTRACT(epoch FROM ("lead"("h"."changed_at") OVER (PARTITION BY "h"."deal_id" ORDER BY "h"."changed_at") - "h"."changed_at")) / 86400.0) AS "days_in_stage"
           FROM "public"."crm_deal_stage_history" "h"
        )
 SELECT "d"."org_id",
    "s"."id" AS "stage_id",
    "s"."name" AS "stage_name",
    "s"."display_name" AS "stage_display_name",
    "s"."sort_order",
    "s"."is_won_stage",
    "s"."is_lost_stage",
    "count"(DISTINCT "d"."id") AS "total_deals",
    "count"(DISTINCT "d"."id") FILTER (WHERE ("d"."won_at" IS NOT NULL)) AS "won_deals",
    "count"(DISTINCT "d"."id") FILTER (WHERE ("d"."lost_at" IS NOT NULL)) AS "lost_deals",
        CASE
            WHEN ("count"(DISTINCT "d"."id") FILTER (WHERE (("d"."won_at" IS NOT NULL) OR ("d"."lost_at" IS NOT NULL))) > 0) THEN "round"(((("count"(DISTINCT "d"."id") FILTER (WHERE ("d"."won_at" IS NOT NULL)))::numeric / ("count"(DISTINCT "d"."id") FILTER (WHERE (("d"."won_at" IS NOT NULL) OR ("d"."lost_at" IS NOT NULL))))::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS "win_rate",
    COALESCE("round"("avg"("d"."amount") FILTER (WHERE ("d"."amount" IS NOT NULL)), 2), (0)::numeric) AS "avg_deal_size",
    COALESCE("round"("avg"("sd"."days_in_stage") FILTER (WHERE ("sd"."days_in_stage" IS NOT NULL)), 1), (0)::numeric) AS "avg_days_in_stage"
   FROM (("public"."crm_deal_stages" "s"
     LEFT JOIN "public"."crm_deals" "d" ON (("d"."stage_id" = "s"."id")))
     LEFT JOIN "stage_durations" "sd" ON ((("sd"."deal_id" = "d"."id") AND ("sd"."to_stage_id" = "s"."id"))))
  WHERE ("s"."is_active" = true)
  GROUP BY "d"."org_id", "s"."id", "s"."name", "s"."display_name", "s"."sort_order", "s"."is_won_stage", "s"."is_lost_stage"
  ORDER BY "s"."sort_order";


ALTER VIEW "public"."crm_deal_stage_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_default_layout_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" "text" DEFAULT 'Standard'::"text" NOT NULL,
    "description" "text",
    "widgets" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "grid_columns" integer DEFAULT 12,
    "row_height" integer DEFAULT 100,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_default_layout_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint DEFAULT 0 NOT NULL,
    "mime_type" "text" DEFAULT 'application/octet-stream'::"text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "folder" "text",
    "is_public" boolean DEFAULT false,
    "uploaded_by" "uuid" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_documents_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'contract'::"text", 'proposal'::"text", 'invoice'::"text", 'report'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."crm_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_id" "uuid",
    "draft_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "storage_bucket" "text" DEFAULT 'email-attachments'::"text",
    "storage_path" "text" NOT NULL,
    "public_url" "text",
    "checksum" "text",
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_email_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "to_addresses" "text"[] DEFAULT '{}'::"text"[],
    "cc_addresses" "text"[] DEFAULT '{}'::"text"[],
    "bcc_addresses" "text"[] DEFAULT '{}'::"text"[],
    "lead_id" "uuid",
    "contact_id" "uuid",
    "account_id" "uuid",
    "subject" "text",
    "body_html" "text",
    "body_plain" "text",
    "template_id" "uuid",
    "signature_id" "uuid",
    "include_signature" boolean DEFAULT true,
    "reply_to_email_id" "uuid",
    "forward_from_email_id" "uuid",
    "thread_id" "uuid",
    "scheduled_send_at" timestamp with time zone,
    "last_edited_at" timestamp with time zone DEFAULT "now"(),
    "auto_saved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_email_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "lead_id" "uuid",
    "template_id" "uuid",
    "to_email" "text" NOT NULL,
    "subject" "text",
    "body_preview" "text",
    "status" "text" DEFAULT 'sent'::"text",
    "resend_email_id" "text",
    "sent_by" "uuid",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tracking_id" "uuid" DEFAULT "gen_random_uuid"(),
    "open_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "first_opened_at" timestamp with time zone,
    "last_opened_at" timestamp with time zone,
    "thread_id" "uuid",
    "direction" "text" DEFAULT 'outbound'::"text",
    "from_address" "text",
    "from_name" "text",
    "to_addresses" "text"[] DEFAULT '{}'::"text"[],
    "cc_addresses" "text"[] DEFAULT '{}'::"text"[],
    "bcc_addresses" "text"[] DEFAULT '{}'::"text"[],
    "body_html" "text",
    "signature_id" "uuid",
    "reply_to_id" "uuid",
    "has_attachments" boolean DEFAULT false,
    "attachment_count" integer DEFAULT 0,
    "is_read" boolean DEFAULT true,
    "is_starred" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "labels" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "message_id" "text",
    "in_reply_to" "text",
    "references_header" "text",
    "inbound_address" "text",
    CONSTRAINT "crm_email_log_direction_check" CHECK (("direction" = ANY (ARRAY['inbound'::"text", 'outbound'::"text"]))),
    CONSTRAINT "crm_email_log_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'failed'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."crm_email_log" OWNER TO "postgres";


COMMENT ON COLUMN "public"."crm_email_log"."message_id" IS 'RFC 2822 Message-ID header for thread matching';



COMMENT ON COLUMN "public"."crm_email_log"."in_reply_to" IS 'RFC 2822 In-Reply-To header linking to parent message';



COMMENT ON COLUMN "public"."crm_email_log"."references_header" IS 'RFC 2822 References header for full thread chain';



COMMENT ON COLUMN "public"."crm_email_log"."inbound_address" IS 'The address that received the inbound email';



CREATE TABLE IF NOT EXISTS "public"."crm_email_routing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "inbound_address" "text" NOT NULL,
    "action" "text" DEFAULT 'assign'::"text" NOT NULL,
    "action_config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_email_routing_rules_action_check" CHECK (("action" = ANY (ARRAY['assign'::"text", 'label'::"text", 'forward'::"text"])))
);


ALTER TABLE "public"."crm_email_routing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_sequence_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sequence_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "contact_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "current_step" integer DEFAULT 1,
    "next_action_at" timestamp with time zone,
    "enrolled_by" "uuid",
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "crm_email_sequence_enrollments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text", 'replied'::"text", 'bounced'::"text", 'unsubscribed'::"text", 'manually_removed'::"text"])))
);


ALTER TABLE "public"."crm_email_sequence_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_sequence_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sequence_id" "uuid" NOT NULL,
    "step_number" integer NOT NULL,
    "step_type" "text" DEFAULT 'email'::"text",
    "template_id" "uuid",
    "subject_override" "text",
    "body_override" "text",
    "delay_days" integer DEFAULT 1,
    "delay_hours" integer DEFAULT 0,
    "condition_config" "jsonb",
    "task_config" "jsonb",
    "is_active" boolean DEFAULT true,
    "total_sent" integer DEFAULT 0,
    "total_opened" integer DEFAULT 0,
    "total_clicked" integer DEFAULT 0,
    "total_replied" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_email_sequence_steps_step_type_check" CHECK (("step_type" = ANY (ARRAY['email'::"text", 'wait'::"text", 'condition'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."crm_email_sequence_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_sequences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "trigger_type" "text" DEFAULT 'manual'::"text",
    "trigger_config" "jsonb" DEFAULT '{}'::"jsonb",
    "exit_conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "total_enrolled" integer DEFAULT 0,
    "total_completed" integer DEFAULT 0,
    "total_replied" integer DEFAULT 0,
    "total_bounced" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_email_sequences_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text", 'archived'::"text"]))),
    CONSTRAINT "crm_email_sequences_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['manual'::"text", 'lead_created'::"text", 'stage_change'::"text", 'tag_added'::"text"])))
);


ALTER TABLE "public"."crm_email_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "logo_url" "text",
    "logo_storage_path" "text",
    "banner_url" "text",
    "banner_storage_path" "text",
    "social_links" "jsonb" DEFAULT '[]'::"jsonb",
    "font_family" "text" DEFAULT 'Arial, sans-serif'::"text",
    "primary_color" "text" DEFAULT '#6366F1'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_email_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "lead_id" "uuid",
    "contact_id" "uuid",
    "account_id" "uuid",
    "deal_id" "uuid",
    "participants" "text"[] DEFAULT '{}'::"text"[],
    "message_count" integer DEFAULT 0,
    "last_message_at" timestamp with time zone,
    "last_message_preview" "text",
    "has_unread" boolean DEFAULT false,
    "labels" "text"[] DEFAULT '{}'::"text"[],
    "is_starred" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_email_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_email_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_log_id" "uuid" NOT NULL,
    "tracking_type" "text" NOT NULL,
    "link_url" "text",
    "ip_address" "text",
    "user_agent" "text",
    "device_type" "text",
    "location_country" "text",
    "location_city" "text",
    "tracked_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_email_tracking_device_type_check" CHECK (("device_type" = ANY (ARRAY['desktop'::"text", 'mobile'::"text", 'tablet'::"text"]))),
    CONSTRAINT "crm_email_tracking_tracking_type_check" CHECK (("tracking_type" = ANY (ARRAY['open'::"text", 'click'::"text"])))
);


ALTER TABLE "public"."crm_email_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_forecast_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "forecast_id" "uuid" NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "probability" integer DEFAULT 0 NOT NULL,
    "weighted_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "forecast_category" "public"."forecast_category" DEFAULT 'pipeline'::"public"."forecast_category" NOT NULL,
    "stage" "text",
    "close_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_forecast_entries_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100)))
);


ALTER TABLE "public"."crm_forecast_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_forecasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "forecast_type" "public"."forecast_type" DEFAULT 'monthly'::"public"."forecast_type" NOT NULL,
    "status" "public"."forecast_status" DEFAULT 'draft'::"public"."forecast_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_forecasts_period_check" CHECK (("period_end" > "period_start"))
);


ALTER TABLE "public"."crm_forecasts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."crm_health_quote_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."crm_health_quote_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_invoice_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "line_total" numeric(15,2) NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_invoice_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_invoice_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "payment_method" "text",
    "reference_number" "text",
    "notes" "text",
    "recorded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_invoice_payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'check'::"text", 'credit_card'::"text", 'bank_transfer'::"text", 'paypal'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."crm_invoice_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "deal_id" "uuid",
    "account_id" "uuid",
    "contact_id" "uuid",
    "quote_id" "uuid",
    "subject" "text",
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "invoice_date" "date" DEFAULT CURRENT_DATE,
    "due_date" "date",
    "paid_date" "date",
    "payment_terms" "text",
    "subtotal" numeric(15,2) DEFAULT 0,
    "discount_type" "text" DEFAULT 'percent'::"text",
    "discount_value" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "shipping_amount" numeric(15,2) DEFAULT 0,
    "adjustment" numeric(15,2) DEFAULT 0,
    "total" numeric(15,2) DEFAULT 0,
    "amount_paid" numeric(15,2) DEFAULT 0,
    "balance_due" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "terms_and_conditions" "text",
    "notes" "text",
    "billing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_address" "jsonb" DEFAULT '{}'::"jsonb",
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "owner_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approval_status" "text" DEFAULT 'not_required'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    CONSTRAINT "crm_invoices_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['not_required'::"text", 'pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "crm_invoices_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percent'::"text", 'amount'::"text"]))),
    CONSTRAINT "crm_invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'viewed'::"text", 'paid'::"text", 'partial'::"text", 'overdue'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."crm_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_lead_health_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "quote_number" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "household_type" "text" NOT NULL,
    "member_count" integer DEFAULT 1,
    "primary_age" integer NOT NULL,
    "spouse_age" integer,
    "dependent_ages" integer[],
    "state" "text",
    "zip_code" "text",
    "tobacco_user" boolean DEFAULT false,
    "quote_lines" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_monthly" numeric(10,2),
    "total_annual" numeric(10,2),
    "valid_from" "date" DEFAULT CURRENT_DATE,
    "valid_until" "date" DEFAULT (CURRENT_DATE + '30 days'::interval),
    "source" "text" DEFAULT 'crm'::"text",
    "website_submission_id" "uuid",
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "declined_at" timestamp with time zone,
    "decline_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "crm_lead_health_quotes_household_type_check" CHECK (("household_type" = ANY (ARRAY['individual'::"text", 'couple'::"text", 'family'::"text", 'parent_child'::"text"]))),
    CONSTRAINT "crm_lead_health_quotes_source_check" CHECK (("source" = ANY (ARRAY['crm'::"text", 'website'::"text", 'api'::"text", 'import'::"text"]))),
    CONSTRAINT "crm_lead_health_quotes_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'viewed'::"text", 'accepted'::"text", 'expired'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."crm_lead_health_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_lead_plan_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "plan_name" "text" NOT NULL,
    "plan_code" "text",
    "family_size" "text" DEFAULT 'MO'::"text" NOT NULL,
    "interest_level" "text" DEFAULT 'interested'::"text",
    "quoted_monthly_rate" numeric(10,2),
    "quoted_at" timestamp with time zone,
    "quote_valid_until" timestamp with time zone,
    "primary_age" integer,
    "spouse_age" integer,
    "dependent_ages" integer[],
    "source" "text" DEFAULT 'manual'::"text",
    "source_quote_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "crm_lead_plan_interests_interest_level_check" CHECK (("interest_level" = ANY (ARRAY['interested'::"text", 'quoted'::"text", 'applied'::"text", 'enrolled'::"text", 'declined'::"text"]))),
    CONSTRAINT "crm_lead_plan_interests_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'website_quote'::"text", 'agent_quote'::"text", 'imported'::"text"])))
);


ALTER TABLE "public"."crm_lead_plan_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_meeting_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "contact_id" "uuid",
    "booker_name" "text" NOT NULL,
    "booker_email" "text" NOT NULL,
    "booker_phone" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text",
    "calendar_event_id" "uuid",
    "notes" "text",
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_meeting_bookings_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'cancelled'::"text", 'completed'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."crm_meeting_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_meeting_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer DEFAULT 30,
    "buffer_minutes" integer DEFAULT 0,
    "slug" "text" NOT NULL,
    "available_hours" "jsonb" DEFAULT '{}'::"jsonb",
    "booking_window_days" integer DEFAULT 30,
    "confirmation_template_id" "uuid",
    "reminder_template_id" "uuid",
    "is_active" boolean DEFAULT true,
    "location_type" "text" DEFAULT 'video'::"text",
    "location_config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_meeting_schedules_location_type_check" CHECK (("location_type" = ANY (ARRAY['video'::"text", 'phone'::"text", 'in_person'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."crm_meeting_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_pipeline_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "color" "text" DEFAULT '#6B7280'::"text",
    "icon" "text",
    "sort_order" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_won_stage" boolean DEFAULT false,
    "is_lost_stage" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    "slug" "text",
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."crm_pipeline_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_price_book_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "price_book_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "list_price" numeric(15,2) NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_price_book_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_price_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "valid_from" "date",
    "valid_to" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_price_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "description" "text",
    "unit_price" numeric(15,2) DEFAULT 0 NOT NULL,
    "cost_price" numeric(15,2),
    "tax_rate" numeric(5,2) DEFAULT 0,
    "category" "text",
    "product_family" "text",
    "unit" "text" DEFAULT 'each'::"text",
    "is_active" boolean DEFAULT true,
    "qty_in_stock" integer,
    "reorder_level" integer,
    "vendor_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector"
);


ALTER TABLE "public"."crm_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_purchase_order_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "sku" "text",
    "quantity" numeric(15,2) DEFAULT 1 NOT NULL,
    "quantity_received" numeric(15,2) DEFAULT 0,
    "unit" "text" DEFAULT 'each'::"text",
    "unit_cost" numeric(15,2) DEFAULT 0 NOT NULL,
    "discount_percent" numeric(5,2),
    "discount_amount" numeric(15,2),
    "tax_rate" numeric(5,2),
    "subtotal" numeric(15,2) DEFAULT 0,
    "total" numeric(15,2) DEFAULT 0,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_purchase_order_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "po_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "vendor_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "approval_status" "text" DEFAULT 'not_required'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "subtotal" numeric(15,2) DEFAULT 0,
    "discount_percent" numeric(5,2),
    "discount_amount" numeric(15,2),
    "tax_amount" numeric(15,2) DEFAULT 0,
    "shipping_amount" numeric(15,2) DEFAULT 0,
    "total" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "order_date" "date",
    "expected_date" "date",
    "received_date" "date",
    "ship_to_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_method" "text",
    "tracking_number" "text",
    "payment_terms" "text",
    "terms_and_conditions" "text",
    "notes" "text",
    "owner_id" "uuid",
    "sent_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_purchase_orders_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['not_required'::"text", 'pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "crm_purchase_orders_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_approval'::"text", 'approved'::"text", 'sent'::"text", 'acknowledged'::"text", 'partially_received'::"text", 'received'::"text", 'cancelled'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."crm_purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_quote_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "line_total" numeric(15,2) NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_quote_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "quote_number" "text" NOT NULL,
    "deal_id" "uuid",
    "account_id" "uuid",
    "contact_id" "uuid",
    "subject" "text",
    "description" "text",
    "valid_until" "date",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0,
    "discount_type" "text" DEFAULT 'percent'::"text",
    "discount_value" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "shipping_amount" numeric(15,2) DEFAULT 0,
    "adjustment" numeric(15,2) DEFAULT 0,
    "total" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "terms_and_conditions" "text",
    "notes" "text",
    "billing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_address" "jsonb" DEFAULT '{}'::"jsonb",
    "sent_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "owner_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approval_status" "text" DEFAULT 'not_required'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    CONSTRAINT "crm_quotes_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['not_required'::"text", 'pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "crm_quotes_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percent'::"text", 'amount'::"text"]))),
    CONSTRAINT "crm_quotes_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_approval'::"text", 'sent'::"text", 'accepted'::"text", 'rejected'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."crm_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_sales_order_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "sku" "text",
    "quantity" numeric(15,2) DEFAULT 1 NOT NULL,
    "quantity_shipped" numeric(15,2) DEFAULT 0,
    "quantity_delivered" numeric(15,2) DEFAULT 0,
    "unit" "text" DEFAULT 'each'::"text",
    "unit_price" numeric(15,2) DEFAULT 0 NOT NULL,
    "discount_percent" numeric(5,2),
    "discount_amount" numeric(15,2),
    "tax_rate" numeric(5,2),
    "subtotal" numeric(15,2) DEFAULT 0,
    "total" numeric(15,2) DEFAULT 0,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_sales_order_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_sales_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "so_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "account_id" "uuid",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "quote_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text",
    "approval_status" "text" DEFAULT 'not_required'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "subtotal" numeric(15,2) DEFAULT 0,
    "discount_percent" numeric(5,2),
    "discount_amount" numeric(15,2),
    "tax_amount" numeric(15,2) DEFAULT 0,
    "shipping_amount" numeric(15,2) DEFAULT 0,
    "total" numeric(15,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "order_date" "date",
    "requested_date" "date",
    "promised_date" "date",
    "shipped_date" "date",
    "delivered_date" "date",
    "billing_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_address" "jsonb" DEFAULT '{}'::"jsonb",
    "shipping_method" "text",
    "tracking_number" "text",
    "carrier" "text",
    "payment_terms" "text",
    "terms_and_conditions" "text",
    "notes" "text",
    "owner_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_sales_orders_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['not_required'::"text", 'pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "crm_sales_orders_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_approval'::"text", 'approved'::"text", 'confirmed'::"text", 'processing'::"text", 'shipped'::"text", 'partially_delivered'::"text", 'delivered'::"text", 'cancelled'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."crm_sales_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_saved_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "name" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sort_field" "text",
    "sort_direction" "text" DEFAULT 'desc'::"text",
    "columns" "jsonb",
    "is_default" boolean DEFAULT false,
    "is_shared" boolean DEFAULT false,
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_saved_views_sort_direction_check" CHECK (("sort_direction" = ANY (ARRAY['asc'::"text", 'desc'::"text"])))
);


ALTER TABLE "public"."crm_saved_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_studio_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "api_name" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "is_unique" boolean DEFAULT false,
    "is_searchable" boolean DEFAULT true,
    "is_filterable" boolean DEFAULT true,
    "default_value" "text",
    "help_text" "text",
    "placeholder" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "sort_order" integer DEFAULT 0,
    "is_system" boolean DEFAULT false,
    "is_name_field" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_studio_fields_field_type_check" CHECK (("field_type" = ANY (ARRAY['text'::"text", 'textarea'::"text", 'number'::"text", 'decimal'::"text", 'currency'::"text", 'percent'::"text", 'email'::"text", 'phone'::"text", 'url'::"text", 'date'::"text", 'datetime'::"text", 'checkbox'::"text", 'picklist'::"text", 'multi_picklist'::"text", 'lookup'::"text", 'multi_lookup'::"text", 'formula'::"text", 'auto_number'::"text"])))
);


ALTER TABLE "public"."crm_studio_fields" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_studio_fields" IS 'Custom field definitions for Studio modules';



CREATE TABLE IF NOT EXISTS "public"."crm_studio_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "api_name" "text" NOT NULL,
    "layout_type" "text" NOT NULL,
    "sections" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_studio_layouts_layout_type_check" CHECK (("layout_type" = ANY (ARRAY['create'::"text", 'edit'::"text", 'view'::"text", 'quick_create'::"text"])))
);


ALTER TABLE "public"."crm_studio_layouts" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_studio_layouts" IS 'Form layout configurations for Studio modules';



CREATE TABLE IF NOT EXISTS "public"."crm_studio_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "api_name" "text" NOT NULL,
    "plural_name" "text" NOT NULL,
    "singular_name" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'FileText'::"text",
    "color" "text" DEFAULT 'blue'::"text",
    "is_active" boolean DEFAULT true,
    "is_system" boolean DEFAULT false,
    "allow_activities" boolean DEFAULT true,
    "allow_notes" boolean DEFAULT true,
    "allow_attachments" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_studio_modules" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_studio_modules" IS 'Registry of custom CRM modules created via Studio';



CREATE TABLE IF NOT EXISTS "public"."crm_studio_validation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "condition_logic" "text" DEFAULT 'AND'::"text",
    "error_message" "text" NOT NULL,
    "error_field_id" "uuid",
    "run_on_create" boolean DEFAULT true,
    "run_on_update" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_studio_validation_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_studio_validation_rules" IS 'Server-side validation rules for custom modules';



CREATE TABLE IF NOT EXISTS "public"."crm_studio_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "columns" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "filters" "jsonb" DEFAULT '[]'::"jsonb",
    "sort_field_id" "uuid",
    "sort_direction" "text" DEFAULT 'desc'::"text",
    "visibility" "text" DEFAULT 'private'::"text",
    "owner_id" "uuid",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_studio_views_sort_direction_check" CHECK (("sort_direction" = ANY (ARRAY['asc'::"text", 'desc'::"text"]))),
    CONSTRAINT "crm_studio_views_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'team'::"text", 'org'::"text"])))
);


ALTER TABLE "public"."crm_studio_views" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_studio_views" IS 'Saved list views with filters and column configs';



CREATE TABLE IF NOT EXISTS "public"."crm_template_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_folder_id" "uuid",
    "color" "text" DEFAULT '#6366F1'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."crm_template_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "template_type" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "subject" "text",
    "body" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "is_ai_generated" boolean DEFAULT false,
    "ai_performance_score" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_shared" boolean DEFAULT false,
    "preview_text" "text",
    "default_signature_id" "uuid",
    "folder_id" "uuid",
    "version" integer DEFAULT 1,
    "parent_version_id" "uuid",
    "performance_score" numeric(5,2) DEFAULT 0,
    "reply_count" integer DEFAULT 0,
    "total_sent" integer DEFAULT 0,
    "open_rate" numeric(5,2) DEFAULT 0,
    "click_rate" numeric(5,2) DEFAULT 0,
    CONSTRAINT "crm_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['email'::"text", 'sms'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."crm_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_user_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_value" numeric NOT NULL,
    "current_value" numeric DEFAULT 0,
    "metric_type" "text" NOT NULL,
    "period" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "is_personal" boolean DEFAULT true,
    "assigned_by" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "completed_at" timestamp with time zone,
    "icon" "text" DEFAULT 'target'::"text",
    "color" "text" DEFAULT 'violet'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_user_goals_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['leads_created'::"text", 'leads_converted'::"text", 'deals_won'::"text", 'deals_value'::"text", 'calls_made'::"text", 'emails_sent'::"text", 'meetings_held'::"text", 'tasks_completed'::"text", 'custom'::"text"]))),
    CONSTRAINT "crm_user_goals_period_check" CHECK (("period" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text", 'custom'::"text"]))),
    CONSTRAINT "crm_user_goals_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."crm_user_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "description" "text",
    "email" "text",
    "phone" "text",
    "website" "text",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "vendor_type" "text" DEFAULT 'supplier'::"text",
    "payment_terms" "text",
    "tax_id" "text",
    "is_active" boolean DEFAULT true,
    "rating" integer,
    "primary_contact_id" "uuid",
    "owner_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_vendors_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "crm_vendors_vendor_type_check" CHECK (("vendor_type" = ANY (ARRAY['supplier'::"text", 'manufacturer'::"text", 'distributor'::"text", 'contractor'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."crm_vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_web_form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_url" "text",
    "ip_address" "text",
    "user_agent" "text",
    "lead_id" "uuid",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_web_form_submissions_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'converted'::"text", 'duplicate'::"text", 'spam'::"text"])))
);


ALTER TABLE "public"."crm_web_form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_web_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "entity_type" "text" DEFAULT 'lead'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "styling" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submit_count" integer DEFAULT 0 NOT NULL,
    "last_submission_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_web_forms_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['lead'::"text", 'contact'::"text"]))),
    CONSTRAINT "crm_web_forms_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."crm_web_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_website_quote_sync" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_submission_id" "uuid" NOT NULL,
    "crm_lead_id" "uuid",
    "crm_quote_id" "uuid",
    "sync_status" "text" DEFAULT 'pending'::"text",
    "sync_error" "text",
    "sync_attempts" integer DEFAULT 0,
    "last_sync_attempt" timestamp with time zone,
    "extracted_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "synced_at" timestamp with time zone,
    CONSTRAINT "crm_website_quote_sync_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['pending'::"text", 'synced'::"text", 'failed'::"text", 'skipped'::"text", 'manual_review'::"text"])))
);


ALTER TABLE "public"."crm_website_quote_sync" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_analytics_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "total_sessions" integer DEFAULT 0,
    "total_users" integer DEFAULT 0,
    "new_users" integer DEFAULT 0,
    "returning_users" integer DEFAULT 0,
    "total_page_views" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "avg_session_duration" numeric(10,2) DEFAULT 0,
    "pages_per_session" numeric(5,2) DEFAULT 0,
    "desktop_sessions" integer DEFAULT 0,
    "mobile_sessions" integer DEFAULT 0,
    "tablet_sessions" integer DEFAULT 0,
    "top_pages" "jsonb" DEFAULT '[]'::"jsonb",
    "top_countries" "jsonb" DEFAULT '[]'::"jsonb",
    "top_sources" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_analytics_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth_key" "text" NOT NULL,
    "user_agent" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone
);


ALTER TABLE "public"."device_push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_access_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "accessed_by" "uuid" NOT NULL,
    "access_type" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "document_access_log_access_type_check" CHECK (("access_type" = ANY (ARRAY['view'::"text", 'download'::"text", 'share'::"text", 'delete'::"text"])))
);


ALTER TABLE "public"."document_access_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."educational_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text" DEFAULT ''::"text",
    "content_type" "text" NOT NULL,
    "content_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "educational_content_content_type_check" CHECK (("content_type" = ANY (ARRAY['how_it_works'::"text", 'guide'::"text", 'tutorial'::"text", 'overview'::"text"])))
);


ALTER TABLE "public"."educational_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(255) NOT NULL,
    "description" "text",
    "template_id" "uuid",
    "recipient_type" character varying(50) NOT NULL,
    "recipient_filter" "jsonb" DEFAULT '{}'::"jsonb",
    "recipient_list" "jsonb" DEFAULT '[]'::"jsonb",
    "schedule_type" character varying(50) NOT NULL,
    "schedule_config" "jsonb" NOT NULL,
    "next_run_at" timestamp with time zone,
    "last_run_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "total_sent" integer DEFAULT 0,
    "total_opened" integer DEFAULT 0,
    "total_clicked" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "subject_template" "text" NOT NULL,
    "html_template" "text" NOT NULL,
    "text_template" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "category" "text" DEFAULT 'newsletter'::"text",
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_log_id" "uuid",
    "tracking_type" character varying(20) NOT NULL,
    "link_url" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "device_type" character varying(20),
    "location_country" character varying(2),
    "location_city" character varying(100),
    "tracked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollment_intent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "plan_type" "text" NOT NULL,
    "age_band" "text",
    "iua" integer,
    "household_size" integer,
    "has_tobacco" boolean DEFAULT false,
    "start_date" "date",
    "estimated_rate" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "enrollment_intent_age_band_check" CHECK (("age_band" = ANY (ARRAY['18-29'::"text", '30-49'::"text", '50-64'::"text"]))),
    CONSTRAINT "enrollment_intent_household_size_check" CHECK ((("household_size" >= 1) AND ("household_size" <= 20))),
    CONSTRAINT "enrollment_intent_iua_check" CHECK (("iua" = ANY (ARRAY[1250, 2500, 5000]))),
    CONSTRAINT "enrollment_intent_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['care-plus'::"text", 'direct'::"text", 'secure-hsa'::"text"])))
);


ALTER TABLE "public"."enrollment_intent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "applicant_name" "text" NOT NULL,
    "applicant_email" "text" NOT NULL,
    "applicant_phone" "text",
    "application_type" "text" DEFAULT 'advisor'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "documents" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enrollments_application_type_check" CHECK (("application_type" = ANY (ARRAY['advisor'::"text", 'member'::"text", 'partner'::"text"]))),
    CONSTRAINT "enrollments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_review'::"text", 'approved'::"text", 'rejected'::"text", 'on_hold'::"text"])))
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."esignature_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "provider_id" "uuid",
    "external_document_id" "text",
    "name" character varying(255) NOT NULL,
    "status" character varying(30) DEFAULT 'draft'::character varying,
    "signers" "jsonb" DEFAULT '[]'::"jsonb",
    "document_type" character varying(50),
    "related_entity_type" character varying(50),
    "related_entity_id" "uuid",
    "sent_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "signed_document_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."esignature_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."esignature_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(100) NOT NULL,
    "provider" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "webhook_url" "text",
    "templates_synced" integer DEFAULT 0,
    "last_sync_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."esignature_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text" DEFAULT ''::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "featured_image_url" "text" DEFAULT ''::"text" NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "event_end_date" timestamp with time zone,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "location_type" "text" DEFAULT 'in_person'::"text" NOT NULL,
    "registration_url" "text",
    "event_type" "text" DEFAULT 'community'::"text" NOT NULL,
    "organizer" "text" DEFAULT 'MPB Health'::"text" NOT NULL,
    "max_attendees" integer,
    "is_published" boolean DEFAULT false NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gallery_images" "text"[] DEFAULT '{}'::"text"[],
    "video_url" "text",
    CONSTRAINT "events_event_type_check" CHECK (("event_type" = ANY (ARRAY['conference'::"text", 'webinar'::"text", 'training'::"text", 'networking'::"text", 'celebration'::"text", 'community'::"text", 'other'::"text"]))),
    CONSTRAINT "events_location_type_check" CHECK (("location_type" = ANY (ARRAY['in_person'::"text", 'virtual'::"text", 'hybrid'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."gallery_images" IS 'Array of image URLs for the event photo gallery';



CREATE TABLE IF NOT EXISTS "public"."external_lms_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lms_provider" "text" DEFAULT 'tutor_lms'::"text" NOT NULL,
    "external_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "thumbnail_url" "text",
    "course_url" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "order_index" integer DEFAULT 0,
    "estimated_hours" numeric(4,2) DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."external_lms_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_lms_lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "external_id" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "lesson_url" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "duration_minutes" integer DEFAULT 10,
    "has_video" boolean DEFAULT false,
    "has_quiz" boolean DEFAULT false,
    "is_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."external_lms_lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faq_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content_html" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."faq_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid",
    "advisor_id" "uuid",
    "org_id" "uuid",
    "form_name" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'submitted'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gemini_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "template" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "category" "text" DEFAULT 'general'::"text",
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gemini_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."geo_state_settings" (
    "state_code" "text" NOT NULL,
    "state_name" "text" NOT NULL,
    "is_supported" boolean DEFAULT true,
    "is_restricted" boolean DEFAULT false,
    "restriction_message" "text",
    "not_supported_message" "text",
    "notes" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."geo_state_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."handbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "pdf_path" "text" NOT NULL,
    "plan_type" "text" NOT NULL,
    "color" "text" DEFAULT 'blue'::"text",
    "icon" "text" DEFAULT 'BookOpen'::"text",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "flipbook_url" "text",
    CONSTRAINT "handbooks_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['individual'::"text", 'family'::"text", 'employer'::"text", 'hsa'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."handbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "condition_name" "text" NOT NULL,
    "condition_type" "text",
    "diagnosed_date" "date",
    "resolved_date" "date",
    "severity" "text",
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "health_history_condition_type_check" CHECK (("condition_type" = ANY (ARRAY['chronic'::"text", 'acute'::"text", 'resolved'::"text", 'family_history'::"text"]))),
    CONSTRAINT "health_history_severity_check" CHECK (("severity" = ANY (ARRAY['mild'::"text", 'moderate'::"text", 'severe'::"text"])))
);


ALTER TABLE "public"."health_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."healthcare_plan_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "icon" "text" DEFAULT 'Heart'::"text" NOT NULL,
    "gradient" "text" DEFAULT 'from-blue-600 to-cyan-500'::"text" NOT NULL,
    "icon_bg" "text" DEFAULT 'bg-blue-100'::"text" NOT NULL,
    "image_url" "text" DEFAULT ''::"text" NOT NULL,
    "image_alt" "text" DEFAULT ''::"text" NOT NULL,
    "recommendations" "text" DEFAULT ''::"text" NOT NULL,
    "best_for" "text" DEFAULT ''::"text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."healthcare_plan_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."immunizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "vaccine_name" "text" NOT NULL,
    "vaccine_code" "text",
    "administration_date" "date" NOT NULL,
    "administering_provider" "text",
    "lot_number" "text",
    "site" "text",
    "route" "text",
    "dose_number" integer,
    "next_dose_due" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."immunizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_health" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform_id" "uuid",
    "status" "text" DEFAULT 'healthy'::"text",
    "last_success_at" timestamp with time zone,
    "last_error_at" timestamp with time zone,
    "last_error_message" "text",
    "success_count" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "avg_response_time" numeric(10,2),
    "uptime_percentage" numeric(5,2),
    "alerts_enabled" boolean DEFAULT true,
    "last_checked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interaction_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "member_id" "uuid",
    "agent_id" "uuid",
    "interaction_type" character varying(50) NOT NULL,
    "direction" character varying(20),
    "subject" "text",
    "summary" "text",
    "duration_seconds" integer,
    "outcome" character varying(50),
    "sentiment" character varying(20),
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interaction_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "billing_period_start" "date" NOT NULL,
    "billing_period_end" "date" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "amount_paid" numeric(10,2) DEFAULT 0,
    "amount_due" numeric(10,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "invoice_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "test_name" "text" NOT NULL,
    "test_category" "text",
    "test_date" "date" NOT NULL,
    "result_value" "text" NOT NULL,
    "result_unit" "text",
    "reference_range" "text",
    "is_abnormal" boolean DEFAULT false,
    "ordering_provider" "text",
    "lab_facility" "text",
    "notes" "text",
    "document_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lab_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "lead_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['note'::"text", 'call'::"text", 'email'::"text", 'meeting'::"text", 'status_change'::"text", 'assignment'::"text", 'task_created'::"text", 'task_completed'::"text"])))
);


ALTER TABLE "public"."lead_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "is_repeat_lead" boolean DEFAULT false,
    "repeat_count" integer DEFAULT 0,
    "notified_at" timestamp with time zone DEFAULT "now"(),
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    "desktop_notification_sent" boolean DEFAULT false,
    "desktop_notification_clicked" boolean DEFAULT false,
    "time_to_acknowledge_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "lead_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['normal'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."lead_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_routing_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "page_path" "text" NOT NULL,
    "cta_type" "text",
    "cta_text" "text",
    "cta_location" "text",
    "plan_type" "text",
    "household_size" integer,
    "estimated_premium" numeric,
    "clicked_at" timestamp with time zone DEFAULT "now"(),
    "referrer" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text"
);


ALTER TABLE "public"."lead_routing_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_scoring_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "factor_key" "text" NOT NULL,
    "factor_label" "text" NOT NULL,
    "weight" integer DEFAULT 50,
    "is_enabled" boolean DEFAULT true,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lead_scoring_config_weight_check" CHECK ((("weight" >= 0) AND ("weight" <= 100)))
);


ALTER TABLE "public"."lead_scoring_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "household_size" integer DEFAULT 1,
    "current_insurance" "text",
    "monthly_premium" "text",
    "coverage_preference" "text",
    "zip_code" "text",
    "primary_concern" "text",
    "contact_preference" "text" DEFAULT 'phone'::"text",
    "source" "text" DEFAULT 'website_lead_form'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'new'::"text",
    "assigned_to" "uuid",
    "notes" "text",
    "referral_source" "text",
    CONSTRAINT "lead_submissions_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'qualified'::"text", 'converted'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."lead_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "task_type" "text" DEFAULT 'follow_up'::"text",
    "due_date" timestamp with time zone NOT NULL,
    "due_time" time without time zone,
    "priority" "text" DEFAULT 'medium'::"text",
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "lead_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "lead_tasks_task_type_check" CHECK (("task_type" = ANY (ARRAY['follow_up'::"text", 'call'::"text", 'email'::"text", 'meeting'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."lead_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "source" "text",
    "source_campaign" "text",
    "source_medium" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "assigned_to" "uuid",
    "score" integer DEFAULT 0,
    "company" "text",
    "job_title" "text",
    "address" "jsonb",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "last_contacted_at" timestamp with time zone,
    "next_follow_up_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_advisor_id" "uuid",
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'qualified'::"text", 'proposal'::"text", 'negotiation'::"text", 'won'::"text", 'lost'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "public"."mail_provider" NOT NULL,
    "email_address" "text" NOT NULL,
    "display_name" "text",
    "access_token_encrypted" "bytea",
    "refresh_token_encrypted" "bytea",
    "token_expires_at" timestamp with time zone,
    "scopes" "text"[] DEFAULT '{}'::"text"[],
    "imap_host" "text",
    "imap_port" integer,
    "smtp_host" "text",
    "smtp_port" integer,
    "imap_use_ssl" boolean DEFAULT true,
    "sync_status" "public"."mail_sync_status" DEFAULT 'idle'::"public"."mail_sync_status",
    "sync_error" "text",
    "last_sync_at" timestamp with time zone,
    "delta_token" "text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "auto_sync" boolean DEFAULT true,
    "sync_interval_minutes" integer DEFAULT 5,
    "provider_account_id" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "user_id" "uuid",
    "account_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "spf_status" "public"."domain_verification_status" DEFAULT 'pending'::"public"."domain_verification_status",
    "spf_record" "text",
    "spf_verified_at" timestamp with time zone,
    "dkim_status" "public"."domain_verification_status" DEFAULT 'pending'::"public"."domain_verification_status",
    "dkim_selector" "text",
    "dkim_record" "text",
    "dkim_verified_at" timestamp with time zone,
    "dmarc_status" "public"."domain_verification_status" DEFAULT 'pending'::"public"."domain_verification_status",
    "dmarc_record" "text",
    "dmarc_verified_at" timestamp with time zone,
    "mx_status" "public"."domain_verification_status" DEFAULT 'pending'::"public"."domain_verification_status",
    "mx_verified_at" timestamp with time zone,
    "is_verified" boolean GENERATED ALWAYS AS ((("spf_status" = 'verified'::"public"."domain_verification_status") AND ("dkim_status" = 'verified'::"public"."domain_verification_status"))) STORED,
    "verification_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text"),
    "last_check_at" timestamp with time zone,
    "next_check_at" timestamp with time zone,
    "compliance_footer" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "provider_folder_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text",
    "parent_folder_id" "uuid",
    "folder_type" "text",
    "unread_count" integer DEFAULT 0,
    "total_count" integer DEFAULT 0,
    "is_hidden" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "label_color" "text",
    "delta_token" "text",
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "provider_attachment_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint,
    "content_type" "text",
    "content_id" "text",
    "is_inline" boolean DEFAULT false,
    "storage_path" "text",
    "cached_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "folder_id" "uuid",
    "provider_message_id" "text" NOT NULL,
    "provider_thread_id" "text",
    "internet_message_id" "text",
    "in_reply_to" "text",
    "from_address" "text",
    "from_name" "text",
    "to_addresses" "jsonb" DEFAULT '[]'::"jsonb",
    "cc_addresses" "jsonb" DEFAULT '[]'::"jsonb",
    "bcc_addresses" "jsonb" DEFAULT '[]'::"jsonb",
    "reply_to_address" "text",
    "subject" "text",
    "snippet" "text",
    "body_html" "text",
    "body_text" "text",
    "importance" "text" DEFAULT 'normal'::"text",
    "is_read" boolean DEFAULT false,
    "is_flagged" boolean DEFAULT false,
    "is_draft" boolean DEFAULT false,
    "has_attachments" boolean DEFAULT false,
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "sent_at" timestamp with time zone,
    "received_at" timestamp with time zone,
    "crm_email_log_id" "uuid",
    "tracking_id" "text",
    "provider_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "body_fetched" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 0,
    "stop_processing" boolean DEFAULT false,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "times_applied" integer DEFAULT 0,
    "last_applied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_sender_identities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "domain_id" "uuid" NOT NULL,
    "email_address" "text" NOT NULL,
    "display_name" "text",
    "is_default" boolean DEFAULT false,
    "signature_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_sender_identities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_shared_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "grantee_user_id" "uuid" NOT NULL,
    "permission" "text" DEFAULT 'read'::"text" NOT NULL,
    "granted_by" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_shared_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mail_sync_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "job_type" "public"."mail_job_type" NOT NULL,
    "status" "public"."mail_job_status" DEFAULT 'pending'::"public"."mail_job_status",
    "priority" integer DEFAULT 0,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "result" "jsonb",
    "error" "text",
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mail_sync_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "budget" numeric(10,2) DEFAULT 0,
    "spent" numeric(10,2) DEFAULT 0,
    "revenue" numeric(10,2) DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "clicks" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "ctr" numeric(5,2) DEFAULT 0,
    "cpc" numeric(10,2) DEFAULT 0,
    "roas" numeric(10,2) DEFAULT 0,
    "target_audience" "jsonb" DEFAULT '{}'::"jsonb",
    "utm_params" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maternity_coverage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "headline" "text" NOT NULL,
    "description" "text" NOT NULL,
    "waiting_period" "text" NOT NULL,
    "eligible_plans" "text"[] DEFAULT '{}'::"text"[],
    "highlights" "text"[] DEFAULT '{}'::"text"[],
    "prenatal_care" "text" DEFAULT ''::"text" NOT NULL,
    "delivery_hospital" "text" DEFAULT ''::"text" NOT NULL,
    "postnatal_care" "text" DEFAULT ''::"text" NOT NULL,
    "additional_benefits" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."maternity_coverage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maternity_coverage_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "maternity_coverage_id" "uuid" NOT NULL,
    "stage_key" "text" NOT NULL,
    "icon" "text" DEFAULT 'Heart'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "details" "text"[] DEFAULT '{}'::"text"[],
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."maternity_coverage_stages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."meeting_attendees" WITH ("security_invoker"='true') AS
 SELECT "id",
    "meeting_id",
    "advisor_id",
    "user_id",
    "email",
    "name",
    "joined_at",
    "left_at",
    "duration_seconds",
    "created_at"
   FROM "public"."advisor_meeting_attendees";


ALTER VIEW "public"."meeting_attendees" OWNER TO "postgres";


COMMENT ON VIEW "public"."meeting_attendees" IS 'Compatibility view for advisor_meeting_attendees. Code references meeting_attendees; physical table is advisor_meeting_attendees.';



CREATE TABLE IF NOT EXISTS "public"."meeting_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "meeting_type" "text" DEFAULT 'group'::"text",
    "default_duration" integer DEFAULT 60,
    "default_visibility" "text" DEFAULT 'all'::"text",
    "default_agenda" "text",
    "require_registration" boolean DEFAULT false,
    "allow_guests" boolean DEFAULT false,
    "auto_record" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meeting_templates_default_visibility_check" CHECK (("default_visibility" = ANY (ARRAY['all'::"text", 'selected'::"text", 'private'::"text"]))),
    CONSTRAINT "meeting_templates_meeting_type_check" CHECK (("meeting_type" = ANY (ARRAY['all_hands'::"text", 'group'::"text", 'one_on_one'::"text", 'training'::"text", 'webinar'::"text"])))
);


ALTER TABLE "public"."meeting_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_coverage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "plan_name" "text" NOT NULL,
    "plan_type" "text" NOT NULL,
    "coverage_start_date" "date" NOT NULL,
    "coverage_end_date" "date",
    "monthly_share_amount" numeric(10,2) NOT NULL,
    "annual_unshared_amount" numeric(10,2),
    "remaining_unshared" numeric(10,2),
    "lifetime_maximum" numeric(12,2),
    "lifetime_used" numeric(12,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "benefits" "jsonb" DEFAULT '{}'::"jsonb",
    "network_info" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."member_coverage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_dependents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "date_of_birth" "date" NOT NULL,
    "gender" "text",
    "ssn_last_four" "text",
    "is_covered" boolean DEFAULT true,
    "coverage_start_date" "date",
    "coverage_end_date" "date",
    "medical_conditions" "text"[],
    "allergies" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "member_dependents_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text"]))),
    CONSTRAINT "member_dependents_relationship_check" CHECK (("relationship" = ANY (ARRAY['spouse'::"text", 'child'::"text", 'parent'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."member_dependents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "document_category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "version" integer DEFAULT 1,
    "is_current" boolean DEFAULT true,
    "tags" "text"[],
    "expires_at" timestamp with time zone,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "member_documents_document_category_check" CHECK (("document_category" = ANY (ARRAY['claim'::"text", 'coverage'::"text", 'form'::"text", 'medical_record'::"text", 'id_card'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."member_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "action_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "member_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['claim_update'::"text", 'payment_due'::"text", 'payment_received'::"text", 'document_uploaded'::"text", 'coverage_update'::"text", 'system_alert'::"text", 'message'::"text", 'reminder'::"text"]))),
    CONSTRAINT "member_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."member_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "date_of_birth" "date" NOT NULL,
    "gender" "text",
    "phone" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text" DEFAULT 'US'::"text",
    "profile_photo_url" "text",
    "membership_number" "text",
    "membership_status" "text" DEFAULT 'active'::"text",
    "membership_start_date" "date",
    "membership_end_date" "date",
    "plan_id" "uuid",
    "assigned_advisor_id" "uuid",
    "preferred_language" "text" DEFAULT 'en'::"text",
    "communication_preferences" "jsonb" DEFAULT '{"sms": false, "email": true, "phone": false}'::"jsonb",
    "medical_conditions" "text"[],
    "allergies" "text"[],
    "medications" "text"[],
    "emergency_contact_consent" boolean DEFAULT false,
    "hipaa_consent" boolean DEFAULT false,
    "consent_date" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "plan_type" "text",
    "plan_name" "text",
    "enrollment_date" "date",
    "renewal_date" "date",
    "last_contact_date" timestamp with time zone,
    "notes" "text",
    "tags" "text"[],
    CONSTRAINT "member_profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text", 'prefer_not_to_say'::"text"]))),
    CONSTRAINT "member_profiles_membership_status_check" CHECK (("membership_status" = ANY (ARRAY['active'::"text", 'pending'::"text", 'suspended'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "member_profiles_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['basic'::"text", 'standard'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "member_profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending'::"text", 'inactive'::"text", 'cancelled'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."member_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "subject" "text",
    "message_body" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "parent_message_id" "uuid",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."navigation_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "navigation_item_id" "uuid",
    "session_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "user_agent" "text",
    "referrer" "text"
);


ALTER TABLE "public"."navigation_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."navigation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "href" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "parent_id" "uuid",
    "order_position" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "requires_auth" boolean DEFAULT false,
    "allowed_roles" "text"[],
    "external" boolean DEFAULT false,
    "badge" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."navigation_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blog_post_id" "uuid",
    "subject_line" "text" NOT NULL,
    "preview_text" "text",
    "send_at" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text",
    "target_segment" "jsonb" DEFAULT '{}'::"jsonb",
    "sent_count" integer DEFAULT 0,
    "delivered_count" integer DEFAULT 0,
    "opened_count" integer DEFAULT 0,
    "clicked_count" integer DEFAULT 0,
    "bounced_count" integer DEFAULT 0,
    "unsubscribed_count" integer DEFAULT 0,
    "open_rate" numeric DEFAULT 0,
    "click_rate" numeric DEFAULT 0,
    "n8n_webhook_url" "text",
    "n8n_execution_id" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletter_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'sending'::"text", 'sent'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."newsletter_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "subscriber_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "sent_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "bounce_reason" "text",
    "error_message" "text",
    "tracking_token" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletter_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'bounced'::"text", 'opened'::"text", 'clicked'::"text"])))
);


ALTER TABLE "public"."newsletter_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "source" "text" DEFAULT 'footer'::"text",
    "confirmed_at" timestamp with time zone,
    "unsubscribed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "valid_email" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'unsubscribed'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "note_id" "uuid",
    "recipient_user_id" "uuid",
    "notification_type" "text",
    "is_read" boolean DEFAULT false,
    "sent_via" "text" DEFAULT 'in-app'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "note_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['shared'::"text", 'edited'::"text", 'unshared'::"text", 'commented'::"text"]))),
    CONSTRAINT "note_notifications_sent_via_check" CHECK (("sent_via" = ANY (ARRAY['in-app'::"text", 'email'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."note_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "note_id" "uuid",
    "shared_by_user_id" "uuid",
    "shared_with_user_id" "uuid",
    "shared_with_role" "text",
    "permission_level" "text" DEFAULT 'view'::"text",
    "share_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "note_shares_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['view'::"text", 'edit'::"text"]))),
    CONSTRAINT "note_shares_shared_with_role_check" CHECK (("shared_with_role" = ANY (ARRAY['ceo'::"text", 'cto'::"text"])))
);


ALTER TABLE "public"."note_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "title" "text",
    "owner_role" "text",
    "created_for_role" "text",
    "is_shared" boolean DEFAULT false,
    "is_collaborative" boolean DEFAULT false,
    "created_by" "uuid",
    "category" "text" DEFAULT 'general'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_pinned" boolean DEFAULT false,
    CONSTRAINT "notes_created_for_role_check" CHECK (("created_for_role" = ANY (ARRAY['ceo'::"text", 'cto'::"text"]))),
    CONSTRAINT "notes_owner_role_check" CHECK (("owner_role" = ANY (ARRAY['ceo'::"text", 'cto'::"text"])))
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "action_url" "text",
    "source_type" "text",
    "source_id" "uuid",
    "actor_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "actor_name" "text",
    CONSTRAINT "notification_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['chat_message'::"text", 'chat_mention'::"text", 'chat_dm'::"text", 'ticket_reply'::"text", 'ticket_status_change'::"text", 'bulletin_published'::"text", 'email_sent'::"text", 'email_delivered'::"text", 'email_opened'::"text", 'system_alert'::"text"])))
);


ALTER TABLE "public"."notification_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "channel" "text" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "lead_id" "uuid",
    "task_id" "uuid",
    "event_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_log_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'push'::"text", 'slack'::"text", 'in_app'::"text"]))),
    CONSTRAINT "notification_log_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'clicked'::"text"])))
);


ALTER TABLE "public"."notification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_enabled" boolean DEFAULT true,
    "email_new_leads" boolean DEFAULT true,
    "email_hot_leads" boolean DEFAULT true,
    "email_task_reminders" boolean DEFAULT true,
    "email_daily_digest" boolean DEFAULT true,
    "email_weekly_summary" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT false,
    "push_subscription" "jsonb",
    "push_new_leads" boolean DEFAULT true,
    "push_hot_leads" boolean DEFAULT true,
    "push_task_due" boolean DEFAULT true,
    "push_lead_activity" boolean DEFAULT false,
    "slack_enabled" boolean DEFAULT false,
    "slack_webhook_url" "text",
    "slack_channel" "text",
    "slack_new_leads" boolean DEFAULT true,
    "slack_hot_leads" boolean DEFAULT true,
    "slack_daily_summary" boolean DEFAULT false,
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "timezone" "text" DEFAULT 'America/New_York'::"text",
    "min_priority_for_push" "text" DEFAULT 'high'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "push_chat_messages" boolean DEFAULT true,
    "push_chat_mentions" boolean DEFAULT true,
    "push_ticket_updates" boolean DEFAULT true,
    "push_bulletins" boolean DEFAULT true,
    "mute_all_until" timestamp with time zone,
    CONSTRAINT "notification_preferences_min_priority_for_push_check" CHECK (("min_priority_for_push" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "text" DEFAULT ''::"text" NOT NULL,
    "email_enabled" boolean DEFAULT true NOT NULL,
    "email_new_lead" boolean DEFAULT true NOT NULL,
    "email_new_message" boolean DEFAULT true NOT NULL,
    "email_task_reminder" boolean DEFAULT true NOT NULL,
    "email_compliance_alert" boolean DEFAULT true NOT NULL,
    "email_weekly_digest" boolean DEFAULT true NOT NULL,
    "email_marketing" boolean DEFAULT false NOT NULL,
    "sms_enabled" boolean DEFAULT false NOT NULL,
    "sms_phone_number" "text",
    "sms_urgent_only" boolean DEFAULT false NOT NULL,
    "push_enabled" boolean DEFAULT false NOT NULL,
    "push_new_lead" boolean DEFAULT true NOT NULL,
    "push_new_message" boolean DEFAULT true NOT NULL,
    "push_task_reminder" boolean DEFAULT true NOT NULL,
    "in_app_enabled" boolean DEFAULT true NOT NULL,
    "in_app_sound" boolean DEFAULT true NOT NULL,
    "in_app_desktop" boolean DEFAULT false NOT NULL,
    "digest_frequency" "text" DEFAULT 'daily'::"text" NOT NULL,
    "digest_time" "text" DEFAULT '09:00'::"text" NOT NULL,
    "digest_day" integer DEFAULT 1 NOT NULL,
    "quiet_hours_enabled" boolean DEFAULT false NOT NULL,
    "quiet_hours_start" "text" DEFAULT '22:00'::"text" NOT NULL,
    "quiet_hours_end" "text" DEFAULT '08:00'::"text" NOT NULL,
    "quiet_hours_timezone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "push_chat_messages" boolean DEFAULT true,
    "push_chat_mentions" boolean DEFAULT true,
    "push_ticket_updates" boolean DEFAULT true,
    "push_bulletins" boolean DEFAULT true,
    CONSTRAINT "notification_settings_digest_day_check" CHECK ((("digest_day" >= 0) AND ("digest_day" <= 6))),
    CONSTRAINT "notification_settings_digest_frequency_check" CHECK (("digest_frequency" = ANY (ARRAY['realtime'::"text", 'hourly'::"text", 'daily'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text",
    "icon" "text",
    "action_url" "text",
    "action_label" "text",
    "priority" "public"."notification_priority" DEFAULT 'normal'::"public"."notification_priority",
    "category" "text",
    "channels" "public"."notification_channel"[] DEFAULT '{in_app}'::"public"."notification_channel"[],
    "delivered_via" "public"."notification_channel"[] DEFAULT '{}'::"public"."notification_channel"[],
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "is_dismissed" boolean DEFAULT false,
    "dismissed_at" timestamp with time zone,
    "scheduled_for" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "advisor_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "onboarding_progress_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "audience" "text",
    "zip_code" "text",
    "ages" "jsonb" DEFAULT '[]'::"jsonb",
    "priority" "text",
    "usage" "text",
    "iua_comfort" "text",
    "extras" "jsonb" DEFAULT '[]'::"jsonb",
    "pre_existing_awareness" boolean DEFAULT false,
    "contact_opt_in" boolean DEFAULT false,
    "contact_email" "text",
    "contact_phone" "text",
    "recommended_plan_primary" "text",
    "recommended_plan_alternate" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0,
    "required_modules" "text"[] DEFAULT ARRAY[]::"text"[],
    "required_forms" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."onboarding_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "token" "text" DEFAULT "replace"((("gen_random_uuid"())::"text" || ("gen_random_uuid"())::"text"), '-'::"text", ''::"text") NOT NULL,
    "invited_by" "uuid",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_invites_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'advisor'::"text"]))),
    CONSTRAINT "org_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."org_invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_invites" IS 'Pending invitations to join an organization';



CREATE TABLE IF NOT EXISTS "public"."org_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_memberships_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'agent'::"text", 'member'::"text"]))),
    CONSTRAINT "org_memberships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'invited'::"text", 'suspended'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."org_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_memberships" IS 'User membership and roles within organizations';



CREATE OR REPLACE VIEW "public"."organization_members" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "org_id",
    "role",
    "status",
    "joined_at",
    "created_at",
    "updated_at"
   FROM "public"."org_memberships"
  WHERE ("status" = 'active'::"text");


ALTER VIEW "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "brand_config" "jsonb" DEFAULT '{"accentColor": "#14B8A6", "primaryColor": "#0D9488"}'::"jsonb",
    "settings" "jsonb" DEFAULT '{"features": {}, "timezone": "America/New_York", "dateFormat": "MM/dd/yyyy"}'::"jsonb",
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "trial_ends_at" timestamp with time zone,
    "max_users" integer DEFAULT 5,
    "max_contacts" integer DEFAULT 1000,
    "max_sequences" integer DEFAULT 10,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organizations_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'cancelled'::"text", 'suspended'::"text"]))),
    CONSTRAINT "organizations_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'starter'::"text", 'professional'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."organizations" IS 'Multi-tenant organization/company records for Champion';



CREATE TABLE IF NOT EXISTS "public"."orgs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "domain" "text",
    "logo_url" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "orgs_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."orgs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outlook_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "client_secret" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "user_email" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."outlook_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."outlook_config" IS 'Stores Microsoft Graph API configuration for Outlook calendar integration';



CREATE TABLE IF NOT EXISTS "public"."page_performance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_path" "text" NOT NULL,
    "page_title" "text",
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "avg_time_on_page" numeric(10,2) DEFAULT 0,
    "avg_scroll_depth" numeric(5,2) DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "entry_count" integer DEFAULT 0,
    "exit_count" integer DEFAULT 0,
    "cta_clicks" integer DEFAULT 0,
    "form_submissions" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "payment_type" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "card_last_four" "text",
    "card_brand" "text",
    "card_exp_month" integer,
    "card_exp_year" integer,
    "bank_name" "text",
    "account_last_four" "text",
    "billing_name" "text" NOT NULL,
    "billing_address" "text",
    "billing_zip" "text",
    "payment_token" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_methods_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['credit_card'::"text", 'debit_card'::"text", 'bank_account'::"text", 'ach'::"text"])))
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_processors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(100) NOT NULL,
    "provider" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "supported_methods" "jsonb" DEFAULT '["card"]'::"jsonb",
    "fee_structure" "jsonb" DEFAULT '{}'::"jsonb",
    "webhook_url" "text",
    "webhook_secret" "text",
    "last_transaction_at" timestamp with time zone,
    "total_processed" numeric(12,2) DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_processors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "metric_type" "text" NOT NULL,
    "target_value" numeric NOT NULL,
    "current_value" numeric DEFAULT 0,
    "start_date" "date",
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."performance_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "module" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text"
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_category_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "feature_text" "text" NOT NULL,
    "feature_type" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "plan_category_features_feature_type_check" CHECK (("feature_type" = ANY (ARRAY['included'::"text", 'excluded'::"text"])))
);


ALTER TABLE "public"."plan_category_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_category_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "profile_text" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_category_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_value" "text",
    "cost" "text",
    "notes" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "age_min" integer,
    "age_max" integer,
    "member_type" "text" NOT NULL,
    "iua_amount" numeric,
    "monthly_contribution" numeric,
    "effective_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "plan_type" "text" NOT NULL,
    "action" "text" NOT NULL,
    "user_agent" "text",
    "referrer" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "plan_selections_action_check" CHECK (("action" = ANY (ARRAY['viewed'::"text", 'clicked'::"text", 'calculated'::"text"]))),
    CONSTRAINT "plan_selections_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['care-plus'::"text", 'direct'::"text", 'secure-hsa'::"text"])))
);


ALTER TABLE "public"."plan_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_sharing_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "has_lifetime_cap" boolean DEFAULT false,
    "has_annual_cap" boolean DEFAULT false,
    "preexisting_lookback_months" integer,
    "maternity_waiting_months" integer,
    "has_international_coverage" boolean DEFAULT false,
    "iua_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_sharing_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tagline" "text",
    "plan_type" "text" NOT NULL,
    "is_medical_cost_sharing" boolean DEFAULT false,
    "is_mec_compliant" boolean DEFAULT false,
    "is_hsa_compatible" boolean DEFAULT false,
    "target_audience" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "code" "text",
    "enrollment_fee" numeric(10,2) DEFAULT 0,
    "annual_membership_fee" numeric(10,2) DEFAULT 0,
    "tobacco_surcharge_pct" numeric(10,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "enroll_url" "text",
    "cost_basis" numeric(10,2),
    "description" "text",
    "external_product_id" "text"
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "medication_name" "text" NOT NULL,
    "dosage" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "refills_remaining" integer DEFAULT 0,
    "prescribing_provider" "text" NOT NULL,
    "provider_id" "uuid",
    "pharmacy_id" "uuid",
    "prescription_number" "text",
    "prescribed_date" "date" NOT NULL,
    "filled_date" "date",
    "expiration_date" "date",
    "instructions" "text",
    "status" "text" DEFAULT 'active'::"text",
    "is_controlled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "prescriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."priority_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "lane_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "contact_id" "uuid",
    "reason" "text",
    "score" integer DEFAULT 0,
    "rank" integer,
    "owner_user_id" "uuid",
    "snoozed_until" timestamp with time zone,
    "snooze_reason" "text",
    "completed_at" timestamp with time zone,
    "completed_reason" "text",
    "source" "text" DEFAULT 'manual'::"text",
    "source_rule_id" "uuid",
    "last_action_at" timestamp with time zone,
    "next_action_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "priority_item_has_subject" CHECK ((("lead_id" IS NOT NULL) OR ("contact_id" IS NOT NULL)))
);


ALTER TABLE "public"."priority_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."priority_items" IS 'Leads/contacts assigned to priority lanes with scores and rankings';



CREATE TABLE IF NOT EXISTS "public"."priority_lanes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6B7280'::"text",
    "icon" "text" DEFAULT 'flag'::"text",
    "order_index" integer DEFAULT 0,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "auto_rules" "jsonb" DEFAULT '[]'::"jsonb",
    "max_items" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."priority_lanes" OWNER TO "postgres";


COMMENT ON TABLE "public"."priority_lanes" IS 'Configurable priority lanes for organizing leads/contacts (Hot, Warm, etc.)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['guest'::"text", 'member'::"text", 'advisor'::"text", 'admin'::"text", 'staff'::"text", 'superadmin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_code_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid",
    "user_id" "uuid",
    "member_id" "uuid",
    "order_id" "uuid",
    "discount_applied" numeric(10,2) NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_code_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "discount_type" character varying(20) NOT NULL,
    "discount_value" numeric(10,2) NOT NULL,
    "applies_to" "jsonb" DEFAULT '["all"]'::"jsonb",
    "min_purchase_amount" numeric(10,2),
    "max_discount_amount" numeric(10,2),
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0,
    "per_user_limit" integer DEFAULT 1,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "requires_approval" boolean DEFAULT false,
    "stackable" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "location_name" "text",
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "zip_code" "text" NOT NULL,
    "phone" "text",
    "fax" "text",
    "hours_of_operation" "jsonb",
    "is_primary" boolean DEFAULT false,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."provider_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "npi" "text",
    "first_name" "text",
    "last_name" "text",
    "practice_name" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "specialties" "text"[],
    "phone" "text",
    "email" "text",
    "website" "text",
    "accepts_new_patients" boolean DEFAULT true,
    "is_network" boolean DEFAULT false,
    "rating" numeric(2,1),
    "review_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['physician'::"text", 'hospital'::"text", 'clinic'::"text", 'specialist'::"text", 'facility'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quick_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "action_data" "jsonb" NOT NULL,
    "shortcut" "text",
    "category" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quick_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_calculator_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "source_section" "text",
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_calculator_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_configuration" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_name" "text" NOT NULL,
    "age_band" "text" NOT NULL,
    "age_min" integer NOT NULL,
    "age_max" integer NOT NULL,
    "monthly_rate" numeric NOT NULL,
    "tobacco_user" boolean DEFAULT false,
    "effective_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_configuration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "saved_report_id" "uuid",
    "report_name" character varying(255) NOT NULL,
    "report_type" character varying(50) NOT NULL,
    "export_format" character varying(20) NOT NULL,
    "file_path" "text",
    "file_size_bytes" bigint,
    "row_count" integer,
    "filters_used" "jsonb" DEFAULT '{}'::"jsonb",
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "error_message" "text",
    "exported_by" "uuid",
    "exported_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval)
);


ALTER TABLE "public"."report_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text",
    "resource_type" "text" NOT NULL,
    "target_audience" "text" NOT NULL,
    "topics" "text"[] DEFAULT '{}'::"text"[],
    "featured_image_url" "text" DEFAULT ''::"text",
    "file_url" "text",
    "is_featured" boolean DEFAULT false,
    "published_date" timestamp with time zone DEFAULT "now"(),
    "view_count" integer DEFAULT 0,
    "download_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resource_library_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['Guide'::"text", 'Webinar'::"text", 'Checklist'::"text", 'Marketing'::"text", 'Form'::"text", 'Document'::"text"]))),
    CONSTRAINT "resource_library_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['Members'::"text", 'Employers'::"text", 'Advisors'::"text", 'All'::"text"])))
);


ALTER TABLE "public"."resource_library" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "icon" "text" DEFAULT 'Tag'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resource_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "role_permissions_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'agent'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(255) NOT NULL,
    "description" "text",
    "report_type" character varying(50) NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "columns" "jsonb" DEFAULT '[]'::"jsonb",
    "sort_config" "jsonb" DEFAULT '{}'::"jsonb",
    "chart_config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_default" boolean DEFAULT false,
    "is_shared" boolean DEFAULT false,
    "schedule_config" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_type" "text" NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "score_delta" integer DEFAULT 0,
    "lane_assignment" "uuid",
    "priority_boost" boolean DEFAULT false,
    "notify_owner" boolean DEFAULT false,
    "notification_message" "text",
    "is_active" boolean DEFAULT true,
    "execution_order" integer DEFAULT 0,
    "times_triggered" integer DEFAULT 0,
    "last_triggered_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scoring_rules_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['lead_created'::"text", 'lead_updated'::"text", 'lead_stage_change'::"text", 'no_contact_days'::"text", 'renewal_window'::"text", 'meeting_scheduled'::"text", 'meeting_missed'::"text", 'form_submitted'::"text", 'email_opened'::"text", 'email_clicked'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."scoring_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."scoring_rules" IS 'Rules for automatic scoring and lane assignment';



CREATE TABLE IF NOT EXISTS "public"."security_alert_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_severity" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "response_status" integer,
    "error_message" "text",
    CONSTRAINT "valid_event_severity" CHECK (("event_severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."security_alert_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_alert_log" IS 'Log of sent security alerts for rate limiting and audit purposes';



CREATE TABLE IF NOT EXISTS "public"."security_alert_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "channel_type" "text" DEFAULT 'webhook'::"text" NOT NULL,
    "min_severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "event_types" "text"[],
    "headers" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "valid_channel_type" CHECK (("channel_type" = ANY (ARRAY['slack'::"text", 'webhook'::"text"]))),
    CONSTRAINT "valid_min_severity" CHECK (("min_severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "valid_url" CHECK (("url" ~ '^https?://'::"text"))
);


ALTER TABLE "public"."security_alert_webhooks" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_alert_webhooks" IS 'Webhook configurations for sending security alerts (HIPAA/SOC 2 compliance)';



CREATE TABLE IF NOT EXISTS "public"."seo_backlinks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "source_url" "text" NOT NULL,
    "source_domain" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "anchor_text" "text",
    "domain_authority" integer,
    "page_authority" integer,
    "spam_score" integer,
    "link_type" "text",
    "is_active" boolean DEFAULT true,
    "first_seen_at" timestamp with time zone DEFAULT "now"(),
    "last_checked_at" timestamp with time zone,
    "status" "text",
    "data_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "seo_backlinks_link_type_check" CHECK (("link_type" = ANY (ARRAY['dofollow'::"text", 'nofollow'::"text", 'sponsored'::"text", 'ugc'::"text", 'unknown'::"text"]))),
    CONSTRAINT "seo_backlinks_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'lost'::"text", 'broken'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."seo_backlinks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_daily_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "date" "date" NOT NULL,
    "total_clicks" integer DEFAULT 0,
    "total_impressions" integer DEFAULT 0,
    "avg_ctr" numeric(6,4) DEFAULT 0,
    "avg_position" numeric(6,2) DEFAULT 0,
    "total_keywords" integer DEFAULT 0,
    "keywords_in_top_3" integer DEFAULT 0,
    "keywords_in_top_10" integer DEFAULT 0,
    "keywords_in_top_20" integer DEFAULT 0,
    "keywords_improved" integer DEFAULT 0,
    "keywords_declined" integer DEFAULT 0,
    "top_keywords" "jsonb" DEFAULT '[]'::"jsonb",
    "top_pages" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seo_daily_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_google_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "site_name" "text",
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_type" "text" DEFAULT 'Bearer'::"text",
    "expires_at" timestamp with time zone NOT NULL,
    "scope" "text",
    "is_connected" boolean DEFAULT true,
    "last_sync_at" timestamp with time zone,
    "sync_status" "text",
    "sync_error" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "seo_google_credentials_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['idle'::"text", 'syncing'::"text", 'success'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."seo_google_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_keyword_rankings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "keyword" "text" NOT NULL,
    "date" "date" NOT NULL,
    "position" numeric(6,2) NOT NULL,
    "previous_position" numeric(6,2),
    "position_change" numeric(6,2) DEFAULT 0,
    "trend" "text",
    "days_in_trend" integer DEFAULT 1,
    "clicks" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "seo_keyword_rankings_trend_check" CHECK (("trend" = ANY (ARRAY['up'::"text", 'down'::"text", 'stable'::"text", 'new'::"text"])))
);


ALTER TABLE "public"."seo_keyword_rankings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_keywords" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "keyword" "text" NOT NULL,
    "page_url" "text",
    "clicks" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "ctr" numeric(6,4) DEFAULT 0,
    "position" numeric(6,2) DEFAULT 0,
    "date" "date" NOT NULL,
    "device" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "seo_keywords_device_check" CHECK (("device" = ANY (ARRAY['DESKTOP'::"text", 'MOBILE'::"text", 'TABLET'::"text", NULL::"text"])))
);


ALTER TABLE "public"."seo_keywords" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_path" "text" NOT NULL,
    "meta_title" "text",
    "meta_description" "text",
    "meta_keywords" "text"[],
    "og_title" "text",
    "og_description" "text",
    "og_image" "text",
    "og_type" "text" DEFAULT 'website'::"text",
    "twitter_card" "text" DEFAULT 'summary_large_image'::"text",
    "twitter_title" "text",
    "twitter_description" "text",
    "twitter_image" "text",
    "canonical_url" "text",
    "robots" "text" DEFAULT 'index,follow'::"text",
    "structured_data" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" numeric(2,1) DEFAULT 0.5,
    "change_frequency" "text" DEFAULT 'weekly'::"text",
    "last_crawled" timestamp with time zone,
    "crawl_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seo_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "page_url" "text" NOT NULL,
    "page_title" "text",
    "date" "date" NOT NULL,
    "clicks" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "ctr" numeric(6,4) DEFAULT 0,
    "avg_position" numeric(6,2) DEFAULT 0,
    "keyword_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seo_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_url" "text" NOT NULL,
    "sync_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "records_fetched" integer DEFAULT 0,
    "records_inserted" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "date_from" "date",
    "date_to" "date",
    "error_message" "text",
    "error_details" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "seo_sync_logs_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "seo_sync_logs_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['keywords'::"text", 'pages'::"text", 'full'::"text"])))
);


ALTER TABLE "public"."seo_sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sequences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_type" "text" DEFAULT 'manual'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "steps" "jsonb" DEFAULT '[]'::"jsonb",
    "enrollment_count" integer DEFAULT 0,
    "completion_rate" numeric DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sequences_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "page_views" integer DEFAULT 0,
    "unique_visitors" integer DEFAULT 0,
    "new_visitors" integer DEFAULT 0,
    "returning_visitors" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "avg_session_duration" integer DEFAULT 0,
    "total_sessions" integer DEFAULT 0,
    "conversion_rate" numeric(5,2) DEFAULT 0,
    "top_pages" "jsonb" DEFAULT '[]'::"jsonb",
    "traffic_sources" "jsonb" DEFAULT '{}'::"jsonb",
    "device_breakdown" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "data_type" "text" DEFAULT 'string'::"text",
    "is_public" boolean DEFAULT false,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(100) NOT NULL,
    "provider" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "phone_numbers" "jsonb" DEFAULT '[]'::"jsonb",
    "monthly_limit" integer,
    "current_month_sent" integer DEFAULT 0,
    "webhook_url" "text",
    "last_message_at" timestamp with time zone,
    "total_sent" integer DEFAULT 0,
    "total_received" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sms_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "sms_account_id" "uuid",
    "template_id" "uuid",
    "direction" character varying(20) NOT NULL,
    "from_number" character varying(20) NOT NULL,
    "to_number" character varying(20) NOT NULL,
    "body" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "provider_message_id" "text",
    "error_message" "text",
    "segments" integer DEFAULT 1,
    "cost" numeric(8,4),
    "sent_by" "uuid",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone
);


ALTER TABLE "public"."sms_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sop_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'Folder'::"text",
    "order_index" integer DEFAULT 0,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sop_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sop_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "content" "text",
    "file_url" "text",
    "version" "text" DEFAULT '1.0'::"text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer DEFAULT 0,
    "org_id" "uuid",
    "is_published" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "slug" "text",
    "image_url" "text",
    "content_type" "text" DEFAULT 'markdown'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."sop_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "ticket_number" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text",
    "status" "text" DEFAULT 'open'::"text",
    "assigned_to" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "support_tickets_category_check" CHECK (("category" = ANY (ARRAY['technical'::"text", 'billing'::"text", 'claims'::"text", 'coverage'::"text", 'general'::"text", 'complaint'::"text"]))),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'waiting_member'::"text", 'waiting_staff'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "is_sensitive" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_firing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid",
    "rule_type" "text" NOT NULL,
    "rule_condition" "text" NOT NULL,
    "rule_value" "text",
    "match_type" "text" DEFAULT 'equals'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tag_firing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "lead_id" "uuid",
    "contact_id" "uuid",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."terminal_tool_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tool_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "allowed_roles" "jsonb" DEFAULT '["admin"]'::"jsonb",
    "rate_limit_calls" integer DEFAULT 50,
    "rate_limit_period" "text" DEFAULT 'hour'::"text",
    "requires_approval" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."terminal_tool_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ticket_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_event_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_name" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "platform_name" "text",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "session_id" "text",
    "page_path" "text",
    "referrer" "text",
    "user_agent" "text",
    "ip_address" "inet",
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tracking_event_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_platforms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform_name" "text" NOT NULL,
    "platform_type" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "icon_url" "text",
    "documentation_url" "text",
    "is_active" boolean DEFAULT true,
    "requires_consent" boolean DEFAULT true,
    "config_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "default_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tracking_platforms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_snippets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform_id" "uuid",
    "snippet_name" "text" NOT NULL,
    "tracking_id" "text",
    "snippet_code" "text",
    "snippet_type" "text" DEFAULT 'javascript'::"text",
    "injection_point" "text" DEFAULT 'head'::"text",
    "is_enabled" boolean DEFAULT true,
    "is_test_mode" boolean DEFAULT false,
    "load_priority" integer DEFAULT 100,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "version" integer DEFAULT 1,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tracking_snippets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_name" "text" NOT NULL,
    "tag_category" "text" NOT NULL,
    "tag_type" "text" NOT NULL,
    "snippet_id" "uuid",
    "is_active" boolean DEFAULT true,
    "fire_on_page_load" boolean DEFAULT true,
    "fire_priority" integer DEFAULT 100,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tracking_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."traffic_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_name" "text",
    "source_medium" "text",
    "sessions" integer DEFAULT 0,
    "users" integer DEFAULT 0,
    "page_views" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "avg_session_duration" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "traffic_sources_source_type_check" CHECK (("source_type" = ANY (ARRAY['direct'::"text", 'organic'::"text", 'referral'::"text", 'social'::"text", 'email'::"text", 'paid'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."traffic_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "payment_method_id" "uuid",
    "payment_gateway_id" "text",
    "description" "text",
    "invoice_id" "uuid",
    "claim_id" "uuid",
    "processed_date" timestamp with time zone,
    "receipt_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text", 'refunded'::"text"]))),
    CONSTRAINT "transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['membership_fee'::"text", 'claim_reimbursement'::"text", 'refund'::"text", 'adjustment'::"text", 'penalty'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "achievement_id" "text" NOT NULL,
    "achievement_name" "text" NOT NULL,
    "achievement_tier" "text" DEFAULT 'bronze'::"text",
    "progress" integer DEFAULT 0,
    "target" integer DEFAULT 1,
    "earned_at" timestamp with time zone,
    "is_earned" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_navigation_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "favorite_links" "jsonb" DEFAULT '[]'::"jsonb",
    "recent_pages" "jsonb" DEFAULT '[]'::"jsonb",
    "custom_order" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_navigation_preferences" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_organization_roles" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "org_id",
    "role",
    "joined_at" AS "created_at"
   FROM "public"."org_memberships"
  WHERE ("status" = 'active'::"text");


ALTER VIEW "public"."user_organization_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_presence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "status" character varying(20) DEFAULT 'online'::character varying,
    "current_page" "text",
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "session_started_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."user_presence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "granted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'advisor'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."utm_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_name" "text" NOT NULL,
    "campaign_url" "text" NOT NULL,
    "utm_source" "text" NOT NULL,
    "utm_medium" "text" NOT NULL,
    "utm_campaign" "text" NOT NULL,
    "utm_term" "text",
    "utm_content" "text",
    "short_url" "text",
    "qr_code_url" "text",
    "campaign_start_date" "date",
    "campaign_end_date" "date",
    "campaign_budget" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "click_count" integer DEFAULT 0,
    "conversion_count" integer DEFAULT 0,
    "revenue_generated" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."utm_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visit_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "visit_date" "date" NOT NULL,
    "visit_type" "text" NOT NULL,
    "provider_name" "text" NOT NULL,
    "provider_id" "uuid",
    "chief_complaint" "text",
    "diagnosis" "text",
    "treatment_plan" "text",
    "medications_prescribed" "text"[],
    "follow_up_instructions" "text",
    "next_appointment_date" "date",
    "document_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "visit_summaries_visit_type_check" CHECK (("visit_type" = ANY (ARRAY['office'::"text", 'emergency'::"text", 'urgent_care'::"text", 'telehealth'::"text", 'hospital'::"text", 'specialist'::"text", 'lab'::"text", 'imaging'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."visit_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_delivery_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_url" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "response_status" integer,
    "response_body" "text",
    "success" boolean DEFAULT false,
    "retry_count" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_delivery_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoho_lead_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "household_size" integer,
    "current_insurance" "text",
    "monthly_premium" "text",
    "coverage_preference" "text",
    "zip_code" "text",
    "primary_concern" "text",
    "contact_preference" "text" DEFAULT 'phone'::"text",
    "source_page" "text",
    "source_cta" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "referrer" "text",
    "zoho_lead_id" "text",
    "zoho_sync_status" "text" DEFAULT 'pending'::"text",
    "zoho_sync_attempts" integer DEFAULT 0,
    "zoho_last_sync_at" timestamp with time zone,
    "zoho_error_message" "text",
    "form_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pipeline_stage" "text" DEFAULT 'new'::"text",
    "assigned_to" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "lead_score" integer DEFAULT 0,
    "last_contacted_at" timestamp with time zone,
    "next_followup_at" timestamp with time zone,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "stage_changed_at" timestamp with time zone DEFAULT "now"(),
    "converted_at" timestamp with time zone,
    "lost_reason" "text",
    "org_id" "uuid",
    "interested_plans" "text"[],
    "quoted_plans" "text"[],
    "household_type" "text",
    "primary_age" integer,
    "spouse_age" integer,
    "dependent_count" integer DEFAULT 0,
    "pipeline_stage_id" "uuid",
    CONSTRAINT "zoho_lead_submissions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "zoho_lead_submissions_zoho_sync_status_check" CHECK (("zoho_sync_status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text", 'retrying'::"text"])))
);


ALTER TABLE "public"."zoho_lead_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoho_salesiq_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_type" "text" NOT NULL,
    "error_message" "text" NOT NULL,
    "widget_code" "text" NOT NULL,
    "user_agent" "text" NOT NULL,
    "url" "text" NOT NULL,
    "network_details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."zoho_salesiq_errors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoho_salesiq_health_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" NOT NULL,
    "is_loaded" boolean DEFAULT false,
    "is_ready" boolean DEFAULT false,
    "response_time_ms" integer,
    "checked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."zoho_salesiq_health_checks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_resources"
    ADD CONSTRAINT "admin_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_access"
    ADD CONSTRAINT "advisor_access_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."advisor_access"
    ADD CONSTRAINT "advisor_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_announcements"
    ADD CONSTRAINT "advisor_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_categories"
    ADD CONSTRAINT "advisor_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_categories"
    ADD CONSTRAINT "advisor_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."advisor_contact_directory"
    ADD CONSTRAINT "advisor_contact_directory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_content_bookmarks"
    ADD CONSTRAINT "advisor_content_bookmarks_content_id_advisor_id_key" UNIQUE ("content_id", "advisor_id");



ALTER TABLE ONLY "public"."advisor_content_bookmarks"
    ADD CONSTRAINT "advisor_content_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_content_categories"
    ADD CONSTRAINT "advisor_content_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_content_categories"
    ADD CONSTRAINT "advisor_content_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."advisor_content"
    ADD CONSTRAINT "advisor_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_content"
    ADD CONSTRAINT "advisor_content_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."advisor_content_views"
    ADD CONSTRAINT "advisor_content_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_dashboard_widgets"
    ADD CONSTRAINT "advisor_dashboard_widgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_dashboard_widgets"
    ADD CONSTRAINT "advisor_dashboard_widgets_widget_key_key" UNIQUE ("widget_key");



ALTER TABLE ONLY "public"."advisor_enrollment_links"
    ADD CONSTRAINT "advisor_enrollment_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_external_training_progress"
    ADD CONSTRAINT "advisor_external_training_pro_advisor_id_external_course_id_key" UNIQUE ("advisor_id", "external_course_id", "external_lesson_id");



ALTER TABLE ONLY "public"."advisor_external_training_progress"
    ADD CONSTRAINT "advisor_external_training_progress_advisor_id_module_id_key" UNIQUE ("advisor_id", "module_id");



ALTER TABLE ONLY "public"."advisor_external_training_progress"
    ADD CONSTRAINT "advisor_external_training_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_learning_paths"
    ADD CONSTRAINT "advisor_learning_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_lesson_completions"
    ADD CONSTRAINT "advisor_lesson_completions_advisor_id_lesson_id_key" UNIQUE ("advisor_id", "lesson_id");



ALTER TABLE ONLY "public"."advisor_lesson_completions"
    ADD CONSTRAINT "advisor_lesson_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_lms_enrollments"
    ADD CONSTRAINT "advisor_lms_enrollments_advisor_id_course_id_key" UNIQUE ("advisor_id", "course_id");



ALTER TABLE ONLY "public"."advisor_lms_enrollments"
    ADD CONSTRAINT "advisor_lms_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_meeting_attendees"
    ADD CONSTRAINT "advisor_meeting_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_meeting_reminders"
    ADD CONSTRAINT "advisor_meeting_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_meetings"
    ADD CONSTRAINT "advisor_meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_meetings"
    ADD CONSTRAINT "advisor_meetings_room_name_key" UNIQUE ("room_name");



ALTER TABLE ONLY "public"."advisor_nav_menu"
    ADD CONSTRAINT "advisor_nav_menu_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_plan_resources"
    ADD CONSTRAINT "advisor_plan_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_plan_resources"
    ADD CONSTRAINT "advisor_plan_resources_plan_slug_key" UNIQUE ("plan_slug");



ALTER TABLE ONLY "public"."advisor_portal_settings"
    ADD CONSTRAINT "advisor_portal_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."advisor_portal_settings"
    ADD CONSTRAINT "advisor_portal_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_agent_id_key" UNIQUE ("agent_id");



ALTER TABLE ONLY "public"."advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_quick_links"
    ADD CONSTRAINT "advisor_quick_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_terminal_commands"
    ADD CONSTRAINT "advisor_terminal_commands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_terminal_sessions"
    ADD CONSTRAINT "advisor_terminal_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_terminal_sessions"
    ADD CONSTRAINT "advisor_terminal_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."advisor_videos"
    ADD CONSTRAINT "advisor_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisors"
    ADD CONSTRAINT "advisors_advisor_id_key" UNIQUE ("advisor_id");



ALTER TABLE ONLY "public"."advisors"
    ADD CONSTRAINT "advisors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_automation_rules"
    ADD CONSTRAINT "ai_automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_lead_insights"
    ADD CONSTRAINT "ai_lead_insights_lead_id_key" UNIQUE ("lead_id");



ALTER TABLE ONLY "public"."ai_lead_insights"
    ADD CONSTRAINT "ai_lead_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_experiments"
    ADD CONSTRAINT "analytics_experiments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."approved_links"
    ADD CONSTRAINT "approved_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_events"
    ADD CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_execution_log"
    ADD CONSTRAINT "automation_execution_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_templates"
    ADD CONSTRAINT "automation_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benefit_usage"
    ADD CONSTRAINT "benefit_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benefits"
    ADD CONSTRAINT "benefits_benefit_key_key" UNIQUE ("benefit_key");



ALTER TABLE ONLY "public"."benefits"
    ADD CONSTRAINT "benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_articles"
    ADD CONSTRAINT "blog_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_articles"
    ADD CONSTRAINT "blog_articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_generation_logs"
    ADD CONSTRAINT "blog_generation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bulletin_email_notifications"
    ADD CONSTRAINT "bulletin_email_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bulletin_email_recipients"
    ADD CONSTRAINT "bulletin_email_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_items"
    ADD CONSTRAINT "claim_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."code_batches"
    ADD CONSTRAINT "code_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."code_inventory"
    ADD CONSTRAINT "code_inventory_org_id_code_type_code_key" UNIQUE ("org_id", "code_type", "code");



ALTER TABLE ONLY "public"."code_inventory"
    ADD CONSTRAINT "code_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cognito_forms"
    ADD CONSTRAINT "cognito_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cognito_forms"
    ADD CONSTRAINT "cognito_forms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."compliance_acknowledgments"
    ADD CONSTRAINT "compliance_acknowledgments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_acknowledgments"
    ADD CONSTRAINT "compliance_acknowledgments_user_id_document_id_key" UNIQUE ("user_id", "document_id");



ALTER TABLE ONLY "public"."compliance_documents"
    ADD CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_analytics"
    ADD CONSTRAINT "content_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversion_events"
    ADD CONSTRAINT "conversion_events_event_name_key" UNIQUE ("event_name");



ALTER TABLE ONLY "public"."conversion_events"
    ADD CONSTRAINT "conversion_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coverage_documents"
    ADD CONSTRAINT "coverage_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_accounts"
    ADD CONSTRAINT "crm_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_approval_actions"
    ADD CONSTRAINT "crm_approval_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_approval_processes"
    ADD CONSTRAINT "crm_approval_processes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_approval_requests"
    ADD CONSTRAINT "crm_approval_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_approval_steps"
    ADD CONSTRAINT "crm_approval_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_calendar_integrations"
    ADD CONSTRAINT "crm_calendar_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_calendar_integrations"
    ADD CONSTRAINT "crm_calendar_integrations_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."crm_campaign_members"
    ADD CONSTRAINT "crm_campaign_members_campaign_id_contact_id_key" UNIQUE ("campaign_id", "contact_id");



ALTER TABLE ONLY "public"."crm_campaign_members"
    ADD CONSTRAINT "crm_campaign_members_campaign_id_lead_id_key" UNIQUE ("campaign_id", "lead_id");



ALTER TABLE ONLY "public"."crm_campaign_members"
    ADD CONSTRAINT "crm_campaign_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_case_comments"
    ADD CONSTRAINT "crm_case_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_dashboard_layouts"
    ADD CONSTRAINT "crm_dashboard_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_dashboard_layouts"
    ADD CONSTRAINT "crm_dashboard_layouts_user_id_org_id_name_key" UNIQUE ("user_id", "org_id", "name");



ALTER TABLE ONLY "public"."crm_dashboard_notes"
    ADD CONSTRAINT "crm_dashboard_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_deal_contacts"
    ADD CONSTRAINT "crm_deal_contacts_deal_id_contact_id_key" UNIQUE ("deal_id", "contact_id");



ALTER TABLE ONLY "public"."crm_deal_contacts"
    ADD CONSTRAINT "crm_deal_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_deal_products"
    ADD CONSTRAINT "crm_deal_products_deal_id_product_id_key" UNIQUE ("deal_id", "product_id");



ALTER TABLE ONLY "public"."crm_deal_products"
    ADD CONSTRAINT "crm_deal_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_deal_stage_history"
    ADD CONSTRAINT "crm_deal_stage_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_deal_stages"
    ADD CONSTRAINT "crm_deal_stages_org_id_name_key" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."crm_deal_stages"
    ADD CONSTRAINT "crm_deal_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_default_layout_templates"
    ADD CONSTRAINT "crm_default_layout_templates_org_id_name_key" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."crm_default_layout_templates"
    ADD CONSTRAINT "crm_default_layout_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_attachments"
    ADD CONSTRAINT "crm_email_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_drafts"
    ADD CONSTRAINT "crm_email_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_log"
    ADD CONSTRAINT "crm_email_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_routing_rules"
    ADD CONSTRAINT "crm_email_routing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_sequence_enrollments"
    ADD CONSTRAINT "crm_email_sequence_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_sequence_steps"
    ADD CONSTRAINT "crm_email_sequence_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_sequence_steps"
    ADD CONSTRAINT "crm_email_sequence_steps_sequence_id_step_number_key" UNIQUE ("sequence_id", "step_number");



ALTER TABLE ONLY "public"."crm_email_sequences"
    ADD CONSTRAINT "crm_email_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_signatures"
    ADD CONSTRAINT "crm_email_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_threads"
    ADD CONSTRAINT "crm_email_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_email_tracking"
    ADD CONSTRAINT "crm_email_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_forecast_entries"
    ADD CONSTRAINT "crm_forecast_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_forecast_entries"
    ADD CONSTRAINT "crm_forecast_entries_unique_deal" UNIQUE ("forecast_id", "deal_id");



ALTER TABLE ONLY "public"."crm_forecasts"
    ADD CONSTRAINT "crm_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_invoice_line_items"
    ADD CONSTRAINT "crm_invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_invoice_payments"
    ADD CONSTRAINT "crm_invoice_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_lead_health_quotes"
    ADD CONSTRAINT "crm_lead_health_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_lead_plan_interests"
    ADD CONSTRAINT "crm_lead_plan_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_meeting_bookings"
    ADD CONSTRAINT "crm_meeting_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_meeting_schedules"
    ADD CONSTRAINT "crm_meeting_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_meeting_schedules"
    ADD CONSTRAINT "crm_meeting_schedules_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."crm_pipeline_stages"
    ADD CONSTRAINT "crm_pipeline_stages_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."crm_pipeline_stages"
    ADD CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_price_book_items"
    ADD CONSTRAINT "crm_price_book_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_price_book_items"
    ADD CONSTRAINT "crm_price_book_items_price_book_id_product_id_key" UNIQUE ("price_book_id", "product_id");



ALTER TABLE ONLY "public"."crm_price_books"
    ADD CONSTRAINT "crm_price_books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_products"
    ADD CONSTRAINT "crm_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_purchase_order_line_items"
    ADD CONSTRAINT "crm_purchase_order_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_purchase_orders"
    ADD CONSTRAINT "crm_purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_quote_line_items"
    ADD CONSTRAINT "crm_quote_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_sales_order_line_items"
    ADD CONSTRAINT "crm_sales_order_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_saved_views"
    ADD CONSTRAINT "crm_saved_views_org_id_module_name_owner_id_key" UNIQUE ("org_id", "module", "name", "owner_id");



ALTER TABLE ONLY "public"."crm_saved_views"
    ADD CONSTRAINT "crm_saved_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_studio_fields"
    ADD CONSTRAINT "crm_studio_fields_module_id_api_name_key" UNIQUE ("module_id", "api_name");



ALTER TABLE ONLY "public"."crm_studio_fields"
    ADD CONSTRAINT "crm_studio_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_studio_layouts"
    ADD CONSTRAINT "crm_studio_layouts_module_id_api_name_key" UNIQUE ("module_id", "api_name");



ALTER TABLE ONLY "public"."crm_studio_layouts"
    ADD CONSTRAINT "crm_studio_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_studio_modules"
    ADD CONSTRAINT "crm_studio_modules_org_id_api_name_key" UNIQUE ("org_id", "api_name");



ALTER TABLE ONLY "public"."crm_studio_modules"
    ADD CONSTRAINT "crm_studio_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_studio_validation_rules"
    ADD CONSTRAINT "crm_studio_validation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_studio_views"
    ADD CONSTRAINT "crm_studio_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_template_folders"
    ADD CONSTRAINT "crm_template_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_templates"
    ADD CONSTRAINT "crm_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_user_goals"
    ADD CONSTRAINT "crm_user_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_vendors"
    ADD CONSTRAINT "crm_vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_web_form_submissions"
    ADD CONSTRAINT "crm_web_form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_web_forms"
    ADD CONSTRAINT "crm_web_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_web_forms"
    ADD CONSTRAINT "crm_web_forms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."crm_website_quote_sync"
    ADD CONSTRAINT "crm_website_quote_sync_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_analytics_summary"
    ADD CONSTRAINT "daily_analytics_summary_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_analytics_summary"
    ADD CONSTRAINT "daily_analytics_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_push_subscriptions"
    ADD CONSTRAINT "device_push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_access_log"
    ADD CONSTRAINT "document_access_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."educational_content"
    ADD CONSTRAINT "educational_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."educational_content"
    ADD CONSTRAINT "educational_content_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."email_schedules"
    ADD CONSTRAINT "email_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_tracking"
    ADD CONSTRAINT "email_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollment_intent"
    ADD CONSTRAINT "enrollment_intent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."esignature_documents"
    ADD CONSTRAINT "esignature_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."esignature_providers"
    ADD CONSTRAINT "esignature_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."external_lms_courses"
    ADD CONSTRAINT "external_lms_courses_lms_provider_external_id_key" UNIQUE ("lms_provider", "external_id");



ALTER TABLE ONLY "public"."external_lms_courses"
    ADD CONSTRAINT "external_lms_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_lms_lessons"
    ADD CONSTRAINT "external_lms_lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq_items"
    ADD CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gemini_prompts"
    ADD CONSTRAINT "gemini_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."geo_state_settings"
    ADD CONSTRAINT "geo_state_settings_pkey" PRIMARY KEY ("state_code");



ALTER TABLE ONLY "public"."handbooks"
    ADD CONSTRAINT "handbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."handbooks"
    ADD CONSTRAINT "handbooks_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."health_history"
    ADD CONSTRAINT "health_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."healthcare_plan_categories"
    ADD CONSTRAINT "healthcare_plan_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."healthcare_plan_categories"
    ADD CONSTRAINT "healthcare_plan_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."immunizations"
    ADD CONSTRAINT "immunizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_health"
    ADD CONSTRAINT "integration_health_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_logs"
    ADD CONSTRAINT "interaction_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_results"
    ADD CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_notifications"
    ADD CONSTRAINT "lead_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_routing_logs"
    ADD CONSTRAINT "lead_routing_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_scoring_config"
    ADD CONSTRAINT "lead_scoring_config_factor_key_key" UNIQUE ("factor_key");



ALTER TABLE ONLY "public"."lead_scoring_config"
    ADD CONSTRAINT "lead_scoring_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_submissions"
    ADD CONSTRAINT "lead_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_accounts"
    ADD CONSTRAINT "mail_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_accounts"
    ADD CONSTRAINT "mail_accounts_unique_email" UNIQUE ("org_id", "email_address");



ALTER TABLE ONLY "public"."mail_audit_log"
    ADD CONSTRAINT "mail_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_domains"
    ADD CONSTRAINT "mail_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_domains"
    ADD CONSTRAINT "mail_domains_unique" UNIQUE ("org_id", "domain");



ALTER TABLE ONLY "public"."mail_folders"
    ADD CONSTRAINT "mail_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_folders"
    ADD CONSTRAINT "mail_folders_unique" UNIQUE ("account_id", "provider_folder_id");



ALTER TABLE ONLY "public"."mail_message_attachments"
    ADD CONSTRAINT "mail_message_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_messages"
    ADD CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_messages"
    ADD CONSTRAINT "mail_messages_unique" UNIQUE ("account_id", "provider_message_id");



ALTER TABLE ONLY "public"."mail_rules"
    ADD CONSTRAINT "mail_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_sender_identities"
    ADD CONSTRAINT "mail_sender_identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_sender_identities"
    ADD CONSTRAINT "mail_sender_identities_unique" UNIQUE ("org_id", "email_address");



ALTER TABLE ONLY "public"."mail_shared_access"
    ADD CONSTRAINT "mail_shared_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mail_shared_access"
    ADD CONSTRAINT "mail_shared_access_unique" UNIQUE ("account_id", "grantee_user_id");



ALTER TABLE ONLY "public"."mail_sync_jobs"
    ADD CONSTRAINT "mail_sync_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_campaigns"
    ADD CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maternity_coverage"
    ADD CONSTRAINT "maternity_coverage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maternity_coverage_stages"
    ADD CONSTRAINT "maternity_coverage_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_invitations"
    ADD CONSTRAINT "meeting_invitations_meeting_id_advisor_id_key" UNIQUE ("meeting_id", "advisor_id");



ALTER TABLE ONLY "public"."meeting_invitations"
    ADD CONSTRAINT "meeting_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_templates"
    ADD CONSTRAINT "meeting_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_coverage"
    ADD CONSTRAINT "member_coverage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_dependents"
    ADD CONSTRAINT "member_dependents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_documents"
    ADD CONSTRAINT "member_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_notifications"
    ADD CONSTRAINT "member_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_profiles"
    ADD CONSTRAINT "member_profiles_membership_number_key" UNIQUE ("membership_number");



ALTER TABLE ONLY "public"."member_profiles"
    ADD CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."navigation_analytics"
    ADD CONSTRAINT "navigation_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."navigation_items"
    ADD CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_campaigns"
    ADD CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_queue"
    ADD CONSTRAINT "newsletter_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_queue"
    ADD CONSTRAINT "newsletter_queue_tracking_token_key" UNIQUE ("tracking_token");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_notifications"
    ADD CONSTRAINT "note_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_shares"
    ADD CONSTRAINT "note_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_org_id_key" UNIQUE ("user_id", "org_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_advisor_id_step_id_key" UNIQUE ("advisor_id", "step_id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_responses"
    ADD CONSTRAINT "onboarding_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_steps"
    ADD CONSTRAINT "onboarding_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_user_id_org_id_key" UNIQUE ("user_id", "org_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."outlook_config"
    ADD CONSTRAINT "outlook_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_performance"
    ADD CONSTRAINT "page_performance_page_path_date_key" UNIQUE ("page_path", "date");



ALTER TABLE ONLY "public"."page_performance"
    ADD CONSTRAINT "page_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_processors"
    ADD CONSTRAINT "payment_processors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_category_features"
    ADD CONSTRAINT "plan_category_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_category_profiles"
    ADD CONSTRAINT "plan_category_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_features"
    ADD CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_pricing"
    ADD CONSTRAINT "plan_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_selections"
    ADD CONSTRAINT "plan_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_sharing_details"
    ADD CONSTRAINT "plan_sharing_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_sharing_details"
    ADD CONSTRAINT "plan_sharing_details_plan_id_key" UNIQUE ("plan_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "priority_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."priority_lanes"
    ADD CONSTRAINT "priority_lanes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_locations"
    ADD CONSTRAINT "provider_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_npi_key" UNIQUE ("npi");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quick_actions"
    ADD CONSTRAINT "quick_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_calculator_views"
    ADD CONSTRAINT "rate_calculator_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_configuration"
    ADD CONSTRAINT "rate_configuration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_exports"
    ADD CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_library"
    ADD CONSTRAINT "resource_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_library"
    ADD CONSTRAINT "resource_library_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."resource_topics"
    ADD CONSTRAINT "resource_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_topics"
    ADD CONSTRAINT "resource_topics_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_org_id_role_permission_id_key" UNIQUE ("org_id", "role", "permission_id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_reports"
    ADD CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_alert_log"
    ADD CONSTRAINT "security_alert_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_alert_webhooks"
    ADD CONSTRAINT "security_alert_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_backlinks"
    ADD CONSTRAINT "seo_backlinks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_backlinks"
    ADD CONSTRAINT "seo_backlinks_site_url_source_url_target_url_key" UNIQUE ("site_url", "source_url", "target_url");



ALTER TABLE ONLY "public"."seo_daily_summary"
    ADD CONSTRAINT "seo_daily_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_daily_summary"
    ADD CONSTRAINT "seo_daily_summary_site_url_date_key" UNIQUE ("site_url", "date");



ALTER TABLE ONLY "public"."seo_google_credentials"
    ADD CONSTRAINT "seo_google_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_google_credentials"
    ADD CONSTRAINT "seo_google_credentials_site_url_key" UNIQUE ("site_url");



ALTER TABLE ONLY "public"."seo_keyword_rankings"
    ADD CONSTRAINT "seo_keyword_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_keyword_rankings"
    ADD CONSTRAINT "seo_keyword_rankings_site_url_keyword_date_key" UNIQUE ("site_url", "keyword", "date");



ALTER TABLE ONLY "public"."seo_keywords"
    ADD CONSTRAINT "seo_keywords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_keywords"
    ADD CONSTRAINT "seo_keywords_site_url_keyword_date_key" UNIQUE ("site_url", "keyword", "date");



ALTER TABLE ONLY "public"."seo_metadata"
    ADD CONSTRAINT "seo_metadata_page_path_key" UNIQUE ("page_path");



ALTER TABLE ONLY "public"."seo_metadata"
    ADD CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_pages"
    ADD CONSTRAINT "seo_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_pages"
    ADD CONSTRAINT "seo_pages_site_url_page_url_date_key" UNIQUE ("site_url", "page_url", "date");



ALTER TABLE ONLY "public"."seo_sync_logs"
    ADD CONSTRAINT "seo_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sequences"
    ADD CONSTRAINT "sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_analytics"
    ADD CONSTRAINT "site_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_category_setting_key_key" UNIQUE ("category", "setting_key");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_accounts"
    ADD CONSTRAINT "sms_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_log"
    ADD CONSTRAINT "sms_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sop_categories"
    ADD CONSTRAINT "sop_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sop_categories"
    ADD CONSTRAINT "sop_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sop_documents"
    ADD CONSTRAINT "sop_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_firing_rules"
    ADD CONSTRAINT "tag_firing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."terminal_tool_permissions"
    ADD CONSTRAINT "terminal_tool_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."terminal_tool_permissions"
    ADD CONSTRAINT "terminal_tool_permissions_tool_name_key" UNIQUE ("tool_name");



ALTER TABLE ONLY "public"."ticket_categories"
    ADD CONSTRAINT "ticket_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ticket_categories"
    ADD CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_categories"
    ADD CONSTRAINT "ticket_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tracking_event_log"
    ADD CONSTRAINT "tracking_event_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_platforms"
    ADD CONSTRAINT "tracking_platforms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_platforms"
    ADD CONSTRAINT "tracking_platforms_platform_name_key" UNIQUE ("platform_name");



ALTER TABLE ONLY "public"."tracking_snippets"
    ADD CONSTRAINT "tracking_snippets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_tags"
    ADD CONSTRAINT "tracking_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."traffic_sources"
    ADD CONSTRAINT "traffic_sources_date_source_type_source_name_key" UNIQUE ("date", "source_type", "source_name");



ALTER TABLE ONLY "public"."traffic_sources"
    ADD CONSTRAINT "traffic_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_modules"
    ADD CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_progress"
    ADD CONSTRAINT "training_progress_advisor_id_module_id_key" UNIQUE ("advisor_id", "module_id");



ALTER TABLE ONLY "public"."training_progress"
    ADD CONSTRAINT "training_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "unique_channel_slug_per_org" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "unique_chat_member" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "unique_contact_in_lane" UNIQUE ("org_id", "lane_id", "contact_id");



ALTER TABLE ONLY "public"."crm_email_signatures"
    ADD CONSTRAINT "unique_default_signature" UNIQUE ("user_id", "org_id", "is_default") DEFERRABLE;



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "unique_lead_in_lane" UNIQUE ("org_id", "lane_id", "lead_id");



ALTER TABLE ONLY "public"."crm_lead_plan_interests"
    ADD CONSTRAINT "unique_lead_plan_interest" UNIQUE ("lead_id", "plan_id", "family_size");



ALTER TABLE ONLY "public"."priority_lanes"
    ADD CONSTRAINT "unique_org_lane_name" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "unique_pending_invite" UNIQUE ("org_id", "email", "status") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."device_push_subscriptions"
    ADD CONSTRAINT "unique_push_endpoint" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "unique_user_achievement" UNIQUE ("user_id", "org_id", "achievement_id");



ALTER TABLE ONLY "public"."crm_website_quote_sync"
    ADD CONSTRAINT "unique_website_sync" UNIQUE ("website_submission_id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_navigation_preferences"
    ADD CONSTRAINT "user_navigation_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_navigation_preferences"
    ADD CONSTRAINT "user_navigation_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_org_id_key" UNIQUE ("user_id", "org_id");



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."utm_campaigns"
    ADD CONSTRAINT "utm_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_summaries"
    ADD CONSTRAINT "visit_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_delivery_logs"
    ADD CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wordpress_courses"
    ADD CONSTRAINT "wordpress_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wordpress_courses"
    ADD CONSTRAINT "wordpress_courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."wordpress_courses"
    ADD CONSTRAINT "wordpress_courses_wp_course_id_key" UNIQUE ("wp_course_id");



ALTER TABLE ONLY "public"."zoho_lead_submissions"
    ADD CONSTRAINT "zoho_lead_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoho_salesiq_errors"
    ADD CONSTRAINT "zoho_salesiq_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoho_salesiq_health_checks"
    ADD CONSTRAINT "zoho_salesiq_health_checks_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_actor" ON "public"."activities" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "idx_activities_created_at" ON "public"."activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activities_lead" ON "public"."activities" USING "btree" ("lead_id", "created_at" DESC) WHERE ("lead_id" IS NOT NULL);



CREATE INDEX "idx_activities_org_created" ON "public"."activities" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_activities_type" ON "public"."activities" USING "btree" ("org_id", "activity_type", "created_at" DESC);



CREATE INDEX "idx_admin_resources_category" ON "public"."admin_resources" USING "btree" ("category");



CREATE INDEX "idx_admin_resources_created_by" ON "public"."admin_resources" USING "btree" ("created_by");



CREATE INDEX "idx_admin_resources_org" ON "public"."admin_resources" USING "btree" ("org_id");



CREATE INDEX "idx_admin_users_email" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "idx_admin_users_role" ON "public"."admin_users" USING "btree" ("role");



CREATE INDEX "idx_admin_users_status" ON "public"."admin_users" USING "btree" ("status");



CREATE INDEX "idx_advisor_access_email" ON "public"."advisor_access" USING "btree" ("lower"("email"));



CREATE INDEX "idx_advisor_access_has_access" ON "public"."advisor_access" USING "btree" ("has_advisor_page_access") WHERE ("has_advisor_page_access" = true);



CREATE INDEX "idx_advisor_announcements_created_by" ON "public"."advisor_announcements" USING "btree" ("created_by");



CREATE INDEX "idx_advisor_announcements_dates" ON "public"."advisor_announcements" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_advisor_categories_slug" ON "public"."advisor_categories" USING "btree" ("slug");



CREATE INDEX "idx_advisor_categories_type" ON "public"."advisor_categories" USING "btree" ("type");



CREATE INDEX "idx_advisor_content_bookmarks_advisor" ON "public"."advisor_content_bookmarks" USING "btree" ("advisor_id");



CREATE INDEX "idx_advisor_content_bookmarks_content" ON "public"."advisor_content_bookmarks" USING "btree" ("content_id");



CREATE INDEX "idx_advisor_content_category" ON "public"."advisor_content" USING "btree" ("category_id");



CREATE INDEX "idx_advisor_content_category_published" ON "public"."advisor_content" USING "btree" ("category_id", "is_published");



CREATE INDEX "idx_advisor_content_featured" ON "public"."advisor_content" USING "btree" ("is_featured") WHERE (("is_featured" = true) AND ("content_type" = 'bulletin'::"text"));



CREATE INDEX "idx_advisor_content_notification_sent" ON "public"."advisor_content" USING "btree" ("notification_sent_at") WHERE ("content_type" = 'bulletin'::"text");



CREATE INDEX "idx_advisor_content_published" ON "public"."advisor_content" USING "btree" ("is_published");



CREATE INDEX "idx_advisor_content_published_bulletins" ON "public"."advisor_content" USING "btree" ("published_date" DESC) WHERE (("content_type" = 'bulletin'::"text") AND ("is_published" = true));



CREATE INDEX "idx_advisor_content_published_date" ON "public"."advisor_content" USING "btree" ("published_date" DESC);



CREATE INDEX "idx_advisor_content_slug" ON "public"."advisor_content" USING "btree" ("slug");



CREATE INDEX "idx_advisor_content_type" ON "public"."advisor_content" USING "btree" ("content_type");



CREATE INDEX "idx_advisor_content_views_advisor" ON "public"."advisor_content_views" USING "btree" ("advisor_id");



CREATE INDEX "idx_advisor_content_views_content" ON "public"."advisor_content_views" USING "btree" ("content_id");



CREATE INDEX "idx_advisor_external_training_progress_verified_by" ON "public"."advisor_external_training_progress" USING "btree" ("verified_by");



CREATE INDEX "idx_advisor_learning_paths_created_by" ON "public"."advisor_learning_paths" USING "btree" ("created_by");



CREATE INDEX "idx_advisor_learning_paths_order" ON "public"."advisor_learning_paths" USING "btree" ("order_index");



CREATE INDEX "idx_advisor_lesson_completions_lesson_id" ON "public"."advisor_lesson_completions" USING "btree" ("lesson_id");



CREATE INDEX "idx_advisor_meeting_attendees_advisor" ON "public"."advisor_meeting_attendees" USING "btree" ("advisor_id");



CREATE INDEX "idx_advisor_meeting_attendees_meeting" ON "public"."advisor_meeting_attendees" USING "btree" ("meeting_id");



CREATE INDEX "idx_advisor_meeting_attendees_user_id" ON "public"."advisor_meeting_attendees" USING "btree" ("user_id");



CREATE INDEX "idx_advisor_meeting_reminders_meeting" ON "public"."advisor_meeting_reminders" USING "btree" ("meeting_id");



CREATE INDEX "idx_advisor_meeting_reminders_send_at" ON "public"."advisor_meeting_reminders" USING "btree" ("send_at");



CREATE INDEX "idx_advisor_meetings_host" ON "public"."advisor_meetings" USING "btree" ("host_id");



CREATE INDEX "idx_advisor_meetings_meeting_type" ON "public"."advisor_meetings" USING "btree" ("meeting_type");



CREATE INDEX "idx_advisor_meetings_org_id" ON "public"."advisor_meetings" USING "btree" ("org_id");



CREATE INDEX "idx_advisor_meetings_room_name" ON "public"."advisor_meetings" USING "btree" ("room_name");



CREATE INDEX "idx_advisor_meetings_scheduled_at" ON "public"."advisor_meetings" USING "btree" ("scheduled_at");



CREATE INDEX "idx_advisor_meetings_status" ON "public"."advisor_meetings" USING "btree" ("status");



CREATE INDEX "idx_advisor_meetings_visibility" ON "public"."advisor_meetings" USING "btree" ("visibility");



CREATE INDEX "idx_advisor_nav_menu_created_by" ON "public"."advisor_nav_menu" USING "btree" ("created_by");



CREATE INDEX "idx_advisor_nav_menu_order" ON "public"."advisor_nav_menu" USING "btree" ("order_index");



CREATE UNIQUE INDEX "idx_advisor_nav_menu_url_unique" ON "public"."advisor_nav_menu" USING "btree" ("url") WHERE ("url" IS NOT NULL);



CREATE INDEX "idx_advisor_plan_resources_active" ON "public"."advisor_plan_resources" USING "btree" ("is_active");



CREATE INDEX "idx_advisor_plan_resources_created_by" ON "public"."advisor_plan_resources" USING "btree" ("created_by");



CREATE INDEX "idx_advisor_plan_resources_order" ON "public"."advisor_plan_resources" USING "btree" ("order_index");



CREATE INDEX "idx_advisor_plan_resources_slug" ON "public"."advisor_plan_resources" USING "btree" ("plan_slug");



CREATE INDEX "idx_advisor_plan_resources_updated_by" ON "public"."advisor_plan_resources" USING "btree" ("updated_by");



CREATE INDEX "idx_advisor_portal_settings_updated_by" ON "public"."advisor_portal_settings" USING "btree" ("updated_by");



CREATE INDEX "idx_advisor_profiles_agent_id" ON "public"."advisor_profiles" USING "btree" ("agent_id") WHERE ("agent_id" IS NOT NULL);



CREATE INDEX "idx_advisor_profiles_email" ON "public"."advisor_profiles" USING "btree" ("email");



CREATE INDEX "idx_advisor_profiles_org_id" ON "public"."advisor_profiles" USING "btree" ("org_id");



CREATE INDEX "idx_advisor_profiles_status" ON "public"."advisor_profiles" USING "btree" ("status");



CREATE INDEX "idx_advisor_profiles_user_id" ON "public"."advisor_profiles" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_advisor_quick_links_active" ON "public"."advisor_quick_links" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_advisor_quick_links_category" ON "public"."advisor_quick_links" USING "btree" ("category");



CREATE INDEX "idx_advisor_quick_links_created_by" ON "public"."advisor_quick_links" USING "btree" ("created_by");



CREATE INDEX "idx_advisor_quick_links_dashboard_actions" ON "public"."advisor_quick_links" USING "btree" ("order_index") WHERE (("category" = 'dashboard_actions'::"text") AND ("is_active" = true));



CREATE INDEX "idx_advisor_quick_links_order" ON "public"."advisor_quick_links" USING "btree" ("order_index");



CREATE INDEX "idx_advisors_active" ON "public"."advisors" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_advisors_advisor_id" ON "public"."advisors" USING "btree" ("advisor_id");



CREATE INDEX "idx_advisors_agent_id" ON "public"."advisors" USING "btree" ("agent_id");



CREATE INDEX "idx_advisors_agent_type" ON "public"."advisors" USING "btree" ("agent_type");



CREATE INDEX "idx_advisors_is_active" ON "public"."advisors" USING "btree" ("is_active");



CREATE INDEX "idx_advisors_name_search" ON "public"."advisors" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text")) || ' '::"text") || COALESCE("company", ''::"text"))));



CREATE INDEX "idx_advisors_parent_id" ON "public"."advisors" USING "btree" ("parent_id");



CREATE INDEX "idx_advisors_state" ON "public"."advisors" USING "btree" ("state");



CREATE INDEX "idx_advisors_state_filter" ON "public"."advisors" USING "btree" ("state") WHERE ("state" IS NOT NULL);



CREATE INDEX "idx_advisors_status" ON "public"."advisors" USING "btree" ("status");



CREATE INDEX "idx_ai_automation_rules_active" ON "public"."ai_automation_rules" USING "btree" ("is_active", "trigger_type");



CREATE INDEX "idx_ai_automation_rules_created_by" ON "public"."ai_automation_rules" USING "btree" ("created_by");



CREATE INDEX "idx_ai_lead_insights_ai_score" ON "public"."ai_lead_insights" USING "btree" ("ai_score" DESC);



CREATE INDEX "idx_ai_lead_insights_lead_id" ON "public"."ai_lead_insights" USING "btree" ("lead_id");



CREATE INDEX "idx_ai_lead_insights_urgency" ON "public"."ai_lead_insights" USING "btree" ("follow_up_urgency");



CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_page_path" ON "public"."analytics_events" USING "btree" ("page_path");



CREATE INDEX "idx_analytics_events_session_id" ON "public"."analytics_events" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_experiments_created_by" ON "public"."analytics_experiments" USING "btree" ("created_by");



CREATE INDEX "idx_analytics_experiments_dates" ON "public"."analytics_experiments" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_analytics_experiments_status" ON "public"."analytics_experiments" USING "btree" ("status");



CREATE INDEX "idx_analytics_sessions_country" ON "public"."analytics_sessions" USING "btree" ("country");



CREATE INDEX "idx_analytics_sessions_device_type" ON "public"."analytics_sessions" USING "btree" ("device_type");



CREATE INDEX "idx_analytics_sessions_is_bounce" ON "public"."analytics_sessions" USING "btree" ("is_bounce");



CREATE INDEX "idx_analytics_sessions_referrer_source" ON "public"."analytics_sessions" USING "btree" ("referrer_source");



CREATE INDEX "idx_analytics_sessions_session_id" ON "public"."analytics_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_sessions_started_at" ON "public"."analytics_sessions" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_analytics_sessions_user_id" ON "public"."analytics_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_approved_links_category" ON "public"."approved_links" USING "btree" ("category");



CREATE INDEX "idx_approved_links_created_by" ON "public"."approved_links" USING "btree" ("created_by");



CREATE INDEX "idx_assignments_assignee" ON "public"."assignments" USING "btree" ("assignee_id");



CREATE INDEX "idx_assignments_created_by" ON "public"."assignments" USING "btree" ("created_by");



CREATE INDEX "idx_assignments_due_date" ON "public"."assignments" USING "btree" ("due_date");



CREATE INDEX "idx_assignments_priority" ON "public"."assignments" USING "btree" ("priority");



CREATE INDEX "idx_assignments_status" ON "public"."assignments" USING "btree" ("status");



CREATE INDEX "idx_audit_events_actor_created" ON "public"."audit_events" USING "btree" ("actor_user_id", "created_at" DESC);



CREATE INDEX "idx_audit_events_entity" ON "public"."audit_events" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_events_org_created" ON "public"."audit_events" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_auto_exec_log_lead" ON "public"."automation_execution_log" USING "btree" ("lead_id");



CREATE INDEX "idx_auto_exec_log_rule" ON "public"."automation_execution_log" USING "btree" ("rule_id", "executed_at" DESC);



CREATE INDEX "idx_auto_exec_log_status" ON "public"."automation_execution_log" USING "btree" ("status", "executed_at" DESC);



CREATE INDEX "idx_benefit_usage_coverage_id" ON "public"."benefit_usage" USING "btree" ("coverage_id");



CREATE INDEX "idx_benefit_usage_member_id" ON "public"."benefit_usage" USING "btree" ("member_id");



CREATE INDEX "idx_benefits_active" ON "public"."benefits" USING "btree" ("is_active");



CREATE INDEX "idx_benefits_order" ON "public"."benefits" USING "btree" ("order_index");



CREATE INDEX "idx_blog_articles_category" ON "public"."blog_articles" USING "btree" ("category");



CREATE INDEX "idx_blog_articles_published" ON "public"."blog_articles" USING "btree" ("is_published");



CREATE INDEX "idx_blog_articles_published_date" ON "public"."blog_articles" USING "btree" ("published_date" DESC);



CREATE INDEX "idx_blog_articles_slug" ON "public"."blog_articles" USING "btree" ("slug");



CREATE INDEX "idx_blog_categories_slug" ON "public"."blog_categories" USING "btree" ("slug");



CREATE INDEX "idx_blog_generation_logs_created" ON "public"."blog_generation_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_blog_generation_logs_created_by" ON "public"."blog_generation_logs" USING "btree" ("created_by");



CREATE INDEX "idx_blog_generation_logs_prompt" ON "public"."blog_generation_logs" USING "btree" ("prompt_id");



CREATE INDEX "idx_blog_generation_logs_success" ON "public"."blog_generation_logs" USING "btree" ("success");



CREATE INDEX "idx_bulletin_email_notifications_bulletin_id" ON "public"."bulletin_email_notifications" USING "btree" ("bulletin_id");



CREATE INDEX "idx_bulletin_email_notifications_sent_by" ON "public"."bulletin_email_notifications" USING "btree" ("sent_by");



CREATE INDEX "idx_bulletin_email_notifications_status" ON "public"."bulletin_email_notifications" USING "btree" ("status");



CREATE INDEX "idx_bulletin_email_recipients_advisor_id" ON "public"."bulletin_email_recipients" USING "btree" ("advisor_id");



CREATE INDEX "idx_bulletin_email_recipients_notification_id" ON "public"."bulletin_email_recipients" USING "btree" ("notification_id");



CREATE INDEX "idx_calendar_events_assigned" ON "public"."calendar_events" USING "btree" ("assigned_to");



CREATE INDEX "idx_calendar_events_created_by" ON "public"."calendar_events" USING "btree" ("created_by");



CREATE INDEX "idx_calendar_events_lead" ON "public"."calendar_events" USING "btree" ("lead_id");



CREATE INDEX "idx_calendar_events_org" ON "public"."calendar_events" USING "btree" ("org_id");



CREATE INDEX "idx_calendar_events_original" ON "public"."calendar_events" USING "btree" ("original_event_id");



CREATE INDEX "idx_calendar_events_start" ON "public"."calendar_events" USING "btree" ("start_time");



CREATE INDEX "idx_calendar_events_status" ON "public"."calendar_events" USING "btree" ("status");



CREATE INDEX "idx_certifications_advisor" ON "public"."certifications" USING "btree" ("advisor_id");



CREATE INDEX "idx_certifications_org_id" ON "public"."certifications" USING "btree" ("org_id");



CREATE INDEX "idx_chat_conversations_created_by" ON "public"."chat_conversations" USING "btree" ("created_by");



CREATE INDEX "idx_chat_conversations_last_msg" ON "public"."chat_conversations" USING "btree" ("org_id", "last_message_at" DESC);



CREATE INDEX "idx_chat_conversations_org" ON "public"."chat_conversations" USING "btree" ("org_id", "type", "is_archived");



CREATE INDEX "idx_chat_members_conversation" ON "public"."chat_members" USING "btree" ("conversation_id");



CREATE INDEX "idx_chat_members_user" ON "public"."chat_members" USING "btree" ("user_id", "conversation_id");



CREATE INDEX "idx_chat_messages_conversation" ON "public"."chat_messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_chat_messages_deleted_by" ON "public"."chat_messages" USING "btree" ("deleted_by");



CREATE INDEX "idx_chat_messages_reply_to_id" ON "public"."chat_messages" USING "btree" ("reply_to_id");



CREATE INDEX "idx_chat_messages_search" ON "public"."chat_messages" USING "gin" ("to_tsvector"('"english"'::"regconfig", "content")) WHERE ("is_deleted" = false);



CREATE INDEX "idx_chat_messages_sender" ON "public"."chat_messages" USING "btree" ("sender_id", "created_at" DESC);



CREATE INDEX "idx_claim_items_claim_id" ON "public"."claim_items" USING "btree" ("claim_id");



CREATE INDEX "idx_claims_claim_number" ON "public"."claims" USING "btree" ("claim_number");



CREATE INDEX "idx_claims_dependent_id" ON "public"."claims" USING "btree" ("dependent_id");



CREATE INDEX "idx_claims_member_id" ON "public"."claims" USING "btree" ("member_id");



CREATE INDEX "idx_claims_provider_id" ON "public"."claims" USING "btree" ("provider_id");



CREATE INDEX "idx_claims_reviewed_by" ON "public"."claims" USING "btree" ("reviewed_by");



CREATE INDEX "idx_claims_status" ON "public"."claims" USING "btree" ("status");



CREATE INDEX "idx_code_batches_created_by" ON "public"."code_batches" USING "btree" ("created_by");



CREATE INDEX "idx_code_batches_org_id" ON "public"."code_batches" USING "btree" ("org_id");



CREATE INDEX "idx_code_inventory_assigned_to_user" ON "public"."code_inventory" USING "btree" ("assigned_to_user");



CREATE INDEX "idx_code_inventory_created_by" ON "public"."code_inventory" USING "btree" ("created_by");



CREATE INDEX "idx_code_inventory_org" ON "public"."code_inventory" USING "btree" ("org_id");



CREATE INDEX "idx_code_inventory_status" ON "public"."code_inventory" USING "btree" ("status");



CREATE INDEX "idx_code_inventory_type" ON "public"."code_inventory" USING "btree" ("code_type");



CREATE INDEX "idx_cognito_forms_active" ON "public"."cognito_forms" USING "btree" ("is_active");



CREATE INDEX "idx_cognito_forms_category" ON "public"."cognito_forms" USING "btree" ("category");



CREATE INDEX "idx_cognito_forms_menu" ON "public"."cognito_forms" USING "btree" ("show_in_menu", "menu_section", "menu_order");



CREATE INDEX "idx_cognito_forms_slug" ON "public"."cognito_forms" USING "btree" ("slug");



CREATE INDEX "idx_compliance_acknowledgments_document_id" ON "public"."compliance_acknowledgments" USING "btree" ("document_id");



CREATE INDEX "idx_compliance_acknowledgments_user_id" ON "public"."compliance_acknowledgments" USING "btree" ("user_id");



CREATE INDEX "idx_compliance_documents_org_id" ON "public"."compliance_documents" USING "btree" ("org_id");



CREATE INDEX "idx_contact_directory_department" ON "public"."advisor_contact_directory" USING "btree" ("department");



CREATE INDEX "idx_contact_directory_display_order" ON "public"."advisor_contact_directory" USING "btree" ("display_order");



CREATE INDEX "idx_contact_directory_is_active" ON "public"."advisor_contact_directory" USING "btree" ("is_active");



CREATE INDEX "idx_content_analytics_content" ON "public"."content_analytics" USING "btree" ("content_id", "content_type");



CREATE INDEX "idx_content_analytics_date" ON "public"."content_analytics" USING "btree" ("date" DESC);



CREATE INDEX "idx_content_analytics_type" ON "public"."content_analytics" USING "btree" ("content_type");



CREATE INDEX "idx_conversations_assigned_to" ON "public"."conversations" USING "btree" ("assigned_to");



CREATE INDEX "idx_conversations_org_id" ON "public"."conversations" USING "btree" ("org_id");



CREATE INDEX "idx_conversion_events_active" ON "public"."conversion_events" USING "btree" ("is_active");



CREATE INDEX "idx_conversion_events_category" ON "public"."conversion_events" USING "btree" ("event_category");



CREATE INDEX "idx_conversion_events_created_by" ON "public"."conversion_events" USING "btree" ("created_by");



CREATE INDEX "idx_coverage_documents_coverage_id" ON "public"."coverage_documents" USING "btree" ("coverage_id");



CREATE INDEX "idx_crm_accounts_account_type" ON "public"."crm_accounts" USING "btree" ("account_type");



CREATE INDEX "idx_crm_accounts_created_at" ON "public"."crm_accounts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_accounts_created_by" ON "public"."crm_accounts" USING "btree" ("created_by");



CREATE INDEX "idx_crm_accounts_name" ON "public"."crm_accounts" USING "btree" ("name");



CREATE INDEX "idx_crm_accounts_name_trgm" ON "public"."crm_accounts" USING "gin" ("name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_crm_accounts_org_id" ON "public"."crm_accounts" USING "btree" ("org_id");



CREATE INDEX "idx_crm_accounts_owner_id" ON "public"."crm_accounts" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_accounts_parent_id" ON "public"."crm_accounts" USING "btree" ("parent_account_id");



CREATE INDEX "idx_crm_accounts_search" ON "public"."crm_accounts" USING "gin" ("search_vector");



CREATE INDEX "idx_crm_accounts_tags" ON "public"."crm_accounts" USING "gin" ("tags");



CREATE INDEX "idx_crm_activities_account" ON "public"."crm_activities" USING "btree" ("account_id");



CREATE INDEX "idx_crm_activities_assigned" ON "public"."crm_activities" USING "btree" ("assigned_to");



CREATE INDEX "idx_crm_activities_contact" ON "public"."crm_activities" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_activities_created" ON "public"."crm_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_activities_created_by" ON "public"."crm_activities" USING "btree" ("created_by");



CREATE INDEX "idx_crm_activities_deal" ON "public"."crm_activities" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_activities_due" ON "public"."crm_activities" USING "btree" ("due_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text"]));



CREATE INDEX "idx_crm_activities_lead" ON "public"."crm_activities" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_activities_org_id" ON "public"."crm_activities" USING "btree" ("org_id");



CREATE INDEX "idx_crm_activities_owner" ON "public"."crm_activities" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_activities_scheduled" ON "public"."crm_activities" USING "btree" ("scheduled_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text"]));



CREATE INDEX "idx_crm_activities_status" ON "public"."crm_activities" USING "btree" ("status");



CREATE INDEX "idx_crm_activities_type" ON "public"."crm_activities" USING "btree" ("activity_type");



CREATE INDEX "idx_crm_approval_actions_approver" ON "public"."crm_approval_actions" USING "btree" ("approver_id");



CREATE INDEX "idx_crm_approval_actions_request" ON "public"."crm_approval_actions" USING "btree" ("request_id");



CREATE INDEX "idx_crm_approval_actions_step" ON "public"."crm_approval_actions" USING "btree" ("step_id");



CREATE INDEX "idx_crm_approval_processes_active" ON "public"."crm_approval_processes" USING "btree" ("org_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_crm_approval_processes_created_by" ON "public"."crm_approval_processes" USING "btree" ("created_by");



CREATE INDEX "idx_crm_approval_processes_entity" ON "public"."crm_approval_processes" USING "btree" ("entity_type");



CREATE INDEX "idx_crm_approval_processes_org" ON "public"."crm_approval_processes" USING "btree" ("org_id");



CREATE INDEX "idx_crm_approval_requests_entity" ON "public"."crm_approval_requests" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_crm_approval_requests_org" ON "public"."crm_approval_requests" USING "btree" ("org_id");



CREATE INDEX "idx_crm_approval_requests_pending" ON "public"."crm_approval_requests" USING "btree" ("org_id", "status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_crm_approval_requests_process" ON "public"."crm_approval_requests" USING "btree" ("process_id");



CREATE INDEX "idx_crm_approval_requests_requester" ON "public"."crm_approval_requests" USING "btree" ("requested_by");



CREATE INDEX "idx_crm_approval_requests_status" ON "public"."crm_approval_requests" USING "btree" ("status");



CREATE INDEX "idx_crm_approval_steps_approver" ON "public"."crm_approval_steps" USING "btree" ("approver_id") WHERE ("approver_id" IS NOT NULL);



CREATE INDEX "idx_crm_approval_steps_order" ON "public"."crm_approval_steps" USING "btree" ("process_id", "step_order");



CREATE INDEX "idx_crm_approval_steps_process" ON "public"."crm_approval_steps" USING "btree" ("process_id");



CREATE INDEX "idx_crm_calendar_integrations_org" ON "public"."crm_calendar_integrations" USING "btree" ("org_id");



CREATE INDEX "idx_crm_calendar_integrations_user" ON "public"."crm_calendar_integrations" USING "btree" ("user_id");



CREATE INDEX "idx_crm_campaign_members_added_by" ON "public"."crm_campaign_members" USING "btree" ("added_by");



CREATE INDEX "idx_crm_campaign_members_campaign" ON "public"."crm_campaign_members" USING "btree" ("campaign_id");



CREATE INDEX "idx_crm_campaign_members_contact" ON "public"."crm_campaign_members" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_campaign_members_lead" ON "public"."crm_campaign_members" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_campaign_members_status" ON "public"."crm_campaign_members" USING "btree" ("status");



CREATE INDEX "idx_crm_campaigns_created_at" ON "public"."crm_campaigns" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_campaigns_created_by" ON "public"."crm_campaigns" USING "btree" ("created_by");



CREATE INDEX "idx_crm_campaigns_end_date" ON "public"."crm_campaigns" USING "btree" ("end_date");



CREATE INDEX "idx_crm_campaigns_org_id" ON "public"."crm_campaigns" USING "btree" ("org_id");



CREATE INDEX "idx_crm_campaigns_owner_id" ON "public"."crm_campaigns" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_campaigns_parent" ON "public"."crm_campaigns" USING "btree" ("parent_campaign_id");



CREATE INDEX "idx_crm_campaigns_start_date" ON "public"."crm_campaigns" USING "btree" ("start_date");



CREATE INDEX "idx_crm_campaigns_status" ON "public"."crm_campaigns" USING "btree" ("status");



CREATE INDEX "idx_crm_campaigns_type" ON "public"."crm_campaigns" USING "btree" ("type");



CREATE INDEX "idx_crm_case_comments_author_id" ON "public"."crm_case_comments" USING "btree" ("author_id");



CREATE INDEX "idx_crm_case_comments_case_id" ON "public"."crm_case_comments" USING "btree" ("case_id");



CREATE INDEX "idx_crm_cases_account_id" ON "public"."crm_cases" USING "btree" ("account_id");



CREATE INDEX "idx_crm_cases_assigned_to" ON "public"."crm_cases" USING "btree" ("assigned_to");



CREATE INDEX "idx_crm_cases_contact_id" ON "public"."crm_cases" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_cases_created_at" ON "public"."crm_cases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_cases_created_by" ON "public"."crm_cases" USING "btree" ("created_by");



CREATE INDEX "idx_crm_cases_escalated_to" ON "public"."crm_cases" USING "btree" ("escalated_to");



CREATE INDEX "idx_crm_cases_org_id" ON "public"."crm_cases" USING "btree" ("org_id");



CREATE INDEX "idx_crm_cases_owner_id" ON "public"."crm_cases" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_cases_priority" ON "public"."crm_cases" USING "btree" ("priority");



CREATE INDEX "idx_crm_cases_status" ON "public"."crm_cases" USING "btree" ("status");



CREATE INDEX "idx_crm_contacts_account_id" ON "public"."crm_contacts" USING "btree" ("account_id");



CREATE INDEX "idx_crm_contacts_converted_from_lead" ON "public"."crm_contacts" USING "btree" ("converted_from_lead_id");



CREATE INDEX "idx_crm_contacts_created_at" ON "public"."crm_contacts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_contacts_created_by" ON "public"."crm_contacts" USING "btree" ("created_by");



CREATE INDEX "idx_crm_contacts_email" ON "public"."crm_contacts" USING "btree" ("email");



CREATE INDEX "idx_crm_contacts_email_trgm" ON "public"."crm_contacts" USING "gin" ("email" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_crm_contacts_name" ON "public"."crm_contacts" USING "btree" (((("first_name" || ' '::"text") || "last_name")));



CREATE INDEX "idx_crm_contacts_name_trgm" ON "public"."crm_contacts" USING "gin" (((("first_name" || ' '::"text") || "last_name")) "extensions"."gin_trgm_ops");



CREATE INDEX "idx_crm_contacts_org_id" ON "public"."crm_contacts" USING "btree" ("org_id");



CREATE INDEX "idx_crm_contacts_owner_id" ON "public"."crm_contacts" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_contacts_reports_to" ON "public"."crm_contacts" USING "btree" ("reports_to");



CREATE INDEX "idx_crm_contacts_search" ON "public"."crm_contacts" USING "gin" ("search_vector");



CREATE INDEX "idx_crm_contacts_tags" ON "public"."crm_contacts" USING "gin" ("tags");



CREATE INDEX "idx_crm_deal_contacts_contact" ON "public"."crm_deal_contacts" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_deal_contacts_deal" ON "public"."crm_deal_contacts" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_deal_products_deal" ON "public"."crm_deal_products" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_deal_products_product" ON "public"."crm_deal_products" USING "btree" ("product_id");



CREATE INDEX "idx_crm_deal_stage_history_changed_at" ON "public"."crm_deal_stage_history" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_crm_deal_stage_history_changed_by" ON "public"."crm_deal_stage_history" USING "btree" ("changed_by");



CREATE INDEX "idx_crm_deal_stage_history_deal_id" ON "public"."crm_deal_stage_history" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_deal_stage_history_from_stage_id" ON "public"."crm_deal_stage_history" USING "btree" ("from_stage_id");



CREATE INDEX "idx_crm_deal_stage_history_to_stage_id" ON "public"."crm_deal_stage_history" USING "btree" ("to_stage_id");



CREATE INDEX "idx_crm_deal_stages_active" ON "public"."crm_deal_stages" USING "btree" ("org_id", "is_active");



CREATE INDEX "idx_crm_deal_stages_org_id" ON "public"."crm_deal_stages" USING "btree" ("org_id");



CREATE INDEX "idx_crm_deal_stages_sort_order" ON "public"."crm_deal_stages" USING "btree" ("org_id", "sort_order");



CREATE INDEX "idx_crm_deals_account_id" ON "public"."crm_deals" USING "btree" ("account_id");



CREATE INDEX "idx_crm_deals_amount" ON "public"."crm_deals" USING "btree" ("amount" DESC);



CREATE INDEX "idx_crm_deals_contact_id" ON "public"."crm_deals" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_deals_created_at" ON "public"."crm_deals" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_deals_created_by" ON "public"."crm_deals" USING "btree" ("created_by");



CREATE INDEX "idx_crm_deals_expected_close" ON "public"."crm_deals" USING "btree" ("expected_close_date");



CREATE INDEX "idx_crm_deals_name_trgm" ON "public"."crm_deals" USING "gin" ("name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_crm_deals_org_id" ON "public"."crm_deals" USING "btree" ("org_id");



CREATE INDEX "idx_crm_deals_owner_id" ON "public"."crm_deals" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_deals_search" ON "public"."crm_deals" USING "gin" ("search_vector");



CREATE INDEX "idx_crm_deals_stage_id" ON "public"."crm_deals" USING "btree" ("stage_id");



CREATE INDEX "idx_crm_deals_tags" ON "public"."crm_deals" USING "gin" ("tags");



CREATE INDEX "idx_crm_default_layout_templates_created_by" ON "public"."crm_default_layout_templates" USING "btree" ("created_by");



CREATE INDEX "idx_crm_documents_category" ON "public"."crm_documents" USING "btree" ("category");



CREATE INDEX "idx_crm_documents_created_at" ON "public"."crm_documents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_documents_entity" ON "public"."crm_documents" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_crm_documents_folder" ON "public"."crm_documents" USING "btree" ("folder");



CREATE INDEX "idx_crm_documents_org_id" ON "public"."crm_documents" USING "btree" ("org_id");



CREATE INDEX "idx_crm_documents_uploaded_by" ON "public"."crm_documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_crm_email_attachments_draft" ON "public"."crm_email_attachments" USING "btree" ("draft_id");



CREATE INDEX "idx_crm_email_attachments_email" ON "public"."crm_email_attachments" USING "btree" ("email_id");



CREATE INDEX "idx_crm_email_attachments_uploaded_by" ON "public"."crm_email_attachments" USING "btree" ("uploaded_by");



CREATE INDEX "idx_crm_email_drafts_lead" ON "public"."crm_email_drafts" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_email_drafts_scheduled" ON "public"."crm_email_drafts" USING "btree" ("scheduled_send_at") WHERE ("scheduled_send_at" IS NOT NULL);



CREATE INDEX "idx_crm_email_drafts_signature_id" ON "public"."crm_email_drafts" USING "btree" ("signature_id");



CREATE INDEX "idx_crm_email_drafts_user" ON "public"."crm_email_drafts" USING "btree" ("user_id");



CREATE INDEX "idx_crm_email_log_archived" ON "public"."crm_email_log" USING "btree" ("is_archived") WHERE ("is_archived" = false);



CREATE INDEX "idx_crm_email_log_direction" ON "public"."crm_email_log" USING "btree" ("direction");



CREATE INDEX "idx_crm_email_log_is_read" ON "public"."crm_email_log" USING "btree" ("is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_crm_email_log_lead" ON "public"."crm_email_log" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_email_log_message_id" ON "public"."crm_email_log" USING "btree" ("message_id") WHERE ("message_id" IS NOT NULL);



CREATE INDEX "idx_crm_email_log_org" ON "public"."crm_email_log" USING "btree" ("org_id");



CREATE INDEX "idx_crm_email_log_sent_at" ON "public"."crm_email_log" USING "btree" ("sent_at" DESC);



CREATE INDEX "idx_crm_email_log_sent_by" ON "public"."crm_email_log" USING "btree" ("sent_by");



CREATE INDEX "idx_crm_email_log_signature_id" ON "public"."crm_email_log" USING "btree" ("signature_id");



CREATE INDEX "idx_crm_email_log_starred" ON "public"."crm_email_log" USING "btree" ("is_starred") WHERE ("is_starred" = true);



CREATE INDEX "idx_crm_email_log_template" ON "public"."crm_email_log" USING "btree" ("template_id");



CREATE INDEX "idx_crm_email_log_thread" ON "public"."crm_email_log" USING "btree" ("thread_id");



CREATE INDEX "idx_crm_email_log_tracking_id" ON "public"."crm_email_log" USING "btree" ("tracking_id");



CREATE INDEX "idx_crm_email_routing_rules_address" ON "public"."crm_email_routing_rules" USING "btree" ("inbound_address") WHERE ("is_active" = true);



CREATE INDEX "idx_crm_email_routing_rules_org" ON "public"."crm_email_routing_rules" USING "btree" ("org_id");



CREATE INDEX "idx_crm_email_sequences_org" ON "public"."crm_email_sequences" USING "btree" ("org_id");



CREATE INDEX "idx_crm_email_sequences_status" ON "public"."crm_email_sequences" USING "btree" ("status");



CREATE INDEX "idx_crm_email_signatures_org" ON "public"."crm_email_signatures" USING "btree" ("org_id");



CREATE INDEX "idx_crm_email_signatures_user" ON "public"."crm_email_signatures" USING "btree" ("user_id");



CREATE INDEX "idx_crm_email_threads_last_message" ON "public"."crm_email_threads" USING "btree" ("last_message_at" DESC);



CREATE INDEX "idx_crm_email_threads_lead" ON "public"."crm_email_threads" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_email_threads_org" ON "public"."crm_email_threads" USING "btree" ("org_id");



CREATE INDEX "idx_crm_email_threads_unread" ON "public"."crm_email_threads" USING "btree" ("has_unread") WHERE ("has_unread" = true);



CREATE INDEX "idx_crm_email_tracking_email" ON "public"."crm_email_tracking" USING "btree" ("email_log_id");



CREATE INDEX "idx_crm_email_tracking_time" ON "public"."crm_email_tracking" USING "btree" ("tracked_at" DESC);



CREATE INDEX "idx_crm_email_tracking_type" ON "public"."crm_email_tracking" USING "btree" ("tracking_type");



CREATE INDEX "idx_crm_forecast_entries_category" ON "public"."crm_forecast_entries" USING "btree" ("forecast_category");



CREATE INDEX "idx_crm_forecast_entries_close_date" ON "public"."crm_forecast_entries" USING "btree" ("close_date");



CREATE INDEX "idx_crm_forecast_entries_deal_id" ON "public"."crm_forecast_entries" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_forecast_entries_forecast_id" ON "public"."crm_forecast_entries" USING "btree" ("forecast_id");



CREATE INDEX "idx_crm_forecast_entries_user_id" ON "public"."crm_forecast_entries" USING "btree" ("user_id");



CREATE INDEX "idx_crm_forecasts_created_at" ON "public"."crm_forecasts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_forecasts_created_by" ON "public"."crm_forecasts" USING "btree" ("created_by");



CREATE INDEX "idx_crm_forecasts_org_id" ON "public"."crm_forecasts" USING "btree" ("org_id");



CREATE INDEX "idx_crm_forecasts_period" ON "public"."crm_forecasts" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_crm_forecasts_status" ON "public"."crm_forecasts" USING "btree" ("status");



CREATE INDEX "idx_crm_invoice_line_items_invoice" ON "public"."crm_invoice_line_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_crm_invoice_line_items_product" ON "public"."crm_invoice_line_items" USING "btree" ("product_id");



CREATE INDEX "idx_crm_invoice_payments_date" ON "public"."crm_invoice_payments" USING "btree" ("payment_date");



CREATE INDEX "idx_crm_invoice_payments_invoice" ON "public"."crm_invoice_payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_crm_invoice_payments_recorded_by" ON "public"."crm_invoice_payments" USING "btree" ("recorded_by");



CREATE INDEX "idx_crm_invoices_account_id" ON "public"."crm_invoices" USING "btree" ("account_id");



CREATE INDEX "idx_crm_invoices_approved_by" ON "public"."crm_invoices" USING "btree" ("approved_by");



CREATE INDEX "idx_crm_invoices_contact_id" ON "public"."crm_invoices" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_invoices_created_at" ON "public"."crm_invoices" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_invoices_created_by" ON "public"."crm_invoices" USING "btree" ("created_by");



CREATE INDEX "idx_crm_invoices_deal_id" ON "public"."crm_invoices" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_invoices_due_date" ON "public"."crm_invoices" USING "btree" ("due_date");



CREATE INDEX "idx_crm_invoices_invoice_number" ON "public"."crm_invoices" USING "btree" ("invoice_number");



CREATE INDEX "idx_crm_invoices_org_id" ON "public"."crm_invoices" USING "btree" ("org_id");



CREATE INDEX "idx_crm_invoices_owner_id" ON "public"."crm_invoices" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_invoices_quote_id" ON "public"."crm_invoices" USING "btree" ("quote_id");



CREATE INDEX "idx_crm_invoices_status" ON "public"."crm_invoices" USING "btree" ("status");



CREATE INDEX "idx_crm_lead_health_quotes_created_at" ON "public"."crm_lead_health_quotes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_lead_health_quotes_created_by" ON "public"."crm_lead_health_quotes" USING "btree" ("created_by");



CREATE INDEX "idx_crm_lead_health_quotes_lead_id" ON "public"."crm_lead_health_quotes" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_lead_health_quotes_quote_number" ON "public"."crm_lead_health_quotes" USING "btree" ("quote_number");



CREATE INDEX "idx_crm_lead_health_quotes_status" ON "public"."crm_lead_health_quotes" USING "btree" ("status");



CREATE INDEX "idx_crm_lead_health_quotes_valid_until" ON "public"."crm_lead_health_quotes" USING "btree" ("valid_until") WHERE ("status" <> ALL (ARRAY['accepted'::"text", 'declined'::"text", 'expired'::"text"]));



CREATE INDEX "idx_crm_lead_plan_interests_created_at" ON "public"."crm_lead_plan_interests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_lead_plan_interests_created_by" ON "public"."crm_lead_plan_interests" USING "btree" ("created_by");



CREATE INDEX "idx_crm_lead_plan_interests_interest_level" ON "public"."crm_lead_plan_interests" USING "btree" ("interest_level");



CREATE INDEX "idx_crm_lead_plan_interests_lead_id" ON "public"."crm_lead_plan_interests" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_lead_plan_interests_plan_id" ON "public"."crm_lead_plan_interests" USING "btree" ("plan_id");



CREATE INDEX "idx_crm_meeting_bookings_calendar_event_id" ON "public"."crm_meeting_bookings" USING "btree" ("calendar_event_id");



CREATE INDEX "idx_crm_meeting_bookings_lead" ON "public"."crm_meeting_bookings" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_meeting_bookings_schedule" ON "public"."crm_meeting_bookings" USING "btree" ("schedule_id");



CREATE INDEX "idx_crm_meeting_bookings_status" ON "public"."crm_meeting_bookings" USING "btree" ("status");



CREATE INDEX "idx_crm_meeting_bookings_time" ON "public"."crm_meeting_bookings" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_crm_meeting_schedules_confirmation_template_id" ON "public"."crm_meeting_schedules" USING "btree" ("confirmation_template_id");



CREATE INDEX "idx_crm_meeting_schedules_org" ON "public"."crm_meeting_schedules" USING "btree" ("org_id");



CREATE INDEX "idx_crm_meeting_schedules_reminder_template_id" ON "public"."crm_meeting_schedules" USING "btree" ("reminder_template_id");



CREATE INDEX "idx_crm_meeting_schedules_slug" ON "public"."crm_meeting_schedules" USING "btree" ("slug");



CREATE INDEX "idx_crm_meeting_schedules_user" ON "public"."crm_meeting_schedules" USING "btree" ("user_id");



CREATE INDEX "idx_crm_pipeline_stages_org_id" ON "public"."crm_pipeline_stages" USING "btree" ("org_id");



CREATE INDEX "idx_crm_po_line_items_order" ON "public"."crm_purchase_order_line_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_crm_price_book_items_price_book" ON "public"."crm_price_book_items" USING "btree" ("price_book_id");



CREATE INDEX "idx_crm_price_book_items_product" ON "public"."crm_price_book_items" USING "btree" ("product_id");



CREATE INDEX "idx_crm_price_books_active" ON "public"."crm_price_books" USING "btree" ("org_id", "is_active");



CREATE INDEX "idx_crm_price_books_created_by" ON "public"."crm_price_books" USING "btree" ("created_by");



CREATE UNIQUE INDEX "idx_crm_price_books_default" ON "public"."crm_price_books" USING "btree" ("org_id") WHERE ("is_default" = true);



CREATE INDEX "idx_crm_price_books_org_id" ON "public"."crm_price_books" USING "btree" ("org_id");



CREATE INDEX "idx_crm_products_active" ON "public"."crm_products" USING "btree" ("org_id", "is_active");



CREATE INDEX "idx_crm_products_category" ON "public"."crm_products" USING "btree" ("category");



CREATE INDEX "idx_crm_products_code" ON "public"."crm_products" USING "btree" ("code");



CREATE INDEX "idx_crm_products_created_by" ON "public"."crm_products" USING "btree" ("created_by");



CREATE INDEX "idx_crm_products_name" ON "public"."crm_products" USING "btree" ("name");



CREATE INDEX "idx_crm_products_name_trgm" ON "public"."crm_products" USING "gin" ("name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_crm_products_org_id" ON "public"."crm_products" USING "btree" ("org_id");



CREATE INDEX "idx_crm_products_search" ON "public"."crm_products" USING "gin" ("search_vector");



CREATE INDEX "idx_crm_purchase_order_line_items_product_id" ON "public"."crm_purchase_order_line_items" USING "btree" ("product_id");



CREATE INDEX "idx_crm_purchase_orders_approved_by" ON "public"."crm_purchase_orders" USING "btree" ("approved_by");



CREATE INDEX "idx_crm_purchase_orders_created_by" ON "public"."crm_purchase_orders" USING "btree" ("created_by");



CREATE INDEX "idx_crm_purchase_orders_number" ON "public"."crm_purchase_orders" USING "btree" ("po_number");



CREATE INDEX "idx_crm_purchase_orders_org" ON "public"."crm_purchase_orders" USING "btree" ("org_id");



CREATE INDEX "idx_crm_purchase_orders_owner_id" ON "public"."crm_purchase_orders" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_purchase_orders_status" ON "public"."crm_purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_crm_purchase_orders_vendor" ON "public"."crm_purchase_orders" USING "btree" ("vendor_id");



CREATE INDEX "idx_crm_quote_line_items_product" ON "public"."crm_quote_line_items" USING "btree" ("product_id");



CREATE INDEX "idx_crm_quote_line_items_quote" ON "public"."crm_quote_line_items" USING "btree" ("quote_id");



CREATE INDEX "idx_crm_quote_line_items_sort" ON "public"."crm_quote_line_items" USING "btree" ("quote_id", "sort_order");



CREATE INDEX "idx_crm_quotes_account_id" ON "public"."crm_quotes" USING "btree" ("account_id");



CREATE INDEX "idx_crm_quotes_approved_by" ON "public"."crm_quotes" USING "btree" ("approved_by");



CREATE INDEX "idx_crm_quotes_contact_id" ON "public"."crm_quotes" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_quotes_created_at" ON "public"."crm_quotes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_quotes_created_by" ON "public"."crm_quotes" USING "btree" ("created_by");



CREATE INDEX "idx_crm_quotes_deal_id" ON "public"."crm_quotes" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_quotes_org_id" ON "public"."crm_quotes" USING "btree" ("org_id");



CREATE INDEX "idx_crm_quotes_owner_id" ON "public"."crm_quotes" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_quotes_quote_number" ON "public"."crm_quotes" USING "btree" ("quote_number");



CREATE INDEX "idx_crm_quotes_status" ON "public"."crm_quotes" USING "btree" ("status");



CREATE INDEX "idx_crm_quotes_valid_until" ON "public"."crm_quotes" USING "btree" ("valid_until");



CREATE INDEX "idx_crm_sales_order_line_items_product_id" ON "public"."crm_sales_order_line_items" USING "btree" ("product_id");



CREATE INDEX "idx_crm_sales_orders_account" ON "public"."crm_sales_orders" USING "btree" ("account_id");



CREATE INDEX "idx_crm_sales_orders_approved_by" ON "public"."crm_sales_orders" USING "btree" ("approved_by");



CREATE INDEX "idx_crm_sales_orders_contact_id" ON "public"."crm_sales_orders" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_sales_orders_created_by" ON "public"."crm_sales_orders" USING "btree" ("created_by");



CREATE INDEX "idx_crm_sales_orders_deal_id" ON "public"."crm_sales_orders" USING "btree" ("deal_id");



CREATE INDEX "idx_crm_sales_orders_number" ON "public"."crm_sales_orders" USING "btree" ("so_number");



CREATE INDEX "idx_crm_sales_orders_org" ON "public"."crm_sales_orders" USING "btree" ("org_id");



CREATE INDEX "idx_crm_sales_orders_owner_id" ON "public"."crm_sales_orders" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_sales_orders_quote" ON "public"."crm_sales_orders" USING "btree" ("quote_id");



CREATE INDEX "idx_crm_sales_orders_status" ON "public"."crm_sales_orders" USING "btree" ("status");



CREATE INDEX "idx_crm_saved_views_org_module" ON "public"."crm_saved_views" USING "btree" ("org_id", "module");



CREATE INDEX "idx_crm_saved_views_owner" ON "public"."crm_saved_views" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_sequence_enrollments_contact" ON "public"."crm_email_sequence_enrollments" USING "btree" ("contact_id");



CREATE INDEX "idx_crm_sequence_enrollments_lead" ON "public"."crm_email_sequence_enrollments" USING "btree" ("lead_id");



CREATE INDEX "idx_crm_sequence_enrollments_next_action" ON "public"."crm_email_sequence_enrollments" USING "btree" ("next_action_at") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_crm_sequence_enrollments_sequence" ON "public"."crm_email_sequence_enrollments" USING "btree" ("sequence_id");



CREATE INDEX "idx_crm_sequence_enrollments_status" ON "public"."crm_email_sequence_enrollments" USING "btree" ("status");



CREATE INDEX "idx_crm_sequence_steps_sequence" ON "public"."crm_email_sequence_steps" USING "btree" ("sequence_id");



CREATE INDEX "idx_crm_sequence_steps_template" ON "public"."crm_email_sequence_steps" USING "btree" ("template_id");



CREATE INDEX "idx_crm_so_line_items_order" ON "public"."crm_sales_order_line_items" USING "btree" ("sales_order_id");



CREATE INDEX "idx_crm_studio_fields_created_by" ON "public"."crm_studio_fields" USING "btree" ("created_by");



CREATE INDEX "idx_crm_studio_layouts_created_by" ON "public"."crm_studio_layouts" USING "btree" ("created_by");



CREATE INDEX "idx_crm_studio_modules_created_by" ON "public"."crm_studio_modules" USING "btree" ("created_by");



CREATE INDEX "idx_crm_studio_validation_rules_created_by" ON "public"."crm_studio_validation_rules" USING "btree" ("created_by");



CREATE INDEX "idx_crm_studio_validation_rules_error_field_id" ON "public"."crm_studio_validation_rules" USING "btree" ("error_field_id");



CREATE INDEX "idx_crm_studio_views_created_by" ON "public"."crm_studio_views" USING "btree" ("created_by");



CREATE INDEX "idx_crm_studio_views_sort_field_id" ON "public"."crm_studio_views" USING "btree" ("sort_field_id");



CREATE INDEX "idx_crm_template_folders_org" ON "public"."crm_template_folders" USING "btree" ("org_id");



CREATE INDEX "idx_crm_template_folders_parent" ON "public"."crm_template_folders" USING "btree" ("parent_folder_id");



CREATE INDEX "idx_crm_templates_active" ON "public"."crm_templates" USING "btree" ("is_active");



CREATE INDEX "idx_crm_templates_category" ON "public"."crm_templates" USING "btree" ("category");



CREATE INDEX "idx_crm_templates_created_by" ON "public"."crm_templates" USING "btree" ("created_by");



CREATE INDEX "idx_crm_templates_default_signature_id" ON "public"."crm_templates" USING "btree" ("default_signature_id");



CREATE INDEX "idx_crm_templates_folder" ON "public"."crm_templates" USING "btree" ("folder_id");



CREATE INDEX "idx_crm_templates_performance" ON "public"."crm_templates" USING "btree" ("performance_score" DESC);



CREATE INDEX "idx_crm_templates_type" ON "public"."crm_templates" USING "btree" ("template_type");



CREATE INDEX "idx_crm_templates_version" ON "public"."crm_templates" USING "btree" ("parent_version_id");



CREATE INDEX "idx_crm_user_goals_assigned_by" ON "public"."crm_user_goals" USING "btree" ("assigned_by");



CREATE INDEX "idx_crm_vendors_active" ON "public"."crm_vendors" USING "btree" ("is_active");



CREATE INDEX "idx_crm_vendors_created_by" ON "public"."crm_vendors" USING "btree" ("created_by");



CREATE INDEX "idx_crm_vendors_name" ON "public"."crm_vendors" USING "btree" ("name");



CREATE INDEX "idx_crm_vendors_org" ON "public"."crm_vendors" USING "btree" ("org_id");



CREATE INDEX "idx_crm_vendors_owner_id" ON "public"."crm_vendors" USING "btree" ("owner_id");



CREATE INDEX "idx_crm_vendors_primary_contact_id" ON "public"."crm_vendors" USING "btree" ("primary_contact_id");



CREATE INDEX "idx_crm_web_form_submissions_form_id" ON "public"."crm_web_form_submissions" USING "btree" ("form_id");



CREATE INDEX "idx_crm_web_form_submissions_status" ON "public"."crm_web_form_submissions" USING "btree" ("status");



CREATE INDEX "idx_crm_web_forms_created_by" ON "public"."crm_web_forms" USING "btree" ("created_by");



CREATE INDEX "idx_crm_web_forms_org_id" ON "public"."crm_web_forms" USING "btree" ("org_id");



CREATE INDEX "idx_crm_web_forms_slug" ON "public"."crm_web_forms" USING "btree" ("slug");



CREATE INDEX "idx_crm_website_quote_sync_created_at" ON "public"."crm_website_quote_sync" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_crm_website_quote_sync_crm_lead_id" ON "public"."crm_website_quote_sync" USING "btree" ("crm_lead_id");



CREATE INDEX "idx_crm_website_quote_sync_crm_quote_id" ON "public"."crm_website_quote_sync" USING "btree" ("crm_quote_id");



CREATE INDEX "idx_crm_website_quote_sync_status" ON "public"."crm_website_quote_sync" USING "btree" ("sync_status");



CREATE INDEX "idx_daily_analytics_summary_date" ON "public"."daily_analytics_summary" USING "btree" ("date" DESC);



CREATE INDEX "idx_dashboard_layouts_default" ON "public"."crm_dashboard_layouts" USING "btree" ("user_id", "org_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_dashboard_layouts_org" ON "public"."crm_dashboard_layouts" USING "btree" ("org_id");



CREATE INDEX "idx_dashboard_layouts_user" ON "public"."crm_dashboard_layouts" USING "btree" ("user_id");



CREATE INDEX "idx_dashboard_notes_entity" ON "public"."crm_dashboard_notes" USING "btree" ("linked_entity_type", "linked_entity_id") WHERE ("linked_entity_id" IS NOT NULL);



CREATE INDEX "idx_dashboard_notes_org" ON "public"."crm_dashboard_notes" USING "btree" ("org_id");



CREATE INDEX "idx_dashboard_notes_pinned" ON "public"."crm_dashboard_notes" USING "btree" ("user_id", "is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_dashboard_notes_user" ON "public"."crm_dashboard_notes" USING "btree" ("user_id");



CREATE INDEX "idx_default_layouts_active" ON "public"."crm_default_layout_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_default_layouts_org" ON "public"."crm_default_layout_templates" USING "btree" ("org_id");



CREATE INDEX "idx_document_access_log_accessed_by" ON "public"."document_access_log" USING "btree" ("accessed_by");



CREATE INDEX "idx_document_access_log_document_id" ON "public"."document_access_log" USING "btree" ("document_id");



CREATE INDEX "idx_educational_content_active" ON "public"."educational_content" USING "btree" ("is_active");



CREATE INDEX "idx_educational_content_slug" ON "public"."educational_content" USING "btree" ("slug");



CREATE INDEX "idx_educational_content_type" ON "public"."educational_content" USING "btree" ("content_type");



CREATE INDEX "idx_email_schedules_created_by" ON "public"."email_schedules" USING "btree" ("created_by");



CREATE INDEX "idx_email_schedules_next_run" ON "public"."email_schedules" USING "btree" ("next_run_at");



CREATE INDEX "idx_email_schedules_org" ON "public"."email_schedules" USING "btree" ("org_id");



CREATE INDEX "idx_email_schedules_status" ON "public"."email_schedules" USING "btree" ("status");



CREATE INDEX "idx_email_schedules_template_id" ON "public"."email_schedules" USING "btree" ("template_id");



CREATE INDEX "idx_email_templates_active" ON "public"."email_templates" USING "btree" ("is_active");



CREATE INDEX "idx_email_templates_category" ON "public"."email_templates" USING "btree" ("category");



CREATE INDEX "idx_email_tracking_email_log" ON "public"."email_tracking" USING "btree" ("email_log_id");



CREATE INDEX "idx_email_tracking_type" ON "public"."email_tracking" USING "btree" ("tracking_type");



CREATE INDEX "idx_enrollments_advisor" ON "public"."advisor_lms_enrollments" USING "btree" ("advisor_id");



CREATE INDEX "idx_enrollments_applicant_email" ON "public"."enrollments" USING "btree" ("applicant_email");



CREATE INDEX "idx_enrollments_course" ON "public"."advisor_lms_enrollments" USING "btree" ("course_id");



CREATE INDEX "idx_enrollments_reviewed_by" ON "public"."enrollments" USING "btree" ("reviewed_by");



CREATE INDEX "idx_enrollments_status" ON "public"."enrollments" USING "btree" ("status");



CREATE INDEX "idx_enrollments_submitted_at" ON "public"."enrollments" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_esignature_documents_created_by" ON "public"."esignature_documents" USING "btree" ("created_by");



CREATE INDEX "idx_esignature_documents_org" ON "public"."esignature_documents" USING "btree" ("org_id");



CREATE INDEX "idx_esignature_documents_provider_id" ON "public"."esignature_documents" USING "btree" ("provider_id");



CREATE INDEX "idx_esignature_documents_status" ON "public"."esignature_documents" USING "btree" ("status");



CREATE INDEX "idx_esignature_providers_created_by" ON "public"."esignature_providers" USING "btree" ("created_by");



CREATE INDEX "idx_esignature_providers_org" ON "public"."esignature_providers" USING "btree" ("org_id");



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "idx_events_event_type" ON "public"."events" USING "btree" ("event_type");



CREATE INDEX "idx_events_published_date" ON "public"."events" USING "btree" ("is_published", "event_date" DESC);



CREATE INDEX "idx_events_slug" ON "public"."events" USING "btree" ("slug");



CREATE INDEX "idx_external_progress_advisor" ON "public"."advisor_external_training_progress" USING "btree" ("advisor_id");



CREATE INDEX "idx_external_progress_module" ON "public"."advisor_external_training_progress" USING "btree" ("module_id");



CREATE INDEX "idx_faq_items_active" ON "public"."faq_items" USING "btree" ("is_active");



CREATE INDEX "idx_faq_items_category" ON "public"."faq_items" USING "btree" ("category");



CREATE INDEX "idx_faq_items_order" ON "public"."faq_items" USING "btree" ("order_index");



CREATE INDEX "idx_form_submissions_advisor_id" ON "public"."form_submissions" USING "btree" ("advisor_id");



CREATE INDEX "idx_form_submissions_org_id" ON "public"."form_submissions" USING "btree" ("org_id");



CREATE INDEX "idx_gemini_prompts_active" ON "public"."gemini_prompts" USING "btree" ("is_active");



CREATE INDEX "idx_gemini_prompts_category" ON "public"."gemini_prompts" USING "btree" ("category");



CREATE INDEX "idx_geo_state_settings_restricted" ON "public"."geo_state_settings" USING "btree" ("is_restricted");



CREATE INDEX "idx_geo_state_settings_supported" ON "public"."geo_state_settings" USING "btree" ("is_supported");



CREATE INDEX "idx_geo_state_settings_updated_by" ON "public"."geo_state_settings" USING "btree" ("updated_by");



CREATE INDEX "idx_handbooks_active" ON "public"."handbooks" USING "btree" ("is_active");



CREATE INDEX "idx_handbooks_plan_type" ON "public"."handbooks" USING "btree" ("plan_type");



CREATE INDEX "idx_handbooks_slug" ON "public"."handbooks" USING "btree" ("slug");



CREATE INDEX "idx_handbooks_sort" ON "public"."handbooks" USING "btree" ("sort_order");



CREATE INDEX "idx_health_history_member_id" ON "public"."health_history" USING "btree" ("member_id");



CREATE INDEX "idx_healthcare_plan_categories_slug" ON "public"."healthcare_plan_categories" USING "btree" ("slug");



CREATE INDEX "idx_immunizations_member_id" ON "public"."immunizations" USING "btree" ("member_id");



CREATE INDEX "idx_integration_health_platform" ON "public"."integration_health" USING "btree" ("platform_id");



CREATE INDEX "idx_integration_health_status" ON "public"."integration_health" USING "btree" ("status");



CREATE INDEX "idx_interaction_logs_agent" ON "public"."interaction_logs" USING "btree" ("agent_id");



CREATE INDEX "idx_interaction_logs_created" ON "public"."interaction_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_interaction_logs_member" ON "public"."interaction_logs" USING "btree" ("member_id");



CREATE INDEX "idx_interaction_logs_org" ON "public"."interaction_logs" USING "btree" ("org_id");



CREATE INDEX "idx_invoices_member_id" ON "public"."invoices" USING "btree" ("member_id");



CREATE INDEX "idx_lab_results_member_id" ON "public"."lab_results" USING "btree" ("member_id");



CREATE INDEX "idx_lead_activities_created_at" ON "public"."lead_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_lead_activities_created_by" ON "public"."lead_activities" USING "btree" ("created_by");



CREATE INDEX "idx_lead_activities_lead_id" ON "public"."lead_activities" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_activities_org_id" ON "public"."lead_activities" USING "btree" ("org_id");



CREATE INDEX "idx_lead_activities_type" ON "public"."lead_activities" USING "btree" ("activity_type");



CREATE INDEX "idx_lead_notifications_acknowledged_by" ON "public"."lead_notifications" USING "btree" ("acknowledged_by");



CREATE INDEX "idx_lead_notifications_lead_id" ON "public"."lead_notifications" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_notifications_notified_at" ON "public"."lead_notifications" USING "btree" ("notified_at" DESC);



CREATE INDEX "idx_lead_notifications_org_id" ON "public"."lead_notifications" USING "btree" ("org_id");



CREATE INDEX "idx_lead_notifications_priority" ON "public"."lead_notifications" USING "btree" ("priority");



CREATE INDEX "idx_lead_notifications_unacknowledged" ON "public"."lead_notifications" USING "btree" ("acknowledged_at") WHERE ("acknowledged_at" IS NULL);



CREATE INDEX "idx_lead_routing_logs_clicked_at" ON "public"."lead_routing_logs" USING "btree" ("clicked_at" DESC);



CREATE INDEX "idx_lead_routing_logs_cta_type" ON "public"."lead_routing_logs" USING "btree" ("cta_type");



CREATE INDEX "idx_lead_routing_logs_session_id" ON "public"."lead_routing_logs" USING "btree" ("session_id");



CREATE INDEX "idx_lead_routing_logs_user_id" ON "public"."lead_routing_logs" USING "btree" ("user_id");



CREATE INDEX "idx_lead_submissions_assigned_to" ON "public"."lead_submissions" USING "btree" ("assigned_to");



CREATE INDEX "idx_lead_submissions_referral_source" ON "public"."lead_submissions" USING "btree" ("referral_source");



CREATE INDEX "idx_lead_tasks_assigned_to" ON "public"."lead_tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_lead_tasks_completed" ON "public"."lead_tasks" USING "btree" ("completed");



CREATE INDEX "idx_lead_tasks_completed_by" ON "public"."lead_tasks" USING "btree" ("completed_by");



CREATE INDEX "idx_lead_tasks_created_by" ON "public"."lead_tasks" USING "btree" ("created_by");



CREATE INDEX "idx_lead_tasks_due_date" ON "public"."lead_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_lead_tasks_lead_id" ON "public"."lead_tasks" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_tasks_org_id" ON "public"."lead_tasks" USING "btree" ("org_id");



CREATE INDEX "idx_lead_tasks_overdue" ON "public"."lead_tasks" USING "btree" ("due_date") WHERE ("completed" = false);



CREATE INDEX "idx_leads_assigned_advisor_id" ON "public"."leads" USING "btree" ("assigned_advisor_id");



CREATE INDEX "idx_leads_assigned_to" ON "public"."leads" USING "btree" ("assigned_to");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_email" ON "public"."leads" USING "btree" ("email");



CREATE INDEX "idx_leads_org_id" ON "public"."leads" USING "btree" ("org_id");



CREATE INDEX "idx_leads_phone" ON "public"."leads" USING "btree" ("phone");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("org_id", "status");



CREATE INDEX "idx_lesson_completions_advisor" ON "public"."advisor_lesson_completions" USING "btree" ("advisor_id");



CREATE INDEX "idx_lesson_completions_enrollment" ON "public"."advisor_lesson_completions" USING "btree" ("enrollment_id");



CREATE INDEX "idx_lms_courses_provider" ON "public"."external_lms_courses" USING "btree" ("lms_provider");



CREATE INDEX "idx_lms_lessons_course" ON "public"."external_lms_lessons" USING "btree" ("course_id");



CREATE INDEX "idx_mail_accounts_next_sync" ON "public"."mail_accounts" USING "btree" ("last_sync_at") WHERE (("auto_sync" = true) AND ("is_active" = true));



CREATE INDEX "idx_mail_accounts_org" ON "public"."mail_accounts" USING "btree" ("org_id");



CREATE INDEX "idx_mail_accounts_sync" ON "public"."mail_accounts" USING "btree" ("sync_status") WHERE ("is_active" = true);



CREATE INDEX "idx_mail_accounts_user" ON "public"."mail_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_mail_audit_log_account" ON "public"."mail_audit_log" USING "btree" ("account_id", "created_at" DESC);



CREATE INDEX "idx_mail_audit_log_action" ON "public"."mail_audit_log" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_mail_audit_log_org" ON "public"."mail_audit_log" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_mail_domains_created_by" ON "public"."mail_domains" USING "btree" ("created_by");



CREATE INDEX "idx_mail_domains_org" ON "public"."mail_domains" USING "btree" ("org_id");



CREATE INDEX "idx_mail_domains_pending" ON "public"."mail_domains" USING "btree" ("next_check_at") WHERE ("is_active" = true);



CREATE INDEX "idx_mail_folders_account" ON "public"."mail_folders" USING "btree" ("account_id");



CREATE INDEX "idx_mail_folders_parent_folder_id" ON "public"."mail_folders" USING "btree" ("parent_folder_id");



CREATE INDEX "idx_mail_folders_type" ON "public"."mail_folders" USING "btree" ("account_id", "folder_type");



CREATE INDEX "idx_mail_message_attachments_msg" ON "public"."mail_message_attachments" USING "btree" ("message_id");



CREATE INDEX "idx_mail_messages_account" ON "public"."mail_messages" USING "btree" ("account_id");



CREATE INDEX "idx_mail_messages_flagged" ON "public"."mail_messages" USING "btree" ("account_id") WHERE ("is_flagged" = true);



CREATE INDEX "idx_mail_messages_folder" ON "public"."mail_messages" USING "btree" ("folder_id");



CREATE INDEX "idx_mail_messages_from" ON "public"."mail_messages" USING "btree" ("from_address");



CREATE INDEX "idx_mail_messages_fts" ON "public"."mail_messages" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((((COALESCE("subject", ''::"text") || ' '::"text") || COALESCE("snippet", ''::"text")) || ' '::"text") || COALESCE("from_name", ''::"text")) || ' '::"text") || COALESCE("from_address", ''::"text"))));



CREATE INDEX "idx_mail_messages_received" ON "public"."mail_messages" USING "btree" ("account_id", "received_at" DESC);



CREATE INDEX "idx_mail_messages_thread" ON "public"."mail_messages" USING "btree" ("account_id", "provider_thread_id");



CREATE INDEX "idx_mail_messages_unread" ON "public"."mail_messages" USING "btree" ("account_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_mail_rules_account" ON "public"."mail_rules" USING "btree" ("account_id");



CREATE INDEX "idx_mail_rules_active" ON "public"."mail_rules" USING "btree" ("account_id", "is_active", "priority");



CREATE INDEX "idx_mail_sender_identities_created_by" ON "public"."mail_sender_identities" USING "btree" ("created_by");



CREATE INDEX "idx_mail_sender_identities_domain_id" ON "public"."mail_sender_identities" USING "btree" ("domain_id");



CREATE INDEX "idx_mail_shared_access_granted_by" ON "public"."mail_shared_access" USING "btree" ("granted_by");



CREATE INDEX "idx_mail_shared_access_grantee_user_id" ON "public"."mail_shared_access" USING "btree" ("grantee_user_id");



CREATE INDEX "idx_mail_sync_jobs_account" ON "public"."mail_sync_jobs" USING "btree" ("account_id");



CREATE INDEX "idx_mail_sync_jobs_pending" ON "public"."mail_sync_jobs" USING "btree" ("status", "priority" DESC, "created_at") WHERE ("status" = 'pending'::"public"."mail_job_status");



CREATE INDEX "idx_marketing_campaigns_channel" ON "public"."marketing_campaigns" USING "btree" ("channel");



CREATE INDEX "idx_marketing_campaigns_dates" ON "public"."marketing_campaigns" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_marketing_campaigns_status" ON "public"."marketing_campaigns" USING "btree" ("status");



CREATE INDEX "idx_maternity_coverage_stages_maternity_coverage_id" ON "public"."maternity_coverage_stages" USING "btree" ("maternity_coverage_id");



CREATE INDEX "idx_meeting_invitations_advisor" ON "public"."meeting_invitations" USING "btree" ("advisor_id");



CREATE INDEX "idx_meeting_invitations_meeting" ON "public"."meeting_invitations" USING "btree" ("meeting_id");



CREATE INDEX "idx_meeting_invitations_org_id" ON "public"."meeting_invitations" USING "btree" ("org_id");



CREATE INDEX "idx_meeting_invitations_status" ON "public"."meeting_invitations" USING "btree" ("status");



CREATE INDEX "idx_meeting_templates_created_by" ON "public"."meeting_templates" USING "btree" ("created_by");



CREATE INDEX "idx_member_coverage_member_id" ON "public"."member_coverage" USING "btree" ("member_id");



CREATE INDEX "idx_member_dependents_member_id" ON "public"."member_dependents" USING "btree" ("member_id");



CREATE INDEX "idx_member_documents_category" ON "public"."member_documents" USING "btree" ("document_category");



CREATE INDEX "idx_member_documents_member_id" ON "public"."member_documents" USING "btree" ("member_id");



CREATE INDEX "idx_member_documents_uploaded_by" ON "public"."member_documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_member_profiles_advisor" ON "public"."member_profiles" USING "btree" ("assigned_advisor_id");



CREATE INDEX "idx_member_profiles_enrollment_date" ON "public"."member_profiles" USING "btree" ("enrollment_date");



CREATE INDEX "idx_member_profiles_membership_number" ON "public"."member_profiles" USING "btree" ("membership_number");



CREATE INDEX "idx_member_profiles_status" ON "public"."member_profiles" USING "btree" ("membership_status");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_parent_message_id" ON "public"."messages" USING "btree" ("parent_message_id");



CREATE INDEX "idx_messages_recipient_id" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_navigation_analytics_navigation_item_id" ON "public"."navigation_analytics" USING "btree" ("navigation_item_id");



CREATE INDEX "idx_navigation_analytics_user_id" ON "public"."navigation_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_navigation_items_active" ON "public"."navigation_items" USING "btree" ("is_active");



CREATE INDEX "idx_navigation_items_order" ON "public"."navigation_items" USING "btree" ("order_position");



CREATE INDEX "idx_navigation_items_parent_id" ON "public"."navigation_items" USING "btree" ("parent_id");



CREATE INDEX "idx_newsletter_campaigns_blog_post" ON "public"."newsletter_campaigns" USING "btree" ("blog_post_id");



CREATE INDEX "idx_newsletter_campaigns_created_by" ON "public"."newsletter_campaigns" USING "btree" ("created_by");



CREATE INDEX "idx_newsletter_campaigns_send_at" ON "public"."newsletter_campaigns" USING "btree" ("send_at");



CREATE INDEX "idx_newsletter_campaigns_status" ON "public"."newsletter_campaigns" USING "btree" ("status");



CREATE INDEX "idx_newsletter_queue_campaign" ON "public"."newsletter_queue" USING "btree" ("campaign_id");



CREATE INDEX "idx_newsletter_queue_status" ON "public"."newsletter_queue" USING "btree" ("status");



CREATE INDEX "idx_newsletter_queue_subscriber" ON "public"."newsletter_queue" USING "btree" ("subscriber_id");



CREATE INDEX "idx_newsletter_queue_tracking_token" ON "public"."newsletter_queue" USING "btree" ("tracking_token");



CREATE INDEX "idx_newsletter_subscribers_created_at" ON "public"."newsletter_subscribers" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_newsletter_subscribers_email" ON "public"."newsletter_subscribers" USING "btree" ("email");



CREATE INDEX "idx_newsletter_subscribers_source" ON "public"."newsletter_subscribers" USING "btree" ("source");



CREATE INDEX "idx_newsletter_subscribers_status" ON "public"."newsletter_subscribers" USING "btree" ("status");



CREATE INDEX "idx_note_notifications_note_id" ON "public"."note_notifications" USING "btree" ("note_id");



CREATE INDEX "idx_note_notifications_recipient" ON "public"."note_notifications" USING "btree" ("recipient_user_id");



CREATE INDEX "idx_note_notifications_unread" ON "public"."note_notifications" USING "btree" ("is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_note_shares_note_id" ON "public"."note_shares" USING "btree" ("note_id");



CREATE INDEX "idx_note_shares_shared_by_user_id" ON "public"."note_shares" USING "btree" ("shared_by_user_id");



CREATE INDEX "idx_note_shares_shared_with" ON "public"."note_shares" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_notes_created_by" ON "public"."notes" USING "btree" ("created_by");



CREATE INDEX "idx_notes_is_pinned" ON "public"."notes" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_notes_is_shared" ON "public"."notes" USING "btree" ("is_shared");



CREATE INDEX "idx_notes_owner_role" ON "public"."notes" USING "btree" ("owner_role");



CREATE INDEX "idx_notes_user_id" ON "public"."notes" USING "btree" ("user_id");



CREATE INDEX "idx_notification_events_actor_id" ON "public"."notification_events" USING "btree" ("actor_id");



CREATE INDEX "idx_notification_events_org_id" ON "public"."notification_events" USING "btree" ("org_id");



CREATE INDEX "idx_notification_events_user_all" ON "public"."notification_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notification_events_user_unread" ON "public"."notification_events" USING "btree" ("user_id", "is_read", "created_at" DESC) WHERE ("is_read" = false);



CREATE INDEX "idx_notification_log_channel" ON "public"."notification_log" USING "btree" ("channel");



CREATE INDEX "idx_notification_log_created" ON "public"."notification_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notification_log_event_id" ON "public"."notification_log" USING "btree" ("event_id");



CREATE INDEX "idx_notification_log_lead_id" ON "public"."notification_log" USING "btree" ("lead_id");



CREATE INDEX "idx_notification_log_task_id" ON "public"."notification_log" USING "btree" ("task_id");



CREATE INDEX "idx_notification_log_user" ON "public"."notification_log" USING "btree" ("user_id");



CREATE INDEX "idx_notification_preferences_user" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_notification_settings_user_org" ON "public"."notification_settings" USING "btree" ("user_id", "org_id");



CREATE INDEX "idx_notifications_activity_id" ON "public"."notifications" USING "btree" ("activity_id");



CREATE INDEX "idx_notifications_category" ON "public"."notifications" USING "btree" ("user_id", "category", "created_at" DESC);



CREATE INDEX "idx_notifications_is_read" ON "public"."member_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_member_id" ON "public"."member_notifications" USING "btree" ("member_id");



CREATE INDEX "idx_notifications_org_id" ON "public"."notifications" USING "btree" ("org_id");



CREATE INDEX "idx_notifications_user_all" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC) WHERE (("is_read" = false) AND ("is_dismissed" = false));



CREATE INDEX "idx_onboarding_progress_advisor" ON "public"."onboarding_progress" USING "btree" ("advisor_id");



CREATE INDEX "idx_onboarding_progress_org_id" ON "public"."onboarding_progress" USING "btree" ("org_id");



CREATE INDEX "idx_onboarding_progress_step_id" ON "public"."onboarding_progress" USING "btree" ("step_id");



CREATE INDEX "idx_onboarding_steps_org_id" ON "public"."onboarding_steps" USING "btree" ("org_id");



CREATE INDEX "idx_org_invites_accepted_by" ON "public"."org_invites" USING "btree" ("accepted_by");



CREATE INDEX "idx_org_invites_email" ON "public"."org_invites" USING "btree" ("email");



CREATE INDEX "idx_org_invites_expires_at" ON "public"."org_invites" USING "btree" ("expires_at");



CREATE INDEX "idx_org_invites_invited_by" ON "public"."org_invites" USING "btree" ("invited_by");



CREATE INDEX "idx_org_invites_org_id" ON "public"."org_invites" USING "btree" ("org_id");



CREATE INDEX "idx_org_invites_status" ON "public"."org_invites" USING "btree" ("status");



CREATE INDEX "idx_org_invites_token" ON "public"."org_invites" USING "btree" ("token");



CREATE INDEX "idx_org_memberships_invited_by" ON "public"."org_memberships" USING "btree" ("invited_by");



CREATE INDEX "idx_org_memberships_org_id" ON "public"."org_memberships" USING "btree" ("org_id");



CREATE INDEX "idx_org_memberships_org_role" ON "public"."org_memberships" USING "btree" ("org_id", "role");



CREATE INDEX "idx_org_memberships_org_user_status" ON "public"."org_memberships" USING "btree" ("org_id", "user_id", "status");



CREATE INDEX "idx_org_memberships_role" ON "public"."org_memberships" USING "btree" ("role");



CREATE INDEX "idx_org_memberships_status" ON "public"."org_memberships" USING "btree" ("status");



CREATE INDEX "idx_org_memberships_user_id" ON "public"."org_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_org_memberships_user_org" ON "public"."org_memberships" USING "btree" ("user_id", "org_id");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_organizations_subscription_status" ON "public"."organizations" USING "btree" ("subscription_status");



CREATE INDEX "idx_organizations_subscription_tier" ON "public"."organizations" USING "btree" ("subscription_tier");



CREATE INDEX "idx_outlook_config_active" ON "public"."outlook_config" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_page_performance_date" ON "public"."page_performance" USING "btree" ("date" DESC);



CREATE INDEX "idx_page_performance_page_path" ON "public"."page_performance" USING "btree" ("page_path");



CREATE INDEX "idx_page_performance_views" ON "public"."page_performance" USING "btree" ("views" DESC);



CREATE INDEX "idx_page_views_created_at" ON "public"."page_views" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_page_views_device_type" ON "public"."page_views" USING "btree" ("device_type");



CREATE INDEX "idx_page_views_path" ON "public"."page_views" USING "btree" ("path");



CREATE INDEX "idx_page_views_session_id" ON "public"."page_views" USING "btree" ("session_id");



CREATE INDEX "idx_page_views_user_id" ON "public"."page_views" USING "btree" ("user_id");



CREATE INDEX "idx_payment_methods_member_id" ON "public"."payment_methods" USING "btree" ("member_id");



CREATE INDEX "idx_payment_processors_created_by" ON "public"."payment_processors" USING "btree" ("created_by");



CREATE INDEX "idx_payment_processors_org" ON "public"."payment_processors" USING "btree" ("org_id");



CREATE INDEX "idx_performance_goals_org_id" ON "public"."performance_goals" USING "btree" ("org_id");



CREATE INDEX "idx_performance_goals_user_id" ON "public"."performance_goals" USING "btree" ("user_id");



CREATE INDEX "idx_permissions_category" ON "public"."permissions" USING "btree" ("category") WHERE ("category" IS NOT NULL);



CREATE INDEX "idx_plan_category_features_category" ON "public"."plan_category_features" USING "btree" ("category_id");



CREATE INDEX "idx_plan_category_profiles_category" ON "public"."plan_category_profiles" USING "btree" ("category_id");



CREATE INDEX "idx_plan_features_plan_id" ON "public"."plan_features" USING "btree" ("plan_id");



CREATE INDEX "idx_plan_pricing_plan_id" ON "public"."plan_pricing" USING "btree" ("plan_id");



CREATE INDEX "idx_plan_pricing_rate_lookup" ON "public"."plan_pricing" USING "btree" ("plan_id", "effective_date", "member_type", "iua_amount");



CREATE INDEX "idx_plan_sharing_plan_id" ON "public"."plan_sharing_details" USING "btree" ("plan_id");



CREATE INDEX "idx_plans_active" ON "public"."plans" USING "btree" ("is_active");



CREATE INDEX "idx_plans_slug" ON "public"."plans" USING "btree" ("slug");



CREATE INDEX "idx_prescriptions_member_id" ON "public"."prescriptions" USING "btree" ("member_id");



CREATE INDEX "idx_prescriptions_pharmacy_id" ON "public"."prescriptions" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_prescriptions_provider_id" ON "public"."prescriptions" USING "btree" ("provider_id");



CREATE INDEX "idx_prescriptions_status" ON "public"."prescriptions" USING "btree" ("status");



CREATE INDEX "idx_priority_items_active" ON "public"."priority_items" USING "btree" ("org_id", "completed_at") WHERE ("completed_at" IS NULL);



CREATE INDEX "idx_priority_items_contact_id" ON "public"."priority_items" USING "btree" ("contact_id");



CREATE INDEX "idx_priority_items_lane_id" ON "public"."priority_items" USING "btree" ("lane_id");



CREATE INDEX "idx_priority_items_lead_id" ON "public"."priority_items" USING "btree" ("lead_id");



CREATE INDEX "idx_priority_items_org_id" ON "public"."priority_items" USING "btree" ("org_id");



CREATE INDEX "idx_priority_items_owner" ON "public"."priority_items" USING "btree" ("owner_user_id");



CREATE INDEX "idx_priority_items_rank" ON "public"."priority_items" USING "btree" ("lane_id", "rank");



CREATE INDEX "idx_priority_items_score" ON "public"."priority_items" USING "btree" ("org_id", "score" DESC);



CREATE INDEX "idx_priority_items_snoozed" ON "public"."priority_items" USING "btree" ("snoozed_until") WHERE ("snoozed_until" IS NOT NULL);



CREATE INDEX "idx_priority_lanes_active" ON "public"."priority_lanes" USING "btree" ("org_id", "is_active");



CREATE INDEX "idx_priority_lanes_created_by" ON "public"."priority_lanes" USING "btree" ("created_by");



CREATE INDEX "idx_priority_lanes_order" ON "public"."priority_lanes" USING "btree" ("org_id", "order_index");



CREATE INDEX "idx_priority_lanes_org_id" ON "public"."priority_lanes" USING "btree" ("org_id");



CREATE INDEX "idx_promo_code_usage_promo_code_id" ON "public"."promo_code_usage" USING "btree" ("promo_code_id");



CREATE INDEX "idx_promo_code_usage_user_id" ON "public"."promo_code_usage" USING "btree" ("user_id");



CREATE INDEX "idx_promo_codes_active" ON "public"."promo_codes" USING "btree" ("is_active", "valid_until");



CREATE INDEX "idx_promo_codes_code" ON "public"."promo_codes" USING "btree" ("code");



CREATE INDEX "idx_promo_codes_created_by" ON "public"."promo_codes" USING "btree" ("created_by");



CREATE INDEX "idx_promo_codes_org" ON "public"."promo_codes" USING "btree" ("org_id");



CREATE INDEX "idx_provider_locations_provider_id" ON "public"."provider_locations" USING "btree" ("provider_id");



CREATE INDEX "idx_providers_npi" ON "public"."providers" USING "btree" ("npi");



CREATE INDEX "idx_push_subs_user" ON "public"."device_push_subscriptions" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX "idx_quick_actions_category" ON "public"."quick_actions" USING "btree" ("category");



CREATE INDEX "idx_quick_actions_org" ON "public"."quick_actions" USING "btree" ("org_id");



CREATE INDEX "idx_rate_config_active" ON "public"."rate_configuration" USING "btree" ("is_active");



CREATE INDEX "idx_rate_config_age_band" ON "public"."rate_configuration" USING "btree" ("age_band");



CREATE INDEX "idx_rate_config_effective" ON "public"."rate_configuration" USING "btree" ("effective_date");



CREATE INDEX "idx_rate_config_plan" ON "public"."rate_configuration" USING "btree" ("plan_name");



CREATE INDEX "idx_report_exports_exported_at" ON "public"."report_exports" USING "btree" ("exported_at" DESC);



CREATE INDEX "idx_report_exports_exported_by" ON "public"."report_exports" USING "btree" ("exported_by");



CREATE INDEX "idx_report_exports_org" ON "public"."report_exports" USING "btree" ("org_id");



CREATE INDEX "idx_report_exports_saved_report_id" ON "public"."report_exports" USING "btree" ("saved_report_id");



CREATE INDEX "idx_resource_library_published" ON "public"."resource_library" USING "btree" ("is_published");



CREATE INDEX "idx_resource_library_type" ON "public"."resource_library" USING "btree" ("resource_type");



CREATE INDEX "idx_role_permissions_granted_by" ON "public"."role_permissions" USING "btree" ("granted_by");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_saved_reports_created_by" ON "public"."saved_reports" USING "btree" ("created_by");



CREATE INDEX "idx_saved_reports_org" ON "public"."saved_reports" USING "btree" ("org_id");



CREATE INDEX "idx_saved_reports_type" ON "public"."saved_reports" USING "btree" ("report_type");



CREATE INDEX "idx_scoring_rules_active" ON "public"."scoring_rules" USING "btree" ("org_id", "is_active");



CREATE INDEX "idx_scoring_rules_created_by" ON "public"."scoring_rules" USING "btree" ("created_by");



CREATE INDEX "idx_scoring_rules_lane_assignment" ON "public"."scoring_rules" USING "btree" ("lane_assignment");



CREATE INDEX "idx_scoring_rules_order" ON "public"."scoring_rules" USING "btree" ("org_id", "execution_order");



CREATE INDEX "idx_scoring_rules_org_id" ON "public"."scoring_rules" USING "btree" ("org_id");



CREATE INDEX "idx_scoring_rules_trigger" ON "public"."scoring_rules" USING "btree" ("org_id", "trigger_type");



CREATE INDEX "idx_security_alert_log_sent_at" ON "public"."security_alert_log" USING "btree" ("sent_at" DESC);



CREATE INDEX "idx_security_alert_log_webhook_sent" ON "public"."security_alert_log" USING "btree" ("webhook_id", "sent_at" DESC);



CREATE INDEX "idx_security_alert_webhooks_created_by" ON "public"."security_alert_webhooks" USING "btree" ("created_by");



CREATE INDEX "idx_security_alert_webhooks_enabled" ON "public"."security_alert_webhooks" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_seo_backlinks_da" ON "public"."seo_backlinks" USING "btree" ("domain_authority" DESC);



CREATE INDEX "idx_seo_backlinks_site" ON "public"."seo_backlinks" USING "btree" ("site_url");



CREATE INDEX "idx_seo_backlinks_source_domain" ON "public"."seo_backlinks" USING "btree" ("source_domain");



CREATE INDEX "idx_seo_backlinks_status" ON "public"."seo_backlinks" USING "btree" ("status");



CREATE INDEX "idx_seo_daily_summary_date" ON "public"."seo_daily_summary" USING "btree" ("date" DESC);



CREATE INDEX "idx_seo_daily_summary_site" ON "public"."seo_daily_summary" USING "btree" ("site_url");



CREATE INDEX "idx_seo_google_credentials_created_by" ON "public"."seo_google_credentials" USING "btree" ("created_by");



CREATE INDEX "idx_seo_google_credentials_site" ON "public"."seo_google_credentials" USING "btree" ("site_url");



CREATE INDEX "idx_seo_keyword_rankings_date" ON "public"."seo_keyword_rankings" USING "btree" ("date" DESC);



CREATE INDEX "idx_seo_keyword_rankings_keyword" ON "public"."seo_keyword_rankings" USING "btree" ("keyword");



CREATE INDEX "idx_seo_keyword_rankings_position" ON "public"."seo_keyword_rankings" USING "btree" ("position");



CREATE INDEX "idx_seo_keyword_rankings_site" ON "public"."seo_keyword_rankings" USING "btree" ("site_url");



CREATE INDEX "idx_seo_keyword_rankings_trend" ON "public"."seo_keyword_rankings" USING "btree" ("trend");



CREATE INDEX "idx_seo_keywords_clicks" ON "public"."seo_keywords" USING "btree" ("clicks" DESC);



CREATE INDEX "idx_seo_keywords_composite" ON "public"."seo_keywords" USING "btree" ("site_url", "date", "keyword");



CREATE INDEX "idx_seo_keywords_date" ON "public"."seo_keywords" USING "btree" ("date" DESC);



CREATE INDEX "idx_seo_keywords_keyword" ON "public"."seo_keywords" USING "btree" ("keyword");



CREATE INDEX "idx_seo_keywords_position" ON "public"."seo_keywords" USING "btree" ("position");



CREATE INDEX "idx_seo_keywords_site" ON "public"."seo_keywords" USING "btree" ("site_url");



CREATE INDEX "idx_seo_metadata_path" ON "public"."seo_metadata" USING "btree" ("page_path");



CREATE INDEX "idx_seo_pages_clicks" ON "public"."seo_pages" USING "btree" ("clicks" DESC);



CREATE INDEX "idx_seo_pages_date" ON "public"."seo_pages" USING "btree" ("date" DESC);



CREATE INDEX "idx_seo_pages_site" ON "public"."seo_pages" USING "btree" ("site_url");



CREATE INDEX "idx_seo_pages_url" ON "public"."seo_pages" USING "btree" ("page_url");



CREATE INDEX "idx_seo_sync_logs_created" ON "public"."seo_sync_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_seo_sync_logs_site" ON "public"."seo_sync_logs" USING "btree" ("site_url");



CREATE INDEX "idx_sequences_created_by" ON "public"."sequences" USING "btree" ("created_by");



CREATE INDEX "idx_sequences_org_id" ON "public"."sequences" USING "btree" ("org_id");



CREATE INDEX "idx_site_analytics_date" ON "public"."site_analytics" USING "btree" ("date" DESC);



CREATE INDEX "idx_site_settings_category" ON "public"."site_settings" USING "btree" ("category");



CREATE INDEX "idx_site_settings_key" ON "public"."site_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_site_settings_public" ON "public"."site_settings" USING "btree" ("is_public");



CREATE INDEX "idx_sms_accounts_created_by" ON "public"."sms_accounts" USING "btree" ("created_by");



CREATE INDEX "idx_sms_accounts_org" ON "public"."sms_accounts" USING "btree" ("org_id");



CREATE INDEX "idx_sms_log_org" ON "public"."sms_log" USING "btree" ("org_id");



CREATE INDEX "idx_sms_log_sent_at" ON "public"."sms_log" USING "btree" ("sent_at" DESC);



CREATE INDEX "idx_sms_log_sent_by" ON "public"."sms_log" USING "btree" ("sent_by");



CREATE INDEX "idx_sms_log_sms_account_id" ON "public"."sms_log" USING "btree" ("sms_account_id");



CREATE INDEX "idx_sms_log_template_id" ON "public"."sms_log" USING "btree" ("template_id");



CREATE INDEX "idx_sop_categories_parent_id" ON "public"."sop_categories" USING "btree" ("parent_id");



CREATE INDEX "idx_sop_documents_active" ON "public"."sop_documents" USING "btree" ("is_active");



CREATE INDEX "idx_sop_documents_category" ON "public"."sop_documents" USING "btree" ("category");



CREATE INDEX "idx_sop_documents_created_by" ON "public"."sop_documents" USING "btree" ("created_by");



CREATE INDEX "idx_sop_documents_is_published" ON "public"."sop_documents" USING "btree" ("is_published");



CREATE INDEX "idx_sop_documents_order" ON "public"."sop_documents" USING "btree" ("order_index");



CREATE INDEX "idx_sop_documents_org_id" ON "public"."sop_documents" USING "btree" ("org_id");



CREATE INDEX "idx_studio_fields_api_name" ON "public"."crm_studio_fields" USING "btree" ("module_id", "api_name");



CREATE INDEX "idx_studio_fields_module" ON "public"."crm_studio_fields" USING "btree" ("module_id");



CREATE INDEX "idx_studio_fields_org" ON "public"."crm_studio_fields" USING "btree" ("org_id");



CREATE INDEX "idx_studio_fields_sort" ON "public"."crm_studio_fields" USING "btree" ("module_id", "sort_order");



CREATE INDEX "idx_studio_layouts_default" ON "public"."crm_studio_layouts" USING "btree" ("module_id", "layout_type", "is_default");



CREATE INDEX "idx_studio_layouts_module" ON "public"."crm_studio_layouts" USING "btree" ("module_id");



CREATE INDEX "idx_studio_layouts_org" ON "public"."crm_studio_layouts" USING "btree" ("org_id");



CREATE INDEX "idx_studio_layouts_type" ON "public"."crm_studio_layouts" USING "btree" ("module_id", "layout_type");



CREATE INDEX "idx_studio_modules_active" ON "public"."crm_studio_modules" USING "btree" ("org_id", "is_active");



CREATE INDEX "idx_studio_modules_api_name" ON "public"."crm_studio_modules" USING "btree" ("org_id", "api_name");



CREATE INDEX "idx_studio_modules_org" ON "public"."crm_studio_modules" USING "btree" ("org_id");



CREATE INDEX "idx_studio_validation_active" ON "public"."crm_studio_validation_rules" USING "btree" ("module_id", "is_active");



CREATE INDEX "idx_studio_validation_module" ON "public"."crm_studio_validation_rules" USING "btree" ("module_id");



CREATE INDEX "idx_studio_validation_org" ON "public"."crm_studio_validation_rules" USING "btree" ("org_id");



CREATE INDEX "idx_studio_views_module" ON "public"."crm_studio_views" USING "btree" ("module_id");



CREATE INDEX "idx_studio_views_org" ON "public"."crm_studio_views" USING "btree" ("org_id");



CREATE INDEX "idx_studio_views_owner" ON "public"."crm_studio_views" USING "btree" ("owner_id");



CREATE INDEX "idx_studio_views_visibility" ON "public"."crm_studio_views" USING "btree" ("module_id", "visibility");



CREATE INDEX "idx_support_tickets_assigned_to" ON "public"."support_tickets" USING "btree" ("assigned_to");



CREATE INDEX "idx_support_tickets_member_id" ON "public"."support_tickets" USING "btree" ("member_id");



CREATE INDEX "idx_support_tickets_status" ON "public"."support_tickets" USING "btree" ("status");



CREATE INDEX "idx_system_settings_category" ON "public"."system_settings" USING "btree" ("category");



CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("key");



CREATE INDEX "idx_tag_firing_rules_tag" ON "public"."tag_firing_rules" USING "btree" ("tag_id");



CREATE INDEX "idx_tag_firing_rules_type" ON "public"."tag_firing_rules" USING "btree" ("rule_type");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_created_by" ON "public"."tasks" USING "btree" ("created_by");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date") WHERE ("status" <> ALL (ARRAY['completed'::"text", 'cancelled'::"text"]));



CREATE INDEX "idx_tasks_lead_id" ON "public"."tasks" USING "btree" ("lead_id");



CREATE INDEX "idx_tasks_org_id" ON "public"."tasks" USING "btree" ("org_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("org_id", "status");



CREATE INDEX "idx_terminal_commands_session_id" ON "public"."advisor_terminal_commands" USING "btree" ("session_id");



CREATE INDEX "idx_terminal_commands_user_id" ON "public"."advisor_terminal_commands" USING "btree" ("user_id");



CREATE INDEX "idx_terminal_sessions_session_id" ON "public"."advisor_terminal_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_terminal_sessions_user_id" ON "public"."advisor_terminal_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_ticket_categories_display_order" ON "public"."ticket_categories" USING "btree" ("display_order");



CREATE INDEX "idx_tool_permissions_tool_name" ON "public"."terminal_tool_permissions" USING "btree" ("tool_name");



CREATE INDEX "idx_tracking_event_log_created" ON "public"."tracking_event_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_tracking_event_log_name" ON "public"."tracking_event_log" USING "btree" ("event_name");



CREATE INDEX "idx_tracking_event_log_platform" ON "public"."tracking_event_log" USING "btree" ("platform_name");



CREATE INDEX "idx_tracking_event_log_type" ON "public"."tracking_event_log" USING "btree" ("event_type");



CREATE INDEX "idx_tracking_event_log_user" ON "public"."tracking_event_log" USING "btree" ("user_id");



CREATE INDEX "idx_tracking_platforms_active" ON "public"."tracking_platforms" USING "btree" ("is_active");



CREATE INDEX "idx_tracking_platforms_type" ON "public"."tracking_platforms" USING "btree" ("platform_type");



CREATE INDEX "idx_tracking_snippets_created_by" ON "public"."tracking_snippets" USING "btree" ("created_by");



CREATE INDEX "idx_tracking_snippets_enabled" ON "public"."tracking_snippets" USING "btree" ("is_enabled");



CREATE INDEX "idx_tracking_snippets_platform" ON "public"."tracking_snippets" USING "btree" ("platform_id");



CREATE INDEX "idx_tracking_snippets_priority" ON "public"."tracking_snippets" USING "btree" ("load_priority");



CREATE INDEX "idx_tracking_tags_active" ON "public"."tracking_tags" USING "btree" ("is_active");



CREATE INDEX "idx_tracking_tags_category" ON "public"."tracking_tags" USING "btree" ("tag_category");



CREATE INDEX "idx_tracking_tags_created_by" ON "public"."tracking_tags" USING "btree" ("created_by");



CREATE INDEX "idx_tracking_tags_snippet" ON "public"."tracking_tags" USING "btree" ("snippet_id");



CREATE INDEX "idx_traffic_sources_date" ON "public"."traffic_sources" USING "btree" ("date" DESC);



CREATE INDEX "idx_traffic_sources_type" ON "public"."traffic_sources" USING "btree" ("source_type");



CREATE INDEX "idx_training_modules_active" ON "public"."training_modules" USING "btree" ("is_active");



CREATE INDEX "idx_training_modules_category" ON "public"."training_modules" USING "btree" ("category");



CREATE INDEX "idx_training_modules_org_id" ON "public"."training_modules" USING "btree" ("org_id");



CREATE INDEX "idx_training_progress_advisor" ON "public"."training_progress" USING "btree" ("advisor_id");



CREATE INDEX "idx_training_progress_module" ON "public"."training_progress" USING "btree" ("module_id");



CREATE INDEX "idx_training_progress_org_id" ON "public"."training_progress" USING "btree" ("org_id");



CREATE INDEX "idx_training_progress_status" ON "public"."training_progress" USING "btree" ("status");



CREATE INDEX "idx_transactions_claim_id" ON "public"."transactions" USING "btree" ("claim_id");



CREATE INDEX "idx_transactions_member_id" ON "public"."transactions" USING "btree" ("member_id");



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("status");



CREATE INDEX "idx_user_achievements_earned" ON "public"."user_achievements" USING "btree" ("user_id", "is_earned");



CREATE INDEX "idx_user_achievements_org" ON "public"."user_achievements" USING "btree" ("org_id");



CREATE INDEX "idx_user_achievements_user_id" ON "public"."user_achievements" USING "btree" ("user_id");



CREATE INDEX "idx_user_goals_active" ON "public"."crm_user_goals" USING "btree" ("user_id", "status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_user_goals_org" ON "public"."crm_user_goals" USING "btree" ("org_id");



CREATE INDEX "idx_user_goals_period" ON "public"."crm_user_goals" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_user_goals_user" ON "public"."crm_user_goals" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_org_id" ON "public"."user_preferences" USING "btree" ("org_id");



CREATE INDEX "idx_user_presence_last_activity" ON "public"."user_presence" USING "btree" ("last_activity_at" DESC);



CREATE INDEX "idx_user_presence_org" ON "public"."user_presence" USING "btree" ("org_id");



CREATE INDEX "idx_user_presence_status" ON "public"."user_presence" USING "btree" ("status");



CREATE INDEX "idx_user_roles_granted_by" ON "public"."user_roles" USING "btree" ("granted_by");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_utm_campaigns_active" ON "public"."utm_campaigns" USING "btree" ("is_active");



CREATE INDEX "idx_utm_campaigns_campaign" ON "public"."utm_campaigns" USING "btree" ("utm_campaign");



CREATE INDEX "idx_utm_campaigns_created_by" ON "public"."utm_campaigns" USING "btree" ("created_by");



CREATE INDEX "idx_utm_campaigns_medium" ON "public"."utm_campaigns" USING "btree" ("utm_medium");



CREATE INDEX "idx_utm_campaigns_source" ON "public"."utm_campaigns" USING "btree" ("utm_source");



CREATE INDEX "idx_visit_summaries_member_id" ON "public"."visit_summaries" USING "btree" ("member_id");



CREATE INDEX "idx_visit_summaries_provider_id" ON "public"."visit_summaries" USING "btree" ("provider_id");



CREATE INDEX "idx_webhook_logs_created" ON "public"."webhook_delivery_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_event_type" ON "public"."webhook_delivery_logs" USING "btree" ("event_type");



CREATE INDEX "idx_webhook_logs_success" ON "public"."webhook_delivery_logs" USING "btree" ("success");



CREATE INDEX "idx_wordpress_courses_active" ON "public"."wordpress_courses" USING "btree" ("is_active");



CREATE INDEX "idx_wordpress_courses_category" ON "public"."wordpress_courses" USING "btree" ("category");



CREATE INDEX "idx_wordpress_courses_language" ON "public"."wordpress_courses" USING "btree" ("language");



CREATE INDEX "idx_wordpress_courses_slug" ON "public"."wordpress_courses" USING "btree" ("slug");



CREATE INDEX "idx_wordpress_courses_status" ON "public"."wordpress_courses" USING "btree" ("status");



CREATE INDEX "idx_zoho_lead_submissions_assigned_to" ON "public"."zoho_lead_submissions" USING "btree" ("assigned_to");



CREATE INDEX "idx_zoho_lead_submissions_created_at" ON "public"."zoho_lead_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_zoho_lead_submissions_email" ON "public"."zoho_lead_submissions" USING "btree" ("email");



CREATE INDEX "idx_zoho_lead_submissions_interested_plans" ON "public"."zoho_lead_submissions" USING "gin" ("interested_plans");



CREATE INDEX "idx_zoho_lead_submissions_next_followup" ON "public"."zoho_lead_submissions" USING "btree" ("next_followup_at") WHERE ("next_followup_at" IS NOT NULL);



CREATE INDEX "idx_zoho_lead_submissions_org_id" ON "public"."zoho_lead_submissions" USING "btree" ("org_id");



CREATE INDEX "idx_zoho_lead_submissions_pending_sync" ON "public"."zoho_lead_submissions" USING "btree" ("zoho_sync_status", "zoho_sync_attempts") WHERE ("zoho_sync_status" = ANY (ARRAY['pending'::"text", 'failed'::"text"]));



CREATE INDEX "idx_zoho_lead_submissions_pipeline_stage" ON "public"."zoho_lead_submissions" USING "btree" ("pipeline_stage");



CREATE INDEX "idx_zoho_lead_submissions_priority" ON "public"."zoho_lead_submissions" USING "btree" ("priority");



CREATE INDEX "idx_zoho_lead_submissions_quoted_plans" ON "public"."zoho_lead_submissions" USING "gin" ("quoted_plans");



CREATE INDEX "idx_zoho_lead_submissions_sync_status" ON "public"."zoho_lead_submissions" USING "btree" ("zoho_sync_status");



CREATE INDEX "idx_zoho_lead_submissions_tags" ON "public"."zoho_lead_submissions" USING "gin" ("tags");



CREATE INDEX "idx_zoho_lead_submissions_user_id" ON "public"."zoho_lead_submissions" USING "btree" ("user_id");



CREATE INDEX "idx_zoho_lead_submissions_zoho_lead_id" ON "public"."zoho_lead_submissions" USING "btree" ("zoho_lead_id");



CREATE OR REPLACE TRIGGER "admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_admin_users_updated_at"();



CREATE OR REPLACE TRIGGER "advisor_enrollment_links_updated_at" BEFORE UPDATE ON "public"."advisor_enrollment_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_advisor_enrollment_links_updated_at"();



CREATE OR REPLACE TRIGGER "advisor_meetings_updated_at" BEFORE UPDATE ON "public"."advisor_meetings" FOR EACH ROW EXECUTE FUNCTION "public"."update_meeting_status"();



CREATE OR REPLACE TRIGGER "advisor_portal_settings_updated_at" BEFORE UPDATE ON "public"."advisor_portal_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_advisor_portal_settings_updated_at"();



CREATE OR REPLACE TRIGGER "advisor_videos_updated_at" BEFORE UPDATE ON "public"."advisor_videos" FOR EACH ROW EXECUTE FUNCTION "public"."update_advisor_videos_updated_at"();



CREATE OR REPLACE TRIGGER "calculate_acknowledge_time" BEFORE UPDATE ON "public"."lead_notifications" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_time_to_acknowledge"();



CREATE OR REPLACE TRIGGER "mail_accounts_updated_at" BEFORE UPDATE ON "public"."mail_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_mail_updated_at"();



CREATE OR REPLACE TRIGGER "mail_domains_updated_at" BEFORE UPDATE ON "public"."mail_domains" FOR EACH ROW EXECUTE FUNCTION "public"."update_mail_updated_at"();



CREATE OR REPLACE TRIGGER "mail_folders_updated_at" BEFORE UPDATE ON "public"."mail_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_mail_updated_at"();



CREATE OR REPLACE TRIGGER "mail_messages_updated_at" BEFORE UPDATE ON "public"."mail_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_mail_updated_at"();



CREATE OR REPLACE TRIGGER "mail_rules_updated_at" BEFORE UPDATE ON "public"."mail_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_mail_updated_at"();



CREATE OR REPLACE TRIGGER "meeting_invitation_updated" BEFORE UPDATE ON "public"."meeting_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_meeting_invitation_timestamp"();



CREATE OR REPLACE TRIGGER "meeting_template_updated" BEFORE UPDATE ON "public"."meeting_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_meeting_invitation_timestamp"();



CREATE OR REPLACE TRIGGER "on_profile_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_onboarding_updated_at" BEFORE UPDATE ON "public"."onboarding_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_crm_purchase_order_line_items" BEFORE UPDATE ON "public"."crm_purchase_order_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_crm_purchase_orders" BEFORE UPDATE ON "public"."crm_purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_crm_sales_order_line_items" BEFORE UPDATE ON "public"."crm_sales_order_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_crm_sales_orders" BEFORE UPDATE ON "public"."crm_sales_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_crm_vendors" BEFORE UPDATE ON "public"."crm_vendors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_ai_lead_insights_updated" BEFORE UPDATE ON "public"."ai_lead_insights" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_calculate_lead_score" AFTER INSERT OR UPDATE ON "public"."zoho_lead_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_calculate_lead_score"();



CREATE OR REPLACE TRIGGER "trg_calendar_events_set_created_by" BEFORE INSERT ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."calendar_events_set_created_by"();



CREATE OR REPLACE TRIGGER "trg_calendar_events_updated" BEFORE UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_chat_conversations_updated_at" BEFORE UPDATE ON "public"."chat_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_updated_at"();



CREATE OR REPLACE TRIGGER "trg_chat_message_fan_out_notifications" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."fan_out_chat_notification"();



CREATE OR REPLACE TRIGGER "trg_chat_message_update_conversation" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_conversation_last_message"();



CREATE OR REPLACE TRIGGER "trg_chat_messages_updated_at" BEFORE UPDATE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_updated_at"();



CREATE OR REPLACE TRIGGER "trg_crm_calendar_integrations_updated" BEFORE UPDATE ON "public"."crm_calendar_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_crm_case_comments_updated_at" BEFORE UPDATE ON "public"."crm_case_comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_case_comments_updated_at"();



CREATE OR REPLACE TRIGGER "trg_crm_cases_updated_at" BEFORE UPDATE ON "public"."crm_cases" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_cases_updated_at"();



CREATE OR REPLACE TRIGGER "trg_crm_documents_updated_at" BEFORE UPDATE ON "public"."crm_documents" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_documents_updated_at"();



CREATE OR REPLACE TRIGGER "trg_crm_email_sequences_updated" BEFORE UPDATE ON "public"."crm_email_sequences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_crm_meeting_schedules_updated" BEFORE UPDATE ON "public"."crm_meeting_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_crm_saved_views_updated_at" BEFORE UPDATE ON "public"."crm_saved_views" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_saved_views_updated_at"();



CREATE OR REPLACE TRIGGER "trg_crm_template_folders_updated" BEFORE UPDATE ON "public"."crm_template_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_crm_templates_updated" BEFORE UPDATE ON "public"."crm_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_crm_web_forms_updated_at" BEFORE UPDATE ON "public"."crm_web_forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_web_forms_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enrollments_updated_at" BEFORE UPDATE ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_enrollments_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ensure_advisor_profile_on_role_grant" AFTER INSERT ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_advisor_profile_on_role_grant"();



CREATE OR REPLACE TRIGGER "trg_generate_case_number" BEFORE INSERT ON "public"."crm_cases" FOR EACH ROW WHEN ((("new"."case_number" IS NULL) OR ("new"."case_number" = ''::"text"))) EXECUTE FUNCTION "public"."generate_case_number"();



CREATE OR REPLACE TRIGGER "trg_notification_preferences_updated" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_notification_settings_updated_at" BEFORE UPDATE ON "public"."notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trg_push_subs_updated_at" BEFORE UPDATE ON "public"."device_push_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_chat_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_advisor_profile_to_itsts" AFTER INSERT OR UPDATE ON "public"."advisor_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_advisor_profile_to_itsts"();



CREATE OR REPLACE TRIGGER "trg_sync_user_to_itsts" AFTER INSERT OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_to_itsts"();



CREATE OR REPLACE TRIGGER "trg_update_goals_on_lead" AFTER INSERT ON "public"."zoho_lead_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_goal_progress"();



CREATE OR REPLACE TRIGGER "trg_update_goals_on_task" AFTER UPDATE OF "completed" ON "public"."lead_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_goal_progress"();



CREATE OR REPLACE TRIGGER "trigger_calculate_ranking_change" BEFORE INSERT ON "public"."seo_keyword_rankings" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_keyword_ranking_change"();



CREATE OR REPLACE TRIGGER "trigger_cognito_forms_updated_at" BEFORE UPDATE ON "public"."cognito_forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_cognito_forms_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_accounts_updated_at" BEFORE UPDATE ON "public"."crm_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_accounts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_activities_updated_at" BEFORE UPDATE ON "public"."crm_activities" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_activities_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_campaigns_updated_at" BEFORE UPDATE ON "public"."crm_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_campaigns_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_contacts_updated_at" BEFORE UPDATE ON "public"."crm_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_contacts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_deal_products_updated_at" BEFORE INSERT OR UPDATE ON "public"."crm_deal_products" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_deal_products_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_deal_stages_updated_at" BEFORE UPDATE ON "public"."crm_deal_stages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_deal_stages_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_deals_insert" AFTER INSERT ON "public"."crm_deals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_deals_insert"();



CREATE OR REPLACE TRIGGER "trigger_crm_forecast_entries_updated_at" BEFORE INSERT OR UPDATE ON "public"."crm_forecast_entries" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_forecast_entries_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_forecasts_updated_at" BEFORE UPDATE ON "public"."crm_forecasts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_forecasts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_invoice_line_items_updated_at" BEFORE UPDATE ON "public"."crm_invoice_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_invoice_line_items_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_invoices_updated_at" BEFORE UPDATE ON "public"."crm_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_invoices_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_lead_health_quotes_updated" BEFORE UPDATE ON "public"."crm_lead_health_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_plan_interest_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_lead_plan_interests_updated" BEFORE UPDATE ON "public"."crm_lead_plan_interests" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_plan_interest_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_price_book_items_updated_at" BEFORE UPDATE ON "public"."crm_price_book_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_price_book_items_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_price_books_updated_at" BEFORE UPDATE ON "public"."crm_price_books" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_price_books_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_products_updated_at" BEFORE UPDATE ON "public"."crm_products" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_products_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_quote_line_items_updated_at" BEFORE UPDATE ON "public"."crm_quote_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_quote_line_items_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_crm_quotes_updated_at" BEFORE UPDATE ON "public"."crm_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_crm_quotes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_deal_stage_change" BEFORE UPDATE ON "public"."crm_deals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_deal_stage_change"();



CREATE OR REPLACE TRIGGER "trigger_email_draft_updated" BEFORE UPDATE ON "public"."crm_email_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_signature_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_email_signature_updated" BEFORE UPDATE ON "public"."crm_email_signatures" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_signature_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_email_templates_updated_at" BEFORE UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_gemini_prompts_updated_at" BEFORE UPDATE ON "public"."gemini_prompts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_generate_po_number" BEFORE INSERT ON "public"."crm_purchase_orders" FOR EACH ROW WHEN ((("new"."po_number" IS NULL) OR ("new"."po_number" = ''::"text"))) EXECUTE FUNCTION "public"."generate_po_number"();



CREATE OR REPLACE TRIGGER "trigger_generate_so_number" BEFORE INSERT ON "public"."crm_sales_orders" FOR EACH ROW WHEN ((("new"."so_number" IS NULL) OR ("new"."so_number" = ''::"text"))) EXECUTE FUNCTION "public"."generate_so_number"();



CREATE OR REPLACE TRIGGER "trigger_handbooks_updated_at" BEFORE UPDATE ON "public"."handbooks" FOR EACH ROW EXECUTE FUNCTION "public"."update_handbooks_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_increment_email_tracking" AFTER INSERT ON "public"."email_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."increment_email_tracking"();



CREATE OR REPLACE TRIGGER "trigger_increment_promo_usage" AFTER INSERT ON "public"."promo_code_usage" FOR EACH ROW EXECUTE FUNCTION "public"."increment_promo_usage"();



CREATE OR REPLACE TRIGGER "trigger_invoice_number" BEFORE INSERT ON "public"."crm_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."handle_invoice_number"();



CREATE OR REPLACE TRIGGER "trigger_invoice_payment" AFTER INSERT ON "public"."crm_invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_invoice_payment"();



CREATE OR REPLACE TRIGGER "trigger_lead_stage_changed" BEFORE UPDATE ON "public"."zoho_lead_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_lead_stage_changed_at"();



CREATE OR REPLACE TRIGGER "trigger_lead_task_updated" BEFORE UPDATE ON "public"."lead_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_lead_task_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_newsletter_campaigns_updated_at" BEFORE UPDATE ON "public"."newsletter_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_org_memberships_updated_at" BEFORE UPDATE ON "public"."org_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."handle_org_memberships_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_orgs_updated_at" BEFORE UPDATE ON "public"."orgs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_orgs_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_plans_updated_at" BEFORE UPDATE ON "public"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_plans_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_quote_number" BEFORE INSERT ON "public"."crm_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_quote_number"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_deal_amount" AFTER INSERT OR DELETE OR UPDATE ON "public"."crm_deal_products" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_deal_amount"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_invoice_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."crm_invoice_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_invoice_totals"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_quote_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."crm_quote_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_quote_totals"();



CREATE OR REPLACE TRIGGER "trigger_routing_rules_updated" BEFORE UPDATE ON "public"."crm_email_routing_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_routing_rules_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_sync_admin_role_to_user_roles" AFTER UPDATE OF "role" ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."sync_admin_users_role_to_user_roles"();



CREATE OR REPLACE TRIGGER "trigger_sync_admin_role_to_user_roles_insert" AFTER INSERT ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."sync_admin_users_role_to_user_roles"();



CREATE OR REPLACE TRIGGER "trigger_sync_roles_on_delete" AFTER DELETE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_roles_to_legacy"();



CREATE OR REPLACE TRIGGER "trigger_sync_roles_on_insert" AFTER INSERT ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_roles_to_legacy"();



CREATE OR REPLACE TRIGGER "trigger_sync_roles_on_update" AFTER UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_roles_to_legacy"();



CREATE OR REPLACE TRIGGER "trigger_update_advisor_access_updated_at" BEFORE UPDATE ON "public"."advisor_access" FOR EACH ROW EXECUTE FUNCTION "public"."update_advisor_access_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_advisor_plan_resources_updated_at" BEFORE UPDATE ON "public"."advisor_plan_resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_advisor_plan_resources_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_campaign_counts" AFTER INSERT OR UPDATE ON "public"."newsletter_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_campaign_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_campaign_stats" AFTER INSERT OR DELETE OR UPDATE ON "public"."crm_campaign_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_campaign_stats"();



CREATE OR REPLACE TRIGGER "trigger_update_crm_accounts_search" BEFORE INSERT OR UPDATE ON "public"."crm_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_accounts_search"();



CREATE OR REPLACE TRIGGER "trigger_update_crm_contacts_search" BEFORE INSERT OR UPDATE ON "public"."crm_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_contacts_search"();



CREATE OR REPLACE TRIGGER "trigger_update_crm_deals_search" BEFORE INSERT OR UPDATE ON "public"."crm_deals" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_deals_search"();



CREATE OR REPLACE TRIGGER "trigger_update_crm_products_search" BEFORE INSERT OR UPDATE ON "public"."crm_products" FOR EACH ROW EXECUTE FUNCTION "public"."update_crm_products_search"();



CREATE OR REPLACE TRIGGER "trigger_update_security_webhook_timestamp" BEFORE UPDATE ON "public"."security_alert_webhooks" FOR EACH ROW EXECUTE FUNCTION "public"."update_security_webhook_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_session_on_page_view" AFTER INSERT ON "public"."page_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_on_page_view"();



CREATE OR REPLACE TRIGGER "trigger_update_sop_documents_updated_at" BEFORE UPDATE ON "public"."sop_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_sop_documents_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_thread_on_email" AFTER INSERT ON "public"."crm_email_log" FOR EACH ROW EXECUTE FUNCTION "public"."update_thread_on_email"();



CREATE OR REPLACE TRIGGER "trigger_update_user_presence" BEFORE UPDATE ON "public"."user_presence" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_presence"();



CREATE OR REPLACE TRIGGER "trigger_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_roles_updated_at"();



CREATE OR REPLACE TRIGGER "update_advisor_content_categories_updated_at" BEFORE UPDATE ON "public"."advisor_content_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_advisor_content_updated_at" BEFORE UPDATE ON "public"."advisor_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_advisor_profiles_updated_at" BEFORE UPDATE ON "public"."advisor_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_advisors_updated_at" BEFORE UPDATE ON "public"."advisors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_assignments_updated_at" BEFORE UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_assignments_updated_at"();



CREATE OR REPLACE TRIGGER "update_crm_studio_fields_updated_at" BEFORE UPDATE ON "public"."crm_studio_fields" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_studio_layouts_updated_at" BEFORE UPDATE ON "public"."crm_studio_layouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_studio_modules_updated_at" BEFORE UPDATE ON "public"."crm_studio_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_studio_validation_rules_updated_at" BEFORE UPDATE ON "public"."crm_studio_validation_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_studio_views_updated_at" BEFORE UPDATE ON "public"."crm_studio_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_enrollment_progress" AFTER INSERT OR UPDATE ON "public"."advisor_lesson_completions" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_enrollment_progress"();



CREATE OR REPLACE TRIGGER "update_member_documents_updated_at" BEFORE UPDATE ON "public"."member_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_navigation_items_updated_at" BEFORE UPDATE ON "public"."navigation_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_newsletter_subscribers_updated_at" BEFORE UPDATE ON "public"."newsletter_subscribers" FOR EACH ROW EXECUTE FUNCTION "public"."update_newsletter_subscribers_updated_at"();



CREATE OR REPLACE TRIGGER "update_onboarding_progress_updated_at" BEFORE UPDATE ON "public"."onboarding_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_org_memberships_updated_at" BEFORE UPDATE ON "public"."org_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_outlook_config_updated_at" BEFORE UPDATE ON "public"."outlook_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_outlook_config_updated_at"();



CREATE OR REPLACE TRIGGER "update_priority_items_updated_at" BEFORE UPDATE ON "public"."priority_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_priority_lanes_updated_at" BEFORE UPDATE ON "public"."priority_lanes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scoring_rules_updated_at" BEFORE UPDATE ON "public"."scoring_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sop_documents_updated_at" BEFORE UPDATE ON "public"."sop_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_training_modules_updated_at" BEFORE UPDATE ON "public"."training_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_training_progress_updated_at" BEFORE UPDATE ON "public"."training_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_navigation_preferences_updated_at" BEFORE UPDATE ON "public"."user_navigation_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_zoho_lead_submissions_updated_at" BEFORE UPDATE ON "public"."zoho_lead_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_zoho_lead_submission_updated_at"();



CREATE OR REPLACE TRIGGER "user_organization_roles_instead_of_delete" INSTEAD OF DELETE ON "public"."user_organization_roles" FOR EACH ROW EXECUTE FUNCTION "public"."user_organization_roles_delete_trigger"();



CREATE OR REPLACE TRIGGER "user_organization_roles_instead_of_insert" INSTEAD OF INSERT ON "public"."user_organization_roles" FOR EACH ROW EXECUTE FUNCTION "public"."user_organization_roles_insert_trigger"();



CREATE OR REPLACE TRIGGER "user_organization_roles_instead_of_update" INSTEAD OF UPDATE ON "public"."user_organization_roles" FOR EACH ROW EXECUTE FUNCTION "public"."user_organization_roles_update_trigger"();



CREATE OR REPLACE TRIGGER "wordpress_courses_updated_at" BEFORE UPDATE ON "public"."wordpress_courses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_resources"
    ADD CONSTRAINT "admin_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."admin_resources"
    ADD CONSTRAINT "admin_resources_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_announcements"
    ADD CONSTRAINT "advisor_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_content_bookmarks"
    ADD CONSTRAINT "advisor_content_bookmarks_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_content_bookmarks"
    ADD CONSTRAINT "advisor_content_bookmarks_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."advisor_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_content"
    ADD CONSTRAINT "advisor_content_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."advisor_content_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_content_views"
    ADD CONSTRAINT "advisor_content_views_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_content_views"
    ADD CONSTRAINT "advisor_content_views_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."advisor_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_external_training_progress"
    ADD CONSTRAINT "advisor_external_training_progress_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_external_training_progress"
    ADD CONSTRAINT "advisor_external_training_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."training_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_external_training_progress"
    ADD CONSTRAINT "advisor_external_training_progress_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."advisor_learning_paths"
    ADD CONSTRAINT "advisor_learning_paths_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_lesson_completions"
    ADD CONSTRAINT "advisor_lesson_completions_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_lesson_completions"
    ADD CONSTRAINT "advisor_lesson_completions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."advisor_lms_enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_lesson_completions"
    ADD CONSTRAINT "advisor_lesson_completions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."external_lms_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_lms_enrollments"
    ADD CONSTRAINT "advisor_lms_enrollments_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_lms_enrollments"
    ADD CONSTRAINT "advisor_lms_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."external_lms_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_meeting_attendees"
    ADD CONSTRAINT "advisor_meeting_attendees_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id");



ALTER TABLE ONLY "public"."advisor_meeting_attendees"
    ADD CONSTRAINT "advisor_meeting_attendees_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."advisor_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_meeting_attendees"
    ADD CONSTRAINT "advisor_meeting_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."advisor_meeting_reminders"
    ADD CONSTRAINT "advisor_meeting_reminders_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."advisor_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_meetings"
    ADD CONSTRAINT "advisor_meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."advisor_meetings"
    ADD CONSTRAINT "advisor_meetings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_nav_menu"
    ADD CONSTRAINT "advisor_nav_menu_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_plan_resources"
    ADD CONSTRAINT "advisor_plan_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."advisor_plan_resources"
    ADD CONSTRAINT "advisor_plan_resources_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."advisor_portal_settings"
    ADD CONSTRAINT "advisor_portal_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_profiles"
    ADD CONSTRAINT "advisor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_quick_links"
    ADD CONSTRAINT "advisor_quick_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."advisor_terminal_commands"
    ADD CONSTRAINT "advisor_terminal_commands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_terminal_sessions"
    ADD CONSTRAINT "advisor_terminal_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_automation_rules"
    ADD CONSTRAINT "ai_automation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_lead_insights"
    ADD CONSTRAINT "ai_lead_insights_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytics_experiments"
    ADD CONSTRAINT "analytics_experiments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."approved_links"
    ADD CONSTRAINT "approved_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_events"
    ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_events"
    ADD CONSTRAINT "audit_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_execution_log"
    ADD CONSTRAINT "automation_execution_log_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_execution_log"
    ADD CONSTRAINT "automation_execution_log_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."ai_automation_rules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."benefit_usage"
    ADD CONSTRAINT "benefit_usage_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "public"."member_coverage"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_generation_logs"
    ADD CONSTRAINT "blog_generation_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_generation_logs"
    ADD CONSTRAINT "blog_generation_logs_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."gemini_prompts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bulletin_email_notifications"
    ADD CONSTRAINT "bulletin_email_notifications_bulletin_id_fkey" FOREIGN KEY ("bulletin_id") REFERENCES "public"."advisor_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bulletin_email_notifications"
    ADD CONSTRAINT "bulletin_email_notifications_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bulletin_email_recipients"
    ADD CONSTRAINT "bulletin_email_recipients_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bulletin_email_recipients"
    ADD CONSTRAINT "bulletin_email_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."bulletin_email_notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_original_event_id_fkey" FOREIGN KEY ("original_event_id") REFERENCES "public"."calendar_events"("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."chat_messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_dependent_id_fkey" FOREIGN KEY ("dependent_id") REFERENCES "public"."member_dependents"("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."code_batches"
    ADD CONSTRAINT "code_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."code_batches"
    ADD CONSTRAINT "code_batches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."code_inventory"
    ADD CONSTRAINT "code_inventory_assigned_to_user_fkey" FOREIGN KEY ("assigned_to_user") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."code_inventory"
    ADD CONSTRAINT "code_inventory_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."code_inventory"
    ADD CONSTRAINT "code_inventory_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_acknowledgments"
    ADD CONSTRAINT "compliance_acknowledgments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."compliance_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_acknowledgments"
    ADD CONSTRAINT "compliance_acknowledgments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_documents"
    ADD CONSTRAINT "compliance_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversion_events"
    ADD CONSTRAINT "conversion_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."coverage_documents"
    ADD CONSTRAINT "coverage_documents_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "public"."member_coverage"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_accounts"
    ADD CONSTRAINT "crm_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_accounts"
    ADD CONSTRAINT "crm_accounts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_accounts"
    ADD CONSTRAINT "crm_accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_accounts"
    ADD CONSTRAINT "crm_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_approval_actions"
    ADD CONSTRAINT "crm_approval_actions_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_approval_actions"
    ADD CONSTRAINT "crm_approval_actions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."crm_approval_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_approval_actions"
    ADD CONSTRAINT "crm_approval_actions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."crm_approval_steps"("id");



ALTER TABLE ONLY "public"."crm_approval_processes"
    ADD CONSTRAINT "crm_approval_processes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_approval_requests"
    ADD CONSTRAINT "crm_approval_requests_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."crm_approval_processes"("id");



ALTER TABLE ONLY "public"."crm_approval_requests"
    ADD CONSTRAINT "crm_approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_approval_steps"
    ADD CONSTRAINT "crm_approval_steps_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."crm_approval_processes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_campaign_members"
    ADD CONSTRAINT "crm_campaign_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_campaign_members"
    ADD CONSTRAINT "crm_campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."crm_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_campaign_members"
    ADD CONSTRAINT "crm_campaign_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_campaigns"
    ADD CONSTRAINT "crm_campaigns_parent_campaign_id_fkey" FOREIGN KEY ("parent_campaign_id") REFERENCES "public"."crm_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_case_comments"
    ADD CONSTRAINT "crm_case_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_case_comments"
    ADD CONSTRAINT "crm_case_comments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_cases"
    ADD CONSTRAINT "crm_cases_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_reports_to_fkey" FOREIGN KEY ("reports_to") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_dashboard_layouts"
    ADD CONSTRAINT "crm_dashboard_layouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_dashboard_notes"
    ADD CONSTRAINT "crm_dashboard_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deal_contacts"
    ADD CONSTRAINT "crm_deal_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deal_contacts"
    ADD CONSTRAINT "crm_deal_contacts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deal_products"
    ADD CONSTRAINT "crm_deal_products_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deal_products"
    ADD CONSTRAINT "crm_deal_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deal_stage_history"
    ADD CONSTRAINT "crm_deal_stage_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_deal_stage_history"
    ADD CONSTRAINT "crm_deal_stage_history_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deal_stage_history"
    ADD CONSTRAINT "crm_deal_stage_history_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "public"."crm_deal_stages"("id");



ALTER TABLE ONLY "public"."crm_deal_stage_history"
    ADD CONSTRAINT "crm_deal_stage_history_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "public"."crm_deal_stages"("id");



ALTER TABLE ONLY "public"."crm_deal_stages"
    ADD CONSTRAINT "crm_deal_stages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."crm_deal_stages"("id");



ALTER TABLE ONLY "public"."crm_default_layout_templates"
    ADD CONSTRAINT "crm_default_layout_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_email_attachments"
    ADD CONSTRAINT "crm_email_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_email_drafts"
    ADD CONSTRAINT "crm_email_drafts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_drafts"
    ADD CONSTRAINT "crm_email_drafts_signature_id_fkey" FOREIGN KEY ("signature_id") REFERENCES "public"."crm_email_signatures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_drafts"
    ADD CONSTRAINT "crm_email_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_email_log"
    ADD CONSTRAINT "crm_email_log_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_log"
    ADD CONSTRAINT "crm_email_log_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_log"
    ADD CONSTRAINT "crm_email_log_signature_id_fkey" FOREIGN KEY ("signature_id") REFERENCES "public"."crm_email_signatures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_log"
    ADD CONSTRAINT "crm_email_log_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."crm_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_log"
    ADD CONSTRAINT "crm_email_log_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."crm_email_threads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_sequence_enrollments"
    ADD CONSTRAINT "crm_email_sequence_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "public"."crm_email_sequences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_email_sequence_steps"
    ADD CONSTRAINT "crm_email_sequence_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "public"."crm_email_sequences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_email_sequence_steps"
    ADD CONSTRAINT "crm_email_sequence_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."crm_templates"("id");



ALTER TABLE ONLY "public"."crm_email_signatures"
    ADD CONSTRAINT "crm_email_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_email_threads"
    ADD CONSTRAINT "crm_email_threads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_email_tracking"
    ADD CONSTRAINT "crm_email_tracking_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "public"."crm_email_log"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_forecast_entries"
    ADD CONSTRAINT "crm_forecast_entries_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_forecast_entries"
    ADD CONSTRAINT "crm_forecast_entries_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "public"."crm_forecasts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_forecast_entries"
    ADD CONSTRAINT "crm_forecast_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_forecasts"
    ADD CONSTRAINT "crm_forecasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_forecasts"
    ADD CONSTRAINT "crm_forecasts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_invoice_line_items"
    ADD CONSTRAINT "crm_invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."crm_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_invoice_line_items"
    ADD CONSTRAINT "crm_invoice_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_invoice_payments"
    ADD CONSTRAINT "crm_invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."crm_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_invoice_payments"
    ADD CONSTRAINT "crm_invoice_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_invoices"
    ADD CONSTRAINT "crm_invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."crm_quotes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_lead_health_quotes"
    ADD CONSTRAINT "crm_lead_health_quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_lead_health_quotes"
    ADD CONSTRAINT "crm_lead_health_quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_lead_plan_interests"
    ADD CONSTRAINT "crm_lead_plan_interests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_lead_plan_interests"
    ADD CONSTRAINT "crm_lead_plan_interests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_lead_plan_interests"
    ADD CONSTRAINT "crm_lead_plan_interests_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_meeting_bookings"
    ADD CONSTRAINT "crm_meeting_bookings_calendar_event_id_fkey" FOREIGN KEY ("calendar_event_id") REFERENCES "public"."calendar_events"("id");



ALTER TABLE ONLY "public"."crm_meeting_bookings"
    ADD CONSTRAINT "crm_meeting_bookings_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."crm_meeting_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_meeting_schedules"
    ADD CONSTRAINT "crm_meeting_schedules_confirmation_template_id_fkey" FOREIGN KEY ("confirmation_template_id") REFERENCES "public"."crm_templates"("id");



ALTER TABLE ONLY "public"."crm_meeting_schedules"
    ADD CONSTRAINT "crm_meeting_schedules_reminder_template_id_fkey" FOREIGN KEY ("reminder_template_id") REFERENCES "public"."crm_templates"("id");



ALTER TABLE ONLY "public"."crm_pipeline_stages"
    ADD CONSTRAINT "crm_pipeline_stages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_price_book_items"
    ADD CONSTRAINT "crm_price_book_items_price_book_id_fkey" FOREIGN KEY ("price_book_id") REFERENCES "public"."crm_price_books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_price_book_items"
    ADD CONSTRAINT "crm_price_book_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_price_books"
    ADD CONSTRAINT "crm_price_books_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_price_books"
    ADD CONSTRAINT "crm_price_books_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_products"
    ADD CONSTRAINT "crm_products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_products"
    ADD CONSTRAINT "crm_products_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_purchase_order_line_items"
    ADD CONSTRAINT "crm_purchase_order_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_purchase_order_line_items"
    ADD CONSTRAINT "crm_purchase_order_line_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."crm_purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_purchase_orders"
    ADD CONSTRAINT "crm_purchase_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_purchase_orders"
    ADD CONSTRAINT "crm_purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_purchase_orders"
    ADD CONSTRAINT "crm_purchase_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_purchase_orders"
    ADD CONSTRAINT "crm_purchase_orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_purchase_orders"
    ADD CONSTRAINT "crm_purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."crm_vendors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."crm_quote_line_items"
    ADD CONSTRAINT "crm_quote_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_quote_line_items"
    ADD CONSTRAINT "crm_quote_line_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."crm_quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_quotes"
    ADD CONSTRAINT "crm_quotes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_sales_order_line_items"
    ADD CONSTRAINT "crm_sales_order_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_sales_order_line_items"
    ADD CONSTRAINT "crm_sales_order_line_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."crm_sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."crm_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_sales_orders"
    ADD CONSTRAINT "crm_sales_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."crm_quotes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_saved_views"
    ADD CONSTRAINT "crm_saved_views_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_saved_views"
    ADD CONSTRAINT "crm_saved_views_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_fields"
    ADD CONSTRAINT "crm_studio_fields_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_fields"
    ADD CONSTRAINT "crm_studio_fields_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."crm_studio_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_fields"
    ADD CONSTRAINT "crm_studio_fields_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_layouts"
    ADD CONSTRAINT "crm_studio_layouts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_layouts"
    ADD CONSTRAINT "crm_studio_layouts_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."crm_studio_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_layouts"
    ADD CONSTRAINT "crm_studio_layouts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_modules"
    ADD CONSTRAINT "crm_studio_modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_modules"
    ADD CONSTRAINT "crm_studio_modules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_validation_rules"
    ADD CONSTRAINT "crm_studio_validation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_validation_rules"
    ADD CONSTRAINT "crm_studio_validation_rules_error_field_id_fkey" FOREIGN KEY ("error_field_id") REFERENCES "public"."crm_studio_fields"("id");



ALTER TABLE ONLY "public"."crm_studio_validation_rules"
    ADD CONSTRAINT "crm_studio_validation_rules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."crm_studio_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_validation_rules"
    ADD CONSTRAINT "crm_studio_validation_rules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_views"
    ADD CONSTRAINT "crm_studio_views_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_views"
    ADD CONSTRAINT "crm_studio_views_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."crm_studio_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_views"
    ADD CONSTRAINT "crm_studio_views_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_studio_views"
    ADD CONSTRAINT "crm_studio_views_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_studio_views"
    ADD CONSTRAINT "crm_studio_views_sort_field_id_fkey" FOREIGN KEY ("sort_field_id") REFERENCES "public"."crm_studio_fields"("id");



ALTER TABLE ONLY "public"."crm_template_folders"
    ADD CONSTRAINT "crm_template_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."crm_template_folders"("id");



ALTER TABLE ONLY "public"."crm_templates"
    ADD CONSTRAINT "crm_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_templates"
    ADD CONSTRAINT "crm_templates_default_signature_id_fkey" FOREIGN KEY ("default_signature_id") REFERENCES "public"."crm_email_signatures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_templates"
    ADD CONSTRAINT "crm_templates_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."crm_template_folders"("id");



ALTER TABLE ONLY "public"."crm_templates"
    ADD CONSTRAINT "crm_templates_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."crm_templates"("id");



ALTER TABLE ONLY "public"."crm_user_goals"
    ADD CONSTRAINT "crm_user_goals_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_user_goals"
    ADD CONSTRAINT "crm_user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_vendors"
    ADD CONSTRAINT "crm_vendors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_vendors"
    ADD CONSTRAINT "crm_vendors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_vendors"
    ADD CONSTRAINT "crm_vendors_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_vendors"
    ADD CONSTRAINT "crm_vendors_primary_contact_id_fkey" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_web_form_submissions"
    ADD CONSTRAINT "crm_web_form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."crm_web_forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_web_forms"
    ADD CONSTRAINT "crm_web_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crm_web_forms"
    ADD CONSTRAINT "crm_web_forms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_website_quote_sync"
    ADD CONSTRAINT "crm_website_quote_sync_crm_lead_id_fkey" FOREIGN KEY ("crm_lead_id") REFERENCES "public"."zoho_lead_submissions"("id");



ALTER TABLE ONLY "public"."crm_website_quote_sync"
    ADD CONSTRAINT "crm_website_quote_sync_crm_quote_id_fkey" FOREIGN KEY ("crm_quote_id") REFERENCES "public"."crm_lead_health_quotes"("id");



ALTER TABLE ONLY "public"."crm_website_quote_sync"
    ADD CONSTRAINT "crm_website_quote_sync_website_submission_id_fkey" FOREIGN KEY ("website_submission_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_push_subscriptions"
    ADD CONSTRAINT "device_push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_log"
    ADD CONSTRAINT "document_access_log_accessed_by_fkey" FOREIGN KEY ("accessed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_access_log"
    ADD CONSTRAINT "document_access_log_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."member_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_schedules"
    ADD CONSTRAINT "email_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."email_schedules"
    ADD CONSTRAINT "email_schedules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_schedules"
    ADD CONSTRAINT "email_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."crm_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_tracking"
    ADD CONSTRAINT "email_tracking_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "public"."crm_email_log"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."esignature_documents"
    ADD CONSTRAINT "esignature_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."esignature_documents"
    ADD CONSTRAINT "esignature_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."esignature_documents"
    ADD CONSTRAINT "esignature_documents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."esignature_providers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."esignature_providers"
    ADD CONSTRAINT "esignature_providers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."esignature_providers"
    ADD CONSTRAINT "esignature_providers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."external_lms_lessons"
    ADD CONSTRAINT "external_lms_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."external_lms_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_email_attachments"
    ADD CONSTRAINT "fk_email_attachments_draft" FOREIGN KEY ("draft_id") REFERENCES "public"."crm_email_drafts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_email_attachments"
    ADD CONSTRAINT "fk_email_attachments_email" FOREIGN KEY ("email_id") REFERENCES "public"."crm_email_log"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."geo_state_settings"
    ADD CONSTRAINT "geo_state_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."integration_health"
    ADD CONSTRAINT "integration_health_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."tracking_platforms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction_logs"
    ADD CONSTRAINT "interaction_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."interaction_logs"
    ADD CONSTRAINT "interaction_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_notifications"
    ADD CONSTRAINT "lead_notifications_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."lead_notifications"
    ADD CONSTRAINT "lead_notifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_notifications"
    ADD CONSTRAINT "lead_notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_routing_logs"
    ADD CONSTRAINT "lead_routing_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_submissions"
    ADD CONSTRAINT "lead_submissions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_advisor_id_fkey" FOREIGN KEY ("assigned_advisor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_accounts"
    ADD CONSTRAINT "mail_accounts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_accounts"
    ADD CONSTRAINT "mail_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_audit_log"
    ADD CONSTRAINT "mail_audit_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mail_domains"
    ADD CONSTRAINT "mail_domains_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mail_domains"
    ADD CONSTRAINT "mail_domains_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_folders"
    ADD CONSTRAINT "mail_folders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_folders"
    ADD CONSTRAINT "mail_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."mail_folders"("id");



ALTER TABLE ONLY "public"."mail_message_attachments"
    ADD CONSTRAINT "mail_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."mail_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_messages"
    ADD CONSTRAINT "mail_messages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_messages"
    ADD CONSTRAINT "mail_messages_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."mail_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mail_rules"
    ADD CONSTRAINT "mail_rules_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_sender_identities"
    ADD CONSTRAINT "mail_sender_identities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mail_sender_identities"
    ADD CONSTRAINT "mail_sender_identities_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."mail_domains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_sender_identities"
    ADD CONSTRAINT "mail_sender_identities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_shared_access"
    ADD CONSTRAINT "mail_shared_access_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_shared_access"
    ADD CONSTRAINT "mail_shared_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mail_shared_access"
    ADD CONSTRAINT "mail_shared_access_grantee_user_id_fkey" FOREIGN KEY ("grantee_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mail_sync_jobs"
    ADD CONSTRAINT "mail_sync_jobs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maternity_coverage_stages"
    ADD CONSTRAINT "maternity_coverage_stages_maternity_coverage_id_fkey" FOREIGN KEY ("maternity_coverage_id") REFERENCES "public"."maternity_coverage"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_invitations"
    ADD CONSTRAINT "meeting_invitations_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_invitations"
    ADD CONSTRAINT "meeting_invitations_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."advisor_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_invitations"
    ADD CONSTRAINT "meeting_invitations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_templates"
    ADD CONSTRAINT "meeting_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."member_dependents"
    ADD CONSTRAINT "member_dependents_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_documents"
    ADD CONSTRAINT "member_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."member_profiles"
    ADD CONSTRAINT "member_profiles_assigned_advisor_id_fkey" FOREIGN KEY ("assigned_advisor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."member_profiles"
    ADD CONSTRAINT "member_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."navigation_analytics"
    ADD CONSTRAINT "navigation_analytics_navigation_item_id_fkey" FOREIGN KEY ("navigation_item_id") REFERENCES "public"."navigation_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."navigation_analytics"
    ADD CONSTRAINT "navigation_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."navigation_items"
    ADD CONSTRAINT "navigation_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newsletter_campaigns"
    ADD CONSTRAINT "newsletter_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."newsletter_queue"
    ADD CONSTRAINT "newsletter_queue_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newsletter_queue"
    ADD CONSTRAINT "newsletter_queue_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_notifications"
    ADD CONSTRAINT "note_notifications_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_notifications"
    ADD CONSTRAINT "note_notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_shares"
    ADD CONSTRAINT "note_shares_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_shares"
    ADD CONSTRAINT "note_shares_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_shares"
    ADD CONSTRAINT "note_shares_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."lead_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."onboarding_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_steps"
    ADD CONSTRAINT "onboarding_steps_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_processors"
    ADD CONSTRAINT "payment_processors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payment_processors"
    ADD CONSTRAINT "payment_processors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_category_features"
    ADD CONSTRAINT "plan_category_features_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."healthcare_plan_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_category_profiles"
    ADD CONSTRAINT "plan_category_profiles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."healthcare_plan_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_features"
    ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_pricing"
    ADD CONSTRAINT "plan_pricing_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_sharing_details"
    ADD CONSTRAINT "plan_sharing_details_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id");



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "priority_items_lane_id_fkey" FOREIGN KEY ("lane_id") REFERENCES "public"."priority_lanes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "priority_items_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."zoho_lead_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "priority_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."priority_items"
    ADD CONSTRAINT "priority_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."priority_lanes"
    ADD CONSTRAINT "priority_lanes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."priority_lanes"
    ADD CONSTRAINT "priority_lanes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_locations"
    ADD CONSTRAINT "provider_locations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quick_actions"
    ADD CONSTRAINT "quick_actions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_exports"
    ADD CONSTRAINT "report_exports_exported_by_fkey" FOREIGN KEY ("exported_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."report_exports"
    ADD CONSTRAINT "report_exports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_exports"
    ADD CONSTRAINT "report_exports_saved_report_id_fkey" FOREIGN KEY ("saved_report_id") REFERENCES "public"."saved_reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_reports"
    ADD CONSTRAINT "saved_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."saved_reports"
    ADD CONSTRAINT "saved_reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_lane_assignment_fkey" FOREIGN KEY ("lane_assignment") REFERENCES "public"."priority_lanes"("id");



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_alert_log"
    ADD CONSTRAINT "security_alert_log_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "public"."security_alert_webhooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_alert_webhooks"
    ADD CONSTRAINT "security_alert_webhooks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."seo_google_credentials"
    ADD CONSTRAINT "seo_google_credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sequences"
    ADD CONSTRAINT "sequences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sequences"
    ADD CONSTRAINT "sequences_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sms_accounts"
    ADD CONSTRAINT "sms_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sms_accounts"
    ADD CONSTRAINT "sms_accounts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sms_log"
    ADD CONSTRAINT "sms_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sms_log"
    ADD CONSTRAINT "sms_log_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sms_log"
    ADD CONSTRAINT "sms_log_sms_account_id_fkey" FOREIGN KEY ("sms_account_id") REFERENCES "public"."sms_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sms_log"
    ADD CONSTRAINT "sms_log_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."crm_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sop_categories"
    ADD CONSTRAINT "sop_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."sop_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sop_documents"
    ADD CONSTRAINT "sop_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sop_documents"
    ADD CONSTRAINT "sop_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_firing_rules"
    ADD CONSTRAINT "tag_firing_rules_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tracking_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracking_snippets"
    ADD CONSTRAINT "tracking_snippets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tracking_snippets"
    ADD CONSTRAINT "tracking_snippets_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."tracking_platforms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracking_tags"
    ADD CONSTRAINT "tracking_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tracking_tags"
    ADD CONSTRAINT "tracking_tags_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "public"."tracking_snippets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_modules"
    ADD CONSTRAINT "training_modules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_progress"
    ADD CONSTRAINT "training_progress_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_progress"
    ADD CONSTRAINT "training_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."training_modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_progress"
    ADD CONSTRAINT "training_progress_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_navigation_preferences"
    ADD CONSTRAINT "user_navigation_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utm_campaigns"
    ADD CONSTRAINT "utm_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."visit_summaries"
    ADD CONSTRAINT "visit_summaries_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id");



ALTER TABLE ONLY "public"."zoho_lead_submissions"
    ADD CONSTRAINT "zoho_lead_submissions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."zoho_lead_submissions"
    ADD CONSTRAINT "zoho_lead_submissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoho_lead_submissions"
    ADD CONSTRAINT "zoho_lead_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Admin can delete events" ON "public"."events" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin can insert events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin can manage SEO metadata" ON "public"."seo_metadata" TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can manage UTM campaigns" ON "public"."utm_campaigns" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage analytics experiments" ON "public"."analytics_experiments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage content analytics" ON "public"."content_analytics" TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can manage conversion events" ON "public"."conversion_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage marketing campaigns" ON "public"."marketing_campaigns" TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can manage site analytics" ON "public"."site_analytics" TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can manage site settings" ON "public"."site_settings" TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can manage tag firing rules" ON "public"."tag_firing_rules" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage tracking platforms" ON "public"."tracking_platforms" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage tracking snippets" ON "public"."tracking_snippets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage tracking tags" ON "public"."tracking_tags" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can update events" ON "public"."events" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin can view SEO metadata" ON "public"."seo_metadata" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can view all site settings" ON "public"."site_settings" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can view content analytics" ON "public"."content_analytics" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can view integration health" ON "public"."integration_health" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin can view marketing campaigns" ON "public"."marketing_campaigns" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can view site analytics" ON "public"."site_analytics" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admin can view tracking event log" ON "public"."tracking_event_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can delete categories" ON "public"."blog_categories" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can delete cognito_forms" ON "public"."cognito_forms" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can delete handbooks" ON "public"."handbooks" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can delete lanes" ON "public"."priority_lanes" FOR DELETE TO "authenticated" USING ("public"."user_is_org_owner_or_admin"("org_id"));



CREATE POLICY "Admins can delete lead activities" ON "public"."lead_activities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can delete lead tasks" ON "public"."lead_tasks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can delete plan features" ON "public"."plan_features" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can delete plan pricing" ON "public"."plan_pricing" FOR DELETE TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can delete plan sharing details" ON "public"."plan_sharing_details" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can delete plans" ON "public"."plans" FOR DELETE TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can delete resource_library" ON "public"."resource_library" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can delete topics" ON "public"."resource_topics" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert categories" ON "public"."blog_categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert cognito_forms" ON "public"."cognito_forms" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert generation logs" ON "public"."blog_generation_logs" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert handbooks" ON "public"."handbooks" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert lead_scoring_config" ON "public"."lead_scoring_config" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert plan pricing" ON "public"."plan_pricing" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can insert plans" ON "public"."plans" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can insert resource_library" ON "public"."resource_library" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert site analytics" ON "public"."site_analytics" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can insert topics" ON "public"."resource_topics" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage FAQ items" ON "public"."faq_items" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage SEO metadata" ON "public"."seo_metadata" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage SOPs" ON "public"."sop_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage advisor profiles" ON "public"."advisor_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all dependents" ON "public"."member_dependents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage all invitations" ON "public"."meeting_invitations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage all member profiles" ON "public"."member_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage all subscriptions" ON "public"."newsletter_subscribers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage attendance" ON "public"."advisor_meeting_attendees" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage bulletin emails" ON "public"."bulletin_email_notifications" TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can manage bulletin notifications" ON "public"."bulletin_email_notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage bulletin recipients" ON "public"."bulletin_email_recipients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage campaigns" ON "public"."marketing_campaigns" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage campaigns" ON "public"."newsletter_campaigns" TO "authenticated" USING ("public"."current_user_has_advisor_or_admin_access"());



CREATE POLICY "Admins can manage certifications" ON "public"."certifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage content analytics" ON "public"."content_analytics" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage courses" ON "public"."wordpress_courses" TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage daily_analytics_summary" ON "public"."daily_analytics_summary" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage email templates" ON "public"."email_templates" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage enrollment links" ON "public"."advisor_enrollment_links" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can manage geo state settings" ON "public"."geo_state_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage lead notifications" ON "public"."lead_notifications" TO "authenticated" USING ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Admins can manage maternity coverage" ON "public"."maternity_coverage" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage maternity stages" ON "public"."maternity_coverage_stages" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage meetings" ON "public"."advisor_meetings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage newsletter queue" ON "public"."newsletter_queue" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage onboarding steps" ON "public"."onboarding_steps" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage page_performance" ON "public"."page_performance" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage pipeline stages" ON "public"."crm_pipeline_stages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage portal settings" ON "public"."advisor_portal_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can manage prompts" ON "public"."gemini_prompts" TO "authenticated" USING ("public"."current_user_has_super_admin_access"());



CREATE POLICY "Admins can manage reminders" ON "public"."advisor_meeting_reminders" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage scoring rules" ON "public"."scoring_rules" TO "authenticated" USING ("public"."user_is_org_owner_or_admin"("org_id")) WITH CHECK ("public"."user_is_org_owner_or_admin"("org_id"));



CREATE POLICY "Admins can manage seo_backlinks" ON "public"."seo_backlinks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage seo_daily_summary" ON "public"."seo_daily_summary" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage seo_google_credentials" ON "public"."seo_google_credentials" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage seo_keyword_rankings" ON "public"."seo_keyword_rankings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage seo_keywords" ON "public"."seo_keywords" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage seo_pages" ON "public"."seo_pages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage seo_sync_logs" ON "public"."seo_sync_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"])))))));



CREATE POLICY "Admins can manage site settings" ON "public"."site_settings" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can manage subscribers" ON "public"."newsletter_subscribers" TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can manage templates" ON "public"."email_templates" TO "authenticated" USING ("public"."current_user_has_super_admin_access"());



CREATE POLICY "Admins can manage templates" ON "public"."meeting_templates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage ticket_categories" ON "public"."ticket_categories" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage traffic_sources" ON "public"."traffic_sources" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can manage training modules" ON "public"."training_modules" TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can manage videos" ON "public"."advisor_videos" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'staff'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"])))))));



CREATE POLICY "Admins can modify outlook config" ON "public"."outlook_config" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can read all member profiles" ON "public"."member_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can read all onboarding responses" ON "public"."onboarding_responses" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can read all roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ("public"."current_user_is_admin"());



CREATE POLICY "Admins can read conversion events" ON "public"."conversion_events" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update categories" ON "public"."blog_categories" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update cognito_forms" ON "public"."cognito_forms" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update conversations" ON "public"."chat_conversations" FOR SELECT USING (("id" IN ( SELECT "chat_members"."conversation_id"
   FROM "public"."chat_members"
  WHERE (("chat_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("chat_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Admins can update enrollments" ON "public"."enrollments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can update handbooks" ON "public"."handbooks" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update lead activities" ON "public"."lead_activities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can update lead submissions" ON "public"."zoho_lead_submissions" FOR UPDATE TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"())) WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can update lead tasks" ON "public"."lead_tasks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can update lead_scoring_config" ON "public"."lead_scoring_config" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update memberships" ON "public"."org_memberships" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "public"."get_user_org_ids"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_org_ids")));



CREATE POLICY "Admins can update plan features" ON "public"."plan_features" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can update plan pricing" ON "public"."plan_pricing" FOR UPDATE TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"())) WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can update plan sharing details" ON "public"."plan_sharing_details" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can update plans" ON "public"."plans" FOR UPDATE TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"())) WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can update resource_library" ON "public"."resource_library" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update site analytics" ON "public"."site_analytics" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can update topics" ON "public"."resource_topics" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view SEO metadata" ON "public"."seo_metadata" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view all advisor profiles" ON "public"."advisor_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all analytics" ON "public"."navigation_analytics" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all content" ON "public"."advisor_content" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view all enrollments" ON "public"."enrollments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can view all lead activities" ON "public"."lead_activities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can view all lead notifications" ON "public"."lead_notifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text", 'advisor'::"text"]))))));



CREATE POLICY "Admins can view all lead submissions" ON "public"."zoho_lead_submissions" FOR SELECT TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can view all lead tasks" ON "public"."lead_tasks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can view all onboarding progress" ON "public"."onboarding_progress" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all org signatures" ON "public"."crm_email_signatures" FOR SELECT TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can view all routing logs" ON "public"."lead_routing_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can view all settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"])))))));



CREATE POLICY "Admins can view all subscriptions" ON "public"."newsletter_subscribers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can view all training progress" ON "public"."training_progress" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view analytics_events" ON "public"."analytics_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can view analytics_sessions" ON "public"."analytics_sessions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can view audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can view bulletin emails" ON "public"."bulletin_email_notifications" FOR SELECT TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can view campaigns" ON "public"."marketing_campaigns" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view content analytics" ON "public"."content_analytics" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view daily_analytics_summary" ON "public"."daily_analytics_summary" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can view email templates" ON "public"."email_templates" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view email tracking" ON "public"."crm_email_tracking" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'agent'::"text"]))))));



CREATE POLICY "Admins can view generation logs" ON "public"."blog_generation_logs" FOR SELECT TO "authenticated" USING ("public"."current_user_has_advisor_or_admin_access"());



CREATE POLICY "Admins can view lead notifications" ON "public"."lead_notifications" FOR SELECT TO "authenticated" USING ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Admins can view outlook config" ON "public"."outlook_config" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'cto'::"text", 'ceo'::"text"]))))));



CREATE POLICY "Admins can view page views" ON "public"."page_views" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can view page_performance" ON "public"."page_performance" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can view queue" ON "public"."newsletter_queue" FOR SELECT TO "authenticated" USING ("public"."current_user_has_advisor_or_admin_access"());



CREATE POLICY "Admins can view site analytics" ON "public"."site_analytics" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view site settings" ON "public"."site_settings" FOR SELECT TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Admins can view subscribers" ON "public"."newsletter_subscribers" FOR SELECT TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Admins can view traffic_sources" ON "public"."traffic_sources" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admins can view webhook logs" ON "public"."webhook_delivery_logs" FOR SELECT TO "authenticated" USING ("public"."current_user_has_advisor_or_admin_access"());



CREATE POLICY "Advisor CMS delete" ON "public"."advisor_announcements" FOR DELETE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS delete" ON "public"."advisor_categories" FOR DELETE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS delete" ON "public"."advisor_dashboard_widgets" FOR DELETE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS delete" ON "public"."advisor_learning_paths" FOR DELETE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS delete" ON "public"."advisor_nav_menu" FOR DELETE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS delete" ON "public"."advisor_quick_links" FOR DELETE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS read" ON "public"."advisor_announcements" FOR SELECT USING (true);



CREATE POLICY "Advisor CMS read" ON "public"."advisor_categories" FOR SELECT USING (true);



CREATE POLICY "Advisor CMS read" ON "public"."advisor_dashboard_widgets" FOR SELECT USING (true);



CREATE POLICY "Advisor CMS read" ON "public"."advisor_learning_paths" FOR SELECT USING (true);



CREATE POLICY "Advisor CMS read" ON "public"."advisor_nav_menu" FOR SELECT USING (true);



CREATE POLICY "Advisor CMS read" ON "public"."advisor_quick_links" FOR SELECT USING (true);



CREATE POLICY "Advisor CMS update" ON "public"."advisor_announcements" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"()) WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS update" ON "public"."advisor_categories" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"()) WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS update" ON "public"."advisor_dashboard_widgets" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"()) WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS update" ON "public"."advisor_learning_paths" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"()) WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS update" ON "public"."advisor_nav_menu" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"()) WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS update" ON "public"."advisor_quick_links" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_advisor_command_access"()) WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS write" ON "public"."advisor_announcements" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS write" ON "public"."advisor_categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS write" ON "public"."advisor_dashboard_widgets" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS write" ON "public"."advisor_learning_paths" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS write" ON "public"."advisor_nav_menu" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisor CMS write" ON "public"."advisor_quick_links" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_advisor_command_access"());



CREATE POLICY "Advisors and admins can view categories" ON "public"."advisor_content_categories" FOR SELECT TO "authenticated" USING ("public"."current_user_has_advisor_or_admin_access"());



CREATE POLICY "Advisors and admins can view enrollments" ON "public"."advisor_lms_enrollments" FOR SELECT USING ((("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))) OR "public"."current_user_has_admin_access"()));



CREATE POLICY "Advisors can delete own enrollments" ON "public"."advisor_lms_enrollments" FOR DELETE USING (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can manage own enrollments" ON "public"."advisor_lms_enrollments" FOR INSERT WITH CHECK (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can manage own external progress" ON "public"."advisor_external_training_progress" FOR SELECT USING (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can manage own lesson completions" ON "public"."advisor_lesson_completions" FOR SELECT USING (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can manage their own bookmarks" ON "public"."advisor_content_bookmarks" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Advisors can read published content" ON "public"."advisor_content" FOR SELECT TO "authenticated" USING (("is_published" = true));



CREATE POLICY "Advisors can update own attendance" ON "public"."advisor_meeting_attendees" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Advisors can update own enrollments" ON "public"."advisor_lms_enrollments" FOR UPDATE USING (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can update own onboarding progress" ON "public"."onboarding_progress" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Advisors can update own profile" ON "public"."advisor_profiles" FOR SELECT TO "authenticated" USING ((( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid") = "id"));



CREATE POLICY "Advisors can update own training progress" ON "public"."training_progress" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Advisors can update their own invitation response" ON "public"."meeting_invitations" FOR SELECT TO "authenticated" USING (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can view attendance" ON "public"."advisor_meeting_attendees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Advisors can view meetings" ON "public"."advisor_meetings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Advisors can view own certifications" ON "public"."certifications" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Advisors can view own onboarding progress" ON "public"."onboarding_progress" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Advisors can view own profile" ON "public"."advisor_profiles" FOR SELECT TO "authenticated" USING ((( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid") = "id"));



CREATE POLICY "Advisors can view own training progress" ON "public"."training_progress" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Advisors can view published content" ON "public"."advisor_content" FOR SELECT TO "authenticated" USING ((("is_published" = true) AND "public"."current_user_has_advisor_or_admin_access"()));



CREATE POLICY "Advisors can view their own bookmarks" ON "public"."advisor_content_bookmarks" FOR SELECT TO "authenticated" USING ((("advisor_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."current_user_has_admin_access"()));



CREATE POLICY "Advisors can view their own invitations" ON "public"."meeting_invitations" FOR SELECT TO "authenticated" USING (("advisor_id" IN ( SELECT "advisor_profiles"."id"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Advisors can view their own views" ON "public"."advisor_content_views" FOR SELECT TO "authenticated" USING ((("advisor_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."current_user_has_admin_access"()));



CREATE POLICY "Allow anonymous update on rate_calculator_views" ON "public"."rate_calculator_views" FOR SELECT TO "anon" USING ((( SELECT "auth"."role"() AS "role") = 'anon'::"text"));



CREATE POLICY "Allow authenticated delete calendar_events" ON "public"."calendar_events" FOR SELECT TO "authenticated" USING ((("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Allow authenticated read ai_automation_rules" ON "public"."ai_automation_rules" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read ai_lead_insights" ON "public"."ai_lead_insights" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read all cognito_forms" ON "public"."cognito_forms" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read all handbooks" ON "public"."handbooks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read automation_execution_log" ON "public"."automation_execution_log" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read calendar_events" ON "public"."calendar_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read crm_templates" ON "public"."crm_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read lead_scoring_config" ON "public"."lead_scoring_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public read active cognito_forms" ON "public"."cognito_forms" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read active handbooks" ON "public"."handbooks" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow service role full access ai_automation_rules" ON "public"."ai_automation_rules" TO "service_role" USING (true);



CREATE POLICY "Allow service role full access ai_lead_insights" ON "public"."ai_lead_insights" TO "service_role" USING (true);



CREATE POLICY "Allow service role full access automation_execution_log" ON "public"."automation_execution_log" TO "service_role" USING (true);



CREATE POLICY "Allow service role full access lead_scoring_config" ON "public"."lead_scoring_config" TO "service_role" USING (true);



CREATE POLICY "Allow service role full access notification_log" ON "public"."notification_log" TO "service_role" USING (true);



CREATE POLICY "Allow service role to insert advisors" ON "public"."advisors" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Anon can insert analytics_sessions" ON "public"."analytics_sessions" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon can insert page_views" ON "public"."page_views" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon can insert zoho_salesiq_errors" ON "public"."zoho_salesiq_errors" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon can read advisor_profiles" ON "public"."advisor_profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read ai_lead_insights" ON "public"."ai_lead_insights" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read analytics_sessions" ON "public"."analytics_sessions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read lead_routing_logs" ON "public"."lead_routing_logs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read lead_submissions" ON "public"."lead_submissions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read navigation_analytics" ON "public"."navigation_analytics" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read newsletter_subscribers" ON "public"."newsletter_subscribers" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read onboarding_responses" ON "public"."onboarding_responses" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read page_views" ON "public"."page_views" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read plan_selections" ON "public"."plan_selections" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can update own analytics_sessions" ON "public"."analytics_sessions" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anon can update page_views" ON "public"."page_views" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anon can view non-sensitive settings" ON "public"."system_settings" FOR SELECT TO "anon" USING (("is_sensitive" = false));



CREATE POLICY "Anyone can read active providers" ON "public"."providers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read categories" ON "public"."advisor_content_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read provider locations" ON "public"."provider_locations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read providers" ON "public"."providers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view active FAQ items" ON "public"."faq_items" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active templates" ON "public"."meeting_templates" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Anyone can view categories" ON "public"."blog_categories" FOR SELECT USING (true);



CREATE POLICY "Authenticated can insert analytics_sessions" ON "public"."analytics_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated can insert page_views" ON "public"."page_views" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated can insert zoho_salesiq_errors" ON "public"."zoho_salesiq_errors" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated can update own analytics_sessions" ON "public"."analytics_sessions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated can update page_views" ON "public"."page_views" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated can view non-sensitive settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (("is_sensitive" = false));



CREATE POLICY "Authenticated users can read enrollment links" ON "public"."advisor_enrollment_links" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read portal settings" ON "public"."advisor_portal_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read ticket_categories" ON "public"."ticket_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read videos" ON "public"."advisor_videos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view active SOPs" ON "public"."sop_documents" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Authenticated users can view active onboarding steps" ON "public"."onboarding_steps" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Authenticated users can view all enrollment intent" ON "public"."enrollment_intent" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all events" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all leads" ON "public"."lead_submissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all plan features" ON "public"."plan_features" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all plan pricing" ON "public"."plan_pricing" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all plan selections" ON "public"."plan_selections" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all plans" ON "public"."plans" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all rate calculator views" ON "public"."rate_calculator_views" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all sharing details" ON "public"."plan_sharing_details" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view email logs" ON "public"."crm_email_log" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authors and admins can soft-delete messages" ON "public"."chat_messages" FOR SELECT USING ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("conversation_id" IN ( SELECT "chat_members"."conversation_id"
   FROM "public"."chat_members"
  WHERE (("chat_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("chat_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "Conversation admins can remove members" ON "public"."chat_members" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("conversation_id" IN ( SELECT "cm"."conversation_id"
   FROM "public"."chat_members" "cm"
  WHERE (("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("cm"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "Extended admin can delete ai_automation_rules" ON "public"."ai_automation_rules" FOR DELETE TO "authenticated" USING ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Extended admin can insert ai_automation_rules" ON "public"."ai_automation_rules" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Extended admin can insert crm_templates" ON "public"."crm_templates" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Extended admin can update ai_automation_rules" ON "public"."ai_automation_rules" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_extended_admin_access"()) WITH CHECK ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Extended admin can update crm_templates" ON "public"."crm_templates" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_extended_admin_access"()) WITH CHECK ("public"."current_user_has_extended_admin_access"());



CREATE POLICY "Managers can create lanes" ON "public"."priority_lanes" FOR INSERT TO "authenticated" WITH CHECK ("public"."user_is_org_manager_or_above"("org_id"));



CREATE POLICY "Managers can update lanes" ON "public"."priority_lanes" FOR UPDATE TO "authenticated" USING ("public"."user_is_org_manager_or_above"("org_id")) WITH CHECK ("public"."user_is_org_manager_or_above"("org_id"));



CREATE POLICY "Members can manage own dependents" ON "public"."member_dependents" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own documents" ON "public"."member_documents" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own health history" ON "public"."health_history" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own immunizations" ON "public"."immunizations" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own lab results" ON "public"."lab_results" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own payment methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own prescriptions" ON "public"."prescriptions" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own support tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can manage own visit summaries" ON "public"."visit_summaries" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can read own claims" ON "public"."claims" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can read own notifications" ON "public"."member_notifications" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can read own profile" ON "public"."member_profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Members can read own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can update own notifications" ON "public"."member_notifications" FOR SELECT TO "authenticated" USING (("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Members can update own profile" ON "public"."member_profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Members can view conversation members" ON "public"."chat_members" FOR SELECT USING (("conversation_id" IN ( SELECT "cm"."conversation_id"
   FROM "public"."chat_members" "cm"
  WHERE ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Members can view messages" ON "public"."chat_messages" FOR SELECT USING (("conversation_id" IN ( SELECT "chat_members"."conversation_id"
   FROM "public"."chat_members"
  WHERE ("chat_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Members can view their conversations" ON "public"."chat_conversations" FOR SELECT USING (("id" IN ( SELECT "chat_members"."conversation_id"
   FROM "public"."chat_members"
  WHERE ("chat_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Only admins can delete content" ON "public"."advisor_content" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "Only admins can delete navigation items" ON "public"."navigation_items" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can insert content" ON "public"."advisor_content" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Only admins can manage categories" ON "public"."advisor_content_categories" TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Only admins can update content" ON "public"."advisor_content" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "Only admins can update navigation items" ON "public"."navigation_items" FOR SELECT TO "authenticated" USING (((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only owners can delete organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "organizations"."id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text") AND ("org_memberships"."role" = 'owner'::"text")))));



CREATE POLICY "Owners and admins can update invites" ON "public"."org_invites" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "org_invites"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text") AND ("org_memberships"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Owners and admins can update organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "organizations"."id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text") AND ("org_memberships"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Public can view active categories, admins can manage" ON "public"."healthcare_plan_categories" FOR SELECT USING ((("is_active" = true) OR ((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Public can view active conversion events" ON "public"."conversion_events" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Public can view active plans, admins can view all" ON "public"."plans" FOR SELECT USING ((("is_active" = true) OR "public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Public can view active prompts" ON "public"."gemini_prompts" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Public can view active templates" ON "public"."email_templates" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Public can view all topics" ON "public"."resource_topics" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view category features" ON "public"."plan_category_features" FOR SELECT USING (true);



CREATE POLICY "Public can view category profiles" ON "public"."plan_category_profiles" FOR SELECT USING (true);



CREATE POLICY "Public can view enabled tracking snippets" ON "public"."tracking_snippets" FOR SELECT TO "anon" USING ((("is_enabled" = true) AND ("is_test_mode" = false)));



CREATE POLICY "Public can view features of active plans" ON "public"."plan_features" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."plans"
  WHERE (("plans"."id" = "plan_features"."plan_id") AND ("plans"."is_active" = true)))) OR ((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Public can view geo state settings" ON "public"."geo_state_settings" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view items based on auth requirement" ON "public"."navigation_items" FOR SELECT USING ((("requires_auth" = false) OR (( SELECT ( SELECT "auth"."role"() AS "role") AS "role") = 'authenticated'::"text")));



CREATE POLICY "Public can view maternity coverage" ON "public"."maternity_coverage" FOR SELECT USING (true);



CREATE POLICY "Public can view maternity stages" ON "public"."maternity_coverage_stages" FOR SELECT USING (true);



CREATE POLICY "Public can view pricing of active plans" ON "public"."plan_pricing" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."plans"
  WHERE (("plans"."id" = "plan_pricing"."plan_id") AND ("plans"."is_active" = true)))) OR "public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "Public can view public site settings" ON "public"."site_settings" FOR SELECT TO "anon" USING (("is_public" = true));



CREATE POLICY "Public can view published courses" ON "public"."wordpress_courses" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) AND ("status" = 'publish'::"text")));



CREATE POLICY "Public can view published events" ON "public"."events" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view sharing details of active plans" ON "public"."plan_sharing_details" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."plans"
  WHERE (("plans"."id" = "plan_sharing_details"."plan_id") AND ("plans"."is_active" = true)))) OR ((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Read default layout templates" ON "public"."crm_default_layout_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Service can insert notification events" ON "public"."notification_events" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service can insert tracking events" ON "public"."tracking_event_log" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service can insert webhook logs" ON "public"."webhook_delivery_logs" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service inserts commands" ON "public"."advisor_terminal_commands" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service manages sessions" ON "public"."advisor_terminal_sessions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can access webhooks" ON "public"."security_alert_webhooks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage alert logs" ON "public"."security_alert_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to calendar_integrations" ON "public"."crm_calendar_integrations" TO "service_role" USING (true);



CREATE POLICY "Service role full access to email_sequences" ON "public"."crm_email_sequences" TO "service_role" USING (true);



CREATE POLICY "Service role full access to meeting_bookings" ON "public"."crm_meeting_bookings" TO "service_role" USING (true);



CREATE POLICY "Service role full access to meeting_schedules" ON "public"."crm_meeting_schedules" TO "service_role" USING (true);



CREATE POLICY "Service role full access to sequence_enrollments" ON "public"."crm_email_sequence_enrollments" TO "service_role" USING (true);



CREATE POLICY "Service role full access to sequence_steps" ON "public"."crm_email_sequence_steps" TO "service_role" USING (true);



CREATE POLICY "Service role full access to template_folders" ON "public"."crm_template_folders" TO "service_role" USING (true);



CREATE POLICY "Staff can manage all claims" ON "public"."claims" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Staff can manage all support tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Staff can manage all transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Staff can read all documents" ON "public"."member_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Staff can update assigned leads" ON "public"."lead_submissions" FOR SELECT TO "authenticated" USING (("assigned_to" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Staff can update lead notifications" ON "public"."lead_notifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text", 'advisor'::"text"]))))));



CREATE POLICY "Staff can view seo_backlinks" ON "public"."seo_backlinks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Staff can view seo_daily_summary" ON "public"."seo_daily_summary" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Staff can view seo_keyword_rankings" ON "public"."seo_keyword_rankings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Staff can view seo_keywords" ON "public"."seo_keywords" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Staff can view seo_pages" ON "public"."seo_pages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Super admins can delete roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ("public"."current_user_is_super_admin"());



CREATE POLICY "Super admins can insert audit logs" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Super admins can insert roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_is_super_admin"());



CREATE POLICY "Super admins can manage webhooks" ON "public"."security_alert_webhooks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Super admins can update roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."current_user_is_super_admin"());



CREATE POLICY "Super admins can view alert logs" ON "public"."security_alert_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "System can manage achievements" ON "public"."user_achievements" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "System can update integration health" ON "public"."integration_health" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Users and admins can read profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR ((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users and admins can update profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR ((( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can access email_tracking for their emails" ON "public"."email_tracking" FOR SELECT USING (("email_log_id" IN ( SELECT "crm_email_log"."id"
   FROM "public"."crm_email_log"
  WHERE ("crm_email_log"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can access promo_code_usage" ON "public"."promo_code_usage" FOR SELECT USING (("promo_code_id" IN ( SELECT "promo_codes"."id"
   FROM "public"."promo_codes"
  WHERE ("promo_codes"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can access their org admin_resources" ON "public"."admin_resources" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org code_batches" ON "public"."code_batches" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org code_inventory" ON "public"."code_inventory" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org email_schedules" ON "public"."email_schedules" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org esignature_documents" ON "public"."esignature_documents" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org esignature_providers" ON "public"."esignature_providers" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org interaction_logs" ON "public"."interaction_logs" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org payment_processors" ON "public"."payment_processors" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org promo_codes" ON "public"."promo_codes" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org report_exports" ON "public"."report_exports" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org saved_reports" ON "public"."saved_reports" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org sms_accounts" ON "public"."sms_accounts" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org sms_log" ON "public"."sms_log" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can access their org user_presence" ON "public"."user_presence" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can create priority items" ON "public"."priority_items" FOR INSERT TO "authenticated" WITH CHECK ("public"."user_has_org_access"("org_id"));



CREATE POLICY "Users can delete bookings for their org" ON "public"."crm_meeting_bookings" FOR SELECT TO "authenticated" USING (("schedule_id" IN ( SELECT "crm_meeting_schedules"."id"
   FROM "public"."crm_meeting_schedules"
  WHERE ("crm_meeting_schedules"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can delete calendar integrations for their org" ON "public"."crm_calendar_integrations" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete enrollments for their org" ON "public"."crm_email_sequence_enrollments" FOR SELECT TO "authenticated" USING (("sequence_id" IN ( SELECT "crm_email_sequences"."id"
   FROM "public"."crm_email_sequences"
  WHERE ("crm_email_sequences"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can delete leads in their org" ON "public"."leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "leads"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text") AND ("org_memberships"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Users can delete meeting schedules for their org" ON "public"."crm_meeting_schedules" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete memberships" ON "public"."org_memberships" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("org_id" IN ( SELECT "public"."get_user_org_ids"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_org_ids"))));



CREATE POLICY "Users can delete notes" ON "public"."notes" FOR SELECT TO "authenticated" USING ((("created_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR (("user_id" IS NOT NULL) AND ("user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")))));



CREATE POLICY "Users can delete own navigation preferences" ON "public"."user_navigation_preferences" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Users can delete priority items" ON "public"."priority_items" FOR SELECT TO "authenticated" USING (("public"."user_has_org_access"("org_id") AND ("public"."user_is_org_manager_or_above"("org_id") OR ("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete sequence steps for their org" ON "public"."crm_email_sequence_steps" FOR SELECT TO "authenticated" USING (("sequence_id" IN ( SELECT "crm_email_sequences"."id"
   FROM "public"."crm_email_sequences"
  WHERE ("crm_email_sequences"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can delete sequences for their org" ON "public"."crm_email_sequences" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete shares" ON "public"."note_shares" FOR SELECT TO "authenticated" USING (("shared_by_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Users can delete tasks in their org" ON "public"."tasks" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "tasks"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text") AND ("org_memberships"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can delete template folders for their org" ON "public"."crm_template_folders" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete their assignments" ON "public"."assignments" FOR SELECT TO "authenticated" USING ((("created_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['ceo'::"text", 'cto'::"text", 'admin'::"text"])))))));



CREATE POLICY "Users can delete their org routing rules" ON "public"."crm_email_routing_rules" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can manage org threads" ON "public"."crm_email_threads" FOR SELECT TO "authenticated" USING ((("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))) OR "public"."current_user_has_admin_access"() OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['crm_user'::"text", 'admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Users can manage own notification settings" ON "public"."notification_settings" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own notifications" ON "public"."notifications" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own preferences" ON "public"."user_preferences" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own push subscriptions" ON "public"."device_push_subscriptions" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own attachments" ON "public"."crm_email_attachments" FOR SELECT TO "authenticated" USING (("uploaded_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own bookmarks" ON "public"."advisor_content_bookmarks" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own drafts" ON "public"."crm_email_drafts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own signatures" ON "public"."crm_email_signatures" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own views" ON "public"."advisor_content_views" FOR SELECT TO "authenticated" USING (("advisor_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read own messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR ("recipient_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid"))));



CREATE POLICY "Users can read own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update bookings for their org" ON "public"."crm_meeting_bookings" FOR SELECT TO "authenticated" USING (("schedule_id" IN ( SELECT "crm_meeting_schedules"."id"
   FROM "public"."crm_meeting_schedules"
  WHERE ("crm_meeting_schedules"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can update calendar integrations for their org" ON "public"."crm_calendar_integrations" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update enrollments for their org" ON "public"."crm_email_sequence_enrollments" FOR SELECT TO "authenticated" USING (("sequence_id" IN ( SELECT "crm_email_sequences"."id"
   FROM "public"."crm_email_sequences"
  WHERE ("crm_email_sequences"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can update leads in their org" ON "public"."leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "leads"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))));



CREATE POLICY "Users can update meeting schedules for their org" ON "public"."crm_meeting_schedules" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update notes" ON "public"."notes" FOR SELECT TO "authenticated" USING ((("created_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR (("user_id" IS NOT NULL) AND ("user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid"))) OR (("is_collaborative" = true) AND (EXISTS ( SELECT 1
   FROM "public"."note_shares"
  WHERE (("note_shares"."note_id" = "notes"."id") AND ("note_shares"."shared_with_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("note_shares"."permission_level" = 'edit'::"text")))))));



CREATE POLICY "Users can update own calendar_events" ON "public"."calendar_events" FOR SELECT TO "authenticated" USING ((("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can update own navigation preferences" ON "public"."user_navigation_preferences" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Users can update own session" ON "public"."analytics_sessions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own subscription" ON "public"."newsletter_subscribers" FOR SELECT TO "authenticated" USING (("email" = (( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'email'::"text")));



CREATE POLICY "Users can update priority items" ON "public"."priority_items" FOR SELECT TO "authenticated" USING (("public"."user_has_org_access"("org_id") AND ("public"."user_is_org_manager_or_above"("org_id") OR ("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update sequence steps for their org" ON "public"."crm_email_sequence_steps" FOR SELECT TO "authenticated" USING (("sequence_id" IN ( SELECT "crm_email_sequences"."id"
   FROM "public"."crm_email_sequences"
  WHERE ("crm_email_sequences"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can update sequences for their org" ON "public"."crm_email_sequences" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update tasks in their org" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "tasks"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))));



CREATE POLICY "Users can update template folders for their org" ON "public"."crm_template_folders" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update their assignments" ON "public"."assignments" FOR SELECT TO "authenticated" USING ((("assignee_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR ("created_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['ceo'::"text", 'cto'::"text", 'admin'::"text"])))))));



CREATE POLICY "Users can update their notifications" ON "public"."note_notifications" FOR SELECT TO "authenticated" USING (("recipient_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Users can update their org routing rules" ON "public"."crm_email_routing_rules" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view and update own notification events" ON "public"."notification_events" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view attachments from visible emails" ON "public"."crm_email_attachments" FOR SELECT TO "authenticated" USING (("email_id" IN ( SELECT "crm_email_log"."id"
   FROM "public"."crm_email_log"
  WHERE (("crm_email_log"."sent_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."current_user_has_admin_access"() OR (EXISTS ( SELECT 1
           FROM "public"."user_roles"
          WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['crm_user'::"text", 'admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'agent'::"text"))))))));



CREATE POLICY "Users can view bookings for their org" ON "public"."crm_meeting_bookings" FOR SELECT TO "authenticated" USING (("schedule_id" IN ( SELECT "crm_meeting_schedules"."id"
   FROM "public"."crm_meeting_schedules"
  WHERE ("crm_meeting_schedules"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view calendar integrations for their org" ON "public"."crm_calendar_integrations" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view enrollments for their org" ON "public"."crm_email_sequence_enrollments" FOR SELECT TO "authenticated" USING (("sequence_id" IN ( SELECT "crm_email_sequences"."id"
   FROM "public"."crm_email_sequences"
  WHERE ("crm_email_sequences"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view invites for their orgs" ON "public"."org_invites" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "org_invites"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))) OR ("email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text")));



CREATE POLICY "Users can view lanes in their org" ON "public"."priority_lanes" FOR SELECT TO "authenticated" USING ("public"."user_has_org_access"("org_id"));



CREATE POLICY "Users can view leads in their org" ON "public"."leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "leads"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))));



CREATE POLICY "Users can view meeting schedules for their org" ON "public"."crm_meeting_schedules" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view org achievements" ON "public"."user_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "user_achievements"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))));



CREATE POLICY "Users can view org activities" ON "public"."activities" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "activities"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))) AND (("is_public" = true) OR (( SELECT "auth"."uid"() AS "uid") = ANY ("visible_to")) OR ("actor_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view org co-members" ON "public"."org_memberships" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "public"."get_user_org_ids"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_org_ids")));



CREATE POLICY "Users can view org threads" ON "public"."crm_email_threads" FOR SELECT TO "authenticated" USING ((("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))) OR "public"."current_user_has_admin_access"() OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['crm_user'::"text", 'admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Users can view own achievements" ON "public"."user_achievements" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own and shared notes" ON "public"."notes" FOR SELECT TO "authenticated" USING ((("created_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR (("user_id" IS NOT NULL) AND ("user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid"))) OR (EXISTS ( SELECT 1
   FROM "public"."note_shares"
  WHERE (("note_shares"."note_id" = "notes"."id") AND ("note_shares"."shared_with_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")))))));



CREATE POLICY "Users can view own memberships" ON "public"."org_memberships" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own navigation preferences" ON "public"."user_navigation_preferences" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Users can view own subscription" ON "public"."newsletter_subscribers" FOR SELECT TO "authenticated" USING (("email" = (( SELECT ( SELECT "auth"."jwt"() AS "jwt") AS "jwt") ->> 'email'::"text")));



CREATE POLICY "Users can view priority items" ON "public"."priority_items" FOR SELECT TO "authenticated" USING (("public"."user_has_org_access"("org_id") AND ("public"."user_is_org_manager_or_above"("org_id") OR ("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("owner_user_id" IS NULL))));



CREATE POLICY "Users can view scoring rules" ON "public"."scoring_rules" FOR SELECT TO "authenticated" USING ("public"."user_has_org_access"("org_id"));



CREATE POLICY "Users can view sequence steps for their org" ON "public"."crm_email_sequence_steps" FOR SELECT TO "authenticated" USING (("sequence_id" IN ( SELECT "crm_email_sequences"."id"
   FROM "public"."crm_email_sequences"
  WHERE ("crm_email_sequences"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view sequences for their org" ON "public"."crm_email_sequences" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view tasks in their org" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "tasks"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))));



CREATE POLICY "Users can view template folders for their org" ON "public"."crm_template_folders" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their assignments" ON "public"."assignments" FOR SELECT TO "authenticated" USING ((("assignee_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR ("created_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) AND ("profiles"."role" = ANY (ARRAY['ceo'::"text", 'cto'::"text", 'admin'::"text"])))))));



CREATE POLICY "Users can view their notifications" ON "public"."note_notifications" FOR SELECT TO "authenticated" USING (("recipient_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")));



CREATE POLICY "Users can view their org routing rules" ON "public"."crm_email_routing_rules" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "organizations"."id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."status" = 'active'::"text")))));



CREATE POLICY "Users can view their own submissions" ON "public"."zoho_lead_submissions" FOR SELECT TO "authenticated" USING ((( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid") = "user_id"));



CREATE POLICY "Users can view their shares" ON "public"."note_shares" FOR SELECT TO "authenticated" USING ((("shared_by_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR ("shared_with_user_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid"))));



CREATE POLICY "Users insert own terminal sessions" ON "public"."advisor_terminal_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users manage own dashboard layouts" ON "public"."crm_dashboard_layouts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users manage own dashboard notes" ON "public"."crm_dashboard_notes" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users manage own notification_preferences" ON "public"."notification_preferences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users manage own personal goals" ON "public"."crm_user_goals" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("is_personal" = true)));



CREATE POLICY "Users read own notification_log" ON "public"."notification_log" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own terminal sessions" ON "public"."advisor_terminal_sessions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view own and assigned goals" ON "public"."crm_user_goals" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (( SELECT "auth"."uid"() AS "uid") = "assigned_by")));



CREATE POLICY "Users view own commands" ON "public"."advisor_terminal_commands" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users view own sessions" ON "public"."advisor_terminal_sessions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "View active links" ON "public"."approved_links" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "View tool permissions" ON "public"."terminal_tool_permissions" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_select" ON "public"."activities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "admin_delete_contacts" ON "public"."advisor_contact_directory" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "admin_read_all_contacts" ON "public"."advisor_contact_directory" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."admin_resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_update_contacts" ON "public"."advisor_contact_directory" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_delete" ON "public"."admin_users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "admin_users_select" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "admin_users_service_role" ON "public"."admin_users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "admin_users_update" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



ALTER TABLE "public"."advisor_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "advisor_access_admin_all" ON "public"."advisor_access" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "advisor_access_select_own" ON "public"."advisor_access" FOR SELECT TO "authenticated" USING (("lower"("email") = "lower"(( SELECT "advisor_profiles"."email"
   FROM "public"."advisor_profiles"
  WHERE ("advisor_profiles"."id" = "auth"."uid"())
 LIMIT 1))));



ALTER TABLE "public"."advisor_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_contact_directory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_content_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_content_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_content_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_dashboard_widgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_enrollment_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_external_training_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_learning_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_lesson_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_lms_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_meeting_attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_meeting_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_nav_menu" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_plan_resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "advisor_plan_resources_admin_all" ON "public"."advisor_plan_resources" TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"())) WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "advisor_plan_resources_anon_select" ON "public"."advisor_plan_resources" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



ALTER TABLE "public"."advisor_portal_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_quick_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_terminal_commands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_terminal_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "advisors_admin_delete" ON "public"."advisors" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "advisors_admin_insert" ON "public"."advisors" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "advisors_admin_update" ON "public"."advisors" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "advisors_select" ON "public"."advisors" FOR SELECT USING (((("is_active" = true) AND ("status" ~~ '%Active%'::"text")) OR "public"."current_user_has_admin_access"()));



ALTER TABLE "public"."ai_automation_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_automation_rules_select" ON "public"."ai_automation_rules" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."ai_lead_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_experiments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "approval_actions_select" ON "public"."crm_approval_actions" FOR SELECT TO "authenticated" USING (("request_id" IN ( SELECT "ar"."id"
   FROM ("public"."crm_approval_requests" "ar"
     JOIN "public"."org_memberships" "om" ON ((("om"."org_id" = "ar"."org_id") AND ("om"."status" = 'active'::"text"))))
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_processes_delete" ON "public"."crm_approval_processes" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "om"."org_id"
   FROM "public"."org_memberships" "om"
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_processes_select" ON "public"."crm_approval_processes" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "om"."org_id"
   FROM "public"."org_memberships" "om"
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_processes_update" ON "public"."crm_approval_processes" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "om"."org_id"
   FROM "public"."org_memberships" "om"
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_requests_select" ON "public"."crm_approval_requests" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "om"."org_id"
   FROM "public"."org_memberships" "om"
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_requests_update" ON "public"."crm_approval_requests" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "om"."org_id"
   FROM "public"."org_memberships" "om"
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_steps_delete" ON "public"."crm_approval_steps" FOR SELECT TO "authenticated" USING (("process_id" IN ( SELECT "ap"."id"
   FROM ("public"."crm_approval_processes" "ap"
     JOIN "public"."org_memberships" "om" ON ((("om"."org_id" = "ap"."org_id") AND ("om"."status" = 'active'::"text"))))
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_steps_select" ON "public"."crm_approval_steps" FOR SELECT TO "authenticated" USING (("process_id" IN ( SELECT "ap"."id"
   FROM ("public"."crm_approval_processes" "ap"
     JOIN "public"."org_memberships" "om" ON ((("om"."org_id" = "ap"."org_id") AND ("om"."status" = 'active'::"text"))))
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "approval_steps_update" ON "public"."crm_approval_steps" FOR SELECT TO "authenticated" USING (("process_id" IN ( SELECT "ap"."id"
   FROM ("public"."crm_approval_processes" "ap"
     JOIN "public"."org_memberships" "om" ON ((("om"."org_id" = "ap"."org_id") AND ("om"."status" = 'active'::"text"))))
  WHERE ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."approved_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_select_permission" ON "public"."audit_events" FOR SELECT TO "authenticated" USING ("public"."has_org_permission"("org_id", 'audit.read'::"text"));



CREATE POLICY "authenticated_read_active_contacts" ON "public"."advisor_contact_directory" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."automation_execution_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automation_templates_select" ON "public"."automation_templates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."benefit_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "benefit_usage_delete_member" ON "public"."benefit_usage" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "benefit_usage_select_member" ON "public"."benefit_usage" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "benefit_usage_update_member" ON "public"."benefit_usage" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



ALTER TABLE "public"."benefits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "benefits_admin_delete" ON "public"."benefits" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "benefits_admin_manage" ON "public"."benefits" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "benefits_admin_update" ON "public"."benefits" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "benefits_select" ON "public"."benefits" FOR SELECT USING ((("is_active" = true) OR "public"."current_user_has_admin_access"()));



ALTER TABLE "public"."blog_articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_articles_admin_delete" ON "public"."blog_articles" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "blog_articles_admin_insert" ON "public"."blog_articles" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "blog_articles_admin_update" ON "public"."blog_articles" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "blog_articles_select" ON "public"."blog_articles" FOR SELECT USING ((("is_published" = true) OR ("auth"."role"() = 'authenticated'::"text") OR "public"."current_user_has_admin_access"()));



ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_generation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bulletin_email_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bulletin_email_recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."code_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."code_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cognito_forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_acknowledgments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compliance_acknowledgments_select" ON "public"."compliance_acknowledgments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "compliance_acknowledgments_update" ON "public"."compliance_acknowledgments" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."compliance_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compliance_documents_select" ON "public"."compliance_documents" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."content_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."conversion_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coverage_docs_delete_member" ON "public"."coverage_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."member_coverage" "mc"
  WHERE (("mc"."id" = "coverage_documents"."coverage_id") AND (("mc"."member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"())))));



CREATE POLICY "coverage_docs_select_member" ON "public"."coverage_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."member_coverage" "mc"
  WHERE (("mc"."id" = "coverage_documents"."coverage_id") AND (("mc"."member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"())))));



CREATE POLICY "coverage_docs_update_member" ON "public"."coverage_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."member_coverage" "mc"
  WHERE (("mc"."id" = "coverage_documents"."coverage_id") AND (("mc"."member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"())))));



ALTER TABLE "public"."coverage_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_accounts_delete" ON "public"."crm_accounts" FOR DELETE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'accounts.delete'::"text"));



CREATE POLICY "crm_accounts_insert" ON "public"."crm_accounts" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'accounts.write'::"text"));



CREATE POLICY "crm_accounts_select" ON "public"."crm_accounts" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_accounts_update" ON "public"."crm_accounts" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'accounts.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'accounts.write'::"text"));



ALTER TABLE "public"."crm_activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_activities_delete" ON "public"."crm_activities" FOR SELECT TO "authenticated" USING (("public"."is_org_member"("org_id") AND (("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("org_id"))));



CREATE POLICY "crm_activities_insert" ON "public"."crm_activities" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_activities_select" ON "public"."crm_activities" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_activities_update" ON "public"."crm_activities" FOR UPDATE TO "authenticated" USING ("public"."is_org_member"("org_id")) WITH CHECK ("public"."is_org_member"("org_id"));



ALTER TABLE "public"."crm_approval_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_approval_processes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_approval_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_approval_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_calendar_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_campaign_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_campaign_members_delete" ON "public"."crm_campaign_members" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_campaigns" "c"
  WHERE (("c"."id" = "crm_campaign_members"."campaign_id") AND "public"."has_org_permission"("c"."org_id", 'campaigns.write'::"text")))));



CREATE POLICY "crm_campaign_members_insert" ON "public"."crm_campaign_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_campaigns" "c"
  WHERE (("c"."id" = "crm_campaign_members"."campaign_id") AND "public"."has_org_permission"("c"."org_id", 'campaigns.write'::"text")))));



CREATE POLICY "crm_campaign_members_select" ON "public"."crm_campaign_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_campaigns" "c"
  WHERE (("c"."id" = "crm_campaign_members"."campaign_id") AND "public"."is_org_member"("c"."org_id")))));



CREATE POLICY "crm_campaign_members_update" ON "public"."crm_campaign_members" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_campaigns" "c"
  WHERE (("c"."id" = "crm_campaign_members"."campaign_id") AND "public"."has_org_permission"("c"."org_id", 'campaigns.write'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_campaigns" "c"
  WHERE (("c"."id" = "crm_campaign_members"."campaign_id") AND "public"."has_org_permission"("c"."org_id", 'campaigns.write'::"text")))));



ALTER TABLE "public"."crm_campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_campaigns_delete" ON "public"."crm_campaigns" FOR DELETE TO "authenticated" USING (("public"."has_org_permission"("org_id", 'campaigns.write'::"text") AND ("status" = ANY (ARRAY['planning'::"text", 'cancelled'::"text"]))));



CREATE POLICY "crm_campaigns_insert" ON "public"."crm_campaigns" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'campaigns.write'::"text"));



CREATE POLICY "crm_campaigns_select" ON "public"."crm_campaigns" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_campaigns_update" ON "public"."crm_campaigns" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'campaigns.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'campaigns.write'::"text"));



ALTER TABLE "public"."crm_case_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_case_comments_delete" ON "public"."crm_case_comments" FOR SELECT USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "crm_case_comments_insert" ON "public"."crm_case_comments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_cases" "c"
  WHERE (("c"."id" = "crm_case_comments"."case_id") AND "public"."is_org_member"("c"."org_id") AND "public"."has_org_permission"("c"."org_id", 'cases.write'::"text")))));



CREATE POLICY "crm_case_comments_select" ON "public"."crm_case_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."crm_cases" "c"
  WHERE (("c"."id" = "crm_case_comments"."case_id") AND "public"."is_org_member"("c"."org_id") AND "public"."has_org_permission"("c"."org_id", 'cases.read'::"text")))));



CREATE POLICY "crm_case_comments_update" ON "public"."crm_case_comments" FOR SELECT USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."crm_cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_cases_delete" ON "public"."crm_cases" FOR DELETE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'cases.delete'::"text")));



CREATE POLICY "crm_cases_insert" ON "public"."crm_cases" FOR INSERT WITH CHECK (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'cases.write'::"text")));



CREATE POLICY "crm_cases_select" ON "public"."crm_cases" FOR SELECT USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'cases.read'::"text")));



CREATE POLICY "crm_cases_update" ON "public"."crm_cases" FOR UPDATE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'cases.write'::"text")));



ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_contacts_delete" ON "public"."crm_contacts" FOR DELETE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'contacts.delete'::"text"));



CREATE POLICY "crm_contacts_insert" ON "public"."crm_contacts" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'contacts.write'::"text"));



CREATE POLICY "crm_contacts_select" ON "public"."crm_contacts" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_contacts_update" ON "public"."crm_contacts" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'contacts.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'contacts.write'::"text"));



ALTER TABLE "public"."crm_dashboard_layouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_dashboard_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_deal_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_deal_contacts_delete" ON "public"."crm_deal_contacts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_contacts"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



CREATE POLICY "crm_deal_contacts_insert" ON "public"."crm_deal_contacts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_contacts"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



CREATE POLICY "crm_deal_contacts_select" ON "public"."crm_deal_contacts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_contacts"."deal_id") AND "public"."is_org_member"("d"."org_id")))));



CREATE POLICY "crm_deal_contacts_update" ON "public"."crm_deal_contacts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_contacts"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_contacts"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



ALTER TABLE "public"."crm_deal_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_deal_products_delete" ON "public"."crm_deal_products" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_products"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



CREATE POLICY "crm_deal_products_insert" ON "public"."crm_deal_products" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_products"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



CREATE POLICY "crm_deal_products_select" ON "public"."crm_deal_products" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_products"."deal_id") AND "public"."is_org_member"("d"."org_id")))));



CREATE POLICY "crm_deal_products_update" ON "public"."crm_deal_products" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_products"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_products"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



ALTER TABLE "public"."crm_deal_stage_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_deal_stage_history_insert" ON "public"."crm_deal_stage_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_stage_history"."deal_id") AND "public"."has_org_permission"("d"."org_id", 'deals.write'::"text")))));



CREATE POLICY "crm_deal_stage_history_select" ON "public"."crm_deal_stage_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_deals" "d"
  WHERE (("d"."id" = "crm_deal_stage_history"."deal_id") AND "public"."is_org_member"("d"."org_id")))));



ALTER TABLE "public"."crm_deal_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_deal_stages_delete" ON "public"."crm_deal_stages" FOR DELETE TO "authenticated" USING ("public"."is_org_admin"("org_id"));



CREATE POLICY "crm_deal_stages_insert" ON "public"."crm_deal_stages" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_org_admin"("org_id"));



CREATE POLICY "crm_deal_stages_select" ON "public"."crm_deal_stages" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_deal_stages_update" ON "public"."crm_deal_stages" FOR UPDATE TO "authenticated" USING ("public"."is_org_admin"("org_id")) WITH CHECK ("public"."is_org_admin"("org_id"));



ALTER TABLE "public"."crm_deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_deals_delete" ON "public"."crm_deals" FOR DELETE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'deals.delete'::"text"));



CREATE POLICY "crm_deals_insert" ON "public"."crm_deals" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'deals.write'::"text"));



CREATE POLICY "crm_deals_select" ON "public"."crm_deals" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_deals_update" ON "public"."crm_deals" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'deals.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'deals.write'::"text"));



ALTER TABLE "public"."crm_default_layout_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_documents_delete" ON "public"."crm_documents" FOR DELETE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'documents.delete'::"text")));



CREATE POLICY "crm_documents_insert" ON "public"."crm_documents" FOR INSERT WITH CHECK (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'documents.write'::"text")));



CREATE POLICY "crm_documents_select" ON "public"."crm_documents" FOR SELECT USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'documents.read'::"text")));



CREATE POLICY "crm_documents_update" ON "public"."crm_documents" FOR UPDATE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'documents.write'::"text")));



ALTER TABLE "public"."crm_email_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_routing_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_sequence_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_sequence_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_email_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_forecast_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_forecast_entries_delete" ON "public"."crm_forecast_entries" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_forecasts" "f"
  WHERE (("f"."id" = "crm_forecast_entries"."forecast_id") AND "public"."has_org_permission"("f"."org_id", 'deals.delete'::"text")))));



CREATE POLICY "crm_forecast_entries_insert" ON "public"."crm_forecast_entries" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_forecasts" "f"
  WHERE (("f"."id" = "crm_forecast_entries"."forecast_id") AND "public"."has_org_permission"("f"."org_id", 'deals.write'::"text")))));



CREATE POLICY "crm_forecast_entries_select" ON "public"."crm_forecast_entries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_forecasts" "f"
  WHERE (("f"."id" = "crm_forecast_entries"."forecast_id") AND "public"."is_org_member"("f"."org_id")))));



CREATE POLICY "crm_forecast_entries_update" ON "public"."crm_forecast_entries" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_forecasts" "f"
  WHERE (("f"."id" = "crm_forecast_entries"."forecast_id") AND "public"."has_org_permission"("f"."org_id", 'deals.write'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_forecasts" "f"
  WHERE (("f"."id" = "crm_forecast_entries"."forecast_id") AND "public"."has_org_permission"("f"."org_id", 'deals.write'::"text")))));



ALTER TABLE "public"."crm_forecasts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_forecasts_delete" ON "public"."crm_forecasts" FOR DELETE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'deals.delete'::"text"));



CREATE POLICY "crm_forecasts_insert" ON "public"."crm_forecasts" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'deals.write'::"text"));



CREATE POLICY "crm_forecasts_select" ON "public"."crm_forecasts" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_forecasts_update" ON "public"."crm_forecasts" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'deals.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'deals.write'::"text"));



ALTER TABLE "public"."crm_invoice_line_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_invoice_line_items_delete" ON "public"."crm_invoice_line_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_line_items"."invoice_id") AND "public"."has_org_permission"("i"."org_id", 'invoices.write'::"text") AND ("i"."status" = 'draft'::"text")))));



CREATE POLICY "crm_invoice_line_items_insert" ON "public"."crm_invoice_line_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_line_items"."invoice_id") AND "public"."has_org_permission"("i"."org_id", 'invoices.write'::"text")))));



CREATE POLICY "crm_invoice_line_items_select" ON "public"."crm_invoice_line_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_line_items"."invoice_id") AND "public"."is_org_member"("i"."org_id")))));



CREATE POLICY "crm_invoice_line_items_update" ON "public"."crm_invoice_line_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_line_items"."invoice_id") AND "public"."has_org_permission"("i"."org_id", 'invoices.write'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_line_items"."invoice_id") AND "public"."has_org_permission"("i"."org_id", 'invoices.write'::"text")))));



ALTER TABLE "public"."crm_invoice_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_invoice_payments_insert" ON "public"."crm_invoice_payments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_payments"."invoice_id") AND "public"."has_org_permission"("i"."org_id", 'invoices.write'::"text")))));



CREATE POLICY "crm_invoice_payments_select" ON "public"."crm_invoice_payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_invoices" "i"
  WHERE (("i"."id" = "crm_invoice_payments"."invoice_id") AND "public"."is_org_member"("i"."org_id")))));



ALTER TABLE "public"."crm_invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_invoices_delete" ON "public"."crm_invoices" FOR DELETE TO "authenticated" USING (("public"."has_org_permission"("org_id", 'invoices.write'::"text") AND ("status" = 'draft'::"text")));



CREATE POLICY "crm_invoices_insert" ON "public"."crm_invoices" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'invoices.write'::"text"));



CREATE POLICY "crm_invoices_select" ON "public"."crm_invoices" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_invoices_update" ON "public"."crm_invoices" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'invoices.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'invoices.write'::"text"));



ALTER TABLE "public"."crm_lead_health_quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_lead_health_quotes_delete" ON "public"."crm_lead_health_quotes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "crm_lead_health_quotes_select" ON "public"."crm_lead_health_quotes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'agent'::"text"]))))));



CREATE POLICY "crm_lead_health_quotes_update" ON "public"."crm_lead_health_quotes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'agent'::"text"]))))));



ALTER TABLE "public"."crm_lead_plan_interests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_lead_plan_interests_delete" ON "public"."crm_lead_plan_interests" FOR DELETE TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "crm_lead_plan_interests_select" ON "public"."crm_lead_plan_interests" FOR SELECT TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"() OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'crm_user'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'agent'::"text"))))));



CREATE POLICY "crm_lead_plan_interests_update" ON "public"."crm_lead_plan_interests" FOR SELECT TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"() OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'crm_user'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'agent'::"text"))))));



ALTER TABLE "public"."crm_meeting_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_meeting_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_pipeline_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_pipeline_stages_select" ON "public"."crm_pipeline_stages" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."crm_price_book_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_price_book_items_delete" ON "public"."crm_price_book_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_price_books" "pb"
  WHERE (("pb"."id" = "crm_price_book_items"."price_book_id") AND "public"."has_org_permission"("pb"."org_id", 'products.write'::"text")))));



CREATE POLICY "crm_price_book_items_insert" ON "public"."crm_price_book_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_price_books" "pb"
  WHERE (("pb"."id" = "crm_price_book_items"."price_book_id") AND "public"."has_org_permission"("pb"."org_id", 'products.write'::"text")))));



CREATE POLICY "crm_price_book_items_select" ON "public"."crm_price_book_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_price_books" "pb"
  WHERE (("pb"."id" = "crm_price_book_items"."price_book_id") AND "public"."is_org_member"("pb"."org_id")))));



CREATE POLICY "crm_price_book_items_update" ON "public"."crm_price_book_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_price_books" "pb"
  WHERE (("pb"."id" = "crm_price_book_items"."price_book_id") AND "public"."has_org_permission"("pb"."org_id", 'products.write'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_price_books" "pb"
  WHERE (("pb"."id" = "crm_price_book_items"."price_book_id") AND "public"."has_org_permission"("pb"."org_id", 'products.write'::"text")))));



ALTER TABLE "public"."crm_price_books" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_price_books_delete" ON "public"."crm_price_books" FOR DELETE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'products.write'::"text"));



CREATE POLICY "crm_price_books_insert" ON "public"."crm_price_books" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'products.write'::"text"));



CREATE POLICY "crm_price_books_select" ON "public"."crm_price_books" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_price_books_update" ON "public"."crm_price_books" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'products.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'products.write'::"text"));



ALTER TABLE "public"."crm_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_products_delete" ON "public"."crm_products" FOR DELETE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'products.write'::"text"));



CREATE POLICY "crm_products_insert" ON "public"."crm_products" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'products.write'::"text"));



CREATE POLICY "crm_products_select" ON "public"."crm_products" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_products_update" ON "public"."crm_products" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'products.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'products.write'::"text"));



ALTER TABLE "public"."crm_purchase_order_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_quote_line_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_quote_line_items_delete" ON "public"."crm_quote_line_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_quotes" "q"
  WHERE (("q"."id" = "crm_quote_line_items"."quote_id") AND "public"."has_org_permission"("q"."org_id", 'quotes.write'::"text") AND ("q"."status" = 'draft'::"text")))));



CREATE POLICY "crm_quote_line_items_insert" ON "public"."crm_quote_line_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_quotes" "q"
  WHERE (("q"."id" = "crm_quote_line_items"."quote_id") AND "public"."has_org_permission"("q"."org_id", 'quotes.write'::"text") AND ("q"."status" = 'draft'::"text")))));



CREATE POLICY "crm_quote_line_items_select" ON "public"."crm_quote_line_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_quotes" "q"
  WHERE (("q"."id" = "crm_quote_line_items"."quote_id") AND "public"."is_org_member"("q"."org_id")))));



CREATE POLICY "crm_quote_line_items_update" ON "public"."crm_quote_line_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."crm_quotes" "q"
  WHERE (("q"."id" = "crm_quote_line_items"."quote_id") AND "public"."has_org_permission"("q"."org_id", 'quotes.write'::"text") AND ("q"."status" = 'draft'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_quotes" "q"
  WHERE (("q"."id" = "crm_quote_line_items"."quote_id") AND "public"."has_org_permission"("q"."org_id", 'quotes.write'::"text") AND ("q"."status" = 'draft'::"text")))));



ALTER TABLE "public"."crm_quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_quotes_delete" ON "public"."crm_quotes" FOR DELETE TO "authenticated" USING (("public"."has_org_permission"("org_id", 'quotes.write'::"text") AND ("status" = 'draft'::"text")));



CREATE POLICY "crm_quotes_insert" ON "public"."crm_quotes" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_org_permission"("org_id", 'quotes.write'::"text"));



CREATE POLICY "crm_quotes_select" ON "public"."crm_quotes" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "crm_quotes_update" ON "public"."crm_quotes" FOR UPDATE TO "authenticated" USING ("public"."has_org_permission"("org_id", 'quotes.write'::"text")) WITH CHECK ("public"."has_org_permission"("org_id", 'quotes.write'::"text"));



ALTER TABLE "public"."crm_sales_order_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_sales_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_saved_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_saved_views_delete" ON "public"."crm_saved_views" FOR SELECT USING (("owner_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "crm_saved_views_select" ON "public"."crm_saved_views" FOR SELECT USING (("public"."is_org_member"("org_id") AND (("owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("is_shared" = true))));



CREATE POLICY "crm_saved_views_update" ON "public"."crm_saved_views" FOR SELECT USING (("owner_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."crm_studio_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_studio_layouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_studio_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_studio_validation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_studio_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_template_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_user_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_vendors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_web_form_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_web_form_submissions_delete" ON "public"."crm_web_form_submissions" FOR SELECT USING (("form_id" IN ( SELECT "crm_web_forms"."id"
   FROM "public"."crm_web_forms"
  WHERE ("crm_web_forms"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "crm_web_form_submissions_select" ON "public"."crm_web_form_submissions" FOR SELECT USING (("form_id" IN ( SELECT "crm_web_forms"."id"
   FROM "public"."crm_web_forms"
  WHERE ("crm_web_forms"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "crm_web_form_submissions_update" ON "public"."crm_web_form_submissions" FOR SELECT USING (("form_id" IN ( SELECT "crm_web_forms"."id"
   FROM "public"."crm_web_forms"
  WHERE ("crm_web_forms"."org_id" IN ( SELECT "org_memberships"."org_id"
           FROM "public"."org_memberships"
          WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."crm_web_forms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_web_forms_delete" ON "public"."crm_web_forms" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "crm_web_forms_public_read" ON "public"."crm_web_forms" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "crm_web_forms_select" ON "public"."crm_web_forms" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "crm_web_forms_update" ON "public"."crm_web_forms" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."crm_website_quote_sync" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_website_quote_sync_all" ON "public"."crm_website_quote_sync" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "crm_website_quote_sync_select" ON "public"."crm_website_quote_sync" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'agent'::"text"]))))));



ALTER TABLE "public"."daily_analytics_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_push_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "doc_access_delete_member" ON "public"."document_access_log" FOR SELECT TO "authenticated" USING ((("accessed_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "doc_access_select_member" ON "public"."document_access_log" FOR SELECT TO "authenticated" USING ((("accessed_by" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



ALTER TABLE "public"."document_access_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."educational_content" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "educational_content_admin_delete" ON "public"."educational_content" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "educational_content_admin_manage" ON "public"."educational_content" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "educational_content_admin_update" ON "public"."educational_content" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "educational_content_select" ON "public"."educational_content" FOR SELECT USING ((("is_active" = true) OR "public"."current_user_has_admin_access"()));



ALTER TABLE "public"."email_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollment_intent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."esignature_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."esignature_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."external_lms_courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_lms_courses_admin_delete" ON "public"."external_lms_courses" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "external_lms_courses_admin_manage" ON "public"."external_lms_courses" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "external_lms_courses_admin_update" ON "public"."external_lms_courses" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "external_lms_courses_select" ON "public"."external_lms_courses" FOR SELECT USING ((("is_active" = true) OR "public"."current_user_has_admin_access"()));



ALTER TABLE "public"."external_lms_lessons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "external_lms_lessons_admin_delete" ON "public"."external_lms_lessons" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "external_lms_lessons_admin_manage" ON "public"."external_lms_lessons" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "external_lms_lessons_admin_update" ON "public"."external_lms_lessons" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "external_lms_lessons_select" ON "public"."external_lms_lessons" FOR SELECT USING (true);



ALTER TABLE "public"."faq_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_submissions_select" ON "public"."form_submissions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."gemini_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."geo_state_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."handbooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."healthcare_plan_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."immunizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_health" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interaction_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_delete_member" ON "public"."invoices" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "invoices_select_member" ON "public"."invoices" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "invoices_update_member" ON "public"."invoices" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



ALTER TABLE "public"."lab_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_routing_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_scoring_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mail_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_accounts_delete" ON "public"."mail_accounts" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "mail_accounts_select" ON "public"."mail_accounts" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."mail_shared_access"
  WHERE (("mail_shared_access"."account_id" = "mail_accounts"."id") AND ("mail_shared_access"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("mail_shared_access"."is_active" = true))))));



CREATE POLICY "mail_accounts_update" ON "public"."mail_accounts" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."mail_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_audit_log_select" ON "public"."mail_audit_log" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."mail_domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_domains_manage" ON "public"."mail_domains" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "mail_domains"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_memberships"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "mail_domains_select" ON "public"."mail_domains" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "mail_domains"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."mail_folders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_folders_access" ON "public"."mail_folders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mail_accounts"
  WHERE (("mail_accounts"."id" = "mail_folders"."account_id") AND (("mail_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."mail_shared_access"
          WHERE (("mail_shared_access"."account_id" = "mail_accounts"."id") AND ("mail_shared_access"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("mail_shared_access"."is_active" = true)))))))));



ALTER TABLE "public"."mail_message_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_message_attachments_access" ON "public"."mail_message_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."mail_messages" "m"
     JOIN "public"."mail_accounts" "a" ON (("a"."id" = "m"."account_id")))
  WHERE (("m"."id" = "mail_message_attachments"."message_id") AND (("a"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."mail_shared_access"
          WHERE (("mail_shared_access"."account_id" = "a"."id") AND ("mail_shared_access"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("mail_shared_access"."is_active" = true)))))))));



ALTER TABLE "public"."mail_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_messages_access" ON "public"."mail_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mail_accounts"
  WHERE (("mail_accounts"."id" = "mail_messages"."account_id") AND (("mail_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."mail_shared_access"
          WHERE (("mail_shared_access"."account_id" = "mail_accounts"."id") AND ("mail_shared_access"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("mail_shared_access"."is_active" = true)))))))));



ALTER TABLE "public"."mail_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_rules_access" ON "public"."mail_rules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mail_accounts"
  WHERE (("mail_accounts"."id" = "mail_rules"."account_id") AND ("mail_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."mail_sender_identities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_sender_identities_access" ON "public"."mail_sender_identities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_memberships"
  WHERE (("org_memberships"."org_id" = "mail_sender_identities"."org_id") AND ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."mail_shared_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_shared_access_grantee" ON "public"."mail_shared_access" FOR SELECT USING (("grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "mail_shared_access_owner" ON "public"."mail_shared_access" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mail_accounts"
  WHERE (("mail_accounts"."id" = "mail_shared_access"."account_id") AND ("mail_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."mail_sync_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mail_sync_jobs_select" ON "public"."mail_sync_jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mail_accounts"
  WHERE (("mail_accounts"."id" = "mail_sync_jobs"."account_id") AND ("mail_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."marketing_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maternity_coverage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maternity_coverage_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_coverage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "member_coverage_delete_member" ON "public"."member_coverage" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "member_coverage_select_member" ON "public"."member_coverage" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



CREATE POLICY "member_coverage_update_member" ON "public"."member_coverage" FOR SELECT TO "authenticated" USING ((("member_id" = ( SELECT ( SELECT "auth"."uid"() AS "uid") AS "uid")) OR "public"."is_staff_or_admin"()));



ALTER TABLE "public"."member_dependents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."navigation_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."navigation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_delete_owner" ON "public"."orgs" FOR DELETE TO "authenticated" USING ("public"."is_org_role"("id", 'owner'::"text"));



ALTER TABLE "public"."org_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_lead_activities_delete" ON "public"."lead_activities" FOR DELETE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."has_org_permission"("org_id", 'leads.delete'::"text")));



CREATE POLICY "org_lead_activities_insert" ON "public"."lead_activities" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_activities_select" ON "public"."lead_activities" FOR SELECT TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_activities_update" ON "public"."lead_activities" FOR UPDATE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id"))) WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_notifications_delete" ON "public"."lead_notifications" FOR DELETE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."has_org_permission"("org_id", 'leads.delete'::"text")));



CREATE POLICY "org_lead_notifications_insert" ON "public"."lead_notifications" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_notifications_select" ON "public"."lead_notifications" FOR SELECT TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_notifications_update" ON "public"."lead_notifications" FOR UPDATE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id"))) WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_tasks_delete" ON "public"."lead_tasks" FOR DELETE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."has_org_permission"("org_id", 'tasks.delete'::"text")));



CREATE POLICY "org_lead_tasks_insert" ON "public"."lead_tasks" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_tasks_select" ON "public"."lead_tasks" FOR SELECT TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_lead_tasks_update" ON "public"."lead_tasks" FOR UPDATE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id"))) WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_leads_delete" ON "public"."zoho_lead_submissions" FOR DELETE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."has_org_permission"("org_id", 'leads.delete'::"text")));



CREATE POLICY "org_leads_insert" ON "public"."zoho_lead_submissions" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_leads_select" ON "public"."zoho_lead_submissions" FOR SELECT TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_leads_update" ON "public"."zoho_lead_submissions" FOR UPDATE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id"))) WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



ALTER TABLE "public"."org_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_pipeline_stages_delete" ON "public"."crm_pipeline_stages" FOR DELETE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."has_org_permission"("org_id", 'pipeline.delete'::"text")));



CREATE POLICY "org_pipeline_stages_insert" ON "public"."crm_pipeline_stages" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_pipeline_stages_select" ON "public"."crm_pipeline_stages" FOR SELECT TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_pipeline_stages_update" ON "public"."crm_pipeline_stages" FOR UPDATE TO "authenticated" USING ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id"))) WITH CHECK ((("org_id" IS NOT NULL) AND "public"."is_org_member"("org_id")));



CREATE POLICY "org_select_member" ON "public"."orgs" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("id"));



CREATE POLICY "org_update_admin" ON "public"."orgs" FOR UPDATE TO "authenticated" USING ("public"."is_org_admin"("id")) WITH CHECK ("public"."is_org_admin"("id"));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orgs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outlook_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_processors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "performance_goals_select" ON "public"."performance_goals" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permissions_select_authenticated" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."plan_category_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_category_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_selections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_sharing_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "po_delete" ON "public"."crm_purchase_orders" FOR DELETE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'purchase_orders.delete'::"text")));



CREATE POLICY "po_insert" ON "public"."crm_purchase_orders" FOR INSERT WITH CHECK (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'purchase_orders.write'::"text")));



CREATE POLICY "po_items_delete" ON "public"."crm_purchase_order_line_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."crm_purchase_orders" "po"
  WHERE (("po"."id" = "crm_purchase_order_line_items"."purchase_order_id") AND "public"."is_org_member"("po"."org_id") AND "public"."has_org_permission"("po"."org_id", 'purchase_orders.write'::"text")))));



CREATE POLICY "po_items_insert" ON "public"."crm_purchase_order_line_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_purchase_orders" "po"
  WHERE (("po"."id" = "crm_purchase_order_line_items"."purchase_order_id") AND "public"."is_org_member"("po"."org_id") AND "public"."has_org_permission"("po"."org_id", 'purchase_orders.write'::"text")))));



CREATE POLICY "po_items_select" ON "public"."crm_purchase_order_line_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."crm_purchase_orders" "po"
  WHERE (("po"."id" = "crm_purchase_order_line_items"."purchase_order_id") AND "public"."is_org_member"("po"."org_id")))));



CREATE POLICY "po_items_update" ON "public"."crm_purchase_order_line_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."crm_purchase_orders" "po"
  WHERE (("po"."id" = "crm_purchase_order_line_items"."purchase_order_id") AND "public"."is_org_member"("po"."org_id") AND "public"."has_org_permission"("po"."org_id", 'purchase_orders.write'::"text")))));



CREATE POLICY "po_select" ON "public"."crm_purchase_orders" FOR SELECT USING ("public"."is_org_member"("org_id"));



CREATE POLICY "po_update" ON "public"."crm_purchase_orders" FOR UPDATE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'purchase_orders.write'::"text")));



ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."priority_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."priority_lanes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_code_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quick_actions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quick_actions_select" ON "public"."quick_actions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."rate_calculator_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_configuration" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_configuration_admin_delete" ON "public"."rate_configuration" FOR DELETE TO "authenticated" USING ("public"."current_user_has_admin_access"());



CREATE POLICY "rate_configuration_admin_manage" ON "public"."rate_configuration" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "rate_configuration_admin_update" ON "public"."rate_configuration" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_admin_access"()) WITH CHECK ("public"."current_user_has_admin_access"());



CREATE POLICY "rate_configuration_select" ON "public"."rate_configuration" FOR SELECT USING ((("is_active" = true) OR "public"."current_user_has_admin_access"()));



ALTER TABLE "public"."report_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resource_library" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resource_library_select_policy" ON "public"."resource_library" FOR SELECT TO "authenticated", "anon" USING ((("is_published" = true) OR (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)));



ALTER TABLE "public"."resource_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roleperm_delete_owner" ON "public"."role_permissions" FOR DELETE TO "authenticated" USING ("public"."is_org_role"("org_id", 'owner'::"text"));



CREATE POLICY "roleperm_insert_owner" ON "public"."role_permissions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_org_role"("org_id", 'owner'::"text"));



CREATE POLICY "roleperm_select_member" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("org_id"));



CREATE POLICY "roleperm_update_owner" ON "public"."role_permissions" FOR UPDATE TO "authenticated" USING ("public"."is_org_role"("org_id", 'owner'::"text")) WITH CHECK ("public"."is_org_role"("org_id", 'owner'::"text"));



ALTER TABLE "public"."saved_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scoring_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_alert_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_alert_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_backlinks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_daily_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_google_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_keyword_rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_keywords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sequences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sequences_select" ON "public"."sequences" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."site_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "so_delete" ON "public"."crm_sales_orders" FOR DELETE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'sales_orders.delete'::"text")));



CREATE POLICY "so_insert" ON "public"."crm_sales_orders" FOR INSERT WITH CHECK (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'sales_orders.write'::"text")));



CREATE POLICY "so_items_delete" ON "public"."crm_sales_order_line_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."crm_sales_orders" "so"
  WHERE (("so"."id" = "crm_sales_order_line_items"."sales_order_id") AND "public"."is_org_member"("so"."org_id") AND "public"."has_org_permission"("so"."org_id", 'sales_orders.write'::"text")))));



CREATE POLICY "so_items_insert" ON "public"."crm_sales_order_line_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."crm_sales_orders" "so"
  WHERE (("so"."id" = "crm_sales_order_line_items"."sales_order_id") AND "public"."is_org_member"("so"."org_id") AND "public"."has_org_permission"("so"."org_id", 'sales_orders.write'::"text")))));



CREATE POLICY "so_items_select" ON "public"."crm_sales_order_line_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."crm_sales_orders" "so"
  WHERE (("so"."id" = "crm_sales_order_line_items"."sales_order_id") AND "public"."is_org_member"("so"."org_id")))));



CREATE POLICY "so_items_update" ON "public"."crm_sales_order_line_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."crm_sales_orders" "so"
  WHERE (("so"."id" = "crm_sales_order_line_items"."sales_order_id") AND "public"."is_org_member"("so"."org_id") AND "public"."has_org_permission"("so"."org_id", 'sales_orders.write'::"text")))));



CREATE POLICY "so_select" ON "public"."crm_sales_orders" FOR SELECT USING ("public"."is_org_member"("org_id"));



CREATE POLICY "so_update" ON "public"."crm_sales_orders" FOR UPDATE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'sales_orders.write'::"text")));



ALTER TABLE "public"."sop_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sop_categories_select" ON "public"."sop_categories" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."sop_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sop_documents_admin_all" ON "public"."sop_documents" TO "authenticated" USING (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"())) WITH CHECK (("public"."current_user_has_admin_access"() OR "public"."current_user_has_super_admin_access"()));



CREATE POLICY "sop_documents_anon_select" ON "public"."sop_documents" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "sop_documents_select" ON "public"."sop_documents" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "studio_fields_org_access" ON "public"."crm_studio_fields" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "studio_layouts_org_access" ON "public"."crm_studio_layouts" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "studio_modules_org_access" ON "public"."crm_studio_modules" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "studio_validation_org_access" ON "public"."crm_studio_validation_rules" FOR SELECT USING (("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "studio_views_org_access" ON "public"."crm_studio_views" FOR SELECT USING ((("org_id" IN ( SELECT "org_memberships"."org_id"
   FROM "public"."org_memberships"
  WHERE ("org_memberships"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) AND (("visibility" = 'org'::"text") OR ("visibility" = 'team'::"text") OR ("owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_firing_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_select" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("assigned_to" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "tasks_update" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("assigned_to" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."terminal_tool_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracking_event_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracking_platforms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tracking_platforms_select" ON "public"."tracking_platforms" FOR SELECT USING (true);



ALTER TABLE "public"."tracking_snippets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracking_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."traffic_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "training_modules_select_policy" ON "public"."training_modules" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))))));



ALTER TABLE "public"."training_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_achievements_select" ON "public"."user_achievements" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."user_navigation_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_presence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."utm_campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendors_delete" ON "public"."crm_vendors" FOR DELETE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'vendors.delete'::"text")));



CREATE POLICY "vendors_insert" ON "public"."crm_vendors" FOR INSERT WITH CHECK (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'vendors.write'::"text")));



CREATE POLICY "vendors_select" ON "public"."crm_vendors" FOR SELECT USING ("public"."is_org_member"("org_id"));



CREATE POLICY "vendors_update" ON "public"."crm_vendors" FOR UPDATE USING (("public"."is_org_member"("org_id") AND "public"."has_org_permission"("org_id", 'vendors.write'::"text")));



ALTER TABLE "public"."visit_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_delivery_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wordpress_courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "zoho_errors_authenticated_read" ON "public"."zoho_salesiq_errors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "zoho_health_authenticated_read" ON "public"."zoho_salesiq_health_checks" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."zoho_lead_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "zoho_lead_submissions_anon_select" ON "public"."zoho_lead_submissions" FOR SELECT TO "anon" USING (("created_at" > ("now"() - '00:00:05'::interval)));



ALTER TABLE "public"."zoho_salesiq_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zoho_salesiq_health_checks" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_org_invite"("invite_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_org_invite"("invite_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_org_invite"("invite_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_custom_module_column"("p_org_id" "uuid", "p_api_name" "text", "p_field_api_name" "text", "p_field_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_custom_module_column"("p_org_id" "uuid", "p_api_name" "text", "p_field_api_name" "text", "p_field_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_custom_module_column"("p_org_id" "uuid", "p_api_name" "text", "p_field_api_name" "text", "p_field_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_to_priority_lane"("p_org_id" "uuid", "p_lane_id" "uuid", "p_lead_id" "uuid", "p_reason" "text", "p_owner_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_priority_lane"("p_org_id" "uuid", "p_lane_id" "uuid", "p_lead_id" "uuid", "p_reason" "text", "p_owner_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_priority_lane"("p_org_id" "uuid", "p_lane_id" "uuid", "p_lead_id" "uuid", "p_reason" "text", "p_owner_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."aggregate_daily_analytics"("target_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."aggregate_daily_analytics"("target_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aggregate_daily_analytics"("target_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."array_append_unique"("arr" "text"[], "new_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."array_append_unique"("arr" "text"[], "new_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_append_unique"("arr" "text"[], "new_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_user_role"("target_user_id" "uuid", "target_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_user_role"("target_user_id" "uuid", "target_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_user_role"("target_user_id" "uuid", "target_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_enrollment_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_enrollment_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_enrollment_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_keyword_ranking_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_keyword_ranking_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_keyword_ranking_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_lead_score_factors"("p_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_lead_score_factors"("p_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_lead_score_factors"("p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_newsletter_metrics"("campaign_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_newsletter_metrics"("campaign_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_newsletter_metrics"("campaign_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_time_to_acknowledge"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_time_to_acknowledge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_time_to_acknowledge"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calendar_events_set_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."calendar_events_set_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calendar_events_set_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_manage_user_in_org"("check_org_id" "uuid", "target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_manage_user_in_org"("check_org_id" "uuid", "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_manage_user_in_org"("check_org_id" "uuid", "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_repeat_lead"("p_email" "text", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_repeat_lead"("p_email" "text", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_repeat_lead"("p_email" "text", "p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_page_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_page_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_page_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_security_alert_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_security_alert_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_security_alert_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_must_change_password_after_reset"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_must_change_password_after_reset"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_must_change_password_after_reset"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_priority_item"("p_item_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_priority_item"("p_item_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_priority_item"("p_item_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_custom_module_table"("p_org_id" "uuid", "p_api_name" "text", "p_fields" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_custom_module_table"("p_org_id" "uuid", "p_api_name" "text", "p_fields" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_custom_module_table"("p_org_id" "uuid", "p_api_name" "text", "p_fields" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."advisor_meetings" TO "anon";
GRANT ALL ON TABLE "public"."advisor_meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_meetings" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_instant_meeting"("p_title" "text", "p_host_id" "uuid", "p_visibility" "text", "p_advisor_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_instant_meeting"("p_title" "text", "p_host_id" "uuid", "p_visibility" "text", "p_advisor_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_instant_meeting"("p_title" "text", "p_host_id" "uuid", "p_visibility" "text", "p_advisor_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "owner_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "owner_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "owner_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."crm_global_search"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."crm_global_search"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."crm_global_search"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_admin_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_admin_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_admin_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_advisor_command_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_advisor_command_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_advisor_command_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_advisor_or_admin_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_advisor_or_admin_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_advisor_or_admin_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_extended_admin_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_extended_admin_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_extended_admin_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_super_admin_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_super_admin_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_super_admin_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_org_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_org_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_token"("encrypted" "bytea", "key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_token"("encrypted" "bytea", "key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_token"("encrypted" "bytea", "key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."drop_custom_module_table"("p_org_id" "uuid", "p_api_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."drop_custom_module_table"("p_org_id" "uuid", "p_api_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."drop_custom_module_table"("p_org_id" "uuid", "p_api_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_token"("token" "text", "key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_token"("token" "text", "key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_token"("token" "text", "key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."end_advisor_meeting"("p_meeting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."end_advisor_meeting"("p_meeting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."end_advisor_meeting"("p_meeting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."enroll_advisor_in_course"("p_advisor_id" "uuid", "p_course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."enroll_advisor_in_course"("p_advisor_id" "uuid", "p_course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enroll_advisor_in_course"("p_advisor_id" "uuid", "p_course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_advisor_profile_on_role_grant"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_advisor_profile_on_role_grant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_advisor_profile_on_role_grant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fan_out_chat_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."fan_out_chat_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fan_out_chat_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_case_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_case_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_case_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_health_quote_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_health_quote_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_health_quote_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_meeting_room_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_meeting_room_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_meeting_room_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_module_permissions"("p_module_api_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_module_permissions"("p_module_api_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_module_permissions"("p_module_api_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_quote_number"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_quote_number"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_quote_number"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_so_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_so_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_so_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_tracking_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_tracking_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_tracking_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_advisor_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_advisor_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_advisor_emails"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_advisor_meeting"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_advisor_meeting"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_advisor_meeting"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_activity_feed"("p_user_id" "uuid", "p_org_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_activity_feed"("p_user_id" "uuid", "p_org_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_activity_feed"("p_user_id" "uuid", "p_org_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_advisor_hierarchy_tree"("root_advisor_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_advisor_hierarchy_tree"("root_advisor_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_advisor_hierarchy_tree"("root_advisor_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_users_with_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_users_with_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_users_with_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_automation_stats"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_automation_stats"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_automation_stats"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_health_plans"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_health_plans"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_health_plans"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_chat_unread_counts"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_chat_unread_counts"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_chat_unread_counts"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_custom_module_table_name"("p_org_id" "uuid", "p_api_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_custom_module_table_name"("p_org_id" "uuid", "p_api_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_custom_module_table_name"("p_org_id" "uuid", "p_api_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_downline_advisor_ids"("root_advisor_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_downline_advisor_ids"("root_advisor_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_downline_advisor_ids"("root_advisor_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_email_tracking_stats"("p_email_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_tracking_stats"("p_email_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_tracking_stats"("p_email_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtered_leads"("p_stage" "text", "p_priority" "text", "p_assigned_to" "uuid", "p_search" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtered_leads"("p_stage" "text", "p_priority" "text", "p_assigned_to" "uuid", "p_search" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtered_leads"("p_stage" "text", "p_priority" "text", "p_assigned_to" "uuid", "p_search" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_hierarchy_stats"("root_advisor_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_hierarchy_stats"("root_advisor_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hierarchy_stats"("root_advisor_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_highest_role"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_highest_role"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_highest_role"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lead_health_quotes"("p_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_lead_health_quotes"("p_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lead_health_quotes"("p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lead_notification_stats"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lead_notification_stats"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lead_notification_stats"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lead_plan_interests"("p_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_lead_plan_interests"("p_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lead_plan_interests"("p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lead_with_insights"("p_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_lead_with_insights"("p_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lead_with_insights"("p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_period" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_period" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_period" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_metric" "text", "p_period" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_metric" "text", "p_period" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_org_id" "uuid", "p_metric" "text", "p_period" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_meeting_with_stats"("p_meeting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_meeting_with_stats"("p_meeting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_meeting_with_stats"("p_meeting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_metric_timeseries"("p_metric_name" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_granularity" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_metric_timeseries"("p_metric_name" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_granularity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_metric_timeseries"("p_metric_name" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_granularity" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_notification_events_unread_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_notification_events_unread_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notification_events_unread_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_email_thread"("p_org_id" "uuid", "p_subject" "text", "p_lead_id" "uuid", "p_participants" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_email_thread"("p_org_id" "uuid", "p_subject" "text", "p_lead_id" "uuid", "p_participants" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_email_thread"("p_org_id" "uuid", "p_subject" "text", "p_lead_id" "uuid", "p_participants" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_notification_settings"("p_user_id" "uuid", "p_org_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_notification_settings"("p_user_id" "uuid", "p_org_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_notification_settings"("p_user_id" "uuid", "p_org_id" "text") TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_user_preferences"("p_user_id" "uuid", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_user_preferences"("p_user_id" "uuid", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_user_preferences"("p_user_id" "uuid", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_plan_rate"("p_plan_slug" "text", "p_age" integer, "p_member_type" "text", "p_iua_amount" numeric, "p_effective_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_plan_rate"("p_plan_slug" "text", "p_age" integer, "p_member_type" "text", "p_iua_amount" numeric, "p_effective_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_plan_rate"("p_plan_slug" "text", "p_age" integer, "p_member_type" "text", "p_iua_amount" numeric, "p_effective_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_plan_resource_by_slug"("p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_plan_resource_by_slug"("p_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_plan_resource_by_slug"("p_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_power_list"("p_org_id" "uuid", "p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_power_list"("p_org_id" "uuid", "p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_power_list"("p_org_id" "uuid", "p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_searches"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_searches"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_searches"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trending_keywords"("p_site_url" "text", "p_days" integer, "p_limit" integer, "p_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_trending_keywords"("p_site_url" "text", "p_days" integer, "p_limit" integer, "p_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trending_keywords"("p_site_url" "text", "p_days" integer, "p_limit" integer, "p_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_user_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_user_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_user_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_upcoming_advisor_meetings"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_upcoming_advisor_meetings"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_upcoming_advisor_meetings"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_upcoming_events"("p_user_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_upcoming_events"("p_user_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_upcoming_events"("p_user_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_compliance_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_compliance_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_compliance_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_ids"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_ids"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_ids"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_role"("check_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_role"("check_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_role"("check_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_primary_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_primary_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_primary_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_with_roles"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_with_roles"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_with_roles"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_accounts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_accounts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_accounts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_activities_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_activities_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_activities_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_campaigns_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_campaigns_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_campaigns_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_case_comments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_case_comments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_case_comments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_cases_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_cases_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_cases_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_contacts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_contacts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_contacts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_deal_products_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_deal_products_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_deal_products_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_deal_stages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_deal_stages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_deal_stages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_deals_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_deals_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_deals_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_documents_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_documents_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_documents_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_forecast_entries_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_forecast_entries_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_forecast_entries_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_forecasts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_forecasts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_forecasts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_invoice_line_items_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_invoice_line_items_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_invoice_line_items_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_invoices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_invoices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_invoices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_price_book_items_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_price_book_items_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_price_book_items_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_price_books_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_price_books_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_price_books_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_products_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_products_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_products_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_quote_line_items_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_quote_line_items_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_quote_line_items_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_quotes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_quotes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_quotes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_crm_saved_views_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_crm_saved_views_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_crm_saved_views_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_deal_stage_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_deal_stage_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_deal_stage_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_invoice_payment"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_invoice_payment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_invoice_payment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_org_memberships_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_org_memberships_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_org_memberships_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_orgs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_orgs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_orgs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_plans_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_plans_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_plans_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_quote_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_quote_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_quote_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_org_permission"("p_org_id" "uuid", "p_permission_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_org_permission"("p_org_id" "uuid", "p_permission_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_org_permission"("p_org_id" "uuid", "p_permission_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("check_user_id" "uuid", "check_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("check_user_id" "uuid", "check_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("check_user_id" "uuid", "check_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_advisor_content_view_count"("content_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_advisor_content_view_count"("content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_advisor_content_view_count"("content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_email_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_email_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_email_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_message_template_times_used"("template_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_message_template_times_used"("template_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_message_template_times_used"("template_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_promo_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_promo_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_promo_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_saved_search_use_count"("search_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_saved_search_use_count"("search_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_saved_search_use_count"("search_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_times_used"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_times_used"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_times_used"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_use_count"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_use_count"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_use_count"("p_table" "text", "p_id_col" "text", "p_record_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_advisors_to_meeting"("p_meeting_id" "uuid", "p_advisor_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."invite_advisors_to_meeting"("p_meeting_id" "uuid", "p_advisor_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_advisors_to_meeting"("p_meeting_id" "uuid", "p_advisor_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_all_advisors_to_meeting"("p_meeting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_all_advisors_to_meeting"("p_meeting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_all_advisors_to_meeting"("p_meeting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_role"("p_org_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_role"("p_org_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_role"("p_org_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_document_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_chat_conversation_read"("p_user_id" "uuid", "p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_chat_conversation_read"("p_user_id" "uuid", "p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_chat_conversation_read"("p_user_id" "uuid", "p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."move_priority_item"("p_item_id" "uuid", "p_new_lane_id" "uuid", "p_new_rank" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."move_priority_item"("p_item_id" "uuid", "p_new_lane_id" "uuid", "p_new_rank" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_priority_item"("p_item_id" "uuid", "p_new_lane_id" "uuid", "p_new_rank" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_deal_amount"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_deal_amount"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_deal_amount"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_invoice_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_invoice_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_invoice_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_quote_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_quote_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_quote_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_user_role"("target_user_id" "uuid", "target_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_user_role"("target_user_id" "uuid", "target_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_user_role"("target_user_id" "uuid", "target_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."render_email_signature"("p_signature_id" "uuid", "p_override_vars" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."render_email_signature"("p_signature_id" "uuid", "p_override_vars" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."render_email_signature"("p_signature_id" "uuid", "p_override_vars" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."meeting_invitations" TO "anon";
GRANT ALL ON TABLE "public"."meeting_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_invitations" TO "service_role";



GRANT ALL ON FUNCTION "public"."respond_to_meeting_invitation"("p_invitation_id" "uuid", "p_response" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."respond_to_meeting_invitation"("p_invitation_id" "uuid", "p_response" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_meeting_invitation"("p_invitation_id" "uuid", "p_response" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid", "p_widgets" "jsonb", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."save_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid", "p_widgets" "jsonb", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_dashboard_layout"("p_user_id" "uuid", "p_org_id" "uuid", "p_widgets" "jsonb", "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_chat_messages"("p_user_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_chat_messages"("p_user_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_chat_messages"("p_user_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON TABLE "public"."crm_accounts" TO "anon";
GRANT ALL ON TABLE "public"."crm_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_accounts" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_crm_accounts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_crm_accounts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_crm_accounts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON TABLE "public"."crm_contacts" TO "anon";
GRANT ALL ON TABLE "public"."crm_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_contacts" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_crm_contacts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_crm_contacts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_crm_contacts"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON TABLE "public"."crm_deals" TO "anon";
GRANT ALL ON TABLE "public"."crm_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_deals" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_crm_deals"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_crm_deals"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_crm_deals"("p_org_id" "uuid", "p_query" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_users_with_roles"("search_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_users_with_roles"("search_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users_with_roles"("search_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_catherine_superadmin_profile"("user_email" "text", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_catherine_superadmin_profile"("user_email" "text", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_catherine_superadmin_profile"("user_email" "text", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_superadmin_profile"("user_email" "text", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_superadmin_profile"("user_email" "text", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_superadmin_profile"("user_email" "text", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_test_advisor_profile"("user_email" "text", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_test_advisor_profile"("user_email" "text", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_test_advisor_profile"("user_email" "text", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."share_note_with_role"("p_note_id" "uuid", "p_target_role" "text", "p_permission_level" "text", "p_share_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."share_note_with_role"("p_note_id" "uuid", "p_target_role" "text", "p_permission_level" "text", "p_share_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."share_note_with_role"("p_note_id" "uuid", "p_target_role" "text", "p_permission_level" "text", "p_share_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."snooze_priority_item"("p_item_id" "uuid", "p_until" timestamp with time zone, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."snooze_priority_item"("p_item_id" "uuid", "p_until" timestamp with time zone, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."snooze_priority_item"("p_item_id" "uuid", "p_until" timestamp with time zone, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_advisor_meeting"("p_meeting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_advisor_meeting"("p_meeting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_advisor_meeting"("p_meeting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_bulletin_notification"("p_bulletin_id" "uuid", "p_sent_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_bulletin_notification"("p_bulletin_id" "uuid", "p_sent_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_bulletin_notification"("p_bulletin_id" "uuid", "p_sent_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_admin_users_role_to_user_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_admin_users_role_to_user_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_admin_users_role_to_user_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_advisor_profile_to_itsts"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_advisor_profile_to_itsts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_advisor_profile_to_itsts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_roles_to_legacy"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_roles_to_legacy"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_roles_to_legacy"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_to_itsts"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_to_itsts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_to_itsts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_calculate_lead_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_calculate_lead_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_calculate_lead_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_advisor_access_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_advisor_access_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_advisor_access_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_advisor_enrollment_links_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_advisor_enrollment_links_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_advisor_enrollment_links_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_advisor_plan_resources_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_advisor_plan_resources_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_advisor_plan_resources_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_advisor_portal_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_advisor_portal_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_advisor_portal_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_advisor_videos_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_advisor_videos_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_advisor_videos_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assignments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assignments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assignments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bulletin_notification_status"("p_notification_id" "uuid", "p_status" "text", "p_successful" integer, "p_failed" integer, "p_error_message" "text", "p_resend_batch_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_bulletin_notification_status"("p_notification_id" "uuid", "p_status" "text", "p_successful" integer, "p_failed" integer, "p_error_message" "text", "p_resend_batch_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bulletin_notification_status"("p_notification_id" "uuid", "p_status" "text", "p_successful" integer, "p_failed" integer, "p_error_message" "text", "p_resend_batch_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_campaign_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_campaign_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_campaign_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_campaign_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_campaign_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_campaign_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chat_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_chat_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chat_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chat_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_chat_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chat_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cognito_forms_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cognito_forms_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cognito_forms_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_accounts_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_accounts_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_accounts_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_contacts_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_contacts_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_contacts_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_deals_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_deals_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_deals_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_plan_interest_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_plan_interest_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_plan_interest_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_products_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_products_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_products_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crm_web_forms_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crm_web_forms_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crm_web_forms_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_email_signature_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_email_signature_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_email_signature_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_enrollments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_enrollments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_enrollments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_goal_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_goal_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_goal_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_handbooks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_handbooks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_handbooks_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lead_stage_changed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lead_stage_changed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lead_stage_changed_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lead_task_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lead_task_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lead_task_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_mail_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_mail_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_mail_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meeting_invitation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meeting_invitation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meeting_invitation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meeting_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meeting_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meeting_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_newsletter_subscribers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_newsletter_subscribers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_newsletter_subscribers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_onboarding_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_onboarding_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_onboarding_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_outlook_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_outlook_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_outlook_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_routing_rules_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_routing_rules_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_routing_rules_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_schedule_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_schedule_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_schedule_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_security_webhook_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_security_webhook_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_security_webhook_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_on_page_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_on_page_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_on_page_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sop_documents_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sop_documents_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sop_documents_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_thread_on_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_thread_on_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_thread_on_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_presence"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_presence"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_presence"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_roles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_roles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_roles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_zoho_lead_submission_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_zoho_lead_submission_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_zoho_lead_submission_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_org_access"("check_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_org_access"("check_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_org_access"("check_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_org_role"("check_org_id" "uuid", "allowed_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_org_role"("check_org_id" "uuid", "allowed_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_org_role"("check_org_id" "uuid", "allowed_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_org_manager_or_above"("check_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_org_manager_or_above"("check_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_org_manager_or_above"("check_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_org_owner_or_admin"("check_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_org_owner_or_admin"("check_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_org_owner_or_admin"("check_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_org_role"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_org_role"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_org_role"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_organization_roles_delete_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_organization_roles_delete_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_organization_roles_delete_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_organization_roles_insert_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_organization_roles_insert_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_organization_roles_insert_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_organization_roles_update_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_organization_roles_update_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_organization_roles_update_trigger"() TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."active_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."admin_resources" TO "anon";
GRANT ALL ON TABLE "public"."admin_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_resources" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_access" TO "anon";
GRANT ALL ON TABLE "public"."advisor_access" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_access" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_announcements" TO "anon";
GRANT ALL ON TABLE "public"."advisor_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_categories" TO "anon";
GRANT ALL ON TABLE "public"."advisor_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_categories" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_contact_directory" TO "anon";
GRANT ALL ON TABLE "public"."advisor_contact_directory" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_contact_directory" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_content" TO "anon";
GRANT ALL ON TABLE "public"."advisor_content" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_content" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_content_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."advisor_content_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_content_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_content_categories" TO "anon";
GRANT ALL ON TABLE "public"."advisor_content_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_content_categories" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_content_views" TO "anon";
GRANT ALL ON TABLE "public"."advisor_content_views" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_content_views" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_dashboard_widgets" TO "anon";
GRANT ALL ON TABLE "public"."advisor_dashboard_widgets" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_dashboard_widgets" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_enrollment_links" TO "anon";
GRANT ALL ON TABLE "public"."advisor_enrollment_links" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_enrollment_links" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_external_training_progress" TO "anon";
GRANT ALL ON TABLE "public"."advisor_external_training_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_external_training_progress" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_learning_paths" TO "anon";
GRANT ALL ON TABLE "public"."advisor_learning_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_learning_paths" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_lesson_completions" TO "anon";
GRANT ALL ON TABLE "public"."advisor_lesson_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_lesson_completions" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_lms_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."advisor_lms_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_lms_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_meeting_attendees" TO "anon";
GRANT ALL ON TABLE "public"."advisor_meeting_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_meeting_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_meeting_reminders" TO "anon";
GRANT ALL ON TABLE "public"."advisor_meeting_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_meeting_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_nav_menu" TO "anon";
GRANT ALL ON TABLE "public"."advisor_nav_menu" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_nav_menu" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_plan_resources" TO "anon";
GRANT ALL ON TABLE "public"."advisor_plan_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_plan_resources" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_portal_settings" TO "anon";
GRANT ALL ON TABLE "public"."advisor_portal_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_portal_settings" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_profiles" TO "anon";
GRANT ALL ON TABLE "public"."advisor_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_quick_links" TO "anon";
GRANT ALL ON TABLE "public"."advisor_quick_links" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_quick_links" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_terminal_commands" TO "anon";
GRANT ALL ON TABLE "public"."advisor_terminal_commands" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_terminal_commands" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_terminal_sessions" TO "anon";
GRANT ALL ON TABLE "public"."advisor_terminal_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_terminal_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."training_modules" TO "anon";
GRANT ALL ON TABLE "public"."training_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."training_modules" TO "service_role";



GRANT ALL ON TABLE "public"."training_progress" TO "anon";
GRANT ALL ON TABLE "public"."training_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."training_progress" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_training_completion" TO "anon";
GRANT ALL ON TABLE "public"."advisor_training_completion" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_training_completion" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_videos" TO "anon";
GRANT ALL ON TABLE "public"."advisor_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_videos" TO "service_role";



GRANT ALL ON TABLE "public"."advisors" TO "anon";
GRANT ALL ON TABLE "public"."advisors" TO "authenticated";
GRANT ALL ON TABLE "public"."advisors" TO "service_role";



GRANT ALL ON TABLE "public"."ai_automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."ai_automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_automation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."ai_lead_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_lead_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_lead_insights" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_experiments" TO "anon";
GRANT ALL ON TABLE "public"."analytics_experiments" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_experiments" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_sessions" TO "anon";
GRANT ALL ON TABLE "public"."analytics_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."approved_links" TO "anon";
GRANT ALL ON TABLE "public"."approved_links" TO "authenticated";
GRANT ALL ON TABLE "public"."approved_links" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_events" TO "anon";
GRANT ALL ON TABLE "public"."audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."automation_execution_log" TO "anon";
GRANT ALL ON TABLE "public"."automation_execution_log" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_execution_log" TO "service_role";



GRANT ALL ON TABLE "public"."automation_templates" TO "anon";
GRANT ALL ON TABLE "public"."automation_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_templates" TO "service_role";



GRANT ALL ON TABLE "public"."benefit_usage" TO "anon";
GRANT ALL ON TABLE "public"."benefit_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."benefit_usage" TO "service_role";



GRANT ALL ON TABLE "public"."benefits" TO "anon";
GRANT ALL ON TABLE "public"."benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."benefits" TO "service_role";



GRANT ALL ON TABLE "public"."blog_articles" TO "anon";
GRANT ALL ON TABLE "public"."blog_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_articles" TO "service_role";



GRANT ALL ON TABLE "public"."blog_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_generation_logs" TO "anon";
GRANT ALL ON TABLE "public"."blog_generation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_generation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bulletin_email_notifications" TO "anon";
GRANT ALL ON TABLE "public"."bulletin_email_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."bulletin_email_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."bulletin_email_recipients" TO "anon";
GRANT ALL ON TABLE "public"."bulletin_email_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."bulletin_email_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."certifications" TO "anon";
GRANT ALL ON TABLE "public"."certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."certifications" TO "service_role";



GRANT ALL ON TABLE "public"."chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."chat_members" TO "anon";
GRANT ALL ON TABLE "public"."chat_members" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_members" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."claim_items" TO "anon";
GRANT ALL ON TABLE "public"."claim_items" TO "authenticated";
GRANT ALL ON TABLE "public"."claim_items" TO "service_role";



GRANT ALL ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT ALL ON TABLE "public"."claims" TO "service_role";



GRANT ALL ON TABLE "public"."code_batches" TO "anon";
GRANT ALL ON TABLE "public"."code_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."code_batches" TO "service_role";



GRANT ALL ON TABLE "public"."code_inventory" TO "anon";
GRANT ALL ON TABLE "public"."code_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."code_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."cognito_forms" TO "anon";
GRANT ALL ON TABLE "public"."cognito_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."cognito_forms" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_acknowledgments" TO "anon";
GRANT ALL ON TABLE "public"."compliance_acknowledgments" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_acknowledgments" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_documents" TO "anon";
GRANT ALL ON TABLE "public"."compliance_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_documents" TO "service_role";



GRANT ALL ON TABLE "public"."content_analytics" TO "anon";
GRANT ALL ON TABLE "public"."content_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."content_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."conversion_events" TO "anon";
GRANT ALL ON TABLE "public"."conversion_events" TO "authenticated";
GRANT ALL ON TABLE "public"."conversion_events" TO "service_role";



GRANT ALL ON TABLE "public"."wordpress_courses" TO "anon";
GRANT ALL ON TABLE "public"."wordpress_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."wordpress_courses" TO "service_role";



GRANT ALL ON TABLE "public"."course_catalog" TO "anon";
GRANT ALL ON TABLE "public"."course_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."course_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."coverage_documents" TO "anon";
GRANT ALL ON TABLE "public"."coverage_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."coverage_documents" TO "service_role";



GRANT ALL ON TABLE "public"."crm_activities" TO "anon";
GRANT ALL ON TABLE "public"."crm_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_activities" TO "service_role";



GRANT ALL ON TABLE "public"."crm_approval_actions" TO "anon";
GRANT ALL ON TABLE "public"."crm_approval_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_approval_actions" TO "service_role";



GRANT ALL ON TABLE "public"."crm_approval_processes" TO "anon";
GRANT ALL ON TABLE "public"."crm_approval_processes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_approval_processes" TO "service_role";



GRANT ALL ON TABLE "public"."crm_approval_requests" TO "anon";
GRANT ALL ON TABLE "public"."crm_approval_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_approval_requests" TO "service_role";



GRANT ALL ON TABLE "public"."crm_approval_steps" TO "anon";
GRANT ALL ON TABLE "public"."crm_approval_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_approval_steps" TO "service_role";



GRANT ALL ON TABLE "public"."crm_calendar_integrations" TO "anon";
GRANT ALL ON TABLE "public"."crm_calendar_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_calendar_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."crm_campaign_members" TO "anon";
GRANT ALL ON TABLE "public"."crm_campaign_members" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_campaign_members" TO "service_role";



GRANT ALL ON TABLE "public"."crm_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."crm_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."crm_case_comments" TO "anon";
GRANT ALL ON TABLE "public"."crm_case_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_case_comments" TO "service_role";



GRANT ALL ON TABLE "public"."crm_cases" TO "anon";
GRANT ALL ON TABLE "public"."crm_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_cases" TO "service_role";



GRANT ALL ON TABLE "public"."crm_dashboard_layouts" TO "anon";
GRANT ALL ON TABLE "public"."crm_dashboard_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_dashboard_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."crm_dashboard_notes" TO "anon";
GRANT ALL ON TABLE "public"."crm_dashboard_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_dashboard_notes" TO "service_role";



GRANT ALL ON TABLE "public"."crm_deal_contacts" TO "anon";
GRANT ALL ON TABLE "public"."crm_deal_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_deal_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."crm_deal_products" TO "anon";
GRANT ALL ON TABLE "public"."crm_deal_products" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_deal_products" TO "service_role";



GRANT ALL ON TABLE "public"."crm_deal_stage_history" TO "anon";
GRANT ALL ON TABLE "public"."crm_deal_stage_history" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_deal_stage_history" TO "service_role";



GRANT ALL ON TABLE "public"."crm_deal_stages" TO "anon";
GRANT ALL ON TABLE "public"."crm_deal_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_deal_stages" TO "service_role";



GRANT ALL ON TABLE "public"."crm_deal_stage_metrics" TO "anon";
GRANT ALL ON TABLE "public"."crm_deal_stage_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_deal_stage_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."crm_default_layout_templates" TO "anon";
GRANT ALL ON TABLE "public"."crm_default_layout_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_default_layout_templates" TO "service_role";



GRANT ALL ON TABLE "public"."crm_documents" TO "anon";
GRANT ALL ON TABLE "public"."crm_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_documents" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_attachments" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_drafts" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_log" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_log" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_log" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_routing_rules" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_routing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_routing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_sequence_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_sequence_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_sequence_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_sequence_steps" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_sequence_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_sequence_steps" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_sequences" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_signatures" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_threads" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_threads" TO "service_role";



GRANT ALL ON TABLE "public"."crm_email_tracking" TO "anon";
GRANT ALL ON TABLE "public"."crm_email_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_email_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."crm_forecast_entries" TO "anon";
GRANT ALL ON TABLE "public"."crm_forecast_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_forecast_entries" TO "service_role";



GRANT ALL ON TABLE "public"."crm_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."crm_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_forecasts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."crm_health_quote_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."crm_health_quote_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."crm_health_quote_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."crm_invoice_line_items" TO "anon";
GRANT ALL ON TABLE "public"."crm_invoice_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_invoice_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."crm_invoice_payments" TO "anon";
GRANT ALL ON TABLE "public"."crm_invoice_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_invoice_payments" TO "service_role";



GRANT ALL ON TABLE "public"."crm_invoices" TO "anon";
GRANT ALL ON TABLE "public"."crm_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."crm_lead_health_quotes" TO "anon";
GRANT ALL ON TABLE "public"."crm_lead_health_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_lead_health_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."crm_lead_plan_interests" TO "anon";
GRANT ALL ON TABLE "public"."crm_lead_plan_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_lead_plan_interests" TO "service_role";



GRANT ALL ON TABLE "public"."crm_meeting_bookings" TO "anon";
GRANT ALL ON TABLE "public"."crm_meeting_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_meeting_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."crm_meeting_schedules" TO "anon";
GRANT ALL ON TABLE "public"."crm_meeting_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_meeting_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."crm_pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."crm_pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."crm_price_book_items" TO "anon";
GRANT ALL ON TABLE "public"."crm_price_book_items" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_price_book_items" TO "service_role";



GRANT ALL ON TABLE "public"."crm_price_books" TO "anon";
GRANT ALL ON TABLE "public"."crm_price_books" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_price_books" TO "service_role";



GRANT ALL ON TABLE "public"."crm_products" TO "anon";
GRANT ALL ON TABLE "public"."crm_products" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_products" TO "service_role";



GRANT ALL ON TABLE "public"."crm_purchase_order_line_items" TO "anon";
GRANT ALL ON TABLE "public"."crm_purchase_order_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_purchase_order_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."crm_purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."crm_purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."crm_quote_line_items" TO "anon";
GRANT ALL ON TABLE "public"."crm_quote_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_quote_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."crm_quotes" TO "anon";
GRANT ALL ON TABLE "public"."crm_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."crm_sales_order_line_items" TO "anon";
GRANT ALL ON TABLE "public"."crm_sales_order_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_sales_order_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."crm_sales_orders" TO "anon";
GRANT ALL ON TABLE "public"."crm_sales_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_sales_orders" TO "service_role";



GRANT ALL ON TABLE "public"."crm_saved_views" TO "anon";
GRANT ALL ON TABLE "public"."crm_saved_views" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_saved_views" TO "service_role";



GRANT ALL ON TABLE "public"."crm_studio_fields" TO "anon";
GRANT ALL ON TABLE "public"."crm_studio_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_studio_fields" TO "service_role";



GRANT ALL ON TABLE "public"."crm_studio_layouts" TO "anon";
GRANT ALL ON TABLE "public"."crm_studio_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_studio_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."crm_studio_modules" TO "anon";
GRANT ALL ON TABLE "public"."crm_studio_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_studio_modules" TO "service_role";



GRANT ALL ON TABLE "public"."crm_studio_validation_rules" TO "anon";
GRANT ALL ON TABLE "public"."crm_studio_validation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_studio_validation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."crm_studio_views" TO "anon";
GRANT ALL ON TABLE "public"."crm_studio_views" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_studio_views" TO "service_role";



GRANT ALL ON TABLE "public"."crm_template_folders" TO "anon";
GRANT ALL ON TABLE "public"."crm_template_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_template_folders" TO "service_role";



GRANT ALL ON TABLE "public"."crm_templates" TO "anon";
GRANT ALL ON TABLE "public"."crm_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_templates" TO "service_role";



GRANT ALL ON TABLE "public"."crm_user_goals" TO "anon";
GRANT ALL ON TABLE "public"."crm_user_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_user_goals" TO "service_role";



GRANT ALL ON TABLE "public"."crm_vendors" TO "anon";
GRANT ALL ON TABLE "public"."crm_vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_vendors" TO "service_role";



GRANT ALL ON TABLE "public"."crm_web_form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."crm_web_form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_web_form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."crm_web_forms" TO "anon";
GRANT ALL ON TABLE "public"."crm_web_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_web_forms" TO "service_role";



GRANT ALL ON TABLE "public"."crm_website_quote_sync" TO "anon";
GRANT ALL ON TABLE "public"."crm_website_quote_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_website_quote_sync" TO "service_role";



GRANT ALL ON TABLE "public"."daily_analytics_summary" TO "anon";
GRANT ALL ON TABLE "public"."daily_analytics_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_analytics_summary" TO "service_role";



GRANT ALL ON TABLE "public"."device_push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."device_push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."device_push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."document_access_log" TO "anon";
GRANT ALL ON TABLE "public"."document_access_log" TO "authenticated";
GRANT ALL ON TABLE "public"."document_access_log" TO "service_role";



GRANT ALL ON TABLE "public"."educational_content" TO "anon";
GRANT ALL ON TABLE "public"."educational_content" TO "authenticated";
GRANT ALL ON TABLE "public"."educational_content" TO "service_role";



GRANT ALL ON TABLE "public"."email_schedules" TO "anon";
GRANT ALL ON TABLE "public"."email_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."email_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."email_tracking" TO "anon";
GRANT ALL ON TABLE "public"."email_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."email_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."enrollment_intent" TO "anon";
GRANT ALL ON TABLE "public"."enrollment_intent" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollment_intent" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."esignature_documents" TO "anon";
GRANT ALL ON TABLE "public"."esignature_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."esignature_documents" TO "service_role";



GRANT ALL ON TABLE "public"."esignature_providers" TO "anon";
GRANT ALL ON TABLE "public"."esignature_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."esignature_providers" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."external_lms_courses" TO "anon";
GRANT ALL ON TABLE "public"."external_lms_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."external_lms_courses" TO "service_role";



GRANT ALL ON TABLE "public"."external_lms_lessons" TO "anon";
GRANT ALL ON TABLE "public"."external_lms_lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."external_lms_lessons" TO "service_role";



GRANT ALL ON TABLE "public"."faq_items" TO "anon";
GRANT ALL ON TABLE "public"."faq_items" TO "authenticated";
GRANT ALL ON TABLE "public"."faq_items" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."gemini_prompts" TO "anon";
GRANT ALL ON TABLE "public"."gemini_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."gemini_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."geo_state_settings" TO "anon";
GRANT ALL ON TABLE "public"."geo_state_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."geo_state_settings" TO "service_role";



GRANT ALL ON TABLE "public"."handbooks" TO "anon";
GRANT ALL ON TABLE "public"."handbooks" TO "authenticated";
GRANT ALL ON TABLE "public"."handbooks" TO "service_role";



GRANT ALL ON TABLE "public"."health_history" TO "anon";
GRANT ALL ON TABLE "public"."health_history" TO "authenticated";
GRANT ALL ON TABLE "public"."health_history" TO "service_role";



GRANT ALL ON TABLE "public"."healthcare_plan_categories" TO "anon";
GRANT ALL ON TABLE "public"."healthcare_plan_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."healthcare_plan_categories" TO "service_role";



GRANT ALL ON TABLE "public"."immunizations" TO "anon";
GRANT ALL ON TABLE "public"."immunizations" TO "authenticated";
GRANT ALL ON TABLE "public"."immunizations" TO "service_role";



GRANT ALL ON TABLE "public"."integration_health" TO "anon";
GRANT ALL ON TABLE "public"."integration_health" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_health" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_logs" TO "anon";
GRANT ALL ON TABLE "public"."interaction_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_logs" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."lab_results" TO "anon";
GRANT ALL ON TABLE "public"."lab_results" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_results" TO "service_role";



GRANT ALL ON TABLE "public"."lead_activities" TO "anon";
GRANT ALL ON TABLE "public"."lead_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_activities" TO "service_role";



GRANT ALL ON TABLE "public"."lead_notifications" TO "anon";
GRANT ALL ON TABLE "public"."lead_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."lead_routing_logs" TO "anon";
GRANT ALL ON TABLE "public"."lead_routing_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_routing_logs" TO "service_role";



GRANT ALL ON TABLE "public"."lead_scoring_config" TO "anon";
GRANT ALL ON TABLE "public"."lead_scoring_config" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_scoring_config" TO "service_role";



GRANT ALL ON TABLE "public"."lead_submissions" TO "anon";
GRANT ALL ON TABLE "public"."lead_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."lead_tasks" TO "anon";
GRANT ALL ON TABLE "public"."lead_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."mail_accounts" TO "anon";
GRANT ALL ON TABLE "public"."mail_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."mail_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."mail_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."mail_domains" TO "anon";
GRANT ALL ON TABLE "public"."mail_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_domains" TO "service_role";



GRANT ALL ON TABLE "public"."mail_folders" TO "anon";
GRANT ALL ON TABLE "public"."mail_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_folders" TO "service_role";



GRANT ALL ON TABLE "public"."mail_message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."mail_message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_message_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."mail_messages" TO "anon";
GRANT ALL ON TABLE "public"."mail_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_messages" TO "service_role";



GRANT ALL ON TABLE "public"."mail_rules" TO "anon";
GRANT ALL ON TABLE "public"."mail_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_rules" TO "service_role";



GRANT ALL ON TABLE "public"."mail_sender_identities" TO "anon";
GRANT ALL ON TABLE "public"."mail_sender_identities" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_sender_identities" TO "service_role";



GRANT ALL ON TABLE "public"."mail_shared_access" TO "anon";
GRANT ALL ON TABLE "public"."mail_shared_access" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_shared_access" TO "service_role";



GRANT ALL ON TABLE "public"."mail_sync_jobs" TO "anon";
GRANT ALL ON TABLE "public"."mail_sync_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."mail_sync_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."maternity_coverage" TO "anon";
GRANT ALL ON TABLE "public"."maternity_coverage" TO "authenticated";
GRANT ALL ON TABLE "public"."maternity_coverage" TO "service_role";



GRANT ALL ON TABLE "public"."maternity_coverage_stages" TO "anon";
GRANT ALL ON TABLE "public"."maternity_coverage_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."maternity_coverage_stages" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_attendees" TO "anon";
GRANT ALL ON TABLE "public"."meeting_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_templates" TO "anon";
GRANT ALL ON TABLE "public"."meeting_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_templates" TO "service_role";



GRANT ALL ON TABLE "public"."member_coverage" TO "anon";
GRANT ALL ON TABLE "public"."member_coverage" TO "authenticated";
GRANT ALL ON TABLE "public"."member_coverage" TO "service_role";



GRANT ALL ON TABLE "public"."member_dependents" TO "anon";
GRANT ALL ON TABLE "public"."member_dependents" TO "authenticated";
GRANT ALL ON TABLE "public"."member_dependents" TO "service_role";



GRANT ALL ON TABLE "public"."member_documents" TO "anon";
GRANT ALL ON TABLE "public"."member_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."member_documents" TO "service_role";



GRANT ALL ON TABLE "public"."member_notifications" TO "anon";
GRANT ALL ON TABLE "public"."member_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."member_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."member_profiles" TO "anon";
GRANT ALL ON TABLE "public"."member_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."member_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."navigation_analytics" TO "anon";
GRANT ALL ON TABLE "public"."navigation_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."navigation_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."navigation_items" TO "anon";
GRANT ALL ON TABLE "public"."navigation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."navigation_items" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_queue" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_queue" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."note_notifications" TO "anon";
GRANT ALL ON TABLE "public"."note_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."note_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."note_shares" TO "anon";
GRANT ALL ON TABLE "public"."note_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."note_shares" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notification_events" TO "anon";
GRANT ALL ON TABLE "public"."notification_events" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_events" TO "service_role";



GRANT ALL ON TABLE "public"."notification_log" TO "anon";
GRANT ALL ON TABLE "public"."notification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_log" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_progress" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_progress" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_responses" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_responses" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_steps" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_steps" TO "service_role";



GRANT ALL ON TABLE "public"."org_invites" TO "anon";
GRANT ALL ON TABLE "public"."org_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."org_invites" TO "service_role";



GRANT ALL ON TABLE "public"."org_memberships" TO "anon";
GRANT ALL ON TABLE "public"."org_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."org_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."orgs" TO "anon";
GRANT ALL ON TABLE "public"."orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."orgs" TO "service_role";



GRANT ALL ON TABLE "public"."outlook_config" TO "anon";
GRANT ALL ON TABLE "public"."outlook_config" TO "authenticated";
GRANT ALL ON TABLE "public"."outlook_config" TO "service_role";



GRANT ALL ON TABLE "public"."page_performance" TO "anon";
GRANT ALL ON TABLE "public"."page_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."page_performance" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payment_processors" TO "anon";
GRANT ALL ON TABLE "public"."payment_processors" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_processors" TO "service_role";



GRANT ALL ON TABLE "public"."performance_goals" TO "anon";
GRANT ALL ON TABLE "public"."performance_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_goals" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."plan_category_features" TO "anon";
GRANT ALL ON TABLE "public"."plan_category_features" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_category_features" TO "service_role";



GRANT ALL ON TABLE "public"."plan_category_profiles" TO "anon";
GRANT ALL ON TABLE "public"."plan_category_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_category_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."plan_features" TO "anon";
GRANT ALL ON TABLE "public"."plan_features" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_features" TO "service_role";



GRANT ALL ON TABLE "public"."plan_pricing" TO "anon";
GRANT ALL ON TABLE "public"."plan_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."plan_selections" TO "anon";
GRANT ALL ON TABLE "public"."plan_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_selections" TO "service_role";



GRANT ALL ON TABLE "public"."plan_sharing_details" TO "anon";
GRANT ALL ON TABLE "public"."plan_sharing_details" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_sharing_details" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."priority_items" TO "anon";
GRANT ALL ON TABLE "public"."priority_items" TO "authenticated";
GRANT ALL ON TABLE "public"."priority_items" TO "service_role";



GRANT ALL ON TABLE "public"."priority_lanes" TO "anon";
GRANT ALL ON TABLE "public"."priority_lanes" TO "authenticated";
GRANT ALL ON TABLE "public"."priority_lanes" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promo_code_usage" TO "anon";
GRANT ALL ON TABLE "public"."promo_code_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_code_usage" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."provider_locations" TO "anon";
GRANT ALL ON TABLE "public"."provider_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_locations" TO "service_role";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";



GRANT ALL ON TABLE "public"."quick_actions" TO "anon";
GRANT ALL ON TABLE "public"."quick_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_actions" TO "service_role";



GRANT ALL ON TABLE "public"."rate_calculator_views" TO "anon";
GRANT ALL ON TABLE "public"."rate_calculator_views" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_calculator_views" TO "service_role";



GRANT ALL ON TABLE "public"."rate_configuration" TO "anon";
GRANT ALL ON TABLE "public"."rate_configuration" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_configuration" TO "service_role";



GRANT ALL ON TABLE "public"."report_exports" TO "anon";
GRANT ALL ON TABLE "public"."report_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."report_exports" TO "service_role";



GRANT ALL ON TABLE "public"."resource_library" TO "anon";
GRANT ALL ON TABLE "public"."resource_library" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_library" TO "service_role";



GRANT ALL ON TABLE "public"."resource_topics" TO "anon";
GRANT ALL ON TABLE "public"."resource_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_topics" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."saved_reports" TO "anon";
GRANT ALL ON TABLE "public"."saved_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_reports" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_rules" TO "anon";
GRANT ALL ON TABLE "public"."scoring_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_rules" TO "service_role";



GRANT ALL ON TABLE "public"."security_alert_log" TO "anon";
GRANT ALL ON TABLE "public"."security_alert_log" TO "authenticated";
GRANT ALL ON TABLE "public"."security_alert_log" TO "service_role";



GRANT ALL ON TABLE "public"."security_alert_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."security_alert_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."security_alert_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."seo_backlinks" TO "anon";
GRANT ALL ON TABLE "public"."seo_backlinks" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_backlinks" TO "service_role";



GRANT ALL ON TABLE "public"."seo_daily_summary" TO "anon";
GRANT ALL ON TABLE "public"."seo_daily_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_daily_summary" TO "service_role";



GRANT ALL ON TABLE "public"."seo_google_credentials" TO "anon";
GRANT ALL ON TABLE "public"."seo_google_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_google_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."seo_keyword_rankings" TO "anon";
GRANT ALL ON TABLE "public"."seo_keyword_rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_keyword_rankings" TO "service_role";



GRANT ALL ON TABLE "public"."seo_keywords" TO "anon";
GRANT ALL ON TABLE "public"."seo_keywords" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_keywords" TO "service_role";



GRANT ALL ON TABLE "public"."seo_metadata" TO "anon";
GRANT ALL ON TABLE "public"."seo_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."seo_pages" TO "anon";
GRANT ALL ON TABLE "public"."seo_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_pages" TO "service_role";



GRANT ALL ON TABLE "public"."seo_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."seo_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."sequences" TO "anon";
GRANT ALL ON TABLE "public"."sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."sequences" TO "service_role";



GRANT ALL ON TABLE "public"."site_analytics" TO "anon";
GRANT ALL ON TABLE "public"."site_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."site_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."sms_accounts" TO "anon";
GRANT ALL ON TABLE "public"."sms_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."sms_log" TO "anon";
GRANT ALL ON TABLE "public"."sms_log" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_log" TO "service_role";



GRANT ALL ON TABLE "public"."sop_categories" TO "anon";
GRANT ALL ON TABLE "public"."sop_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."sop_categories" TO "service_role";



GRANT ALL ON TABLE "public"."sop_documents" TO "anon";
GRANT ALL ON TABLE "public"."sop_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."sop_documents" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tag_firing_rules" TO "anon";
GRANT ALL ON TABLE "public"."tag_firing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_firing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."terminal_tool_permissions" TO "anon";
GRANT ALL ON TABLE "public"."terminal_tool_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."terminal_tool_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_categories" TO "anon";
GRANT ALL ON TABLE "public"."ticket_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_categories" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_event_log" TO "anon";
GRANT ALL ON TABLE "public"."tracking_event_log" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_event_log" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_platforms" TO "anon";
GRANT ALL ON TABLE "public"."tracking_platforms" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_platforms" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_snippets" TO "anon";
GRANT ALL ON TABLE "public"."tracking_snippets" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_snippets" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_tags" TO "anon";
GRANT ALL ON TABLE "public"."tracking_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_tags" TO "service_role";



GRANT ALL ON TABLE "public"."traffic_sources" TO "anon";
GRANT ALL ON TABLE "public"."traffic_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."traffic_sources" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_navigation_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_navigation_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_navigation_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_organization_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_organization_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_organization_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_presence" TO "anon";
GRANT ALL ON TABLE "public"."user_presence" TO "authenticated";
GRANT ALL ON TABLE "public"."user_presence" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."utm_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."utm_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."utm_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."visit_summaries" TO "anon";
GRANT ALL ON TABLE "public"."visit_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_delivery_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_delivery_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_delivery_logs" TO "service_role";



GRANT ALL ON TABLE "public"."zoho_lead_submissions" TO "anon";
GRANT ALL ON TABLE "public"."zoho_lead_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."zoho_lead_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."zoho_salesiq_errors" TO "anon";
GRANT ALL ON TABLE "public"."zoho_salesiq_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."zoho_salesiq_errors" TO "service_role";



GRANT ALL ON TABLE "public"."zoho_salesiq_health_checks" TO "anon";
GRANT ALL ON TABLE "public"."zoho_salesiq_health_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."zoho_salesiq_health_checks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







