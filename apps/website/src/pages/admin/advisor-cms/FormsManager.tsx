import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
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
  Clock,
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
import { sanitizeHtml } from '@mpbhealth/utils';

// ============================================================================
// Types
// ============================================================================

interface CognitoForm {
  id: string;
  slug: string;
  label: string;
  category: 'employer' | 'member' | 'advisor';
  description: string | null;
  icon: string;
  estimated_minutes: number;
  cognito_embed: string | null;
  is_active: boolean;
  requires_auth: boolean;
  sort_order: number;
  show_in_menu: boolean;
  menu_section: string;
  menu_order: number;
  created_at: string;
  updated_at: string;
}

const FORM_ICONS = [
  'FileText', 'ClipboardList', 'File', 'Folder', 'Upload', 'Download',
  'Users', 'Building2', 'Briefcase', 'Heart', 'Shield', 'CheckCircle',
];

// ============================================================================
// Main Component
// ============================================================================

export default function FormsManager() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<CognitoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CognitoForm | null>(null);
  const [form, setForm] = useState<Partial<CognitoForm>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'employer' | 'member' | 'advisor'>('all');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cognito_forms')
        .select('id, slug, label, category, description, icon, estimated_minutes, cognito_embed, is_active, requires_auth, sort_order, show_in_menu, menu_section, menu_order, created_at, updated_at')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(forms);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    setForms(updatedItems);

    setSaving(true);
    try {
      for (const item of updatedItems) {
        await supabase
          .from('cognito_forms')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
      }
      toast.success('Form order updated! Changes are live.');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadForms();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      label: '',
      slug: '',
      category: 'member',
      description: '',
      icon: 'FileText',
      estimated_minutes: 5,
      cognito_embed: '',
      is_active: true,
      requires_auth: false,
      show_in_menu: false,
      menu_section: 'member-forms',
      menu_order: 99,
    });
    setShowModal(true);
  };

  const handleEdit = (item: CognitoForm) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const generateSlug = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    if (!form.label) {
      toast.error('Label is required');
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.label);

      if (editingItem) {
        const { error } = await supabase
          .from('cognito_forms')
          .update({
            label: form.label,
            slug,
            category: form.category,
            description: form.description,
            icon: form.icon || 'FileText',
            estimated_minutes: form.estimated_minutes || 5,
            cognito_embed: form.cognito_embed,
            is_active: form.is_active,
            requires_auth: form.requires_auth,
            show_in_menu: form.show_in_menu,
            menu_section: form.menu_section,
            menu_order: form.menu_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Form updated! Changes are live in Advisor Portal.');
      } else {
        const maxOrder = Math.max(...forms.map(f => f.sort_order), 0);
        const { error } = await supabase
          .from('cognito_forms')
          .insert({
            label: form.label,
            slug,
            category: form.category || 'member',
            description: form.description,
            icon: form.icon || 'FileText',
            estimated_minutes: form.estimated_minutes || 5,
            cognito_embed: form.cognito_embed,
            is_active: form.is_active ?? true,
            requires_auth: form.requires_auth ?? false,
            sort_order: maxOrder + 1,
            show_in_menu: form.show_in_menu ?? false,
            menu_section: form.menu_section || 'member-forms',
            menu_order: form.menu_order || 99,
          });

        if (error) throw error;
        toast.success('Form created! Now available in Advisor Portal.');
      }

      setShowModal(false);
      loadForms();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cognito_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Form deleted');
      loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: CognitoForm) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cognito_forms')
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Form deactivated' : 'Form activated!');
      loadForms();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update form');
    } finally {
      setSaving(false);
    }
  };

  // Filter forms
  const filteredForms = forms.filter((f) => {
    const matchesSearch = f.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Forms Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Forms Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage Cognito forms for the Advisor Portal
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
              Add Form
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Active forms appear in Advisor Portal &gt; Forms
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'employer', 'member', 'advisor'] as const).map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Forms List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Forms ({filteredForms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No forms found</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Form
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="forms">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {filteredForms.map((formItem, index) => (
                        <Draggable key={formItem.id} draggableId={formItem.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                'flex items-center gap-3 p-4 bg-white border rounded-lg transition-all',
                                snapshot.isDragging && 'shadow-lg ring-2 ring-primary-500',
                                !formItem.is_active && 'opacity-50'
                              )}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>

                              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary-600" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{formItem.label}</span>
                                  <Badge variant={formItem.is_active ? 'default' : 'secondary'}>
                                    {formItem.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {formItem.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    ~{formItem.estimated_minutes} min
                                  </span>
                                  {formItem.show_in_menu && (
                                    <span className="text-green-600">Shown in menu</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {formItem.cognito_embed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPreview(formItem.id)}
                                    title="Preview form"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(formItem)}
                                  title={formItem.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {formItem.is_active ? (
                                    <Eye className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(formItem)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(formItem.id)}
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

        {/* Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Form' : 'Add Form'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label *
                    </label>
                    <Input
                      value={form.label || ''}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="Form name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug
                    </label>
                    <Input
                      value={form.slug || ''}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="form-slug"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category || 'member'}
                      onChange={(e) => setForm({ ...form, category: e.target.value as 'employer' | 'member' | 'advisor' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="employer">Employer</option>
                      <option value="member">Member</option>
                      <option value="advisor">Advisor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <select
                      value={form.icon || 'FileText'}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {FORM_ICONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the form"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognito Embed Code
                  </label>
                  <Textarea
                    value={form.cognito_embed || ''}
                    onChange={(e) => setForm({ ...form, cognito_embed: e.target.value })}
                    placeholder="Paste Cognito iframe or script embed code here..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Minutes
                    </label>
                    <Input
                      type="number"
                      value={form.estimated_minutes || 5}
                      onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 5 })}
                      min={1}
                      max={60}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Menu Section
                    </label>
                    <select
                      value={form.menu_section || 'member-forms'}
                      onChange={(e) => setForm({ ...form, menu_section: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="member-forms">Member Forms</option>
                      <option value="employer-forms">Employer Forms</option>
                      <option value="advisor-forms">Advisor Forms</option>
                      <option value="onboarding">Onboarding</option>
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
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.show_in_menu === true}
                      onChange={(e) => setForm({ ...form, show_in_menu: e.target.checked })}
                    />
                    <span className="text-sm">Show in menu</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.requires_auth === true}
                      onChange={(e) => setForm({ ...form, requires_auth: e.target.checked })}
                    />
                    <span className="text-sm">Requires auth</span>
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

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Form Preview</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(null)}>
                  Close
                </Button>
              </div>
              <div className="p-4 h-[70vh] overflow-auto">
                {(() => {
                  const previewForm = forms.find(f => f.id === showPreview);
                  if (!previewForm?.cognito_embed) return <p>No embed code</p>;
                  return (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewForm.cognito_embed, { ADD_TAGS: ['iframe', 'script'], ADD_ATTR: ['src', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'scrolling'] }) }} />
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
