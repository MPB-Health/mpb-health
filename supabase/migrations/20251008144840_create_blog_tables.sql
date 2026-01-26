/*
  # Blog System Schema

  ## New Tables
  
  ### blog_categories
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category display name
  - `slug` (text, unique) - URL-friendly category identifier
  - `description` (text) - Category description
  - `icon` (text) - Icon identifier for UI
  - `created_at` (timestamptz) - Creation timestamp
  
  ### blog_articles
  - `id` (uuid, primary key) - Unique article identifier
  - `title` (text) - Article title
  - `slug` (text, unique) - URL-friendly article identifier for routing
  - `excerpt` (text) - Short article summary/preview
  - `content` (text) - Full article content (supports markdown/HTML)
  - `featured_image_url` (text) - URL to featured image
  - `category` (text) - Article category
  - `author` (text) - Article author name
  - `published_date` (timestamptz) - When article was published
  - `is_published` (boolean) - Whether article is visible to public
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on both tables
  - Public read access for published articles only
  - Authenticated write access for content management
  
  ## Performance
  - Index on slug for fast lookups
  - Index on published_date for chronological sorting
  - Index on category for filtering
*/

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create blog_articles table
CREATE TABLE IF NOT EXISTS blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  featured_image_url text DEFAULT '',
  category text DEFAULT 'Healthcare',
  author text DEFAULT 'MPB Health',
  published_date timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_date ON blog_articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON blog_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Enable Row Level Security
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can view categories"
  ON blog_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON blog_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON blog_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON blog_categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for blog_articles
CREATE POLICY "Anyone can view published articles"
  ON blog_articles FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Authenticated users can view all articles"
  ON blog_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert articles"
  ON blog_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON blog_articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON blog_articles FOR DELETE
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, icon) VALUES
  ('Healthcare', 'healthcare', 'Healthcare insights and industry news', '🏥'),
  ('Medical Cost Sharing', 'medical-cost-sharing', 'Understanding medical cost sharing', '💰'),
  ('Wellness', 'wellness', 'Tips for living a healthier life', '🌟'),
  ('Nutrition', 'nutrition', 'Nutritional guidance and healthy eating', '🥗'),
  ('Fitness', 'fitness', 'Exercise and fitness advice', '💪'),
  ('Mental Health', 'mental-health', 'Mental wellness and emotional health', '🧠'),
  ('Preventive Care', 'preventive-care', 'Prevention and early detection', '🛡️'),
  ('Family Health', 'family-health', 'Health for the whole family', '👨‍👩‍👧‍👦')
ON CONFLICT (slug) DO NOTHING;
