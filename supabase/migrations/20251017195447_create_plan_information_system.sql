/*
  # MPB Health Plan Information System

  1. New Tables
    - `plans`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `name` (text) - Display name
      - `tagline` (text) - Short description
      - `plan_type` (text) - essentials, mec_essentials, care_plus, direct, secure_hsa
      - `is_medical_cost_sharing` (boolean)
      - `is_mec_compliant` (boolean)
      - `is_hsa_compatible` (boolean)
      - `target_audience` (text) - Who this plan is for
      - `sort_order` (integer) - Display ordering
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `plan_features`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key)
      - `category` (text) - virtual_health, preventive, sharing, discounts, etc.
      - `feature_name` (text)
      - `feature_value` (text) - Description or value
      - `cost` (text) - "$0", "Included", etc.
      - `notes` (text) - Additional details
      - `sort_order` (integer)
      - `created_at` (timestamptz)

    - `plan_sharing_details`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key)
      - `has_lifetime_cap` (boolean)
      - `has_annual_cap` (boolean)
      - `preexisting_lookback_months` (integer)
      - `maternity_waiting_months` (integer)
      - `has_international_coverage` (boolean)
      - `iua_options` (jsonb) - Available IUA amounts
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `plan_pricing`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key)
      - `age_min` (integer)
      - `age_max` (integer)
      - `member_type` (text) - individual, couple, family
      - `iua_amount` (numeric)
      - `monthly_contribution` (numeric)
      - `effective_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for active plans
    - Admin-only write access
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  plan_type text NOT NULL,
  is_medical_cost_sharing boolean DEFAULT false,
  is_mec_compliant boolean DEFAULT false,
  is_hsa_compatible boolean DEFAULT false,
  target_audience text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create plan_features table
CREATE TABLE IF NOT EXISTS plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  category text NOT NULL,
  feature_name text NOT NULL,
  feature_value text,
  cost text,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create plan_sharing_details table
CREATE TABLE IF NOT EXISTS plan_sharing_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  has_lifetime_cap boolean DEFAULT false,
  has_annual_cap boolean DEFAULT false,
  preexisting_lookback_months integer,
  maternity_waiting_months integer,
  has_international_coverage boolean DEFAULT false,
  iua_options jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan_id)
);

-- Create plan_pricing table
CREATE TABLE IF NOT EXISTS plan_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  age_min integer,
  age_max integer,
  member_type text NOT NULL,
  iua_amount numeric,
  monthly_contribution numeric,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_category ON plan_features(category);
CREATE INDEX IF NOT EXISTS idx_plan_sharing_plan_id ON plan_sharing_details(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_pricing_plan_id ON plan_pricing(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_pricing_effective ON plan_pricing(effective_date);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_sharing_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pricing ENABLE ROW LEVEL SECURITY;

-- Public read access for active plans
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view plan features"
  ON plan_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_features.plan_id
      AND plans.is_active = true
    )
  );

CREATE POLICY "Anyone can view plan sharing details"
  ON plan_sharing_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_sharing_details.plan_id
      AND plans.is_active = true
    )
  );

CREATE POLICY "Anyone can view plan pricing"
  ON plan_pricing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_pricing.plan_id
      AND plans.is_active = true
    )
  );

-- Admin write policies (authenticated users with admin role)
CREATE POLICY "Admins can manage plans"
  ON plans FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can manage plan features"
  ON plan_features FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can manage plan sharing details"
  ON plan_sharing_details FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can manage plan pricing"
  ON plan_pricing FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');