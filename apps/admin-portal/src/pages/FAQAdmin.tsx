import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  MoveUp,
  MoveDown,
  X,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  faqAdminService,
  type FAQItem,
  type FAQCreateInput,
  type FAQStats,
} from '@mpbhealth/admin-core';

const EMPTY_FORM: FAQCreateInput = {
  title: '',
  content_html: '',
  category: null,
  order_index: 0,
  is_active: true,
};

export default function FAQAdmin() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [stats, setStats] = useState<FAQStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statsData, cats] = await Promise.all([
        faqAdminService.getAll({
          search: search || undefined,
          category: categoryFilter || undefined,
        }),
        faqAdminService.getStats(),
        faqAdminService.getCategories(),
      ]);
      setItems(data);
      setStats(statsData);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      order_index: items.length + 1,
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: FAQItem) {
    setForm({
      title: item.title,
      content_html: item.content_html,
      category: item.category,
      order_index: item.order_index,
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content_html.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await faqAdminService.update(editingId, form);
        toast.success('FAQ updated');
      } else {
        await faqAdminService.create(form);
        toast.success('FAQ created');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this FAQ item? This cannot be undone.')) return;
    try {
      await faqAdminService.delete(id);
      toast.success('FAQ deleted');
      load();
    } catch {
      toast.error('Failed to delete FAQ');
    }
  }

  async function handleToggle(id: string) {
    try {
      await faqAdminService.togglePublished(id);
      load();
    } catch {
      toast.error('Failed to update FAQ');
    }
  }

  async function handleMoveUp(item: FAQItem) {
    const sameCategory = items.filter((i) => i.category === item.category);
    const idx = sameCategory.findIndex((i) => i.id === item.id);
    if (idx <= 0) return;
    const prev = sameCategory[idx - 1];
    try {
      await faqAdminService.swapOrder(item.id, item.order_index, prev.id, prev.order_index);
      load();
    } catch {
      toast.error('Failed to reorder');
    }
  }

  async function handleMoveDown(item: FAQItem) {
    const sameCategory = items.filter((i) => i.category === item.category);
    const idx = sameCategory.findIndex((i) => i.id === item.id);
    if (idx >= sameCategory.length - 1) return;
    const next = sameCategory[idx + 1];
    try {
      await faqAdminService.swapOrder(item.id, item.order_index, next.id, next.order_index);
      load();
    } catch {
      toast.error('Failed to reorder');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-th-accent-600" />
            FAQ Management
          </h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Manage FAQ items and &ldquo;Why Choose HealthSharing&rdquo; content.{' '}
            {stats
              ? `${stats.published} published · ${stats.total} total · ${stats.categories} categories`
              : 'Loading...'}
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search titles and content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-2xl border border-th-border w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-th-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingId ? 'Edit FAQ' : 'New FAQ'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Title / Question
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. How is health sharing different from insurance?"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Content (HTML)
                </label>
                <textarea
                  value={form.content_html}
                  onChange={(e) => setForm({ ...form, content_html: e.target.value })}
                  rows={8}
                  placeholder="Enter HTML content... Use <p>, <strong>, <ul>, <li> tags"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm resize-none font-mono"
                />
                <p className="mt-1 text-xs text-th-text-tertiary">
                  Supported tags: p, strong, em, ul, li, a. Plain text is also fine.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category || ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value || null })}
                    placeholder="e.g. why-choose-healthsharing"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  />
                  <p className="mt-1 text-xs text-th-text-tertiary">
                    Suggested: why-choose-healthsharing, general, coverage, pricing, mpb_health,
                    history
                  </p>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={(e) =>
                      setForm({ ...form, order_index: parseInt(e.target.value) || 0 })
                    }
                    aria-label="Display order"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <span className="text-sm text-th-text-secondary">
                  Active (visible on the website)
                </span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-th-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
          </div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-th-border-subtle">
            {items.map((item) => (
              <div
                key={item.id}
                className={`px-5 py-4 flex items-start gap-4 hover:bg-surface-tertiary transition-colors ${
                  !item.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-th-text-primary text-sm">{item.title}</p>
                    {!item.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
                        Inactive
                      </span>
                    )}
                    {item.category && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
                    {item.content_html.replace(/<[^>]*>/g, '')}
                  </p>
                  <p className="text-xs text-th-text-tertiary mt-1">
                    Order: {item.order_index}
                    {item.updated_at &&
                      ` · Updated: ${new Date(item.updated_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(item)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                    title="Move Up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(item)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                    title="Move Down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                    aria-label={item.is_active ? 'Deactivate' : 'Activate'}
                    title={item.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {item.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-th-text-tertiary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No FAQ items found</p>
            <button
              type="button"
              onClick={openNew}
              className="mt-4 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
            >
              Add your first FAQ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
