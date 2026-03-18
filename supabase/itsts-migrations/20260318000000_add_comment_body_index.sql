-- Composite index for fast comment loading ordered by time
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_time
  ON public.ticket_comments (ticket_id, created_at ASC);
