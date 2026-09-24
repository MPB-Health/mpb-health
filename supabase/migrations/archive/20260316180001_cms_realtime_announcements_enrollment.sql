-- Add advisor_announcements and advisor_enrollment_links to the Realtime
-- publication so dashboard subscriptions receive live events.
-- Part of the CMS realtime upgrade (companion to 20260316180000).

DO $$
DECLARE
  t text;
  extra_tables text[] := ARRAY[
    'advisor_announcements',
    'advisor_enrollment_links'
  ];
BEGIN
  FOREACH t IN ARRAY extra_tables LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
        RAISE NOTICE 'Added % to supabase_realtime publication', t;
      ELSE
        RAISE NOTICE 'Table % already in supabase_realtime publication, skipping', t;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not add % to supabase_realtime: %', t, SQLERRM;
    END;
  END LOOP;
END $$;
