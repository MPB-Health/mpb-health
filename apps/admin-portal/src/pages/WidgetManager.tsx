import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  X,
  Save,
  GripVertical,
  Columns,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
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

export default function WidgetManager() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, visible: 0, hidden: 0 });
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<WidgetCreateInput>({ widget_key: '', label: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [widgetsData, statsData] = await Promise.all([
        widgetAdminService.getAll(),
        widgetAdminService.getStats(),
      ]);
      setWidgets(widgetsData);
      setStats(statsData);
    } catch {
      toast.error('Failed to load widgets');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisible = async (widget: DashboardWidget) => {
    try {
      await widgetAdminService.toggleVisible(widget.id);
      toast.success(widget.is_visible ? 'Widget hidden' : 'Widget shown');
      loadData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleMove = async (widget: DashboardWidget, direction: 'up' | 'down') => {
    const idx = widgets.findIndex((w) => w.id === widget.id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === widgets.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = [...widgets];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    try {
      await widgetAdminService.reorder(newOrder.map((w) => w.id));
      toast.success('Reordered');
      loadData();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this widget?')) return;
    try {
      await widgetAdminService.delete(id);
      toast.success('Deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    setIsNew(false);
    setForm({
      widget_key: widget.widget_key,
      label: widget.label,
      description: widget.description,
      order_index: widget.order_index,
      is_visible: widget.is_visible,
      grid_column: widget.grid_column,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingWidget(null);
    setIsNew(true);
    setForm({
      widget_key: '',
      label: '',
      description: '',
      order_index: widgets.length + 1,
      is_visible: true,
      grid_column: 'full',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label?.trim()) { toast.error('Label is required'); return; }
    if (isNew && !form.widget_key?.trim()) { toast.error('Widget key is required'); return; }
    setSaving(true);
    try {
      if (editingWidget) {
        await widgetAdminService.update(editingWidget.id, {
          label: form.label.trim(),
          description: form.description?.trim() || null,
          is_visible: form.is_visible,
          grid_column: form.grid_column,
        });
        toast.success('Updated!');
      } else {
        await widgetAdminService.create({
          widget_key: form.widget_key!.trim(),
          label: form.label.trim(),
          description: form.description?.trim() || null,
          order_index: form.order_index,
          is_visible: form.is_visible,
          grid_column: form.grid_column,
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
          <h1 className="text-2xl font-bold text-th-text-primary">Dashboard Widget Manager</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Control which widgets appear on the advisor portal dashboard and their layout
          </p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Widget</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Widgets', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Visible', value: stats.visible, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Hidden', value: stats.hidden, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}><LayoutGrid className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-800 dark:text-blue-300">
        Widgets control what sections appear on the advisor dashboard. Toggle visibility, reorder, and configure layout columns.
      </div>

      {/* Widget List */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        {widgets.length === 0 ? (
          <div className="text-center py-12">
            <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No widgets configured</h3>
            <p className="text-th-text-tertiary mb-6">Add dashboard widgets to control the advisor portal layout</p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {widgets.map((widget, idx) => (
              <div key={widget.id} className={`flex items-center gap-3 p-4 group ${!widget.is_visible ? 'opacity-50' : ''}`}>
                <GripVertical className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />

                {/* Order arrows */}
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => handleMove(widget, 'up')} disabled={idx === 0} className="p-0.5 text-th-text-tertiary hover:text-th-text-primary disabled:opacity-30" title="Move up">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => handleMove(widget, 'down')} disabled={idx === widgets.length - 1} className="p-0.5 text-th-text-tertiary hover:text-th-text-primary disabled:opacity-30" title="Move down">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-th-text-primary text-sm">{widget.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-mono">
                      {widget.widget_key}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 flex items-center gap-1">
                      <Columns className="w-3 h-3" />
                      {widget.grid_column}
                    </span>
                    {!widget.is_visible && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Hidden</span>
                    )}
                  </div>
                  {widget.description && <p className="text-xs text-th-text-tertiary mt-0.5">{widget.description}</p>}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button type="button" onClick={() => handleToggleVisible(widget)} title={widget.is_visible ? 'Hide' : 'Show'} className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors">
                    {widget.is_visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => openEdit(widget)} title="Edit" className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(widget.id)} title="Delete" className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
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
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {isNew ? 'Add Widget' : 'Edit Widget'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isNew && (
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Widget Key *</label>
                  <input type="text" value={form.widget_key || ''} onChange={(e) => setForm((p) => ({ ...p, widget_key: e.target.value }))} placeholder="e.g. stats_cards, latest_bulletins" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary font-mono placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                  <p className="text-xs text-th-text-tertiary mt-1">Must match a widget component in the advisor portal</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Label *</label>
                <input type="text" value={form.label || ''} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Widget display name" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea rows={2} value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What this widget shows" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Grid Column</label>
                <select value={form.grid_column || 'full'} onChange={(e) => setForm((p) => ({ ...p, grid_column: e.target.value as 'full' | 'left' | 'right' }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500">
                  {GRID_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_visible ?? true} onChange={(e) => setForm((p) => ({ ...p, is_visible: e.target.checked }))} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500" />
                <span className="text-sm text-th-text-secondary">Visible on dashboard</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
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
