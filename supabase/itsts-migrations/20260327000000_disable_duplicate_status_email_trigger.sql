-- Disable duplicate email triggers on status change.
--
-- THREE systems were emailing advisors on every status change:
--   1. Monorepo ticket-proxy → fireNotification("status_changed") → send-ticket-notification (Resend)
--   2. ITSTS trigger trg_status_change_email → ticket_email_notifications queue → process-email-queue (Resend)
--   3. ITSTS trigger notify_advisor_status_change → monorepo send-ticket-notification (Resend)
--
-- Keep only path #1 (monorepo ticket-proxy). Drop #2 and #3.

-- Path #2: queue-based email trigger (actual name: trg_status_change_email)
DROP TRIGGER IF EXISTS trg_status_change_email ON public.tickets;
DROP TRIGGER IF EXISTS trg_send_status_change_email ON public.tickets;
DROP TRIGGER IF EXISTS trigger_status_change_email ON public.tickets;
DROP TRIGGER IF EXISTS ticket_status_change_email ON public.tickets;

-- Path #3: trigger that calls monorepo send-ticket-notification directly
DROP TRIGGER IF EXISTS notify_advisor_status_change ON public.tickets;
