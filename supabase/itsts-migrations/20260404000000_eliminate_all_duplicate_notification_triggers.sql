-- ============================================================================
-- Eliminate duplicate notification triggers on the ITSTS database
-- ============================================================================
--
-- PROBLEM:
-- Staff/advisors were receiving 2-6x notifications per ticket event because
-- multiple independent systems fired for the same action:
--
--   Path A (KEEP): ITSTS DB triggers → send-ticket-notification (monorepo)
--                  The monorepo's send-ticket-notification handles:
--                  email (via Resend), in-app bell, and push for advisors.
--
--   Path B (DROP): ITSTS DB triggers → ticket_email_notifications queue
--                  → process-email-queue → Resend emails
--                  Duplicates the email that send-ticket-notification handles.
--
--   Path C (DROP): ITSTS DB triggers → notify-staff edge function
--                  → Resend emails + push notifications to staff
--                  Duplicates notification delivery.
--
--   Path D (DROP): ITSTS DB triggers → ticket-webhook-receiver (monorepo)
--                  Inserts into `notifications` table (deprecated second
--                  in-app table). The receiver is already disabled on the
--                  monorepo side and returns 200 OK with no writes.
--
-- SOLUTION:
-- Keep ONLY Path A — the ITSTS cross-project triggers that call
-- send-ticket-notification on the monorepo. Drop Paths B, C, and D.
--
-- The monorepo's send-ticket-notification sends email for staff_replied and
-- status_changed events, plus in-app + push for all events. ITSTS must NOT
-- also send its own emails or push notifications for these events.
-- ============================================================================

-- ── 1. Drop ITSTS's own email notification triggers on tickets ────────────
-- These fire send_ticket_confirmation_email / send_status_change_email which
-- queue into ticket_email_notifications → process-email-queue → Resend.
-- Duplicates the email that send-ticket-notification already handles.

DROP TRIGGER IF EXISTS trg_ticket_confirmation_email ON public.tickets;
DROP TRIGGER IF EXISTS trg_send_ticket_confirmation ON public.tickets;
DROP TRIGGER IF EXISTS trg_send_confirmation_email ON public.tickets;
DROP TRIGGER IF EXISTS ticket_confirmation_email ON public.tickets;

DROP TRIGGER IF EXISTS trg_status_change_email ON public.tickets;
DROP TRIGGER IF EXISTS trg_send_status_change_email ON public.tickets;
DROP TRIGGER IF EXISTS trigger_status_change_email ON public.tickets;
DROP TRIGGER IF EXISTS ticket_status_change_email ON public.tickets;

-- ── 2. Drop ITSTS's own staff notification triggers on tickets ────────────
-- These call notify-staff edge function via pg_net, which sends push + email
-- to staff. The monorepo admin portal handles staff-side notifications.

DROP TRIGGER IF EXISTS trg_notify_staff_on_ticket_created ON public.tickets;
DROP TRIGGER IF EXISTS _notify_staff_on_ticket_created ON public.tickets;
DROP TRIGGER IF EXISTS notify_staff_on_ticket_created ON public.tickets;
DROP TRIGGER IF EXISTS notify_staff_ticket_created ON public.tickets;

DROP TRIGGER IF EXISTS trg_notify_staff_on_ticket_updated ON public.tickets;
DROP TRIGGER IF EXISTS _notify_staff_on_ticket_updated ON public.tickets;
DROP TRIGGER IF EXISTS notify_staff_on_ticket_updated ON public.tickets;
DROP TRIGGER IF EXISTS notify_staff_ticket_updated ON public.tickets;

-- ── 3. Drop ITSTS's own email triggers on ticket_comments ─────────────────
-- These fire on new comments and queue emails, duplicating what the monorepo's
-- send-ticket-notification already handles for "staff_replied"/"advisor_replied".

DROP TRIGGER IF EXISTS trg_send_email_notification_on_comment ON public.ticket_comments;
DROP TRIGGER IF EXISTS send_email_notification_on_comment ON public.ticket_comments;
DROP TRIGGER IF EXISTS trg_comment_email_notification ON public.ticket_comments;
DROP TRIGGER IF EXISTS ticket_comment_email_notification ON public.ticket_comments;

DROP TRIGGER IF EXISTS trg_notify_staff_on_comment ON public.ticket_comments;
DROP TRIGGER IF EXISTS _notify_staff_on_comment ON public.ticket_comments;
DROP TRIGGER IF EXISTS notify_staff_on_comment ON public.ticket_comments;
DROP TRIGGER IF EXISTS notify_staff_comment ON public.ticket_comments;

-- ── 4. PRESERVE cross-project notification triggers ───────────────────────
-- These triggers fire HTTP POST to the monorepo's send-ticket-notification
-- edge function when staff reply or change ticket status. They are the
-- ONLY notification path from ITSTS → advisor portal. DO NOT DROP THESE.
--
-- Preserved triggers (on tickets table):
--   • notify_advisor_status_change / trg_notify_advisor_on_status_change
--     → fires on status/priority change → POST to send-ticket-notification
--
-- Preserved triggers (on ticket_comments table):
--   • notify_advisor_on_comment / trg_notify_advisor_on_comment
--     → fires on new non-internal comment → POST to send-ticket-notification

-- ── 5. Drop the orphaned trigger FUNCTIONS for dropped triggers ───────────
-- Only drop functions for triggers we removed above (sections 1-3).
-- Preserve functions used by the cross-project triggers in section 4.

DROP FUNCTION IF EXISTS public.send_ticket_confirmation_email() CASCADE;
DROP FUNCTION IF EXISTS public.send_status_change_email() CASCADE;
DROP FUNCTION IF EXISTS public.send_email_notification_on_comment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_staff_on_ticket_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_staff_on_ticket_updated() CASCADE;
DROP FUNCTION IF EXISTS public.notify_staff_on_comment() CASCADE;

DROP FUNCTION IF EXISTS public._notify_staff_on_ticket_created() CASCADE;
DROP FUNCTION IF EXISTS public._notify_staff_on_ticket_updated() CASCADE;
DROP FUNCTION IF EXISTS public._notify_staff_on_comment() CASCADE;

-- DO NOT DROP these — they power the cross-project triggers:
--   public.notify_advisor_status_change()
--   public._notify_advisor_on_status_change()
--   public.notify_advisor_on_comment()
--   public._notify_advisor_on_comment()

-- ============================================================================
-- After this migration, the notification paths are:
--
--   1. ITSTS cross-project triggers (preserved above)
--        → POST to {MONOREPO_URL}/functions/v1/send-ticket-notification
--        → send-ticket-notification sends email (staff_replied, status_changed)
--        → send-ticket-notification inserts notification_events (in-app bell)
--        → send-ticket-notification calls push-service (browser/PWA push)
--
--   2. ticket-webhook-receiver (monorepo side — already disabled, returns 200)
--        → No writes, no notifications (silent sink for legacy callers)
--
-- ITSTS no longer independently sends emails, pushes, or queues notifications.
-- All advisor-facing notifications flow through the monorepo's single pipeline.
-- ============================================================================
