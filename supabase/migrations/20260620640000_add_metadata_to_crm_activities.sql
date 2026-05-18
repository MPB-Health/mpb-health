-- Add metadata column to crm_activities to match edge function usage
-- (goto-connect-integration, crm-calendar-booking-webhook both insert metadata).

ALTER TABLE public.crm_activities
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
