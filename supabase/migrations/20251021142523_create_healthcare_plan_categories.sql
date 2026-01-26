/*
  # Healthcare Plan Categories System

  1. New Tables
    - `healthcare_plan_categories`
      - `id` (uuid, primary key) - Unique identifier
      - `slug` (text, unique) - URL-friendly identifier (e.g., 'routine-virtual-care')
      - `title` (text) - Display title (e.g., 'Routine & Virtual Care')
      - `subtitle` (text) - Brief subtitle description
      - `description` (text) - Full description of the category
      - `icon` (text) - Lucide icon name for the category
      - `gradient` (text) - Tailwind gradient classes
      - `icon_bg` (text) - Background color for icon
      - `image_url` (text) - Hero image URL
      - `image_alt` (text) - Alt text for image
      - `recommendations` (text) - Recommended plans text
      - `best_for` (text) - Who this category is best suited for
      - `order_index` (int) - Display order
      - `is_active` (boolean) - Whether category is currently active
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

    - `plan_category_profiles`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key) - Links to healthcare_plan_categories
      - `profile_text` (text) - Description of typical user profile
      - `order_index` (int) - Display order
      - `created_at` (timestamptz)

    - `plan_category_features`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key) - Links to healthcare_plan_categories
      - `feature_text` (text) - Feature description
      - `feature_type` (text) - 'included' or 'excluded'
      - `order_index` (int) - Display order
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (anonymous users can view published categories)
    - Add policies for authenticated admin write access

  3. Indexes
    - Index on slug for fast lookups
    - Index on category_id for related data queries
*/

-- Create healthcare_plan_categories table
CREATE TABLE IF NOT EXISTS healthcare_plan_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Heart',
  gradient text NOT NULL DEFAULT 'from-blue-600 to-cyan-500',
  icon_bg text NOT NULL DEFAULT 'bg-blue-100',
  image_url text NOT NULL DEFAULT '',
  image_alt text NOT NULL DEFAULT '',
  recommendations text NOT NULL DEFAULT '',
  best_for text NOT NULL DEFAULT '',
  order_index int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create plan_category_profiles table
CREATE TABLE IF NOT EXISTS plan_category_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES healthcare_plan_categories(id) ON DELETE CASCADE,
  profile_text text NOT NULL,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create plan_category_features table
CREATE TABLE IF NOT EXISTS plan_category_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES healthcare_plan_categories(id) ON DELETE CASCADE,
  feature_text text NOT NULL,
  feature_type text NOT NULL CHECK (feature_type IN ('included', 'excluded')),
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_plan_categories_slug ON healthcare_plan_categories(slug);
CREATE INDEX IF NOT EXISTS idx_plan_category_profiles_category ON plan_category_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_plan_category_features_category ON plan_category_features(category_id);

-- Enable RLS
ALTER TABLE healthcare_plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_category_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_category_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for healthcare_plan_categories
CREATE POLICY "Public can view active plan categories"
  ON healthcare_plan_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage plan categories"
  ON healthcare_plan_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for plan_category_profiles
CREATE POLICY "Public can view category profiles"
  ON plan_category_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_plan_categories
      WHERE healthcare_plan_categories.id = plan_category_profiles.category_id
      AND healthcare_plan_categories.is_active = true
    )
  );

CREATE POLICY "Authenticated users can manage category profiles"
  ON plan_category_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for plan_category_features
CREATE POLICY "Public can view category features"
  ON plan_category_features
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_plan_categories
      WHERE healthcare_plan_categories.id = plan_category_features.category_id
      AND healthcare_plan_categories.is_active = true
    )
  );

CREATE POLICY "Authenticated users can manage category features"
  ON plan_category_features
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial data for the three plan categories
INSERT INTO healthcare_plan_categories (slug, title, subtitle, description, icon, gradient, icon_bg, image_url, image_alt, recommendations, best_for, order_index, is_active)
VALUES 
(
  'routine-virtual-care',
  'Routine & Virtual Care',
  'Everyday care with 24/7 virtual visits.',
  'Perfect for individuals and families who prioritize everyday wellness, preventive care, and virtual access while keeping monthly costs low. This comprehensive healthcare sharing option provides essential coverage for routine checkups, telemedicine access, and preventive care services.',
  'Video',
  'from-blue-600 to-cyan-500',
  'bg-blue-100',
  'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'Doctor conducting virtual telehealth consultation with patient',
  'Recommends: Essentials / MEC+Essentials',
  'Individuals and families who prioritize everyday wellness, preventive care, and virtual access while keeping monthly costs low.',
  1,
  true
),
(
  'big-bill-protection',
  'Big-Bill Protection',
  'Major medical events, community cost sharing.',
  'Designed for members who want strong protection against large medical bills while maintaining affordable monthly contributions and community-based sharing. This plan provides comprehensive coverage for major medical events, surgeries, and hospitalizations.',
  'Shield',
  'from-blue-600 to-cyan-500',
  'bg-teal-100',
  'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'Healthcare professional providing care to family members',
  'Recommends: Care+ / Direct',
  'Members who want strong protection against large medical bills while maintaining affordable monthly contributions and community-based sharing.',
  2,
  true
),
(
  'hsa-compatible',
  'HSA-Compatible',
  'Tax-advantaged approach with sharing protection.',
  'Perfect for financially-savvy individuals who want to maximize tax benefits while protecting against major medical expenses and building long-term healthcare savings. This plan qualifies for Health Savings Account contributions with all their tax advantages.',
  'PiggyBank',
  'from-blue-600 to-cyan-500',
  'bg-emerald-100',
  'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'Professional reviewing financial documents and healthcare savings plans',
  'Recommends: Secure HSA / Premium HSA',
  'Financially-savvy individuals who want to maximize tax benefits while protecting against major medical expenses and building long-term healthcare savings.',
  3,
  true
);

-- Insert profiles for Routine & Virtual Care
INSERT INTO plan_category_profiles (category_id, profile_text, order_index)
SELECT id, 'Healthy individuals needing preventive care', 1 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Families prioritizing wellness and routine checkups', 2 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Those seeking unlimited telemedicine access', 3 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Budget-conscious members with low medical needs', 4 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Young professionals wanting basic coverage', 5 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care';

-- Insert profiles for Big-Bill Protection
INSERT INTO plan_category_profiles (category_id, profile_text, order_index)
SELECT id, 'Families with children or teens', 1 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Those with moderate health concerns', 2 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Members wanting comprehensive sharing', 3 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'People prioritizing catastrophic protection', 4 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Individuals between employer plans', 5 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection';

-- Insert profiles for HSA-Compatible
INSERT INTO plan_category_profiles (category_id, profile_text, order_index)
SELECT id, 'Self-employed professionals and business owners', 1 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Those seeking tax-advantaged healthcare savings', 2 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'High-income earners wanting deductions', 3 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Healthy individuals planning for the future', 4 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Members comfortable with higher IUA amounts', 5 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible';

-- Insert included features for Routine & Virtual Care
INSERT INTO plan_category_features (category_id, feature_text, feature_type, order_index)
SELECT id, '24/7 telemedicine and virtual doctor visits', 'included', 1 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Preventive care and wellness visits', 'included', 2 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Prescription discount programs', 'included', 3 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Routine checkups and screenings', 'included', 4 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Mental health support resources', 'included', 5 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Lowest monthly contribution options', 'included', 6 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care';

-- Insert excluded features for Routine & Virtual Care
INSERT INTO plan_category_features (category_id, feature_text, feature_type, order_index)
SELECT id, 'Limited sharing for major medical events', 'excluded', 1 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Higher out-of-pocket for hospital stays', 'excluded', 2 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'May not cover all specialist visits', 'excluded', 3 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care'
UNION ALL
SELECT id, 'Not suitable for chronic conditions requiring frequent care', 'excluded', 4 FROM healthcare_plan_categories WHERE slug = 'routine-virtual-care';

-- Insert included features for Big-Bill Protection
INSERT INTO plan_category_features (category_id, feature_text, feature_type, order_index)
SELECT id, 'Major medical sharing for hospitalizations', 'included', 1 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Surgery and emergency room coverage', 'included', 2 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Specialist visits and procedures', 'included', 3 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Comprehensive diagnostic testing', 'included', 4 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Maternity and childbirth sharing', 'included', 5 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Higher annual sharing limits', 'included', 6 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection';

-- Insert excluded features for Big-Bill Protection
INSERT INTO plan_category_features (category_id, feature_text, feature_type, order_index)
SELECT id, 'Pre-existing conditions have waiting periods', 'excluded', 1 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Initial Unshareable Amount (IUA) applies first', 'excluded', 2 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Some elective procedures may not be shared', 'excluded', 3 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection'
UNION ALL
SELECT id, 'Sharing limits apply per medical need', 'excluded', 4 FROM healthcare_plan_categories WHERE slug = 'big-bill-protection';

-- Insert included features for HSA-Compatible
INSERT INTO plan_category_features (category_id, feature_text, feature_type, order_index)
SELECT id, 'Qualifies for Health Savings Account (HSA)', 'included', 1 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Tax-deductible HSA contributions', 'included', 2 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Tax-free growth on HSA investments', 'included', 3 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Tax-free withdrawals for medical expenses', 'included', 4 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Catastrophic sharing protection', 'included', 5 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Lower monthly contributions than traditional insurance', 'included', 6 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible';

-- Insert excluded features for HSA-Compatible
INSERT INTO plan_category_features (category_id, feature_text, feature_type, order_index)
SELECT id, 'Higher Initial Unshareable Amount (IUA)', 'excluded', 1 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Must meet IRS HSA eligibility requirements', 'excluded', 2 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'Cannot have other health coverage', 'excluded', 3 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible'
UNION ALL
SELECT id, 'HSA contribution limits apply annually', 'excluded', 4 FROM healthcare_plan_categories WHERE slug = 'hsa-compatible';
