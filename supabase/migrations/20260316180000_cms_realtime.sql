-- Enable Supabase Realtime on all CMS tables used by the Advisor Portal.
-- The Admin CMS writes to these tables; the Advisor Portal subscribes to
-- postgres_changes events so that staff edits appear instantly without a
-- page refresh. Tables not in the supabase_realtime publication silently
-- receive no events, which was the root cause of the "changes don't show
-- until refresh" bug.

DO $$
DECLARE
  t text;
  cms_tables text[] := ARRAY[
    'advisor_quick_links',
    'advisor_nav_menu',
    'advisor_content',
    'advisor_videos',
    'cognito_forms',
    'advisor_portal_settings',
    'advisor_learning_paths',
    'training_modules'
  ];
BEGIN
  FOREACH t IN ARRAY cms_tables LOOP
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
