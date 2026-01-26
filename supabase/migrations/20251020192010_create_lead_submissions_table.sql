/*
  # Lead Submissions Table

  1. New Tables
    - `lead_submissions`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone` (text)
      - `household_size` (integer)
      - `current_insurance` (text)
      - `monthly_premium` (text)
      - `coverage_preference` (text)
      - `zip_code` (text)
      - `primary_concern` (text)
      - `contact_preference` (text)
      - `source` (text)
      - `submitted_at` (timestamptz)
      - `created_at` (timestamptz)
      - `status` (text, default 'new')
      - `assigned_to` (uuid, nullable)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on `lead_submissions` table
    - Add policy for authenticated admins to read all leads
    - Add policy for public to insert new leads (no authentication required for form submission)
    - Add policy for assigned staff to update leads they own

  3. Important Notes
    - Public INSERT policy allows anonymous form submissions
    - Only authenticated users can read/update leads
    - Status tracking for lead management workflow
*/

CREATE TABLE IF NOT EXISTS lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  household_size integer DEFAULT 1,
  current_insurance text,
  monthly_premium text,
  coverage_preference text,
  zip_code text,
  primary_concern text,
  contact_preference text DEFAULT 'phone',
  source text DEFAULT 'website_lead_form',
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to uuid REFERENCES auth.users(id),
  notes text
);

ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit leads"
  ON lead_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all leads"
  ON lead_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can update assigned leads"
  ON lead_submissions
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (assigned_to = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE INDEX IF NOT EXISTS idx_lead_submissions_email ON lead_submissions(email);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_status ON lead_submissions(status);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_submitted_at ON lead_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_assigned_to ON lead_submissions(assigned_to);
