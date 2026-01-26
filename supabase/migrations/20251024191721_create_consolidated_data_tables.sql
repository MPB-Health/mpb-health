/*
  # Consolidated Data Migration - Move All Static Data to Supabase

  ## Overview
  This migration consolidates all static JSON files and TypeScript data files
  into Supabase database tables, establishing the database as the single source
  of truth for MPB Health application data.

  ## New Tables Created

  ### 1. advisors
  - `id` (uuid, primary key) - Unique identifier
  - `advisor_id` (text, unique) - Legacy advisor identifier
  - `display_name` (text) - Advisor full name
  - `city` (text) - City location
  - `state` (text) - State code (2-letter)
  - `landing_url` (text) - Custom landing page URL
  - `phone` (text) - Contact phone number
  - `email` (text) - Contact email address
  - `is_active` (boolean) - Whether advisor is currently active
  - `order_index` (int) - Display order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp

  ### 2. benefits
  - `id` (uuid, primary key) - Unique identifier
  - `benefit_key` (text, unique) - Identifier key (e.g., 'save_30_60')
  - `icon` (text) - Lucide icon name
  - `title` (text) - Benefit title
  - `description` (text) - Benefit description
  - `angle` (int) - Display angle for radial layout
  - `order_index` (int) - Display order
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)

  ### 3. maternity_coverage
  - `id` (uuid, primary key)
  - `headline` (text) - Main headline
  - `description` (text) - Overview description
  - `waiting_period` (text) - Waiting period information
  - `eligible_plans` (text[]) - Array of eligible plan slugs
  - `highlights` (text[]) - Key highlights array
  - `prenatal_care` (text) - Prenatal care description
  - `delivery_hospital` (text) - Delivery coverage description
  - `postnatal_care` (text) - Postnatal care description
  - `additional_benefits` (text[]) - Additional benefits array
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. maternity_coverage_stages
  - `id` (uuid, primary key)
  - `maternity_coverage_id` (uuid, foreign key)
  - `stage_key` (text) - Stage identifier
  - `icon` (text) - Lucide icon name
  - `title` (text) - Stage title
  - `description` (text) - Stage description
  - `details` (text[]) - Array of detail points
  - `order_index` (int) - Display order
  - `created_at` (timestamptz)

  ### 5. faq_items
  - `id` (uuid, primary key)
  - `title` (text) - Question/accordion title
  - `content_html` (text) - HTML content for answer
  - `category` (text) - Category grouping
  - `order_index` (int) - Display order
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. educational_content
  - `id` (uuid, primary key)
  - `slug` (text, unique) - URL-friendly identifier
  - `title` (text) - Content title
  - `subtitle` (text) - Content subtitle
  - `content_type` (text) - Type: 'how_it_works', 'guide', 'tutorial'
  - `content_data` (jsonb) - Flexible JSON content storage
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. rate_configuration
  - `id` (uuid, primary key)
  - `plan_name` (text) - Plan name
  - `age_band` (text) - Age range (e.g., '18-29')
  - `age_min` (int) - Minimum age
  - `age_max` (int) - Maximum age
  - `monthly_rate` (numeric) - Monthly contribution amount
  - `tobacco_user` (boolean) - Tobacco user rate
  - `effective_date` (date) - When rate becomes effective
  - `end_date` (date, nullable) - When rate expires
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for active data
  - Authenticated admin write access

  ## Indexes
  - Indexes on frequently queried fields for performance
*/

-- ============================================================================
-- 1. ADVISORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id text UNIQUE NOT NULL,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL,
  landing_url text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advisors_state ON advisors(state);
CREATE INDEX IF NOT EXISTS idx_advisors_active ON advisors(is_active);
CREATE INDEX IF NOT EXISTS idx_advisors_advisor_id ON advisors(advisor_id);

ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active advisors"
  ON advisors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage advisors"
  ON advisors FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. BENEFITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_key text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Heart',
  title text NOT NULL,
  description text NOT NULL,
  angle int DEFAULT 0,
  order_index int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benefits_active ON benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_benefits_order ON benefits(order_index);

ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active benefits"
  ON benefits FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage benefits"
  ON benefits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. MATERNITY COVERAGE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS maternity_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  description text NOT NULL,
  waiting_period text NOT NULL,
  eligible_plans text[] DEFAULT '{}',
  highlights text[] DEFAULT '{}',
  prenatal_care text NOT NULL DEFAULT '',
  delivery_hospital text NOT NULL DEFAULT '',
  postnatal_care text NOT NULL DEFAULT '',
  additional_benefits text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maternity_coverage_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maternity_coverage_id uuid NOT NULL REFERENCES maternity_coverage(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  icon text NOT NULL DEFAULT 'Heart',
  title text NOT NULL,
  description text NOT NULL,
  details text[] DEFAULT '{}',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maternity_stages_coverage ON maternity_coverage_stages(maternity_coverage_id);

ALTER TABLE maternity_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE maternity_coverage_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view maternity coverage"
  ON maternity_coverage FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view maternity stages"
  ON maternity_coverage_stages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage maternity coverage"
  ON maternity_coverage FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage maternity stages"
  ON maternity_coverage_stages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. FAQ ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_html text NOT NULL,
  category text DEFAULT 'general',
  order_index int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category);
CREATE INDEX IF NOT EXISTS idx_faq_items_active ON faq_items(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_items_order ON faq_items(order_index);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQ items"
  ON faq_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage FAQ items"
  ON faq_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. EDUCATIONAL CONTENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  content_type text NOT NULL CHECK (content_type IN ('how_it_works', 'guide', 'tutorial', 'overview')),
  content_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_educational_content_slug ON educational_content(slug);
CREATE INDEX IF NOT EXISTS idx_educational_content_type ON educational_content(content_type);
CREATE INDEX IF NOT EXISTS idx_educational_content_active ON educational_content(is_active);

ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active educational content"
  ON educational_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage educational content"
  ON educational_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. RATE CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  age_band text NOT NULL,
  age_min int NOT NULL,
  age_max int NOT NULL,
  monthly_rate numeric NOT NULL,
  tobacco_user boolean DEFAULT false,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_config_plan ON rate_configuration(plan_name);
CREATE INDEX IF NOT EXISTS idx_rate_config_age_band ON rate_configuration(age_band);
CREATE INDEX IF NOT EXISTS idx_rate_config_effective ON rate_configuration(effective_date);
CREATE INDEX IF NOT EXISTS idx_rate_config_active ON rate_configuration(is_active);

ALTER TABLE rate_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rate configuration"
  ON rate_configuration FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage rate configuration"
  ON rate_configuration FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- DATA SEEDING
-- ============================================================================

-- Seed Advisors Data
INSERT INTO advisors (advisor_id, display_name, city, state, landing_url, phone, email, order_index) VALUES
  ('a1', 'Wendy Thompson', 'Boca Raton', 'FL', 'https://joinmympb.com/wendy', '18005551234', 'wendy@mpbhealth.com', 1),
  ('a2', 'Carlos Rivera', 'Miami', 'FL', 'https://joinmympb.com/carlos', '18005551235', 'carlos@mpbhealth.com', 2),
  ('a3', 'Julia Park', 'Austin', 'TX', 'https://joinmympb.com/julia', '18005551236', 'julia@mpbhealth.com', 3),
  ('a4', 'Michael Chen', 'Houston', 'TX', 'https://joinmympb.com/michael', '18005551237', 'michael@mpbhealth.com', 4),
  ('a5', 'Sarah Johnson', 'Phoenix', 'AZ', 'https://joinmympb.com/sarah', '18005551238', 'sarah@mpbhealth.com', 5),
  ('a6', 'David Martinez', 'Tampa', 'FL', 'https://joinmympb.com/david', '18005551239', 'david@mpbhealth.com', 6),
  ('a7', 'Emily White', 'Charlotte', 'NC', 'https://joinmympb.com/emily', '18005551240', 'emily@mpbhealth.com', 7),
  ('a8', 'Robert Brown', 'Atlanta', 'GA', 'https://joinmympb.com/robert', '18005551241', 'robert@mpbhealth.com', 8)
ON CONFLICT (advisor_id) DO NOTHING;

-- Seed Benefits Data
INSERT INTO benefits (benefit_key, icon, title, description, angle, order_index) VALUES
  ('save_30_60', 'DollarSign', 'Save 30–60%', 'Typical families spend far less than traditional insurance.', 0, 1),
  ('community_support', 'Users', 'Real Community Support', 'Your bills are shared by a nationwide member community.', 60, 2),
  ('any_provider', 'Shield', 'Choose Any Provider', 'No networks. See any licensed doctor, anywhere.', 120, 3),
  ('transparent_pricing', 'Heart', 'Transparent Pricing', 'Clear monthly amounts. No surprise bills.', 180, 4),
  ('worldwide_sharing', 'Globe', 'Worldwide Sharing', 'Support that travels with you across the globe.', 240, 5)
ON CONFLICT (benefit_key) DO NOTHING;

-- Seed Maternity Coverage Data
INSERT INTO maternity_coverage (
  headline,
  description,
  waiting_period,
  eligible_plans,
  highlights,
  prenatal_care,
  delivery_hospital,
  postnatal_care,
  additional_benefits
) VALUES (
  'Comprehensive Maternity Coverage for Your Growing Family',
  'Experience peace of mind throughout your pregnancy journey with our comprehensive maternity sharing program. From your first prenatal visit to bringing your baby home, we''re here to help share the costs of this beautiful life milestone.',
  '10-month waiting period if conception occurs after membership begins. No waiting period for accidents or complications.',
  ARRAY['Care+', 'Direct', 'Premium Care', 'Premium HSA'],
  ARRAY[
    'Choose any OB/GYN or midwife nationwide',
    'No network restrictions or referrals required',
    'Transparent sharing amounts with no surprise bills',
    'Support from a caring community of families',
    'Coverage for both routine and high-risk pregnancies'
  ],
  'Prenatal visits and routine care eligible after waiting period',
  'Hospital delivery and associated costs shared according to plan terms',
  'Mother and newborn care covered for standard recovery period',
  ARRAY[
    'Complications during pregnancy are eligible immediately',
    'Emergency services covered regardless of waiting period',
    'NICU care for newborns when medically necessary',
    'Mental health support during and after pregnancy'
  ]
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Seed Maternity Coverage Stages (will need to reference the maternity_coverage id)
DO $$
DECLARE
  coverage_id uuid;
BEGIN
  SELECT id INTO coverage_id FROM maternity_coverage LIMIT 1;

  IF coverage_id IS NOT NULL THEN
    INSERT INTO maternity_coverage_stages (maternity_coverage_id, stage_key, icon, title, description, details, order_index) VALUES
      (coverage_id, 'prenatal', 'Calendar', 'Prenatal Care', 'Regular checkups and monitoring throughout pregnancy', ARRAY[
        'Monthly prenatal visits with your OB/GYN',
        'Routine ultrasounds and screenings',
        'Blood work and diagnostic tests',
        'Nutritional counseling and education'
      ], 1),
      (coverage_id, 'delivery', 'HeartPulse', 'Delivery & Hospital Stay', 'Complete coverage for your delivery experience', ARRAY[
        'Hospital or birthing center costs',
        'Physician and anesthesiologist fees',
        'C-section if medically necessary',
        'Standard postpartum hospital stay'
      ], 2),
      (coverage_id, 'postnatal', 'Home', 'Postnatal Care', 'Support for mother and baby after delivery', ARRAY[
        'Follow-up visits for mother',
        'Newborn hospital care',
        'Lactation consultation',
        'Postpartum wellness checkups'
      ], 3),
      (coverage_id, 'additional', 'Stethoscope', 'Additional Support', 'Extra benefits for comprehensive care', ARRAY[
        'Access to any licensed provider nationwide',
        '24/7 nurse hotline for questions',
        'Complications and emergencies covered',
        'No network restrictions for specialists'
      ], 4)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Seed FAQ Items (from accordionItems.ts)
INSERT INTO faq_items (title, content_html, category, order_index) VALUES
  (
    'Early Roots of Health Sharing',
    '<p>Long before health insurance existed, communities relied on a system of mutual aid. Friends, neighbors, and religious communities would contribute money to help members cover medical expenses. This system emphasized <strong>community support, trust, and shared responsibility</strong>—the core principles that <a href="https://mpb.health/2025/07/02/medical-cost-sharing-alternative-health-insurance/">health sharing</a> still embodies today.</p>',
    'history',
    1
  ),
  (
    'The Rise of Formal Health Sharing Programs',
    '<p>In the 20th century, formal <a href="https://mpb.health/2025/07/02/medical-cost-sharing-alternative-health-insurance/">health sharing</a> programs began to appear. Members could voluntarily contribute a set amount each month to a shared fund that helped cover medical costs for the group. These programs focused on:</p><ul><li>Financial support for unexpected medical costs</li><li>Encouraging preventive care and healthy habits</li><li>Collective responsibility and resource sharing</li></ul><p>This approach provided a practical alternative to traditional insurance, offering predictability and transparency in healthcare costs.</p>',
    'history',
    2
  ),
  (
    'Modern Health Sharing',
    '<p>Today, <a href="https://mpb.health/2025/07/02/medical-cost-sharing-alternative-health-insurance/">health sharing</a> has evolved into structured, membership-based programs. These modern plans combine the benefits of traditional healthcare coverage with the flexibility of community sharing. Key features include:</p><ul><li>Affordable monthly contributions</li><li>Access to virtual care</li><li>Nationwide coverage for eligible medical expenses</li><li>Plans designed for individuals, families, and small businesses</li></ul><p>Modern health sharing maintains the spirit of shared responsibility while making healthcare more accessible and manageable.</p>',
    'history',
    3
  ),
  (
    'Why Health Sharing is Gaining Popularity',
    '<p>With healthcare costs continuing to rise, more people are turning to <a href="https://mpb.health/2025/07/02/medical-cost-sharing-alternative-health-insurance/">health sharing</a> as a practical alternative. Benefits include:</p><ul><li>Lower monthly healthcare costs</li><li>Flexible options to fit different lifestyles and needs</li><li>Support from a community of like-minded individuals</li></ul><p>From humble beginnings in local communities to nationwide programs, <a href="https://mpb.health/2025/07/02/medical-cost-sharing-alternative-health-insurance/">health sharing</a> has a rich history rooted in community, trust, and mutual support.</p>',
    'history',
    4
  ),
  (
    'How MPB Health Memberships Integrate Health Sharing',
    '<p>MPB Health takes the long-standing principles of <a href="https://mpb.health/2025/07/02/medical-cost-sharing-alternative-health-insurance/">health sharing</a> and combines them with modern, flexible membership-based healthcare solutions. Here''s how our memberships work:</p><ul><li><strong>Shared Medical Cost Pool:</strong> Members contribute a monthly share into a collective pool. When a member has an eligible medical need, funds from the pool are used to help pay for those expenses.</li><li><strong>Comprehensive membership options:</strong> By combining flexibility, member empowerment, and plan diversity, members can gain access to urgent, preventive, mental health, telehealth, and pharmacy benefits, all with no lifetime caps and lower costs compared to traditional insurance.</li><li><strong>Virtual Care Integration:</strong> Members can consult with healthcare professionals online, making doctor visits easier and more convenient.</li><li><strong>Supportive Member Community:</strong> MPB Health fosters a network of members who share similar goals of wellness and cost-conscious healthcare, keeping the spirit of mutual support alive.</li></ul><p>By combining <strong>community-based cost sharing</strong> with a <strong>modern membership model</strong>, MPB Health offers an affordable, flexible, and transparent alternative to traditional insurance while maintaining the shared responsibility and trust that define health sharing.</p><p>If you''re curious about how health sharing could be the right solution for you or your family, explore MPB Health''s plans today. <a href="https://mpb.health/">Learn More About MPB Health''s Plans</a></p>',
    'mpb_health',
    5
  )
ON CONFLICT DO NOTHING;

-- Seed Educational Content (How It Works)
INSERT INTO educational_content (slug, title, subtitle, content_type, content_data) VALUES
  (
    'how-mpb-health-works',
    'How MPB Health Works',
    'Follow the steps to see how community medical cost sharing operates.',
    'how_it_works',
    '{
      "steps": [
        {
          "title": "Join MPB Health",
          "body": "Become a member of a community that shares eligible medical costs. Your advisor helps you pick the right membership for your needs."
        },
        {
          "title": "Choose your IUA",
          "body": "Select your Initial Unshareable Amount (IUA): your portion before community sharing begins."
        },
        {
          "title": "Make your Monthly Share",
          "body": "Contribute a fixed monthly share to the community pool. Staying current keeps your eligibility for sharing active."
        },
        {
          "title": "Get Care When You Need It",
          "body": "Start with $0 virtual care for everyday needs; use quality networks for in-person visits and simple pre-notification for major procedures."
        },
        {
          "title": "An Expense Happens",
          "body": "For a new medical need, keep itemized bills and provider details ready for submission."
        },
        {
          "title": "Submit Your Bills",
          "body": "Upload bills through the member portal. Our team reviews them against the sharing guidelines."
        },
        {
          "title": "Community Shares the Cost",
          "body": "After your IUA, the community pool helps pay eligible expenses. You receive clear explanations of what''s shared."
        },
        {
          "title": "Ongoing Support",
          "body": "Advisors, second opinions, and mental health resources support you over time. Consider HSA-compatible options if tax-advantaged saving matters."
        }
      ]
    }'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed Rate Configuration Data
INSERT INTO rate_configuration (plan_name, age_band, age_min, age_max, monthly_rate, effective_date) VALUES
  ('Essentials', '18-29', 18, 29, 95, '2025-01-01'),
  ('Essentials', '30-39', 30, 39, 125, '2025-01-01'),
  ('Essentials', '40-49', 40, 49, 165, '2025-01-01'),
  ('Essentials', '50-59', 50, 59, 215, '2025-01-01'),
  ('Essentials', '60-64', 60, 64, 285, '2025-01-01'),
  ('MEC+ Essentials', '18-29', 18, 29, 115, '2025-01-01'),
  ('MEC+ Essentials', '30-39', 30, 39, 145, '2025-01-01'),
  ('MEC+ Essentials', '40-49', 40, 49, 185, '2025-01-01'),
  ('MEC+ Essentials', '50-59', 50, 59, 235, '2025-01-01'),
  ('MEC+ Essentials', '60-64', 60, 64, 305, '2025-01-01'),
  ('Care Plus', '18-29', 18, 29, 135, '2025-01-01'),
  ('Care Plus', '30-39', 30, 39, 165, '2025-01-01'),
  ('Care Plus', '40-49', 40, 49, 205, '2025-01-01'),
  ('Care Plus', '50-59', 50, 59, 255, '2025-01-01'),
  ('Care Plus', '60-64', 60, 64, 325, '2025-01-01'),
  ('Direct', '18-29', 18, 29, 155, '2025-01-01'),
  ('Direct', '30-39', 30, 39, 185, '2025-01-01'),
  ('Direct', '40-49', 40, 49, 225, '2025-01-01'),
  ('Direct', '50-59', 50, 59, 275, '2025-01-01'),
  ('Direct', '60-64', 60, 64, 345, '2025-01-01'),
  ('Secure HSA', '18-29', 18, 29, 85, '2025-01-01'),
  ('Secure HSA', '30-39', 30, 39, 115, '2025-01-01'),
  ('Secure HSA', '40-49', 40, 49, 155, '2025-01-01'),
  ('Secure HSA', '50-59', 50, 59, 205, '2025-01-01'),
  ('Secure HSA', '60-64', 60, 64, 275, '2025-01-01'),
  ('Premium Care', '18-29', 18, 29, 175, '2025-01-01'),
  ('Premium Care', '30-39', 30, 39, 205, '2025-01-01'),
  ('Premium Care', '40-49', 40, 49, 245, '2025-01-01'),
  ('Premium Care', '50-59', 50, 59, 295, '2025-01-01'),
  ('Premium Care', '60-64', 60, 64, 365, '2025-01-01'),
  ('Premium HSA', '18-29', 18, 29, 165, '2025-01-01'),
  ('Premium HSA', '30-39', 30, 39, 195, '2025-01-01'),
  ('Premium HSA', '40-49', 40, 49, 235, '2025-01-01'),
  ('Premium HSA', '50-59', 50, 59, 285, '2025-01-01'),
  ('Premium HSA', '60-64', 60, 64, 355, '2025-01-01')
ON CONFLICT DO NOTHING;
