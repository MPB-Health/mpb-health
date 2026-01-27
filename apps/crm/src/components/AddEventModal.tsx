import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useCRM } from '../contexts/CRMContext';
import type { Lead } from '@mpbhealth/crm-core';

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
  leadId?: string;
  onSuccess?: () => void;
}

interface EventFormValues {
  title: string;
  event_type: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  all_day: string;
  location: string;
  meeting_link: string;
  lead_id: string;
  reminder_minutes: string;
  description: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'other', label: 'Other' },
];

const REMINDER_OPTIONS = [
  { value: '', label: 'No Reminder' },
  { value: '5', label: '5 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

export function AddEventModal({ open, onClose, defaultDate, leadId, onSuccess }: AddEventModalProps) {
  const { calendarService, leadService } = useCRM();
  const [leadSearch, setLeadSearch] = useState('');
  const [leadResults, setLeadResults] = useState<Lead[]>([]);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  const today = defaultDate || new Date().toISOString().split('T')[0];

  const { values, errors, loading, handleChange, handleSubmit, setFieldValue } = useForm<EventFormValues>({
    initialValues: {
      title: '',
      event_type: 'meeting',
      start_date: today,
      start_time: '09:00',
      end_date: today,
      end_time: '10:00',
      all_day: 'false',
      location: '',
      meeting_link: '',
      lead_id: leadId || '',
      reminder_minutes: '15',
      description: '',
    },
    validate: (vals) => {
      const errs: Partial<Record<keyof EventFormValues, string>> = {};
      if (!vals.title.trim()) errs.title = 'Title is required';
      if (!vals.start_date) errs.start_date = 'Start date is required';
      if (!vals.end_date) errs.end_date = 'End date is required';
      if (vals.all_day !== 'true') {
        if (!vals.start_time) errs.start_time = 'Start time is required';
        if (!vals.end_time) errs.end_time = 'End time is required';
      }
      return errs;
    },
    onSubmit: async (vals) => {
      const isAllDay = vals.all_day === 'true';
      const startTime = isAllDay
        ? `${vals.start_date}T00:00:00`
        : `${vals.start_date}T${vals.start_time}`;
      const endTime = isAllDay
        ? `${vals.end_date}T23:59:59`
        : `${vals.end_date}T${vals.end_time}`;

      const result = await calendarService.createEvent({
        title: vals.title,
        event_type: vals.event_type as any,
        start_time: startTime,
        end_time: endTime,
        all_day: isAllDay,
        location: vals.location || undefined,
        meeting_link: vals.meeting_link || undefined,
        lead_id: vals.lead_id || undefined,
        reminder_minutes: vals.reminder_minutes ? Number(vals.reminder_minutes) : undefined,
        description: vals.description || undefined,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create event');
        return;
      }

      toast.success('Event created');
      onSuccess?.();
      onClose();
    },
  });

  // Lead search with debounce
  const searchLeads = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLeadResults([]);
      return;
    }
    const { leads } = await leadService.getLeads({ search: query }, 5, 0);
    setLeadResults(leads);
    setShowLeadDropdown(true);
  }, [leadService]);

  useEffect(() => {
    const timer = setTimeout(() => searchLeads(leadSearch), 300);
    return () => clearTimeout(timer);
  }, [leadSearch, searchLeads]);

  const selectLead = (lead: Lead) => {
    setFieldValue('lead_id', lead.id);
    setLeadSearch(`${lead.first_name} ${lead.last_name}`);
    setShowLeadDropdown(false);
  };

  const isAllDay = values.all_day === 'true';

  return (
    <Modal open={open} onClose={onClose} title="Add Event" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Title"
          name="title"
          value={values.title}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="e.g. Benefits review meeting"
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Event Type"
            name="event_type"
            value={values.event_type}
            onChange={handleChange}
            options={EVENT_TYPE_OPTIONS}
          />
          <SelectField
            label="Reminder"
            name="reminder_minutes"
            value={values.reminder_minutes}
            onChange={handleChange}
            options={REMINDER_OPTIONS}
          />
        </div>

        {/* All-day toggle */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => setFieldValue('all_day', e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 rounded border-th-border"
          />
          <span className="text-th-text-secondary">All day event</span>
        </label>

        {/* Start */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            name="start_date"
            type="date"
            value={values.start_date}
            onChange={handleChange}
            error={errors.start_date}
            required
          />
          {!isAllDay && (
            <InputField
              label="Start Time"
              name="start_time"
              type="time"
              value={values.start_time}
              onChange={handleChange}
              error={errors.start_time}
              required
            />
          )}
        </div>

        {/* End */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="End Date"
            name="end_date"
            type="date"
            value={values.end_date}
            onChange={handleChange}
            error={errors.end_date}
            required
          />
          {!isAllDay && (
            <InputField
              label="End Time"
              name="end_time"
              type="time"
              value={values.end_time}
              onChange={handleChange}
              error={errors.end_time}
              required
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Location"
            name="location"
            value={values.location}
            onChange={handleChange}
            placeholder="e.g. Office / Zoom"
          />
          <InputField
            label="Meeting Link"
            name="meeting_link"
            value={values.meeting_link}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>

        {/* Lead selector */}
        {!leadId && (
          <div className="relative">
            <InputField
              label="Link to Lead (optional)"
              name="lead_search"
              value={leadSearch}
              onChange={(e) => {
                setLeadSearch(e.target.value);
                if (!e.target.value) {
                  setFieldValue('lead_id', '');
                }
              }}
              placeholder="Search for a lead..."
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

        <TextareaField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Event details..."
          rows={2}
        />

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Create Event" />
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
