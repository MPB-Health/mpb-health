import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Eye, Save, X, LogOut, Loader2, CheckCircle, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClientLogger } from '@mpbhealth/utils';
import { supabase, CmsEvent } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { ImageUploader } from '../components/admin/ImageUploader';
import { AdminLayout } from '../components/admin/AdminLayout';

const log = createClientLogger('EventsAdmin');

const EVENT_TYPE_OPTIONS = [
  { value: 'conference', label: 'Conference' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'training', label: 'Training' },
  { value: 'networking', label: 'Networking' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
];

const LOCATION_TYPE_OPTIONS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' },
];

const defaultFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image_url: '',
  event_date: '',
  event_end_date: '',
  location: '',
  location_type: 'in_person',
  registration_url: '',
  event_type: 'community',
  organizer: 'MPB Health',
  max_attendees: '',
  is_published: false,
  is_featured: false,
};

export const EventsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CmsEvent | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({ ...defaultFormData });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && events.length > 0 && !showForm) {
      const eventToEdit = events.find(e => e.id === editId);
      if (eventToEdit) {
        handleEdit(eventToEdit);
        setSearchParams({});
      }
    }
  }, [searchParams, events, showForm]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error?.message?.includes('schema cache') ||
          error?.code === 'PGRST204' ||
          error?.code === 'PGRST205') {
        console.warn('events table not yet created - run migrations');
        setEvents([]);
        return;
      }
      if (error) throw error;
      if (data) setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'title' && !editingEvent) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log.info('handleSubmit called', { editingEvent: editingEvent?.id });

    setSaving(true);
    setNotification(null);

    const payload = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      featured_image_url: formData.featured_image_url,
      event_date: formData.event_date,
      event_end_date: formData.event_end_date || null,
      location: formData.location,
      location_type: formData.location_type,
      registration_url: formData.registration_url || null,
      event_type: formData.event_type,
      organizer: formData.organizer,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees, 10) : null,
      is_published: formData.is_published,
      is_featured: formData.is_featured,
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingEvent.id)
          .select();

        if (error) throw error;
        setNotification({ type: 'success', message: `Event "${formData.title}" updated successfully!` });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([payload])
          .select();

        if (error) throw error;
        setNotification({ type: 'success', message: `Event "${formData.title}" created successfully!` });
      }

      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error('[EventsAdmin] Error saving event:', error);
      setNotification({ type: 'error', message: `Failed to save event: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event: CmsEvent) => {
    log.info('handleEdit called for event:', event.id, event.title);
    setEditingEvent(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      excerpt: event.excerpt || '',
      content: event.content || '',
      featured_image_url: event.featured_image_url || '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      event_end_date: event.event_end_date ? event.event_end_date.slice(0, 16) : '',
      location: event.location || '',
      location_type: event.location_type || 'in_person',
      registration_url: event.registration_url || '',
      event_type: event.event_type || 'community',
      organizer: event.organizer || 'MPB Health',
      max_attendees: event.max_attendees ? String(event.max_attendees) : '',
      is_published: event.is_published,
      is_featured: event.is_featured,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Event deleted successfully!' });
      fetchEvents();
    } catch (error: any) {
      console.error('[EventsAdmin] Error deleting event:', error);
      setNotification({ type: 'error', message: `Failed to delete event: ${error.message}` });
    }
  };

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AdminLayout activeView="events" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Events Admin | MPB Health</title>
      </Helmet>

      {notification && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-current opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Events Management</h1>
            <p className="text-neutral-600 mt-2">Create and manage events for mpb.health/events</p>
            {user && (
              <p className="text-sm text-neutral-500 mt-1">Signed in as: {user.email}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Event
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Event Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-12">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4">
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h2>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Slug (URL) *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-neutral-500 mt-1">URL: /events/{formData.slug || 'your-event-slug'}</p>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Excerpt *</label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Event Date & End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Event Date *</label>
                    <input
                      type="datetime-local"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">End Date (optional)</label>
                    <input
                      type="datetime-local"
                      name="event_end_date"
                      value={formData.event_end_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Event Type & Location Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Event Type</label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {EVENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Location Type</label>
                    <select
                      name="location_type"
                      value={formData.location_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {LOCATION_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location & Registration URL */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Location / Venue</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Convention Center, Zoom link"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Registration URL</label>
                    <input
                      type="url"
                      name="registration_url"
                      value={formData.registration_url}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Organizer & Max Attendees */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Organizer</label>
                    <input
                      type="text"
                      name="organizer"
                      value={formData.organizer}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Max Attendees</label>
                    <input
                      type="number"
                      name="max_attendees"
                      value={formData.max_attendees}
                      onChange={handleInputChange}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Content *</label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                    placeholder="Write the event description and details..."
                  />
                </div>

                {/* Featured Image */}
                <ImageUploader
                  value={formData.featured_image_url}
                  onChange={(url) => setFormData((prev) => ({ ...prev, featured_image_url: url }))}
                  slug={formData.slug}
                  label="Featured Image"
                  showUrlInput={true}
                />

                {/* Publish & Featured toggles */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_published"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="is_published" className="text-sm font-medium text-neutral-700">
                      Publish event (visible on mpb.health/events)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_featured"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-neutral-700">
                      Featured event
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-neutral-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {editingEvent ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        {editingEvent ? 'Update Event' : 'Create Event'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-neutral-600">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
            <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">No events yet. Create your first event!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {event.featured_image_url ? (
                          <img
                            src={event.featured_image_url.startsWith('http') ? event.featured_image_url : `/${event.featured_image_url.replace(/^\//, '')}`}
                            alt={event.title}
                            className="w-16 h-16 object-cover rounded mr-4"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-neutral-100 rounded mr-4 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-neutral-300" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-neutral-900 line-clamp-1">{event.title}</div>
                          <div className="text-sm text-neutral-500 line-clamp-1">{event.excerpt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {event.location || LOCATION_TYPE_OPTIONS.find(o => o.value === event.location_type)?.label || event.location_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 capitalize">
                        {EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type)?.label || event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/events/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-neutral-600 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title="View event"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleEdit(event)}
                          className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit event"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          className="p-2 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EventsAdmin;
