/*
  # Create Advisors Table

  1. New Tables
    - `advisors`
      - `id` (uuid, primary key)
      - `agent_id` (text, unique identifier from CSV)
      - `parent_id` (text, parent agent identifier)
      - `parent_label` (text, parent organization name)
      - `agent_label` (text, agent display label)
      - `first_name` (text)
      - `last_name` (text)
      - `company` (text)
      - `address_1` (text)
      - `address_2` (text, nullable)
      - `city` (text)
      - `state` (text)
      - `zipcode` (text)
      - `county` (text, nullable)
      - `phone_1` (text)
      - `phone_2` (text, nullable)
      - `email` (text)
      - `email_2` (text, nullable)
      - `website_link` (text, nullable)
      - `domain_name` (text, nullable)
      - `agent_type` (text)
      - `agent_type_2` (text, nullable)
      - `agent_type_3` (text, nullable)
      - `status` (text)
      - `license_states` (text, nullable)
      - `active_date` (date, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on `agent_id` for fast lookups
    - Index on `state` for filtering by location
    - Index on `status` for filtering active advisors
    - Index on `agent_type` for category filtering
    - Composite index on `is_active` and `status` for active advisor queries
    - GIN index on `first_name` and `last_name` for text search

  3. Security
    - Enable RLS on `advisors` table
    - Add policy for public read access to active advisors only
*/

-- Create advisors table
CREATE TABLE IF NOT EXISTS advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text UNIQUE NOT NULL,
  parent_id text,
  parent_label text,
  agent_label text,
  first_name text,
  last_name text,
  company text,
  address_1 text,
  address_2 text,
  city text,
  state text,
  zipcode text,
  county text,
  phone_1 text,
  phone_2 text,
  email text,
  email_2 text,
  website_link text,
  domain_name text,
  agent_type text,
  agent_type_2 text,
  agent_type_3 text,
  status text,
  license_states text,
  active_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisors_agent_id ON advisors(agent_id);
CREATE INDEX IF NOT EXISTS idx_advisors_state ON advisors(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_advisors_status ON advisors(status);
CREATE INDEX IF NOT EXISTS idx_advisors_agent_type ON advisors(agent_type);
CREATE INDEX IF NOT EXISTS idx_advisors_active_status ON advisors(is_active, status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_advisors_search ON advisors USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company, '')));

-- Enable Row Level Security
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active advisors
CREATE POLICY "Public can view active advisors"
  ON advisors
  FOR SELECT
  TO public
  USING (is_active = true AND status LIKE '%Active%');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_advisors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER advisors_updated_at
  BEFORE UPDATE ON advisors
  FOR EACH ROW
  EXECUTE FUNCTION update_advisors_updated_at();
