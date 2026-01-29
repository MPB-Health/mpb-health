// ============================================================================
// Automation Types — Rules Engine for Champion Advisor OS
// ============================================================================

// ============================================================================
// Trigger Types
// ============================================================================

export type AutomationTriggerType =
  // Lead triggers
  | 'new_lead'
  | 'stage_change'
  | 'no_activity'
  | 'high_score'
  | 'lead_assigned'
  | 'lead_activity'
  | 'field_changed'
  | 'priority_changed'
  | 'tag_added'
  | 'tag_removed'
  | 'form_submitted'
  // Message triggers
  | 'message_received'
  | 'message_opened'
  | 'message_clicked'
  | 'email_bounced'
  // Task triggers
  | 'task_overdue'
  | 'scheduled_time'
  // Sequence triggers
  | 'sequence_enrolled'
  | 'sequence_completed'
  // Meeting triggers
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'meeting_cancelled'
  // Compliance triggers
  | 'compliance_due';

// ============================================================================
// Action Types
// ============================================================================

export type AutomationActionType =
  // Communication
  | 'send_email'
  | 'send_sms'
  | 'send_notification'
  | 'send_slack'
  // Lead management
  | 'assign_lead'
  | 'update_field'
  | 'update_priority'
  | 'add_tag'
  | 'remove_tag'
  | 'add_to_lane'
  | 'remove_from_lane'
  // Task management
  | 'create_task'
  | 'create_meeting'
  // Sequences
  | 'enroll_sequence'
  | 'exit_sequence'
  // Activity
  | 'log_activity'
  // Integrations
  | 'send_webhook'
  // Flow control
  | 'delay'
  | 'branch';

// ============================================================================
// Condition Operators
// ============================================================================

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list'
  | 'between'
  | 'matches_regex';

export type GroupOperator = 'AND' | 'OR';

// ============================================================================
// Execution Status
// ============================================================================

export type ExecutionStatus = 'success' | 'failed' | 'skipped';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

// ============================================================================
// Automation Rule
// ============================================================================

export interface AutomationRule {
  id: string;
  org_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: AutomationTriggerType;
  trigger_conditions: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  delay_minutes: number;
  priority: number;
  run_once: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRuleWithDetails extends AutomationRule {
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  trigger_conditions?: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config?: Record<string, unknown>;
  delay_minutes?: number;
  priority?: number;
  run_once?: boolean;
  is_active?: boolean;
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  trigger_type?: AutomationTriggerType;
  trigger_conditions?: Record<string, unknown>;
  action_type?: AutomationActionType;
  action_config?: Record<string, unknown>;
  delay_minutes?: number;
  priority?: number;
  run_once?: boolean;
  is_active?: boolean;
}

// ============================================================================
// Automation Condition
// ============================================================================

export interface AutomationCondition {
  id: string;
  rule_id: string;
  condition_group: number;
  field_path: string;
  operator: ConditionOperator;
  value: unknown;
  group_operator: GroupOperator;
  created_at: string;
}

export interface CreateConditionInput {
  rule_id: string;
  condition_group?: number;
  field_path: string;
  operator: ConditionOperator;
  value: unknown;
  group_operator?: GroupOperator;
}

// ============================================================================
// Automation Action (for multi-action rules)
// ============================================================================

export interface AutomationAction {
  id: string;
  rule_id: string;
  action_order: number;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  delay_minutes: number;
  condition: Record<string, unknown> | null;
  stop_on_failure: boolean;
  created_at: string;
}

export interface CreateActionInput {
  rule_id: string;
  action_order?: number;
  action_type: AutomationActionType;
  action_config?: Record<string, unknown>;
  delay_minutes?: number;
  condition?: Record<string, unknown>;
  stop_on_failure?: boolean;
}

// ============================================================================
// Automation Template
// ============================================================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  trigger_type: AutomationTriggerType;
  trigger_conditions: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  delay_minutes: number;
  is_popular: boolean;
  use_count: number;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  trigger_type: AutomationTriggerType;
  trigger_conditions?: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config?: Record<string, unknown>;
  delay_minutes?: number;
}

// ============================================================================
// Execution Log
// ============================================================================

export interface ExecutionLog {
  id: string;
  org_id: string;
  rule_id: string;
  rule_name: string;
  trigger_type: string;
  action_type: string;
  lead_id: string | null;
  status: ExecutionStatus;
  result_message: string | null;
  action_id: string | null;
  execution_time_ms: number | null;
  context: Record<string, unknown>;
  executed_at: string;
}

export interface ExecutionLogWithLead extends ExecutionLog {
  lead_name: string | null;
}

// ============================================================================
// Automation Run
// ============================================================================

export interface AutomationRun {
  id: string;
  org_id: string;
  rule_id: string;
  trigger_type: string;
  trigger_entity_type: string | null;
  trigger_entity_id: string | null;
  trigger_data: Record<string, unknown>;
  status: RunStatus;
  started_at: string | null;
  completed_at: string | null;
  actions_total: number;
  actions_completed: number;
  actions_failed: number;
  error_message: string | null;
  created_at: string;
}

// ============================================================================
// Statistics
// ============================================================================

export interface AutomationStats {
  total_rules: number;
  active_rules: number;
  executions_today: number;
  executions_this_week: number;
  success_rate: number | null;
  top_rules: Array<{
    id: string;
    name: string;
    execution_count: number;
    trigger_type: string;
  }>;
  executions_by_status: Record<string, number>;
  executions_by_trigger: Record<string, number>;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface GetRulesParams {
  trigger_type?: AutomationTriggerType;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetExecutionHistoryParams {
  rule_id?: string;
  lead_id?: string;
  status?: ExecutionStatus;
  limit?: number;
  offset?: number;
}

export interface GetTemplatesParams {
  category?: string;
  is_popular?: boolean;
  limit?: number;
}

// ============================================================================
// Trigger Configuration
// ============================================================================

export interface TriggerConfig {
  type: AutomationTriggerType;
  label: string;
  description: string;
  icon: string;
  category: 'lead' | 'message' | 'task' | 'sequence' | 'meeting' | 'compliance' | 'time';
  fields: TriggerField[];
}

export interface TriggerField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'user' | 'sequence';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

// ============================================================================
// Action Configuration
// ============================================================================

export interface ActionConfig {
  type: AutomationActionType;
  label: string;
  description: string;
  icon: string;
  category: 'communication' | 'lead' | 'task' | 'sequence' | 'integration' | 'flow';
  fields: ActionField[];
}

export interface ActionField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean' | 'template' | 'user' | 'sequence' | 'lane';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  default?: unknown;
}
