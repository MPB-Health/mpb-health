import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
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
  Search,
  FileText,
  ExternalLink,
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

interface ToolkitDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  content: string | null;
  file_url: string | null;
  image_url: string | null;
  version: string;
  is_active: boolean;
  is_published: boolean;
  order_index: number;
  view_count: number;
  slug: string | null;
  content_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const TOOLKIT_CATEGORIES = [
  { value: 'presentations', label: 'Presentations' },
  { value: 'advisor handbook', label: 'Advisor Handbook' },
  { value: 'commission structure', label: 'Commission Structure' },
  { value: 'advisor-toolkit', label: 'General Toolkit' },
];

const ALL_CATEGORY_VALUES = TOOLKIT_CATEGORIES.map(c => c.value);

function matchesToolkitCategory(category: string): boolean {
  const lower = (category || '').toLowerCase();
  return ALL_CATEGORY_VALUES.some(v => lower === v || lower.includes(v));
}

function normalizeCategoryKey(category: string): string {
  const lower = (category || '').toLowerCase();
  return ALL_CATEGORY_VALUES.find(v => lower === v || lower.includes(v)) || 'advisor-toolkit';
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdvisorToolkitManager() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<ToolkitDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ToolkitDocument | null>(null);
  const [form, setForm] = useState<Partial<ToolkitDocument>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sop_documents')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      const toolkitDocs = (data || []).filter(d => matchesToolkitCategory(d.category));
      setDocuments(toolkitDocs);
    } catch (error) {
      console.error('Error loading toolkit documents:', error);
      toast.error('Failed to load toolkit documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    const categoryId = result.source.droppableId;
    const categoryItems = documents
      .filter(d => d.category === categoryId)
      .sort((a, b) => a.order_index - b.order_index);

    const reordered = Array.from(categoryItems);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedItems = reordered.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    setDocuments(prev =>
      prev.map(doc => updatedItems.find(u => u.id === doc.id) ?? doc),
    );

    setSaving(true);
    try {
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('sop_documents')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
        if (error) throw error;
      }
      toast.success('Order updated');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadDocuments();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      description: '',
      category: 'advisor-toolkit',
      tags: [],
      content: '',
      file_url: '',
      image_url: '',
      version: '1.0',
      is_active: true,
      is_published: true,
      content_type: 'markdown',
      slug: '',
    });
    setTagInput('');
    setShowModal(true);
  };

  const handleEdit = (item: ToolkitDocument) => {
    setEditingItem(item);
    setForm({ ...item });
    setTagInput('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.title);

      if (editingItem) {
        const { error } = await supabase
          .from('sop_documents')
          .update({
            title: form.title,
            description: form.description || null,
            category: form.category,
            tags: form.tags || [],
            content: form.content || null,
            file_url: form.file_url || null,
            image_url: form.image_url || null,
            version: form.version || '1.0',
            is_active: form.is_active,
            is_published: form.is_published,
            content_type: form.content_type || 'markdown',
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Document updated — live in Advisor Portal');
      } else {
        const maxOrder = Math.max(...documents.map(d => d.order_index), 0);
        const { error } = await supabase
          .from('sop_documents')
          .insert({
            title: form.title,
            description: form.description || null,
            category: form.category || 'advisor-toolkit',
            tags: form.tags || [],
            content: form.content || null,
            file_url: form.file_url || null,
            image_url: form.image_url || null,
            version: form.version || '1.0',
            is_active: form.is_active ?? true,
            is_published: form.is_published ?? true,
            content_type: form.content_type || 'markdown',
            slug,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Document created — now visible in Advisor Portal');
      }

      setShowModal(false);
      loadDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sop_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Document deleted');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ToolkitDocument) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sop_documents')
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Document hidden' : 'Document activated');
      loadDocuments();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !(form.tags || []).includes(trimmed)) {
      setForm(prev => ({ ...prev, tags: [...(prev.tags || []), trimmed] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || normalizeCategoryKey(doc.category) === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedDocs = TOOLKIT_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filteredDocs.filter(d => normalizeCategoryKey(d.category) === cat.value);
    return acc;
  }, {} as Record<string, ToolkitDocument[]>);

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Advisor Toolkit" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Advisor Toolkit Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage presentations, handbooks, and commission resources
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
              Add Document
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Documents appear under Resources &gt; Advisor Toolkit in the Advisor Portal
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
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
            {TOOLKIT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Documents by Category */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {TOOLKIT_CATEGORIES.filter(cat =>
              filterCategory === 'all' || filterCategory === cat.value
            ).map(cat => {
              const docs = groupedDocs[cat.value] || [];
              if (docs.length === 0 && filterCategory !== 'all') return null;

              return (
                <Card key={cat.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        {cat.label}
                      </span>
                      <Badge variant="secondary">{docs.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {docs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No documents in this category
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
                              {docs.map((doc, index) => (
                                <Draggable key={doc.id} draggableId={doc.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        'flex items-center gap-3 p-3 bg-white border rounded-lg transition-all',
                                        snapshot.isDragging && 'shadow-lg ring-2 ring-primary-500',
                                        !doc.is_active && 'opacity-50'
                                      )}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="w-5 h-5 text-gray-400" />
                                      </div>

                                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-green-600" />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">{doc.title}</span>
                                          {doc.file_url && (
                                            <ExternalLink className="w-3 h-3 text-gray-400" />
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                          {doc.description || doc.file_url || 'No description'}
                                        </p>
                                      </div>

                                      {doc.tags && doc.tags.length > 0 && (
                                        <div className="hidden lg:flex items-center gap-1">
                                          {doc.tags.slice(0, 2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                          ))}
                                          {doc.tags.length > 2 && (
                                            <span className="text-xs text-gray-400">+{doc.tags.length - 2}</span>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleToggleActive(doc)}
                                          title={doc.is_active ? 'Hide' : 'Show'}
                                        >
                                          {doc.is_active ? (
                                            <Eye className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(doc)}
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(doc.id)}
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
                  {editingItem ? 'Edit Document' : 'Add Document'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., MPB Health Presentation 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of this document..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category || 'advisor-toolkit'}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      aria-label="Category"
                    >
                      {TOOLKIT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version
                    </label>
                    <Input
                      value={form.version || '1.0'}
                      onChange={(e) => setForm({ ...form, version: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File URL
                  </label>
                  <Input
                    value={form.file_url || ''}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    placeholder="https://... or /storage/v1/object/public/..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Direct link to the document (PDF, PPTX, etc.)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image / Thumbnail URL
                  </label>
                  <Input
                    value={form.image_url || ''}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <Input
                    value={form.slug || ''}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content (Markdown)
                  </label>
                  <Textarea
                    value={form.content || ''}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Optional inline content..."
                    rows={4}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-green-900">&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addTag} type="button">Add</Button>
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
                      checked={form.is_published !== false}
                      onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    />
                    <span className="text-sm">Published</span>
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
