import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  Mail,
  Users,
  Edit2,
  X,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import toast from 'react-hot-toast';
import type {
  EmailSchedule,
  ScheduleStatus,
  ScheduleType,
  RecipientType,
  ScheduleConfig,
  CRMTemplate,
} from '@mpbhealth/crm-core';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const SCHEDULE_TYPES: { value: ScheduleType; label: string; description: string }[] = [
  { value: 'once', label: 'One Time', description: 'Send once on a specific date' },
  { value: 'daily', label: 'Daily', description: 'Send every day at the same time' },
  { value: 'weekly', label: 'Weekly', description: 'Send on specific days each week' },
  { value: 'monthly', label: 'Monthly', description: 'Send on a specific day each month' },
];

const RECIPIENT_TYPES: { value: RecipientType; label: string }[] = [
  { value: 'leads', label: 'All Leads' },
  { value: 'members', label: 'All Members' },
  { value: 'agents', label: 'All Agents' },
  { value: 'custom', label: 'Custom Filter' },
];

interface FormData {
  name: string;
  description: string;
  template_id: string;
  recipient_type: RecipientType;
  recipient_filter: Record<string, unknown>;
  schedule_type: ScheduleType;
  time: string;
  timezone: string;
  days_of_week: number[];
  day_of_month: number;
  run_date: string;
}

const DEFAULT_FORM: FormData = {
  name: '',
  description: '',
  template_id: '',
  recipient_type: 'leads',
  recipient_filter: {},
  schedule_type: 'daily',
  time: '09:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
  day_of_month: 1,
  run_date: new Date().toISOString().split('T')[0],
};

export default function EmailSchedules() {
  const { supabase, orgId, user, templateService } = useCRM();

  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [templates, setTemplates] = useState<CRMTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EmailSchedule | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);

  const loadSchedules = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('email_schedules')
        .select(`
          *,
          template:template_id (name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSchedules(
        (data || []).map((s) => ({
          ...s,
          template_name: s.template?.name,
          recipient_filter: s.recipient_filter || {},
          recipient_list: s.recipient_list || [],
        }))
      );
    } catch (err) {
      console.error('Failed to load schedules:', err);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [supabase, orgId]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await templateService.listTemplates({ template_type: 'email', is_active: true });
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, [templateService]);

  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, [loadSchedules, loadTemplates]);

  const openModal = (schedule?: EmailSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setForm({
        name: schedule.name,
        description: schedule.description || '',
        template_id: schedule.template_id || '',
        recipient_type: schedule.recipient_type,
        recipient_filter: schedule.recipient_filter,
        schedule_type: schedule.schedule_type,
        time: schedule.schedule_config.time || '09:00',
        timezone: schedule.schedule_config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        days_of_week: schedule.schedule_config.days_of_week || [1, 2, 3, 4, 5],
        day_of_month: schedule.schedule_config.day_of_month || 1,
        run_date: schedule.schedule_config.run_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingSchedule(null);
      setForm(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !user) return;

    if (!form.name.trim()) {
      toast.error('Schedule name is required');
      return;
    }

    setSaving(true);

    try {
      const scheduleConfig: ScheduleConfig = {
        time: form.time,
        timezone: form.timezone,
      };

      if (form.schedule_type === 'weekly') {
        scheduleConfig.days_of_week = form.days_of_week;
      } else if (form.schedule_type === 'monthly') {
        scheduleConfig.day_of_month = form.day_of_month;
      } else if (form.schedule_type === 'once') {
        scheduleConfig.run_date = form.run_date;
      }

      // Calculate next run time
      const [hours, minutes] = form.time.split(':').map(Number);
      const nextRun = new Date();
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= new Date()) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const payload = {
        org_id: orgId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        template_id: form.template_id || null,
        recipient_type: form.recipient_type,
        recipient_filter: form.recipient_filter,
        recipient_list: [],
        schedule_type: form.schedule_type,
        schedule_config: scheduleConfig,
        next_run_at: nextRun.toISOString(),
        status: 'active' as ScheduleStatus,
        updated_at: new Date().toISOString(),
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('email_schedules')
          .update(payload)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success('Schedule updated');
      } else {
        const { error } = await supabase.from('email_schedules').insert({
          ...payload,
          created_by: user.id,
        });

        if (error) throw error;
        toast.success('Schedule created');
      }

      closeModal();
      loadSchedules();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handlePauseResume = async (schedule: EmailSchedule) => {
    try {
      const newStatus = schedule.status === 'active' ? 'paused' : 'active';
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'active') {
        const config = schedule.schedule_config;
        const [hours, minutes] = (config.time || '09:00').split(':').map(Number);
        const nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);
        if (nextRun <= new Date()) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        updates.next_run_at = nextRun.toISOString();
      }

      const { error } = await supabase
        .from('email_schedules')
        .update(updates)
        .eq('id', schedule.id);

      if (error) throw error;

      toast.success(newStatus === 'active' ? 'Schedule resumed' : 'Schedule paused');
      loadSchedules();
    } catch (err) {
      console.error('Failed to update schedule:', err);
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase.from('email_schedules').delete().eq('id', id);
      if (error) throw error;

      toast.success('Schedule deleted');
      loadSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      toast.error('Failed to delete schedule');
    }
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    const styles = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return styles[status];
  };

  const getRecipientLabel = (schedule: EmailSchedule) => {
    if (schedule.recipient_list.length > 0) {
      return `${schedule.recipient_list.length} recipients`;
    }
    return schedule.recipient_type;
  };

  const getScheduleLabel = (schedule: EmailSchedule) => {
    const config = schedule.schedule_config;
    const time = config.time || '09:00';

    switch (schedule.schedule_type) {
      case 'once':
        return `Once at ${time}${config.run_date ? ` on ${new Date(config.run_date).toLocaleDateString()}` : ''}`;
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = (config.days_of_week || []).map((d) => days[d]).join(', ');
        return `Weekly on ${selectedDays || 'N/A'} at ${time}`;
      case 'monthly':
        return `Monthly on day ${config.day_of_month || 1} at ${time}`;
      default:
        return schedule.schedule_type;
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setForm((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <GradientHeader title="Email Schedules" subtitle="Manage automated email campaigns" />
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Schedules</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">{schedules.length}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {schedules.filter((s) => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Emails Sent</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">
            {schedules.reduce((sum, s) => sum + s.total_sent, 0)}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Avg Open Rate</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {schedules.length > 0
              ? Math.round(
                  schedules.reduce((sum, s) => {
                    return sum + (s.total_sent > 0 ? (s.total_opened / s.total_sent) * 100 : 0);
                  }, 0) / schedules.length
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Schedules List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No email schedules yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">
              Create a schedule to automate your email campaigns
            </p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 hover:bg-surface-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-th-text-primary">{schedule.name}</h3>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          schedule.status
                        )}`}
                      >
                        {schedule.status}
                      </span>
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-th-text-tertiary mb-3">{schedule.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-th-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-th-text-tertiary" />
                        <span>{getScheduleLabel(schedule)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-th-text-tertiary" />
                        <span>{getRecipientLabel(schedule)}</span>
                      </div>
                      {schedule.template_name && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-th-text-tertiary" />
                          <span>{schedule.template_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-3 text-xs text-th-text-tertiary">
                      <span>Sent: {schedule.total_sent}</span>
                      <span>Opened: {schedule.total_opened}</span>
                      <span>Clicked: {schedule.total_clicked}</span>
                      {schedule.next_run_at && schedule.status === 'active' && (
                        <span>
                          Next run: {new Date(schedule.next_run_at).toLocaleDateString()}{' '}
                          {new Date(schedule.next_run_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handlePauseResume(schedule)}
                      disabled={schedule.status === 'completed' || schedule.status === 'failed'}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      title={schedule.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {schedule.status === 'active' ? (
                        <Pause className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Play className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => openModal(schedule)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-th-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-th-text-primary">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Weekly Newsletter"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary resize-none"
                  />
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-th-text-primary">Email Template</h3>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Select Template
                  </label>
                  <select
                    value={form.template_id}
                    onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  >
                    <option value="">No template (custom email)</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-th-text-tertiary mt-1">
                    Select an email template or leave blank to compose a custom email
                  </p>
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-th-text-primary">Recipients</h3>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-2">
                    Recipient Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {RECIPIENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, recipient_type: type.value })}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          form.recipient_type === type.value
                            ? 'border-th-accent-500 bg-th-accent-50 text-th-accent-700 dark:bg-th-accent-900/20 dark:text-th-accent-300'
                            : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule Type */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-th-text-primary">Schedule</h3>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-2">
                    Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SCHEDULE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, schedule_type: type.value })}
                        className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                          form.schedule_type === type.value
                            ? 'border-th-accent-500 bg-th-accent-50 dark:bg-th-accent-900/20'
                            : 'border-th-border hover:bg-surface-secondary'
                        }`}
                      >
                        <p className={`text-sm font-medium ${
                          form.schedule_type === type.value
                            ? 'text-th-accent-700 dark:text-th-accent-300'
                            : 'text-th-text-primary'
                        }`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-th-text-tertiary">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={form.timezone}
                      onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                      placeholder="America/New_York"
                    />
                  </div>
                </div>

                {/* Weekly Days */}
                {form.schedule_type === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-2">
                      Days of Week
                    </label>
                    <div className="flex gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(day.value)}
                          className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                            form.days_of_week.includes(day.value)
                              ? 'border-th-accent-500 bg-th-accent-600 text-white'
                              : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Day */}
                {form.schedule_type === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1">
                      Day of Month
                    </label>
                    <select
                      value={form.day_of_month}
                      onChange={(e) => setForm({ ...form, day_of_month: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* One-time Date */}
                {form.schedule_type === 'once' && (
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1">
                      Run Date
                    </label>
                    <input
                      type="date"
                      value={form.run_date}
                      onChange={(e) => setForm({ ...form, run_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
