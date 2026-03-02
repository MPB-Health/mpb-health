-- ============================================================================
-- Migration: Allow PPTX in advisor-documents bucket
-- Description: Add PowerPoint MIME types so presentations can be uploaded
-- ============================================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
]::text[]
WHERE id = 'advisor-documents';
