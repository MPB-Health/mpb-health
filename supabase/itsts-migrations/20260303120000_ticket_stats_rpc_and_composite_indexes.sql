-- ──────────────────────────────────────────────────────────────────────────────
-- Composite indexes for the most common query patterns in ticket-proxy
-- ──────────────────────────────────────────────────────────────────────────────

-- Advisor ticket list: WHERE requester_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_tickets_requester_created
  ON public.tickets (requester_id, created_at DESC);

-- Advisor filtered list: WHERE requester_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_tickets_requester_status
  ON public.tickets (requester_id, status);

-- ──────────────────────────────────────────────────────────────────────────────
-- RPC: per-user ticket stats — eliminates full table scan in getTicketStats()
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_ticket_stats_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total',    COUNT(*),
    'new',      COUNT(*) FILTER (WHERE status = 'new'),
    'open',     COUNT(*) FILTER (WHERE status = 'open'),
    'pending',  COUNT(*) FILTER (WHERE status = 'pending'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed',   COUNT(*) FILTER (WHERE status = 'closed')
  )
  FROM public.tickets
  WHERE requester_id = p_user_id;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- RPC: system-wide ticket stats — eliminates full table scan in getAllTicketStats()
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_all_ticket_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total',    COUNT(*),
    'new',      COUNT(*) FILTER (WHERE status = 'new'),
    'open',     COUNT(*) FILTER (WHERE status = 'open'),
    'pending',  COUNT(*) FILTER (WHERE status = 'pending'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed',   COUNT(*) FILTER (WHERE status = 'closed')
  )
  FROM public.tickets;
$$;
