-- ============================================
-- MPB Health Event Images Storage Bucket
-- Migration: 20260513000000_create_event_images_bucket.sql
-- Purpose: Codify the `event-images` storage bucket + RLS policies that
--          already exist on the live Supabase project. The legacy website
--          admin (apps/website/src/pages/admin/EventsAdmin.tsx) has shipped
--          against this bucket since launch — capturing it in migrations so
--          the codebase matches deployed state and any new environment
--          (preview, fork, fresh project) gets the same setup.
-- ============================================

-- Storage bucket: 10MB cap, public read, JPEG/PNG/WebP/GIF allowed.
-- (The newer @mpbhealth/admin-portal uses `blog-images` — see
-- 20251208100000_create_blog_images_bucket.sql — and is intentionally
-- restricted to PNG/JPEG/WebP at 5MB.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload (admin/staff routes are auth-gated already)
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] != '.emptyFolderPlaceholder'
);

DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images')
WITH CHECK (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Public can read event images" ON storage.objects;
CREATE POLICY "Public can read event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- COMMENT ON POLICY against storage.objects requires the storage-admin role
-- on hosted Supabase, which the migration runner does not have. Wrap so a
-- permission error is silently ignored on managed projects.
DO $$
BEGIN
  EXECUTE $cmd$
    COMMENT ON POLICY "Authenticated users can upload event images" ON storage.objects IS
      'Allows authenticated admin users to upload images to the event-images bucket (used by the legacy website /admin events page).'
  $cmd$;
EXCEPTION
  WHEN insufficient_privilege THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
