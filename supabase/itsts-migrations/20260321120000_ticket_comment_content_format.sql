-- ITSTS: rich text support for ticket comment bodies (apply to ITSTS Supabase project)
-- See supabase/ITSTS_DEPLOYMENT.md

ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS content_format text NOT NULL DEFAULT 'plain';

ALTER TABLE public.ticket_comments
  DROP CONSTRAINT IF EXISTS ticket_comments_content_format_check;

ALTER TABLE public.ticket_comments
  ADD CONSTRAINT ticket_comments_content_format_check
  CHECK (content_format IN ('plain', 'html'));

COMMENT ON COLUMN public.ticket_comments.content_format IS
  'plain = legacy/plain text; html = sanitized HTML in body';
