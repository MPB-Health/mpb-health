-- ============================================
-- MPB Health Blog Images Storage Bucket
-- Migration: 20251208100000_create_blog_images_bucket.sql
-- Purpose: Create storage bucket for blog image uploads
-- ============================================

-- Create the storage bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] != '.emptyFolderPlaceholder'
);

-- Policy: Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Policy: Allow public read access to all blog images
CREATE POLICY "Public read access for blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Add comment for documentation
COMMENT ON POLICY "Authenticated users can upload blog images" ON storage.objects IS 
  'Allows authenticated admin users to upload images to the blog-images bucket';
