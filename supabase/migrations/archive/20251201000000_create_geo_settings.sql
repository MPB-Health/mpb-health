/*
  # GEO Settings Management System

  ## Overview
  Allows staff to manage geographic service availability without code changes.

  ## Tables Created

  ### geo_state_settings
  - Master table for all US states with support/restriction status
  - `state_code` (text, primary key) - Two-letter state abbreviation
  - `state_name` (text) - Full state name
  - `is_supported` (boolean) - Whether services are available
  - `is_restricted` (boolean) - Whether state has special restrictions
  - `restriction_message` (text) - Custom message for restricted states
  - `not_supported_message` (text) - Custom message for unsupported states
  - `notes` (text) - Internal admin notes
  - `updated_by` (uuid) - Last admin who updated
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ## Security
  - Enable RLS
  - Public read access for state eligibility checks
  - Admin-only write access
*/

-- Create geo_state_settings table
CREATE TABLE IF NOT EXISTS geo_state_settings (
  state_code text PRIMARY KEY,
  state_name text NOT NULL,
  is_supported boolean DEFAULT true,
  is_restricted boolean DEFAULT false,
  restriction_message text,
  not_supported_message text,
  notes text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_geo_state_settings_supported ON geo_state_settings(is_supported);
CREATE INDEX IF NOT EXISTS idx_geo_state_settings_restricted ON geo_state_settings(is_restricted);

-- Enable Row Level Security
ALTER TABLE geo_state_settings ENABLE ROW LEVEL SECURITY;

-- Public can read state settings (needed for eligibility checks)
CREATE POLICY "Public can view geo state settings"
  ON geo_state_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can modify state settings
CREATE POLICY "Admins can manage geo state settings"
  ON geo_state_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Seed all 50 US states with default supported status
INSERT INTO geo_state_settings (state_code, state_name, is_supported, is_restricted) VALUES
  ('AL', 'Alabama', true, false),
  ('AK', 'Alaska', true, false),
  ('AZ', 'Arizona', true, false),
  ('AR', 'Arkansas', true, false),
  ('CA', 'California', true, false),
  ('CO', 'Colorado', true, false),
  ('CT', 'Connecticut', true, false),
  ('DE', 'Delaware', true, false),
  ('FL', 'Florida', true, false),
  ('GA', 'Georgia', true, false),
  ('HI', 'Hawaii', true, false),
  ('ID', 'Idaho', true, false),
  ('IL', 'Illinois', true, false),
  ('IN', 'Indiana', true, false),
  ('IA', 'Iowa', true, false),
  ('KS', 'Kansas', true, false),
  ('KY', 'Kentucky', true, false),
  ('LA', 'Louisiana', true, false),
  ('ME', 'Maine', true, false),
  ('MD', 'Maryland', true, false),
  ('MA', 'Massachusetts', true, false),
  ('MI', 'Michigan', true, false),
  ('MN', 'Minnesota', true, false),
  ('MS', 'Mississippi', true, false),
  ('MO', 'Missouri', true, false),
  ('MT', 'Montana', true, false),
  ('NE', 'Nebraska', true, false),
  ('NV', 'Nevada', true, false),
  ('NH', 'New Hampshire', true, false),
  ('NJ', 'New Jersey', true, false),
  ('NM', 'New Mexico', true, false),
  ('NY', 'New York', true, false),
  ('NC', 'North Carolina', true, false),
  ('ND', 'North Dakota', true, false),
  ('OH', 'Ohio', true, false),
  ('OK', 'Oklahoma', true, false),
  ('OR', 'Oregon', true, false),
  ('PA', 'Pennsylvania', true, false),
  ('RI', 'Rhode Island', true, false),
  ('SC', 'South Carolina', true, false),
  ('SD', 'South Dakota', true, false),
  ('TN', 'Tennessee', true, false),
  ('TX', 'Texas', true, false),
  ('UT', 'Utah', true, false),
  ('VT', 'Vermont', true, false),
  ('VA', 'Virginia', true, false),
  ('WA', 'Washington', true, false),
  ('WV', 'West Virginia', true, false),
  ('WI', 'Wisconsin', true, false),
  ('WY', 'Wyoming', true, false),
  -- US Territories (not supported by default)
  ('DC', 'District of Columbia', true, false),
  ('PR', 'Puerto Rico', false, false),
  ('VI', 'U.S. Virgin Islands', false, false),
  ('GU', 'Guam', false, false),
  ('AS', 'American Samoa', false, false),
  ('MP', 'Northern Mariana Islands', false, false)
ON CONFLICT (state_code) DO NOTHING;

