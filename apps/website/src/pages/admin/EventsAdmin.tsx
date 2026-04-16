import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  EyeOff,
  X,
  Save,
  CalendarDays,
  MapPin,
  Video,
  Layers,
  Search,
  Star,
  Images,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import MigratedToAdminPortal from '../../components/admin/MigratedToAdminPortal';

type EventLocationType = 'in_person' | 'virtual' | 'hybrid';
type EventType =
  | 'conference'
  | 'webinar'
  | 'training'
  | 'networking'
  | 'celebration'
  | 'community'
  | 'other';

interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  event_date: string;
  event_end_date: string | null;
  location: string | null;
  location_type: EventLocationType;
  registration_url: string | null;
  event_type: EventType;
  organizer: string;
  max_attendees: number | null;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  gallery_images: string[];
  video_url: string | null;
  created_at: string;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'conference', label: 'Conference' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'training', label: 'Training' },
  { value: 'networking', label: 'Networking' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
];

const LOCATION_TYPE_OPTIONS: { value: EventLocationType; label: string }[] = [
  { value: 'in_person', label: 'In Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' },
];

function formatDate(dateStr: string, includeYear = true) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}) });
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function LocationIcon({ type }: { type: EventLocationType }) {
  if (type === 'virtual') return <Video className="w-3.5 h-3.5" />;
  if (type === 'hybrid') return <Layers className="w-3.5 h-3.5" />;
  return <MapPin className="w-3.5 h-3.5" />;
}

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  event_date: '',
  event_end_date: '',
  event_type: 'other' as EventType,
  location_type: 'in_person' as EventLocationType,
  location: '',
  organizer: '',
  registration_url: '',
  max_attendees: '',
  featured_image_url: '',
  video_url: '',
  tags: [] as string[],
  gallery_images: [] as string[],
  is_featured: false,
  is_published: false,
};

const BUCKET = 'event-images';

async function uploadImageToStorage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}

const EventsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [featuredUploading, setFeaturedUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const featuredFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, slug, excerpt, content, featured_image_url, event_date, event_end_date, location, location_type, registration_url, event_type, organizer, max_attendees, is_published, is_featured, tags, gallery_images, video_url, created_at')
        .order('event_date', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingEvent(null);
    setFormData(emptyForm);
    setTagInput('');
    setShowForm(true);
  };

  const openEdit = (event: AdminEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      excerpt: event.excerpt || '',
      content: event.content,
      event_date: event.event_date,
      event_end_date: event.event_end_date || '',
      event_type: event.event_type,
      location_type: event.location_type,
      location: event.location || '',
      organizer: event.organizer,
      registration_url: event.registration_url || '',
      max_attendees: event.max_attendees != null ? String(event.max_attendees) : '',
      featured_image_url: event.featured_image_url || '',
      video_url: event.video_url || '',
      tags: event.tags || [],
      gallery_images: event.gallery_images || [],
      is_featured: event.is_featured,
      is_published: event.is_published,
    });
    setTagInput('');
    setGalleryInput('');
    setShowForm(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !formData.tags.includes(t)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) =>
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const addGalleryImage = () => {
    const url = galleryInput.trim();
    if (url && !formData.gallery_images.includes(url)) {
      setFormData(prev => ({ ...prev, gallery_images: [...prev.gallery_images, url] }));
      setGalleryInput('');
    }
  };

  const removeGalleryImage = (url: string) =>
    setFormData(prev => ({ ...prev, gallery_images: prev.gallery_images.filter(u => u !== url) }));

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeaturedUploading(true);
    try {
      const url = await uploadImageToStorage(file, 'featured');
      setFormData(prev => ({ ...prev, featured_image_url: url }));
    } catch {
      setNotification({ type: 'error', message: 'Failed to upload image' });
    } finally {
      setFeaturedUploading(false);
      if (featuredFileRef.current) featuredFileRef.current.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const results = await Promise.allSettled(files.map(f => uploadImageToStorage(f, 'gallery')));
      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value);
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (succeeded.length > 0) {
        setFormData(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, ...succeeded.filter(u => !prev.gallery_images.includes(u))],
        }));
      }
      if (failCount > 0) {
        setNotification({ type: 'error', message: `${failCount} image${failCount > 1 ? 's' : ''} failed to upload` });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to upload images' });
    } finally {
      setGalleryUploading(false);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
    }
  };

  const handleSave = async (publish?: boolean) => {
    if (!formData.title || !formData.content || !formData.event_date || !formData.organizer) {
      setNotification({ type: 'error', message: 'Title, content, event date, and organizer are required' });
      return;
    }

    setSaving(true);
    const isPublished = publish !== undefined ? publish : formData.is_published;

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt || '',
        content: formData.content,
        event_date: formData.event_date,
        event_end_date: formData.event_end_date || null,
        event_type: formData.event_type,
        location_type: formData.location_type,
        location: formData.location || '',
        organizer: formData.organizer,
        registration_url: formData.registration_url || null,
        max_attendees: formData.max_attendees ? Number(formData.max_attendees) : null,
        featured_image_url: formData.featured_image_url || '',
        video_url: formData.video_url || null,
        tags: formData.tags,
        gallery_images: formData.gallery_images,
        is_featured: formData.is_featured,
        is_published: isPublished,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Event updated!' });
      } else {
        const { error } = await supabase
          .from('events')
          .insert(payload);
        if (error) throw error;
        setNotification({ type: 'success', message: isPublished ? 'Event published!' : 'Event saved as draft' });
      }

      setShowForm(false);
      fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: `Failed to save event: ${message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      setNotification({ type: 'success', message: 'Event deleted' });
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete event' });
    }
  };

  const handleTogglePublish = async (event: AdminEvent) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !event.is_published })
        .eq('id', event.id);
      if (error) throw error;
      setEvents(prev =>
        prev.map(e => e.id === event.id ? { ...e, is_published: !e.is_published } : e)
      );
      setNotification({ type: 'success', message: event.is_published ? 'Event unpublished' : 'Event published' });
    } catch {
      setNotification({ type: 'error', message: 'Failed to update event' });
    }
  };

  const filtered = events.filter(e =>
    !searchQuery ||
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout activeView="events" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Events Management | MPB Admin</title>
      </Helmet>

      <MigratedToAdminPortal adminPath="/content/events" sectionName="Events Management" />

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          notification.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {notification.message}
          <button type="button" aria-label="Dismiss" onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Events</h1>
            <p className="text-slate-500 text-sm mt-1">Manage events shown on mpb.health/events</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Events table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No events found</p>
              <button
                type="button"
                onClick={openNew}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Create your first event
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(event => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {event.featured_image_url ? (
                          <img
                            src={event.featured_image_url}
                            alt={event.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CalendarDays className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate max-w-xs">{event.title}</p>
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                              <LocationIcon type={event.location_type} />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                      {EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type)?.label ?? event.event_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(event.event_date)}
                      {event.event_end_date && event.event_end_date !== event.event_date && (
                        <span className="text-slate-400"> – {formatDate(event.event_end_date, false)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.is_published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.is_published ? 'Published' : 'Draft'}
                      </span>
                      {event.is_featured && (
                        <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(event)}
                          aria-label={event.is_published ? 'Unpublish' : 'Publish'}
                          title={event.is_published ? 'Unpublish' : 'Publish'}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {event.is_published ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          aria-label="Edit"
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id, event.title)}
                          aria-label="Delete"
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-in form panel */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <div className="flex items-center gap-2">
                {!formData.is_published && (
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving || galleryUploading}
                    title={galleryUploading ? 'Wait for images to finish uploading' : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {saving ? 'Publishing…' : 'Publish'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving || galleryUploading}
                  title={galleryUploading ? 'Wait for images to finish uploading' : undefined}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : galleryUploading ? 'Uploading…' : formData.is_published ? 'Save' : 'Draft'}
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowForm(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Event title"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-sm">/events/</span>
                  <input
                    type="text"
                    aria-label="URL slug"
                    value={formData.slug}
                    onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-start-date" className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    id="event-start-date"
                    type="date"
                    value={formData.event_date}
                    onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="event-end-date" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    id="event-end-date"
                    type="date"
                    value={formData.event_end_date}
                    onChange={e => setFormData(p => ({ ...p, event_end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Type & Organizer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-type" className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                  <select
                    id="event-type"
                    aria-label="Event type"
                    value={formData.event_type}
                    onChange={e => setFormData(p => ({ ...p, event_type: e.target.value as EventType }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organizer *</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={e => setFormData(p => ({ ...p, organizer: e.target.value }))}
                    placeholder="e.g. MPB Health"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location-type" className="block text-sm font-medium text-slate-700 mb-1">Location Type</label>
                  <select
                    id="location-type"
                    aria-label="Location type"
                    value={formData.location_type}
                    onChange={e => setFormData(p => ({ ...p, location_type: e.target.value as EventLocationType }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {LOCATION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location / Link</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    placeholder={formData.location_type === 'virtual' ? 'Meeting URL' : 'Venue or address'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Registration URL & Max Attendees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration URL</label>
                  <input
                    type="url"
                    value={formData.registration_url}
                    onChange={e => setFormData(p => ({ ...p, registration_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Attendees</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_attendees}
                    onChange={e => setFormData(p => ({ ...p, max_attendees: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Featured Image</label>

                {/* Upload button */}
                <input
                  ref={featuredFileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  aria-label="Upload featured image"
                  className="hidden"
                  onChange={handleFeaturedUpload}
                />
                <button
                  type="button"
                  onClick={() => featuredFileRef.current?.click()}
                  disabled={featuredUploading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {featuredUploading ? 'Uploading…' : 'Click to upload image'}
                  <span className="text-slate-400 text-xs">(JPEG, PNG, WebP — max 10 MB)</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> or paste a URL
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <input
                  type="url"
                  value={formData.featured_image_url}
                  onChange={e => setFormData(p => ({ ...p, featured_image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />

                {/* Preview */}
                {formData.featured_image_url && (
                  <div className="relative mt-2 group">
                    <img
                      src={formData.featured_image_url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      aria-label="Remove featured image"
                      onClick={() => setFormData(p => ({ ...p, featured_image_url: '' }))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={e => setFormData(p => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => setFormData(p => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Brief description of the event..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content * <span className="text-slate-400 font-normal">(Markdown supported)</span></label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="Full event description..."
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                      <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => removeTag(tag)} className="hover:text-blue-900">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag and press Enter..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Images className="w-4 h-4" />
                    Gallery Images
                  </span>
                </label>

                {/* Thumbnail grid */}
                {formData.gallery_images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {formData.gallery_images.map((url, idx) => (
                      <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={url}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => removeGalleryImage(url)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  aria-label="Upload gallery images"
                  multiple
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
                <button
                  type="button"
                  onClick={() => galleryFileRef.current?.click()}
                  disabled={galleryUploading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 mb-2"
                >
                  <Upload className="w-4 h-4" />
                  {galleryUploading ? 'Uploading…' : 'Click to upload images'}
                  <span className="text-slate-400 text-xs">(select multiple)</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> or paste a URL
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={galleryInput}
                    onChange={e => setGalleryInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGalleryImage())}
                    placeholder="Paste image URL and press Enter..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addGalleryImage}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Featured toggle */}
              <label className="flex items-center justify-between py-3 border-t border-slate-100 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Featured Event</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, is_featured: !p.is_featured }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_featured ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default EventsAdmin;
