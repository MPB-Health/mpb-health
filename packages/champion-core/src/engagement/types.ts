// ============================================================================
// Engagement Inbox Types
// ============================================================================

export interface Conversation {
  id: string;
  org_id: string;
  lead_id: string | null;
  contact_id: string | null;
  participant_name: string;
  participant_email: string | null;
  participant_phone: string | null;
  channel: 'sms' | 'email' | 'both';
  status: 'active' | 'archived' | 'spam';
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_direction: 'inbound' | 'outbound' | null;
  unread_count: number;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithLead extends Conversation {
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    pipeline_stage: string | null;
  } | null;
}

export interface Message {
  id: string;
  org_id: string;
  conversation_id: string;
  channel: 'sms' | 'email';
  direction: 'inbound' | 'outbound';
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  content: string | null;
  from_address: string | null;
  to_address: string | null;
  status: MessageStatus;
  status_updated_at: string | null;
  error_message: string | null;
  external_id: string | null;
  external_provider: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  read_by: string | null;
  sent_by: string | null;
  sent_at: string | null;
  sequence_enrollment_id: string | null;
  sequence_step_id: string | null;
  created_at: string;
}

export type MessageStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'opened'
  | 'clicked';

export interface MessageTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  channel: 'sms' | 'email' | 'both';
  category: string;
  subject: string | null;
  body_text: string;
  body_html: string | null;
  variables: TemplateVariable[];
  times_used: number;
  last_used_at: string | null;
  is_active: boolean;
  created_by: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  default: string;
}

export interface Sequence {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  trigger_type: SequenceTriggerType;
  trigger_conditions: Record<string, unknown>;
  send_window_start: string;
  send_window_end: string;
  send_days: string[];
  timezone: string;
  exit_on_reply: boolean;
  exit_on_meeting_scheduled: boolean;
  exit_on_unsubscribe: boolean;
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  status: SequenceStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SequenceTriggerType =
  | 'manual'
  | 'lead_created'
  | 'stage_change'
  | 'priority_lane'
  | 'tag_added';

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface SequenceWithSteps extends Sequence {
  steps: SequenceStep[];
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  delay_hours: number;
  delay_minutes: number;
  action_type: StepActionType;
  channel: 'sms' | 'email' | null;
  template_id: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  action_config: Record<string, unknown>;
  condition_type: StepConditionType;
  times_executed: number;
  times_skipped: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StepActionType =
  | 'send_email'
  | 'send_sms'
  | 'create_task'
  | 'add_tag'
  | 'move_to_lane'
  | 'notify_owner';

export type StepConditionType =
  | 'always'
  | 'if_no_reply'
  | 'if_no_open'
  | 'if_opened'
  | 'if_clicked';

export interface SequenceEnrollment {
  id: string;
  org_id: string;
  sequence_id: string;
  lead_id: string | null;
  contact_id: string | null;
  current_step: number;
  status: EnrollmentStatus;
  exit_reason: string | null;
  next_step_at: string | null;
  messages_sent: number;
  messages_opened: number;
  messages_clicked: number;
  enrolled_by: string | null;
  enrolled_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'exited'
  | 'failed';

export interface InboxSummary {
  total_conversations: number;
  unread_conversations: number;
  active_sequences: number;
  pending_messages: number;
}

// Input types
export interface SendMessageInput {
  conversation_id: string;
  channel: 'sms' | 'email';
  content: string;
  subject?: string;
  body_html?: string;
  to_address?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  channel: 'sms' | 'email' | 'both';
  category?: string;
  subject?: string;
  body_text: string;
  body_html?: string;
  variables?: TemplateVariable[];
  is_shared?: boolean;
}

export interface CreateSequenceInput {
  name: string;
  description?: string;
  trigger_type?: SequenceTriggerType;
  trigger_conditions?: Record<string, unknown>;
  send_window_start?: string;
  send_window_end?: string;
  send_days?: string[];
  timezone?: string;
  exit_on_reply?: boolean;
  exit_on_meeting_scheduled?: boolean;
  exit_on_unsubscribe?: boolean;
}

export interface CreateStepInput {
  step_number: number;
  delay_days?: number;
  delay_hours?: number;
  delay_minutes?: number;
  action_type: StepActionType;
  channel?: 'sms' | 'email';
  template_id?: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  action_config?: Record<string, unknown>;
  condition_type?: StepConditionType;
}
