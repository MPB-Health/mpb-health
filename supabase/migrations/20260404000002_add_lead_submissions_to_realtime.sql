-- Add lead_submissions to the supabase_realtime publication so that the CRM
-- app's NotificationService (postgres_changes INSERT listener) actually fires.
-- Without this, the channel subscribes successfully but receives zero events.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'lead_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE lead_submissions;
    RAISE NOTICE 'Added lead_submissions to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'lead_submissions already in supabase_realtime publication';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not add lead_submissions to supabase_realtime: %', SQLERRM;
END;
$$;
