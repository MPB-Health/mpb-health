-- Add training gate columns to advisor_profiles.
-- New advisors default to training_completed = false.
-- Existing advisors are grandfathered in as training_completed = true.
ALTER TABLE advisor_profiles
  ADD COLUMN IF NOT EXISTS training_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_completed_at timestamptz;

-- Grandfather all existing advisors (they were already active before this gate)
UPDATE advisor_profiles
SET training_completed = true,
    training_completed_at = COALESCE(onboarding_completed_at, created_at, now())
WHERE training_completed = false;
