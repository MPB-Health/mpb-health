import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Navigation,
  Loader2,
  X,
  Save,
  ChevronRight,
  ChevronDown,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import {
  navigationAdminService,
  type NavMenuItem,
  type NavItemCreateInput,
} from '@mpbhealth/admin-core';

const EMPTY_FORM: NavItemCreateInput = {
  label: '',
  url: null,
  icon: '',
  parent_id: null,
  order_index: 0,
  is_active: true,
  is_external: false,
  requires_auth: true,
  badge_text: null,
  badge_color: '',
};

interface TreeNode extends NavMenuItem {
  children: TreeNode[];
}

function buildTree(items: NavMenuItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function NavigationManager() {
  const [items, setItems] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, topLevel: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NavMenuItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState<NavItemCreateInput>(EMPTY_FORM);
  const [modalSaving, setModalSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, statsData] = await Promise.all([
        navigationAdminService.getAllItems(),
        navigationAdminService.getStats(),
      ]);
      setItems(itemsData);
      setStats(statsData);
      // Auto-expand top-level items
      const topLevel = itemsData.filter((i) => !i.parent_id).map((i) => i.id);
      setExpandedNodes(new Set(topLevel));
    } catch (error) {
      console.error('Error loading nav items:', error);
      toast.error('Failed to load navigation');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: NavMenuItem) => {
    try {
      await navigationAdminService.toggleActive(item.id);
      toast.success(item.is_active ? 'Item hidden' : 'Item activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    const hasChildren = items.some((i) => i.parent_id === id);
    if (hasChildren) {
      toast.error('Remove child items first before deleting this item');
      return;
    }
    if (!confirm('Delete this navigation item?')) return;
    setDeleting(id);
    try {
      await navigationAdminService.deleteItem(id);
      toast.success('Item deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (item: NavMenuItem) => {
    setEditingItem(item);
    setModalForm({
      label: item.label,
      path: item.path || '',
      icon: item.icon || '',
      parent_id: item.parent_id,
      order_index: item.order_index,
      is_active: item.is_active,
      is_external: item.is_external ?? false,
      open_in_new_tab: item.open_in_new_tab ?? false,
      badge_text: item.badge_text || null,
      badge_color: item.badge_color || null,
    });
    setShowModal(true);
  };

  const openCreate = (parentId: string | null = null) => {
    setEditingItem(null);
    const siblings = items.filter((i) => i.parent_id === parentId);
    setModalForm({ ...EMPTY_FORM, parent_id: parentId, order_index: siblings.length });
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
        label: modalForm.label.trim(),
        path: modalForm.path?.trim() || null,
        icon: modalForm.icon?.trim() || null,
        badge_text: modalForm.badge_text?.trim() || null,
        badge_color: modalForm.badge_color?.trim() || null,
      };

      if (editingItem) {
        await navigationAdminService.updateItem(editingItem.id, payload);
        toast.success('Item updated!');
      } else {
        await navigationAdminService.createItem(payload as NavItemCreateInput);
        toast.success('Item created!');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setModalSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const topLevelItems = items.filter((i) => !i.parent_id);

  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 p-3 hover:bg-surface-secondary transition-colors group rounded-lg ${
            !node.is_active ? 'opacity-50' : ''
          } ${depth === 1 ? 'pl-14' : depth === 2 ? 'pl-24' : 'pl-3'}`}
        >
          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => hasChildren && toggleExpand(node.id)}
            title={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : undefined}
            className={`w-5 h-5 flex items-center justify-center text-th-text-tertiary ${
              hasChildren ? 'hover:text-th-text-primary cursor-pointer' : 'cursor-default'
            }`}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="w-4" />
            )}
          </button>

          {/* Grip */}
          <GripVertical className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />

          {/* Label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-th-text-primary text-sm">{node.label}</span>
              {!node.is_active && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Hidden
                </span>
              )}
              {node.badge_text && (
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                  {node.badge_text}
                </span>
              )}
              {node.is_external && <ExternalLink className="w-3 h-3 text-th-text-tertiary" />}
            </div>
            {node.url && (
              <span className="text-xs text-th-text-tertiary">{node.url}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {depth === 0 && (
              <button
                type="button"
                onClick={() => openCreate(node.id)}
                title="Add child item"
                className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-accent-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleToggleActive(node)}
              title={node.is_active ? 'Hide' : 'Show'}
              className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
            >
              {node.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => openEdit(node)}
              title="Edit"
              className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(node.id)}
              disabled={deleting === node.id}
              title="Delete"
              className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {deleting === node.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-th-border ml-8">
            {node.children.map((child) => renderTreeNode(child as TreeNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(items);

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
          <h1 className="text-2xl font-bold text-th-text-primary">Navigation Manager</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Manage the advisor portal navigation menu</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Top-Level Item</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Items', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Top Level', value: stats.topLevel },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className="p-3 rounded-xl text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-800 dark:text-blue-300">
        Changes take effect immediately in the advisor portal. Use the + button on a top-level item to add child menu items.
      </div>

      {/* Tree */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        {tree.length === 0 ? (
          <div className="text-center py-12">
            <Navigation className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No navigation items</h3>
            <p className="text-th-text-tertiary mb-6">Create your first top-level navigation item</p>
            <button
              type="button"
              onClick={() => openCreate(null)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingItem
                  ? 'Edit Nav Item'
                  : modalForm.parent_id
                  ? 'Add Child Item'
                  : 'Add Top-Level Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                title="Close"
                aria-label="Close modal"
                className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Label *</label>
                <input
                  type="text"
                  value={modalForm.label}
                  onChange={(e) => setModalForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Menu item label"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Path / URL</label>
                <input
                  type="text"
                  value={modalForm.path || ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, path: e.target.value }))}
                  placeholder="/path or https://..."
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Icon (lucide name)</label>
                  <input
                    type="text"
                    value={modalForm.icon || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="e.g. Home, FileText"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Order</label>
                  <input
                    type="number"
                    min="0"
                    value={modalForm.order_index}
                    onChange={(e) => setModalForm((p) => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              {/* Parent */}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Parent Item</label>
                <select
                  aria-label="Parent item"
                  value={modalForm.parent_id || ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, parent_id: e.target.value || null }))}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                >
                  <option value="">Top level (no parent)</option>
                  {topLevelItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
              {/* Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={modalForm.badge_text || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, badge_text: e.target.value || null }))}
                    placeholder="e.g. New, 3"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Badge Color</label>
                  <input
                    type="text"
                    value={modalForm.badge_color || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, badge_color: e.target.value || null }))}
                    placeholder="#ef4444"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              {/* Flags */}
              <div className="flex items-center gap-6 flex-wrap">
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
                    checked={modalForm.is_external ?? false}
                    onChange={(e) => setModalForm((p) => ({ ...p, is_external: e.target.checked }))}
                    className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">External link</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.open_in_new_tab ?? false}
                    onChange={(e) => setModalForm((p) => ({ ...p, open_in_new_tab: e.target.checked }))}
                    className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">New tab</span>
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
                <span>{editingItem ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
