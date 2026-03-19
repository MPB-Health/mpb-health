import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Link2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  enrollmentLinksAdminService,
  type EnrollmentLink,
  type EnrollmentLinkCreateInput,
} from '@mpbhealth/admin-core';

const EMPTY_FORM: EnrollmentLinkCreateInput = {
  label: '',
  url: '',
  description: null,
  order_index: 0,
  is_active: true,
};

export default function EnrollmentLinks() {
  const [links, setLinks] = useState<EnrollmentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EnrollmentLinkCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLinks(await enrollmentLinksAdminService.getAll());
    } catch (err) {
      console.error('Failed to load enrollment links:', err);
      toast.error('Failed to load enrollment links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ ...EMPTY_FORM, order_index: links.length });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(link: EnrollmentLink) {
    setForm({
      label: link.label,
      url: link.url,
      description: link.description,
      order_index: link.order_index,
      is_active: link.is_active,
    });
    setEditingId(link.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.label.trim() || !form.url.trim()) {
      toast.error('Label and URL are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await enrollmentLinksAdminService.update(editingId, form);
        toast.success('Link updated');
      } else {
        await enrollmentLinksAdminService.create(form);
        toast.success('Link created');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to save link');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this enrollment link?')) return;
    try {
      await enrollmentLinksAdminService.delete(id);
      toast.success('Link deleted');
      load();
    } catch {
      toast.error('Failed to delete link');
    }
  }

  async function handleToggle(id: string) {
    try {
      await enrollmentLinksAdminService.toggleActive(id);
      load();
    } catch {
      toast.error('Failed to update link');
    }
  }

  // ── Drag-and-drop reorder (HTML5 drag API) ────────────────────────────────
  function handleDragStart(id: string) {
    setDragging(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setDragOver(id);
  }

  async function handleDrop(targetId: string) {
    if (!dragging || dragging === targetId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const from = links.findIndex((l) => l.id === dragging);
    const to = links.findIndex((l) => l.id === targetId);
    const reordered = [...links];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setLinks(reordered);
    setDragging(null);
    setDragOver(null);
    try {
      await enrollmentLinksAdminService.reorder(reordered.map((l) => l.id));
    } catch {
      toast.error('Failed to save new order');
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Enrollment Links</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Links shown to advisors on the enrollment page — drag to reorder
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-2xl border border-th-border w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingId ? 'Edit Link' : 'New Enrollment Link'}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Enroll Now"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                  placeholder="Short description..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <span className="text-sm text-th-text-secondary">Active (visible to advisors)</span>
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
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Link'}
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
        ) : links.length > 0 ? (
          <div className="divide-y divide-th-border-subtle">
            {links.map((link) => (
              <div
                key={link.id}
                draggable
                onDragStart={() => handleDragStart(link.id)}
                onDragOver={(e) => handleDragOver(e, link.id)}
                onDrop={() => handleDrop(link.id)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                  dragOver === link.id ? 'bg-th-accent-50 border-t-2 border-th-accent-400' : 'hover:bg-surface-tertiary'
                } ${!link.is_active ? 'opacity-60' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-th-text-tertiary cursor-grab shrink-0" />
                <Link2 className="w-4 h-4 text-th-text-tertiary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-th-text-primary">{link.label}</p>
                    {!link.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">Inactive</span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-th-accent-600 hover:underline flex items-center gap-1 mt-0.5 w-fit"
                  >
                    {link.url.length > 60 ? link.url.slice(0, 60) + '…' : link.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {link.description && (
                    <p className="text-xs text-th-text-tertiary mt-0.5">{link.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(link.id)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                    aria-label={link.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {link.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(link)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded transition-colors"
                    aria-label="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    className="p-1.5 text-th-text-tertiary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Link2 className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No enrollment links yet</p>
            <button
              type="button"
              onClick={openNew}
              className="mt-4 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
            >
              Add your first link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
