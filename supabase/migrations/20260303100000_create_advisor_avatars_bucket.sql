-- ============================================
-- MPB Health Advisor Avatars Storage Bucket
-- Migration: 20260303100000_create_advisor_avatars_bucket.sql
-- Purpose: Create storage bucket for advisor profile picture uploads
-- ============================================

-- Create the storage bucket for advisor avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advisor-avatars',
  'advisor-avatars',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow advisors to upload their own avatar
-- The file path is {advisorId}/avatar.{ext}, so the folder must match auth.uid()
DROP POLICY IF EXISTS "Advisors can upload their own avatar" ON storage.objects;
CREATE POLICY "Advisors can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'advisor-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow advisors to update (upsert) their own avatar
DROP POLICY IF EXISTS "Advisors can update their own avatar" ON storage.objects;
CREATE POLICY "Advisors can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'advisor-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'advisor-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow advisors to delete their own avatar
DROP POLICY IF EXISTS "Advisors can delete their own avatar" ON storage.objects;
CREATE POLICY "Advisors can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'advisor-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access so avatars are visible everywhere
DROP POLICY IF EXISTS "Public read access for advisor avatars" ON storage.objects;
CREATE POLICY "Public read access for advisor avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'advisor-avatars');

-- Policy: Allow admins/superadmins to manage all avatars
DROP POLICY IF EXISTS "Admins can manage all advisor avatars" ON storage.objects;
CREATE POLICY "Admins can manage all advisor avatars"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'advisor-avatars'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  bucket_id = 'advisor-avatars'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
  )
);
