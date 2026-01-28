// ============================================================================
// Priority OS Types
// ============================================================================

export interface PriorityLane {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  order_index: number;
  is_default: boolean;
  is_active: boolean;
  auto_rules: AutoRule[];
  max_items: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriorityItem {
  id: string;
  org_id: string;
  lane_id: string;
  lead_id: string | null;
  contact_id: string | null;
  reason: string | null;
  score: number;
  rank: number | null;
  owner_user_id: string | null;
  snoozed_until: string | null;
  snooze_reason: string | null;
  completed_at: string | null;
  completed_reason: string | null;
  source: 'manual' | 'auto' | 'ai';
  source_rule_id: string | null;
  last_action_at: string | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriorityItemWithDetails extends PriorityItem {
  lane: PriorityLane;
  lead?: LeadSummary | null;
  contact?: ContactSummary | null;
}

export interface LeadSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  pipeline_stage: string | null;
  priority: string | null;
  last_contacted_at: string | null;
}

export interface ContactSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export interface ScoringRule {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  trigger_type: ScoringTriggerType;
  conditions: Record<string, unknown>;
  score_delta: number;
  lane_assignment: string | null;
  priority_boost: boolean;
  notify_owner: boolean;
  notification_message: string | null;
  is_active: boolean;
  execution_order: number;
  times_triggered: number;
  last_triggered_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ScoringTriggerType =
  | 'lead_created'
  | 'lead_updated'
  | 'lead_stage_change'
  | 'no_contact_days'
  | 'renewal_window'
  | 'meeting_scheduled'
  | 'meeting_missed'
  | 'form_submitted'
  | 'email_opened'
  | 'email_clicked'
  | 'manual';

export interface AutoRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

export interface PowerListItem {
  item_id: string;
  lane_id: string;
  lane_name: string;
  lane_color: string;
  lead_id: string | null;
  contact_id: string | null;
  person_name: string;
  person_email: string | null;
  reason: string | null;
  score: number;
  rank: number | null;
  last_action_at: string | null;
  next_action_at: string | null;
  snoozed_until: string | null;
}

export interface CreateLaneInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order_index?: number;
  is_default?: boolean;
  auto_rules?: AutoRule[];
  max_items?: number;
}

export interface UpdateLaneInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  order_index?: number;
  is_default?: boolean;
  is_active?: boolean;
  auto_rules?: AutoRule[];
  max_items?: number;
}

export interface AddToLaneInput {
  lane_id: string;
  lead_id?: string;
  contact_id?: string;
  reason?: string;
  owner_user_id?: string;
}

export interface MoveItemInput {
  item_id: string;
  new_lane_id: string;
  new_rank?: number;
}

export interface SnoozeItemInput {
  item_id: string;
  until: Date;
  reason?: string;
}

export interface CreateScoringRuleInput {
  name: string;
  description?: string;
  trigger_type: ScoringTriggerType;
  conditions?: Record<string, unknown>;
  score_delta?: number;
  lane_assignment?: string;
  priority_boost?: boolean;
  notify_owner?: boolean;
  notification_message?: string;
  execution_order?: number;
}
