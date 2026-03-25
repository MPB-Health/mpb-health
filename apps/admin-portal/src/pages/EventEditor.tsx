import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Globe, EyeOff, Star, ImageIcon, X, Loader2, Video } from 'lucide-react';
import {
  eventsAdminService,
  type EventCreateInput,
  type EventType,
  type EventLocationType,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';
import RichTextEditor from '../components/RichTextEditor';
import { ImageUploader } from '../components/cms/ImageUploader';
import { uploadEventImage, validateImageFile } from '../components/cms/imageUploadService';

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

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseVideoId(url: string): { type: 'youtube' | 'vimeo'; id: string } | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
  return null;
}

export default function EventEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();
  const isNew = !eventId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [formData, setFormData] = useState({
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
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const event = await eventsAdminService.getEvent(eventId);
        if (event) {
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
          });
          setIsPublished(event.is_published);
        }
      } catch {
        toast.error('Failed to load event');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, navigate]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async (publish?: boolean) => {
    if (!formData.title || !formData.content || !formData.event_date || !formData.organizer) {
      toast.error('Title, content, event date, and organizer are required');
      return;
    }

    setSaving(true);
    const shouldPublish = publish ?? isPublished;

    try {
      const payload: EventCreateInput = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt || null,
        content: formData.content,
        event_date: formData.event_date,
        event_end_date: formData.event_end_date || null,
        event_type: formData.event_type,
        location_type: formData.location_type,
        location: formData.location || null,
        organizer: formData.organizer,
        registration_url: formData.registration_url || null,
        max_attendees: formData.max_attendees ? Number(formData.max_attendees) : null,
        featured_image_url: formData.featured_image_url || null,
        video_url: formData.video_url || null,
        tags: formData.tags,
        gallery_images: formData.gallery_images,
        is_published: shouldPublish,
        is_featured: formData.is_featured,
        created_by: user?.id || null,
      };

      if (isNew) {
        await eventsAdminService.createEvent(payload);
        toast.success(shouldPublish ? 'Event published!' : 'Event saved as draft');
      } else {
        await eventsAdminService.updateEvent(eventId, {
          ...payload,
          is_published: shouldPublish,
        });
        toast.success('Event updated!');
      }

      navigate('/events');
    } catch {
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  const videoInfo = formData.video_url ? parseVideoId(formData.video_url) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Events</span>
        </button>
        <div className="flex items-center space-x-3">
          {isPublished && !isNew ? (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
              >
                <EyeOff className="w-4 h-4" />
                <span>Unpublish</span>
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Publish</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Event title..."
                className="w-full text-3xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="text-th-text-tertiary text-sm">/events/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm bg-transparent border-0 border-b border-th-border focus:outline-none focus:border-th-accent-500 text-th-text-primary"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the event..."
                rows={2}
                className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>

            {/* Content — Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Content *
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                placeholder="Full event description..."
                minHeight="350px"
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="font-semibold text-th-text-primary">Featured Image</h3>
            <ImageUploader
              value={formData.featured_image_url}
              onChange={(url) => setFormData((prev) => ({ ...prev, featured_image_url: url }))}
              slug={formData.slug}
            />
          </div>

          {/* Video */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-th-text-secondary" />
              <h3 className="font-semibold text-th-text-primary">Video</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                YouTube or Video URL
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
              <p className="text-xs text-th-text-tertiary mt-1">Paste a YouTube or Vimeo URL. It will be embedded on the event page.</p>
            </div>
            {videoInfo && (
              <div className="aspect-video rounded-lg overflow-hidden border border-th-border">
                <iframe
                  src={
                    videoInfo.type === 'youtube'
                      ? `https://www.youtube.com/embed/${videoInfo.id}`
                      : `https://player.vimeo.com/video/${videoInfo.id}`
                  }
                  title="Video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          <EventGallerySection
            images={formData.gallery_images}
            onChange={(images) => setFormData((prev) => ({ ...prev, gallery_images: images }))}
            slug={formData.slug}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Date & Time */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-5 space-y-4">
            <h3 className="font-semibold text-th-text-primary">Date & Time</h3>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.event_end_date}
                onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-5 space-y-4">
            <h3 className="font-semibold text-th-text-primary">Details</h3>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              >
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Organizer *
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="e.g., MPB Health"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Max Attendees
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                placeholder="Unlimited"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-5 space-y-4">
            <h3 className="font-semibold text-th-text-primary">Location</h3>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Location Type
              </label>
              <select
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value as EventLocationType })}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              >
                {LOCATION_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Location / Link
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={formData.location_type === 'virtual' ? 'Meeting URL or platform' : 'Venue or address'}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Registration URL
              </label>
              <input
                type="url"
                value={formData.registration_url}
                onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-5 space-y-3">
            <h3 className="font-semibold text-th-text-primary">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-th-accent-100 dark:bg-th-accent-900/30 text-th-accent-700 dark:text-th-accent-300 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-th-accent-500 hover:text-th-accent-700 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary text-sm"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Featured toggle */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-th-text-secondary" />
                <span className="font-medium text-th-text-primary">Featured Event</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_featured: !prev.is_featured }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_featured ? 'bg-th-accent-600' : 'bg-surface-tertiary border border-th-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventGallerySection({
  images,
  onChange,
  slug,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  slug: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      const result = await uploadEventImage(file, { slug: `${slug}-gallery` });
      if (result.success && result.url) {
        newUrls.push(result.url);
      } else {
        toast.error(`${file.name}: ${result.error || 'Upload failed'}`);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setUrlInput('');
  };

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-th-text-primary">Photo Gallery</h3>
        <span className="text-sm text-th-text-tertiary">{images.length} photo{images.length !== 1 ? 's' : ''}</span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-th-border"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                title="Remove photo"
                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="border-2 border-dashed border-th-border rounded-lg p-6 text-center cursor-pointer hover:border-th-accent-400 hover:bg-surface-tertiary transition-all"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 text-th-accent-600 animate-spin" />
            <span className="text-sm text-th-text-secondary">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-6 w-6 text-th-text-tertiary" />
            <span className="text-sm text-th-text-secondary">Click to add photos</span>
            <span className="text-xs text-th-text-tertiary">PNG, JPG, WebP up to 5MB each — select multiple</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleFilesSelect}
        className="hidden"
        aria-label="Upload gallery photos"
      />

      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="Or paste image URL..."
          className="flex-1 px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
