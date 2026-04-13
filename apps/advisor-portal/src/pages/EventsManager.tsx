import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, Calendar, MapPin, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@mpbhealth/ui';
import { eventsService } from '@mpbhealth/advisor-core';
import type { CmsEvent } from '@mpbhealth/advisor-core/src/types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  conference: 'Conference',
  webinar: 'Webinar',
  training: 'Training',
  networking: 'Networking',
  celebration: 'Celebration',
  community: 'Community',
  other: 'Other',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  in_person: 'In Person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
};

export default function EventsManager() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'published' | 'draft'>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsService.getEvents({
        search: search || undefined,
        event_type: filterType || undefined,
        is_published: filterStatus === '' ? undefined : filterStatus === 'published',
      });
      if (mountedRef.current) setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      if (mountedRef.current) toast.error('Failed to load events');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => { if (mountedRef.current) setLoading(false); }, 15_000);
    fetchEvents();
    return () => clearTimeout(timeout);
  }, [search, filterType, filterStatus]);

  const handleDelete = async (id: string) => {
    try {
      await eventsService.deleteEvent(id);
      toast.success('Event deleted');
      setDeleteId(null);
      fetchEvents();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete event');
    }
  };

  const togglePublish = async (event: CmsEvent) => {
    try {
      await eventsService.updateEvent(event.id, { is_published: !event.is_published });
      toast.success(event.is_published ? 'Event unpublished' : 'Event published');
      fetchEvents();
    } catch (err) {
      console.error('Toggle failed:', err);
      toast.error('Failed to update event');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Events Manager</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and manage events for mpb.health/events</p>
        </div>
        <Button type="button" variant="primary" onClick={() => navigate('/events/manage/new')}>
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as '' | 'published' | 'draft')}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-lg border border-neutral-200">
          <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">No events found</p>
          <p className="text-neutral-400 text-sm mt-1">Create your first event to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {event.featured_image_url ? (
                        <img src={event.featured_image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-neutral-200 rounded flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{event.title}</p>
                        <p className="text-xs text-neutral-500 truncate">{event.excerpt || 'No excerpt'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 hidden md:table-cell whitespace-nowrap">
                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-neutral-600">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{event.location || LOCATION_TYPE_LABELS[event.location_type]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      event.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(event)}
                        title={event.is_published ? 'Unpublish' : 'Publish'}
                        aria-label={event.is_published ? 'Unpublish event' : 'Publish event'}
                        className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-blue-600"
                      >
                        {event.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/events/manage/${event.id}/edit`)}
                        title="Edit"
                        aria-label="Edit event"
                        className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(event.id)}
                        title="Delete"
                        aria-label="Delete event"
                        className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Event</h3>
            <p className="text-sm text-neutral-600 mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
