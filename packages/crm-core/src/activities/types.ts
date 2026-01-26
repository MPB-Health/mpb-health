// Activity types for lead interactions
export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'sms'
  | 'status_change'
  | 'stage_change'
  | 'assignment'
  | 'task_created'
  | 'task_completed';

// Lead activity record
export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  title: string;
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
}

// Meeting activity metadata
export interface MeetingMetadata {
  location?: string;
  duration_minutes?: number;
  attendees?: string[];
  meeting_url?: string;
}
