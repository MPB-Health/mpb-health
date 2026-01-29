import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Video,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Link as LinkIcon,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/Card';
import { calendarService, type CalendarEvent } from '../../lib/calendarService';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'week' | 'month';

// ============================================================================
// Event Card Component
// ============================================================================

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, compact = false, onClick }) => {
  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    call: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    meeting: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    follow_up: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    demo: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    other: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  };

  const statusIcons: Record<string, { icon: React.ElementType; color: string }> = {
    completed: { icon: Check, color: 'text-green-500' },
    cancelled: { icon: X, color: 'text-red-500' },
    no_show: { icon: X, color: 'text-orange-500' },
  };

  const colors = typeColors[event.event_type] || typeColors.other;
  const StatusIcon = statusIcons[event.status]?.icon;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-2 py-1 rounded text-xs truncate border',
          colors.bg, colors.text, colors.border,
          'hover:shadow-sm transition-shadow'
        )}
      >
        <span className="font-medium">{formatTime(event.start_time)}</span>
        {' '}
        <span className="opacity-80">{event.title}</span>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
        colors.bg, colors.border
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {event.event_type === 'call' && <Phone className={cn('h-4 w-4', colors.text)} />}
          {event.event_type === 'meeting' && <Video className={cn('h-4 w-4', colors.text)} />}
          {event.event_type === 'follow_up' && <CalendarIcon className={cn('h-4 w-4', colors.text)} />}
          <span className={cn('font-medium text-sm', colors.text)}>
            {event.title}
          </span>
        </div>
        {StatusIcon && <StatusIcon className={cn('h-4 w-4', statusIcons[event.status].color)} />}
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {calendarService.formatEventTime(event)}
        </div>
        {event.lead_name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {event.lead_name}
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.location}
          </div>
        )}
        {event.meeting_link && (
          <div className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            <a 
              href={event.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Event Detail Modal
// ============================================================================

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !event) return null;

  const handleComplete = async () => {
    setUpdating(true);
    await calendarService.completeEvent(event.id);
    setUpdating(false);
    onUpdate();
    onClose();
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this event?')) return;
    setUpdating(true);
    await calendarService.cancelEvent(event.id);
    setUpdating(false);
    onUpdate();
    onClose();
  };

  const handleNoShow = async () => {
    setUpdating(true);
    await calendarService.markNoShow(event.id);
    setUpdating(false);
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>{new Date(event.start_time).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{calendarService.formatEventTime(event)}</span>
            </div>
            {event.lead_name && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <a href={`/admin/crm/leads/${event.lead_id}`} className="text-blue-600 hover:underline">
                  {event.lead_name}
                </a>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{event.location}</span>
              </div>
            )}
            {event.meeting_link && (
              <div className="flex items-center gap-3 text-sm">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Join Meeting Link
                </a>
              </div>
            )}
          </div>

          {event.description && (
            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          )}

          {event.notes && (
            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{event.notes}</p>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              event.status === 'scheduled' && 'bg-blue-100 text-blue-700',
              event.status === 'confirmed' && 'bg-green-100 text-green-700',
              event.status === 'completed' && 'bg-gray-100 text-gray-700',
              event.status === 'cancelled' && 'bg-red-100 text-red-700',
              event.status === 'no_show' && 'bg-orange-100 text-orange-700'
            )}>
              {event.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {event.status === 'scheduled' || event.status === 'confirmed' ? (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-2">
            <Button
              onClick={handleComplete}
              disabled={updating}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Complete
            </Button>
            <Button
              variant="outline"
              onClick={handleNoShow}
              disabled={updating}
            >
              No Show
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updating}
              className="text-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ============================================================================
// Create Event Modal
// ============================================================================

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultDate?: Date;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultDate,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'call' as CalendarEvent['event_type'],
    date: '',
    start_time: '09:00',
    duration: 30,
    description: '',
    location: '',
    meeting_link: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (defaultDate) {
      setFormData(prev => ({
        ...prev,
        date: defaultDate.toISOString().split('T')[0],
      }));
    }
  }, [defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    setSaving(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
      const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60 * 1000);

      await calendarService.createEvent({
        title: formData.title,
        event_type: formData.event_type,
        start_time: startDateTime,
        end_time: endDateTime,
        description: formData.description || undefined,
        location: formData.location || undefined,
        meeting_link: formData.meeting_link || undefined,
      });

      onCreated();
      onClose();
      setFormData({
        title: '',
        event_type: 'call',
        date: '',
        start_time: '09:00',
        duration: 30,
        description: '',
        location: '',
        meeting_link: '',
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Event</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Call with John"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as CalendarEvent['event_type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="demo">Demo</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
              <input
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="https://zoom.us/..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.title || !formData.date}>
              {saving ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Main Calendar Page
// ============================================================================

const CRMCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date>();
  const [stats, setStats] = useState({
    todayEvents: 0,
    thisWeekEvents: 0,
    completedThisWeek: 0,
    upcomingCount: 0,
  });

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [currentDate, viewMode]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      if (viewMode === 'week') {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const data = await calendarService.getEvents({
          startDate: weekStart,
          endDate: weekEnd,
        });
        setEvents(data);
      } else {
        const monthEvents = await calendarService.getEventsForMonth(
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        setEvents(Array.from(monthEvents.values()).flat());
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const data = await calendarService.getCalendarStats();
    setStats(data);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setCreateDefaultDate(date);
    setShowCreateModal(true);
  };

  // Generate week days
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Generate month days
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
  const calendarDays: Date[] = [];
  const tempDate = new Date(calendarStart);
  while (tempDate <= monthEnd || calendarDays.length % 7 !== 0) {
    calendarDays.push(new Date(tempDate));
    tempDate.setDate(tempDate.getDate() + 1);
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.start_time.split('T')[0] === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <AdminLayout activeView="crm-calendar" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="CRM Calendar | MPB Health Admin"
        description="Manage appointments and scheduled events"
      />

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Calendar' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-500">Manage your appointments and scheduled events</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadEvents}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={() => { setCreateDefaultDate(new Date()); setShowCreateModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.todayEvents}</div>
              <div className="text-sm text-gray-500">Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.thisWeekEvents}</div>
              <div className="text-sm text-gray-500">This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completedThisWeek}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.upcomingCount}</div>
              <div className="text-sm text-gray-500">Upcoming</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Controls */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="ml-4 text-lg font-semibold text-gray-900">
                  {viewMode === 'week'
                    ? `${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('week')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    viewMode === 'week' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    viewMode === 'month' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  Month
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : viewMode === 'week' ? (
          /* Week View */
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-gray-200">
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-3 text-center border-r border-gray-200 last:border-r-0',
                      isToday(day) && 'bg-primary-50'
                    )}
                  >
                    <div className="text-xs text-gray-500 uppercase">
                      {day.toLocaleDateString([], { weekday: 'short' })}
                    </div>
                    <div className={cn(
                      'text-lg font-semibold',
                      isToday(day) ? 'text-primary-600' : 'text-gray-900'
                    )}>
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[500px]">
                {weekDays.map((day, i) => {
                  const dayEvents = getEventsForDate(day);
                  return (
                    <div
                      key={i}
                      className={cn(
                        'border-r border-gray-200 last:border-r-0 p-2 space-y-2',
                        'cursor-pointer hover:bg-gray-50 transition-colors',
                        isToday(day) && 'bg-primary-50/50'
                      )}
                      onClick={() => handleDayClick(day)}
                    >
                      {dayEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onClick={() => { setSelectedEvent(event); }}
                        />
                      ))}
                      {dayEvents.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Month View */
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  return (
                    <div
                      key={i}
                      className={cn(
                        'min-h-[100px] p-1 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50',
                        !isCurrentMonth && 'bg-gray-50',
                        isToday(day) && 'bg-primary-50'
                      )}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-1 p-1',
                        isToday(day) ? 'text-primary-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      )}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            compact
                            onClick={() => { setSelectedEvent(event); }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onUpdate={loadEvents}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadEvents}
        defaultDate={createDefaultDate}
      />
    </AdminLayout>
  );
};

export default CRMCalendar;

