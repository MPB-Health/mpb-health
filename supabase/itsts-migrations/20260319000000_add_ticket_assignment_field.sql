-- ============================================================================
-- Migration: Add Ticket Assignment Timestamp
-- Description: Adds `assigned_at` column to tickets to track when a ticket
--   was assigned to an agent. The `assignee_id` column already exists;
--   this adds the timestamp counterpart for SLA and reporting queries.
-- Target project: hhikjgrttgnvojtunmla (ITSTS)
-- ============================================================================

-- Add assigned_at timestamp (NULL = never assigned)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NULL;

-- Index for SLA queries: "tickets assigned but not resolved within X hours"
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_at
  ON public.tickets (assigned_at)
  WHERE assigned_at IS NOT NULL;

-- Backfill: for tickets that already have an assignee, use created_at as a
-- conservative estimate (we don't have the real timestamp).
UPDATE public.tickets
SET assigned_at = created_at
WHERE assignee_id IS NOT NULL
  AND assigned_at IS NULL;

-- ============================================================================
-- Auto-stamp assigned_at when assignee_id is first set
-- ============================================================================

CREATE OR REPLACE FUNCTION public.stamp_ticket_assigned_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set assigned_at only when assignee_id transitions from NULL to a value
  IF OLD.assignee_id IS NULL AND NEW.assignee_id IS NOT NULL THEN
    NEW.assigned_at = NOW();
  END IF;
  -- Clear assigned_at when assignee is removed
  IF OLD.assignee_id IS NOT NULL AND NEW.assignee_id IS NULL THEN
    NEW.assigned_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_ticket_assigned_at ON public.tickets;

CREATE TRIGGER trg_stamp_ticket_assigned_at
  BEFORE UPDATE OF assignee_id ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_ticket_assigned_at();
