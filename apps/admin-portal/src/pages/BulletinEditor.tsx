import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Globe,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Calendar,
  Tag,
  FileText,
  Trash2,
  Code,
  Type,
} from 'lucide-react';
import {
  bulletinService,
  type AdminBulletin,
  type BulletinCategory,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';
import RichTextEditor from '../components/RichTextEditor';

export default function BulletinEditor() {
  const { bulletinId } = useParams<{ bulletinId: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();
  const isNew = !bulletinId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [showModeWarning, setShowModeWarning] = useState(false);
  const [originalPublishedDate, setOriginalPublishedDate] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '' as string,
    featured_image_url: '',
    is_published: false,
    is_featured: false,
    published_date: '',
  });

  useEffect(() => {
    loadCategories();
    if (bulletinId) {
      loadBulletin();
    }
  }, [bulletinId]);

  const loadCategories = async () => {
    try {
      const data = await bulletinService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBulletin = async () => {
    if (!bulletinId) return;
    try {
      const bulletin = await bulletinService.getBulletin(bulletinId);
      if (bulletin) {
        setFormData({
          title: bulletin.title,
          slug: bulletin.slug,
          excerpt: bulletin.excerpt || '',
          content: bulletin.content,
          category_id: bulletin.category_id || '',
          featured_image_url: bulletin.featured_image_url || '',
          is_published: bulletin.is_published,
          is_featured: bulletin.is_featured || false,
          published_date: bulletin.published_date || '',
        });
        // Preserve the original published date so saving doesn't change the position
        if (bulletin.published_date) {
          setOriginalPublishedDate(bulletin.published_date);
        }
        // Auto-detect inline styles and default to HTML mode to preserve them
        if (bulletin.content && /style\s*=\s*"/.test(bulletin.content)) {
          setEditorMode('html');
        }
      } else {
        toast.error('Bulletin not found');
        navigate('/content/bulletins');
      }
    } catch (error) {
      toast.error('Failed to load bulletin');
      navigate('/content/bulletins');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const slug = formData.slug || generateSlug(formData.title || 'bulletin');
      const url = await bulletinService.uploadImage(file, slug);
      setFormData((prev) => ({ ...prev, featured_image_url: url }));
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (publish = false) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.content.trim() || formData.content === '<p></p>') {
      toast.error('Content is required');
      return;
    }

    setSaving(true);
    try {
      const slug = (formData.slug || generateSlug(formData.title)).trim();
      const isPublished = publish || formData.is_published;

      const payload = {
        title: formData.title.trim(),
        slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category_id: formData.category_id || null,
        featured_image_url: formData.featured_image_url || null,
        is_published: isPublished,
        is_featured: formData.is_featured,
        published_date: isPublished
          ? formData.published_date || originalPublishedDate || new Date().toISOString()
          : null,
      };

      if (isNew) {
        await bulletinService.createBulletin(payload);
        toast.success(isPublished ? 'Bulletin published!' : 'Bulletin saved as draft');
      } else {
        await bulletinService.updateBulletin(bulletinId, payload);
        toast.success('Bulletin updated!');
      }

      navigate('/content/bulletins');
    } catch (error) {
      console.error('Error saving bulletin:', error);
      toast.error('Failed to save bulletin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bulletinId) return;
    setSaving(true);
    try {
      await bulletinService.deleteBulletin(bulletinId);
      toast.success('Bulletin deleted');
      navigate('/content/bulletins');
    } catch (error) {
      console.error('Error deleting bulletin:', error);
      toast.error('Failed to delete bulletin');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/content/bulletins')}
          className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Bulletins</span>
        </button>
        <div className="flex items-center space-x-3">
          {!isNew && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{formData.is_published ? 'Update' : 'Save Draft'}</span>
          </button>
          {!formData.is_published && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              <span>Publish</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Bulletin title..."
              className="w-full text-3xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary"
            />
            <div className="mt-3 flex items-center">
              <span className="text-sm text-th-text-tertiary">/bulletins/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated-slug"
                className="flex-1 px-2 py-1 text-sm bg-transparent border-0 border-b border-th-border focus:outline-none focus:border-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="block text-sm font-medium text-th-text-secondary mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary that appears in the grid cards..."
              rows={3}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary resize-none"
            />
          </div>

          {/* Content Editor */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-th-text-secondary">
                Content
              </label>
              <div className="flex items-center gap-1 bg-surface-tertiary rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    if (editorMode === 'html') {
                      setShowModeWarning(true);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    editorMode === 'visual'
                      ? 'bg-surface-primary text-th-text-primary shadow-sm'
                      : 'text-th-text-tertiary hover:text-th-text-secondary'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('html')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    editorMode === 'html'
                      ? 'bg-surface-primary text-th-text-primary shadow-sm'
                      : 'text-th-text-tertiary hover:text-th-text-secondary'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  HTML
                </button>
              </div>
            </div>

            {editorMode === 'html' && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                HTML mode preserves inline styles. Switching to Visual mode will strip inline styles.
              </p>
            )}

            {editorMode === 'visual' ? (
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Write your bulletin content..."
                minHeight="400px"
              />
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write or paste HTML content..."
                className="w-full px-4 py-3 bg-gray-900 text-green-400 font-mono text-sm border border-th-border rounded-xl focus:outline-none focus:ring-2 focus:ring-th-accent-500 resize-y"
                style={{ minHeight: '400px' }}
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h3 className="font-semibold text-th-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Publish Settings
            </h3>
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-secondary">Status</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    formData.is_published
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {formData.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-th-text-secondary">Featured in Slider</span>
                <button
                  onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                  className={`p-2 rounded-lg transition-colors ${
                    formData.is_featured
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-th-text-tertiary hover:bg-surface-tertiary'
                  }`}
                >
                  {formData.is_featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Published Date */}
              <div>
                <label className="block text-sm text-th-text-secondary mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.published_date ? format(new Date(formData.published_date), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData({ ...formData, published_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h3 className="font-semibold text-th-text-primary mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </h3>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Featured Image */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h3 className="font-semibold text-th-text-primary mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Featured Image
            </h3>
            {formData.featured_image_url ? (
              <div className="relative group">
                <img
                  src={formData.featured_image_url}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-th-border rounded-lg p-8 text-center cursor-pointer hover:border-th-accent-400 hover:bg-surface-secondary transition-colors"
              >
                {uploadingImage ? (
                  <Loader2 className="w-8 h-8 mx-auto text-th-accent-600 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-th-text-tertiary mb-2" />
                    <p className="text-sm text-th-text-secondary">Click to upload</p>
                    <p className="text-xs text-th-text-tertiary mt-1">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* Manual URL input */}
            <div className="mt-3">
              <input
                type="url"
                value={formData.featured_image_url}
                onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                placeholder="Or paste image URL..."
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switch Warning Modal */}
      {showModeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">Switch to Visual Editor?</h3>
            <p className="text-th-text-secondary mb-2">
              The Visual Editor will <strong>strip all inline styles</strong> from your content. This means any custom formatting (colors, fonts, spacing, etc.) will be lost.
            </p>
            <p className="text-th-text-secondary mb-6">
              This cannot be undone. Only switch if you want to re-format the content from scratch.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModeWarning(false)}
                className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Stay in HTML
              </button>
              <button
                onClick={() => {
                  setEditorMode('visual');
                  setShowModeWarning(false);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors"
              >
                Switch Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">Delete Bulletin</h3>
            <p className="text-th-text-secondary mb-6">
              Are you sure you want to delete this bulletin? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
