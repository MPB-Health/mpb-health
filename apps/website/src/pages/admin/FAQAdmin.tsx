import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, MoveUp, MoveDown, HelpCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { sanitizeHtml } from '@mpbhealth/utils';

interface FAQItem {
  id: string;
  title: string;
  content_html: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FAQAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    content_html: '',
    category: 'why-choose-healthsharing',
    order_index: 1,
    is_active: true
  });

  useEffect(() => {
    loadFAQItems();
  }, [filterCategory]);

  const loadFAQItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('faq_items')
        .select('*')
        .order('category')
        .order('order_index');

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFaqItems(data || []);

      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading FAQ items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      title: '',
      content_html: '',
      category: 'why-choose-healthsharing',
      order_index: faqItems.length + 1,
      is_active: true
    });
  };

  const handleEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setIsCreating(false);
    setFormData({
      title: item.title,
      content_html: item.content_html,
      category: item.category,
      order_index: item.order_index,
      is_active: item.is_active
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('faq_items')
          .insert([formData]);

        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('faq_items')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      }

      setIsCreating(false);
      setEditingId(null);
      loadFAQItems();
    } catch (error) {
      console.error('Error saving FAQ item:', error);
      alert('Error saving FAQ item. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ item?')) return;

    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadFAQItems();
    } catch (error) {
      console.error('Error deleting FAQ item:', error);
      alert('Error deleting FAQ item. Please try again.');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      loadFAQItems();
    } catch (error) {
      console.error('Error toggling FAQ item status:', error);
    }
  };

  const handleMoveUp = async (item: FAQItem) => {
    const categoryItems = faqItems.filter(i => i.category === item.category);
    const currentIndex = categoryItems.findIndex(i => i.id === item.id);

    if (currentIndex <= 0) return;

    const prevItem = categoryItems[currentIndex - 1];

    try {
      await supabase
        .from('faq_items')
        .update({ order_index: prevItem.order_index })
        .eq('id', item.id);

      await supabase
        .from('faq_items')
        .update({ order_index: item.order_index })
        .eq('id', prevItem.id);

      loadFAQItems();
    } catch (error) {
      console.error('Error reordering items:', error);
    }
  };

  const handleMoveDown = async (item: FAQItem) => {
    const categoryItems = faqItems.filter(i => i.category === item.category);
    const currentIndex = categoryItems.findIndex(i => i.id === item.id);

    if (currentIndex >= categoryItems.length - 1) return;

    const nextItem = categoryItems[currentIndex + 1];

    try {
      await supabase
        .from('faq_items')
        .update({ order_index: nextItem.order_index })
        .eq('id', item.id);

      await supabase
        .from('faq_items')
        .update({ order_index: item.order_index })
        .eq('id', nextItem.id);

      loadFAQItems();
    } catch (error) {
      console.error('Error reordering items:', error);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: '',
      content_html: '',
      category: 'why-choose-healthsharing',
      order_index: 1,
      is_active: true
    });
  };

  if (loading) {
    return (
      <AdminLayout activeView="faq" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-neutral-600">Loading FAQ management...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView="faq" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>FAQ Management - Admin - MPB Health</title>
        <meta name="description" content="Manage FAQ items and Why Choose HealthSharing content" />
      </Helmet>

      <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
                <HelpCircle className="h-10 w-10 text-blue-600" />
                FAQ Management
              </h1>
              <p className="text-lg text-neutral-600">
                Manage FAQ items and "Why Choose HealthSharing" content
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New FAQ
            </Button>
          </div>

          <div className="mb-6">
            <Label htmlFor="category-filter">Filter by Category</Label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="mt-1 block w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(isCreating || editingId) && (
            <Card className="p-6 mb-6 bg-white border-2 border-blue-500">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                {isCreating ? 'Create New FAQ Item' : 'Edit FAQ Item'}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter FAQ title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., why-choose-healthsharing"
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Suggested: why-choose-healthsharing, general, coverage, pricing
                  </p>
                </div>

                <div>
                  <Label htmlFor="content">Content (HTML)</Label>
                  <textarea
                    id="content"
                    value={formData.content_html}
                    onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                    placeholder="Enter HTML content... Use <p>, <strong>, <ul>, <li> tags"
                    rows={10}
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    HTML tags allowed: p, strong, em, ul, li, a
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      min={1}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <input
                      id="is-active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="is-active" className="cursor-pointer">
                      Active (Visible on Site)
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save FAQ Item
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="inline-flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {faqItems.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <HelpCircle className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No FAQ Items Found
                </h3>
                <p className="text-neutral-600 mb-6">
                  Get started by creating your first FAQ item
                </p>
                <Button onClick={handleCreate} className="inline-flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New FAQ
                </Button>
              </Card>
            ) : (
              faqItems.map(item => (
                <Card
                  key={item.id}
                  className={`p-6 bg-white ${!item.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {item.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                        {!item.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div
                        className="prose prose-sm text-neutral-600 max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content_html) }}
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        Order: {item.order_index} | Created: {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className="inline-flex items-center gap-2"
                      >
                        {item.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveUp(item)}
                          className="flex-1"
                          title="Move Up"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveDown(item)}
                          className="flex-1"
                          title="Move Down"
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
    </AdminLayout>
  );
};

export default FAQAdmin;
