-- ============================================================================
-- Migration: Add idempotency_key column to tickets
-- Description: ticket-proxy uses idempotency_key to prevent duplicate creates
--   from client retries or double-clicks. The origin and agent_id columns
--   already exist on this table.
-- Target project: hhikjgrttgnvojtunmla (ITSTS)
-- ============================================================================

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT DEFAULT NULL;

-- Unique partial index: one non-null idempotency key per requester
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_idempotency_key
  ON public.tickets (requester_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
