import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle,
  GripVertical,
  ExternalLink,
  Search,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Textarea } from '../../../components/ui/Textarea';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface QuickLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  description: string | null;
  category: string;
  order_index: number;
  is_external: boolean;
  is_active: boolean;
  requires_auth: boolean;
  image_url: string | null;
  is_popup: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'dashboard_actions', label: 'Dashboard Actions' },
  { value: 'resources', label: 'Resources' },
  { value: 'resource_center', label: 'Resource Center' },
  { value: 'advisor_forms', label: 'Advisor Forms' },
  { value: 'employer_forms', label: 'Employer Forms' },
  { value: 'member_forms', label: 'Member Forms' },
  { value: 'bulletins', label: 'Bulletins' },
];

const AVAILABLE_ICONS = [
  'Zap', 'Users', 'GraduationCap', 'FileText', 'Shield', 'User', 'BarChart3',
  'Inbox', 'Calendar', 'Clock', 'CheckCircle', 'Star', 'Heart', 'Search',
  'Download', 'Upload', 'Folder', 'Mail', 'Phone', 'MessageCircle', 'Bell',
  'Settings', 'Home', 'Link', 'ExternalLink', 'BookOpen', 'Award', 'Target',
];

// ============================================================================
// Main Component
// ============================================================================

export default function QuickActionsManager() {
  const navigate = useNavigate();
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<QuickLink | null>(null);
  const [form, setForm] = useState<Partial<QuickLink>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadQuickLinks();
  }, []);

  const loadQuickLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisor_quick_links')
        .select('id, label, url, icon, description, category, order_index, is_external, is_active, requires_auth, image_url, is_popup, created_at, updated_at')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setQuickLinks(data || []);
    } catch (error) {
      console.error('Error loading quick links:', error);
      toast.error('Failed to load quick links');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    // Each category has its own DragDropContext, so indices are category-local.
    // Operate only on items within the dragged category.
    const categoryId = result.source.droppableId;
    const categoryItems = quickLinks
      .filter(l => l.category === categoryId)
      .sort((a, b) => a.order_index - b.order_index);

    const reordered = Array.from(categoryItems);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedItems = reordered.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    // Update local state without touching other categories
    setQuickLinks(prev =>
      prev.map(link => updatedItems.find(u => u.id === link.id) ?? link),
    );

    setSaving(true);
    try {
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('advisor_quick_links')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
        if (error) throw error;
      }
      toast.success('Order updated! Changes are live.');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadQuickLinks();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      label: '',
      url: '/',
      icon: 'Zap',
      description: '',
      category: 'dashboard_actions',
      is_external: false,
      is_active: true,
      requires_auth: false,
      image_url: '',
      is_popup: false,
    });
    setShowModal(true);
  };

  const handleEdit = (item: QuickLink) => {
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
        const { error } = await supabase
          .from('advisor_quick_links')
          .update({
            label: form.label,
            url: form.url,
            icon: form.icon || 'Zap',
            description: form.description,
            category: form.category,
            is_external: form.is_external,
            is_active: form.is_active,
            requires_auth: form.requires_auth,
            image_url: form.image_url || null,
            is_popup: form.is_popup ?? false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Quick action updated! Changes are live in Advisor Portal.');
      } else {
        const maxOrder = Math.max(...quickLinks.map(l => l.order_index), 0);
        const { error } = await supabase
          .from('advisor_quick_links')
          .insert({
            label: form.label,
            url: form.url,
            icon: form.icon || 'Zap',
            description: form.description,
            category: form.category || 'dashboard_actions',
            order_index: maxOrder + 1,
            is_external: form.is_external ?? false,
            is_active: form.is_active ?? true,
            requires_auth: form.requires_auth ?? false,
            image_url: form.image_url || null,
            is_popup: form.is_popup ?? false,
          });

        if (error) throw error;
        toast.success('Quick action created! Now visible in Advisor Portal.');
      }

      setShowModal(false);
      loadQuickLinks();
    } catch (error) {
      console.error('Error saving quick action:', error);
      toast.error('Failed to save quick action');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick action?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_quick_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Quick action deleted');
      loadQuickLinks();
    } catch (error) {
      console.error('Error deleting quick action:', error);
      toast.error('Failed to delete quick action');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: QuickLink) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_quick_links')
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Quick action hidden' : 'Quick action activated!');
      loadQuickLinks();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update quick action');
    } finally {
      setSaving(false);
    }
  };

  // Filter quick links
  const filteredLinks = quickLinks.filter((link) => {
    const matchesSearch = link.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || link.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category for display
  const groupedLinks = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filteredLinks.filter(l => l.category === cat.value);
    return acc;
  }, {} as Record<string, QuickLink[]>);

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Quick Actions Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Quick Actions Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage dashboard quick links and shortcuts
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
              Add Quick Action
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Dashboard actions appear on the Advisor Portal Dashboard
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quick actions..."
              className="pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Quick Links by Category */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.filter(cat => 
              filterCategory === 'all' || filterCategory === cat.value
            ).map((cat) => {
              const links = groupedLinks[cat.value] || [];
              if (links.length === 0 && filterCategory !== 'all') return null;
              
              return (
                <Card key={cat.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        {cat.label}
                      </span>
                      <Badge variant="secondary">{links.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {links.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No quick actions in this category
                      </p>
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId={cat.value}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {links.map((link, index) => (
                                <Draggable key={link.id} draggableId={link.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        'flex items-center gap-3 p-3 bg-white border rounded-lg transition-all',
                                        snapshot.isDragging && 'shadow-lg ring-2 ring-primary-500',
                                        !link.is_active && 'opacity-50'
                                      )}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="w-5 h-5 text-gray-400" />
                                      </div>

                                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-primary-600" />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">{link.label}</span>
                                          {link.is_external && (
                                            <ExternalLink className="w-3 h-3 text-gray-400" />
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{link.url}</p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleToggleActive(link)}
                                          title={link.is_active ? 'Hide' : 'Show'}
                                        >
                                          {link.is_active ? (
                                            <Eye className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(link)}
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(link.id)}
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
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Quick Action' : 'Add Quick Action'}
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
                    placeholder="e.g., Power List"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <Input
                    value={form.url || ''}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="e.g., /power-list"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <select
                      value={form.icon || 'Zap'}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      aria-label="Icon"
                    >
                      {AVAILABLE_ICONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category || 'dashboard_actions'}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      aria-label="Category"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (for Resource Center cards)
                  </label>
                  <Input
                    value={form.image_url || ''}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
                    placeholder="https://... or /storage/v1/object/public/..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Used in Resource Center card thumbnails (16:9 aspect ratio recommended)</p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active !== false}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_external === true}
                      onChange={(e) => setForm({ ...form, is_external: e.target.checked })}
                    />
                    <span className="text-sm">External link</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_popup === true}
                      onChange={(e) => setForm({ ...form, is_popup: e.target.checked })}
                    />
                    <span className="text-sm">Open in popup</span>
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
