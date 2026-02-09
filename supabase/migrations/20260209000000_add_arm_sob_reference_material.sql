-- ============================================================================
-- Migration: Add ARM Summary of Benefits to SOP Documents
-- Description: Inserts the ARM Summary of Benefits PDF as a reference material
-- ============================================================================

-- Ensure image_url column exists (may have been added outside migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sop_documents'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.sop_documents ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Ensure metadata column exists
ALTER TABLE public.sop_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure content_type column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sop_documents'
    AND column_name = 'content_type'
  ) THEN
    ALTER TABLE public.sop_documents ADD COLUMN content_type TEXT DEFAULT 'markdown';
  END IF;
END $$;

-- Insert the ARM Summary of Benefits document
INSERT INTO public.sop_documents (
  title,
  description,
  category,
  tags,
  content,
  content_type,
  file_url,
  image_url,
  version,
  is_published,
  is_active,
  view_count
)
VALUES (
  'ARM Summary of Benefits',
  'Summary of Benefits for the ARM HDHP plan, including coverage details, deductibles, and out-of-pocket maximums.',
  'Reference Materials',
  ARRAY['arm', 'reference materials', 'summary of benefits', 'hdhp', 'sob'],
  'ARM Summary of Benefits - HDHP plan overview document.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/SOB-ARM-HDHP.pdf',
  NULL,
  '1.0',
  true,
  true,
  0
)
ON CONFLICT DO NOTHING;

-- Set thumbnail image position offset for this card
UPDATE public.sop_documents
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{image_position}',
  '"center 20px"'
)
WHERE title = 'ARM Summary of Benefits';
