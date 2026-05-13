-- Add missing columns to certifications table (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications' AND column_name = 'name'
  ) THEN
    ALTER TABLE certifications ADD COLUMN name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications' AND column_name = 'description'
  ) THEN
    ALTER TABLE certifications ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications' AND column_name = 'issued_at'
  ) THEN
    ALTER TABLE certifications ADD COLUMN issued_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications' AND column_name = 'issuer'
  ) THEN
    ALTER TABLE certifications ADD COLUMN issuer text DEFAULT 'MPB Health';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications' AND column_name = 'credential_id'
  ) THEN
    ALTER TABLE certifications ADD COLUMN credential_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications' AND column_name = 'certificate_url'
  ) THEN
    ALTER TABLE certifications ADD COLUMN certificate_url text;
  END IF;
END $$;
-- Allow advisors to insert their own certifications (for quiz pass)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'certifications' AND policyname = 'Advisors can insert own certifications'
  ) THEN
    CREATE POLICY "Advisors can insert own certifications"
      ON certifications FOR INSERT
      TO authenticated
      WITH CHECK (advisor_id = auth.uid());
  END IF;
END $$;
