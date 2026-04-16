import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Link2,
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
import MigratedToAdminPortal from '../../../components/admin/MigratedToAdminPortal';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface EnrollmentLink {
  id: string;
  label: string;
  url: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function EnrollmentLinksManager() {
  const navigate = useNavigate();
  const [links, setLinks] = useState<EnrollmentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EnrollmentLink | null>(null);
  const [form, setForm] = useState<Partial<EnrollmentLink>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisor_enrollment_links')
        .select('id, label, url, description, order_index, is_active, created_at, updated_at')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading enrollment links:', error);
      toast.error('Failed to load enrollment links');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setLinks(updatedItems);

    setSaving(true);
    try {
      for (const item of updatedItems) {
        await supabase
          .from('advisor_enrollment_links')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
      }
      toast.success('Order updated! Changes are live.');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadLinks();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      label: '',
      url: '',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: EnrollmentLink) => {
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
          .from('advisor_enrollment_links')
          .update({
            label: form.label,
            url: form.url,
            description: form.description || null,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Enrollment link updated! Changes are live in Advisor Portal.');
      } else {
        const maxOrder = Math.max(...links.map(l => l.order_index), -1);
        const { error } = await supabase
          .from('advisor_enrollment_links')
          .insert({
            label: form.label,
            url: form.url,
            description: form.description || null,
            order_index: maxOrder + 1,
            is_active: form.is_active ?? true,
          });

        if (error) throw error;
        toast.success('Enrollment link created! Now visible in Advisor Portal.');
      }

      setShowModal(false);
      loadLinks();
    } catch (error) {
      console.error('Error saving enrollment link:', error);
      toast.error('Failed to save enrollment link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment link?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_enrollment_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Enrollment link deleted');
      loadLinks();
    } catch (error) {
      console.error('Error deleting enrollment link:', error);
      toast.error('Failed to delete enrollment link');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: EnrollmentLink) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_enrollment_links')
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Enrollment link hidden' : 'Enrollment link activated!');
      loadLinks();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update enrollment link');
    } finally {
      setSaving(false);
    }
  };

  const filteredLinks = links.filter((link) =>
    link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <MigratedToAdminPortal adminPath="/content/enrollment-links" sectionName="Enrollment Links Manager" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Enrollment Links Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Enrollment Links Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage enrollment page links shown in the Advisor Portal dashboard
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
              Add Enrollment Link
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Enrollment links appear in the Advisor Portal Dashboard enrollment dropdown
          </span>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enrollment links..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Links List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Enrollment Links
                </span>
                <Badge variant="secondary">{filteredLinks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLinks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No enrollment links found
                </p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="enrollment-links">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {filteredLinks.map((link, index) => (
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

                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                  <Link2 className="w-5 h-5 text-blue-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{link.label}</span>
                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                  </div>
                                  <p className="text-sm text-gray-500 truncate">{link.url}</p>
                                  {link.description && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{link.description}</p>
                                  )}
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
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Enrollment Link' : 'Add Enrollment Link'}
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
                    placeholder="e.g., Essentials"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <Input
                    value={form.url || ''}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="e.g., https://essentials.enrollmpb.com/?id=768413"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of this enrollment page..."
                    rows={2}
                  />
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
