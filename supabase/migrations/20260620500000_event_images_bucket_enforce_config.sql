-- ============================================================================
-- event-images bucket — enforce canonical config
-- ----------------------------------------------------------------------------
-- Follow-up to 20260513000000_create_event_images_bucket.sql.
--
-- The original migration used `ON CONFLICT (id) DO NOTHING`, which silently
-- preserved any drift between the canonical config and whatever already
-- existed on the live project (e.g., a bucket created via Studio with
-- `public = false`, a smaller size limit, or a restricted MIME list).
--
-- Symptom we hit: admin-portal uploads returned 200 but uploaded URLs 404'd
-- when displayed, because the bucket's public flag had drifted. The fix on
-- the frontend (apps/admin-portal/src/components/cms/imageUploadService.ts)
-- added a post-upload HEAD verification, but the durable fix is to keep the
-- bucket config in lockstep with what the code expects.
--
-- This migration:
--   1. Re-asserts the canonical bucket config (public, 10MB, image MIME types)
--      via ON CONFLICT DO UPDATE — so any future drift gets corrected on the
--      next migration apply.
--   2. Ensures the four RLS policies exist with the right shape, in case any
--      were dropped or replaced out-of-band.
--   3. Verifies post-conditions and RAISEs NOTICEs (not errors) if anything
--      is still off, so the run log surfaces unexpected state without
--      breaking the migration.
-- ============================================================================

-- 1. Bucket config — DO UPDATE so the canonical values win every apply.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies — drop + recreate to guarantee shape. Storage policies live
-- on `storage.objects`; the four policies cover the full lifecycle that the
-- admin UIs need (insert/update/delete by authenticated users; public read).

DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] IS DISTINCT FROM '.emptyFolderPlaceholder'
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

-- 3. Post-conditions — emit NOTICEs (not errors) so we don't fail the apply
-- if storage.* is unreadable in some environment, but surface drift loudly.
DO $$
DECLARE
  v_public boolean;
  v_size_limit bigint;
  v_mime_types text[];
  v_policy_count int;
BEGIN
  SELECT public, file_size_limit, allowed_mime_types
    INTO v_public, v_size_limit, v_mime_types
  FROM storage.buckets
  WHERE id = 'event-images';

  IF NOT FOUND THEN
    RAISE NOTICE '[event-images] bucket missing after upsert — check storage permissions';
  ELSE
    IF v_public IS DISTINCT FROM true THEN
      RAISE NOTICE '[event-images] public flag is %, expected true', v_public;
    END IF;
    IF v_size_limit IS DISTINCT FROM 10485760 THEN
      RAISE NOTICE '[event-images] file_size_limit is %, expected 10485760', v_size_limit;
    END IF;
    IF NOT (v_mime_types @> ARRAY['image/jpeg','image/png','image/webp']::text[]) THEN
      RAISE NOTICE '[event-images] allowed_mime_types missing required types: %', v_mime_types;
    END IF;
  END IF;

  SELECT count(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'Authenticated users can upload event images',
      'Authenticated users can update event images',
      'Authenticated users can delete event images',
      'Public can read event images'
    );

  IF v_policy_count <> 4 THEN
    RAISE NOTICE '[event-images] expected 4 RLS policies, found %', v_policy_count;
  END IF;
END $$;

-- COMMENT ON POLICY requires the storage-admin role on hosted Supabase, which
-- the migration runner lacks. Wrap so the missing privilege is a no-op.
DO $$
BEGIN
  EXECUTE $cmd$
    COMMENT ON POLICY "Authenticated users can upload event images" ON storage.objects IS
      'event-images bucket: authenticated admin users (admin-portal, legacy website /admin events) can upload. Public read via separate SELECT policy.'
  $cmd$;
EXCEPTION
  WHEN insufficient_privilege THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
