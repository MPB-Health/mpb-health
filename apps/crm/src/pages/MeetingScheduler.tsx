// ============================================================================
// Meeting Scheduler — Shareable booking links for leads (Calendly-like)
// ============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Calendar,
  Clock,
  Copy,
  Trash2,
  Pencil,
  Eye,
  Link2,
  Video,
  Phone,
  MapPin,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  Loader2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarDays,
  Timer,
  Globe,
  Mail,
  User,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Ban,
  CalendarCheck,
  CalendarX,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { HelpBanner } from '../components/help';

// ============================================================================
// Types
// ============================================================================

type LocationType = 'video' | 'phone' | 'in_person' | 'custom';
type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type ViewMode = 'schedules' | 'bookings' | 'preview';

interface AvailableHours {
  [day: string]: { enabled: boolean; ranges: { start: string; end: string }[] };
}

interface MeetingSchedule {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  slug: string;
  available_hours: AvailableHours;
  booking_window_days: number;
  confirmation_template_id: string | null;
  reminder_template_id: string | null;
  is_active: boolean;
  location_type: LocationType;
  location_config: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

interface MeetingBooking {
  id: string;
  schedule_id: string;
  lead_id: string | null;
  contact_id: string | null;
  booker_name: string;
  booker_email: string;
  booker_phone: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  calendar_event_id: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
}

interface ScheduleStats {
  total: number;
  upcoming: number;
  completed: number;
  no_shows: number;
}

// ============================================================================
// Constants
// ============================================================================

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 0, label: 'Custom' },
];

const BUFFER_OPTIONS = [
  { value: 0, label: 'No buffer' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
];

const BOOKING_WINDOW_OPTIONS = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

const LOCATION_TYPES: { value: LocationType; label: string; icon: typeof Video; desc: string }[] = [
  { value: 'video', label: 'Video Call', icon: Video, desc: 'Zoom, Meet, Teams, etc.' },
  { value: 'phone', label: 'Phone Call', icon: Phone, desc: 'You or lead calls' },
  { value: 'in_person', label: 'In Person', icon: MapPin, desc: 'Office or venue' },
  { value: 'custom', label: 'Custom', icon: Settings, desc: 'Custom location details' },
];

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: typeof Check }> = {
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-100', icon: CalendarCheck },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', icon: CalendarX },
  no_show: { label: 'No Show', color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertTriangle },
};

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'UTC', label: 'UTC' },
];

const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    TIME_SLOTS.push(`${hh}:${mm}`);
  }
}

const DEFAULT_AVAILABLE_HOURS: AvailableHours = {
  monday: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, ranges: [] },
  sunday: { enabled: false, ranges: [] },
};

const BOOKING_DOMAIN = 'yourdomain.com';

// ============================================================================
// Helpers
// ============================================================================

function formatTime24to12(t: string): string {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

function getLocationIcon(type: LocationType) {
  switch (type) {
    case 'video': return Video;
    case 'phone': return Phone;
    case 'in_person': return MapPin;
    default: return Settings;
  }
}

function getLocationLabel(type: LocationType) {
  return LOCATION_TYPES.find((l) => l.value === type)?.label ?? 'Custom';
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function LocationBadge({ type }: { type: LocationType }) {
  const Icon = getLocationIcon(type);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-tertiary text-th-text-primary">
      <Icon className="w-3 h-3" />
      {getLocationLabel(type)}
    </span>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Calendar }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-secondary">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-th-accent-600/10">
        <Icon className="w-4.5 h-4.5 text-th-accent-600" />
      </div>
      <div>
        <p className="text-lg font-semibold text-th-text-primary">{value}</p>
        <p className="text-xs text-th-text-secondary">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-th-accent-600/10 mb-5">
        <CalendarDays className="w-8 h-8 text-th-accent-600" />
      </div>
      <h3 className="text-lg font-semibold text-th-text-primary mb-2">No meeting schedules yet</h3>
      <p className="text-sm text-th-text-secondary text-center max-w-md mb-6">
        Create a booking link that leads can use to self-schedule meetings with you. Set your availability, duration, and location preferences.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-600/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Your First Schedule
      </button>
    </div>
  );
}

// ============================================================================
// Schedule Card
// ============================================================================

function ScheduleCard({
  schedule,
  stats,
  onEdit,
  onCopyLink,
  onViewBookings,
  onToggleActive,
  onDelete,
}: {
  schedule: MeetingSchedule;
  stats: ScheduleStats;
  onEdit: () => void;
  onCopyLink: () => void;
  onViewBookings: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const bookingUrl = `https://${BOOKING_DOMAIN}/book/${schedule.slug}`;
  const LocIcon = getLocationIcon(schedule.location_type);

  return (
    <div className="rounded-xl border border-th-border bg-surface-primary p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-th-text-primary truncate">{schedule.name}</h3>
            {schedule.is_active ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 uppercase tracking-wide">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-tertiary text-th-text-secondary uppercase tracking-wide">
                Inactive
              </span>
            )}
          </div>
          {schedule.description && (
            <p className="text-sm text-th-text-secondary line-clamp-2">{schedule.description}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-th-text-secondary">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {schedule.duration_minutes} min
        </span>
        {schedule.buffer_minutes > 0 && (
          <span className="inline-flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" />
            {schedule.buffer_minutes} min buffer
          </span>
        )}
        <LocationBadge type={schedule.location_type} />
      </div>

      {/* Booking link */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-surface-secondary">
        <Link2 className="w-3.5 h-3.5 text-th-text-tertiary flex-shrink-0" />
        <span className="text-xs text-th-text-secondary truncate flex-1 font-mono">{bookingUrl}</span>
        <button
          onClick={onCopyLink}
          className="flex-shrink-0 p-1 rounded hover:bg-surface-tertiary transition-colors"
          title="Copy link"
        >
          <Copy className="w-3.5 h-3.5 text-th-text-secondary" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center py-2 rounded-lg bg-surface-secondary">
          <p className="text-sm font-semibold text-th-text-primary">{stats.total}</p>
          <p className="text-[10px] text-th-text-secondary uppercase tracking-wide">Total</p>
        </div>
        <div className="text-center py-2 rounded-lg bg-surface-secondary">
          <p className="text-sm font-semibold text-blue-600">{stats.upcoming}</p>
          <p className="text-[10px] text-th-text-secondary uppercase tracking-wide">Upcoming</p>
        </div>
        <div className="text-center py-2 rounded-lg bg-surface-secondary">
          <p className="text-sm font-semibold text-green-600">{stats.completed}</p>
          <p className="text-[10px] text-th-text-secondary uppercase tracking-wide">Done</p>
        </div>
        <div className="text-center py-2 rounded-lg bg-surface-secondary">
          <p className="text-sm font-semibold text-amber-600">{stats.no_shows}</p>
          <p className="text-[10px] text-th-text-secondary uppercase tracking-wide">No-shows</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-th-border">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-surface-secondary transition-colors text-th-text-primary"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={onCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-surface-secondary transition-colors text-th-text-primary"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Link
        </button>
        <button
          onClick={onViewBookings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-surface-secondary transition-colors text-th-text-primary"
        >
          <Eye className="w-3.5 h-3.5" />
          Bookings
        </button>
        <div className="flex-1" />
        <button
          onClick={onToggleActive}
          className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors"
          title={schedule.is_active ? 'Deactivate' : 'Activate'}
        >
          {schedule.is_active ? (
            <ToggleRight className="w-5 h-5 text-green-600" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-th-text-tertiary" />
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md hover:bg-red-50 text-th-text-tertiary hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Availability Editor
// ============================================================================

function AvailabilityEditor({
  hours,
  onChange,
  timezone,
  onTimezoneChange,
}: {
  hours: AvailableHours;
  onChange: (hours: AvailableHours) => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
}) {
  const toggleDay = (day: string) => {
    const current = hours[day] || { enabled: false, ranges: [] };
    onChange({
      ...hours,
      [day]: {
        ...current,
        enabled: !current.enabled,
        ranges: !current.enabled && current.ranges.length === 0
          ? [{ start: '09:00', end: '17:00' }]
          : current.ranges,
      },
    });
  };

  const updateRange = (day: string, idx: number, field: 'start' | 'end', value: string) => {
    const dayData = hours[day];
    if (!dayData) return;
    const newRanges = [...dayData.ranges];
    newRanges[idx] = { ...newRanges[idx], [field]: value };
    onChange({ ...hours, [day]: { ...dayData, ranges: newRanges } });
  };

  const addRange = (day: string) => {
    const dayData = hours[day];
    if (!dayData) return;
    const lastRange = dayData.ranges[dayData.ranges.length - 1];
    const newStart = lastRange ? lastRange.end : '09:00';
    onChange({
      ...hours,
      [day]: { ...dayData, ranges: [...dayData.ranges, { start: newStart, end: '17:00' }] },
    });
  };

  const removeRange = (day: string, idx: number) => {
    const dayData = hours[day];
    if (!dayData) return;
    const newRanges = dayData.ranges.filter((_, i) => i !== idx);
    onChange({ ...hours, [day]: { ...dayData, ranges: newRanges } });
  };

  return (
    <div className="space-y-4">
      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-th-text-primary mb-1.5">
          <Globe className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          aria-label="Timezone"
          className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {/* Weekly schedule */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-th-text-primary">Weekly Availability</h4>
        {DAYS_OF_WEEK.map(({ key, label }) => {
          const dayData = hours[key] || { enabled: false, ranges: [] };
          return (
            <div key={key} className="rounded-lg border border-th-border p-3">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => toggleDay(key)}
                  className="flex-shrink-0"
                >
                  {dayData.enabled ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-th-text-tertiary" />
                  )}
                </button>
                <span className={`text-sm font-medium ${dayData.enabled ? 'text-th-text-primary' : 'text-th-text-tertiary'}`}>
                  {label}
                </span>
                {dayData.enabled && (
                  <button
                    onClick={() => addRange(key)}
                    className="ml-auto text-xs text-th-accent-600 hover:text-th-accent-600/80 font-medium"
                  >
                    + Add range
                  </button>
                )}
              </div>
              {dayData.enabled && dayData.ranges.map((range, idx) => (
                <div key={idx} className="flex items-center gap-2 ml-8 mb-1.5">
                  <select
                    value={range.start}
                    onChange={(e) => updateRange(key, idx, 'start', e.target.value)}
                    aria-label={`${label} start time`}
                    className="px-2 py-1.5 text-xs rounded-md border border-th-border bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{formatTime24to12(t)}</option>
                    ))}
                  </select>
                  <span className="text-xs text-th-text-tertiary">to</span>
                  <select
                    value={range.end}
                    onChange={(e) => updateRange(key, idx, 'end', e.target.value)}
                    aria-label={`${label} end time`}
                    className="px-2 py-1.5 text-xs rounded-md border border-th-border bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{formatTime24to12(t)}</option>
                    ))}
                  </select>
                  {dayData.ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(key, idx)}
                      className="p-1 rounded hover:bg-red-50 text-th-text-tertiary hover:text-red-500 transition-colors"
                      title="Remove time range"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {dayData.enabled && dayData.ranges.length === 0 && (
                <p className="ml-8 text-xs text-th-text-tertiary italic">No time ranges — click &quot;+ Add range&quot;</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Booking Page Preview
// ============================================================================

function BookingPagePreview({ schedule }: { schedule: Partial<MeetingSchedule> & { timezone?: string } }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [previewMonth, setPreviewMonth] = useState(() => new Date());

  const daysInMonth = useMemo(() => {
    const year = previewMonth.getFullYear();
    const month = previewMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [previewMonth]);

  const isAvailable = useCallback(
    (date: Date) => {
      if (!schedule.available_hours) return false;
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayNames[date.getDay()];
      const dayData = schedule.available_hours[dayKey];
      if (!dayData?.enabled || dayData.ranges.length === 0) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return false;
      const windowEnd = new Date(today);
      windowEnd.setDate(windowEnd.getDate() + (schedule.booking_window_days || 30));
      return date <= windowEnd;
    },
    [schedule.available_hours, schedule.booking_window_days],
  );

  const sampleSlots = useMemo(() => {
    if (!selectedDate || !schedule.available_hours) return [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayNames[selectedDate.getDay()];
    const dayData = schedule.available_hours[dayKey];
    if (!dayData?.enabled) return [];
    const slots: string[] = [];
    const duration = schedule.duration_minutes || 30;
    const buffer = schedule.buffer_minutes || 0;
    for (const range of dayData.ranges) {
      const [sh, sm] = range.start.split(':').map(Number);
      const [eh, em] = range.end.split(':').map(Number);
      let current = sh * 60 + sm;
      const end = eh * 60 + em;
      while (current + duration <= end) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        current += duration + buffer;
      }
    }
    return slots;
  }, [selectedDate, schedule.available_hours, schedule.duration_minutes, schedule.buffer_minutes]);

  const LocIcon = getLocationIcon((schedule.location_type as LocationType) || 'video');

  return (
    <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
      {/* Preview header */}
      <div className="bg-th-accent-600 px-5 py-4">
        <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Booking Preview</p>
        <h3 className="text-white text-lg font-bold">{schedule.name || 'Meeting Name'}</h3>
        <div className="flex items-center gap-3 mt-2 text-white/80 text-xs">
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{schedule.duration_minutes || 30} min</span>
          <span className="inline-flex items-center gap-1"><LocIcon className="w-3.5 h-3.5" />{getLocationLabel((schedule.location_type as LocationType) || 'video')}</span>
        </div>
      </div>

      <div className="p-5">
        {schedule.description && (
          <p className="text-sm text-th-text-secondary mb-4">{schedule.description}</p>
        )}

        {/* Mini calendar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPreviewMonth(new Date(previewMonth.getFullYear(), previewMonth.getMonth() - 1, 1))}
              className="p-1 rounded hover:bg-surface-secondary"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-th-text-secondary" />
            </button>
            <h4 className="text-sm font-semibold text-th-text-primary">
              {previewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <button
              onClick={() => setPreviewMonth(new Date(previewMonth.getFullYear(), previewMonth.getMonth() + 1, 1))}
              className="p-1 rounded hover:bg-surface-secondary"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4 text-th-text-secondary" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-[10px] font-medium text-th-text-tertiary py-1">{d}</div>
            ))}
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const avail = isAvailable(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              return (
                <button
                  key={i}
                  disabled={!avail}
                  onClick={() => setSelectedDate(date)}
                  className={`text-xs py-1.5 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-th-accent-600 text-white font-semibold'
                      : avail
                        ? 'hover:bg-th-accent-600/10 text-th-text-primary font-medium'
                        : 'text-th-text-tertiary cursor-not-allowed'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <h4 className="text-sm font-medium text-th-text-primary mb-2">
              Available times on {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h4>
            {sampleSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                {sampleSlots.map((slot) => (
                  <button
                    key={slot}
                    className="px-2 py-1.5 text-xs font-medium rounded-md border border-th-border hover:border-th-accent-600 hover:bg-th-accent-600/5 text-th-text-primary transition-colors"
                  >
                    {formatTime24to12(slot)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-th-text-tertiary italic">No available slots</p>
            )}
          </div>
        )}

        {/* Booker form preview */}
        <div className="mt-5 pt-4 border-t border-th-border">
          <h4 className="text-sm font-medium text-th-text-primary mb-3">Your Information</h4>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-th-border bg-surface-secondary">
              <User className="w-4 h-4 text-th-text-tertiary" />
              <span className="text-xs text-th-text-tertiary">Full name</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-th-border bg-surface-secondary">
              <Mail className="w-4 h-4 text-th-text-tertiary" />
              <span className="text-xs text-th-text-tertiary">Email address</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-th-border bg-surface-secondary">
              <Phone className="w-4 h-4 text-th-text-tertiary" />
              <span className="text-xs text-th-text-tertiary">Phone number</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-th-border bg-surface-secondary h-16 items-start pt-2.5">
              <MessageSquare className="w-4 h-4 text-th-text-tertiary mt-0.5" />
              <span className="text-xs text-th-text-tertiary">Additional notes</span>
            </div>
            <button className="w-full py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-600/90 transition-colors">
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Schedule Editor Modal
// ============================================================================

function ScheduleEditorModal({
  schedule,
  templates,
  onSave,
  onClose,
}: {
  schedule: Partial<MeetingSchedule> | null;
  templates: EmailTemplate[];
  onSave: (data: Partial<MeetingSchedule> & { timezone?: string }) => void;
  onClose: () => void;
}) {
  const isEdit = !!schedule?.id;
  const [form, setForm] = useState<Partial<MeetingSchedule> & { timezone?: string }>({
    name: '',
    description: '',
    duration_minutes: 30,
    buffer_minutes: 0,
    slug: '',
    location_type: 'video',
    location_config: null,
    booking_window_days: 30,
    confirmation_template_id: null,
    reminder_template_id: null,
    is_active: true,
    available_hours: { ...DEFAULT_AVAILABLE_HOURS },
    timezone: 'America/New_York',
    ...schedule,
  });
  const [customDuration, setCustomDuration] = useState(false);
  const [saving, setSaving] = useState(false);
  const slugEdited = useRef(!!schedule?.slug);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEdited.current && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(form.name!) }));
    }
  }, [form.name]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
  };

  const handleSlugChange = (slug: string) => {
    slugEdited.current = true;
    setForm((prev) => ({ ...prev, slug: slugify(slug) }));
  };

  const handleDurationSelect = (val: number) => {
    if (val === 0) {
      setCustomDuration(true);
    } else {
      setCustomDuration(false);
      setForm((prev) => ({ ...prev, duration_minutes: val }));
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.slug?.trim()) {
      toast.error('Slug is required');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const getLocationConfigField = () => {
    switch (form.location_type) {
      case 'video':
        return { label: 'Meeting Link URL', placeholder: 'https://zoom.us/j/...', key: 'url' };
      case 'phone':
        return { label: 'Phone Number', placeholder: '+1 (555) 123-4567', key: 'phone' };
      case 'in_person':
        return { label: 'Address', placeholder: '123 Main St, Suite 100', key: 'address' };
      case 'custom':
        return { label: 'Location Details', placeholder: 'Custom location instructions', key: 'details' };
      default:
        return { label: 'Details', placeholder: '', key: 'details' };
    }
  };

  const locField = getLocationConfigField();

  const modal = (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Modal content */}
      <div className="relative flex w-full h-full bg-surface-primary overflow-hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-5 bg-surface-primary border-b border-th-border z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors" title="Close editor">
              <X className="w-5 h-5 text-th-text-secondary" />
            </button>
            <h2 className="text-lg font-semibold text-th-text-primary">
              {isEdit ? 'Edit Schedule' : 'Create Schedule'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-th-border hover:bg-surface-secondary transition-colors text-th-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-th-accent-600 text-white hover:bg-th-accent-600/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </div>

        {/* Body - two panels */}
        <div className="flex w-full h-full pt-14 overflow-hidden">
          {/* Left panel - Settings */}
          <div className="w-1/2 border-r border-th-border overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide mb-4">Basic Settings</h3>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., 30-Minute Discovery Call"
                  className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description for the booking page"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30 resize-none"
                />
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleDurationSelect(opt.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        (!customDuration && form.duration_minutes === opt.value) || (customDuration && opt.value === 0)
                          ? 'border-th-accent-600 bg-th-accent-600/10 text-th-accent-600'
                          : 'border-th-border hover:border-th-border text-th-text-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {customDuration && (
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={form.duration_minutes || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                    className="mt-2 w-32 px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                    placeholder="Minutes"
                  />
                )}
              </div>

              {/* Buffer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">Buffer Between Meetings</label>
                <div className="flex flex-wrap gap-2">
                  {BUFFER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((prev) => ({ ...prev, buffer_minutes: opt.value }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        form.buffer_minutes === opt.value
                          ? 'border-th-accent-600 bg-th-accent-600/10 text-th-accent-600'
                          : 'border-th-border hover:border-th-border text-th-text-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slug */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">Booking URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-th-text-tertiary flex-shrink-0">https://{BOOKING_DOMAIN}/book/</span>
                  <input
                    type="text"
                    value={form.slug || ''}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    aria-label="Booking URL slug"
                    placeholder="meeting-slug"
                    className="flex-1 px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide mb-4">Location</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {LOCATION_TYPES.map((loc) => {
                  const LIcon = loc.icon;
                  return (
                    <button
                      key={loc.value}
                      onClick={() => setForm((prev) => ({ ...prev, location_type: loc.value, location_config: null }))}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        form.location_type === loc.value
                          ? 'border-th-accent-600 bg-th-accent-600/5'
                          : 'border-th-border hover:border-th-border'
                      }`}
                    >
                      <LIcon className={`w-5 h-5 ${form.location_type === loc.value ? 'text-th-accent-600' : 'text-th-text-tertiary'}`} />
                      <div>
                        <p className="text-sm font-medium text-th-text-primary">{loc.label}</p>
                        <p className="text-[10px] text-th-text-tertiary">{loc.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">{locField.label}</label>
                <input
                  type="text"
                  value={(form.location_config as Record<string, string>)?.[locField.key] || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      location_config: { ...(prev.location_config || {}), [locField.key]: e.target.value },
                    }))
                  }
                  placeholder={locField.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                />
              </div>
            </div>

            {/* Booking window */}
            <div>
              <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide mb-4">Booking Window</h3>
              <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                How far ahead can leads book?
              </label>
              <div className="flex flex-wrap gap-2">
                {BOOKING_WINDOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((prev) => ({ ...prev, booking_window_days: opt.value }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      form.booking_window_days === opt.value
                        ? 'border-th-accent-600 bg-th-accent-600/10 text-th-accent-600'
                        : 'border-th-border hover:border-th-border text-th-text-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email templates */}
            <div>
              <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide mb-4">Email Notifications</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-primary mb-1.5">Confirmation Template</label>
                  <select
                    value={form.confirmation_template_id || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirmation_template_id: e.target.value || null }))}
                    aria-label="Confirmation email template"
                    className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                  >
                    <option value="">None</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-primary mb-1.5">Reminder Template</label>
                  <select
                    value={form.reminder_template_id || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, reminder_template_id: e.target.value || null }))}
                    aria-label="Reminder email template"
                    className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
                  >
                    <option value="">None</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Availability + Preview */}
          <div className="w-1/2 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide mb-4">Availability</h3>
              <AvailabilityEditor
                hours={form.available_hours || DEFAULT_AVAILABLE_HOURS}
                onChange={(hours) => setForm((prev) => ({ ...prev, available_hours: hours }))}
                timezone={form.timezone || 'America/New_York'}
                onTimezoneChange={(tz) => setForm((prev) => ({ ...prev, timezone: tz }))}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wide mb-4">
                <Eye className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Booking Page Preview
              </h3>
              <BookingPagePreview schedule={form} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ============================================================================
// Bookings Table View
// ============================================================================

function BookingsView({
  schedule,
  bookings,
  loading,
  onStatusChange,
  onBack,
}: {
  schedule: MeetingSchedule;
  bookings: MeetingBooking[];
  loading: boolean;
  onStatusChange: (bookingId: string, status: BookingStatus, reason?: string) => void;
  onBack: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    if (statusFilter) result = result.filter((b) => b.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.booker_name.toLowerCase().includes(q) ||
          b.booker_email.toLowerCase().includes(q),
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((b) => new Date(b.start_time) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter((b) => new Date(b.start_time) <= to);
    }
    return result.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [bookings, statusFilter, search, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: bookings.length,
      upcoming: bookings.filter((b) => b.status === 'confirmed' && new Date(b.start_time) > now).length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      noShows: bookings.filter((b) => b.status === 'no_show').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    };
  }, [bookings]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
          title="Back to schedules"
        >
          <ChevronLeft className="w-5 h-5 text-th-text-secondary" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary">Bookings: {schedule.name}</h2>
          <p className="text-sm text-th-text-secondary">{schedule.duration_minutes} min · {getLocationLabel(schedule.location_type)}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} icon={Calendar} />
        <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarCheck} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
        <StatCard label="No Shows" value={stats.noShows} icon={AlertTriangle} />
        <StatCard label="Cancelled" value={stats.cancelled} icon={CalendarX} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
          aria-label="Filter by status"
          className="px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
        >
          <option value="">All Statuses</option>
          {Object.entries(BOOKING_STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Date from"
          title="Filter from date"
          className="px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
        />
        <span className="text-xs text-th-text-tertiary">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Date to"
          title="Filter to date"
          className="px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-th-text-secondary">No bookings found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-th-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary">
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary text-xs uppercase tracking-wide">Booker</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary text-xs uppercase tracking-wide">Date & Time</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary text-xs uppercase tracking-wide">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary text-xs uppercase tracking-wide">Notes</th>
                  <th className="text-right px-4 py-3 font-medium text-th-text-secondary text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {filteredBookings.map((booking) => {
                  const startDate = new Date(booking.start_time);
                  const endDate = new Date(booking.end_time);
                  const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                  return (
                    <tr key={booking.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-th-text-primary">{booking.booker_name}</p>
                        <p className="text-xs text-th-text-secondary">{booking.booker_email}</p>
                        {booking.booker_phone && (
                          <p className="text-xs text-th-text-tertiary">{booking.booker_phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-th-text-primary whitespace-nowrap">
                        {formatDateTime(booking.start_time)}
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary">{durationMin} min</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary max-w-[200px] truncate">
                        {booking.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => onStatusChange(booking.id, 'completed')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-green-50 text-green-700 transition-colors"
                                title="Mark as completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Done
                              </button>
                              <button
                                onClick={() => onStatusChange(booking.id, 'no_show')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-amber-50 text-amber-700 transition-colors"
                                title="Mark as no-show"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                No Show
                              </button>
                              <button
                                onClick={() => {
                                  const reason = window.prompt('Cancellation reason (optional):');
                                  onStatusChange(booking.id, 'cancelled', reason || undefined);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-red-50 text-red-600 transition-colors"
                                title="Cancel booking"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </>
                          )}
                          {booking.status === 'cancelled' && booking.cancellation_reason && (
                            <span className="text-xs text-th-text-tertiary italic" title={booking.cancellation_reason}>
                              {booking.cancellation_reason.slice(0, 30)}…
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MeetingScheduler() {
  const { supabase, templateService } = useCRM();
  const { activeOrgId } = useOrg();
  const { user } = useAuth();

  // State
  const [schedules, setSchedules] = useState<MeetingSchedule[]>([]);
  const [scheduleStats, setScheduleStats] = useState<Record<string, ScheduleStats>>({});
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Views
  const [viewMode, setViewMode] = useState<ViewMode>('schedules');
  const [selectedSchedule, setSelectedSchedule] = useState<MeetingSchedule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<MeetingSchedule> | null>(null);

  // Bookings for selected schedule
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------------------
  // Load schedules
  // -------------------------------------------------------------------------
  const loadSchedules = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_meeting_schedules')
        .select('id, org_id, user_id, name, description, duration_minutes, buffer_minutes, slug, available_hours, booking_window_days, confirmation_template_id, reminder_template_id, is_active, location_type, location_config, created_at, updated_at')
        .eq('org_id', activeOrgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const scheduleList = (data || []) as unknown as MeetingSchedule[];
      setSchedules(scheduleList);

      // Load stats for all schedules
      const statsMap: Record<string, ScheduleStats> = {};
      const now = new Date().toISOString();

      for (const s of scheduleList) {
        const { data: bookingData } = await supabase
          .from('crm_meeting_bookings')
          .select('id, status, start_time')
          .eq('schedule_id', s.id);

        const all = bookingData || [];
        statsMap[s.id] = {
          total: all.length,
          upcoming: all.filter((b: { status: string; start_time: string }) => b.status === 'confirmed' && b.start_time > now).length,
          completed: all.filter((b: { status: string }) => b.status === 'completed').length,
          no_shows: all.filter((b: { status: string }) => b.status === 'no_show').length,
        };
      }
      setScheduleStats(statsMap);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      toast.error('Failed to load meeting schedules');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, supabase]);

  // -------------------------------------------------------------------------
  // Load templates
  // -------------------------------------------------------------------------
  const loadTemplates = useCallback(async () => {
    try {
      const data = await templateService.listTemplates({ template_type: 'email', is_active: true });
      setTemplates((data || []).map((t) => ({ id: t.id, name: t.name, subject: t.subject ?? undefined })));
    } catch {
      // Templates are optional
    }
  }, [templateService]);

  // -------------------------------------------------------------------------
  // Load bookings for a schedule
  // -------------------------------------------------------------------------
  const loadBookings = useCallback(
    async (scheduleId: string) => {
      setBookingsLoading(true);
      try {
        const { data, error } = await supabase
          .from('crm_meeting_bookings')
          .select('id, schedule_id, lead_id, contact_id, booker_name, booker_email, booker_phone, start_time, end_time, status, calendar_event_id, notes, cancellation_reason, created_at')
          .eq('schedule_id', scheduleId)
          .order('start_time', { ascending: false });

        if (error) throw error;
        setBookings((data || []) as unknown as MeetingBooking[]);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        toast.error('Failed to load bookings');
      } finally {
        setBookingsLoading(false);
      }
    },
    [supabase],
  );

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------
  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, [loadSchedules, loadTemplates]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setEditorOpen(true);
  };

  const handleEditSchedule = (schedule: MeetingSchedule) => {
    setEditingSchedule(schedule);
    setEditorOpen(true);
  };

  const handleSaveSchedule = async (data: Partial<MeetingSchedule> & { timezone?: string }) => {
    if (!activeOrgId || !user) return;
    try {
      const payload = {
        org_id: activeOrgId,
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes || 30,
        buffer_minutes: data.buffer_minutes || 0,
        slug: data.slug,
        available_hours: data.available_hours || DEFAULT_AVAILABLE_HOURS,
        booking_window_days: data.booking_window_days || 30,
        confirmation_template_id: data.confirmation_template_id || null,
        reminder_template_id: data.reminder_template_id || null,
        is_active: data.is_active ?? true,
        location_type: data.location_type || 'video',
        location_config: data.location_config || null,
      };

      if (data.id) {
        // Update
        const { error } = await supabase
          .from('crm_meeting_schedules')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        toast.success('Schedule updated');
      } else {
        // Insert
        const { error } = await supabase.from('crm_meeting_schedules').insert(payload);
        if (error) throw error;
        toast.success('Schedule created');
      }

      setEditorOpen(false);
      setEditingSchedule(null);
      await loadSchedules();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save schedule';
      console.error('Failed to save schedule:', err);
      toast.error(message);
    }
  };

  const handleToggleActive = async (schedule: MeetingSchedule) => {
    try {
      const { error } = await supabase
        .from('crm_meeting_schedules')
        .update({ is_active: !schedule.is_active, updated_at: new Date().toISOString() })
        .eq('id', schedule.id);
      if (error) throw error;
      toast.success(schedule.is_active ? 'Schedule deactivated' : 'Schedule activated');
      await loadSchedules();
    } catch {
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (schedule: MeetingSchedule) => {
    if (!window.confirm(`Delete "${schedule.name}"? This will also delete all associated bookings.`)) return;
    try {
      // Delete bookings first
      await supabase.from('crm_meeting_bookings').delete().eq('schedule_id', schedule.id);
      const { error } = await supabase.from('crm_meeting_schedules').delete().eq('id', schedule.id);
      if (error) throw error;
      toast.success('Schedule deleted');
      await loadSchedules();
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  const handleCopyLink = (schedule: MeetingSchedule) => {
    const url = `https://${BOOKING_DOMAIN}/book/${schedule.slug}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Booking link copied to clipboard'),
      () => toast.error('Failed to copy link'),
    );
  };

  const handleViewBookings = (schedule: MeetingSchedule) => {
    setSelectedSchedule(schedule);
    setViewMode('bookings');
    loadBookings(schedule.id);
  };

  const handleBookingStatusChange = async (bookingId: string, status: BookingStatus, reason?: string) => {
    try {
      const update: Record<string, unknown> = { status };
      if (reason) update.cancellation_reason = reason;
      const { error } = await supabase.from('crm_meeting_bookings').update(update).eq('id', bookingId);
      if (error) throw error;
      toast.success(`Booking marked as ${BOOKING_STATUS_CONFIG[status].label.toLowerCase()}`);
      if (selectedSchedule) await loadBookings(selectedSchedule.id);
      await loadSchedules();
    } catch {
      toast.error('Failed to update booking status');
    }
  };

  // -------------------------------------------------------------------------
  // Filter schedules
  // -------------------------------------------------------------------------
  const filteredSchedules = useMemo(() => {
    if (!searchQuery) return schedules;
    const q = searchQuery.toLowerCase();
    return schedules.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q),
    );
  }, [schedules, searchQuery]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Bookings view
  if (viewMode === 'bookings' && selectedSchedule) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <BookingsView
          schedule={selectedSchedule}
          bookings={bookings}
          loading={bookingsLoading}
          onStatusChange={handleBookingStatusChange}
          onBack={() => {
            setViewMode('schedules');
            setSelectedSchedule(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Meeting Scheduler</h1>
          <p className="text-sm text-th-text-secondary mt-1">Create shareable booking links for leads</p>
        </div>
        <button
          onClick={handleCreateSchedule}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-600/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>
      <HelpBanner pageKey="meetings" title="Welcome to Meeting Scheduler" tip="Schedule and manage meetings with leads and clients. Set availability, send calendar invites, and track meeting outcomes all in one place." />

      {/* Search bar */}
      {schedules.length > 0 && (
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedules…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-th-border bg-surface-primary text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/30"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-th-accent-600" />
        </div>
      ) : filteredSchedules.length === 0 && !searchQuery ? (
        <EmptyState onCreateClick={handleCreateSchedule} />
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-th-text-secondary">No schedules match &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              stats={scheduleStats[schedule.id] || { total: 0, upcoming: 0, completed: 0, no_shows: 0 }}
              onEdit={() => handleEditSchedule(schedule)}
              onCopyLink={() => handleCopyLink(schedule)}
              onViewBookings={() => handleViewBookings(schedule)}
              onToggleActive={() => handleToggleActive(schedule)}
              onDelete={() => handleDeleteSchedule(schedule)}
            />
          ))}
        </div>
      )}

      {/* Schedule Editor Modal */}
      {editorOpen && (
        <ScheduleEditorModal
          schedule={editingSchedule}
          templates={templates}
          onSave={handleSaveSchedule}
          onClose={() => {
            setEditorOpen(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}
