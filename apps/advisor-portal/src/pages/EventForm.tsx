import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, X, ImageIcon, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsService } from '@mpbhealth/advisor-core';
import { Breadcrumbs, Button } from '@mpbhealth/ui';
import { supabase } from '@mpbhealth/database';
import { RichTextEditor } from '../components/cms/RichTextEditor';
import { ImageUploader } from '../components/cms/ImageUploader';
import { uploadEventImage, validateImageFile } from '../components/cms/imageUploadService';

interface EventFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  event_date: string;
  event_end_date: string;
  location: string;
  location_type: 'in_person' | 'virtual' | 'hybrid';
  registration_url: string;
  event_type: 'conference' | 'webinar' | 'training' | 'networking' | 'celebration' | 'community' | 'other';
  organizer: string;
  max_attendees: string;
  is_published: boolean;
  is_featured: boolean;
  tags: string;
  video_url: string;
  gallery_images: string[];
}

const EMPTY_FORM: EventFormData = {
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
  tags: '',
  video_url: '',
  gallery_images: [],
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Load event for editing
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 15_000);

    eventsService.getEvent(id).then((event) => {
      if (cancelled) return;
      if (!event) {
        toast.error('Event not found');
        navigate('/events/manage');
        return;
      }
      setForm({
        title: event.title,
        slug: event.slug,
        excerpt: event.excerpt || '',
        content: event.content || '',
        featured_image_url: event.featured_image_url || '',
        event_date: event.event_date ? toLocalDatetime(event.event_date) : '',
        event_end_date: event.event_end_date ? toLocalDatetime(event.event_end_date) : '',
        location: event.location || '',
        location_type: event.location_type,
        registration_url: event.registration_url || '',
        event_type: event.event_type,
        organizer: event.organizer || 'MPB Health',
        max_attendees: event.max_attendees ? String(event.max_attendees) : '',
        is_published: event.is_published,
        is_featured: event.is_featured,
        tags: (event.tags || []).join(', '),
        video_url: event.video_url || '',
        gallery_images: event.gallery_images || [],
      });
      setSlugManuallyEdited(true);
    }).catch((err) => {
      if (cancelled) return;
      console.error(err);
      toast.error('Failed to load event');
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [id, navigate]);

  const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === 'title' && !slugManuallyEdited) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.slug.trim()) { toast.error('Slug is required'); return; }
    if (!form.event_date) { toast.error('Event date is required'); return; }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        featured_image_url: form.featured_image_url,
        event_date: new Date(form.event_date).toISOString(),
        event_end_date: form.event_end_date ? new Date(form.event_end_date).toISOString() : null,
        location: form.location.trim(),
        location_type: form.location_type,
        registration_url: form.registration_url.trim() || null,
        event_type: form.event_type,
        organizer: form.organizer.trim(),
        max_attendees: form.max_attendees ? parseInt(form.max_attendees, 10) : null,
        is_published: form.is_published,
        is_featured: form.is_featured,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        video_url: form.video_url.trim() || null,
        gallery_images: form.gallery_images,
        created_by: user?.id || null,
      };

      if (isEditing && id) {
        await eventsService.updateEvent(id, payload);
        toast.success('Event updated');
      } else {
        await eventsService.createEvent(payload);
        toast.success('Event created');
      }

      navigate('/events/manage');
    } catch (err: unknown) {
      console.error('Save failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined;
      if (msg?.includes('duplicate key') || code === '23505') {
        toast.error('An event with this slug already exists');
      } else {
        toast.error('Failed to save event');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Events', href: '/events/manage' },
          { label: isEditing ? (form.title || 'Edit Event') : 'New Event' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/events/manage')} aria-label="Back to events" className="min-h-[44px] min-w-[44px]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            {isEditing ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="text-sm text-th-text-secondary mt-0.5">
            {isEditing ? 'Update the event details below' : 'Fill in the details for the new event'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-5">
          <h2 className="text-lg font-semibold text-th-text-primary">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-th-text-primary mb-1">Title *</label>
              <input
                type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-th-text-primary mb-1">Slug *</label>
              <input
                type="text" value={form.slug}
                onChange={(e) => { setSlugManuallyEdited(true); updateField('slug', slugify(e.target.value)); }}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="event-url-slug"
              />
              <p className="text-xs text-th-text-tertiary mt-1">URL: mpb.health/events/{form.slug || '...'}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-th-text-primary mb-1">Excerpt</label>
              <textarea
                value={form.excerpt} onChange={(e) => updateField('excerpt', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the event..."
              />
            </div>
          </div>
        </div>

        {/* Date, Location, Details */}
        <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-5">
          <h2 className="text-lg font-semibold text-th-text-primary">Event Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Event Date *</label>
              <input
                type="datetime-local" value={form.event_date} onChange={(e) => updateField('event_date', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">End Date</label>
              <input
                type="datetime-local" value={form.event_end_date} onChange={(e) => updateField('event_end_date', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Location Type</label>
              <select
                value={form.location_type} onChange={(e) => updateField('location_type', e.target.value as EventFormData['location_type'])}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="in_person">In Person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Location</label>
              <input
                type="text" value={form.location} onChange={(e) => updateField('location', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={form.location_type === 'virtual' ? 'Meeting link...' : 'Venue name, city...'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Event Type</label>
              <select
                value={form.event_type} onChange={(e) => updateField('event_type', e.target.value as EventFormData['event_type'])}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="conference">Conference</option>
                <option value="webinar">Webinar</option>
                <option value="training">Training</option>
                <option value="networking">Networking</option>
                <option value="celebration">Celebration</option>
                <option value="community">Community</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Organizer</label>
              <input
                type="text" value={form.organizer} onChange={(e) => updateField('organizer', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MPB Health"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Registration URL</label>
              <input
                type="url" value={form.registration_url} onChange={(e) => updateField('registration_url', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1">Max Attendees</label>
              <input
                type="number" value={form.max_attendees} onChange={(e) => updateField('max_attendees', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for unlimited"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-th-text-primary mb-1">Tags</label>
              <input
                type="text" value={form.tags} onChange={(e) => updateField('tags', e.target.value)}
                className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="annual, gala, team (comma-separated)"
              />
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-th-text-primary">Featured Image</h2>
          <ImageUploader
            value={form.featured_image_url}
            onChange={(url) => updateField('featured_image_url', url)}
            slug={form.slug}
          />
        </div>

        {/* Video Embed */}
        <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-th-text-secondary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Video</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-primary mb-1">YouTube or Video URL</label>
            <input
              type="url" value={form.video_url} onChange={(e) => updateField('video_url', e.target.value)}
              className="w-full px-3 py-2 border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            />
            <p className="text-xs text-th-text-tertiary mt-1">Paste a YouTube, Vimeo, or direct video file URL. It will be embedded on the event page.</p>
          </div>
          {form.video_url && (() => {
            const ytMatch = form.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
            if (ytMatch) {
              return (
                <div className="aspect-video rounded-lg overflow-hidden border border-th-border">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                    title="Video preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              );
            }
            return (
              <p className="text-sm text-th-text-secondary">Preview will appear on the live event page.</p>
            );
          })()}
        </div>

        {/* Content */}
        <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-th-text-primary">Content</h2>
          <RichTextEditor
            content={form.content}
            onChange={(html) => updateField('content', html)}
          />
        </div>

        {/* Photo Gallery */}
        <EventGallerySection
          images={form.gallery_images}
          onChange={(images) => setForm(prev => ({ ...prev, gallery_images: images }))}
          slug={form.slug}
        />

        {/* Publish Settings */}
        <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-th-text-primary">Publishing</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox" checked={form.is_published}
                onChange={(e) => updateField('is_published', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-th-border rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-th-text-primary">Published</span>
                <p className="text-xs text-th-text-tertiary">Visible on the public website</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox" checked={form.is_featured}
                onChange={(e) => updateField('is_featured', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-th-border rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-th-text-primary">Featured</span>
                <p className="text-xs text-th-text-tertiary">Highlighted on the homepage</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Button type="button" variant="ghost" onClick={() => navigate('/events/manage')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
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
    <div className="bg-surface-primary border border-th-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-th-text-primary">Photo Gallery</h2>
        <span className="text-sm text-th-text-tertiary">{images.length} photo{images.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-th-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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

      {/* Upload area */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="border-2 border-dashed border-th-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-surface-secondary transition-all"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
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

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="Or paste image URL..."
          className="flex-1 px-3 py-2 text-sm border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUrl}
          disabled={!urlInput.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

/** Convert ISO date string to datetime-local input value */
function toLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}
