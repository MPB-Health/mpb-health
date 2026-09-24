-- ============================================================================
-- Champion Activity Feed & Notifications Schema
-- ============================================================================

-- Activity types enum
CREATE TYPE activity_type AS ENUM (
  -- Lead activities
  'lead_created',
  'lead_updated',
  'lead_assigned',
  'lead_status_changed',
  'lead_converted',
  'lead_lost',

  -- Message activities
  'message_sent',
  'message_received',
  'message_opened',

  -- Task activities
  'task_created',
  'task_completed',
  'task_overdue',
  'task_assigned',

  -- Compliance activities
  'compliance_completed',
  'compliance_due',
  'compliance_violation',

  -- Meeting activities
  'meeting_scheduled',
  'meeting_started',
  'meeting_completed',
  'meeting_cancelled',

  -- Sequence activities
  'sequence_enrolled',
  'sequence_completed',
  'sequence_paused',

  -- Team activities
  'member_joined',
  'member_left',
  'member_role_changed',

  -- System activities
  'goal_achieved',
  'milestone_reached',
  'system_alert'
);
-- Notification priority enum
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
-- Notification channel enum
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');
-- ============================================================================
-- ACTIVITIES — Activity feed events
-- ============================================================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor (who performed the action)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'automation'

  -- Activity details
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Related entities
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID,
  conversation_id UUID,
  task_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Visibility
  is_public BOOLEAN DEFAULT TRUE, -- Visible to all org members
  visible_to UUID[] DEFAULT '{}', -- Specific users if not public

  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for activity queries
CREATE INDEX idx_activities_org_created ON activities(org_id, created_at DESC);
CREATE INDEX idx_activities_actor ON activities(actor_id, created_at DESC);
CREATE INDEX idx_activities_lead ON activities(lead_id, created_at DESC) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_activities_type ON activities(org_id, activity_type, created_at DESC);
-- ============================================================================
-- NOTIFICATIONS — User notifications
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related activity (optional)
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,

  -- Notification content
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT, -- Icon name or emoji

  -- Links
  action_url TEXT,
  action_label TEXT,

  -- Priority and type
  priority notification_priority DEFAULT 'normal',
  category TEXT, -- 'lead', 'message', 'task', 'compliance', 'team', 'system'

  -- Delivery tracking
  channels notification_channel[] DEFAULT '{in_app}',
  delivered_via notification_channel[] DEFAULT '{}',

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for notification queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE AND is_dismissed = FALSE;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL AND scheduled_for > NOW();
CREATE INDEX idx_notifications_category ON notifications(user_id, category, created_at DESC);
-- ============================================================================
-- NOTIFICATION PREFERENCES OVERRIDES — Per-category preferences
-- ============================================================================
CREATE TABLE notification_preferences_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Category-specific settings
  category TEXT NOT NULL,

  -- Channel preferences
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,

  -- Priority threshold (only notify if >= this priority)
  min_priority notification_priority DEFAULT 'low',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_category_override UNIQUE (user_id, org_id, category)
);
-- ============================================================================
-- ACTIVITY SUBSCRIPTIONS — Subscribe to specific entities
-- ============================================================================
CREATE TABLE activity_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Entity to subscribe to
  entity_type TEXT NOT NULL, -- 'lead', 'conversation', 'sequence'
  entity_id UUID NOT NULL,

  -- Notification preferences for this subscription
  notify_on_activity BOOLEAN DEFAULT TRUE,
  notify_channels notification_channel[] DEFAULT '{in_app}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_entity_subscription UNIQUE (user_id, entity_type, entity_id)
);
CREATE INDEX idx_activity_subscriptions_user ON activity_subscriptions(user_id);
CREATE INDEX idx_activity_subscriptions_entity ON activity_subscriptions(entity_type, entity_id);
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_subscriptions ENABLE ROW LEVEL SECURITY;
-- Activities policies
CREATE POLICY "Users can view org activities" ON activities
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    AND (is_public = TRUE OR auth.uid() = ANY(visible_to) OR actor_id = auth.uid())
  );
CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    OR auth.uid() IS NOT NULL
  );
-- Notification preferences overrides policies
CREATE POLICY "Users can manage own overrides" ON notification_preferences_overrides
  FOR ALL USING (user_id = auth.uid());
-- Activity subscriptions policies
CREATE POLICY "Users can manage own subscriptions" ON activity_subscriptions
  FOR ALL USING (user_id = auth.uid());
-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to log an activity and optionally create notifications
CREATE OR REPLACE FUNCTION log_activity(
  p_org_id UUID,
  p_actor_id UUID,
  p_activity_type activity_type,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_notify_users UUID[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
  v_user_id UUID;
BEGIN
  -- Create activity
  INSERT INTO activities (
    org_id, actor_id, activity_type, title, description, lead_id, metadata
  ) VALUES (
    p_org_id, p_actor_id, p_activity_type, p_title, p_description, p_lead_id, p_metadata
  ) RETURNING id INTO v_activity_id;

  -- Create notifications for specified users
  IF array_length(p_notify_users, 1) > 0 THEN
    FOREACH v_user_id IN ARRAY p_notify_users
    LOOP
      -- Don't notify the actor
      IF v_user_id != p_actor_id THEN
        INSERT INTO notifications (
          org_id, user_id, activity_id, title, body, category,
          action_url, metadata
        ) VALUES (
          p_org_id,
          v_user_id,
          v_activity_id,
          p_title,
          p_description,
          CASE
            WHEN p_activity_type::TEXT LIKE 'lead_%' THEN 'lead'
            WHEN p_activity_type::TEXT LIKE 'message_%' THEN 'message'
            WHEN p_activity_type::TEXT LIKE 'task_%' THEN 'task'
            WHEN p_activity_type::TEXT LIKE 'compliance_%' THEN 'compliance'
            WHEN p_activity_type::TEXT LIKE 'meeting_%' THEN 'meeting'
            WHEN p_activity_type::TEXT LIKE 'member_%' THEN 'team'
            ELSE 'system'
          END,
          CASE
            WHEN p_lead_id IS NOT NULL THEN '/leads/' || p_lead_id
            ELSE NULL
          END,
          p_metadata
        );
      END IF;
    END LOOP;
  END IF;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
      AND is_dismissed = FALSE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND is_read = FALSE;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get activity feed with pagination
CREATE OR REPLACE FUNCTION get_activity_feed(
  p_org_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_activity_types activity_type[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  activity_type activity_type,
  title TEXT,
  description TEXT,
  actor_id UUID,
  actor_name TEXT,
  actor_avatar TEXT,
  lead_id UUID,
  lead_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.activity_type,
    a.title,
    a.description,
    a.actor_id,
    COALESCE(ap.first_name || ' ' || ap.last_name, 'System') AS actor_name,
    ap.avatar_url AS actor_avatar,
    a.lead_id,
    l.first_name || ' ' || l.last_name AS lead_name,
    a.metadata,
    a.created_at
  FROM activities a
  LEFT JOIN advisor_profiles ap ON ap.user_id = a.actor_id
  LEFT JOIN leads l ON l.id = a.lead_id
  WHERE a.org_id = p_org_id
    AND (p_user_id IS NULL OR a.actor_id = p_user_id)
    AND (p_lead_id IS NULL OR a.lead_id = p_lead_id)
    AND (p_activity_types IS NULL OR a.activity_type = ANY(p_activity_types))
    AND (a.is_public = TRUE OR auth.uid() = ANY(a.visible_to) OR a.actor_id = auth.uid())
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to subscribe to entity activities
CREATE OR REPLACE FUNCTION subscribe_to_entity(
  p_user_id UUID,
  p_org_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_sub_id UUID;
BEGIN
  INSERT INTO activity_subscriptions (user_id, org_id, entity_type, entity_id)
  VALUES (p_user_id, p_org_id, p_entity_type, p_entity_id)
  ON CONFLICT (user_id, entity_type, entity_id) DO UPDATE
  SET notify_on_activity = TRUE
  RETURNING id INTO v_sub_id;

  RETURN v_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_notification_preferences_overrides_updated_at
  BEFORE UPDATE ON notification_preferences_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
