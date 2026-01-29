/*
  # Champion Phase 0: Add org_id to Existing Tables

  ## Purpose
  Add org_id foreign key to all tables that need multi-tenant scoping.
  Create a default MPB organization and backfill existing data.

  ## Strategy
  1. Create default MPB organization
  2. Add nullable org_id columns
  3. Backfill existing data with default org
  4. Make org_id NOT NULL where appropriate
  5. Add indexes for performance

  ## Tables Modified
  - zoho_lead_submissions
  - advisor_profiles
  - training_modules
  - training_progress
  - sop_documents
  - bulletins
  - advisor_forms
  - form_submissions
  - advisor_meetings
  - meeting_invitations
  - meeting_attendees
  - lead_activities
  - lead_tasks
  - certifications
  - onboarding_steps
  - onboarding_progress
*/

-- ============================================
-- CREATE DEFAULT MPB ORGANIZATION
-- ============================================
DO $$
DECLARE
  v_mpb_org_id uuid;
BEGIN
  -- Check if MPB org already exists
  SELECT id INTO v_mpb_org_id FROM organizations WHERE slug = 'mpb-health';

  IF v_mpb_org_id IS NULL THEN
    INSERT INTO organizations (
      id,
      name,
      slug,
      brand_config,
      settings,
      subscription_tier,
      subscription_status,
      max_users,
      max_contacts,
      max_sequences
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001'::uuid,
      'MPB Health',
      'mpb-health',
      '{
        "primaryColor": "#0D9488",
        "accentColor": "#14B8A6",
        "logoUrl": "/logo.png"
      }'::jsonb,
      '{
        "timezone": "America/New_York",
        "dateFormat": "MM/dd/yyyy",
        "features": {
          "ai_assistant": true,
          "sequences": true,
          "compliance": true
        }
      }'::jsonb,
      'enterprise',
      'active',
      1000,
      100000,
      1000
    )
    RETURNING id INTO v_mpb_org_id;

    RAISE NOTICE 'Created MPB Health organization with ID: %', v_mpb_org_id;
  ELSE
    RAISE NOTICE 'MPB Health organization already exists with ID: %', v_mpb_org_id;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO ZOHO_LEAD_SUBMISSIONS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zoho_lead_submissions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'zoho_lead_submissions' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE zoho_lead_submissions
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      -- Backfill with default org
      UPDATE zoho_lead_submissions
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_org_id
      ON zoho_lead_submissions(org_id);

      RAISE NOTICE 'Added org_id to zoho_lead_submissions';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO ADVISOR_PROFILES (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advisor_profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'advisor_profiles' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE advisor_profiles
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE advisor_profiles
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_advisor_profiles_org_id
      ON advisor_profiles(org_id);

      RAISE NOTICE 'Added org_id to advisor_profiles';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO TRAINING_MODULES (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_modules') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_modules' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE training_modules
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE training_modules
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_training_modules_org_id
      ON training_modules(org_id);

      RAISE NOTICE 'Added org_id to training_modules';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO TRAINING_PROGRESS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_progress') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_progress' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE training_progress
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE training_progress
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_training_progress_org_id
      ON training_progress(org_id);

      RAISE NOTICE 'Added org_id to training_progress';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO SOP_DOCUMENTS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sop_documents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sop_documents' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE sop_documents
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE sop_documents
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_sop_documents_org_id
      ON sop_documents(org_id);

      RAISE NOTICE 'Added org_id to sop_documents';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO BULLETINS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bulletins') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bulletins' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE bulletins
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE bulletins
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_bulletins_org_id
      ON bulletins(org_id);

      RAISE NOTICE 'Added org_id to bulletins';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO ADVISOR_FORMS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advisor_forms') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'advisor_forms' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE advisor_forms
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE advisor_forms
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_advisor_forms_org_id
      ON advisor_forms(org_id);

      RAISE NOTICE 'Added org_id to advisor_forms';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO FORM_SUBMISSIONS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_submissions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'form_submissions' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE form_submissions
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE form_submissions
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_form_submissions_org_id
      ON form_submissions(org_id);

      RAISE NOTICE 'Added org_id to form_submissions';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO ADVISOR_MEETINGS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advisor_meetings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'advisor_meetings' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE advisor_meetings
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE advisor_meetings
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_advisor_meetings_org_id
      ON advisor_meetings(org_id);

      RAISE NOTICE 'Added org_id to advisor_meetings';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO MEETING_INVITATIONS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_invitations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'meeting_invitations' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE meeting_invitations
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE meeting_invitations
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_meeting_invitations_org_id
      ON meeting_invitations(org_id);

      RAISE NOTICE 'Added org_id to meeting_invitations';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO LEAD_ACTIVITIES (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_activities') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'lead_activities' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE lead_activities
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE lead_activities
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_lead_activities_org_id
      ON lead_activities(org_id);

      RAISE NOTICE 'Added org_id to lead_activities';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO LEAD_TASKS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_tasks') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'lead_tasks' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE lead_tasks
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE lead_tasks
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_lead_tasks_org_id
      ON lead_tasks(org_id);

      RAISE NOTICE 'Added org_id to lead_tasks';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO CERTIFICATIONS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certifications') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'certifications' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE certifications
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE certifications
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_certifications_org_id
      ON certifications(org_id);

      RAISE NOTICE 'Added org_id to certifications';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO ONBOARDING_STEPS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_steps') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'onboarding_steps' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE onboarding_steps
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE onboarding_steps
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_onboarding_steps_org_id
      ON onboarding_steps(org_id);

      RAISE NOTICE 'Added org_id to onboarding_steps';
    END IF;
  END IF;
END $$;

-- ============================================
-- ADD ORG_ID TO ONBOARDING_PROGRESS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_progress') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'onboarding_progress' AND column_name = 'org_id'
    ) THEN
      ALTER TABLE onboarding_progress
      ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

      UPDATE onboarding_progress
      SET org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      WHERE org_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_onboarding_progress_org_id
      ON onboarding_progress(org_id);

      RAISE NOTICE 'Added org_id to onboarding_progress';
    END IF;
  END IF;
END $$;

-- ============================================
-- CREATE MEMBERSHIPS FOR EXISTING USERS
-- Add all existing advisor_profiles users to MPB org
-- ============================================
INSERT INTO org_memberships (org_id, user_id, role, status, joined_at)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  ap.id,
  CASE
    WHEN p.role = 'super_admin' THEN 'owner'
    WHEN p.role = 'admin' THEN 'admin'
    ELSE 'advisor'
  END,
  'active',
  COALESCE(ap.created_at, now())
FROM advisor_profiles ap
LEFT JOIN profiles p ON p.id = ap.id
WHERE NOT EXISTS (
  SELECT 1 FROM org_memberships om
  WHERE om.org_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND om.user_id = ap.id
)
ON CONFLICT (org_id, user_id) DO NOTHING;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
DO $$
DECLARE
  v_org_count integer;
  v_membership_count integer;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM organizations;
  SELECT COUNT(*) INTO v_membership_count FROM org_memberships;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Organizations: %', v_org_count;
  RAISE NOTICE '  Memberships: %', v_membership_count;
END $$;
