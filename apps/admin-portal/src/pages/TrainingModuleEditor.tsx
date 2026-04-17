import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Upload,
  X,
  BookOpen,
  Clock,
  Link as LinkIcon,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { trainingAdminService, type AdminTrainingModule } from '@mpbhealth/admin-core';

const CONTENT_TYPES: { value: AdminTrainingModule['content_type']; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'interactive', label: 'Interactive' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'external_link', label: 'External Link' },
];

export default function TrainingModuleEditor() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const isNew = !moduleId;
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content_type: 'video' as AdminTrainingModule['content_type'],
    content_url: '',
    content_html: '',
    thumbnail_url: '',
    duration_minutes: 0,
    order_index: 0,
    is_required: false,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
    if (moduleId) loadModule();
  }, [moduleId]);

  const loadCategories = async () => {
    try {
      const data = await trainingAdminService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadModule = async () => {
    if (!moduleId) return;
    try {
      const module = await trainingAdminService.getModule(moduleId);
      if (module) {
        setFormData({
          title: module.title,
          description: module.description || '',
          category: module.category,
          content_type: module.content_type,
          content_url: module.content_url || '',
          content_html: module.content_html || '',
          thumbnail_url: module.thumbnail_url || '',
          duration_minutes: module.duration_minutes,
          order_index: module.order_index,
          is_required: module.is_required,
          is_active: module.is_active,
        });
      } else {
        toast.error('Module not found');
        navigate('/content/training');
      }
    } catch (error) {
      toast.error('Failed to load module');
      navigate('/content/training');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploadingThumb(true);
    try {
      const id = moduleId || 'new-' + Date.now();
      const url = await trainingAdminService.uploadThumbnail(file, id);
      setFormData((prev) => ({ ...prev, thumbnail_url: url }));
      toast.success('Thumbnail uploaded!');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: (newCategory.trim() || formData.category).trim(),
        content_url: formData.content_url.trim() || null,
        content_html: formData.content_html.trim() || null,
        thumbnail_url: formData.thumbnail_url || null,
      };

      if (isNew) {
        await trainingAdminService.createModule(payload);
        toast.success('Module created!');
      } else {
        await trainingAdminService.updateModule(moduleId, payload);
        toast.success('Module updated!');
      }
      navigate('/content/training');
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleId) return;
    setSaving(true);
    try {
      await trainingAdminService.deleteModule(moduleId);
      toast.success('Module deleted');
      navigate('/content/training');
    } catch (error) {
      toast.error('Failed to delete module');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  const effectiveCategory = newCategory.trim() || formData.category;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/content/training')}
          className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Training</span>
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
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isNew ? 'Create Module' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="Module title..."
              className="w-full text-2xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary"
            />
          </div>

          {/* Description */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="block text-sm font-medium text-th-text-secondary mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this module..."
              rows={3}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary resize-none"
            />
          </div>

          {/* Content */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="font-semibold text-th-text-primary flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Content
            </h3>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Content Type</label>
              <select
                aria-label="Content type"
                value={formData.content_type}
                onChange={(e) => setFormData((p) => ({ ...p, content_type: e.target.value as AdminTrainingModule['content_type'] }))}
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Content URL</label>
              <input
                type="url"
                value={formData.content_url}
                onChange={(e) => setFormData((p) => ({ ...p, content_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Notes / Additional Content</label>
              <textarea
                value={formData.content_html}
                onChange={(e) => setFormData((p) => ({ ...p, content_html: e.target.value }))}
                placeholder="Optional notes or embedded HTML..."
                rows={4}
                className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary resize-y font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="font-semibold text-th-text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Settings
            </h3>

            {/* Active */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Active</span>
              <button
                onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
                className={`p-2 rounded-lg transition-colors ${
                  formData.is_active
                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'text-th-text-tertiary hover:bg-surface-tertiary'
                }`}
              >
                {formData.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>

            {/* Required */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Required</span>
              <button
                onClick={() => setFormData((p) => ({ ...p, is_required: !p.is_required }))}
                className={`p-2 rounded-lg transition-colors ${
                  formData.is_required
                    ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'text-th-text-tertiary hover:bg-surface-tertiary'
                }`}
              >
                <Star className={`w-5 h-5 ${formData.is_required ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Order Index</label>
              <input
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) => setFormData((p) => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-3">
            <h3 className="font-semibold text-th-text-primary">Category</h3>
            {categories.length > 0 && (
              <select
                aria-label="Select category"
                value={formData.category}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, category: e.target.value }));
                  setNewCategory('');
                }}
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <div>
              <label className="block text-xs text-th-text-tertiary mb-1">
                {categories.length > 0 ? 'Or create new:' : 'Category name:'}
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name..."
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
              {newCategory.trim() && (
                <p className="text-xs text-th-accent-600 mt-1">Will use: &quot;{newCategory.trim()}&quot;</p>
              )}
              {!newCategory.trim() && effectiveCategory && (
                <p className="text-xs text-th-text-tertiary mt-1">Current: &quot;{effectiveCategory}&quot;</p>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h3 className="font-semibold text-th-text-primary mb-4">Thumbnail</h3>
            {formData.thumbnail_url ? (
              <div className="relative group">
                <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-36 object-cover rounded-lg" />
                <button
                  onClick={() => setFormData((p) => ({ ...p, thumbnail_url: '' }))}
                  aria-label="Remove thumbnail"
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="border-2 border-dashed border-th-border rounded-lg p-6 text-center cursor-pointer hover:border-th-accent-400 hover:bg-surface-secondary transition-colors"
              >
                {uploadingThumb ? (
                  <Loader2 className="w-7 h-7 mx-auto text-th-accent-600 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-7 h-7 mx-auto text-th-text-tertiary mb-2" />
                    <p className="text-sm text-th-text-secondary">Click to upload</p>
                  </>
                )}
              </div>
            )}
            <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
            <input
              aria-label="Thumbnail URL"
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData((p) => ({ ...p, thumbnail_url: e.target.value }))}
              placeholder="Or paste URL..."
              className="mt-3 w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">Delete Module</h3>
            <p className="text-th-text-secondary mb-6">
              Are you sure? This cannot be undone and may affect advisors in progress.
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
