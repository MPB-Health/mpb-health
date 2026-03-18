import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CalendarDays,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  EyeOff,
  MapPin,
  Video,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  eventsAdminService,
  type AdminEvent,
  type EventType,
} from '@mpbhealth/admin-core';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  conference: 'Conference',
  webinar: 'Webinar',
  training: 'Training',
  networking: 'Networking',
  celebration: 'Celebration',
  community: 'Community',
  other: 'Other',
};

function LocationTypeIcon({ type }: { type: AdminEvent['location_type'] }) {
  if (type === 'virtual') return <Video className="w-3.5 h-3.5" />;
  if (type === 'hybrid') return <Layers className="w-3.5 h-3.5" />;
  return <MapPin className="w-3.5 h-3.5" />;
}

export default function EventsAdmin() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await eventsAdminService.getEvents({
          is_published:
            publishedFilter === 'published'
              ? true
              : publishedFilter === 'unpublished'
              ? false
              : undefined,
          event_type: typeFilter ? (typeFilter as EventType) : undefined,
          search: searchQuery || undefined,
        });
        setEvents(data);
      } catch {
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchQuery, publishedFilter, typeFilter]);

  const handlePublish = async (id: string) => {
    try {
      await eventsAdminService.publishEvent(id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_published: true } : e))
      );
      toast.success('Event published');
    } catch {
      toast.error('Failed to publish event');
    }
    setActiveMenu(null);
  };

  const handleUnpublish = async (id: string) => {
    try {
      await eventsAdminService.unpublishEvent(id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_published: false } : e))
      );
      toast.success('Event unpublished');
    } catch {
      toast.error('Failed to unpublish event');
    }
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventsAdminService.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
    setActiveMenu(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Events</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage events shown on mpb.health/events
          </p>
        </div>
        <button
          onClick={() => navigate('/content/events/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-th-text-tertiary" />
          <select
            aria-label="Filter by status"
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          >
            <option value="">All Types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : events.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Event
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-surface-tertiary">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      {event.featured_image_url ? (
                        <img
                          src={event.featured_image_url}
                          alt={event.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-surface-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-6 h-6 text-th-text-tertiary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-th-text-primary line-clamp-1">
                          {event.title}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-th-text-tertiary mt-0.5">
                            <LocationTypeIcon type={event.location_type} />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-th-text-secondary capitalize">
                      {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-th-text-secondary whitespace-nowrap">
                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                    {event.event_end_date &&
                      event.event_end_date !== event.event_date && (
                        <span className="text-th-text-tertiary">
                          {' '}– {format(new Date(event.event_end_date), 'MMM d')}
                        </span>
                      )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        event.is_published
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                    {event.is_featured && (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(activeMenu === event.id ? null : event.id)
                        }
                        aria-label="Event actions"
                        className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {activeMenu === event.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface-primary rounded-lg shadow-lg border border-th-border py-1 z-10">
                          <button
                            onClick={() =>
                              navigate(`/content/events/${event.id}`)
                            }
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-tertiary"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          {event.is_published ? (
                            <button
                              onClick={() => handleUnpublish(event.id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-tertiary"
                            >
                              <EyeOff className="w-4 h-4" />
                              <span>Unpublish</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(event.id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-tertiary"
                            >
                              <Globe className="w-4 h-4" />
                              <span>Publish</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No events found</p>
            <button
              onClick={() => navigate('/content/events/new')}
              className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
            >
              Create your first event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
