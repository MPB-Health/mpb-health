/*
  # Fix Database Security Issues - Part 6: Fix Remaining RLS Policies

  ## Optimize Remaining RLS Policies
    - Fix `blog_articles` policy to use (SELECT auth.role())
    - Fix `navigation_items` policy to use (SELECT auth.role())
    - Prevents re-evaluation for each row

  ## Security
    - Maintains existing access patterns
    - Improves performance at scale
*/

-- ============================================================================
-- FIX REMAINING RLS POLICIES
-- ============================================================================

-- Blog articles - fix auth.role() usage
DROP POLICY IF EXISTS "Public can view published, authenticated can view all" ON blog_articles;
CREATE POLICY "Public can view published, authenticated can view all"
  ON blog_articles FOR SELECT
  USING (
    is_published = true 
    OR (SELECT auth.role()) = 'authenticated'
  );

-- Navigation items - fix auth.role() usage
DROP POLICY IF EXISTS "Public can view items based on auth requirement" ON navigation_items;
CREATE POLICY "Public can view items based on auth requirement"
  ON navigation_items FOR SELECT
  USING (
    requires_auth = false 
    OR (SELECT auth.role()) = 'authenticated'
  );
