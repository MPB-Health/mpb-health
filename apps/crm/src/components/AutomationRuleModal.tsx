import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useCRM } from '../contexts/CRMContext';
import type { AutomationRule } from '@mpbhealth/crm-core';

interface Props {
  open: boolean;
  onClose: () => void;
  rule?: AutomationRule | null;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
  trigger_type: string;
  action_type: string;
  delay_minutes: string;
  // Trigger condition fields
  to_stage: string;
  min_score: string;
  days_inactive: string;
  // Action config fields
  task_title: string;
  task_priority: string;
  due_hours: string;
  urgency: string;
  priority: string;
}

const TRIGGER_OPTIONS = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'stage_change', label: 'Stage Change' },
  { value: 'no_activity', label: 'No Activity' },
  { value: 'high_score', label: 'High Score' },
  { value: 'task_overdue', label: 'Task Overdue' },
  { value: 'lead_activity', label: 'Lead Activity' },
];

const ACTION_OPTIONS = [
  { value: 'create_task', label: 'Create Task' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'assign_lead', label: 'Assign Lead' },
  { value: 'update_priority', label: 'Update Priority' },
  { value: 'send_email', label: 'Send Email' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function parseConditions(rule?: AutomationRule | null) {
  const c = rule?.trigger_conditions as Record<string, unknown> ?? {};
  return {
    to_stage: (c.to_stage as string) || '',
    min_score: c.min_score != null ? String(c.min_score) : '',
    days_inactive: c.days_inactive != null ? String(c.days_inactive) : '',
  };
}

function parseActionConfig(rule?: AutomationRule | null) {
  const c = rule?.action_config as Record<string, unknown> ?? {};
  return {
    task_title: (c.title as string) || '',
    task_priority: (c.priority as string) || 'medium',
    due_hours: c.due_hours != null ? String(c.due_hours) : '24',
    urgency: (c.urgency as string) || 'normal',
    priority: (c.priority as string) || 'medium',
  };
}

export function AutomationRuleModal({ open, onClose, rule, onSuccess }: Props) {
  const { automationService, pipelineStages } = useCRM();
  const isEdit = !!rule;

  const cond = parseConditions(rule);
  const acfg = parseActionConfig(rule);

  const { values, errors, loading, handleChange, handleSubmit, setFieldValue, reset } =
    useForm<FormValues>({
      initialValues: {
        name: rule?.name || '',
        description: rule?.description || '',
        trigger_type: rule?.trigger_type || 'new_lead',
        action_type: rule?.action_type || 'create_task',
        delay_minutes: String(rule?.delay_minutes || 0),
        ...cond,
        ...acfg,
      },
      validate: (v) => {
        const errs: Partial<Record<keyof FormValues, string>> = {};
        if (!v.name.trim()) errs.name = 'Name is required';
        return errs;
      },
      onSubmit: async (v) => {
        // Build trigger conditions
        const trigger_conditions: Record<string, unknown> = {};
        if (v.trigger_type === 'stage_change' && v.to_stage) {
          trigger_conditions.to_stage = v.to_stage;
        }
        if (v.trigger_type === 'high_score' && v.min_score) {
          trigger_conditions.min_score = Number(v.min_score);
        }
        if (v.trigger_type === 'no_activity' && v.days_inactive) {
          trigger_conditions.days_inactive = Number(v.days_inactive);
        }

        // Build action config
        const action_config: Record<string, unknown> = {};
        if (v.action_type === 'create_task') {
          action_config.title = v.task_title || `Auto: ${v.name}`;
          action_config.priority = v.task_priority;
          action_config.due_hours = Number(v.due_hours) || 24;
          action_config.task_type = 'follow_up';
        }
        if (v.action_type === 'send_notification') {
          action_config.urgency = v.urgency;
          action_config.channels = ['push'];
        }
        if (v.action_type === 'update_priority') {
          action_config.priority = v.priority;
        }

        const input = {
          name: v.name,
          description: v.description || undefined,
          trigger_type: v.trigger_type as AutomationRule['trigger_type'],
          trigger_conditions,
          action_type: v.action_type as AutomationRule['action_type'],
          action_config,
          delay_minutes: Number(v.delay_minutes) || 0,
        };

        const result = isEdit
          ? await automationService.updateRule(rule!.id, input)
          : await automationService.createRule(input);

        if (!result.success) {
          toast.error(result.error || `Failed to ${isEdit ? 'update' : 'create'} rule`);
          return;
        }

        toast.success(isEdit ? 'Rule updated' : 'Rule created');
        onSuccess?.();
        onClose();
      },
    });

  useEffect(() => {
    if (open) {
      const c2 = parseConditions(rule);
      const a2 = parseActionConfig(rule);
      reset();
      setFieldValue('name', rule?.name || '');
      setFieldValue('description', rule?.description || '');
      setFieldValue('trigger_type', rule?.trigger_type || 'new_lead');
      setFieldValue('action_type', rule?.action_type || 'create_task');
      setFieldValue('delay_minutes', String(rule?.delay_minutes || 0));
      setFieldValue('to_stage', c2.to_stage);
      setFieldValue('min_score', c2.min_score);
      setFieldValue('days_inactive', c2.days_inactive);
      setFieldValue('task_title', a2.task_title);
      setFieldValue('task_priority', a2.task_priority);
      setFieldValue('due_hours', a2.due_hours);
      setFieldValue('urgency', a2.urgency);
      setFieldValue('priority', a2.priority);
    }
  }, [open, rule]);

  const stageOptions = pipelineStages.map((s) => ({ value: s.name, label: s.display_name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Automation Rule' : 'New Automation Rule'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="e.g. Auto-task for new leads"
        />

        <TextareaField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={2}
          placeholder="Optional description"
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Trigger"
            name="trigger_type"
            value={values.trigger_type}
            onChange={handleChange}
            options={TRIGGER_OPTIONS}
          />
          <SelectField
            label="Action"
            name="action_type"
            value={values.action_type}
            onChange={handleChange}
            options={ACTION_OPTIONS}
          />
        </div>

        {/* Dynamic trigger condition fields */}
        {values.trigger_type === 'stage_change' && stageOptions.length > 0 && (
          <SelectField
            label="To Stage"
            name="to_stage"
            value={values.to_stage}
            onChange={handleChange}
            options={[{ value: '', label: 'Any stage' }, ...stageOptions]}
          />
        )}
        {values.trigger_type === 'high_score' && (
          <InputField
            label="Minimum Score"
            name="min_score"
            type="number"
            value={values.min_score}
            onChange={handleChange}
            placeholder="e.g. 80"
          />
        )}
        {values.trigger_type === 'no_activity' && (
          <InputField
            label="Days Inactive"
            name="days_inactive"
            type="number"
            value={values.days_inactive}
            onChange={handleChange}
            placeholder="e.g. 3"
          />
        )}

        {/* Dynamic action config fields */}
        {values.action_type === 'create_task' && (
          <div className="space-y-3 p-3 bg-surface-tertiary rounded-lg">
            <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Task Config</p>
            <InputField
              label="Task Title"
              name="task_title"
              value={values.task_title}
              onChange={handleChange}
              placeholder="e.g. Follow up with lead"
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Priority"
                name="task_priority"
                value={values.task_priority}
                onChange={handleChange}
                options={PRIORITY_OPTIONS}
              />
              <InputField
                label="Due (hours)"
                name="due_hours"
                type="number"
                value={values.due_hours}
                onChange={handleChange}
                placeholder="24"
              />
            </div>
          </div>
        )}
        {values.action_type === 'send_notification' && (
          <SelectField
            label="Urgency"
            name="urgency"
            value={values.urgency}
            onChange={handleChange}
            options={URGENCY_OPTIONS}
          />
        )}
        {values.action_type === 'update_priority' && (
          <SelectField
            label="Set Priority To"
            name="priority"
            value={values.priority}
            onChange={handleChange}
            options={PRIORITY_OPTIONS}
          />
        )}

        <InputField
          label="Delay (minutes)"
          name="delay_minutes"
          type="number"
          value={values.delay_minutes}
          onChange={handleChange}
          placeholder="0"
        />

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label={isEdit ? 'Save Changes' : 'Create Rule'} />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
