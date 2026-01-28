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
  MoreVertical,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import toast from 'react-hot-toast';
import type { EmailSchedule, ScheduleStatus } from '@mpbhealth/crm-core';

export default function EmailSchedules() {
  const { supabase, orgId, user } = useCRM();

  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EmailSchedule | null>(null);

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

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handlePauseResume = async (schedule: EmailSchedule) => {
    try {
      const newStatus = schedule.status === 'active' ? 'paused' : 'active';
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'active') {
        // Calculate next run time
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <GradientHeader title="Email Schedules" subtitle="Manage automated email campaigns" />
        <button
          onClick={() => {
            setEditingSchedule(null);
            setShowModal(true);
          }}
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
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setShowModal(true);
                      }}
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

      {/* TODO: Add Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 max-w-lg w-full mx-4">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </h2>
            <p className="text-sm text-th-text-tertiary mb-4">
              Schedule creation form coming soon. This modal will include:
              <br />• Name and description
              <br />• Template selection
              <br />• Recipient type and filters
              <br />• Schedule frequency configuration
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSchedule(null);
                }}
                className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
