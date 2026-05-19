-- ============================================
-- ITSTS: ticket attachment objects (same Supabase project as tickets DB)
-- Bucket: ticket-attachments (private). Advisors upload via ticket-proxy signed URLs (service role).
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  15728640 -- 15 MiB (matches advisor-portal limits)
)
ON CONFLICT (id) DO NOTHING;
