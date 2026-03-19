import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  emailTemplateAdminService,
  type EmailTemplate,
  type EmailTemplateCreateInput,
  type EmailTemplateStats,
} from '@mpbhealth/admin-core';

const EMPTY_FORM: EmailTemplateCreateInput = {
  name: '',
  subject: '',
  body: '',
  description: '',
  category: '',
  is_active: true,
};

export default function CRMTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<EmailTemplateStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmailTemplateCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const timeout = setTimeout(() => setLoading(false), 8000);
    try {
      const [data, statsData, cats] = await Promise.all([
        emailTemplateAdminService.getAll({
          search: search || undefined,
          category: categoryFilter || undefined,
        }),
        emailTemplateAdminService.getStats(),
        emailTemplateAdminService.getCategories(),
      ]);
      setTemplates(data);
      setStats(statsData);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load email templates:', err);
      setError('Failed to load email templates');
      toast.error('Failed to load email templates');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadTemplates();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTemplates]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(template: EmailTemplate) {
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description || '',
      category: template.category || '',
      is_active: template.is_active,
    });
    setEditingId(template.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Name, subject, and body are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category: form.category || null,
        description: form.description || null,
      };
      if (editingId) {
        await emailTemplateAdminService.update(editingId, payload);
        toast.success('Template updated');
      } else {
        await emailTemplateAdminService.create(
          payload as EmailTemplateCreateInput,
        );
        toast.success('Template created');
      }
      setShowForm(false);
      loadTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this email template? This cannot be undone.'))
      return;
    try {
      await emailTemplateAdminService.delete(id);
      toast.success('Template deleted');
      loadTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  }

  async function handleToggleActive(id: string) {
    try {
      await emailTemplateAdminService.toggleActive(id);
      loadTemplates();
    } catch {
      toast.error('Failed to update template');
    }
  }

  if (error && !loading && templates.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            Email Templates
          </h1>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <p className="text-th-text-tertiary mb-4">{error}</p>
          <button
            type="button"
            onClick={loadTemplates}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            Email Templates
          </h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            {stats
              ? `${stats.active} active / ${stats.total} total / ${stats.categories} categories`
              : 'Loading...'}
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </button>
      </div>

      {/* Stats chips */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 bg-surface-primary border border-th-border rounded-lg">
            <span className="text-xs text-th-text-tertiary">Total</span>
            <p className="text-lg font-semibold text-th-text-primary">
              {stats.total}
            </p>
          </div>
          <div className="px-4 py-2 bg-surface-primary border border-th-border rounded-lg">
            <span className="text-xs text-th-text-tertiary">Active</span>
            <p className="text-lg font-semibold text-green-600">
              {stats.active}
            </p>
          </div>
          <div className="px-4 py-2 bg-surface-primary border border-th-border rounded-lg">
            <span className="text-xs text-th-text-tertiary">Categories</span>
            <p className="text-lg font-semibold text-blue-600">
              {stats.categories}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search templates by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-2xl border border-th-border w-full max-w-xl shadow-xl">
            <div className="px-6 py-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingId ? 'Edit Template' : 'New Template'}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Template name"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="Email subject line"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Body
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={6}
                  placeholder="Email body content..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category || ''}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value || '' })
                    }
                    placeholder="e.g. Onboarding"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value || '' })
                  }
                  placeholder="Brief description of this template"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <span className="text-sm text-th-text-secondary">Active</span>
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
                className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-th-accent-600" />
          </div>
        ) : templates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-surface-secondary">
                  <th className="text-left px-5 py-3 font-medium text-th-text-secondary">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-th-text-secondary">
                    Subject
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-th-text-secondary">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-th-text-secondary">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-th-text-secondary">
                    Performance
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-th-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {templates.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-tertiary transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-th-text-primary truncate max-w-[200px]">
                        {t.name}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-th-text-secondary truncate max-w-[200px]">
                        {t.subject}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      {t.category ? (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {t.category}
                        </span>
                      ) : (
                        <span className="text-th-text-tertiary">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {t.is_active ? (
                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-th-text-tertiary">
                        <span>{t.total_sent} sent</span>
                        {t.open_rate !== null && (
                          <span className="ml-2">
                            {(t.open_rate * 100).toFixed(1)}% open
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(t.id)}
                          className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                          aria-label={t.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {t.is_active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-th-text-tertiary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No email templates found</p>
            <button
              type="button"
              onClick={openNew}
              className="mt-4 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
