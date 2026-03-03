-- ============================================
-- Create meeting_attendees view as alias for advisor_meeting_attendees
-- Migration: 20260303110000_create_meeting_attendees_view.sql
-- Purpose: MeetingService and ProfileService query "meeting_attendees" but the
--          physical table is named "advisor_meeting_attendees". This view bridges
--          the gap without renaming the table (which would break existing policies).
-- ============================================

CREATE OR REPLACE VIEW public.meeting_attendees AS
  SELECT * FROM public.advisor_meeting_attendees;

-- Grant the same privileges on the view that exist on the underlying table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated;
GRANT SELECT ON public.meeting_attendees TO anon;
GRANT ALL ON public.meeting_attendees TO service_role;

-- Allow PostgREST to use the view for mutations (requires a primary key hint)
COMMENT ON VIEW public.meeting_attendees IS
  'Compatibility view for advisor_meeting_attendees. Code references meeting_attendees; physical table is advisor_meeting_attendees.';
