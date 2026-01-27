// Automation trigger types (matches ai_automation_rules.trigger_type CHECK)
export type AutomationTriggerType =
  | 'new_lead'
  | 'stage_change'
  | 'no_activity'
  | 'high_score'
  | 'task_overdue'
  | 'scheduled_time'
  | 'lead_activity';

// Automation action types (matches ai_automation_rules.action_type CHECK)
export type AutomationActionType =
  | 'create_task'
  | 'send_notification'
  | 'assign_lead'
  | 'update_priority'
  | 'send_email'
  | 'send_slack';

// DB row from ai_automation_rules
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: AutomationTriggerType;
  trigger_conditions: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  delay_minutes: number;
  execution_count: number;
  last_executed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AutomationRuleCreateInput {
  name: string;
  description?: string;
  is_active?: boolean;
  trigger_type: AutomationTriggerType;
  trigger_conditions?: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config?: Record<string, unknown>;
  delay_minutes?: number;
}

export interface AutomationRuleUpdateInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  trigger_type?: AutomationTriggerType;
  trigger_conditions?: Record<string, unknown>;
  action_type?: AutomationActionType;
  action_config?: Record<string, unknown>;
  delay_minutes?: number;
}

// Execution log row from automation_execution_log
export interface AutomationExecutionLog {
  id: string;
  rule_id?: string;
  rule_name: string;
  trigger_type: string;
  action_type: string;
  lead_id?: string;
  status: 'success' | 'failed' | 'skipped';
  result_message?: string;
  executed_at: string;
}

// Event passed to the automation engine for evaluation
export interface AutomationEvent {
  type: AutomationTriggerType;
  leadId: string;
  data?: Record<string, unknown>;
}
