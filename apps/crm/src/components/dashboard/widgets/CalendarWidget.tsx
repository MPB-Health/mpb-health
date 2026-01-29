// ============================================================================
// Calendar Widget
// Shows upcoming events
// ============================================================================

import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Video, Phone, MapPin } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Calendar Widget Component
// ============================================================================

export default function CalendarWidget({ config, size }: BaseWidgetProps) {
  const { calendarEvents } = useCRM();

  const view = (config.view as string) || 'today';

  // Filter events based on view
  const now = new Date();
  const filteredEvents = calendarEvents.filter((event) => {
    const eventDate = new Date(event.start_time);
    if (view === 'today') {
      return eventDate.toDateString() === now.toDateString();
    }
    if (view === 'week') {
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return eventDate >= now && eventDate <= weekFromNow;
    }
    return true;
  });

  const displayEvents = filteredEvents.slice(0, 5);

  if (displayEvents.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming events</p>
        <p className="text-xs text-gray-400 mt-1">
          {view === 'today' ? 'for today' : 'this week'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Today's Date */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">{now.toLocaleDateString('en-US', { weekday: 'short' })}</p>
          <p className="text-2xl font-bold text-violet-600">{now.getDate()}</p>
          <p className="text-xs text-gray-500">{now.toLocaleDateString('en-US', { month: 'short' })}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{displayEvents.length} events</p>
          <p className="text-xs text-gray-500">
            {view === 'today' ? 'today' : 'this week'}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {displayEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      <Link
        to="/calendar"
        className="flex items-center justify-center gap-1 mt-4 pt-4 border-t dark:border-gray-700 text-sm text-violet-600 hover:text-violet-700 transition-colors"
      >
        View calendar
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// Event Card Component
// ============================================================================

interface EventCardProps {
  event: {
    id: string;
    title: string;
    event_type: string;
    start_time: string;
    end_time?: string;
    location?: string;
  };
}

const EVENT_ICONS: Record<string, typeof Video> = {
  meeting: Video,
  call: Phone,
  appointment: Calendar,
};

const EVENT_COLORS: Record<string, string> = {
  meeting: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
  call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  appointment: 'bg-green-100 text-green-600 dark:bg-green-900/30',
};

function EventCard({ event }: EventCardProps) {
  const Icon = EVENT_ICONS[event.event_type] || Calendar;
  const colorClass = EVENT_COLORS[event.event_type] || 'bg-gray-100 text-gray-600 dark:bg-gray-700';

  const startTime = new Date(event.start_time);
  const isToday = startTime.toDateString() === new Date().toDateString();

  return (
    <div className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className={cn('p-2 rounded-lg', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {isToday ? formatTime(startTime) : formatDateTime(startTime)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}
