import { useState, useEffect, useCallback } from 'react';
import { Settings, Eye, EyeOff, GripVertical, Loader2, Pencil, Trash2, Plus, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  widgetAdminService,
  type DashboardWidget,
  type WidgetCreateInput,
} from '@mpbhealth/admin-core';

const GRID_OPTIONS = [
  { value: 'full', label: 'Full Width' },
  { value: 'left', label: 'Left Column' },
  { value: 'right', label: 'Right Column' },
];

export default function WidgetConfig() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [stats, setStats] = useState({ total: 0, visible: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [form, setForm] = useState<WidgetCreateInput & { config_json?: string }>({ widget_key: '', label: '' });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // 8s loading timeout
  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [widgetsData, statsData] = await Promise.all([
        widgetAdminService.getAll(),
        widgetAdminService.getStats(),
      ]);
      setWidgets(widgetsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load widgets:', err);
      toast.error('Failed to load widgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [widgetsData, statsData] = await Promise.all([
          widgetAdminService.getAll(),
          widgetAdminService.getStats(),
        ]);
        if (!cancelled) {
          setWidgets(widgetsData);
          setStats(statsData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load widgets:', err);
          toast.error('Failed to load widgets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    const from = widgets.findIndex((w) => w.id === dragging);
    const to = widgets.findIndex((w) => w.id === targetId);
    const reordered = [...widgets];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setWidgets(reordered);
    setDragging(null);
    setDragOver(null);
    try {
      await widgetAdminService.reorder(reordered.map((w) => w.id));
    } catch {
      toast.error('Failed to save new order');
      load();
    }
  }

  async function handleToggleVisible(widget: DashboardWidget) {
    try {
      await widgetAdminService.toggleVisible(widget.id);
      toast.success(widget.is_visible ? 'Widget hidden' : 'Widget shown');
      load();
    } catch {
      toast.error('Failed to update visibility');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this widget? This cannot be undone.')) return;
    try {
      await widgetAdminService.delete(id);
      toast.success('Widget deleted');
      load();
    } catch {
      toast.error('Failed to delete widget');
    }
  }

  function openCreate() {
    setEditingWidget(null);
    setForm({
      widget_key: '',
      label: '',
      description: '',
      order_index: widgets.length + 1,
      is_visible: true,
      grid_column: 'full',
      config_json: '',
    });
    setShowModal(true);
  }

  function openEdit(widget: DashboardWidget) {
    setEditingWidget(widget);
    setForm({
      widget_key: widget.widget_key,
      label: widget.label,
      description: widget.description,
      order_index: widget.order_index,
      is_visible: widget.is_visible,
      grid_column: widget.grid_column,
      config_json: widget.config ? JSON.stringify(widget.config, null, 2) : '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.label?.trim()) { toast.error('Label is required'); return; }
    if (!editingWidget && !form.widget_key?.trim()) { toast.error('Widget key is required'); return; }

    let parsedConfig: Record<string, unknown> | null = null;
    if (form.config_json?.trim()) {
      try {
        parsedConfig = JSON.parse(form.config_json);
      } catch {
        toast.error('Invalid JSON in config field');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingWidget) {
        await widgetAdminService.update(editingWidget.id, {
          label: form.label!.trim(),
          description: form.description?.trim() || null,
          is_visible: form.is_visible,
          grid_column: form.grid_column,
          config: parsedConfig,
        });
        toast.success('Widget updated');
      } else {
        await widgetAdminService.create({
          widget_key: form.widget_key!.trim(),
          label: form.label!.trim(),
          description: form.description?.trim() || null,
          order_index: form.order_index,
          is_visible: form.is_visible,
          grid_column: form.grid_column,
          config: parsedConfig,
        });
        toast.success('Widget created');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Failed to save widget');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Widget Configuration</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Manage dashboard widgets -- drag to reorder, toggle visibility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary border border-th-border rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Widgets', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Visible', value: stats.visible, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Hidden', value: stats.hidden, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}><Settings className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Widget List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-th-accent-600 animate-spin" />
            {timedOut && (
              <div className="mt-4 text-center">
                <p className="text-sm text-th-text-tertiary">Loading is taking longer than expected.</p>
                <button type="button" onClick={load} className="mt-2 text-sm text-th-accent-600 hover:underline">
                  Retry
                </button>
              </div>
            )}
          </div>
        ) : widgets.length > 0 ? (
          <div className="divide-y divide-th-border-subtle">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(widget.id)}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDrop={() => handleDrop(widget.id)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                className={`px-4 py-3 flex items-center gap-3 transition-colors group ${
                  dragOver === widget.id ? 'bg-th-accent-50 border-t-2 border-th-accent-400' : 'hover:bg-surface-tertiary'
                } ${!widget.is_visible ? 'opacity-50' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-th-text-tertiary cursor-grab shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-th-text-primary text-sm">{widget.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-mono">
                      {widget.widget_key}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {widget.grid_column}
                    </span>
                    {!widget.is_visible && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Hidden</span>
                    )}
                  </div>
                  {widget.description && <p className="text-xs text-th-text-tertiary mt-0.5">{widget.description}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(widget)}
                    title={widget.is_visible ? 'Hide' : 'Show'}
                    className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors"
                  >
                    {widget.is_visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(widget)}
                    title="Edit"
                    className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(widget.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Settings className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No widgets configured</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
            >
              Add your first widget
            </button>
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingWidget ? 'Edit Widget' : 'Add Widget'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!editingWidget && (
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Widget Key *</label>
                  <input
                    type="text"
                    value={form.widget_key || ''}
                    onChange={(e) => setForm((p) => ({ ...p, widget_key: e.target.value }))}
                    placeholder="e.g. stats_cards"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Label *</label>
                <input
                  type="text"
                  value={form.label || ''}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Widget display name"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What this widget shows"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Grid Column</label>
                <select
                  value={form.grid_column || 'full'}
                  onChange={(e) => setForm((p) => ({ ...p, grid_column: e.target.value as 'full' | 'left' | 'right' }))}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                >
                  {GRID_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Config (JSON)</label>
                <textarea
                  rows={4}
                  value={form.config_json || ''}
                  onChange={(e) => setForm((p) => ({ ...p, config_json: e.target.value }))}
                  placeholder='{"key": "value"}'
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono text-sm placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_visible ?? true}
                  onChange={(e) => setForm((p) => ({ ...p, is_visible: e.target.checked }))}
                  className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <span className="text-sm text-th-text-secondary">Visible on dashboard</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingWidget ? 'Save Changes' : 'Create Widget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
