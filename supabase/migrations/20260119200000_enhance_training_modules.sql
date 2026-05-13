/*
  # Enhance Training Modules Table

  ## Changes
  - Add content_html column for rich text content
  - Add thumbnail_url column for module thumbnails
  - Update RLS policies to allow admins to see all modules (including inactive)

  This migration enhances the training_modules table to support richer content
  and better admin management from the Advisor Portal CMS.
*/

-- Add new columns to training_modules
ALTER TABLE training_modules
ADD COLUMN IF NOT EXISTS content_html text,
ADD COLUMN IF NOT EXISTS thumbnail_url text;
-- Drop the existing restrictive SELECT policy for training_modules
DROP POLICY IF EXISTS "Authenticated users can view active training modules" ON training_modules;
-- Create new SELECT policy that allows:
-- 1. Regular users to see only active modules
-- 2. Admins to see ALL modules (including inactive for CMS management)
CREATE POLICY "training_modules_select_policy"
  ON training_modules
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- Ensure grants are in place
GRANT SELECT, INSERT, UPDATE, DELETE ON training_modules TO authenticated;
