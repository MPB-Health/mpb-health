import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  ArrowLeft,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface NavMenuItem {
  id: string;
  label: string;
  url: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  is_external: boolean;
  badge_text?: string;
  badge_color?: string;
  created_at: string;
  updated_at: string;
}

// Available Lucide icons for selection
const AVAILABLE_ICONS = [
  'LayoutDashboard', 'Zap', 'Inbox', 'Workflow', 'Bot', 'Users', 'Shield',
  'BarChart3', 'Trophy', 'Activity', 'CreditCard', 'GraduationCap', 'Video',
  'FileText', 'BookOpen', 'Bell', 'Settings', 'Home', 'User', 'Mail', 'Calendar',
  'Clock', 'CheckCircle', 'Star', 'Heart', 'Search', 'Filter', 'Download',
  'Upload', 'Folder', 'File', 'Image', 'Map', 'Globe', 'Building', 'Lightbulb',
];

// ============================================================================
// Main Component
// ============================================================================

export default function NavigationManager() {
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NavMenuItem | null>(null);
  const [form, setForm] = useState<Partial<NavMenuItem>>({});

  useEffect(() => {
    loadNavItems();
  }, []);

  const loadNavItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisor_nav_menu')
        .select('id, label, url, icon, order_index, is_active, is_external, badge_text, badge_color, created_at, updated_at')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setNavItems(data || []);
    } catch (error) {
      console.error('Error loading navigation:', error);
      toast.error('Failed to load navigation items');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(navItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }));

    setNavItems(updatedItems);

    // Save to database
    setSaving(true);
    try {
      for (const item of updatedItems) {
        await supabase
          .from('advisor_nav_menu')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
      }
      toast.success('Navigation order updated! Changes are live in Advisor Portal.');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadNavItems(); // Reload on error
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      label: '',
      url: '/',
      icon: 'LayoutDashboard',
      is_active: true,
      is_external: false,
      badge_text: '',
      badge_color: 'blue',
    });
    setShowModal(true);
  };

  const handleEdit = (item: NavMenuItem) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label || !form.url) {
      toast.error('Label and URL are required');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('advisor_nav_menu')
          .update({
            label: form.label,
            url: form.url,
            icon: form.icon || 'LayoutDashboard',
            is_active: form.is_active,
            is_external: form.is_external,
            badge_text: form.badge_text || null,
            badge_color: form.badge_color || 'blue',
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Navigation item updated! Changes are live in Advisor Portal.');
      } else {
        // Create new
        const maxOrder = Math.max(...navItems.map(i => i.order_index), 0);
        const { error } = await supabase
          .from('advisor_nav_menu')
          .insert({
            label: form.label,
            url: form.url,
            icon: form.icon || 'LayoutDashboard',
            order_index: maxOrder + 1,
            is_active: form.is_active ?? true,
            is_external: form.is_external ?? false,
            badge_text: form.badge_text || null,
            badge_color: form.badge_color || 'blue',
          });

        if (error) throw error;
        toast.success('Navigation item created! Now visible in Advisor Portal.');
      }

      setShowModal(false);
      loadNavItems();
    } catch (error) {
      console.error('Error saving navigation item:', error);
      toast.error('Failed to save navigation item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this navigation item?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_nav_menu')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Navigation item deleted');
      loadNavItems();
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      toast.error('Failed to delete navigation item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: NavMenuItem) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_nav_menu')
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Item hidden from portal' : 'Item now visible in portal');
      loadNavItems();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Navigation Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Navigation Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage sidebar navigation items for the Advisor Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/advisor-cms">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to CMS
              </Button>
            </Link>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Changes sync immediately to the Advisor Portal sidebar
          </span>
        </div>

        {/* Navigation Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="w-5 h-5" />
              Navigation Items ({navItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : navItems.length === 0 ? (
              <div className="text-center py-12">
                <Menu className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No navigation items yet</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="nav-items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {navItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                'flex items-center gap-3 p-3 bg-white border rounded-lg transition-all',
                                snapshot.isDragging && 'shadow-lg ring-2 ring-primary-500',
                                !item.is_active && 'opacity-50'
                              )}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>

                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500">{item.icon}</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{item.label}</span>
                                  {item.badge_text && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.badge_text}
                                    </Badge>
                                  )}
                                  {item.is_external && (
                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{item.url}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(item)}
                                  title={item.is_active ? 'Hide from portal' : 'Show in portal'}
                                >
                                  {item.is_active ? (
                                    <Eye className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Navigation Item' : 'Add Navigation Item'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label *
                  </label>
                  <Input
                    value={form.label || ''}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g., Dashboard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <Input
                    value={form.url || ''}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="e.g., / or /training"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={form.icon || 'LayoutDashboard'}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge Text (optional)
                    </label>
                    <Input
                      value={form.badge_text || ''}
                      onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                      placeholder="e.g., New"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge Color
                    </label>
                    <select
                      value={form.badge_color || 'blue'}
                      onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active !== false}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <span className="text-sm">Active (visible in portal)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_external === true}
                      onChange={(e) => setForm({ ...form, is_external: e.target.checked })}
                    />
                    <span className="text-sm">External link</span>
                  </label>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
