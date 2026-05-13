/*
  # Plans & Pricing Engine for CRM

  ## Overview
  Extends the CRM system with:
  - Lead plan interests tracking (what plans leads are interested in)
  - Health plan pricing integration (connects to existing plan_pricing)
  - Website quote sync (tracks website quote submissions to CRM leads)

  ## Tables
  1. crm_lead_plan_interests - Tracks lead interest in specific plans
  2. crm_lead_health_quotes - Health-specific quotes for leads
  3. crm_website_quote_sync - Sync status for website quote submissions
*/

-- ============================================================================
-- PART 1: Create crm_lead_plan_interests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_lead_plan_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,

  -- Plan reference (using plan_id from existing plans table)
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  plan_name text NOT NULL,  -- Denormalized for display
  plan_code text,           -- e.g., 'SECURE_HSA', 'PREMIUM_CARE'

  -- Interest details
  family_size text NOT NULL DEFAULT 'MO',  -- 'MO', 'M+S', 'M+C', 'M+F'
  interest_level text DEFAULT 'interested' CHECK (
    interest_level IN ('interested', 'quoted', 'applied', 'enrolled', 'declined')
  ),

  -- Quote snapshot (when quoted)
  quoted_monthly_rate numeric(10,2),
  quoted_at timestamptz,
  quote_valid_until timestamptz,

  -- Age info for pricing
  primary_age integer,
  spouse_age integer,
  dependent_ages integer[],

  -- Source tracking
  source text DEFAULT 'manual' CHECK (
    source IN ('manual', 'website_quote', 'agent_quote', 'imported')
  ),
  source_quote_id uuid,  -- Reference to crm_lead_health_quotes if from quote

  -- Notes
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  -- Prevent duplicate entries for same lead/plan/family_size combo
  CONSTRAINT unique_lead_plan_interest UNIQUE (lead_id, plan_id, family_size)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_lead_plan_interests_lead_id ON crm_lead_plan_interests(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_plan_interests_plan_id ON crm_lead_plan_interests(plan_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_plan_interests_interest_level ON crm_lead_plan_interests(interest_level);
CREATE INDEX IF NOT EXISTS idx_crm_lead_plan_interests_created_at ON crm_lead_plan_interests(created_at DESC);
-- RLS
ALTER TABLE crm_lead_plan_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_lead_plan_interests_select" ON crm_lead_plan_interests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_lead_plan_interests_insert" ON crm_lead_plan_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_lead_plan_interests_update" ON crm_lead_plan_interests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_lead_plan_interests_delete" ON crm_lead_plan_interests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- ============================================================================
-- PART 2: Create crm_lead_health_quotes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_lead_health_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  org_id uuid,

  -- Quote identification
  quote_number text NOT NULL,
  status text DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'viewed', 'accepted', 'expired', 'declined')
  ),

  -- Household info (snapshot at quote time)
  household_type text NOT NULL CHECK (
    household_type IN ('individual', 'couple', 'family', 'parent_child')
  ),
  member_count integer DEFAULT 1,
  primary_age integer NOT NULL,
  spouse_age integer,
  dependent_ages integer[],
  state text,
  zip_code text,
  tobacco_user boolean DEFAULT false,

  -- Quote lines (products quoted as JSONB)
  quote_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  /*
  Example structure:
  [
    {
      "plan_id": "uuid",
      "plan_name": "Secure HSA",
      "family_size": "M+S",
      "monthly_rate": 425.00,
      "annual_rate": 5100.00,
      "rate_breakdown": {
        "base": 350,
        "spouse_add": 75,
        "age_factor": 1.0
      }
    }
  ]
  */

  -- Totals
  total_monthly numeric(10,2),
  total_annual numeric(10,2),

  -- Validity period
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date DEFAULT (CURRENT_DATE + INTERVAL '30 days'),

  -- Source tracking
  source text DEFAULT 'crm' CHECK (
    source IN ('crm', 'website', 'api', 'import')
  ),
  website_submission_id uuid,  -- Link to zoho_lead_submissions if from website

  -- Tracking timestamps
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  decline_reason text,

  -- Notes
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_lead_health_quotes_lead_id ON crm_lead_health_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_health_quotes_quote_number ON crm_lead_health_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_crm_lead_health_quotes_status ON crm_lead_health_quotes(status);
CREATE INDEX IF NOT EXISTS idx_crm_lead_health_quotes_created_at ON crm_lead_health_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_lead_health_quotes_valid_until ON crm_lead_health_quotes(valid_until)
  WHERE status NOT IN ('accepted', 'declined', 'expired');
-- Sequence for quote numbers
CREATE SEQUENCE IF NOT EXISTS crm_health_quote_number_seq START 1;
-- RLS
ALTER TABLE crm_lead_health_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_lead_health_quotes_select" ON crm_lead_health_quotes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_lead_health_quotes_insert" ON crm_lead_health_quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_lead_health_quotes_update" ON crm_lead_health_quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_lead_health_quotes_delete" ON crm_lead_health_quotes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- ============================================================================
-- PART 3: Create crm_website_quote_sync table
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_website_quote_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Website submission reference
  website_submission_id uuid NOT NULL REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,

  -- CRM links
  crm_lead_id uuid REFERENCES zoho_lead_submissions(id),
  crm_quote_id uuid REFERENCES crm_lead_health_quotes(id),

  -- Sync status
  sync_status text DEFAULT 'pending' CHECK (
    sync_status IN ('pending', 'synced', 'failed', 'skipped', 'manual_review')
  ),
  sync_error text,
  sync_attempts integer DEFAULT 0,
  last_sync_attempt timestamptz,

  -- Extracted data from website form
  extracted_data jsonb DEFAULT '{}'::jsonb,
  /*
  Example:
  {
    "household_type": "couple",
    "primary_age": 45,
    "spouse_age": 42,
    "state": "TX",
    "zip": "75001",
    "selected_plans": ["Secure HSA", "Premium Care"],
    "estimated_monthly": 425
  }
  */

  -- Metadata
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,

  CONSTRAINT unique_website_sync UNIQUE (website_submission_id)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_website_quote_sync_status ON crm_website_quote_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_crm_website_quote_sync_created_at ON crm_website_quote_sync(created_at DESC);
-- RLS
ALTER TABLE crm_website_quote_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_website_quote_sync_select" ON crm_website_quote_sync
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
CREATE POLICY "crm_website_quote_sync_all" ON crm_website_quote_sync
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
-- ============================================================================
-- PART 4: Helper Functions
-- ============================================================================

-- Function to generate health quote number
CREATE OR REPLACE FUNCTION generate_health_quote_number()
RETURNS text AS $$
DECLARE
  year_prefix text;
  seq_num integer;
BEGIN
  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  seq_num := nextval('crm_health_quote_number_seq');
  RETURN 'HQ-' || year_prefix || '-' || lpad(seq_num::text, 5, '0');
END;
$$ LANGUAGE plpgsql;
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crm_plan_interest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_crm_lead_plan_interests_updated ON crm_lead_plan_interests;
CREATE TRIGGER trigger_crm_lead_plan_interests_updated
  BEFORE UPDATE ON crm_lead_plan_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_plan_interest_updated_at();
DROP TRIGGER IF EXISTS trigger_crm_lead_health_quotes_updated ON crm_lead_health_quotes;
CREATE TRIGGER trigger_crm_lead_health_quotes_updated
  BEFORE UPDATE ON crm_lead_health_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_plan_interest_updated_at();
-- Function to get plan interests for a lead
CREATE OR REPLACE FUNCTION get_lead_plan_interests(p_lead_id uuid)
RETURNS TABLE (
  id uuid,
  plan_id uuid,
  plan_name text,
  plan_code text,
  family_size text,
  interest_level text,
  quoted_monthly_rate numeric,
  quoted_at timestamptz,
  quote_valid_until timestamptz,
  primary_age integer,
  spouse_age integer,
  dependent_ages integer[],
  notes text,
  created_at timestamptz,
  created_by uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lpi.id,
    lpi.plan_id,
    lpi.plan_name,
    lpi.plan_code,
    lpi.family_size,
    lpi.interest_level,
    lpi.quoted_monthly_rate,
    lpi.quoted_at,
    lpi.quote_valid_until,
    lpi.primary_age,
    lpi.spouse_age,
    lpi.dependent_ages,
    lpi.notes,
    lpi.created_at,
    lpi.created_by
  FROM crm_lead_plan_interests lpi
  WHERE lpi.lead_id = p_lead_id
  ORDER BY lpi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get health quotes for a lead
CREATE OR REPLACE FUNCTION get_lead_health_quotes(p_lead_id uuid)
RETURNS TABLE (
  id uuid,
  quote_number text,
  status text,
  household_type text,
  member_count integer,
  primary_age integer,
  total_monthly numeric,
  total_annual numeric,
  valid_until date,
  sent_at timestamptz,
  created_at timestamptz,
  quote_lines jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lhq.id,
    lhq.quote_number,
    lhq.status,
    lhq.household_type,
    lhq.member_count,
    lhq.primary_age,
    lhq.total_monthly,
    lhq.total_annual,
    lhq.valid_until,
    lhq.sent_at,
    lhq.created_at,
    lhq.quote_lines
  FROM crm_lead_health_quotes lhq
  WHERE lhq.lead_id = p_lead_id
  ORDER BY lhq.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get available plans for quoting
CREATE OR REPLACE FUNCTION get_available_health_plans()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  tier text,
  monthly_contribution numeric,
  features jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.tier,
    pp.monthly_contribution,
    p.features
  FROM plans p
  LEFT JOIN plan_pricing pp ON pp.plan_id = p.id
    AND pp.effective_date <= CURRENT_DATE
    AND pp.member_type = 'individual'
  WHERE p.is_active = true
  ORDER BY p.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- PART 5: Add fields to zoho_lead_submissions for plan tracking
-- ============================================================================

-- Add columns to track interested plans directly on lead
ALTER TABLE zoho_lead_submissions
  ADD COLUMN IF NOT EXISTS interested_plans text[],
  ADD COLUMN IF NOT EXISTS quoted_plans text[],
  ADD COLUMN IF NOT EXISTS household_type text,
  ADD COLUMN IF NOT EXISTS primary_age integer,
  ADD COLUMN IF NOT EXISTS spouse_age integer,
  ADD COLUMN IF NOT EXISTS dependent_count integer DEFAULT 0;
-- Index for plan-related queries
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_interested_plans
  ON zoho_lead_submissions USING gin(interested_plans);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_quoted_plans
  ON zoho_lead_submissions USING gin(quoted_plans);
-- ============================================================================
-- PART 6: Grant execute permissions on functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_health_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_plan_interests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_health_quotes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_health_plans() TO authenticated;
