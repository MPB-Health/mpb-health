/*
  # Add WordPress Training Courses Integration

  ## Overview
  This migration creates a table to store training courses imported from the existing
  WordPress/Tutor LMS system at training.mpb.health, allowing seamless integration
  of legacy content.

  ## New Tables

  ### `wordpress_courses`
  - `id` (uuid, primary key)
  - `wp_course_id` (integer) - Original WordPress course ID
  - `slug` (text, unique) - URL slug
  - `title` (text) - Course title
  - `description` (text) - Course description
  - `summary_bullets` (text[]) - Key takeaways array
  - `category` (text) - Course category
  - `level` (text) - Difficulty level
  - `status` (text) - publish, draft, etc.
  - `language` (text) - en, pt-BR, etc.
  - `is_password_protected` (boolean) - Whether course requires password
  - `password` (text, nullable) - Access password if protected
  - `password_hint` (text, nullable) - Hint for password
  - `thumbnail_url` (text, nullable) - Course image URL
  - `duration_minutes` (integer) - Estimated completion time
  - `completions_count` (integer) - Number of completions
  - `start_timestamp` (bigint, nullable) - Unix timestamp for course start
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `is_active` (boolean) - Whether course is visible

  ## Security
  - Enable RLS
  - Public read access for active courses
  - Admin-only write access
*/

-- Create wordpress_courses table
CREATE TABLE IF NOT EXISTS wordpress_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_course_id integer UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  summary_bullets text[] DEFAULT ARRAY[]::text[],
  category text,
  level text DEFAULT 'all_levels',
  status text DEFAULT 'draft' CHECK (status IN ('publish', 'draft', 'pending')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'pt-BR', 'es')),
  is_password_protected boolean DEFAULT false,
  password text,
  password_hint text,
  thumbnail_url text,
  duration_minutes integer DEFAULT 0,
  completions_count integer DEFAULT 0,
  start_timestamp bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wordpress_courses_slug ON wordpress_courses(slug);
CREATE INDEX IF NOT EXISTS idx_wordpress_courses_category ON wordpress_courses(category);
CREATE INDEX IF NOT EXISTS idx_wordpress_courses_status ON wordpress_courses(status);
CREATE INDEX IF NOT EXISTS idx_wordpress_courses_active ON wordpress_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_wordpress_courses_language ON wordpress_courses(language);

-- Enable Row Level Security
ALTER TABLE wordpress_courses ENABLE ROW LEVEL SECURITY;

-- Public can view published active courses
CREATE POLICY "Public can view published courses"
  ON wordpress_courses FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND status = 'publish');

-- Admins can manage all courses
CREATE POLICY "Admins can manage courses"
  ON wordpress_courses FOR ALL
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

-- Create trigger for updated_at
CREATE TRIGGER wordpress_courses_updated_at
  BEFORE UPDATE ON wordpress_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED WITH EXISTING WORDPRESS COURSES
-- ============================================================================

-- Insert courses from training.mpb.health
INSERT INTO wordpress_courses (
  wp_course_id, slug, title, description, summary_bullets, category, level,
  status, language, is_password_protected, password, password_hint,
  thumbnail_url, duration_minutes, completions_count, start_timestamp, is_active
) VALUES

-- Course 1: Become an MPB Healthcare Advisor
(
  15,
  'become-an-mpb-healthcare-advisor',
  'Become an MPB Healthcare Advisor',
  'Comprehensive course for employees and healthcare advisors to excel as MPB team members.',
  ARRAY[
    'Comprehensive course for employees and healthcare advisors to excel as MPB team members',
    'Deep understanding of MPB mission, values, and commitment to exceptional healthcare solutions',
    'Overview of programs, services, and benefits, including unique features and advantages',
    'Membership types and benefits—how to explain them effectively to prospects',
    'Expectations of an MPB Healthcare Advisor: client interaction and sales techniques'
  ],
  'healthcare-advisors',
  'intermediate',
  'publish',
  'en',
  false,
  null,
  null,
  'https://training.mpb.health/wp-content/uploads/2025/01/Diversity-Inclusion-Accessible-Instagram-Post-in-Bright-Green-Dark-Green-White-Swiss-Corporate-Style2.png',
  0,
  17,
  1738191269,
  true
),

-- Course 2: SaudeMax (Internal)
(
  253,
  'saudemax',
  'SaudeMax',
  'Training for MPB employees on SaudeMax Membership: benefits, features, limitations, support, eligibility, enrollment, coverage, FAQs, and talking points.',
  ARRAY[
    'Understand core benefits and services in SaudeMax Membership',
    'Explain the program clearly to customers',
    'Know eligibility, enrollment, and coverage details',
    'Address FAQs and customer concerns',
    'Improve engagement and satisfaction through better service'
  ],
  'employees',
  'all_levels',
  'draft',
  'en',
  true,
  'saude2025max!',
  'Provided internally',
  'https://training.mpb.health/wp-content/uploads/2025/01/mpb-training-images1.png',
  0,
  1,
  1738191269,
  true
),

-- Course 3: SaudeMax - Agências (Portuguese)
(
  348,
  'saudemax-plano-agencias',
  'SaudeMax - Agências',
  'Curso para funcionários MPB sobre a Assinatura SaudeMax: benefícios, recursos, valor para membros, serviços de saúde, limitações e suporte, com pontos-chave de comunicação e respostas às dúvidas mais comuns.',
  ARRAY[]::text[],
  'saudemax',
  'intermediate',
  'publish',
  'pt-BR',
  true,
  'SaudeMAXAgencias25',
  'Provided to partner agencies',
  'https://training.mpb.health/wp-content/uploads/2025/04/mpb-training-images2.jpg',
  0,
  7,
  1743090159,
  true
);

-- ============================================================================
-- CREATE VIEW FOR COURSE CATALOG
-- ============================================================================

CREATE OR REPLACE VIEW course_catalog AS
SELECT
  id,
  wp_course_id,
  slug,
  title,
  description,
  summary_bullets,
  category,
  level,
  status,
  language,
  is_password_protected,
  password_hint,
  thumbnail_url,
  duration_minutes,
  completions_count,
  CASE
    WHEN level = 'beginner' THEN 1
    WHEN level = 'intermediate' THEN 2
    WHEN level = 'advanced' THEN 3
    ELSE 0
  END as level_order,
  created_at,
  updated_at
FROM wordpress_courses
WHERE is_active = true AND status = 'publish'
ORDER BY completions_count DESC, created_at DESC;

COMMENT ON VIEW course_catalog IS 'Public course catalog with active, published courses sorted by popularity';
