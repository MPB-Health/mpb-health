/*
  # Advisor Training & Onboarding System

  ## Purpose
  Complete system for advisor authentication, onboarding, training, and certification tracking.

  ## New Tables
  
  ### `advisor_profiles`
  - `id` (uuid, primary key) - References auth.users
  - `first_name` (text) - Advisor first name
  - `last_name` (text) - Advisor last name
  - `email` (text) - Advisor email
  - `phone` (text) - Advisor phone number
  - `specialization` (text) - Advisor specialization (e.g., health, claims, senior)
  - `status` (text) - Status: pending, active, suspended, inactive
  - `onboarding_completed` (boolean) - Whether onboarding is complete
  - `onboarding_completed_at` (timestamptz) - When onboarding was completed
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `metadata` (jsonb) - Additional advisor metadata

  ### `training_modules`
  - `id` (uuid, primary key)
  - `title` (text) - Module title
  - `description` (text) - Module description
  - `category` (text) - Category (onboarding, claims, compliance, product_knowledge, etc.)
  - `content_type` (text) - Type: video, document, interactive, quiz
  - `content_url` (text) - URL to content
  - `duration_minutes` (integer) - Estimated completion time
  - `order_index` (integer) - Display order
  - `is_required` (boolean) - Required for certification
  - `prerequisites` (text[]) - Array of module IDs that must be completed first
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `is_active` (boolean) - Whether module is active

  ### `training_progress`
  - `id` (uuid, primary key)
  - `advisor_id` (uuid) - References advisor_profiles
  - `module_id` (uuid) - References training_modules
  - `status` (text) - Status: not_started, in_progress, completed
  - `started_at` (timestamptz) - When module was started
  - `completed_at` (timestamptz) - When module was completed
  - `time_spent_minutes` (integer) - Actual time spent
  - `quiz_score` (integer) - Quiz score if applicable (0-100)
  - `attempts` (integer) - Number of attempts
  - `notes` (text) - Advisor notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `sop_documents`
  - `id` (uuid, primary key)
  - `title` (text) - SOP title
  - `description` (text) - SOP description
  - `category` (text) - Category (claims_processing, member_support, compliance, etc.)
  - `tags` (text[]) - Searchable tags
  - `content` (text) - Rich text content
  - `file_url` (text) - URL to PDF or document
  - `version` (text) - Version number
  - `is_active` (boolean) - Whether SOP is current
  - `created_by` (uuid) - User who created
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `certifications`
  - `id` (uuid, primary key)
  - `advisor_id` (uuid) - References advisor_profiles
  - `certification_type` (text) - Type (onboarding, claims_specialist, product_expert, etc.)
  - `earned_at` (timestamptz) - When certification was earned
  - `expires_at` (timestamptz) - Expiration date (null if no expiry)
  - `badge_url` (text) - URL to badge image
  - `created_at` (timestamptz)

  ### `onboarding_steps`
  - `id` (uuid, primary key)
  - `title` (text) - Step title
  - `description` (text) - Step description
  - `order_index` (integer) - Display order
  - `required_modules` (text[]) - Array of module IDs required for this step
  - `required_forms` (text[]) - Array of form types required
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### `onboarding_progress`
  - `id` (uuid, primary key)
  - `advisor_id` (uuid) - References advisor_profiles
  - `step_id` (uuid) - References onboarding_steps
  - `status` (text) - Status: pending, in_progress, completed
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Advisors can read their own data
  - Advisors can update their own progress
  - Admin users can manage all content
  - Public access for training module listings (authenticated only)

  ## Indexes
  - Create indexes on foreign keys and commonly queried fields
  - Create indexes for search and filtering operations
*/

-- Create advisor_profiles table
CREATE TABLE IF NOT EXISTS advisor_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  specialization text DEFAULT 'general',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create training_modules table
CREATE TABLE IF NOT EXISTS training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'document', 'interactive', 'quiz', 'external_link')),
  content_url text,
  duration_minutes integer DEFAULT 0,
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT false,
  prerequisites text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create training_progress table
CREATE TABLE IF NOT EXISTS training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  time_spent_minutes integer DEFAULT 0,
  quiz_score integer CHECK (quiz_score >= 0 AND quiz_score <= 100),
  attempts integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(advisor_id, module_id)
);

-- Create sop_documents table
CREATE TABLE IF NOT EXISTS sop_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  content text,
  file_url text,
  version text DEFAULT '1.0',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  badge_url text,
  created_at timestamptz DEFAULT now()
);

-- Create onboarding_steps table
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  required_modules text[] DEFAULT ARRAY[]::text[],
  required_forms text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(advisor_id, step_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advisor_profiles_email ON advisor_profiles(email);
CREATE INDEX IF NOT EXISTS idx_advisor_profiles_status ON advisor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_training_modules_category ON training_modules(category);
CREATE INDEX IF NOT EXISTS idx_training_modules_active ON training_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_training_progress_advisor ON training_progress(advisor_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_module ON training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_status ON training_progress(status);
CREATE INDEX IF NOT EXISTS idx_sop_documents_category ON sop_documents(category);
CREATE INDEX IF NOT EXISTS idx_sop_documents_active ON sop_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_certifications_advisor ON certifications(advisor_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_advisor ON onboarding_progress(advisor_id);

-- Enable Row Level Security
ALTER TABLE advisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policies for advisor_profiles
CREATE POLICY "Advisors can view own profile"
  ON advisor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Advisors can update own profile"
  ON advisor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all advisor profiles"
  ON advisor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage advisor profiles"
  ON advisor_profiles FOR ALL
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

-- Policies for training_modules
CREATE POLICY "Authenticated users can view active training modules"
  ON training_modules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage training modules"
  ON training_modules FOR ALL
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

-- Policies for training_progress
CREATE POLICY "Advisors can view own training progress"
  ON training_progress FOR SELECT
  TO authenticated
  USING (advisor_id = auth.uid());

CREATE POLICY "Advisors can insert own training progress"
  ON training_progress FOR INSERT
  TO authenticated
  WITH CHECK (advisor_id = auth.uid());

CREATE POLICY "Advisors can update own training progress"
  ON training_progress FOR UPDATE
  TO authenticated
  USING (advisor_id = auth.uid())
  WITH CHECK (advisor_id = auth.uid());

CREATE POLICY "Admins can view all training progress"
  ON training_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for sop_documents
CREATE POLICY "Authenticated users can view active SOPs"
  ON sop_documents FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage SOPs"
  ON sop_documents FOR ALL
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

-- Policies for certifications
CREATE POLICY "Advisors can view own certifications"
  ON certifications FOR SELECT
  TO authenticated
  USING (advisor_id = auth.uid());

CREATE POLICY "Admins can manage certifications"
  ON certifications FOR ALL
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

-- Policies for onboarding_steps
CREATE POLICY "Authenticated users can view active onboarding steps"
  ON onboarding_steps FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage onboarding steps"
  ON onboarding_steps FOR ALL
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

-- Policies for onboarding_progress
CREATE POLICY "Advisors can view own onboarding progress"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (advisor_id = auth.uid());

CREATE POLICY "Advisors can insert own onboarding progress"
  ON onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (advisor_id = auth.uid());

CREATE POLICY "Advisors can update own onboarding progress"
  ON onboarding_progress FOR UPDATE
  TO authenticated
  USING (advisor_id = auth.uid())
  WITH CHECK (advisor_id = auth.uid());

CREATE POLICY "Admins can view all onboarding progress"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_advisor_profiles_updated_at
  BEFORE UPDATE ON advisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_progress_updated_at
  BEFORE UPDATE ON training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sop_documents_updated_at
  BEFORE UPDATE ON sop_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();