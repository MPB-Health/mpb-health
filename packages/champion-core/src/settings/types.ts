// ============================================================================
// Settings & Admin Types
// ============================================================================

export interface BusinessHours {
  day: number; // 0-6, Sunday-Saturday
  enabled: boolean;
  start?: string; // HH:mm format
  end?: string;
}

export interface BusinessAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface OrganizationSettings {
  id: string;
  org_id: string;

  // Branding
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;

  // Business Info
  business_name: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_address: BusinessAddress | null;
  website_url: string | null;

  // Defaults
  default_timezone: string;
  default_language: string;
  date_format: string;
  time_format: '12h' | '24h';
  currency: string;

  // Business Hours
  business_hours: BusinessHours[];

  // Features
  features_enabled: Record<string, boolean>;

  // Messaging defaults
  default_sms_sender_id: string | null;
  default_email_from_name: string | null;
  default_email_from_address: string | null;
  email_signature: string | null;

  // Compliance
  require_message_approval: boolean;
  message_disclaimer: string | null;
  hipaa_mode: boolean;

  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  org_id: string;

  // Display
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  compact_mode: boolean;
  timezone: string | null;
  language: string | null;

  // Dashboard
  dashboard_layout: Record<string, unknown>;
  pinned_items: string[];

  // Power List
  default_lane_id: string | null;
  power_list_view: 'cards' | 'list' | 'kanban';
  auto_advance_after_complete: boolean;

  // Inbox
  inbox_preview_lines: number;
  inbox_group_by: 'none' | 'lead' | 'channel';
  inbox_sort_order: 'newest' | 'oldest' | 'unread';

  // Shortcuts
  keyboard_shortcuts_enabled: boolean;

  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  org_id: string;

  // Email
  email_enabled: boolean;
  email_new_lead: boolean;
  email_new_message: boolean;
  email_task_reminder: boolean;
  email_compliance_alert: boolean;
  email_weekly_digest: boolean;
  email_marketing: boolean;

  // SMS
  sms_enabled: boolean;
  sms_phone_number: string | null;
  sms_urgent_only: boolean;

  // Push
  push_enabled: boolean;
  push_new_lead: boolean;
  push_new_message: boolean;
  push_task_reminder: boolean;

  // In-app
  in_app_enabled: boolean;
  in_app_sound: boolean;
  in_app_desktop: boolean;

  // Digest
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  digest_time: string;
  digest_day: number;

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string | null;

  created_at: string;
  updated_at: string;
}

export type IntegrationType = 'crm' | 'email' | 'sms' | 'calendar' | 'storage' | 'webhook';
export type SyncDirection = 'inbound' | 'outbound' | 'both';

export interface IntegrationConfig {
  id: string;
  org_id: string;

  // Info
  integration_type: IntegrationType;
  provider: string;
  name: string;
  description: string | null;

  // Status
  is_enabled: boolean;
  is_connected: boolean;
  last_sync_at: string | null;
  last_error: string | null;

  // Configuration
  config: Record<string, unknown>;

  // Webhook
  webhook_url: string | null;
  webhook_secret: string | null;

  // Sync
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  sync_direction: SyncDirection;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  org_id: string;

  // Info
  name: string;
  description: string | null;
  key_prefix: string;

  // Permissions
  scopes: string[];

  // Status
  is_active: boolean;
  last_used_at: string | null;
  use_count: number;

  // Limits
  rate_limit_per_minute: number;
  rate_limit_per_day: number;

  // Expiration
  expires_at: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface OrganizationInvitation {
  id: string;
  org_id: string;

  // Details
  email: string;
  role: string;
  message: string | null;

  // Token
  token: string;
  token_expires_at: string;

  // Status
  status: InvitationStatus;
  accepted_at: string | null;
  accepted_by: string | null;

  invited_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  joined_at: string;
  last_active_at: string | null;
}

// Input types
export interface UpdateOrgSettingsInput {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  business_name?: string;
  business_phone?: string;
  business_email?: string;
  business_address?: BusinessAddress;
  website_url?: string;
  default_timezone?: string;
  default_language?: string;
  date_format?: string;
  time_format?: '12h' | '24h';
  currency?: string;
  business_hours?: BusinessHours[];
  features_enabled?: Record<string, boolean>;
  default_sms_sender_id?: string;
  default_email_from_name?: string;
  default_email_from_address?: string;
  email_signature?: string;
  require_message_approval?: boolean;
  message_disclaimer?: string;
  hipaa_mode?: boolean;
}

export interface UpdateUserPreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  sidebar_collapsed?: boolean;
  compact_mode?: boolean;
  timezone?: string;
  language?: string;
  dashboard_layout?: Record<string, unknown>;
  pinned_items?: string[];
  default_lane_id?: string;
  power_list_view?: 'cards' | 'list' | 'kanban';
  auto_advance_after_complete?: boolean;
  inbox_preview_lines?: number;
  inbox_group_by?: 'none' | 'lead' | 'channel';
  inbox_sort_order?: 'newest' | 'oldest' | 'unread';
  keyboard_shortcuts_enabled?: boolean;
}

export interface UpdateNotificationSettingsInput {
  email_enabled?: boolean;
  email_new_lead?: boolean;
  email_new_message?: boolean;
  email_task_reminder?: boolean;
  email_compliance_alert?: boolean;
  email_weekly_digest?: boolean;
  email_marketing?: boolean;
  sms_enabled?: boolean;
  sms_phone_number?: string;
  sms_urgent_only?: boolean;
  push_enabled?: boolean;
  push_new_lead?: boolean;
  push_new_message?: boolean;
  push_task_reminder?: boolean;
  in_app_enabled?: boolean;
  in_app_sound?: boolean;
  in_app_desktop?: boolean;
  digest_frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  digest_time?: string;
  digest_day?: number;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
}

export interface CreateInvitationInput {
  email: string;
  role: string;
  message?: string;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scopes: string[];
  expires_in_days?: number;
}
