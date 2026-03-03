import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Loader2,
  Filter,
  X,
  Save,
} from 'lucide-react';
import {
  quickLinksAdminService,
  type QuickLink,
  type QuickLinkCategory,
  type QuickLinkCreateInput,
} from '@mpbhealth/admin-core';

const CATEGORIES: { value: QuickLinkCategory; label: string }[] = [
  { value: 'resources', label: 'Resources' },
  { value: 'advisor_forms', label: 'Advisor Forms' },
  { value: 'employer_forms', label: 'Employer Forms' },
  { value: 'member_forms', label: 'Member Forms' },
  { value: 'bulletins', label: 'Bulletins' },
  { value: 'dashboard_actions', label: 'Dashboard Actions' },
];

const EMPTY_FORM: QuickLinkCreateInput = {
  title: '',
  url: '',
  description: '',
  category: 'resources',
  icon: '',
  order_index: 0,
  is_active: true,
  open_in_new_tab: true,
};

export default function QuickLinksList() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<QuickLinkCategory | ''>('');
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalForm, setModalForm] = useState<QuickLinkCreateInput>(EMPTY_FORM);
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksData, statsData] = await Promise.all([
        quickLinksAdminService.getLinks(filterCategory || undefined),
        quickLinksAdminService.getStats(),
      ]);
      setLinks(linksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading quick links:', error);
      toast.error('Failed to load quick links');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (link: QuickLink) => {
    try {
      await quickLinksAdminService.toggleActive(link.id);
      toast.success(link.is_active ? 'Link deactivated' : 'Link activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quick link?')) return;
    setDeleting(id);
    try {
      await quickLinksAdminService.deleteLink(id);
      toast.success('Link deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete link');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (link: QuickLink) => {
    setEditingLink(link);
    setModalForm({
      title: link.title,
      url: link.url,
      description: link.description || '',
      category: link.category as QuickLinkCategory,
      icon: link.icon || '',
      order_index: link.order_index,
      is_active: link.is_active,
      open_in_new_tab: link.open_in_new_tab ?? true,
    });
    setShowAddModal(true);
  };

  const openCreate = () => {
    setEditingLink(null);
    setModalForm({ ...EMPTY_FORM, order_index: links.length });
    setShowAddModal(true);
  };

  const handleModalSave = async () => {
    if (!modalForm.title.trim() || !modalForm.url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setModalSaving(true);
    try {
      if (editingLink) {
        await quickLinksAdminService.updateLink(editingLink.id, modalForm);
        toast.success('Link updated!');
      } else {
        await quickLinksAdminService.createLink(modalForm);
        toast.success('Link created!');
      }
      setShowAddModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save link');
    } finally {
      setModalSaving(false);
    }
  };

  const filtered = links.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !filterCategory || l.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Quick Links</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Manage advisor portal quick access links</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Link</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Links', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: stats.active, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search links..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as QuickLinkCategory | '')}
            className="pl-10 pr-8 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No links found</h3>
            <p className="text-th-text-tertiary mb-6">
              {searchQuery || filterCategory ? 'Try adjusting your filters' : 'Create your first quick link'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {filtered.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-medium text-th-text-primary truncate">{link.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      link.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                      {CATEGORIES.find((c) => c.value === link.category)?.label || link.category}
                    </span>
                  </div>
                  <p className="text-xs text-th-text-tertiary truncate">{link.url}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleActive(link)}
                    title={link.is_active ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    {link.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(link)}
                    title="Edit"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    disabled={deleting === link.id}
                    title="Delete"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === link.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingLink ? 'Edit Quick Link' : 'New Quick Link'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Title *</label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Link title"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">URL *</label>
                <input
                  type="text"
                  value={modalForm.url}
                  onChange={(e) => setModalForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://... or /internal/path"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <input
                  type="text"
                  value={modalForm.description}
                  onChange={(e) => setModalForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Category</label>
                  <select
                    aria-label="Category"
                    value={modalForm.category}
                    onChange={(e) => setModalForm((p) => ({ ...p, category: e.target.value as QuickLinkCategory }))}
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Icon (lucide name)</label>
                  <input
                    type="text"
                    value={modalForm.icon}
                    onChange={(e) => setModalForm((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="e.g. FileText"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.is_active}
                    onChange={(e) => setModalForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.open_in_new_tab}
                    onChange={(e) => setModalForm((p) => ({ ...p, open_in_new_tab: e.target.checked }))}
                    className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">Open in new tab</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={modalSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {modalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingLink ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
