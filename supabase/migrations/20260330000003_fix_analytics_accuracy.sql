-- ============================================================================
-- Fix analytics accuracy: page_count, is_bounce, visitor_id
-- ============================================================================

-- 1. Change page_count default from 1 to 0.
--    The trigger increments on every page_view insert, so sessions were
--    starting at 1 + 1 = 2 after the first real page view.
ALTER TABLE public.analytics_sessions
  ALTER COLUMN page_count SET DEFAULT 0;
-- 2. Add visitor_id column so we can deduplicate users across sessions.
ALTER TABLE public.analytics_sessions
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor_id
  ON public.analytics_sessions (visitor_id);
-- 3. Replace the trigger function to fix is_bounce logic.
--    Old version always set is_bounce = false on the first page view,
--    meaning bounce rate was always 0%.
--    New version: is_bounce = true only when page_count stays at 1
--    (i.e. only one page was viewed in the session).
CREATE OR REPLACE FUNCTION public.update_session_on_page_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE analytics_sessions
  SET
    page_count  = page_count + 1,
    is_bounce   = (page_count + 1 <= 1),
    exit_page   = NEW.path,
    ended_at    = NEW.created_at,
    duration_seconds = EXTRACT(EPOCH FROM (NEW.created_at - started_at))::integer,
    updated_at  = now()
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$;
-- 4. Backfill: fix existing sessions that have inflated page_count.
--    Recalculate page_count from actual page_views rows.
UPDATE public.analytics_sessions s
SET
  page_count = sub.real_count,
  is_bounce  = (sub.real_count <= 1)
FROM (
  SELECT session_id, COUNT(*) AS real_count
  FROM public.page_views
  GROUP BY session_id
) sub
WHERE s.session_id = sub.session_id
  AND s.page_count <> sub.real_count;
