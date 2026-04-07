import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Zap,
  Filter,
  Play,
  GitBranch,
  Clock,
  Plus,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  Save,
  Mail,
  CheckSquare,
  UserPlus,
  AlertTriangle,
  Tag,
  Bell,
  ListOrdered,
  MessageSquare,
  PencilLine,
  Trash2,
  Copy,
  ArrowDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ============================================================================
// Types
// ============================================================================

type TriggerType =
  | 'stage_change'
  | 'lead_created'
  | 'score_threshold'
  | 'task_overdue'
  | 'tag_added'
  | 'time_based'
  | 'form_submitted';

type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'in_list';

type ActionType =
  | 'send_email'
  | 'create_task'
  | 'assign_lead'
  | 'change_priority'
  | 'add_tag'
  | 'notify_user'
  | 'enroll_sequence'
  | 'send_slack'
  | 'wait'
  | 'update_field';

type NodeType = 'trigger' | 'condition' | 'action' | 'branch' | 'delay';

interface TriggerConfig {
  trigger_type: TriggerType;
  from_stage?: string;
  to_stage?: string;
  operator?: '>=' | '<=';
  threshold_value?: number;
  tag_name?: string;
  cron_expression?: string;
  interval_value?: number;
  interval_unit?: 'hours' | 'days';
}

interface ConditionConfig {
  field: string;
  operator: ConditionOperator;
  value: string;
}

interface ActionConfig {
  action_type: ActionType;
  template_id?: string;
  task_title?: string;
  task_due_offset_hours?: number;
  task_assignee?: string;
  assign_to_user?: string;
  priority?: string;
  tag_name?: string;
  notify_user_id?: string;
  notify_message?: string;
  sequence_id?: string;
  slack_channel?: string;
  slack_message?: string;
  wait_duration?: number;
  wait_unit?: 'minutes' | 'hours' | 'days';
  field_name?: string;
  field_value?: string;
}

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: TriggerConfig | ConditionConfig | ActionConfig | Record<string, unknown>;
  children: WorkflowNode[];
  elseBranch?: WorkflowNode[];
}

interface WorkflowBuilderProps {
  ruleId?: string;
  onSave?: (rule: Record<string, unknown>) => void;
  onCancel?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'stage_change', label: 'Stage Change' },
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'score_threshold', label: 'Score Threshold' },
  { value: 'task_overdue', label: 'Task Overdue' },
  { value: 'tag_added', label: 'Tag Added' },
  { value: 'time_based', label: 'Time-Based' },
  { value: 'form_submitted', label: 'Form Submitted' },
];

const ACTION_OPTIONS: { value: ActionType; label: string; icon: typeof Mail }[] = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'create_task', label: 'Create Task', icon: CheckSquare },
  { value: 'assign_lead', label: 'Assign Lead', icon: UserPlus },
  { value: 'change_priority', label: 'Change Priority', icon: AlertTriangle },
  { value: 'add_tag', label: 'Add Tag', icon: Tag },
  { value: 'notify_user', label: 'Notify User', icon: Bell },
  { value: 'enroll_sequence', label: 'Enroll in Sequence', icon: ListOrdered },
  { value: 'send_slack', label: 'Send Slack', icon: MessageSquare },
  { value: 'wait', label: 'Wait (Delay)', icon: Clock },
  { value: 'update_field', label: 'Update Field', icon: PencilLine },
];

const CONDITION_FIELDS = [
  { value: 'lead_score', label: 'Lead Score' },
  { value: 'pipeline_stage', label: 'Pipeline Stage' },
  { value: 'plan_type', label: 'Plan Type' },
  { value: 'priority', label: 'Priority' },
  { value: 'assigned_to', label: 'Assigned To' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'deal_amount', label: 'Deal Amount' },
  { value: 'company', label: 'Company' },
  { value: 'email_domain', label: 'Email Domain' },
];

const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'in_list', label: 'In List' },
];

const PIPELINE_STAGES = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost',
];

const NODE_COLORS: Record<NodeType, { border: string; bg: string; iconBg: string; dot: string }> = {
  trigger: {
    border: 'border-t-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  condition: {
    border: 'border-t-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  action: {
    border: 'border-t-green-500',
    bg: 'bg-green-50 dark:bg-green-500/10',
    iconBg: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
  branch: {
    border: 'border-t-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    iconBg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  delay: {
    border: 'border-t-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-500/10',
    iconBg: 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
};

const NODE_ICONS: Record<NodeType, typeof Zap> = {
  trigger: Zap,
  condition: Filter,
  action: Play,
  branch: GitBranch,
  delay: Clock,
};

function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Node Configuration Forms
// ============================================================================

function TriggerConfigForm({
  config,
  onChange,
}: {
  config: TriggerConfig;
  onChange: (c: TriggerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-th-text-secondary">Trigger Type</span>
        <select
          value={config.trigger_type}
          onChange={(e) => onChange({ ...config, trigger_type: e.target.value as TriggerType })}
          className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {TRIGGER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      {config.trigger_type === 'stage_change' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">From Stage</span>
            <select
              value={config.from_stage || ''}
              onChange={(e) => onChange({ ...config, from_stage: e.target.value })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Any</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">To Stage</span>
            <select
              value={config.to_stage || ''}
              onChange={(e) => onChange({ ...config, to_stage: e.target.value })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Any</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {config.trigger_type === 'score_threshold' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Operator</span>
            <select
              value={config.operator || '>='}
              onChange={(e) => onChange({ ...config, operator: e.target.value as '>=' | '<=' })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value=">=">Greater than or equal (≥)</option>
              <option value="<=">Less than or equal (≤)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Score Value</span>
            <input
              type="number"
              min={0}
              max={100}
              value={config.threshold_value ?? 50}
              onChange={(e) => onChange({ ...config, threshold_value: Number(e.target.value) })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
        </div>
      )}

      {config.trigger_type === 'tag_added' && (
        <label className="block">
          <span className="text-xs font-medium text-th-text-secondary">Tag Name</span>
          <input
            type="text"
            value={config.tag_name || ''}
            onChange={(e) => onChange({ ...config, tag_name: e.target.value })}
            placeholder="e.g. hot-lead"
            className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      )}

      {config.trigger_type === 'time_based' && (
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Cron Expression</span>
            <input
              type="text"
              value={config.cron_expression || ''}
              onChange={(e) => onChange({ ...config, cron_expression: e.target.value })}
              placeholder="e.g. 0 9 * * 1 (Mondays at 9am)"
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
          <div className="text-[10px] text-th-text-tertiary">
            Or use interval:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              value={config.interval_value ?? ''}
              onChange={(e) => onChange({ ...config, interval_value: Number(e.target.value) })}
              placeholder="Every"
              className="block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <select
              aria-label="Interval unit"
              value={config.interval_unit || 'hours'}
              onChange={(e) => onChange({ ...config, interval_unit: e.target.value as 'hours' | 'days' })}
              className="block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionConfigForm({
  config,
  onChange,
}: {
  config: ConditionConfig;
  onChange: (c: ConditionConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-th-text-secondary">Field</span>
        <select
          value={config.field}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">Select field...</option>
          {CONDITION_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-th-text-secondary">Operator</span>
        <select
          value={config.operator}
          onChange={(e) => onChange({ ...config, operator: e.target.value as ConditionOperator })}
          className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {CONDITION_OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-th-text-secondary">Value</span>
        <input
          type="text"
          value={config.value}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
          placeholder="Enter value..."
          className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </label>
    </div>
  );
}

function ActionConfigForm({
  config,
  onChange,
}: {
  config: ActionConfig;
  onChange: (c: ActionConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-th-text-secondary">Action Type</span>
        <select
          value={config.action_type}
          onChange={(e) => onChange({ ...config, action_type: e.target.value as ActionType })}
          className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {ACTION_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </label>

      {config.action_type === 'send_email' && (
        <label className="block">
          <span className="text-xs font-medium text-th-text-secondary">Email Template ID</span>
          <input
            type="text"
            value={config.template_id || ''}
            onChange={(e) => onChange({ ...config, template_id: e.target.value })}
            placeholder="Select or enter template ID..."
            className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      )}

      {config.action_type === 'create_task' && (
        <>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Task Title</span>
            <input
              type="text"
              value={config.task_title || ''}
              onChange={(e) => onChange({ ...config, task_title: e.target.value })}
              placeholder="e.g. Follow up with lead"
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-th-text-secondary">Due In (hours)</span>
              <input
                type="number"
                min={1}
                value={config.task_due_offset_hours ?? 24}
                onChange={(e) => onChange({ ...config, task_due_offset_hours: Number(e.target.value) })}
                className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-th-text-secondary">Assignee</span>
              <input
                type="text"
                value={config.task_assignee || ''}
                onChange={(e) => onChange({ ...config, task_assignee: e.target.value })}
                placeholder="User ID or 'owner'"
                className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
          </div>
        </>
      )}

      {config.action_type === 'assign_lead' && (
        <label className="block">
          <span className="text-xs font-medium text-th-text-secondary">Assign To User</span>
          <input
            type="text"
            value={config.assign_to_user || ''}
            onChange={(e) => onChange({ ...config, assign_to_user: e.target.value })}
            placeholder="User ID or 'round_robin'"
            className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      )}

      {config.action_type === 'change_priority' && (
        <label className="block">
          <span className="text-xs font-medium text-th-text-secondary">New Priority</span>
          <select
            value={config.priority || 'medium'}
            onChange={(e) => onChange({ ...config, priority: e.target.value })}
            className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      )}

      {config.action_type === 'add_tag' && (
        <label className="block">
          <span className="text-xs font-medium text-th-text-secondary">Tag Name</span>
          <input
            type="text"
            value={config.tag_name || ''}
            onChange={(e) => onChange({ ...config, tag_name: e.target.value })}
            placeholder="e.g. qualified"
            className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      )}

      {config.action_type === 'notify_user' && (
        <>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Notify User</span>
            <input
              type="text"
              value={config.notify_user_id || ''}
              onChange={(e) => onChange({ ...config, notify_user_id: e.target.value })}
              placeholder="User ID or 'owner'"
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Message</span>
            <input
              type="text"
              value={config.notify_message || ''}
              onChange={(e) => onChange({ ...config, notify_message: e.target.value })}
              placeholder="Notification message..."
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
        </>
      )}

      {config.action_type === 'enroll_sequence' && (
        <label className="block">
          <span className="text-xs font-medium text-th-text-secondary">Sequence ID</span>
          <input
            type="text"
            value={config.sequence_id || ''}
            onChange={(e) => onChange({ ...config, sequence_id: e.target.value })}
            placeholder="Select or enter sequence ID..."
            className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      )}

      {config.action_type === 'send_slack' && (
        <>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Slack Channel</span>
            <input
              type="text"
              value={config.slack_channel || ''}
              onChange={(e) => onChange({ ...config, slack_channel: e.target.value })}
              placeholder="#channel-name"
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Message</span>
            <textarea
              value={config.slack_message || ''}
              onChange={(e) => onChange({ ...config, slack_message: e.target.value })}
              placeholder="Slack message (supports {{lead_name}}, {{deal_amount}} etc.)"
              rows={2}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </label>
        </>
      )}

      {config.action_type === 'wait' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Duration</span>
            <input
              type="number"
              min={1}
              value={config.wait_duration ?? 1}
              onChange={(e) => onChange({ ...config, wait_duration: Number(e.target.value) })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Unit</span>
            <select
              value={config.wait_unit || 'hours'}
              onChange={(e) => onChange({ ...config, wait_unit: e.target.value as 'minutes' | 'hours' | 'days' })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </label>
        </div>
      )}

      {config.action_type === 'update_field' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">Field</span>
            <select
              value={config.field_name || ''}
              onChange={(e) => onChange({ ...config, field_name: e.target.value })}
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select...</option>
              {CONDITION_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-th-text-secondary">New Value</span>
            <input
              type="text"
              value={config.field_value || ''}
              onChange={(e) => onChange({ ...config, field_value: e.target.value })}
              placeholder="Value..."
              className="mt-1 block w-full text-sm rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Node Card Component
// ============================================================================

interface NodeCardProps {
  node: WorkflowNode;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddAfter: (parentId: string, type: NodeType, branch?: 'else') => void;
  depth: number;
  isPreview: boolean;
}

function NodeCard({
  node,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddAfter,
  depth,
  isPreview,
}: NodeCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showElseAddMenu, setShowElseAddMenu] = useState(false);
  const colors = NODE_COLORS[node.type];
  const Icon = NODE_ICONS[node.type];
  const addMenuRef = useRef<HTMLDivElement>(null);
  const elseAddMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
      if (elseAddMenuRef.current && !elseAddMenuRef.current.contains(e.target as Node)) {
        setShowElseAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConfigChange = (newConfig: TriggerConfig | ConditionConfig | ActionConfig) => {
    onUpdate(node.id, { config: newConfig });
  };

  const addStepOptions: { type: NodeType; label: string; icon: typeof Filter }[] = [
    { type: 'condition', label: 'Condition', icon: Filter },
    { type: 'action', label: 'Action', icon: Play },
    { type: 'branch', label: 'Branch (If/Else)', icon: GitBranch },
    { type: 'delay', label: 'Delay', icon: Clock },
  ];

  function AddStepMenu({
    show,
    menuRef,
    onSelect,
  }: {
    show: boolean;
    menuRef: React.RefObject<HTMLDivElement | null>;
    onSelect: (type: NodeType) => void;
  }) {
    if (!show) return null;
    return (
      <div
        ref={menuRef}
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 bg-surface-primary border border-th-border rounded-xl shadow-lg p-1.5 min-w-[180px]"
      >
        {addStepOptions.map((opt) => {
          const StepIcon = opt.icon;
          return (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <StepIcon className="w-4 h-4 text-th-text-secondary" />
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Connector dot at top */}
      <div className={cn('w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm', colors.dot)} />
      <div className="w-0.5 h-3 bg-th-border" />

      {/* Node card */}
      <div
        className={cn(
          'w-[280px] rounded-xl border border-th-border shadow-sm transition-all',
          'border-t-4',
          colors.border,
          isPreview ? 'opacity-90' : 'hover:shadow-md',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer',
            colors.bg,
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {!isPreview && (
            <div className="cursor-grab text-th-text-tertiary hover:text-th-text-secondary">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
          <div className={cn('p-1 rounded-md', colors.iconBg)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-th-text-primary flex-1 truncate">
            {node.label}
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-th-text-tertiary" />
          )}
          {!isPreview && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }}
                className="p-1 rounded hover:bg-surface-tertiary transition-colors"
                title="Duplicate"
              >
                <Copy className="w-3 h-3 text-th-text-tertiary" />
              </button>
              {node.type !== 'trigger' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  title="Delete"
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Config body */}
        {expanded && (
          <div className="p-3 bg-surface-primary rounded-b-xl">
            {isPreview ? (
              <NodePreview node={node} />
            ) : (
              <>
                {node.type === 'trigger' && (
                  <TriggerConfigForm
                    config={node.config as TriggerConfig}
                    onChange={handleConfigChange}
                  />
                )}
                {node.type === 'condition' && (
                  <ConditionConfigForm
                    config={node.config as ConditionConfig}
                    onChange={handleConfigChange}
                  />
                )}
                {(node.type === 'action' || node.type === 'delay') && (
                  <ActionConfigForm
                    config={node.config as ActionConfig}
                    onChange={handleConfigChange}
                  />
                )}
                {node.type === 'branch' && (
                  <ConditionConfigForm
                    config={node.config as ConditionConfig}
                    onChange={handleConfigChange}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Branch paths */}
      {node.type === 'branch' && (
        <div className="flex gap-8 mt-2">
          {/* IF path */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-green-600 dark:text-green-400 mb-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15">
              IF TRUE
            </div>
            <div className="w-0.5 h-3 bg-green-400" />
            {node.children.map((child) => (
              <NodeCard
                key={child.id}
                node={child}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onAddAfter={onAddAfter}
                depth={depth + 1}
                isPreview={isPreview}
              />
            ))}
            {!isPreview && (
              <div className="relative mt-2">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  aria-label="Add step to IF branch"
                  className="w-7 h-7 rounded-full bg-surface-secondary border border-th-border flex items-center justify-center hover:bg-surface-tertiary transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-th-text-secondary" />
                </button>
                <AddStepMenu
                  show={showAddMenu}
                  menuRef={addMenuRef}
                  onSelect={(type) => { onAddAfter(node.id, type); setShowAddMenu(false); }}
                />
              </div>
            )}
          </div>

          {/* ELSE path */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15">
              ELSE
            </div>
            <div className="w-0.5 h-3 bg-red-400" />
            {(node.elseBranch ?? []).map((child) => (
              <NodeCard
                key={child.id}
                node={child}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onAddAfter={onAddAfter}
                depth={depth + 1}
                isPreview={isPreview}
              />
            ))}
            {!isPreview && (
              <div className="relative mt-2">
                <button
                  onClick={() => setShowElseAddMenu(!showElseAddMenu)}
                  aria-label="Add step to ELSE branch"
                  className="w-7 h-7 rounded-full bg-surface-secondary border border-th-border flex items-center justify-center hover:bg-surface-tertiary transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-th-text-secondary" />
                </button>
                <AddStepMenu
                  show={showElseAddMenu}
                  menuRef={elseAddMenuRef}
                  onSelect={(type) => { onAddAfter(node.id, type, 'else'); setShowElseAddMenu(false); }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Child nodes (non-branch) */}
      {node.type !== 'branch' && node.children.length > 0 && (
        <>
          <div className="w-0.5 h-4 bg-th-border" />
          <ArrowDown className="w-3 h-3 text-th-text-tertiary -my-0.5" />
          {node.children.map((child) => (
            <NodeCard
              key={child.id}
              node={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onAddAfter={onAddAfter}
              depth={depth + 1}
              isPreview={isPreview}
            />
          ))}
        </>
      )}

      {/* Add step button (non-branch, bottom) */}
      {node.type !== 'branch' && !isPreview && depth === 0 && (
        <>
          <div className="w-0.5 h-4 bg-th-border" />
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              aria-label="Add workflow step"
              className="w-7 h-7 rounded-full bg-surface-secondary border border-th-border border-dashed flex items-center justify-center hover:bg-surface-tertiary hover:border-th-accent-500 transition-all group"
            >
              <Plus className="w-3.5 h-3.5 text-th-text-tertiary group-hover:text-th-accent-600" />
            </button>
            <AddStepMenu
              show={showAddMenu}
              menuRef={addMenuRef}
              onSelect={(type) => { onAddAfter(node.id, type); setShowAddMenu(false); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Node Preview (read-only summary)
// ============================================================================

function NodePreview({ node }: { node: WorkflowNode }) {
  const config = node.config as Record<string, unknown>;

  const entries = Object.entries(config).filter(
    ([key, val]) => val !== undefined && val !== '' && key !== 'action_type' && key !== 'trigger_type',
  );

  if (entries.length === 0) {
    return <p className="text-xs text-th-text-tertiary italic">No configuration</p>;
  }

  return (
    <div className="space-y-1">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span className="text-th-text-tertiary font-medium">{key.replace(/_/g, ' ')}:</span>
          <span className="text-th-text-secondary truncate">{String(val)}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main WorkflowBuilder Component
// ============================================================================

export function WorkflowBuilder({ ruleId, onSave, onCancel }: WorkflowBuilderProps) {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!ruleId);

  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: generateId(),
      type: 'trigger',
      label: 'Trigger',
      config: { trigger_type: 'stage_change' as TriggerType } as TriggerConfig,
      children: [],
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing rule
  useEffect(() => {
    if (!ruleId || !activeOrgId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ai_automation_rules')
          .select('*')
          .eq('id', ruleId)
          .eq('org_id', activeOrgId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Rule not found');

        setName(data.name || '');
        setDescription(data.description || '');
        setIsActive(data.is_active ?? true);

        const workflowSteps = (data as Record<string, unknown>).workflow_steps as WorkflowNode[] | undefined;
        if (workflowSteps && Array.isArray(workflowSteps) && workflowSteps.length > 0) {
          setNodes(workflowSteps);
        } else {
          const triggerNode: WorkflowNode = {
            id: generateId(),
            type: 'trigger',
            label: 'Trigger',
            config: {
              trigger_type: (data.trigger_type || 'stage_change') as TriggerType,
              ...(data.trigger_conditions as Record<string, unknown> || {}),
            } as TriggerConfig,
            children: [],
          };

          const actionConfig = data.action_config as Record<string, unknown> || {};
          const actionNode: WorkflowNode = {
            id: generateId(),
            type: 'action',
            label: 'Action',
            config: {
              action_type: (data.action_type || 'create_task') as ActionType,
              ...actionConfig,
            } as ActionConfig,
            children: [],
          };

          triggerNode.children = [actionNode];
          setNodes([triggerNode]);
        }
      } catch (err) {
        console.error('Failed to load rule:', err);
        toast.error('Failed to load automation rule');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ruleId, activeOrgId]);

  // Node tree manipulation helpers
  const findAndUpdate = useCallback(
    (nodeList: WorkflowNode[], id: string, updates: Partial<WorkflowNode>): WorkflowNode[] => {
      return nodeList.map((n) => {
        if (n.id === id) return { ...n, ...updates };
        return {
          ...n,
          children: findAndUpdate(n.children, id, updates),
          elseBranch: n.elseBranch ? findAndUpdate(n.elseBranch, id, updates) : undefined,
        };
      });
    },
    [],
  );

  const findAndDelete = useCallback(
    (nodeList: WorkflowNode[], id: string): WorkflowNode[] => {
      return nodeList
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          children: findAndDelete(n.children, id),
          elseBranch: n.elseBranch ? findAndDelete(n.elseBranch, id) : undefined,
        }));
    },
    [],
  );

  const findNode = useCallback(
    (nodeList: WorkflowNode[], id: string): WorkflowNode | null => {
      for (const n of nodeList) {
        if (n.id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
        if (n.elseBranch) {
          const elseFound = findNode(n.elseBranch, id);
          if (elseFound) return elseFound;
        }
      }
      return null;
    },
    [],
  );

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<WorkflowNode>) => {
      setNodes((prev) => findAndUpdate(prev, id, updates));
    },
    [findAndUpdate],
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => findAndDelete(prev, id));
    },
    [findAndDelete],
  );

  const handleDuplicateNode = useCallback(
    (id: string) => {
      const node = findNode(nodes, id);
      if (!node || node.type === 'trigger') return;

      const cloned: WorkflowNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: generateId(),
        label: `${node.label} (copy)`,
      };

      setNodes((prev) => {
        const addAfterNode = (list: WorkflowNode[]): WorkflowNode[] => {
          const result: WorkflowNode[] = [];
          for (const n of list) {
            result.push({
              ...n,
              children: addAfterNode(n.children),
              elseBranch: n.elseBranch ? addAfterNode(n.elseBranch) : undefined,
            });
            if (n.id === id) result.push(cloned);
          }
          return result;
        };
        return addAfterNode(prev);
      });
    },
    [nodes, findNode],
  );

  const createNode = useCallback((type: NodeType): WorkflowNode => {
    const labelMap: Record<NodeType, string> = {
      trigger: 'Trigger',
      condition: 'Condition',
      action: 'Action',
      branch: 'Branch',
      delay: 'Delay',
    };

    const configMap: Record<NodeType, WorkflowNode['config']> = {
      trigger: { trigger_type: 'stage_change' } as TriggerConfig,
      condition: { field: '', operator: 'equals', value: '' } as ConditionConfig,
      action: { action_type: 'create_task' } as ActionConfig,
      branch: { field: '', operator: 'equals', value: '' } as ConditionConfig,
      delay: { action_type: 'wait', wait_duration: 1, wait_unit: 'hours' } as ActionConfig,
    };

    return {
      id: generateId(),
      type,
      label: labelMap[type],
      config: configMap[type],
      children: [],
      elseBranch: type === 'branch' ? [] : undefined,
    };
  }, []);

  const handleAddAfter = useCallback(
    (parentId: string, type: NodeType, branch?: 'else') => {
      const newNode = createNode(type);

      setNodes((prev) => {
        const insert = (list: WorkflowNode[]): WorkflowNode[] => {
          return list.map((n) => {
            if (n.id === parentId) {
              if (branch === 'else' && n.type === 'branch') {
                return { ...n, elseBranch: [...(n.elseBranch || []), newNode] };
              }
              return { ...n, children: [...n.children, newNode] };
            }
            return {
              ...n,
              children: insert(n.children),
              elseBranch: n.elseBranch ? insert(n.elseBranch) : undefined,
            };
          });
        };
        return insert(prev);
      });
    },
    [createNode],
  );

  // Serialize workflow to DB-compatible JSON
  const serializeWorkflow = useCallback(() => {
    const flatSteps = (nodeList: WorkflowNode[]): WorkflowNode[] => nodeList;

    const triggerNode = nodes[0];
    const triggerConfig = triggerNode?.config as TriggerConfig;

    const firstAction = nodes.flatMap(function findActions(n: WorkflowNode): WorkflowNode[] {
      if (n.type === 'action') return [n];
      return n.children.flatMap(findActions);
    })[0];

    const actionConfig = firstAction?.config as ActionConfig | undefined;

    return {
      name,
      description,
      is_active: isActive,
      trigger_type: triggerConfig?.trigger_type || 'stage_change',
      trigger_conditions: (() => {
        const { trigger_type: _tt, ...rest } = triggerConfig || {};
        return rest;
      })(),
      action_type: actionConfig?.action_type || 'create_task',
      action_config: (() => {
        if (!actionConfig) return {};
        const { action_type: _at, ...rest } = actionConfig;
        return rest;
      })(),
      workflow_steps: flatSteps(nodes),
      org_id: activeOrgId,
      created_by: user?.id,
    };
  }, [nodes, name, description, isActive, activeOrgId, user]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    if (!activeOrgId) {
      toast.error('No organization selected');
      return;
    }

    setSaving(true);
    try {
      const payload = serializeWorkflow();

      if (ruleId) {
        const { error } = await supabase
          .from('ai_automation_rules')
          .update(payload)
          .eq('id', ruleId)
          .eq('org_id', activeOrgId);

        if (error) throw error;
        toast.success('Workflow updated');
      } else {
        const { error } = await supabase
          .from('ai_automation_rules')
          .insert(payload);

        if (error) throw error;
        toast.success('Workflow created');
      }

      onSave?.(payload);
    } catch (err) {
      console.error('Failed to save workflow:', err);
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-primary">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border bg-surface-secondary">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name..."
            className="text-base font-semibold bg-transparent text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none w-full"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="text-sm bg-transparent text-th-text-secondary placeholder:text-th-text-tertiary focus:outline-none w-full mt-0.5"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-th-text-secondary cursor-pointer">
          <span>Active</span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive ? 'true' : 'false'}
            onClick={() => setIsActive(!isActive)}
            className={cn(
              'relative inline-flex h-5 w-9 rounded-full transition-colors',
              isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5',
                isActive ? 'translate-x-4 ml-0.5' : 'translate-x-0.5',
              )}
            />
          </button>
        </label>

        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            previewMode
              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
              : 'bg-surface-tertiary text-th-text-secondary hover:text-th-text-primary',
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          {previewMode ? 'Editing' : 'Preview'}
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
              saving || !name.trim()
                ? 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
            )}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : ruleId ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-8 px-4">
        <div className="flex flex-col items-center min-h-full">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
              onDuplicate={handleDuplicateNode}
              onAddAfter={handleAddAfter}
              depth={0}
              isPreview={previewMode}
            />
          ))}

          {/* Final add button if only trigger exists */}
          {!previewMode && nodes.length === 1 && nodes[0].children.length === 0 && (
            <>
              <div className="w-0.5 h-6 bg-th-border" />
              <AddStepButton onAdd={(type) => handleAddAfter(nodes[0].id, type)} />
            </>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-th-border bg-surface-secondary">
        <div className="flex items-center justify-between text-[10px] text-th-text-tertiary">
          <span>
            {countNodes(nodes)} step{countNodes(nodes) !== 1 ? 's' : ''} in workflow
          </span>
          <span>
            {previewMode ? 'Preview mode — read only' : 'Click + between steps to add nodes'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Add Step Button (standalone)
// ============================================================================

function AddStepButton({ onAdd }: { onAdd: (type: NodeType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options: { type: NodeType; label: string; icon: typeof Filter; desc: string }[] = [
    { type: 'condition', label: 'Condition', icon: Filter, desc: 'Filter based on criteria' },
    { type: 'action', label: 'Action', icon: Play, desc: 'Perform an operation' },
    { type: 'branch', label: 'Branch', icon: GitBranch, desc: 'If/else conditional split' },
    { type: 'delay', label: 'Delay', icon: Clock, desc: 'Wait before next step' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-th-border hover:border-th-accent-500 bg-surface-secondary hover:bg-surface-tertiary transition-all group"
      >
        <Plus className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-600" />
        <span className="text-sm font-medium text-th-text-tertiary group-hover:text-th-text-primary">
          Add Step
        </span>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 bg-surface-primary border border-th-border rounded-xl shadow-lg p-2 min-w-[220px]">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => { onAdd(opt.type); setOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-surface-secondary rounded-lg transition-colors"
              >
                <div className={cn('p-1.5 rounded-lg', NODE_COLORS[opt.type].iconBg)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-th-text-primary">{opt.label}</div>
                  <div className="text-[10px] text-th-text-tertiary">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function countNodes(nodeList: WorkflowNode[]): number {
  let count = 0;
  for (const n of nodeList) {
    count += 1;
    count += countNodes(n.children);
    if (n.elseBranch) count += countNodes(n.elseBranch);
  }
  return count;
}
