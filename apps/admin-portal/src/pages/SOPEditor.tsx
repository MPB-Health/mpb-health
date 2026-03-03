import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  FileText,
  Tag,
  X,
  ExternalLink,
} from 'lucide-react';
import { sopAdminService, type AdminSOPDocument, type SOPCategory } from '@mpbhealth/admin-core';
import RichTextEditor from '../components/RichTextEditor';

const CONTENT_TYPES: { value: AdminSOPDocument['content_type']; label: string }[] = [
  { value: 'html', label: 'HTML / Rich Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'pdf', label: 'PDF Upload' },
  { value: 'presentation', label: 'Presentation (PPTX)' },
  { value: 'external_link', label: 'External Link' },
];

export default function SOPEditor() {
  const { sopId } = useParams<{ sopId: string }>();
  const navigate = useNavigate();
  const isNew = !sopId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content: '',
    content_type: 'html' as AdminSOPDocument['content_type'],
    file_url: '',
    image_url: '',
    version: '1.0',
    is_published: false,
    tags: [] as string[],
    metadata: null as Record<string, unknown> | null,
  });

  useEffect(() => {
    loadCategories();
    if (sopId) loadDocument();
  }, [sopId]);

  const loadCategories = async () => {
    try {
      const data = await sopAdminService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDocument = async () => {
    if (!sopId) return;
    try {
      const doc = await sopAdminService.getDocument(sopId);
      if (doc) {
        setFormData({
          title: doc.title,
          description: doc.description || '',
          category: doc.category,
          content: doc.content,
          content_type: doc.content_type,
          file_url: doc.file_url || '',
          image_url: doc.image_url || '',
          version: doc.version,
          is_published: doc.is_published,
          tags: doc.tags || [],
          metadata: doc.metadata,
        });
      } else {
        toast.error('SOP not found');
        navigate('/content/sops');
      }
    } catch (error) {
      toast.error('Failed to load SOP');
      navigate('/content/sops');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const id = sopId || 'new-' + Date.now();
      const url = await sopAdminService.uploadFile(file, id);
      setFormData((p) => ({ ...p, file_url: url }));
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((p) => ({ ...p, tags: [...p.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async (publish = false) => {
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
        content: formData.content.trim(),
        file_url: formData.file_url || null,
        image_url: formData.image_url || null,
        is_published: publish || formData.is_published,
      };

      if (isNew) {
        await sopAdminService.createDocument(payload);
        toast.success(payload.is_published ? 'SOP published!' : 'SOP saved as draft');
      } else {
        await sopAdminService.updateDocument(sopId, payload);
        toast.success('SOP updated!');
      }
      navigate('/content/sops');
    } catch (error) {
      console.error('Error saving SOP:', error);
      toast.error('Failed to save SOP');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sopId) return;
    setSaving(true);
    try {
      await sopAdminService.deleteDocument(sopId);
      toast.success('SOP deleted');
      navigate('/content/sops');
    } catch (error) {
      toast.error('Failed to delete SOP');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const needsFileUpload = formData.content_type === 'pdf' || formData.content_type === 'presentation';
  const needsLink = formData.content_type === 'external_link';
  const needsEditor = formData.content_type === 'html' || formData.content_type === 'markdown';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/content/sops')}
          className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to SOPs</span>
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              <span>Publish</span>
            </button>
          )}
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
              placeholder="SOP title..."
              className="w-full text-2xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary"
            />
          </div>

          {/* Description */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="block text-sm font-medium text-th-text-secondary mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description..."
              rows={2}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary resize-none"
            />
          </div>

          {/* Content */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium text-th-text-secondary">Content Type</label>
              <select
                aria-label="Content type"
                value={formData.content_type}
                onChange={(e) => setFormData((p) => ({ ...p, content_type: e.target.value as AdminSOPDocument['content_type'] }))}
                className="ml-auto px-3 py-1.5 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {needsLink && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-th-text-secondary flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  External URL
                </label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => setFormData((p) => ({ ...p, file_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            )}

            {needsFileUpload && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-th-border rounded-lg p-8 text-center cursor-pointer hover:border-th-accent-400 hover:bg-surface-secondary transition-colors"
                >
                  {uploadingFile ? (
                    <Loader2 className="w-8 h-8 mx-auto text-th-accent-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-th-text-tertiary mb-2" />
                      <p className="text-sm text-th-text-secondary">
                        Click to upload {formData.content_type === 'pdf' ? 'PDF' : 'PPTX/PDF'}
                      </p>
                    </>
                  )}
                </div>
                {formData.file_url && (
                  <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg">
                    <FileText className="w-4 h-4 text-th-accent-600 flex-shrink-0" />
                    <a
                      href={formData.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-th-accent-600 hover:underline truncate flex-1"
                    >
                      {formData.file_url.split('/').pop()}
                    </a>
                    <button
                      onClick={() => setFormData((p) => ({ ...p, file_url: '' }))}
                      className="p-1 text-th-text-tertiary hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={formData.content_type === 'pdf' ? '.pdf' : '.pdf,.pptx,.ppt'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  aria-label="File URL"
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => setFormData((p) => ({ ...p, file_url: e.target.value }))}
                  placeholder="Or paste direct URL..."
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            )}

            {needsEditor && (
              formData.content_type === 'html' ? (
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData((p) => ({ ...p, content: html }))}
                  placeholder="Write SOP content..."
                  minHeight="400px"
                />
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Write Markdown content..."
                  className="w-full px-4 py-3 bg-surface-primary border border-th-border rounded-xl font-mono text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 resize-y"
                  style={{ minHeight: '400px' }}
                />
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="font-semibold text-th-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Publish Settings
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                formData.is_published
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {formData.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Visible to Advisors</span>
              <button
                onClick={() => setFormData((p) => ({ ...p, is_published: !p.is_published }))}
                className={`p-2 rounded-lg transition-colors ${
                  formData.is_published
                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'text-th-text-tertiary hover:bg-surface-tertiary'
                }`}
              >
                {formData.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <div>
              <label className="block text-sm text-th-text-secondary mb-1">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData((p) => ({ ...p, version: e.target.value }))}
                placeholder="1.0"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h3 className="font-semibold text-th-text-primary mb-3">Category</h3>
            {categories.length > 0 ? (
              <select
                aria-label="Category"
                value={formData.category}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                placeholder="Category name"
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            )}
          </div>

          {/* Tags */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h3 className="font-semibold text-th-text-primary mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 bg-surface-tertiary text-th-text-secondary rounded-full text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">Delete SOP</h3>
            <p className="text-th-text-secondary mb-6">
              Are you sure? This cannot be undone.
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
