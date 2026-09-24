-- ============================================
-- MPB Health Ticket Attachments Storage Bucket
-- Migration: 20260303110001_create_ticket_attachments_bucket.sql
-- Purpose: Secure upload storage for advisor support ticket attachments
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  15728640 -- 15MB
)
ON CONFLICT (id) DO NOTHING;
-- Advisors can insert files only into their own top-level folder: {auth.uid()}/...
DROP POLICY IF EXISTS "Advisors can upload own ticket attachments" ON storage.objects;
CREATE POLICY "Advisors can upload own ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
-- Advisors can read only their own files (needed for signed URL creation).
DROP POLICY IF EXISTS "Advisors can read own ticket attachments" ON storage.objects;
CREATE POLICY "Advisors can read own ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "Advisors can update own ticket attachments" ON storage.objects;
CREATE POLICY "Advisors can update own ticket attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "Advisors can delete own ticket attachments" ON storage.objects;
CREATE POLICY "Advisors can delete own ticket attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
-- Admins and super admins can manage all support ticket attachments.
DROP POLICY IF EXISTS "Admins can manage all ticket attachments" ON storage.objects;
CREATE POLICY "Admins can manage all ticket attachments"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'superadmin')
  )
)
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'superadmin')
  )
);
