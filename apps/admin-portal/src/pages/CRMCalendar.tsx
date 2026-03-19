import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  calendarAdminService,
  type CalendarEvent,
  type CalendarEventCreateInput,
} from '@mpbhealth/admin-core';

const EVENT_TYPES = [
  'meeting',
  'webinar',
  'training',
  'deadline',
  'holiday',
  'other',
];

const COLOR_PRESETS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function groupByDate(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const dateKey = new Date(event.start_time).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return groups;
}

const EMPTY_FORM: CalendarEventCreateInput = {
  title: '',
  start_time: '',
  end_time: '',
  description: '',
  all_day: false,
  location: '',
  event_type: '',
  color: '#3B82F6',
};

export default function CRMCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(getCurrentMonth);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CalendarEventCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const timeout = setTimeout(() => setLoading(false), 8000);
    try {
      const [data, upcoming] = await Promise.all([
        calendarAdminService.getAll({
          month: month || undefined,
          eventType: typeFilter || undefined,
        }),
        calendarAdminService.getUpcoming(100),
      ]);
      setEvents(data);
      setUpcomingCount(upcoming.length);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Failed to load calendar events');
      toast.error('Failed to load calendar events');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [month, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadEvents();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadEvents]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(event: CalendarEvent) {
    setForm({
      title: event.title,
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16),
      description: event.description || '',
      all_day: event.all_day,
      location: event.location || '',
      event_type: event.event_type || '',
      color: event.color || '#3B82F6',
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.start_time || !form.end_time) {
      toast.error('Title, start time, and end time are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        location: form.location || null,
        event_type: form.event_type || null,
        description: form.description || null,
        color: form.color || null,
      };
      if (editingId) {
        await calendarAdminService.update(editingId, payload);
        toast.success('Event updated');
      } else {
        await calendarAdminService.create(
          payload as CalendarEventCreateInput,
        );
        toast.success('Event created');
      }
      setShowForm(false);
      loadEvents();
    } catch {
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this calendar event? This cannot be undone.'))
      return;
    try {
      await calendarAdminService.delete(id);
      toast.success('Event deleted');
      loadEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  }

  const grouped = groupByDate(events);
  const sortedDates = Object.keys(grouped).sort();

  if (error && !loading && events.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            Calendar
          </h1>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <p className="text-th-text-tertiary mb-4">{error}</p>
          <button
            type="button"
            onClick={loadEvents}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Calendar</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            {events.length} events this month / {upcomingCount} upcoming
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Stats chips */}
      <div className="flex flex-wrap gap-3">
        <div className="px-4 py-2 bg-surface-primary border border-th-border rounded-lg">
          <span className="text-xs text-th-text-tertiary">
            Events This Month
          </span>
          <p className="text-lg font-semibold text-th-text-primary">
            {events.length}
          </p>
        </div>
        <div className="px-4 py-2 bg-surface-primary border border-th-border rounded-lg">
          <span className="text-xs text-th-text-tertiary">Upcoming</span>
          <p className="text-lg font-semibold text-blue-600">
            {upcomingCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
        >
          <option value="">All Event Types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-2xl border border-th-border w-full max-w-xl shadow-xl">
            <div className="px-6 py-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingId ? 'Edit Event' : 'New Event'}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Event title"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.all_day ?? false}
                  onChange={(e) =>
                    setForm({ ...form, all_day: e.target.checked })
                  }
                  className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <span className="text-sm text-th-text-secondary">
                  All day event
                </span>
              </label>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location || ''}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Conference Room A"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Event Type
                  </label>
                  <select
                    value={form.event_type || ''}
                    onChange={(e) =>
                      setForm({ ...form, event_type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  >
                    <option value="">Select type</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Color
                  </label>
                  <select
                    value={form.color || '#3B82F6'}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  >
                    {COLOR_PRESETS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Event description..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-th-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event list grouped by date */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-th-accent-600" />
          </div>
        ) : sortedDates.length > 0 ? (
          <div className="divide-y divide-th-border">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="px-5 py-3 bg-surface-secondary">
                  <h3 className="text-sm font-semibold text-th-text-secondary">
                    {formatDate(date + 'T00:00:00')}
                  </h3>
                </div>
                <div className="divide-y divide-th-border-subtle">
                  {grouped[date].map((event) => (
                    <div
                      key={event.id}
                      className="px-5 py-4 flex items-start gap-4 hover:bg-surface-tertiary transition-colors"
                    >
                      {/* Color dot */}
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{
                          backgroundColor: event.color || '#3B82F6',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-th-text-primary text-sm">
                            {event.title}
                          </p>
                          {event.event_type && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                              {event.event_type}
                            </span>
                          )}
                          {event.all_day && (
                            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                              All Day
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-th-text-tertiary">
                          {!event.all_day && (
                            <span>
                              {formatTime(event.start_time)} -{' '}
                              {formatTime(event.end_time)}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-th-text-tertiary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">
              No events found for this month
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-4 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
            >
              Create your first event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
