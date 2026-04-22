-- =============================================================================
-- Add cognito_entry_id to form_submissions
-- =============================================================================
-- The advisor-portal FormsService (packages/advisor-core/src/forms/FormsService.ts)
-- selects and inserts a `cognito_entry_id` column on public.form_submissions,
-- but the column was never created. Every GET on the Forms page returns:
--   "column form_submissions.cognito_entry_id does not exist" (HTTP 400)
-- and silently breaks the advisor-portal Forms page.
--
-- Add the column as nullable TEXT so existing rows stay valid and the
-- Cognito Forms webhook can populate it on new submissions.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_submissions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'form_submissions'
        AND column_name = 'cognito_entry_id'
    ) THEN
      ALTER TABLE public.form_submissions
        ADD COLUMN cognito_entry_id TEXT;

      -- Quick lookup for webhook idempotency and per-entry dedupe
      CREATE INDEX IF NOT EXISTS idx_form_submissions_cognito_entry_id
        ON public.form_submissions(cognito_entry_id)
        WHERE cognito_entry_id IS NOT NULL;

      RAISE NOTICE 'Added cognito_entry_id to form_submissions';
    END IF;
  END IF;
END $$;
