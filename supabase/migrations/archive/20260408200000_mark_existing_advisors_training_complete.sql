-- Mark every advisor who is still flagged as incomplete as training-complete.
-- The portal also grandfather-exempts accounts created before
-- 2026-04-07T00:00:00Z (see advisor-core trainingGatePolicy + VITE override).
-- This backfill fixes RLS/UI rows that missed the earlier grandfather UPDATE.

UPDATE public.advisor_profiles
SET
  training_completed = true,
  training_completed_at = COALESCE(training_completed_at, now())
WHERE training_completed = false;
