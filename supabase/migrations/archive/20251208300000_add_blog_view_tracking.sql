-- ============================================
-- MPB Health Blog View Tracking
-- Migration: 20251208300000_add_blog_view_tracking.sql
-- Purpose: Add view count tracking and increment function
-- ============================================

-- Ensure view_count column exists on blog_articles
ALTER TABLE blog_articles 
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create index for view_count sorting
CREATE INDEX IF NOT EXISTS idx_blog_articles_view_count ON blog_articles(view_count DESC);

-- Create RPC function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_blog_view(article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_articles 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION increment_blog_view(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_blog_view(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_blog_view IS 'Atomically increments the view count for a blog article';
COMMENT ON COLUMN blog_articles.view_count IS 'Number of times this article has been viewed';
