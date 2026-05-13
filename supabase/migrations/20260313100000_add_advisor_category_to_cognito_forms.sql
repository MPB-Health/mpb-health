-- ============================================================================
-- Migration: Add 'advisor' category to cognito_forms
-- Description: Allow forms to be categorized as advisor (for Advisor Portal Forms)
-- ============================================================================

-- Drop the existing check constraint (PostgreSQL auto-names it {table}_{column}_check)
ALTER TABLE public.cognito_forms
  DROP CONSTRAINT IF EXISTS cognito_forms_category_check;
-- Add new constraint including 'advisor'
ALTER TABLE public.cognito_forms
  ADD CONSTRAINT cognito_forms_category_check
  CHECK (category IN ('employer', 'member', 'advisor'));
