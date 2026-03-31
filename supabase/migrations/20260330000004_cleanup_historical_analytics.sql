-- ============================================================================
-- Clean up historical analytics data that was tracked with the old
-- broken code: remove bot traffic, admin page views, orphan blog records
-- ============================================================================

-- 1. Delete page_views from admin/member internal pages
--    These were being tracked before we added excludePaths.
DELETE FROM public.page_views
WHERE path LIKE '/admin%'
   OR path LIKE '/member%';

-- 2. Delete orphan page_views inserted by BlogArticle.tsx
--    These used crypto.randomUUID() session IDs (UUID v4 format with dashes)
--    that don't match any real analytics_sessions record.
DELETE FROM public.page_views
WHERE session_id LIKE '________-____-____-____-____________'
  AND NOT EXISTS (
    SELECT 1 FROM public.analytics_sessions s
    WHERE s.session_id = page_views.session_id
  );

-- 3. Delete bot/crawler sessions based on known bot patterns in page_views user_agent.
--    First identify session_ids where the user_agent is a bot.
DELETE FROM public.page_views
WHERE id IN (
  SELECT pv.id FROM public.page_views pv
  WHERE pv.user_agent ~* '(bot|crawl|spider|slurp|bingpreview|mediapartners|googlebot|baiduspider|yandex|sogou|facebookexternalhit|twitterbot|linkedinbot|pinterestbot|whatsapp|telegrambot|preview|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|ahrefsbot|semrushbot|dotbot|mj12bot|petalbot|bytespider)'
);

DELETE FROM public.analytics_sessions
WHERE session_id IN (
  SELECT s.session_id FROM public.analytics_sessions s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.page_views pv WHERE pv.session_id = s.session_id
  )
);

-- 4. Recalculate page_count and is_bounce for all remaining sessions
--    from actual page_views data.
UPDATE public.analytics_sessions s
SET
  page_count = sub.real_count,
  is_bounce  = (sub.real_count <= 1)
FROM (
  SELECT session_id, COUNT(*) AS real_count
  FROM public.page_views
  GROUP BY session_id
) sub
WHERE s.session_id = sub.session_id;

-- 5. Mark sessions that have no page_views at all as bounces with page_count=0.
UPDATE public.analytics_sessions s
SET page_count = 0, is_bounce = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.page_views pv WHERE pv.session_id = s.session_id
);
