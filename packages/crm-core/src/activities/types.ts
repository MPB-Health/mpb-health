// Activity types for lead interactions — matches DB CHECK constraint.
// Sales Plan 2026 Phase 5 adds `text` (distinct from sms for inbound texts),
// `linkedin_short` (so the weekly widget can split posts 2+2+2), and keeps
// the other LinkedIn subtypes aligned with what the PerformanceReport and
// LeadsSplit reports pivot on.
export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'sms'
  | 'text'
  | 'status_change'
  | 'stage_change'
  | 'assignment'
  | 'task_created'
  | 'task_completed'
  | 'linkedin_connection_sent'
  | 'linkedin_connection_accepted'
  | 'linkedin_message'
  | 'linkedin_post'
  | 'linkedin_engagement'
  | 'linkedin_short'
  | 'presentation'
  | 'networking_event'
  | 'community_outreach'
  | 'referral_requested'
  | 'live_chat'
  | 'crm_lead_entered'
  | 'proposal_sent';

// Lead activity record. `contact_id`, `account_id`, `deal_id` are added by
// the Phase 5 migration so the same row type can back both the lead inspector
// timeline and the contact/account/deal timelines (no more split-brain reads
// from crm_activities vs lead_activities).
export interface LeadActivity {
  id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  account_id?: string | null;
  deal_id?: string | null;
  activity_type: ActivityType;
  title: string;
  subject?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

// Activity creation input
export interface ActivityCreateInput {
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  contact_id?: string;
  account_id?: string;
  deal_id?: string;
  subject?: string;
}

// Call activity metadata
export interface CallMetadata {
  outcome: 'answered' | 'no_answer' | 'voicemail' | 'busy' | 'wrong_number';
  duration_seconds?: number;
  direction?: 'inbound' | 'outbound';
}

// Email activity metadata
export interface EmailMetadata {
  subject: string;
  template_id?: string;
  opened?: boolean;
  clicked?: boolean;
  // Sales Plan 2026: A/B harness stamps these so open/click/reply rollups in
  // `receive-crm-email` + `email-tracking` can update the right variant row.
  ab_test_id?: string;
  ab_variant?: 'a' | 'b';
}

// Meeting activity metadata
export interface MeetingMetadata {
  location?: string;
  duration_minutes?: number;
  attendees?: string[];
  meeting_url?: string;
}
