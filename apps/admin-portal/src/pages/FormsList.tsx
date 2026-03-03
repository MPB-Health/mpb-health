import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Filter,
  X,
  Save,
  Menu,
} from 'lucide-react';
import {
  formsAdminService,
  type AdminForm,
  type FormCreateInput,
} from '@mpbhealth/admin-core';

const EMPTY_FORM: FormCreateInput = {
  label: '',
  slug: '',
  category: '',
  cognito_embed: '',
  is_active: true,
  show_in_menu: false,
  sort_order: 0,
  menu_section: '',
  menu_order: null,
};

export default function FormsList() {
  const [forms, setForms] = useState<AdminForm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, inMenu: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<AdminForm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState<FormCreateInput>(EMPTY_FORM);
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [formsData, catsData, statsData] = await Promise.all([
        formsAdminService.getForms(),
        formsAdminService.getCategories(),
        formsAdminService.getStats(),
      ]);
      setForms(formsData);
      setCategories(catsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (form: AdminForm) => {
    try {
      await formsAdminService.toggleActive(form.id);
      toast.success(form.is_active ? 'Form deactivated' : 'Form activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update form');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form?')) return;
    setDeleting(id);
    try {
      await formsAdminService.deleteForm(id);
      toast.success('Form deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete form');
    } finally {
      setDeleting(null);
    }
  };

  const generateSlug = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openEdit = (form: AdminForm) => {
    setEditingForm(form);
    setModalForm({
      label: form.label,
      slug: form.slug || '',
      category: form.category || '',
      cognito_embed: form.cognito_embed || '',
      is_active: form.is_active,
      show_in_menu: form.show_in_menu,
      sort_order: form.sort_order,
      menu_section: form.menu_section || '',
      menu_order: form.menu_order,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingForm(null);
    setModalForm({ ...EMPTY_FORM, sort_order: forms.length });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!modalForm.label.trim()) {
      toast.error('Label is required');
      return;
    }
    setModalSaving(true);
    try {
      const payload = {
        ...modalForm,
        slug: modalForm.slug || generateSlug(modalForm.label),
        category: modalForm.category || null,
        cognito_embed: modalForm.cognito_embed || null,
        menu_section: modalForm.menu_section || null,
      };

      if (editingForm) {
        await formsAdminService.updateForm(editingForm.id, payload);
        toast.success('Form updated!');
      } else {
        await formsAdminService.createForm(payload as FormCreateInput);
        toast.success('Form created!');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save form');
    } finally {
      setModalSaving(false);
    }
  };

  const filtered = forms.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !filterCategory || f.category === filterCategory;
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
          <h1 className="text-2xl font-bold text-th-text-primary">Forms</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Manage Cognito Forms displayed in the advisor portal</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Form</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Forms', value: stats.total, icon: FileText, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: stats.active, icon: Eye, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'In Menu', value: stats.inMenu, icon: Menu, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
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
            placeholder="Search forms..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
            <select
              aria-label="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No forms found</h3>
            <p className="text-th-text-tertiary">
              {searchQuery || filterCategory ? 'Try adjusting your filters' : 'Add your first Cognito form'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {filtered.map((form) => (
              <div
                key={form.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-medium text-th-text-primary truncate">{form.label}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      form.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {form.show_in_menu && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        In Menu
                      </span>
                    )}
                    {form.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                        {form.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-th-text-tertiary truncate">{form.slug}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleActive(form)}
                    title={form.is_active ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    {form.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(form)}
                    title="Edit"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    disabled={deleting === form.id}
                    title="Delete"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === form.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-th-border sticky top-0 bg-surface-primary">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingForm ? 'Edit Form' : 'New Form'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Label *</label>
                <input
                  type="text"
                  value={modalForm.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setModalForm((p) => ({
                      ...p,
                      label,
                      slug: p.slug || generateSlug(label),
                    }));
                  }}
                  placeholder="Form display name"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Slug</label>
                <input
                  type="text"
                  value={modalForm.slug ?? ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="auto-generated"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Category</label>
                <input
                  type="text"
                  value={modalForm.category ?? ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Enrollment, HR"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Cognito Embed Code</label>
                <textarea
                  value={modalForm.cognito_embed ?? ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, cognito_embed: e.target.value }))}
                  placeholder="<script ...></script>"
                  rows={4}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 font-mono text-sm resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={modalForm.sort_order}
                    onChange={(e) => setModalForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Menu Section</label>
                  <input
                    type="text"
                    value={modalForm.menu_section ?? ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, menu_section: e.target.value }))}
                    placeholder="e.g. Employer"
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
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
                    checked={modalForm.show_in_menu}
                    onChange={(e) => setModalForm((p) => ({ ...p, show_in_menu: e.target.checked }))}
                    className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">Show in Menu</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
              <button
                onClick={() => setShowModal(false)}
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
                <span>{editingForm ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
