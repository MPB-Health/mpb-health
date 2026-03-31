-- ============================================================================
-- Member In-App Notification System
-- Enhances member_notifications with actor/department tracking and creates
-- member_account_events for internal audit trail with auto-notification trigger.
-- ============================================================================

-- 1. Add new columns to existing member_notifications table
-- ============================================================================

ALTER TABLE public.member_notifications
  ADD COLUMN IF NOT EXISTS actor_department text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS related_entity_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id uuid,
  ADD COLUMN IF NOT EXISTS source_event_id uuid,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Drop the restrictive CHECK constraint on notification_type to allow new types
ALTER TABLE public.member_notifications
  DROP CONSTRAINT IF EXISTS member_notifications_notification_type_check;

ALTER TABLE public.member_notifications
  ADD CONSTRAINT member_notifications_notification_type_check CHECK (
    notification_type = ANY (ARRAY[
      'claim_update', 'payment_due', 'payment_received',
      'document_uploaded', 'coverage_update', 'system_alert',
      'message', 'reminder',
      'profile_update', 'billing_update', 'membership_update',
      'eligibility_update', 'dependent_update', 'account_update',
      'support_update', 'operational_update'
    ]::text[])
  );

-- Add FK to member_profiles (missing from baseline)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'member_notifications_member_id_fkey'
  ) THEN
    ALTER TABLE public.member_notifications
      ADD CONSTRAINT member_notifications_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES public.member_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index on created_at for efficient recent-notifications queries
CREATE INDEX IF NOT EXISTS idx_member_notifications_created_at
  ON public.member_notifications USING btree (created_at DESC);

-- Composite index for unread-per-member badge count
CREATE INDEX IF NOT EXISTS idx_member_notifications_unread
  ON public.member_notifications USING btree (member_id, is_read)
  WHERE is_read = false;

-- Index for source_event_id lookups
CREATE INDEX IF NOT EXISTS idx_member_notifications_source_event
  ON public.member_notifications USING btree (source_event_id)
  WHERE source_event_id IS NOT NULL;


-- 2. Create member_account_events table (internal audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_account_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  actor_department text NOT NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  payload_summary jsonb DEFAULT '{}'::jsonb,
  changes jsonb DEFAULT '{}'::jsonb,
  member_notification_id uuid REFERENCES public.member_notifications(id) ON DELETE SET NULL,
  should_notify_member boolean DEFAULT true,
  notification_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.member_account_events OWNER TO postgres;

CREATE INDEX idx_account_events_member ON public.member_account_events USING btree (member_id);
CREATE INDEX idx_account_events_actor ON public.member_account_events USING btree (actor_user_id);
CREATE INDEX idx_account_events_created ON public.member_account_events USING btree (created_at DESC);
CREATE INDEX idx_account_events_type ON public.member_account_events USING btree (event_type);
CREATE INDEX idx_account_events_department ON public.member_account_events USING btree (actor_department);


-- 3. Notification rules configuration table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_notification_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_type text NOT NULL,
  department text NOT NULL DEFAULT '*',
  is_enabled boolean DEFAULT true,
  notification_type text NOT NULL,
  title_template text NOT NULL,
  message_template text NOT NULL,
  priority text DEFAULT 'normal',
  category text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT notification_rules_unique UNIQUE (event_type, department)
);

ALTER TABLE public.member_notification_rules OWNER TO postgres;

-- Seed default rules
INSERT INTO public.member_notification_rules (event_type, department, notification_type, title_template, message_template, priority, category)
VALUES
  ('membership_status_change', '*', 'membership_update', 'Membership Status Updated', 'A change has been made to your membership status by our {{department}} team. Please review your updated information in your Member Portal.', 'high', 'membership'),
  ('profile_update', '*', 'profile_update', 'Profile Information Updated', 'Your profile information has been updated by our {{department}} team. Please review your updated details in your Member Portal.', 'normal', 'profile'),
  ('billing_update', '*', 'billing_update', 'Billing Information Updated', 'Your billing information has been updated by our {{department}} team. Please review the changes in your Member Portal.', 'high', 'billing'),
  ('payment_status_change', '*', 'billing_update', 'Payment Status Updated', 'A payment status update has been made to your account by our {{department}} team. Please check your billing details in your Member Portal.', 'high', 'billing'),
  ('plan_change', '*', 'membership_update', 'Plan Updated', 'Your membership plan has been updated by our {{department}} team. Please review your plan details in your Member Portal.', 'high', 'membership'),
  ('eligibility_change', '*', 'eligibility_update', 'Eligibility Updated', 'Your eligibility information has been updated by our {{department}} team. Please review the changes in your Member Portal.', 'high', 'eligibility'),
  ('dependent_change', '*', 'dependent_update', 'Dependent Information Updated', 'Changes have been made to your dependent information by our {{department}} team. Please review the updates in your Member Portal.', 'normal', 'dependents'),
  ('document_update', '*', 'document_uploaded', 'Document Updated', 'A document on your account has been updated by our {{department}} team. Please review it in your Member Portal.', 'normal', 'documents'),
  ('coverage_change', '*', 'coverage_update', 'Coverage Updated', 'Your coverage information has been updated by our {{department}} team. Please review the changes in your Member Portal.', 'high', 'coverage'),
  ('claim_status_change', '*', 'claim_update', 'Claim Status Updated', 'A claim on your account has been updated by our {{department}} team. Please check your claims in your Member Portal.', 'normal', 'claims'),
  ('advisor_assignment', '*', 'account_update', 'Advisor Assignment Updated', 'Your advisor assignment has been updated by our {{department}} team.', 'normal', 'account'),
  ('account_resolution', '*', 'support_update', 'Account Update', 'An update has been made to your account by our {{department}} team. Please review your account details in your Member Portal.', 'normal', 'support'),
  ('contact_info_change', '*', 'profile_update', 'Contact Information Updated', 'Your contact information has been updated by our {{department}} team. Please verify the changes in your Member Portal.', 'normal', 'profile'),
  ('general_update', '*', 'account_update', 'Account Update', 'An update has been made to your account by our {{department}} team. Please review your account in your Member Portal.', 'normal', 'general')
ON CONFLICT (event_type, department) DO NOTHING;


-- 4. Trigger function: auto-generate member notification from account event
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_member_notification_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule record;
  v_title text;
  v_message text;
  v_dept_label text;
  v_notification_id uuid;
BEGIN
  IF NEW.should_notify_member = false THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_rule
  FROM public.member_notification_rules
  WHERE event_type = NEW.event_type
    AND is_enabled = true
    AND (department = NEW.actor_department OR department = '*')
  ORDER BY
    CASE WHEN department = NEW.actor_department THEN 0 ELSE 1 END
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_dept_label := CASE NEW.actor_department
    WHEN 'billing' THEN 'Billing'
    WHEN 'operations' THEN 'Operations'
    WHEN 'member_services' THEN 'Member Services'
    WHEN 'enrollment' THEN 'Enrollment'
    WHEN 'customer_support' THEN 'Customer Support'
    WHEN 'eligibility' THEN 'Eligibility'
    WHEN 'concierge' THEN 'Concierge'
    WHEN 'administration' THEN 'Administration'
    ELSE initcap(replace(NEW.actor_department, '_', ' '))
  END;

  v_title := replace(v_rule.title_template, '{{department}}', v_dept_label);
  v_message := replace(v_rule.message_template, '{{department}}', v_dept_label);

  INSERT INTO public.member_notifications (
    member_id, notification_type, title, message, priority,
    actor_department, category, related_entity_type, related_entity_id,
    source_event_id, is_read
  ) VALUES (
    NEW.member_id, v_rule.notification_type, v_title, v_message, v_rule.priority,
    NEW.actor_department, v_rule.category, NEW.entity_type, NEW.entity_id,
    NEW.id, false
  )
  RETURNING id INTO v_notification_id;

  UPDATE public.member_account_events
  SET notification_generated = true,
      member_notification_id = v_notification_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_generate_member_notification
  AFTER INSERT ON public.member_account_events
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_member_notification_from_event();


-- 5. RLS Policies
-- ============================================================================

ALTER TABLE public.member_account_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notification_rules ENABLE ROW LEVEL SECURITY;

-- member_account_events: only staff can insert/read via service role or admin functions
-- Members should NEVER see raw events directly.
CREATE POLICY "Staff can read account events"
  ON public.member_account_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
        AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Staff can insert account events"
  ON public.member_account_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
        AND admin_users.status = 'active'
    )
  );

-- member_notification_rules: only admins can manage
CREATE POLICY "Admins can manage notification rules"
  ON public.member_notification_rules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
        AND admin_users.status = 'active'
        AND admin_users.role IN ('admin', 'super_admin')
    )
  );

-- Fix existing member_notifications policies:
-- The baseline has "Members can update own notifications" as FOR SELECT (bug).
-- Drop and recreate as FOR UPDATE so members can mark-as-read.
DROP POLICY IF EXISTS "Members can update own notifications" ON public.member_notifications;

CREATE POLICY "Members can update own notifications"
  ON public.member_notifications FOR UPDATE TO authenticated
  USING (member_id = (SELECT auth.uid()))
  WITH CHECK (member_id = (SELECT auth.uid()));

-- Staff can insert notifications (needed for the trigger via service role,
-- but also for direct admin inserts via authenticated role)
DROP POLICY IF EXISTS "Staff can insert member notifications" ON public.member_notifications;
CREATE POLICY "Staff can insert member notifications"
  ON public.member_notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
        AND admin_users.status = 'active'
    )
  );

-- Staff can read member notifications (for admin notification center)
DROP POLICY IF EXISTS "Staff can read member notifications" ON public.member_notifications;
CREATE POLICY "Staff can read member notifications"
  ON public.member_notifications FOR SELECT TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
        AND admin_users.status = 'active'
    )
  );


-- 6. Grants (no anon access — these tables are staff/member-only)
-- ============================================================================

GRANT SELECT, INSERT ON TABLE public.member_account_events TO authenticated;
GRANT ALL ON TABLE public.member_account_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.member_notification_rules TO authenticated;
GRANT ALL ON TABLE public.member_notification_rules TO service_role;
