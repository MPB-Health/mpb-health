import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Loader2,
  X,
  Save,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  handbookAdminService,
  type AdminHandbook,
  type HandbookCreateInput,
} from '@mpbhealth/admin-core';

const PLAN_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'family', label: 'Family' },
  { value: 'employer', label: 'Employer' },
  { value: 'hsa', label: 'HSA' },
  { value: 'general', label: 'General' },
] as const;

const PLAN_TYPE_COLORS: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  family: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  employer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hsa: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const EMPTY_FORM: HandbookCreateInput = {
  slug: '',
  name: '',
  description: '',
  pdf_path: '',
  flipbook_url: '',
  plan_type: 'general',
  color: '',
  icon: '',
  features: [],
  is_active: true,
  sort_order: 0,
};

export default function HandbookManager() {
  const [handbooks, setHandbooks] = useState<AdminHandbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [editingHandbook, setEditingHandbook] = useState<AdminHandbook | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<HandbookCreateInput>(EMPTY_FORM);
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [handbooksData, statsData] = await Promise.all([
        handbookAdminService.getAll(),
        handbookAdminService.getStats(),
      ]);
      setHandbooks(handbooksData);
      setStats({ total: statsData.total, active: statsData.active, inactive: statsData.total - statsData.active });
    } catch {
      toast.error('Failed to load handbooks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (handbook: AdminHandbook) => {
    try {
      await handbookAdminService.toggleActive(handbook.id);
      toast.success(handbook.is_active ? 'Handbook deactivated' : 'Handbook activated');
      loadData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleMove = async (handbook: AdminHandbook, direction: 'up' | 'down') => {
    const idx = handbooks.findIndex((h) => h.id === handbook.id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === handbooks.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = [...handbooks];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    try {
      await handbookAdminService.reorder(newOrder.map((h) => h.id));
      toast.success('Reordered');
      loadData();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this handbook? This action cannot be undone.')) return;
    try {
      await handbookAdminService.delete(id);
      toast.success('Deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (handbook: AdminHandbook) => {
    setEditingHandbook(handbook);
    setIsNew(false);
    setForm({
      slug: handbook.slug,
      name: handbook.name,
      description: handbook.description || '',
      pdf_path: handbook.pdf_path,
      flipbook_url: handbook.flipbook_url || '',
      plan_type: handbook.plan_type,
      color: handbook.color,
      icon: handbook.icon,
      features: handbook.features,
      is_active: handbook.is_active,
      sort_order: handbook.sort_order,
    });
    setFeaturesText((handbook.features || []).join('\n'));
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingHandbook(null);
    setIsNew(true);
    setForm({
      ...EMPTY_FORM,
      sort_order: handbooks.length,
    });
    setFeaturesText('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    if (!form.slug?.trim()) { toast.error('Slug is required'); return; }
    if (!form.pdf_path?.trim()) { toast.error('PDF path is required'); return; }
    setSaving(true);
    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      if (editingHandbook) {
        await handbookAdminService.update(editingHandbook.id, {
          slug: form.slug.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || null,
          pdf_path: form.pdf_path.trim(),
          flipbook_url: form.flipbook_url?.trim() || null,
          plan_type: form.plan_type,
          color: form.color?.trim() || '',
          icon: form.icon?.trim() || '',
          features,
          is_active: form.is_active,
          sort_order: form.sort_order,
        });
        toast.success('Updated!');
      } else {
        await handbookAdminService.create({
          slug: form.slug.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || null,
          pdf_path: form.pdf_path.trim(),
          flipbook_url: form.flipbook_url?.trim() || null,
          plan_type: form.plan_type,
          color: form.color?.trim() || '',
          icon: form.icon?.trim() || '',
          features,
          is_active: form.is_active,
          sort_order: form.sort_order,
        });
        toast.success('Created!');
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error('Failed to save');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Handbook Manager</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage plan handbooks, their details, and display order
          </p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Handbook</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Handbooks', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: stats.active, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}><BookOpen className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-800 dark:text-blue-300">
        Handbooks are displayed to members on the website. Toggle active status, reorder, and configure plan details.
      </div>

      {/* Handbook List */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        {handbooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No handbooks configured</h3>
            <p className="text-th-text-tertiary mb-6">Add handbooks to manage plan documentation</p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {handbooks.map((handbook, idx) => (
              <div key={handbook.id} className={`flex items-center gap-3 p-4 group ${!handbook.is_active ? 'opacity-50' : ''}`}>
                <GripVertical className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />

                {/* Order arrows */}
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => handleMove(handbook, 'up')} disabled={idx === 0} className="p-0.5 text-th-text-tertiary hover:text-th-text-primary disabled:opacity-30" title="Move up">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => handleMove(handbook, 'down')} disabled={idx === handbooks.length - 1} className="p-0.5 text-th-text-tertiary hover:text-th-text-primary disabled:opacity-30" title="Move down">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Color swatch */}
                {handbook.color && (
                  <div
                    className="w-6 h-6 rounded-full border border-th-border flex-shrink-0"
                    style={{ backgroundColor: handbook.color }}
                    title={`Color: ${handbook.color}`}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-th-text-primary text-sm">{handbook.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-mono">
                      {handbook.slug}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLAN_TYPE_COLORS[handbook.plan_type] || PLAN_TYPE_COLORS.general}`}>
                      {handbook.plan_type}
                    </span>
                    {handbook.icon && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 font-mono">
                        {handbook.icon}
                      </span>
                    )}
                    {!handbook.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {handbook.description && <p className="text-xs text-th-text-tertiary truncate">{handbook.description}</p>}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {handbook.pdf_path && (
                        <span className="flex items-center gap-0.5 text-xs text-th-text-tertiary" title={handbook.pdf_path}>
                          <FileText className="w-3 h-3" />
                          PDF
                        </span>
                      )}
                      {handbook.flipbook_url && (
                        <span className="flex items-center gap-0.5 text-xs text-th-text-tertiary" title={handbook.flipbook_url}>
                          <ExternalLink className="w-3 h-3" />
                          Flipbook
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button type="button" onClick={() => handleToggleActive(handbook)} title={handbook.is_active ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors">
                    {handbook.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => openEdit(handbook)} title="Edit" className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(handbook.id)} title="Delete" className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-th-border flex-shrink-0">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {isNew ? 'Add Handbook' : 'Edit Handbook'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Slug *</label>
                  <input type="text" value={form.slug || ''} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g. individual-plan" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                  <input type="text" value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Handbook display name" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea rows={2} value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of the handbook" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">PDF Path *</label>
                <input type="text" value={form.pdf_path || ''} onChange={(e) => setForm((p) => ({ ...p, pdf_path: e.target.value }))} placeholder="/handbooks/plan-handbook.pdf" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Flipbook URL</label>
                <input type="text" value={form.flipbook_url || ''} onChange={(e) => setForm((p) => ({ ...p, flipbook_url: e.target.value }))} placeholder="https://online.fliphtml5.com/..." className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Plan Type</label>
                <select value={form.plan_type || 'general'} onChange={(e) => setForm((p) => ({ ...p, plan_type: e.target.value as AdminHandbook['plan_type'] }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500">
                  {PLAN_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Color</label>
                  <input type="text" value={form.color || ''} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} placeholder="#3B82F6" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Icon</label>
                  <input type="text" value={form.icon || ''} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="Lucide icon name" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Features</label>
                <textarea rows={3} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="One feature per line" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                <p className="text-xs text-th-text-tertiary mt-1">One feature per line. Stored as a JSON array.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500" />
                    <span className="text-sm text-th-text-secondary">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border flex-shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isNew ? 'Create' : 'Update'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
