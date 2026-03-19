import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { Lead } from '@mpbhealth/crm-core';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  onSuccess?: () => void;
}

interface TaskFormValues {
  lead_id: string;
  title: string;
  description: string;
  task_type: string;
  due_date: string;
  due_time: string;
  priority: string;
}

const TASK_TYPE_OPTIONS = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function AddTaskModal({ open, onClose, leadId, onSuccess }: AddTaskModalProps) {
  const { taskService, leadService, refreshTasks } = useCRM();
  const { activeOrgId } = useOrg();
  const [leadSearch, setLeadSearch] = useState('');
  const [leadResults, setLeadResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  // Default due date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDue = tomorrow.toISOString().split('T')[0];

  const { values, errors, loading, handleChange, handleSubmit, setFieldValue } = useForm<TaskFormValues>({
    initialValues: {
      lead_id: leadId || '',
      title: '',
      description: '',
      task_type: 'follow_up',
      due_date: defaultDue,
      due_time: '',
      priority: 'medium',
    },
    validate: (vals) => {
      const errs: Partial<Record<keyof TaskFormValues, string>> = {};
      if (!vals.title.trim()) errs.title = 'Title is required';
      if (!vals.due_date) errs.due_date = 'Due date is required';
      if (!vals.lead_id) errs.lead_id = 'Lead is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const result = await taskService.createTask({
        lead_id: vals.lead_id,
        title: vals.title,
        description: vals.description || undefined,
        task_type: vals.task_type as 'follow_up' | 'call' | 'email' | 'meeting' | 'other',
        due_date: vals.due_time ? `${vals.due_date}T${vals.due_time}` : vals.due_date,
        priority: vals.priority as 'low' | 'medium' | 'high',
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create task');
        return;
      }

      toast.success('Task created');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.TASK_CREATED,
        entityType: 'task',
        after: { title: vals.title, lead_id: vals.lead_id, task_type: vals.task_type },
      }).catch(console.error);
      refreshTasks();
      onSuccess?.();
      onClose();
    },
  });

  // Reset search state when modal opens/closes
  useEffect(() => {
    if (!open) return;
    setLeadSearch('');
    setLeadResults([]);
    setSelectedLead(null);
    setShowLeadDropdown(false);
  }, [open]);

  // Lead search with debounce
  const searchLeads = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLeadResults([]);
      return;
    }
    try {
      const { leads } = await leadService.getLeads({ search: query }, 5, 0);
      setLeadResults(leads);
      setShowLeadDropdown(true);
    } catch {
      // Search is non-critical — silently fail
    }
  }, [leadService]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchLeads(leadSearch), 300);
    return () => clearTimeout(timer);
  }, [leadSearch, searchLeads, open]);

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setFieldValue('lead_id', lead.id);
    setLeadSearch(`${lead.first_name} ${lead.last_name}`);
    setShowLeadDropdown(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead selector (only if no leadId prop) */}
        {!leadId && (
          <div className="relative">
            <InputField
              label="Lead"
              name="lead_search"
              value={leadSearch}
              onChange={(e) => {
                setLeadSearch(e.target.value);
                if (!e.target.value) {
                  setSelectedLead(null);
                  setFieldValue('lead_id', '');
                }
              }}
              placeholder="Search for a lead..."
              required
              error={errors.lead_id}
            />
            {showLeadDropdown && leadResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-surface-primary border border-th-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {leadResults.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => selectLead(lead)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary"
                  >
                    <span className="font-medium">{lead.first_name} {lead.last_name}</span>
                    <span className="text-th-text-tertiary ml-2">{lead.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <InputField
          label="Title"
          name="title"
          value={values.title}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="e.g. Follow up on quote"
        />

        <TextareaField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Additional details..."
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Type"
            name="task_type"
            value={values.task_type}
            onChange={handleChange}
            options={TASK_TYPE_OPTIONS}
          />
          <SelectField
            label="Priority"
            name="priority"
            value={values.priority}
            onChange={handleChange}
            options={PRIORITY_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Due Date"
            name="due_date"
            type="date"
            value={values.due_date}
            onChange={handleChange}
            error={errors.due_date}
            required
          />
          <InputField
            label="Due Time"
            name="due_time"
            type="time"
            value={values.due_time}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Create Task" />
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
