import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Link2,
  Users,
  Trash2,
  Pencil,
  Video,
  Phone,
  Flag,
  Bell,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  ListTodo,
  Filter,
  Repeat,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { AddEventModal } from '../components/AddEventModal';
import type { CalendarEvent, CalendarEventType } from '@mpbhealth/crm-core';

// ─── Extended type for new columns ────────────────────────────────
interface ExtendedCalendarEvent extends CalendarEvent {
  recurrence_rule?: string;
  recurrence_end?: string;
  original_event_id?: string;
  color?: string;
  attendees?: Array<{ name?: string; email: string }>;
  reminders?: Array<{ type: string; minutes: number }>;
  timezone?: string;
  assigned_to?: string;
}

// ─── Constants ────────────────────────────────────────────────────
type ViewType = 'month' | 'week' | 'day' | 'agenda';

const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; text: string; dot: string; border: string }> = {
  meeting:   { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500',   border: 'border-blue-400' },
  call:      { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  border: 'border-green-400' },
  follow_up: { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500',  border: 'border-amber-400' },
  deadline:  { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500',    border: 'border-red-400' },
  reminder:  { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', border: 'border-blue-400' },
  other:     { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400',   border: 'border-gray-400' },
};

const EVENT_TYPE_HEX: Record<CalendarEventType, string> = {
  meeting: '#3B82F6',
  call: '#22C55E',
  follow_up: '#F59E0B',
  deadline: '#EF4444',
  reminder: '#8B5CF6',
  other: '#6B7280',
};

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  meeting: 'Meeting',
  call: 'Call',
  follow_up: 'Follow Up',
  deadline: 'Deadline',
  reminder: 'Reminder',
  other: 'Other',
};

const EVENT_TYPE_ICONS: Record<CalendarEventType, ReactNode> = {
  meeting: <Video className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
  follow_up: <Repeat className="w-3.5 h-3.5" />,
  deadline: <Flag className="w-3.5 h-3.5" />,
  reminder: <Bell className="w-3.5 h-3.5" />,
  other: <MoreHorizontal className="w-3.5 h-3.5" />,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

// ─── Date helpers ─────────────────────────────────────────────────
function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getWeekStart(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function getMinutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Basic RRULE parser ───────────────────────────────────────────
interface ParsedRRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  until?: Date;
  count?: number;
  byDay?: string[];
}

function parseRRule(rule: string): ParsedRRule | null {
  if (!rule) return null;
  const parts = rule.replace(/^RRULE:/, '').split(';');
  const map: Record<string, string> = {};
  parts.forEach(p => {
    const [k, v] = p.split('=');
    if (k && v) map[k.toUpperCase()] = v;
  });

  const freq = map['FREQ'] as ParsedRRule['freq'];
  if (!freq || !['DAILY', 'WEEKLY', 'MONTHLY'].includes(freq)) return null;

  return {
    freq,
    interval: map['INTERVAL'] ? parseInt(map['INTERVAL'], 10) : 1,
    until: map['UNTIL'] ? new Date(map['UNTIL'].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : undefined,
    count: map['COUNT'] ? parseInt(map['COUNT'], 10) : undefined,
    byDay: map['BYDAY'] ? map['BYDAY'].split(',') : undefined,
  };
}

const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function generateRecurrences(event: ExtendedCalendarEvent, rangeStart: Date, rangeEnd: Date): ExtendedCalendarEvent[] {
  if (!event.recurrence_rule) return [];
  const parsed = parseRRule(event.recurrence_rule);
  if (!parsed) return [];

  const origStart = new Date(event.start_time);
  const origEnd = new Date(event.end_time);
  const duration = origEnd.getTime() - origStart.getTime();
  const recEnd = event.recurrence_end ? new Date(event.recurrence_end) : undefined;

  const instances: ExtendedCalendarEvent[] = [];
  let current = new Date(origStart);
  let generated = 0;
  const maxInstances = parsed.count || 365;

  while (current <= rangeEnd && generated < maxInstances) {
    if (recEnd && current > recEnd) break;

    const shouldInclude = (() => {
      if (isSameDay(current, origStart)) return false; // original already shown
      if (current < rangeStart) return false;
      if (parsed.freq === 'WEEKLY' && parsed.byDay) {
        return parsed.byDay.some(d => DAY_MAP[d] === current.getDay());
      }
      return true;
    })();

    if (shouldInclude) {
      const instStart = new Date(current);
      instStart.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds());
      instances.push({
        ...event,
        id: `${event.id}_rec_${dayKey(instStart)}`,
        original_event_id: event.id,
        start_time: instStart.toISOString(),
        end_time: new Date(instStart.getTime() + duration).toISOString(),
      });
      generated++;
    }

    // Advance
    switch (parsed.freq) {
      case 'DAILY':
        current = addDays(current, parsed.interval);
        break;
      case 'WEEKLY':
        if (parsed.byDay) {
          current = addDays(current, 1);
        } else {
          current = addDays(current, 7 * parsed.interval);
        }
        break;
      case 'MONTHLY':
        current = new Date(current.getFullYear(), current.getMonth() + parsed.interval, current.getDate(),
          current.getHours(), current.getMinutes());
        break;
    }
  }

  return instances;
}

// ─── Event Detail Popover ─────────────────────────────────────────
function EventPopover({
  event,
  position,
  onClose,
  onEdit,
  onDelete,
}: {
  event: ExtendedCalendarEvent;
  position: { top: number; left: number };
  onClose: () => void;
  onEdit: (event: ExtendedCalendarEvent) => void;
  onDelete: (event: ExtendedCalendarEvent) => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const colors = EVENT_TYPE_COLORS[event.event_type];
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedStyle = useMemo(() => {
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - 360 : position.left;
    const maxTop = typeof window !== 'undefined' ? window.innerHeight - 400 : position.top;
    return {
      top: Math.min(position.top, Math.max(0, maxTop)),
      left: Math.min(position.left, Math.max(0, maxLeft)),
    };
  }, [position]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute z-50 w-80 bg-surface-primary border border-th-border rounded-xl shadow-xl"
        style={adjustedStyle}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-4 border-b border-th-border rounded-t-xl`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                {EVENT_TYPE_ICONS[event.event_type]}
                {EVENT_TYPE_LABELS[event.event_type]}
              </span>
              {event.original_event_id && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  <Repeat className="w-3 h-3" /> Recurring
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-th-text-primary truncate">{event.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:bg-surface-secondary rounded-lg ml-2 shrink-0">
            <X className="w-4 h-4 text-th-text-tertiary" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          <div className="flex items-center gap-2 text-sm text-th-text-secondary">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {event.all_day
                ? isSameDay(start, end)
                  ? `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · All day`
                  : `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · All day`
                : `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${formatTimeRange(start, end)}`}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-th-text-secondary">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {event.meeting_link && (
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="w-4 h-4 shrink-0 text-th-text-secondary" />
              <a
                href={event.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {event.meeting_link}
              </a>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-th-text-secondary">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {event.attendees.slice(0, 5).map((a, i) => (
                  <div key={i} className="text-sm">{a.name || a.email}</div>
                ))}
                {event.attendees.length > 5 && (
                  <div className="text-xs text-th-text-tertiary">+{event.attendees.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {event.description && (
            <p className="text-sm text-th-text-secondary leading-relaxed border-t border-th-border pt-3 mt-3">
              {event.description}
            </p>
          )}

          {event.recurrence_rule && (
            <div className="flex items-center gap-2 text-xs text-th-text-tertiary">
              <Repeat className="w-3.5 h-3.5" />
              <span>Repeats: {event.recurrence_rule.replace('RRULE:', '')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-th-border">
          {event.meeting_link && (
            <a
              href={event.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-3.5 h-3.5" /> Join
            </a>
          )}
          <button
            onClick={() => onEdit(event)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-th-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-primary border border-th-border transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(event)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────
function MonthView({
  currentDate,
  events,
  tasks,
  onDayClick,
  onEventClick,
}: {
  currentDate: Date;
  events: ExtendedCalendarEvent[];
  tasks: Array<{ id: string; title: string; due_date: string; completed: boolean; priority: string; task_type: string }>;
  onDayClick: (date: Date) => void;
  onEventClick: (event: ExtendedCalendarEvent, e: ReactMouseEvent) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();

  // Build map of events by day key
  const eventsByDay = useMemo(() => {
    const map: Record<string, ExtendedCalendarEvent[]> = {};
    events.forEach(ev => {
      const start = new Date(ev.start_time);
      const end = new Date(ev.end_time);
      // For multi-day events, add to each day
      let cursor = startOfDay(start);
      const endDay = startOfDay(end);
      while (cursor <= endDay) {
        const key = dayKey(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        cursor = addDays(cursor, 1);
      }
    });
    return map;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach(t => {
      const d = new Date(t.due_date);
      const key = dayKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-th-border">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Previous month fill */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`prev-${i}`} className="min-h-[110px] p-1.5 border-b border-r border-th-border bg-surface-secondary/50">
            <span className="text-xs text-th-text-tertiary/50">{prevMonthDays - firstDayOfMonth + i + 1}</span>
          </div>
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const key = dayKey(date);
          const dayEvents = eventsByDay[key] || [];
          const dayTasks = tasksByDay[key] || [];
          const isCurrentDay = isSameDay(date, today);
          const maxVisible = 3;

          return (
            <div
              key={day}
              onClick={() => onDayClick(date)}
              className={`min-h-[110px] p-1.5 border-b border-r border-th-border cursor-pointer transition-colors group ${
                isCurrentDay ? 'bg-blue-50/50' : 'hover:bg-surface-secondary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? 'bg-th-accent-600 text-white'
                      : 'text-th-text-secondary group-hover:text-th-text-primary'
                  }`}
                >
                  {day}
                </span>
              </div>

              <div className="space-y-0.5">
                {/* Tasks */}
                {dayTasks.slice(0, Math.max(0, maxVisible - dayEvents.length)).map(task => (
                  <div
                    key={`task-${task.id}`}
                    className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate border-l-2 ${
                      task.completed
                        ? 'bg-gray-50 text-gray-400 line-through border-gray-300'
                        : !task.completed && new Date(task.due_date) < today
                        ? 'bg-red-50 text-red-700 border-red-400'
                        : 'bg-orange-50 text-orange-700 border-orange-400'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ListTodo className="w-2.5 h-2.5 inline mr-0.5" />
                    {task.title}
                  </div>
                ))}

                {/* Events */}
                {dayEvents.slice(0, maxVisible).map(ev => {
                  const colors = EVENT_TYPE_COLORS[ev.event_type];
                  const evStart = new Date(ev.start_time);
                  return (
                    <div
                      key={ev.id}
                      className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate border-l-2 ${colors.bg} ${colors.text} ${colors.border} cursor-pointer hover:opacity-80`}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev, e); }}
                      title={ev.title}
                    >
                      {!ev.all_day && (
                        <span className="font-medium">{formatTime(evStart)} </span>
                      )}
                      {ev.title}
                    </div>
                  );
                })}

                {/* Overflow indicator */}
                {dayEvents.length + dayTasks.length > maxVisible && (
                  <div className="text-[10px] text-th-text-tertiary pl-1.5 font-medium">
                    +{dayEvents.length + dayTasks.length - maxVisible} more
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Next month fill */}
        {(() => {
          const totalCells = firstDayOfMonth + daysInMonth;
          const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
          return Array.from({ length: remaining }).map((_, i) => (
            <div key={`next-${i}`} className="min-h-[110px] p-1.5 border-b border-r border-th-border bg-surface-secondary/50">
              <span className="text-xs text-th-text-tertiary/50">{i + 1}</span>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────
function WeekView({
  currentDate,
  events,
  onTimeSlotClick,
  onEventClick,
}: {
  currentDate: Date;
  events: ExtendedCalendarEvent[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: ExtendedCalendarEvent, e: ReactMouseEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const now = new Date();

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = today.getHours();
      const scrollTo = Math.max(0, (currentHour - HOUR_START - 1) * 64);
      scrollRef.current.scrollTop = scrollTo;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate all-day vs timed events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: ExtendedCalendarEvent[] = [];
    const timed: ExtendedCalendarEvent[] = [];
    events.forEach(ev => {
      if (ev.all_day) {
        allDay.push(ev);
      } else {
        timed.push(ev);
      }
    });
    return { allDayEvents: allDay, timedEvents: timed };
  }, [events]);

  // Group timed events by day
  const eventsByDayCol = useMemo(() => {
    const map: Record<string, ExtendedCalendarEvent[]> = {};
    days.forEach(d => { map[dayKey(d)] = []; });
    timedEvents.forEach(ev => {
      const start = new Date(ev.start_time);
      const key = dayKey(start);
      if (map[key]) map[key].push(ev);
    });
    return map;
  }, [timedEvents, days]);

  const allDayByDay = useMemo(() => {
    const map: Record<string, ExtendedCalendarEvent[]> = {};
    days.forEach(d => { map[dayKey(d)] = []; });
    allDayEvents.forEach(ev => {
      const start = startOfDay(new Date(ev.start_time));
      const end = startOfDay(new Date(ev.end_time));
      let cursor = new Date(start);
      while (cursor <= end) {
        const key = dayKey(cursor);
        if (map[key]) map[key].push(ev);
        cursor = addDays(cursor, 1);
      }
    });
    return map;
  }, [allDayEvents, days]);

  const hourHeight = 64; // px per hour

  function getEventStyle(ev: ExtendedCalendarEvent) {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    const startMin = getMinutesSinceMidnight(start);
    const endMin = getMinutesSinceMidnight(end);
    const top = ((startMin - HOUR_START * 60) / 60) * hourHeight;
    const height = Math.max(((endMin - startMin) / 60) * hourHeight, 20);
    return { top, height };
  }

  // Current time indicator
  const currentTimeTop = ((getMinutesSinceMidnight(now) - HOUR_START * 60) / 60) * hourHeight;
  const showTimeLine = now.getHours() >= HOUR_START && now.getHours() <= HOUR_END;

  // Drag state
  const [dragEvent, setDragEvent] = useState<{ eventId: string; startY: number; originalTop: number; dayIdx: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handleMouseDown = useCallback((ev: ExtendedCalendarEvent, e: ReactMouseEvent, dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const style = getEventStyle(ev);
    setDragEvent({ eventId: ev.id, startY: e.clientY, originalTop: style.top, dayIdx });
    setDragOffset(0);
  }, []);

  useEffect(() => {
    if (!dragEvent) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      setDragOffset(e.clientY - dragEvent.startY);
    };
    const handleUp = () => {
      setDragEvent(null);
      setDragOffset(0);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragEvent]);

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-th-border">
        <div className="border-r border-th-border" />
        {days.map((d, i) => (
          <div
            key={i}
            className={`py-3 text-center border-r border-th-border ${
              isSameDay(d, today) ? 'bg-blue-50/50' : ''
            }`}
          >
            <div className="text-xs font-medium text-th-text-tertiary uppercase">{DAY_NAMES[d.getDay()]}</div>
            <div className={`text-lg font-semibold mt-0.5 ${
              isSameDay(d, today) ? 'text-th-accent-600' : 'text-th-text-primary'
            }`}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day section */}
      {Object.values(allDayByDay).some(arr => arr.length > 0) && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-th-border">
          <div className="border-r border-th-border py-1 px-1 text-[10px] text-th-text-tertiary text-center">
            All day
          </div>
          {days.map((d, i) => {
            const dayAllDay = allDayByDay[dayKey(d)] || [];
            return (
              <div key={i} className="border-r border-th-border p-1 space-y-0.5 min-h-[32px]">
                {dayAllDay.map(ev => {
                  const colors = EVENT_TYPE_COLORS[ev.event_type];
                  return (
                    <div
                      key={ev.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer ${colors.bg} ${colors.text}`}
                      onClick={(e) => onEventClick(ev, e)}
                    >
                      {ev.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Time labels */}
          <div className="border-r border-th-border">
            {HOURS.map(h => (
              <div key={h} className="h-16 flex items-start justify-end pr-2 pt-0">
                <span className="text-[10px] text-th-text-tertiary -mt-2">
                  {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, dayIdx) => {
            const key = dayKey(d);
            const dayEvents = eventsByDayCol[key] || [];
            const isCurrentDay = isSameDay(d, today);

            return (
              <div key={dayIdx} className="relative border-r border-th-border">
                {/* Hour rows */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="h-16 border-b border-th-border hover:bg-surface-secondary/30 cursor-pointer"
                    onClick={() => onTimeSlotClick(d, h)}
                  />
                ))}

                {/* Current time indicator */}
                {isCurrentDay && showTimeLine && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: currentTimeTop }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(ev => {
                  const style = getEventStyle(ev);
                  const colors = EVENT_TYPE_COLORS[ev.event_type];
                  const isDragging = dragEvent?.eventId === ev.id;
                  const topPos = isDragging ? style.top + dragOffset : style.top;

                  return (
                    <div
                      key={ev.id}
                      className={`absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-1.5 py-1 overflow-hidden cursor-pointer transition-shadow ${
                        isDragging ? 'shadow-lg z-30 opacity-90' : 'z-10 hover:shadow-md'
                      } ${colors.bg} ${colors.border}`}
                      style={{ top: Math.max(0, topPos), height: style.height }}
                      onClick={(e) => { if (!isDragging) onEventClick(ev, e); }}
                      onMouseDown={(e) => handleMouseDown(ev, e, dayIdx)}
                    >
                      <div className={`text-[11px] font-medium truncate ${colors.text}`}>
                        {ev.title}
                      </div>
                      {style.height > 30 && (
                        <div className="text-[10px] text-th-text-tertiary truncate">
                          {formatTimeRange(new Date(ev.start_time), new Date(ev.end_time))}
                        </div>
                      )}
                      {style.height > 50 && ev.location && (
                        <div className="text-[10px] text-th-text-tertiary truncate flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />{ev.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────
function DayView({
  currentDate,
  events,
  tasks,
  onTimeSlotClick,
  onEventClick,
}: {
  currentDate: Date;
  events: ExtendedCalendarEvent[];
  tasks: Array<{ id: string; title: string; due_date: string; completed: boolean; priority: string; task_type: string }>;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: ExtendedCalendarEvent, e: ReactMouseEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const isCurrentDay = isSameDay(currentDate, today);

  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = today.getHours();
      const scrollTo = Math.max(0, (currentHour - HOUR_START - 1) * 72);
      scrollRef.current.scrollTop = scrollTo;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDayEvents = events.filter(e => e.all_day);
  const timedEvents = events.filter(e => !e.all_day);

  const dayTasks = tasks.filter(t => {
    const d = new Date(t.due_date);
    return isSameDay(d, currentDate);
  });

  const hourHeight = 72;
  const now = new Date();
  const currentTimeTop = ((getMinutesSinceMidnight(now) - HOUR_START * 60) / 60) * hourHeight;
  const showTimeLine = isCurrentDay && now.getHours() >= HOUR_START && now.getHours() <= HOUR_END;

  function getEventStyle(ev: ExtendedCalendarEvent) {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    const startMin = getMinutesSinceMidnight(start);
    const endMin = getMinutesSinceMidnight(end);
    const top = ((startMin - HOUR_START * 60) / 60) * hourHeight;
    const height = Math.max(((endMin - startMin) / 60) * hourHeight, 28);
    return { top, height };
  }

  return (
    <div className="flex gap-4">
      {/* Main column */}
      <div className="flex-1 bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {/* Date header */}
        <div className={`px-4 py-3 border-b border-th-border ${isCurrentDay ? 'bg-blue-50/50' : ''}`}>
          <div className="text-xs font-medium text-th-text-tertiary uppercase">{DAY_NAMES_FULL[currentDate.getDay()]}</div>
          <div className={`text-2xl font-bold ${isCurrentDay ? 'text-th-accent-600' : 'text-th-text-primary'}`}>
            {currentDate.getDate()} {MONTH_NAMES[currentDate.getMonth()]}
          </div>
        </div>

        {/* All-day */}
        {allDayEvents.length > 0 && (
          <div className="px-4 py-2 border-b border-th-border bg-surface-secondary/30">
            <div className="text-[10px] text-th-text-tertiary uppercase font-medium mb-1">All Day</div>
            <div className="flex flex-wrap gap-1.5">
              {allDayEvents.map(ev => {
                const colors = EVENT_TYPE_COLORS[ev.event_type];
                return (
                  <div
                    key={ev.id}
                    className={`text-xs px-2 py-1 rounded-lg cursor-pointer ${colors.bg} ${colors.text}`}
                    onClick={(e) => onEventClick(ev, e)}
                  >
                    {ev.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time grid */}
        <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
          <div className="relative grid grid-cols-[72px_1fr]">
            {/* Time labels */}
            <div className="border-r border-th-border">
              {HOURS.map(h => (
                <div key={h} style={{ height: hourHeight }} className="flex items-start justify-end pr-3 pt-0">
                  <span className="text-[11px] text-th-text-tertiary -mt-2 font-medium">
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Events column */}
            <div className="relative">
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{ height: hourHeight }}
                  className="border-b border-th-border hover:bg-surface-secondary/30 cursor-pointer"
                  onClick={() => onTimeSlotClick(currentDate, h)}
                />
              ))}

              {/* Current time indicator */}
              {showTimeLine && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: currentTimeTop }}
                >
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}

              {/* Timed events */}
              {timedEvents.map(ev => {
                const style = getEventStyle(ev);
                const colors = EVENT_TYPE_COLORS[ev.event_type];
                const start = new Date(ev.start_time);
                const end = new Date(ev.end_time);
                const attendees = (ev as ExtendedCalendarEvent).attendees;

                return (
                  <div
                    key={ev.id}
                    className={`absolute left-1 right-4 rounded-lg border-l-[3px] px-3 py-1.5 overflow-hidden cursor-pointer z-10 hover:shadow-md transition-shadow ${colors.bg} ${colors.border}`}
                    style={{ top: style.top, height: style.height }}
                    onClick={(e) => onEventClick(ev, e)}
                  >
                    <div className={`text-sm font-semibold truncate ${colors.text}`}>{ev.title}</div>
                    <div className="text-xs text-th-text-tertiary">{formatTimeRange(start, end)}</div>
                    {style.height > 55 && ev.location && (
                      <div className="text-xs text-th-text-tertiary flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{ev.location}
                      </div>
                    )}
                    {style.height > 70 && attendees && attendees.length > 0 && (
                      <div className="text-xs text-th-text-tertiary flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />{attendees.length} attendee{attendees.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks sidebar */}
      <div className="w-72 shrink-0 bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        <div className="px-4 py-3 border-b border-th-border">
          <h3 className="text-sm font-semibold text-th-text-primary flex items-center gap-2">
            <ListTodo className="w-4 h-4" /> Tasks Due
          </h3>
        </div>
        <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
          {dayTasks.length === 0 ? (
            <p className="text-xs text-th-text-tertiary text-center py-6">No tasks due this day</p>
          ) : (
            dayTasks.map(task => (
              <div
                key={task.id}
                className={`p-2.5 rounded-lg text-sm ${
                  task.completed
                    ? 'bg-gray-50 text-gray-400 line-through'
                    : !task.completed && new Date(task.due_date) < today
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : new Date(task.due_date) < today ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-th-border shrink-0" />
                  )}
                  <span className="truncate font-medium">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-6">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] text-th-text-tertiary">{task.task_type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agenda View ──────────────────────────────────────────────────
function AgendaView({
  events,
  onEventClick,
  onEdit,
  onDelete,
}: {
  events: ExtendedCalendarEvent[];
  onEventClick: (event: ExtendedCalendarEvent, e: ReactMouseEvent) => void;
  onEdit: (event: ExtendedCalendarEvent) => void;
  onDelete: (event: ExtendedCalendarEvent) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group events by day
  const grouped = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const groups: Record<string, ExtendedCalendarEvent[]> = {};
    sorted.forEach(ev => {
      const key = dayKey(new Date(ev.start_time));
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return Object.entries(groups);
  }, [events]);

  const today = new Date();

  if (grouped.length === 0) {
    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
        <CalendarIcon className="w-12 h-12 mx-auto text-th-text-tertiary/30 mb-3" />
        <p className="text-th-text-tertiary text-sm">No upcoming events in the next 30 days</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey + 'T00:00:00');
        const isToday = isSameDay(date, today);

        return (
          <div key={dateKey} className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
            <div className={`px-4 py-2.5 border-b border-th-border ${isToday ? 'bg-blue-50/50' : 'bg-surface-secondary/30'}`}>
              <span className={`text-sm font-semibold ${isToday ? 'text-th-accent-600' : 'text-th-text-primary'}`}>
                {isToday ? 'Today · ' : ''}
                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="divide-y divide-th-border">
              {dayEvents.map(ev => {
                const colors = EVENT_TYPE_COLORS[ev.event_type];
                const start = new Date(ev.start_time);
                const end = new Date(ev.end_time);
                const isExpanded = expandedId === ev.id;
                const attendees = ev.attendees;

                return (
                  <div key={ev.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                    >
                      {/* Time */}
                      <div className="w-20 shrink-0 text-right">
                        {ev.all_day ? (
                          <span className="text-xs font-medium text-th-text-tertiary">All day</span>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-th-text-primary">{formatTime(start)}</div>
                            <div className="text-[10px] text-th-text-tertiary">{formatTime(end)}</div>
                          </div>
                        )}
                      </div>

                      {/* Color bar */}
                      <div className={`w-1 h-10 rounded-full ${colors.dot}`} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-th-text-primary truncate">{ev.title}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                            {EVENT_TYPE_ICONS[ev.event_type]}
                            {EVENT_TYPE_LABELS[ev.event_type]}
                          </span>
                          {ev.recurrence_rule && (
                            <Repeat className="w-3 h-3 text-th-text-tertiary" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {ev.location && (
                            <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{ev.location}
                            </span>
                          )}
                          {attendees && attendees.length > 0 && (
                            <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                              <Users className="w-3 h-3" />{attendees.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand indicator */}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-th-text-tertiary shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-th-text-tertiary shrink-0" />
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-3 ml-[calc(5rem+1rem)] space-y-2">
                        {ev.description && (
                          <p className="text-sm text-th-text-secondary">{ev.description}</p>
                        )}
                        {ev.meeting_link && (
                          <a
                            href={ev.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Join Meeting
                          </a>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(ev); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-th-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-primary border border-th-border"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(ev); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tasks Due Sidebar (collapsible) ──────────────────────────────
function TasksSidebar({
  tasksDueToday,
  overdueTasks,
}: {
  tasksDueToday: Array<{ id: string; title: string; due_date: string; completed: boolean; task_type: string; priority: string }>;
  overdueTasks: Array<{ id: string; title: string; due_date: string; completed: boolean; task_type: string; priority: string }>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const totalCount = tasksDueToday.length + overdueTasks.length;

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-th-text-secondary" />
          <span className="text-sm font-semibold text-th-text-primary">Tasks Due</span>
          {totalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              {totalCount}
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronUp className="w-4 h-4 text-th-text-tertiary" />}
      </button>

      {!collapsed && (
        <div className="border-t border-th-border">
          {totalCount === 0 ? (
            <div className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" />
              <p className="text-xs text-th-text-tertiary">All caught up!</p>
            </div>
          ) : (
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
              {overdueTasks.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase text-red-600 tracking-wider mb-1.5">Overdue ({overdueTasks.length})</div>
                  <div className="space-y-1.5">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-red-800 truncate">{task.title}</div>
                          <div className="text-[10px] text-red-600">{new Date(task.due_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tasksDueToday.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase text-th-text-tertiary tracking-wider mb-1.5">Due Today ({tasksDueToday.length})</div>
                  <div className="space-y-1.5">
                    {tasksDueToday.map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-surface-secondary rounded-lg">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-th-accent-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-th-text-primary truncate">{task.title}</div>
                          <div className="text-[10px] text-th-text-tertiary">{task.task_type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── Main Calendar Component ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function Calendar() {
  const { tasksDueToday, overdueTasks, calendarService, refreshCalendar } = useCRM();

  // ── State ─────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & popovers
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [popoverEvent, setPopoverEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Filters
  const [activeFilters, setActiveFilters] = useState<Set<CalendarEventType>>(
    new Set(['meeting', 'call', 'follow_up', 'deadline', 'reminder', 'other'])
  );

  // ── Data loading ──────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      let rangeStart: Date;
      let rangeEnd: Date;

      switch (view) {
        case 'month': {
          rangeStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          rangeEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
          break;
        }
        case 'week': {
          rangeStart = getWeekStart(currentDate);
          rangeEnd = addDays(rangeStart, 6);
          rangeEnd.setHours(23, 59, 59);
          break;
        }
        case 'day': {
          rangeStart = startOfDay(currentDate);
          rangeEnd = new Date(rangeStart);
          rangeEnd.setHours(23, 59, 59);
          break;
        }
        case 'agenda': {
          rangeStart = startOfDay(new Date());
          rangeEnd = addDays(rangeStart, 30);
          rangeEnd.setHours(23, 59, 59);
          break;
        }
      }

      const fetched = await calendarService.getEvents({
        from: rangeStart.toISOString(),
        to: rangeEnd.toISOString(),
      });

      // Generate recurring event instances
      const allEvents: ExtendedCalendarEvent[] = [];
      (fetched as ExtendedCalendarEvent[]).forEach(ev => {
        allEvents.push(ev);
        if (ev.recurrence_rule) {
          allEvents.push(...generateRecurrences(ev, rangeStart, rangeEnd));
        }
      });

      setEvents(allEvents);
    } catch {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view, calendarService]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Filtered events ───────────────────────────────────────────
  const filteredEvents = useMemo(
    () => events.filter(ev => activeFilters.has(ev.event_type)),
    [events, activeFilters]
  );

  // ── All tasks combined for month/day views ────────────────────
  const allTasks = useMemo(
    () => [...tasksDueToday, ...overdueTasks].map(t => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      completed: t.completed,
      priority: t.priority,
      task_type: t.task_type,
    })),
    [tasksDueToday, overdueTasks]
  );

  // ── Navigation ────────────────────────────────────────────────
  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    const d = new Date(currentDate);
    switch (view) {
      case 'month':
        d.setMonth(d.getMonth() - 1);
        break;
      case 'week':
        d.setDate(d.getDate() - 7);
        break;
      case 'day':
      case 'agenda':
        d.setDate(d.getDate() - 1);
        break;
    }
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    switch (view) {
      case 'month':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'week':
        d.setDate(d.getDate() + 7);
        break;
      case 'day':
      case 'agenda':
        d.setDate(d.getDate() + 1);
        break;
    }
    setCurrentDate(d);
  };

  // ── Header title ──────────────────────────────────────────────
  const headerTitle = useMemo(() => {
    switch (view) {
      case 'month':
        return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week': {
        const ws = getWeekStart(currentDate);
        const we = addDays(ws, 6);
        if (ws.getMonth() === we.getMonth()) {
          return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
        }
        return `${MONTH_NAMES[ws.getMonth()].slice(0, 3)} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()].slice(0, 3)} ${we.getDate()}, ${we.getFullYear()}`;
      }
      case 'day':
        return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'agenda':
        return 'Upcoming 30 Days';
    }
  }, [view, currentDate]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleDayClick = (date: Date) => {
    setSelectedDate(formatDate(date));
    setShowAddEvent(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedDate(formatDate(date));
    setShowAddEvent(true);
  };

  const handleEventClick = (event: ExtendedCalendarEvent, e: ReactMouseEvent) => {
    e.stopPropagation();
    setPopoverEvent(event);
    setPopoverPos({ top: e.clientY, left: e.clientX });
  };

  const handleEdit = (event: ExtendedCalendarEvent) => {
    setPopoverEvent(null);
    // Open add event modal in "edit" mode — for now just open to create
    // The AddEventModal can be extended for editing later
    setSelectedDate(formatDate(new Date(event.start_time)));
    setShowAddEvent(true);
  };

  const handleDelete = async (event: ExtendedCalendarEvent) => {
    const realId = event.original_event_id || event.id;
    try {
      const result = await calendarService.deleteEvent(realId);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete event');
        return;
      }
      toast.success('Event deleted');
      setPopoverEvent(null);
      loadEvents();
      refreshCalendar();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const handleEventCreated = () => {
    loadEvents();
    refreshCalendar();
  };

  const toggleFilter = (type: CalendarEventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Calendar</h1>
          <p className="text-th-text-tertiary text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center bg-surface-secondary rounded-lg p-0.5">
            {(['month', 'week', 'day', 'agenda'] as ViewType[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  view === v
                    ? 'bg-surface-primary text-th-text-primary shadow-sm'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              aria-label="Previous"
              className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-th-text-secondary" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-medium text-th-accent-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goNext}
              aria-label="Next"
              className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-th-text-secondary" />
            </button>
          </div>

          {/* Add Event */}
          <button
            onClick={() => { setSelectedDate(undefined); setShowAddEvent(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* ─── Sub-header: title + filters ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-th-text-primary">{headerTitle}</h2>
          {loading && (
            <div className="w-4 h-4 border-2 border-th-accent-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-th-text-tertiary" />
          {(Object.keys(EVENT_TYPE_COLORS) as CalendarEventType[]).map(type => {
            const active = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  active
                    ? `${EVENT_TYPE_COLORS[type].bg} ${EVENT_TYPE_COLORS[type].text} border-transparent`
                    : 'bg-surface-secondary text-th-text-tertiary border-transparent opacity-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: EVENT_TYPE_HEX[type] }}
                />
                {EVENT_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main content area ───────────────────────────────── */}
      <div className={view === 'month' ? 'flex gap-4' : ''}>
        <div className={view === 'month' ? 'flex-1 min-w-0' : ''}>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              tasks={allTasks}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}

          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onTimeSlotClick={handleTimeSlotClick}
              onEventClick={handleEventClick}
            />
          )}

          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={filteredEvents}
              tasks={allTasks}
              onTimeSlotClick={handleTimeSlotClick}
              onEventClick={handleEventClick}
            />
          )}

          {view === 'agenda' && (
            <AgendaView
              events={filteredEvents}
              onEventClick={handleEventClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Tasks sidebar — shown alongside month view */}
        {view === 'month' && (
          <div className="w-72 shrink-0 space-y-4">
            <TasksSidebar
              tasksDueToday={tasksDueToday}
              overdueTasks={overdueTasks}
            />
          </div>
        )}
      </div>

      {/* Tasks sidebar — below the calendar for week/agenda views */}
      {(view === 'week' || view === 'agenda') && (
        <TasksSidebar
          tasksDueToday={tasksDueToday}
          overdueTasks={overdueTasks}
        />
      )}

      {/* ─── Event Popover ───────────────────────────────────── */}
      {popoverEvent && (
        <EventPopover
          event={popoverEvent}
          position={popoverPos}
          onClose={() => setPopoverEvent(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ─── Add Event Modal ─────────────────────────────────── */}
      <AddEventModal
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        defaultDate={selectedDate}
        onSuccess={handleEventCreated}
      />
    </div>
  );
}
