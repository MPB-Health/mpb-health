-- Add sales_hours_by_member_id to concierge_weekly_report_extras.
-- Reps with sales hours logged are excluded from full-time concierge performance alerts.
ALTER TABLE public.concierge_weekly_report_extras
  ADD COLUMN IF NOT EXISTS sales_hours_by_member_id jsonb NOT NULL DEFAULT '{}'::jsonb;
