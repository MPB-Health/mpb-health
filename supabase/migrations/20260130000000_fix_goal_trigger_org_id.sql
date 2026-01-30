-- ============================================================================
-- Migration: Fix update_goal_progress trigger to use correct column name
-- Created: 2026-01-30
-- Description: Fixes the trigger function that was referencing NEW.organization_id
--              instead of the correct column name NEW.org_id
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Update goal progress automatically (FIXED)
-- The original function referenced NEW.organization_id but the column is org_id
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_goal_progress TO authenticated;
