import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  X,
  Upload,
  Search,
  Filter,
  Tag,
  Eye,
  Globe,
  Lock,
} from 'lucide-react';
import {
  resourcesService,
  type AdminResource,
  type ResourceCategory,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const CATEGORIES: { value: ResourceCategory; label: string; icon: string }[] = [
  { value: 'document', label: 'Document', icon: '📄' },
  { value: 'template', label: 'Template', icon: '📋' },
  { value: 'guide', label: 'Guide', icon: '📖' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'link', label: 'External Link', icon: '🔗' },
];

interface FormData {
  category: ResourceCategory;
  name: string;
  description: string;
  external_url: string;
  is_public: boolean;
  tags: string[];
}

const DEFAULT_FORM: FormData = {
  category: 'document',
  name: '',
  description: '',
  external_url: '',
  is_public: false,
  tags: [],
};

export default function AdminResources() {
  const { user } = useAdmin();
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<{ category?: ResourceCategory; search?: string; tags?: string[] }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [newTag, setNewTag] = useState('');

  const loadData = async () => {
    if (!user?.org_id) return;
    try {
      const [resourcesData, tagsData] = await Promise.all([
        resourcesService.list(user.org_id, filters),
        resourcesService.getAllTags(user.org_id),
      ]);
      setResources(resourcesData);
      setAllTags(tagsData);
    } catch (err) {
      console.error('Failed to load resources:', err);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.org_id) loadData();
  }, [user?.org_id, filters]);

  const openModal = (resource?: AdminResource) => {
    if (resource) {
      setEditing(resource);
      setForm({
        category: resource.category,
        name: resource.name,
        description: resource.description || '',
        external_url: resource.external_url || '',
        is_public: resource.is_public,
        tags: resource.tags,
      });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(DEFAULT_FORM);
    setNewTag('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.org_id) return;

    setSaving(true);
    try {
      if (editing) {
        await resourcesService.update(editing.id, {
          category: form.category,
          name: form.name,
          description: form.description || undefined,
          external_url: form.external_url || undefined,
          is_public: form.is_public,
          tags: form.tags,
        }, user.id);
        toast.success('Resource updated');
      } else {
        await resourcesService.create({
          category: form.category,
          name: form.name,
          description: form.description || undefined,
          external_url: form.external_url || undefined,
          is_public: form.is_public,
          tags: form.tags,
        }, user.org_id, user.id);
        toast.success('Resource created');
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error('Failed to save resource:', err);
      toast.error('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this resource?')) return;

    try {
      await resourcesService.delete(id, user.id);
      toast.success('Resource deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const handleDownload = async (resource: AdminResource) => {
    try {
      const url = await resourcesService.getDownloadUrl(resource.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Download not available');
      }
    } catch (err) {
      toast.error('Failed to get download URL');
    }
  };

  const handleToggleActive = async (resource: AdminResource) => {
    if (!user?.org_id) return;

    try {
      await resourcesService.update(resource.id, { is_active: !resource.is_active }, user.id);
      toast.success(resource.is_active ? 'Resource deactivated' : 'Resource activated');
      loadData();
    } catch (err) {
      toast.error('Failed to update resource');
    }
  };

  const addTag = () => {
    if (newTag && !form.tags.includes(newTag)) {
      setForm({ ...form, tags: [...form.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const getCategoryIcon = (category: ResourceCategory) => {
    return CATEGORIES.find((c) => c.value === category)?.icon || '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stats = {
    total: resources.length,
    public: resources.filter((r) => r.is_public).length,
    downloads: resources.reduce((sum, r) => sum + r.download_count, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Resources</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage documents, templates, and links</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Resources</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Public</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.public}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Downloads</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.downloads}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Categories</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">
            {new Set(resources.map((r) => r.category)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-600 bg-th-accent-50 dark:bg-th-accent-900/20'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Category</label>
                <select
                  aria-label="Filter by category"
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: (e.target.value as ResourceCategory) || undefined })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
                >
                  <option value="">All</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {allTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newTags = filters.tags?.includes(tag)
                          ? filters.tags.filter((t) => t !== tag)
                          : [...(filters.tags || []), tag];
                        setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.tags?.includes(tag)
                          ? 'bg-th-accent-600 text-white'
                          : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resources List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No resources found</p>
            <p className="text-sm text-th-text-tertiary mt-1">Add a resource to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {resources.map((resource) => (
              <div key={resource.id} className="p-4 hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center text-2xl">
                      {getCategoryIcon(resource.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-th-text-primary">{resource.name}</h3>
                        {resource.is_public ? (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                        {!resource.is_active && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-th-text-tertiary mt-1">{resource.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-th-text-tertiary">
                        <span className="capitalize">{resource.category}</span>
                        {resource.file_size_bytes && (
                          <span>{formatFileSize(resource.file_size_bytes)}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.download_count} downloads
                        </span>
                      </div>
                      {resource.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Tag className="w-3 h-3 text-th-text-tertiary" />
                          {resource.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-surface-secondary text-th-text-secondary px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(resource.file_path || resource.external_url) && (
                      <button
                        onClick={() => handleDownload(resource)}
                        className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                        title={resource.external_url ? 'Open Link' : 'Download'}
                      >
                        {resource.external_url ? (
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Download className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(resource)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title={resource.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Eye className={`w-4 h-4 ${resource.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => openModal(resource)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-th-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editing ? 'Edit Resource' : 'Add Resource'}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="resource-category" className="block text-sm font-medium text-th-text-secondary mb-1">Category</label>
                <select
                  id="resource-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ResourceCategory })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="resource-name" className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  id="resource-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="resource-description" className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea
                  id="resource-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary resize-none"
                />
              </div>

              {form.category === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">External URL</label>
                  <input
                    type="url"
                    value={form.external_url}
                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-th-accent-100 text-th-accent-700 rounded text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="hover:text-th-accent-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                  className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <label htmlFor="is_public" className="text-sm text-th-text-secondary">
                  Make this resource publicly accessible
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
