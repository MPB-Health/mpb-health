-- ============================================================================
-- Remove "resolved" ticket status — consolidate to "closed" only
--
-- 1. Migrate all existing resolved tickets to closed
-- 2. Update stats RPCs to remove the resolved counter
-- 3. Update the email trigger function to remove resolved case
-- ============================================================================

-- Step 1: Migrate any existing resolved tickets to closed
UPDATE public.tickets
SET status = 'closed', updated_at = now()
WHERE status = 'resolved';

-- Step 2: Update per-user stats RPC (remove resolved counter)
CREATE OR REPLACE FUNCTION public.get_ticket_stats_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total',    COUNT(*),
    'new',      COUNT(*) FILTER (WHERE status = 'new'),
    'open',     COUNT(*) FILTER (WHERE status = 'open'),
    'pending',  COUNT(*) FILTER (WHERE status = 'pending'),
    'closed',   COUNT(*) FILTER (WHERE status = 'closed')
  )
  FROM public.tickets
  WHERE requester_id = p_user_id;
$$;

-- Step 3: Update system-wide stats RPC (remove resolved counter)
CREATE OR REPLACE FUNCTION public.get_all_ticket_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total',    COUNT(*),
    'new',      COUNT(*) FILTER (WHERE status = 'new'),
    'open',     COUNT(*) FILTER (WHERE status = 'open'),
    'pending',  COUNT(*) FILTER (WHERE status = 'pending'),
    'closed',   COUNT(*) FILTER (WHERE status = 'closed')
  )
  FROM public.tickets;
$$;

-- Step 4: Update the status change email function (remove resolved case)
CREATE OR REPLACE FUNCTION send_status_change_email()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_email text;
  v_name text;
  v_ticket_number text;
  v_body_text text;
  v_subject_line text;
  v_status_message text;
  v_notification_type email_notification_type;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_email := COALESCE(NEW.submitter_email, '');
  IF v_email = '' AND NEW.requester_id IS NOT NULL THEN
    SELECT email, full_name INTO v_email, v_name
    FROM profiles WHERE id = NEW.requester_id;
  ELSE
    v_name := COALESCE(NEW.submitter_name, 'Valued Customer');
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  v_name := COALESCE(v_name, NEW.submitter_name, 'Valued Customer');
  v_ticket_number := UPPER(substring(NEW.id::text, 1, 8));

  CASE NEW.status
    WHEN 'open' THEN
      v_status_message := 'Your ticket is now being actively worked on by our support team.';
    WHEN 'pending' THEN
      v_status_message := 'Your ticket is currently pending — we may need additional information from you. Please check your ticket for details.';
    WHEN 'closed' THEN
      v_status_message := 'Your ticket has been closed. If you need further assistance, feel free to submit a new ticket.';
    ELSE
      v_status_message := 'Your ticket status has been updated to: ' || NEW.status::text;
  END CASE;

  CASE NEW.status
    WHEN 'closed' THEN v_notification_type := 'ticket_closed';
    ELSE               v_notification_type := 'ticket_updated';
  END CASE;

  v_subject_line := 'Ticket #' || v_ticket_number || ' — Status Updated to ' || initcap(NEW.status::text);

  v_body_text :=
    'Hello ' || v_name || ',' || chr(10) || chr(10) ||
    v_status_message || chr(10) || chr(10) ||
    'Ticket Details:' || chr(10) ||
    '━━━━━━━━━━━━━━━━━━━━━' || chr(10) ||
    '  Ticket ID: #' || v_ticket_number || chr(10) ||
    '  Subject: ' || NEW.subject || chr(10) ||
    '  Previous Status: ' || COALESCE(initcap(OLD.status::text), 'New') || chr(10) ||
    '  New Status: ' || initcap(NEW.status::text) || chr(10) ||
    '━━━━━━━━━━━━━━━━━━━━━' || chr(10) || chr(10) ||
    'You can view the full details and any messages from our team using the link below.' || chr(10) || chr(10) ||
    'Best regards,' || chr(10) ||
    'MPB Health IT Support Team';

  INSERT INTO ticket_email_notifications (
    ticket_id,
    recipient_email,
    recipient_name,
    notification_type,
    subject,
    body_text,
    status,
    metadata
  ) VALUES (
    NEW.id,
    v_email,
    v_name,
    v_notification_type,
    v_subject_line,
    v_body_text,
    'pending',
    jsonb_build_object(
      'old_status', OLD.status::text,
      'new_status', NEW.status::text,
      'triggered_by', 'status_change'
    )
  );

  RETURN NEW;
END;
$$;
