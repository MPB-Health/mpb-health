import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Send,
  Mail,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Textarea } from '../../../components/ui/Textarea';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { ImageUploader } from '../../../components/admin/ImageUploader';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { bulletinNotificationService, type BulletinNotification } from '../../../lib/bulletinNotificationService';

// ============================================================================
// Types
// ============================================================================

interface Bulletin {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_type: string;
  category_id: string | null;
  category?: { id: string; name: string; slug: string };
  published_date: string;
  featured_image_url: string | null;
  is_published: boolean;
  view_count: number;
  notification_sent_at: string | null;
  notification_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function BulletinsManager() {
  const navigate = useNavigate();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Bulletin | null>(null);
  const [form, setForm] = useState<Partial<Bulletin>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bulletinsResult, categoriesResult] = await Promise.all([
        supabase
          .from('advisor_content')
          .select(`
            *,
            category:advisor_content_categories(id, name, slug)
          `)
          .eq('content_type', 'bulletin')
          .order('published_date', { ascending: false }),
        supabase
          .from('advisor_content_categories')
          .select('id, name, slug')
          .order('display_order', { ascending: true }),
      ]);

      if (bulletinsResult.error) throw bulletinsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setBulletins(bulletinsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error loading bulletins:', error);
      toast.error('Failed to load bulletins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      content_type: 'bulletin',
      category_id: categories[0]?.id || null,
      is_published: false,
      featured_image_url: null,
    });
    setShowModal(true);
  };

  const handleEdit = (item: Bulletin) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.title);

      if (editingItem) {
        const { error } = await supabase
          .from('advisor_content')
          .update({
            title: form.title,
            slug,
            excerpt: form.excerpt || '',
            content: form.content,
            category_id: form.category_id,
            is_published: form.is_published,
            featured_image_url: form.featured_image_url,
            published_date: form.is_published ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Bulletin updated! Changes are live in Advisor Portal.');
      } else {
        const { error } = await supabase
          .from('advisor_content')
          .insert({
            title: form.title,
            slug,
            excerpt: form.excerpt || '',
            content: form.content,
            content_type: 'bulletin',
            category_id: form.category_id,
            is_published: form.is_published ?? false,
            featured_image_url: form.featured_image_url,
            published_date: form.is_published ? new Date().toISOString() : null,
          });

        if (error) throw error;
        toast.success('Bulletin created! Now visible in Advisor Portal.');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving bulletin:', error);
      toast.error('Failed to save bulletin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bulletin?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Bulletin deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting bulletin:', error);
      toast.error('Failed to delete bulletin');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item: Bulletin) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_content')
        .update({
          is_published: !item.is_published,
          published_date: !item.is_published ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_published ? 'Bulletin unpublished' : 'Bulletin published!');
      loadData();
    } catch (error) {
      console.error('Error toggling publish state:', error);
      toast.error('Failed to update bulletin');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNotification = async (bulletin: Bulletin) => {
    if (!bulletin.is_published) {
      toast.error('Publish the bulletin first before sending notifications');
      return;
    }

    setSendingNotification(bulletin.id);
    try {
      await bulletinNotificationService.sendBulletinNotification(
        bulletin.id,
        bulletin.title,
        bulletin.excerpt || '',
        bulletin.slug
      );
      toast.success('Notification sent to all advisors!');
      loadData();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSendingNotification(null);
    }
  };

  // Filter bulletins
  const filteredBulletins = bulletins.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && b.is_published) ||
      (filterStatus === 'draft' && !b.is_published);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Bulletins Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Bulletins Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Create and publish bulletins for advisors
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
              New Bulletin
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Published bulletins appear immediately in Advisor Portal &gt; Bulletins
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bulletins..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Bulletins List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bulletins ({filteredBulletins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filteredBulletins.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bulletins found</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Bulletin
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBulletins.map((bulletin) => (
                  <div
                    key={bulletin.id}
                    className={cn(
                      'flex items-start gap-4 p-4 border rounded-lg',
                      bulletin.is_published ? 'bg-white' : 'bg-gray-50'
                    )}
                  >
                    {bulletin.featured_image_url && (
                      <img
                        src={bulletin.featured_image_url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {bulletin.title}
                        </h3>
                        <Badge variant={bulletin.is_published ? 'default' : 'secondary'}>
                          {bulletin.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {bulletin.category && (
                          <Badge variant="outline">{bulletin.category.name}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {bulletin.excerpt || 'No excerpt'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(bulletin.published_date || bulletin.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {bulletin.view_count} views
                        </span>
                        {bulletin.notification_sent_at && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Mail className="w-3 h-3" />
                            Notified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendNotification(bulletin)}
                        disabled={sendingNotification === bulletin.id || !bulletin.is_published}
                        title="Send email notification to advisors"
                      >
                        {sendingNotification === bulletin.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(bulletin)}
                        title={bulletin.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {bulletin.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bulletin)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bulletin.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Bulletin' : 'Create Bulletin'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={form.title || ''}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        title: e.target.value,
                        slug: form.slug || generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Bulletin title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <Input
                    value={form.slug || ''}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="bulletin-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category_id || ''}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                  </label>
                  <Textarea
                    value={form.excerpt || ''}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <RichTextEditor
                    content={form.content || ''}
                    onChange={(html) => setForm({ ...form, content: html })}
                    placeholder="Bulletin content..."
                    minHeight="200px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image
                  </label>
                  <ImageUploader
                    value={form.featured_image_url || ''}
                    onChange={(url) => setForm({ ...form, featured_image_url: url })}
                    slug={form.slug || 'bulletin'}
                    label="Featured Image"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_published === true}
                      onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    />
                    <span className="text-sm">Publish immediately</span>
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
