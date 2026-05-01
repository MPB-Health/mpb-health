-- ============================================================================
-- Concierge portal: link team-member rows to auth users, add log → roster FK,
-- and enable Realtime so reps see each other's entries without a tab refresh.
--
-- Why: today the new-entry form defaults `teamMember` to rosterTeam[0]
-- (Acelyn) regardless of who's logged in, and only welcome-call@mympb.com
-- has ever inserted rows. Linking auth.users → concierge_team_members lets
-- the form auto-pick the logged-in rep and prevents misattribution.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Roster row → auth user (nullable; shared accounts stay unlinked)
-- ---------------------------------------------------------------------------

ALTER TABLE public.concierge_team_members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS concierge_team_members_user_id_key
  ON public.concierge_team_members (user_id)
  WHERE user_id IS NOT NULL;

-- Backfill the four reps who have individual @mympb.com accounts.
-- Vanessa stays NULL on purpose — she shares welcome-call@mympb.com.
UPDATE public.concierge_team_members ctm
SET user_id = u.id
FROM auth.users u
WHERE ctm.user_id IS NULL
  AND (
    (ctm.name = 'Acelyn Calderon'   AND lower(u.email) = 'acelyn@mympb.com') OR
    (ctm.name = 'Adam Jordano'      AND lower(u.email) = 'adam@mympb.com')   OR
    (ctm.name = 'Ryan Cahill'       AND lower(u.email) = 'ryan@mympb.com')   OR
    (ctm.name = 'Tupac Manzanarez'  AND lower(u.email) = 'tupac@mympb.com')
  );

-- ---------------------------------------------------------------------------
-- 2. Log row → roster (id-based, alongside legacy team_member_name text)
-- ---------------------------------------------------------------------------

ALTER TABLE public.concierge_daily_log_entries
  ADD COLUMN IF NOT EXISTS team_member_id uuid
    REFERENCES public.concierge_team_members (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_concierge_daily_log_entries_team_member_id
  ON public.concierge_daily_log_entries (team_member_id);

-- Backfill from current text values where they match a roster row exactly.
UPDATE public.concierge_daily_log_entries logs
SET team_member_id = ctm.id
FROM public.concierge_team_members ctm
WHERE logs.team_member_id IS NULL
  AND logs.team_member_name = ctm.name;

-- ---------------------------------------------------------------------------
-- 3. Realtime — broadcast changes so every rep's tab updates live
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'concierge_daily_log_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.concierge_daily_log_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'concierge_team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.concierge_team_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'concierge_escalations'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.concierge_escalations;
  END IF;
END
$$;
