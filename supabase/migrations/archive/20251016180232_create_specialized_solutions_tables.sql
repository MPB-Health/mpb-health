/*
  # Specialized Solutions Content Schema

  ## Overview
  This migration creates tables to manage content for the three specialized solution pages:
  - Education & Enrollment
  - Care & Support Hub
  - Insights & Analytics

  ## New Tables

  ### specialized_solutions
  - `id` (uuid, primary key) - Unique solution identifier
  - `slug` (text, unique) - URL-friendly identifier (education-enrollment, care-support-hub, insights-analytics)
  - `title` (text) - Solution title
  - `subtitle` (text) - Solution subtitle/tagline
  - `description` (text) - Brief description for cards
  - `hero_title` (text) - Hero section title
  - `hero_description` (text) - Hero section description
  - `hero_image_url` (text) - Hero background image/video URL
  - `icon` (text) - Icon identifier for card display
  - `order_index` (integer) - Display order
  - `is_published` (boolean) - Whether solution is visible
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### solution_features
  - `id` (uuid, primary key) - Unique feature identifier
  - `solution_id` (uuid, foreign key) - Reference to specialized_solutions
  - `title` (text) - Feature title
  - `description` (text) - Feature description
  - `icon` (text) - Icon identifier
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ### solution_benefits
  - `id` (uuid, primary key) - Unique benefit identifier
  - `solution_id` (uuid, foreign key) - Reference to specialized_solutions
  - `title` (text) - Benefit title
  - `description` (text) - Benefit description
  - `icon` (text) - Icon identifier
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ### solution_testimonials
  - `id` (uuid, primary key) - Unique testimonial identifier
  - `solution_id` (uuid, foreign key) - Reference to specialized_solutions
  - `name` (text) - Testimonial author name
  - `role` (text) - Author role/title
  - `content` (text) - Testimonial content
  - `avatar_url` (text) - Author avatar image URL
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Public read access for published solutions
  - Authenticated write access for content management

  ## Performance
  - Indexes on slug for fast lookups
  - Indexes on solution_id for efficient joins
  - Indexes on order_index for sorted queries
*/

-- Create specialized_solutions table
CREATE TABLE IF NOT EXISTS specialized_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  description text DEFAULT '',
  hero_title text DEFAULT '',
  hero_description text DEFAULT '',
  hero_image_url text DEFAULT '',
  icon text DEFAULT '',
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create solution_features table
CREATE TABLE IF NOT EXISTS solution_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid REFERENCES specialized_solutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create solution_benefits table
CREATE TABLE IF NOT EXISTS solution_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid REFERENCES specialized_solutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create solution_testimonials table
CREATE TABLE IF NOT EXISTS solution_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid REFERENCES specialized_solutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text DEFAULT '',
  content text NOT NULL,
  avatar_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialized_solutions_slug ON specialized_solutions(slug);
CREATE INDEX IF NOT EXISTS idx_specialized_solutions_order ON specialized_solutions(order_index);
CREATE INDEX IF NOT EXISTS idx_solution_features_solution_id ON solution_features(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_features_order ON solution_features(order_index);
CREATE INDEX IF NOT EXISTS idx_solution_benefits_solution_id ON solution_benefits(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_benefits_order ON solution_benefits(order_index);
CREATE INDEX IF NOT EXISTS idx_solution_testimonials_solution_id ON solution_testimonials(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_testimonials_order ON solution_testimonials(order_index);

-- Enable Row Level Security
ALTER TABLE specialized_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for specialized_solutions
CREATE POLICY "Anyone can view published solutions"
  ON specialized_solutions FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Authenticated users can view all solutions"
  ON specialized_solutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert solutions"
  ON specialized_solutions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update solutions"
  ON specialized_solutions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete solutions"
  ON specialized_solutions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for solution_features
CREATE POLICY "Anyone can view features of published solutions"
  ON solution_features FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM specialized_solutions
      WHERE specialized_solutions.id = solution_features.solution_id
      AND specialized_solutions.is_published = true
    )
  );

CREATE POLICY "Authenticated users can view all features"
  ON solution_features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert features"
  ON solution_features FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update features"
  ON solution_features FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete features"
  ON solution_features FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for solution_benefits
CREATE POLICY "Anyone can view benefits of published solutions"
  ON solution_benefits FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM specialized_solutions
      WHERE specialized_solutions.id = solution_benefits.solution_id
      AND specialized_solutions.is_published = true
    )
  );

CREATE POLICY "Authenticated users can view all benefits"
  ON solution_benefits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert benefits"
  ON solution_benefits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update benefits"
  ON solution_benefits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete benefits"
  ON solution_benefits FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for solution_testimonials
CREATE POLICY "Anyone can view testimonials of published solutions"
  ON solution_testimonials FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM specialized_solutions
      WHERE specialized_solutions.id = solution_testimonials.solution_id
      AND specialized_solutions.is_published = true
    )
  );

CREATE POLICY "Authenticated users can view all testimonials"
  ON solution_testimonials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert testimonials"
  ON solution_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update testimonials"
  ON solution_testimonials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete testimonials"
  ON solution_testimonials FOR DELETE
  TO authenticated
  USING (true);