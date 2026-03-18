-- ============================================
-- MPB Health Blog Authors & Article Tags
-- Migration: 20251208200000_create_blog_authors_and_tags.sql
-- Purpose: Create blog_authors table and add author metadata support
-- ============================================

-- Create blog_authors table for rich author profiles
CREATE TABLE IF NOT EXISTS blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text,
  avatar_url text,
  bio text,
  role text DEFAULT 'Contributor',
  social_linkedin text,
  social_twitter text,
  social_website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for blog_authors
CREATE INDEX IF NOT EXISTS idx_blog_authors_slug ON blog_authors(slug);
CREATE INDEX IF NOT EXISTS idx_blog_authors_active ON blog_authors(is_active);

-- Add author_id foreign key to blog_articles (nullable for backward compatibility)
ALTER TABLE blog_articles 
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES blog_authors(id) ON DELETE SET NULL;

-- Add tags array to blog_articles for categorization
ALTER TABLE blog_articles 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];

-- Create index for tags array searching
CREATE INDEX IF NOT EXISTS idx_blog_articles_tags ON blog_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_articles_author_id ON blog_articles(author_id);

-- Enable RLS on blog_authors
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for active authors
CREATE POLICY "Public can view active blog authors"
  ON blog_authors FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Authenticated users can manage authors
CREATE POLICY "Authenticated users can manage blog authors"
  ON blog_authors FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for blog_authors
CREATE OR REPLACE FUNCTION update_blog_authors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_authors_updated_at
  BEFORE UPDATE ON blog_authors
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_authors_updated_at();

-- Insert default MPB Health author
INSERT INTO blog_authors (name, slug, role, bio, is_active)
VALUES (
  'MPB Health Team',
  'mpb-health-team',
  'Health Sharing Experts',
  'The MPB Health team is dedicated to helping families and individuals find affordable, faith-based healthcare solutions that prioritize wellness and community support.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE blog_authors IS 'Blog author profiles with avatar, bio, and social links for the BlogFooter component';
COMMENT ON COLUMN blog_articles.author_id IS 'Foreign key to blog_authors for rich author metadata';
COMMENT ON COLUMN blog_articles.tags IS 'Array of tags for article categorization and related articles';
