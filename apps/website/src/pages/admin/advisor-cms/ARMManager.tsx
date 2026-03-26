import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
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
  ExternalLink,
  Link2,
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

interface SOPDocument {
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

function matchesArmCategory(category: string): boolean {
  const lower = (category || '').toLowerCase();
  return lower === 'arm' || lower.includes('arm');
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function ARMManager() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SOPDocument | null>(null);
  const [form, setForm] = useState<Partial<SOPDocument>>({});
  const [searchQuery, setSearchQuery] = useState('');
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
      const armDocs = (data || []).filter(d => matchesArmCategory(d.category));
      setDocuments(armDocs);
    } catch (error) {
      console.error('Error loading ARM resources:', error);
      toast.error('Failed to load ARM resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    const reordered = Array.from(documents);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedItems = reordered.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    setDocuments(updatedItems);

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
      category: 'arm',
      tags: [],
      content: '',
      file_url: '',
      image_url: '',
      version: '1.0',
      is_active: true,
      is_published: true,
      content_type: 'link',
      slug: '',
    });
    setTagInput('');
    setShowModal(true);
  };

  const handleEdit = (item: SOPDocument) => {
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
    if (!form.file_url) {
      toast.error('Link URL is required for ARM resources');
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
            content_type: form.content_type || 'link',
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('ARM link updated — live in Advisor Portal');
      } else {
        const maxOrder = Math.max(...documents.map(d => d.order_index), 0);
        const { error } = await supabase
          .from('sop_documents')
          .insert({
            title: form.title,
            description: form.description || null,
            category: 'arm',
            tags: form.tags || [],
            content: form.content || null,
            file_url: form.file_url || null,
            image_url: form.image_url || null,
            version: form.version || '1.0',
            is_active: form.is_active ?? true,
            is_published: form.is_published ?? true,
            content_type: form.content_type || 'link',
            slug,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('ARM link created — now visible in Advisor Portal');
      }

      setShowModal(false);
      loadDocuments();
    } catch (error) {
      console.error('Error saving ARM link:', error);
      toast.error('Failed to save ARM link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ARM link?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sop_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('ARM link deleted');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting ARM link:', error);
      toast.error('Failed to delete ARM link');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: SOPDocument) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sop_documents')
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Link hidden' : 'Link activated');
      loadDocuments();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update link');
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
    return doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.file_url || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="ARM" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              ARM Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage ARM program links and resources — each item opens as an external link in the Advisor Portal
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
              Add Link
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Links appear under Resources &gt; ARM in the Advisor Portal. Each card opens the URL in a new tab.
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ARM links..."
            className="pl-10"
          />
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  ARM Links
                </span>
                <Badge variant="secondary">{filteredDocs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDocs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No ARM links found
                </p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="arm">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {filteredDocs.map((doc, index) => (
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

                                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                                  <Link2 className="w-5 h-5 text-violet-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{doc.title}</span>
                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                  </div>
                                  <p className="text-sm text-gray-500 truncate">
                                    {doc.file_url ? extractDomain(doc.file_url) : 'No URL set'}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>

                                {doc.file_url && (
                                  <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden sm:flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 whitespace-nowrap"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open
                                  </a>
                                )}

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
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit ARM Link' : 'Add ARM Link'}
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
                    placeholder="e.g., ARM Portal Login"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL *
                  </label>
                  <Input
                    value={form.file_url || ''}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    placeholder="https://example.com/arm-resource"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The URL advisors will be taken to when they click this card
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description shown on the card..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image / Thumbnail URL
                  </label>
                  <Input
                    value={form.image_url || ''}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://... (optional card thumbnail)"
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

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-violet-900">&times;</button>
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
