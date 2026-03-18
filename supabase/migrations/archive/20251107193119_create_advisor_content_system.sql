/*
  # Create Advisor Content System

  1. New Tables
    - `advisor_content_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `slug` (text) - URL-friendly slug
      - `description` (text) - Category description
      - `display_order` (integer) - Sort order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `advisor_content`
      - `id` (uuid, primary key)
      - `title` (text) - Content title
      - `slug` (text, unique) - URL-friendly slug
      - `excerpt` (text) - Short summary
      - `content` (text) - Full HTML content
      - `content_type` (text) - Type: bulletin, resource, guideline, form
      - `category_id` (uuid) - Foreign key to categories
      - `published_date` (timestamptz) - Publication date
      - `featured_image_url` (text) - Image URL
      - `is_published` (boolean) - Visibility flag
      - `view_count` (integer) - Number of views
      - `wordpress_id` (integer) - Original WP post ID for reference
      - `metadata` (jsonb) - Additional data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `advisor_content_views`
      - `id` (uuid, primary key)
      - `content_id` (uuid) - Foreign key to advisor_content
      - `advisor_id` (uuid) - Foreign key to profiles
      - `viewed_at` (timestamptz)

    - `advisor_content_bookmarks`
      - `id` (uuid, primary key)
      - `content_id` (uuid) - Foreign key to advisor_content
      - `advisor_id` (uuid) - Foreign key to profiles
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Advisors can read all published content
    - Only admins can create, update, delete content
    - Advisors can manage their own bookmarks and views
    
  3. Indexes
    - Index on slug for fast lookups
    - Index on category_id and published_date for filtering
    - Full-text search index on title and content
    - Index on advisor_id for views and bookmarks
*/

-- Create advisor_content_categories table
CREATE TABLE IF NOT EXISTS advisor_content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create advisor_content table
CREATE TABLE IF NOT EXISTS advisor_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'bulletin',
  category_id uuid REFERENCES advisor_content_categories(id) ON DELETE SET NULL,
  published_date timestamptz DEFAULT now(),
  featured_image_url text,
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  wordpress_id integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create advisor_content_views table
CREATE TABLE IF NOT EXISTS advisor_content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES advisor_content(id) ON DELETE CASCADE,
  advisor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

-- Create advisor_content_bookmarks table
CREATE TABLE IF NOT EXISTS advisor_content_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES advisor_content(id) ON DELETE CASCADE,
  advisor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, advisor_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advisor_content_slug ON advisor_content(slug);
CREATE INDEX IF NOT EXISTS idx_advisor_content_category ON advisor_content(category_id);
CREATE INDEX IF NOT EXISTS idx_advisor_content_published_date ON advisor_content(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_advisor_content_type ON advisor_content(content_type);
CREATE INDEX IF NOT EXISTS idx_advisor_content_published ON advisor_content(is_published);
CREATE INDEX IF NOT EXISTS idx_advisor_content_views_content ON advisor_content_views(content_id);
CREATE INDEX IF NOT EXISTS idx_advisor_content_views_advisor ON advisor_content_views(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_content_bookmarks_content ON advisor_content_bookmarks(content_id);
CREATE INDEX IF NOT EXISTS idx_advisor_content_bookmarks_advisor ON advisor_content_bookmarks(advisor_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_advisor_content_categories_updated_at ON advisor_content_categories;
CREATE TRIGGER update_advisor_content_categories_updated_at
  BEFORE UPDATE ON advisor_content_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_content_updated_at ON advisor_content;
CREATE TRIGGER update_advisor_content_updated_at
  BEFORE UPDATE ON advisor_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE advisor_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_content_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advisor_content_categories
CREATE POLICY "Advisors and admins can view categories"
  ON advisor_content_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('advisor', 'admin')
    )
  );

CREATE POLICY "Only admins can manage categories"
  ON advisor_content_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for advisor_content
CREATE POLICY "Advisors can view published content"
  ON advisor_content FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('advisor', 'admin')
    )
  );

CREATE POLICY "Admins can view all content"
  ON advisor_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert content"
  ON advisor_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update content"
  ON advisor_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete content"
  ON advisor_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for advisor_content_views
CREATE POLICY "Advisors can view their own views"
  ON advisor_content_views FOR SELECT
  TO authenticated
  USING (
    advisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Advisors can insert their own views"
  ON advisor_content_views FOR INSERT
  TO authenticated
  WITH CHECK (
    advisor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('advisor', 'admin')
    )
  );

-- RLS Policies for advisor_content_bookmarks
CREATE POLICY "Advisors can view their own bookmarks"
  ON advisor_content_bookmarks FOR SELECT
  TO authenticated
  USING (
    advisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Advisors can manage their own bookmarks"
  ON advisor_content_bookmarks FOR ALL
  TO authenticated
  USING (advisor_id = auth.uid())
  WITH CHECK (advisor_id = auth.uid());

-- Insert default categories
INSERT INTO advisor_content_categories (name, slug, description, display_order) VALUES
  ('Bulletin', 'bulletin', 'Regular advisor bulletins and updates', 1),
  ('Important Messages', 'important-messages', 'Critical announcements and urgent updates', 2),
  ('Training', 'training', 'Training materials and educational resources', 3),
  ('Guidelines', 'guidelines', 'Sharing guidelines and procedures', 4),
  ('Forms', 'forms', 'Advisor, employer, and member forms', 5),
  ('Resources', 'resources', 'General resources and tools', 6)
ON CONFLICT (slug) DO NOTHING;