// ============================================================================
// Automation Service — Rules Engine for Champion Advisor OS
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  AutomationRule,
  AutomationRuleWithDetails,
  AutomationCondition,
  AutomationAction,
  AutomationTemplate,
  ExecutionLog,
  ExecutionLogWithLead,
  AutomationRun,
  AutomationStats,
  CreateRuleInput,
  UpdateRuleInput,
  CreateConditionInput,
  CreateActionInput,
  CreateTemplateInput,
  GetRulesParams,
  GetExecutionHistoryParams,
  GetTemplatesParams,
  AutomationTriggerType,
  AutomationActionType,
  TriggerConfig,
  ActionConfig,
} from './types';

// ============================================================================
// Trigger Configuration
// ============================================================================

export const TRIGGER_CONFIGS: Record<AutomationTriggerType, TriggerConfig> = {
  // Lead triggers
  new_lead: {
    type: 'new_lead',
    label: 'New Lead Created',
    description: 'Triggers when a new lead is submitted',
    icon: 'user-plus',
    category: 'lead',
    fields: [],
  },
  stage_change: {
    type: 'stage_change',
    label: 'Lead Stage Changed',
    description: 'Triggers when lead moves to a different stage',
    icon: 'arrow-right',
    category: 'lead',
    fields: [
      { key: 'from_stage', label: 'From Stage', type: 'select', options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'converted', label: 'Converted' },
        { value: 'lost', label: 'Lost' },
      ]},
      { key: 'to_stage', label: 'To Stage', type: 'select', required: true, options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'converted', label: 'Converted' },
        { value: 'lost', label: 'Lost' },
      ]},
    ],
  },
  no_activity: {
    type: 'no_activity',
    label: 'No Activity',
    description: 'Triggers when lead has no activity for specified days',
    icon: 'clock',
    category: 'lead',
    fields: [
      { key: 'days_inactive', label: 'Days Inactive', type: 'number', required: true, placeholder: '3' },
      { key: 'stages', label: 'In Stages', type: 'multiselect', options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
      ]},
    ],
  },
  high_score: {
    type: 'high_score',
    label: 'High Lead Score',
    description: 'Triggers when lead score exceeds threshold',
    icon: 'trending-up',
    category: 'lead',
    fields: [
      { key: 'min_score', label: 'Minimum Score', type: 'number', required: true, placeholder: '80' },
    ],
  },
  lead_assigned: {
    type: 'lead_assigned',
    label: 'Lead Assigned',
    description: 'Triggers when a lead is assigned to someone',
    icon: 'user-check',
    category: 'lead',
    fields: [
      { key: 'to_user', label: 'Assigned To (optional)', type: 'user' },
    ],
  },
  lead_activity: {
    type: 'lead_activity',
    label: 'Lead Activity',
    description: 'Triggers when specific activity occurs on a lead',
    icon: 'activity',
    category: 'lead',
    fields: [
      { key: 'activity_type', label: 'Activity Type', type: 'select', options: [
        { value: 'any', label: 'Any Activity' },
        { value: 'email_opened', label: 'Email Opened' },
        { value: 'link_clicked', label: 'Link Clicked' },
        { value: 'page_visited', label: 'Page Visited' },
      ]},
    ],
  },
  field_changed: {
    type: 'field_changed',
    label: 'Field Changed',
    description: 'Triggers when a specific field value changes',
    icon: 'edit',
    category: 'lead',
    fields: [
      { key: 'field', label: 'Field', type: 'select', required: true, options: [
        { value: 'status', label: 'Status' },
        { value: 'pipeline_stage', label: 'Pipeline Stage' },
        { value: 'assigned_to', label: 'Assigned To' },
        { value: 'priority', label: 'Priority' },
      ]},
      { key: 'to_value', label: 'New Value (optional)', type: 'text' },
    ],
  },
  priority_changed: {
    type: 'priority_changed',
    label: 'Priority Changed',
    description: 'Triggers when lead priority changes',
    icon: 'star',
    category: 'lead',
    fields: [
      { key: 'to_priority', label: 'New Priority', type: 'select', options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ]},
    ],
  },
  tag_added: {
    type: 'tag_added',
    label: 'Tag Added',
    description: 'Triggers when a specific tag is added',
    icon: 'tag',
    category: 'lead',
    fields: [
      { key: 'tag', label: 'Tag Name', type: 'text', required: true },
    ],
  },
  tag_removed: {
    type: 'tag_removed',
    label: 'Tag Removed',
    description: 'Triggers when a specific tag is removed',
    icon: 'x',
    category: 'lead',
    fields: [
      { key: 'tag', label: 'Tag Name', type: 'text', required: true },
    ],
  },
  form_submitted: {
    type: 'form_submitted',
    label: 'Form Submitted',
    description: 'Triggers when a specific form is submitted',
    icon: 'file-text',
    category: 'lead',
    fields: [
      { key: 'form_id', label: 'Form (optional)', type: 'select' },
    ],
  },

  // Message triggers
  message_received: {
    type: 'message_received',
    label: 'Message Received',
    description: 'Triggers when a message is received from a lead',
    icon: 'message-circle',
    category: 'message',
    fields: [
      { key: 'channel', label: 'Channel', type: 'select', options: [
        { value: 'any', label: 'Any Channel' },
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
      ]},
    ],
  },
  message_opened: {
    type: 'message_opened',
    label: 'Email Opened',
    description: 'Triggers when an email is opened',
    icon: 'eye',
    category: 'message',
    fields: [],
  },
  message_clicked: {
    type: 'message_clicked',
    label: 'Link Clicked',
    description: 'Triggers when a link in an email is clicked',
    icon: 'mouse-pointer',
    category: 'message',
    fields: [],
  },
  email_bounced: {
    type: 'email_bounced',
    label: 'Email Bounced',
    description: 'Triggers when an email bounces',
    icon: 'alert-triangle',
    category: 'message',
    fields: [],
  },

  // Task triggers
  task_overdue: {
    type: 'task_overdue',
    label: 'Task Overdue',
    description: 'Triggers when a task becomes overdue',
    icon: 'alert-circle',
    category: 'task',
    fields: [],
  },
  scheduled_time: {
    type: 'scheduled_time',
    label: 'Scheduled Time',
    description: 'Triggers at a specific time',
    icon: 'calendar',
    category: 'time',
    fields: [
      { key: 'schedule', label: 'Schedule', type: 'text', required: true, placeholder: '0 9 * * 1-5 (9am weekdays)' },
      { key: 'timezone', label: 'Timezone', type: 'select', options: [
        { value: 'America/New_York', label: 'Eastern Time' },
        { value: 'America/Chicago', label: 'Central Time' },
        { value: 'America/Denver', label: 'Mountain Time' },
        { value: 'America/Los_Angeles', label: 'Pacific Time' },
      ]},
    ],
  },

  // Sequence triggers
  sequence_enrolled: {
    type: 'sequence_enrolled',
    label: 'Enrolled in Sequence',
    description: 'Triggers when lead is enrolled in a sequence',
    icon: 'play',
    category: 'sequence',
    fields: [
      { key: 'sequence_id', label: 'Sequence', type: 'sequence' },
    ],
  },
  sequence_completed: {
    type: 'sequence_completed',
    label: 'Sequence Completed',
    description: 'Triggers when lead completes a sequence',
    icon: 'check-circle',
    category: 'sequence',
    fields: [
      { key: 'sequence_id', label: 'Sequence', type: 'sequence' },
    ],
  },

  // Meeting triggers
  meeting_scheduled: {
    type: 'meeting_scheduled',
    label: 'Meeting Scheduled',
    description: 'Triggers when a meeting is scheduled',
    icon: 'calendar-plus',
    category: 'meeting',
    fields: [],
  },
  meeting_completed: {
    type: 'meeting_completed',
    label: 'Meeting Completed',
    description: 'Triggers when a meeting is marked as completed',
    icon: 'calendar-check',
    category: 'meeting',
    fields: [],
  },
  meeting_cancelled: {
    type: 'meeting_cancelled',
    label: 'Meeting Cancelled',
    description: 'Triggers when a meeting is cancelled',
    icon: 'calendar-x',
    category: 'meeting',
    fields: [],
  },

  // Compliance triggers
  compliance_due: {
    type: 'compliance_due',
    label: 'Compliance Due',
    description: 'Triggers when compliance item is due soon',
    icon: 'shield',
    category: 'compliance',
    fields: [
      { key: 'days_before', label: 'Days Before Due', type: 'number', required: true, placeholder: '7' },
    ],
  },
};

// ============================================================================
// Action Configuration
// ============================================================================

export const ACTION_CONFIGS: Record<AutomationActionType, ActionConfig> = {
  // Communication
  send_email: {
    type: 'send_email',
    label: 'Send Email',
    description: 'Send an email to the lead',
    icon: 'mail',
    category: 'communication',
    fields: [
      { key: 'template_id', label: 'Email Template', type: 'template' },
      { key: 'subject', label: 'Subject (or use template)', type: 'text' },
      { key: 'body', label: 'Body (or use template)', type: 'textarea' },
    ],
  },
  send_sms: {
    type: 'send_sms',
    label: 'Send SMS',
    description: 'Send an SMS to the lead',
    icon: 'smartphone',
    category: 'communication',
    fields: [
      { key: 'template_id', label: 'SMS Template', type: 'template' },
      { key: 'message', label: 'Message (or use template)', type: 'textarea' },
    ],
  },
  send_notification: {
    type: 'send_notification',
    label: 'Send Notification',
    description: 'Send a notification to team members',
    icon: 'bell',
    category: 'communication',
    fields: [
      { key: 'channels', label: 'Channels', type: 'multiselect', options: [
        { value: 'in_app', label: 'In-App' },
        { value: 'email', label: 'Email' },
        { value: 'push', label: 'Push' },
        { value: 'slack', label: 'Slack' },
      ]},
      { key: 'message', label: 'Message', type: 'text', required: true },
      { key: 'urgency', label: 'Urgency', type: 'select', options: [
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ]},
      { key: 'recipients', label: 'Recipients', type: 'multiselect', options: [
        { value: 'owner', label: 'Lead Owner' },
        { value: 'team', label: 'Entire Team' },
        { value: 'admins', label: 'Admins Only' },
      ]},
    ],
  },
  send_slack: {
    type: 'send_slack',
    label: 'Send Slack Message',
    description: 'Send a message to Slack',
    icon: 'slack',
    category: 'communication',
    fields: [
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#leads' },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  // Lead management
  assign_lead: {
    type: 'assign_lead',
    label: 'Assign Lead',
    description: 'Assign the lead to a team member',
    icon: 'user-plus',
    category: 'lead',
    fields: [
      { key: 'method', label: 'Assignment Method', type: 'select', required: true, options: [
        { value: 'specific', label: 'Specific User' },
        { value: 'round_robin', label: 'Round Robin' },
        { value: 'least_busy', label: 'Least Busy' },
      ]},
      { key: 'user_id', label: 'Assign To (if specific)', type: 'user' },
      { key: 'team_id', label: 'From Team', type: 'select' },
    ],
  },
  update_field: {
    type: 'update_field',
    label: 'Update Field',
    description: 'Update a field on the lead',
    icon: 'edit-2',
    category: 'lead',
    fields: [
      { key: 'field', label: 'Field', type: 'select', required: true, options: [
        { value: 'status', label: 'Status' },
        { value: 'pipeline_stage', label: 'Pipeline Stage' },
        { value: 'priority', label: 'Priority' },
      ]},
      { key: 'value', label: 'New Value', type: 'text', required: true },
    ],
  },
  update_priority: {
    type: 'update_priority',
    label: 'Update Priority',
    description: 'Change the lead priority',
    icon: 'star',
    category: 'lead',
    fields: [
      { key: 'priority', label: 'Priority', type: 'select', required: true, options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ]},
    ],
  },
  add_tag: {
    type: 'add_tag',
    label: 'Add Tag',
    description: 'Add a tag to the lead',
    icon: 'tag',
    category: 'lead',
    fields: [
      { key: 'tag', label: 'Tag Name', type: 'text', required: true },
    ],
  },
  remove_tag: {
    type: 'remove_tag',
    label: 'Remove Tag',
    description: 'Remove a tag from the lead',
    icon: 'x',
    category: 'lead',
    fields: [
      { key: 'tag', label: 'Tag Name', type: 'text', required: true },
    ],
  },
  add_to_lane: {
    type: 'add_to_lane',
    label: 'Add to Priority Lane',
    description: 'Add lead to a priority lane',
    icon: 'layers',
    category: 'lead',
    fields: [
      { key: 'lane_id', label: 'Lane', type: 'lane', required: true },
      { key: 'reason', label: 'Reason', type: 'text' },
    ],
  },
  remove_from_lane: {
    type: 'remove_from_lane',
    label: 'Remove from Lane',
    description: 'Remove lead from a priority lane',
    icon: 'minus',
    category: 'lead',
    fields: [
      { key: 'lane_id', label: 'Lane', type: 'lane', required: true },
    ],
  },

  // Task management
  create_task: {
    type: 'create_task',
    label: 'Create Task',
    description: 'Create a follow-up task',
    icon: 'check-square',
    category: 'task',
    fields: [
      { key: 'title', label: 'Task Title', type: 'text', required: true },
      { key: 'task_type', label: 'Task Type', type: 'select', options: [
        { value: 'follow_up', label: 'Follow Up' },
        { value: 'call', label: 'Call' },
        { value: 'email', label: 'Email' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'other', label: 'Other' },
      ]},
      { key: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ]},
      { key: 'due_hours', label: 'Due In (hours)', type: 'number', placeholder: '24' },
      { key: 'assign_to', label: 'Assign To', type: 'select', options: [
        { value: 'owner', label: 'Lead Owner' },
        { value: 'specific', label: 'Specific User' },
      ]},
    ],
  },
  create_meeting: {
    type: 'create_meeting',
    label: 'Schedule Meeting',
    description: 'Create a calendar meeting',
    icon: 'calendar',
    category: 'task',
    fields: [
      { key: 'title', label: 'Meeting Title', type: 'text', required: true },
      { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number', default: 30 },
      { key: 'meeting_type', label: 'Meeting Type', type: 'select', options: [
        { value: 'call', label: 'Phone Call' },
        { value: 'video', label: 'Video Call' },
        { value: 'in_person', label: 'In Person' },
      ]},
    ],
  },

  // Sequences
  enroll_sequence: {
    type: 'enroll_sequence',
    label: 'Enroll in Sequence',
    description: 'Enroll lead in an outreach sequence',
    icon: 'git-branch',
    category: 'sequence',
    fields: [
      { key: 'sequence_id', label: 'Sequence', type: 'sequence', required: true },
      { key: 'delay_hours', label: 'Delay Start (hours)', type: 'number', default: 0 },
    ],
  },
  exit_sequence: {
    type: 'exit_sequence',
    label: 'Exit Sequence',
    description: 'Remove lead from a sequence',
    icon: 'log-out',
    category: 'sequence',
    fields: [
      { key: 'sequence_id', label: 'Sequence (optional, empty = all)', type: 'sequence' },
      { key: 'reason', label: 'Exit Reason', type: 'text' },
    ],
  },

  // Activity
  log_activity: {
    type: 'log_activity',
    label: 'Log Activity',
    description: 'Log an activity on the lead',
    icon: 'file-text',
    category: 'lead',
    fields: [
      { key: 'activity_type', label: 'Activity Type', type: 'select', required: true, options: [
        { value: 'note', label: 'Note' },
        { value: 'call', label: 'Call' },
        { value: 'email', label: 'Email' },
        { value: 'meeting', label: 'Meeting' },
      ]},
      { key: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  },

  // Integrations
  send_webhook: {
    type: 'send_webhook',
    label: 'Send Webhook',
    description: 'Send data to an external URL',
    icon: 'globe',
    category: 'integration',
    fields: [
      { key: 'url', label: 'Webhook URL', type: 'text', required: true },
      { key: 'method', label: 'HTTP Method', type: 'select', default: 'POST', options: [
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' },
      ]},
      { key: 'include_lead_data', label: 'Include Lead Data', type: 'boolean', default: true },
      { key: 'custom_payload', label: 'Custom Payload (JSON)', type: 'textarea' },
    ],
  },

  // Flow control
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Wait before next action',
    icon: 'clock',
    category: 'flow',
    fields: [
      { key: 'minutes', label: 'Delay (minutes)', type: 'number', required: true },
    ],
  },
  branch: {
    type: 'branch',
    label: 'Branch',
    description: 'Conditional branching',
    icon: 'git-branch',
    category: 'flow',
    fields: [
      { key: 'conditions', label: 'Conditions', type: 'text' },
    ],
  },
};

// ============================================================================
// AutomationService
// ============================================================================

export class AutomationService {
  // =========================================================================
  // AUTOMATION RULES
  // =========================================================================

  /**
   * Get all automation rules for an organization
   */
  async getRules(orgId: string, params: GetRulesParams = {}): Promise<AutomationRule[]> {
    let query = supabase
      .from('ai_automation_rules')
      .select('*')
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (params.trigger_type) {
      query = query.eq('trigger_type', params.trigger_type);
    }

    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AutomationService] Failed to get rules:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single rule by ID
   */
  async getRule(ruleId: string): Promise<AutomationRule | null> {
    const { data, error } = await supabase
      .from('ai_automation_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[AutomationService] Failed to get rule:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get rule with full details (conditions and actions)
   */
  async getRuleWithDetails(ruleId: string): Promise<AutomationRuleWithDetails | null> {
    const { data, error } = await supabase.rpc('get_automation_rule_details', {
      p_rule_id: ruleId,
    });

    if (error) {
      console.error('[AutomationService] Failed to get rule details:', error);
      throw error;
    }

    if (!data || !data.rule) return null;

    return {
      ...data.rule,
      conditions: data.conditions || [],
      actions: data.actions || [],
    };
  }

  /**
   * Create a new automation rule
   */
  async createRule(orgId: string, input: CreateRuleInput): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('ai_automation_rules')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        trigger_type: input.trigger_type,
        trigger_conditions: input.trigger_conditions || {},
        action_type: input.action_type,
        action_config: input.action_config || {},
        delay_minutes: input.delay_minutes || 0,
        priority: input.priority || 10,
        run_once: input.run_once || false,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[AutomationService] Failed to create rule:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an automation rule
   */
  async updateRule(ruleId: string, input: UpdateRuleInput): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('ai_automation_rules')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('[AutomationService] Failed to update rule:', error);
      throw error;
    }

    return data;
  }

  /**
   * Toggle rule active status
   */
  async toggleRule(ruleId: string, isActive: boolean): Promise<AutomationRule> {
    return this.updateRule(ruleId, { is_active: isActive });
  }

  /**
   * Delete an automation rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_automation_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('[AutomationService] Failed to delete rule:', error);
      throw error;
    }
  }

  /**
   * Duplicate a rule
   */
  async duplicateRule(orgId: string, ruleId: string): Promise<AutomationRule> {
    const rule = await this.getRule(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    return this.createRule(orgId, {
      name: `${rule.name} (Copy)`,
      description: rule.description || undefined,
      trigger_type: rule.trigger_type as AutomationTriggerType,
      trigger_conditions: rule.trigger_conditions,
      action_type: rule.action_type as AutomationActionType,
      action_config: rule.action_config,
      delay_minutes: rule.delay_minutes,
      priority: rule.priority,
      run_once: rule.run_once,
      is_active: false, // Start as inactive
    });
  }

  // =========================================================================
  // CONDITIONS
  // =========================================================================

  /**
   * Get conditions for a rule
   */
  async getConditions(ruleId: string): Promise<AutomationCondition[]> {
    const { data, error } = await supabase
      .from('automation_conditions')
      .select('*')
      .eq('rule_id', ruleId)
      .order('condition_group')
      .order('id');

    if (error) {
      console.error('[AutomationService] Failed to get conditions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Add a condition to a rule
   */
  async addCondition(input: CreateConditionInput): Promise<AutomationCondition> {
    const { data, error } = await supabase
      .from('automation_conditions')
      .insert({
        rule_id: input.rule_id,
        condition_group: input.condition_group || 0,
        field_path: input.field_path,
        operator: input.operator,
        value: input.value,
        group_operator: input.group_operator || 'AND',
      })
      .select()
      .single();

    if (error) {
      console.error('[AutomationService] Failed to add condition:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a condition
   */
  async deleteCondition(conditionId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_conditions')
      .delete()
      .eq('id', conditionId);

    if (error) {
      console.error('[AutomationService] Failed to delete condition:', error);
      throw error;
    }
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /**
   * Get actions for a rule
   */
  async getActions(ruleId: string): Promise<AutomationAction[]> {
    const { data, error } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('rule_id', ruleId)
      .order('action_order');

    if (error) {
      console.error('[AutomationService] Failed to get actions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Add an action to a rule
   */
  async addAction(input: CreateActionInput): Promise<AutomationAction> {
    const { data, error } = await supabase
      .from('automation_actions')
      .insert({
        rule_id: input.rule_id,
        action_order: input.action_order || 0,
        action_type: input.action_type,
        action_config: input.action_config || {},
        delay_minutes: input.delay_minutes || 0,
        condition: input.condition,
        stop_on_failure: input.stop_on_failure || false,
      })
      .select()
      .single();

    if (error) {
      console.error('[AutomationService] Failed to add action:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete an action
   */
  async deleteAction(actionId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_actions')
      .delete()
      .eq('id', actionId);

    if (error) {
      console.error('[AutomationService] Failed to delete action:', error);
      throw error;
    }
  }

  /**
   * Reorder actions
   */
  async reorderActions(ruleId: string, actionIds: string[]): Promise<void> {
    const updates = actionIds.map((id, index) => ({
      id,
      action_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('automation_actions')
        .update({ action_order: update.action_order })
        .eq('id', update.id);

      if (error) {
        console.error('[AutomationService] Failed to reorder actions:', error);
        throw error;
      }
    }
  }

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  /**
   * Get automation templates
   */
  async getTemplates(params: GetTemplatesParams = {}): Promise<AutomationTemplate[]> {
    let query = supabase
      .from('automation_templates')
      .select('*')
      .order('is_popular', { ascending: false })
      .order('use_count', { ascending: false });

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.is_popular) {
      query = query.eq('is_popular', true);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AutomationService] Failed to get templates:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get template categories
   */
  async getTemplateCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('automation_templates')
      .select('category')
      .order('category');

    if (error) {
      console.error('[AutomationService] Failed to get categories:', error);
      throw error;
    }

    const categories = [...new Set(data?.map((t) => t.category) || [])];
    return categories;
  }

  /**
   * Create rule from template
   */
  async createFromTemplate(
    orgId: string,
    templateId: string,
    overrides?: Partial<CreateRuleInput>
  ): Promise<AutomationRule> {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('automation_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Increment use count
    await supabase
      .from('automation_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', templateId);

    // Create rule from template
    return this.createRule(orgId, {
      name: overrides?.name || template.name,
      description: overrides?.description || template.description,
      trigger_type: template.trigger_type as AutomationTriggerType,
      trigger_conditions: overrides?.trigger_conditions || template.trigger_conditions,
      action_type: template.action_type as AutomationActionType,
      action_config: overrides?.action_config || template.action_config,
      delay_minutes: overrides?.delay_minutes ?? template.delay_minutes,
      is_active: overrides?.is_active ?? false,
    });
  }

  // =========================================================================
  // EXECUTION HISTORY
  // =========================================================================

  /**
   * Get execution history
   */
  async getExecutionHistory(
    orgId: string,
    params: GetExecutionHistoryParams = {}
  ): Promise<ExecutionLogWithLead[]> {
    const { data, error } = await supabase.rpc('get_automation_history', {
      p_org_id: orgId,
      p_rule_id: params.rule_id || null,
      p_lead_id: params.lead_id || null,
      p_status: params.status || null,
      p_limit: params.limit || 50,
      p_offset: params.offset || 0,
    });

    if (error) {
      console.error('[AutomationService] Failed to get history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Log an execution
   */
  async logExecution(
    orgId: string,
    ruleId: string,
    ruleName: string,
    triggerType: string,
    actionType: string,
    leadId: string | null,
    status: 'success' | 'failed' | 'skipped',
    resultMessage: string | null = null,
    options: {
      actionId?: string;
      executionTimeMs?: number;
      context?: Record<string, unknown>;
    } = {}
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_automation_execution', {
      p_org_id: orgId,
      p_rule_id: ruleId,
      p_rule_name: ruleName,
      p_trigger_type: triggerType,
      p_action_type: actionType,
      p_lead_id: leadId,
      p_status: status,
      p_result_message: resultMessage,
      p_action_id: options.actionId || null,
      p_execution_time_ms: options.executionTimeMs || null,
      p_context: options.context || {},
    });

    if (error) {
      console.error('[AutomationService] Failed to log execution:', error);
      throw error;
    }

    return data;
  }

  // =========================================================================
  // STATISTICS
  // =========================================================================

  /**
   * Get automation statistics
   */
  async getStats(orgId: string): Promise<AutomationStats> {
    const { data, error } = await supabase.rpc('get_automation_stats', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[AutomationService] Failed to get stats:', error);
      throw error;
    }

    return data || {
      total_rules: 0,
      active_rules: 0,
      executions_today: 0,
      executions_this_week: 0,
      success_rate: null,
      top_rules: [],
      executions_by_status: {},
      executions_by_trigger: {},
    };
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Get trigger configuration
   */
  getTriggerConfig(type: AutomationTriggerType): TriggerConfig {
    return TRIGGER_CONFIGS[type];
  }

  /**
   * Get action configuration
   */
  getActionConfig(type: AutomationActionType): ActionConfig {
    return ACTION_CONFIGS[type];
  }

  /**
   * Get all trigger types
   */
  getTriggerTypes(): AutomationTriggerType[] {
    return Object.keys(TRIGGER_CONFIGS) as AutomationTriggerType[];
  }

  /**
   * Get all action types
   */
  getActionTypes(): AutomationActionType[] {
    return Object.keys(ACTION_CONFIGS) as AutomationActionType[];
  }

  /**
   * Get triggers by category
   */
  getTriggersByCategory(): Record<string, TriggerConfig[]> {
    const byCategory: Record<string, TriggerConfig[]> = {};

    for (const config of Object.values(TRIGGER_CONFIGS)) {
      if (!byCategory[config.category]) {
        byCategory[config.category] = [];
      }
      byCategory[config.category].push(config);
    }

    return byCategory;
  }

  /**
   * Get actions by category
   */
  getActionsByCategory(): Record<string, ActionConfig[]> {
    const byCategory: Record<string, ActionConfig[]> = {};

    for (const config of Object.values(ACTION_CONFIGS)) {
      if (!byCategory[config.category]) {
        byCategory[config.category] = [];
      }
      byCategory[config.category].push(config);
    }

    return byCategory;
  }
}

export const automationService = new AutomationService();
