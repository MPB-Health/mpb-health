// ============================================================================
// Activity & Notifications Types
// ============================================================================

export type ActivityType =
  // Lead activities
  | 'lead_created'
  | 'lead_updated'
  | 'lead_assigned'
  | 'lead_status_changed'
  | 'lead_converted'
  | 'lead_lost'
  // Message activities
  | 'message_sent'
  | 'message_received'
  | 'message_opened'
  // Task activities
  | 'task_created'
  | 'task_completed'
  | 'task_overdue'
  | 'task_assigned'
  // Compliance activities
  | 'compliance_completed'
  | 'compliance_due'
  | 'compliance_violation'
  // Meeting activities
  | 'meeting_scheduled'
  | 'meeting_started'
  | 'meeting_completed'
  | 'meeting_cancelled'
  // Sequence activities
  | 'sequence_enrolled'
  | 'sequence_completed'
  | 'sequence_paused'
  // Team activities
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed'
  // System activities
  | 'goal_achieved'
  | 'milestone_reached'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export type NotificationCategory = 'lead' | 'message' | 'task' | 'compliance' | 'meeting' | 'team' | 'system';

// ============================================================================
// Activity
// ============================================================================

export interface Activity {
  id: string;
  org_id: string;
  actor_id: string | null;
  actor_type: 'user' | 'system' | 'automation';
  activity_type: ActivityType;
  title: string;
  description: string | null;
  lead_id: string | null;
  contact_id: string | null;
  conversation_id: string | null;
  task_id: string | null;
  metadata: Record<string, unknown>;
  is_public: boolean;
  visible_to: string[];
  created_at: string;
}

export interface ActivityWithActor extends Activity {
  actor_name: string;
  actor_avatar: string | null;
  lead_name: string | null;
}

export interface LogActivityInput {
  activity_type: ActivityType;
  title: string;
  description?: string;
  lead_id?: string;
  contact_id?: string;
  conversation_id?: string;
  task_id?: string;
  metadata?: Record<string, unknown>;
  notify_users?: string[];
}

// ============================================================================
// Notification
// ============================================================================

export interface Notification {
  id: string;
  org_id: string;
  user_id: string;
  activity_id: string | null;
  title: string;
  body: string | null;
  icon: string | null;
  action_url: string | null;
  action_label: string | null;
  priority: NotificationPriority;
  category: NotificationCategory | null;
  channels: NotificationChannel[];
  delivered_via: NotificationChannel[];
  is_read: boolean;
  read_at: string | null;
  is_dismissed: boolean;
  dismissed_at: string | null;
  scheduled_for: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  title: string;
  body?: string;
  icon?: string;
  action_url?: string;
  action_label?: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  channels?: NotificationChannel[];
  scheduled_for?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Notification Preferences Override
// ============================================================================

export interface NotificationPreferencesOverride {
  id: string;
  user_id: string;
  org_id: string;
  category: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  min_priority: NotificationPriority;
  created_at: string;
  updated_at: string;
}

export interface UpdatePreferencesOverrideInput {
  category: string;
  in_app_enabled?: boolean;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  min_priority?: NotificationPriority;
}

// ============================================================================
// Activity Subscription
// ============================================================================

export interface ActivitySubscription {
  id: string;
  user_id: string;
  org_id: string;
  entity_type: 'lead' | 'conversation' | 'sequence';
  entity_id: string;
  notify_on_activity: boolean;
  notify_channels: NotificationChannel[];
  created_at: string;
}

// ============================================================================
// Activity Feed Response
// ============================================================================

export interface ActivityFeedItem {
  id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  actor_id: string | null;
  actor_name: string;
  actor_avatar: string | null;
  lead_id: string | null;
  lead_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityFeedParams {
  user_id?: string;
  lead_id?: string;
  activity_types?: ActivityType[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// Notification Summary
// ============================================================================

export interface NotificationSummary {
  total_unread: number;
  by_category: Record<string, number>;
  has_urgent: boolean;
}
