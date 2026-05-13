-- Rename zoho_lead_submissions → lead_submissions
-- Drops the empty legacy lead_submissions table first, then renames the real one.

-- ============================================================================
-- STEP 1: Drop the old empty lead_submissions table (created by an early migration,
-- never used — 0 rows). This clears the name for the rename.
-- ============================================================================

DROP VIEW IF EXISTS public.admin_lead_submissions_view CASCADE;
DROP TABLE IF EXISTS public.lead_submissions CASCADE;
-- ============================================================================
-- STEP 2: Update dependent functions BEFORE renaming (return signature changes
-- require DROP + CREATE, not CREATE OR REPLACE).
-- ============================================================================

DROP FUNCTION IF EXISTS "public"."get_filtered_leads"(text, text, uuid, text, timestamptz, timestamptz, integer, integer);
CREATE FUNCTION "public"."get_filtered_leads"(
  "p_stage" "text" DEFAULT NULL::"text",
  "p_priority" "text" DEFAULT NULL::"text",
  "p_assigned_to" "uuid" DEFAULT NULL::"uuid",
  "p_search" "text" DEFAULT NULL::"text",
  "p_date_from" timestamp with time zone DEFAULT NULL::timestamp with time zone,
  "p_date_to" timestamp with time zone DEFAULT NULL::timestamp with time zone,
  "p_limit" integer DEFAULT 50,
  "p_offset" integer DEFAULT 0
) RETURNS TABLE(
  "id" "uuid",
  "first_name" "text",
  "last_name" "text",
  "email" "text",
  "phone" "text",
  "zip_code" "text",
  "pipeline_stage" "text",
  "priority" "text",
  "assigned_to" "uuid",
  "lead_score" integer,
  "source_cta" "text",
  "source_page" "text",
  "created_at" timestamp with time zone,
  "stage_changed_at" timestamp with time zone,
  "next_followup_at" timestamp with time zone,
  "tags" "text"[],
  "total_count" bigint
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'pg_temp'
AS $$
DECLARE
  v_total_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_count
  FROM lead_submissions zls
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
    v_total_count
  FROM lead_submissions zls
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
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'lead_submissions' AND TG_OP = 'INSERT' THEN
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
      AND org_id = NEW.org_id;
  END IF;

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
CREATE OR REPLACE FUNCTION public.update_lead_submission_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- ============================================================================
-- STEP 3: Rename the table (safe — old lead_submissions was dropped in step 1)
-- ============================================================================

ALTER TABLE public.zoho_lead_submissions RENAME TO lead_submissions;
-- ============================================================================
-- STEP 4: Swap the trigger to use the new function name
-- ============================================================================

DROP TRIGGER IF EXISTS update_zoho_lead_submissions_updated_at ON public.lead_submissions;
CREATE TRIGGER update_lead_submissions_updated_at
  BEFORE UPDATE ON public.lead_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_submission_updated_at();
DROP FUNCTION IF EXISTS public.update_zoho_lead_submission_updated_at();
-- ============================================================================
-- STEP 5: Rename constraints, indexes, and policies
-- ============================================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname, conrelid::regclass AS child_table
    FROM pg_constraint
    WHERE conname LIKE 'zoho_lead_submissions_%' AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I',
      r.child_table, r.conname,
      replace(r.conname, 'zoho_lead_submissions', 'lead_submissions'));
  END LOOP;
END $$;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.lead_submissions'::regclass
      AND conname LIKE 'zoho_lead_submissions_%'
  LOOP
    EXECUTE format('ALTER TABLE public.lead_submissions RENAME CONSTRAINT %I TO %I',
      r.conname, replace(r.conname, 'zoho_lead_submissions', 'lead_submissions'));
  END LOOP;
END $$;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE 'zoho_lead_submissions_%'
  LOOP
    EXECUTE format('ALTER INDEX IF EXISTS %I RENAME TO %I',
      r.indexname, replace(r.indexname, 'zoho_lead_submissions', 'lead_submissions'));
  END LOOP;
END $$;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lead_submissions'
      AND policyname LIKE '%zoho%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.lead_submissions RENAME TO %I',
      r.policyname, replace(r.policyname, 'zoho_lead_submissions', 'lead_submissions'));
  END LOOP;
END $$;
-- ============================================================================
-- STEP 6: Drop the Zoho-specific sync columns
-- ============================================================================

ALTER TABLE public.lead_submissions
  DROP COLUMN IF EXISTS zoho_lead_id,
  DROP COLUMN IF EXISTS zoho_sync_status,
  DROP COLUMN IF EXISTS zoho_sync_attempts,
  DROP COLUMN IF EXISTS zoho_last_sync_at,
  DROP COLUMN IF EXISTS zoho_error_message;
-- ============================================================================
-- STEP 7: Update the integrations type CHECK to remove 'zoho'
-- ============================================================================

ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check
  CHECK (type IN ('mailchimp', 'stripe', 'twilio', 'cognito', 'itsts', 'other'));
