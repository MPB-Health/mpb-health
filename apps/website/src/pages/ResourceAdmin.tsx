import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, Resource, ResourceType, TargetAudience, ResourceTopic } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { AdminLayout } from '../components/admin/AdminLayout';
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { ImageUploader } from '../components/admin/ImageUploader';

export const ResourceAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [_topics, setTopics] = useState<ResourceTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    resource_type: 'Guide' as ResourceType,
    target_audience: 'All' as TargetAudience,
    topics: [] as string[],
    featured_image_url: '',
    file_url: '',
    is_featured: false,
    is_published: false,
  });

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchResources();
    fetchTopics();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setNotification({ type: 'error', message: 'Failed to load resources' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_topics')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      if (editingId) {
        console.log('[ResourceAdmin] Updating resource:', editingId);
        const { data, error } = await supabase
          .from('resource_library')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .select();

        console.log('[ResourceAdmin] Update response:', { data, error });

        if (error) throw error;
        setNotification({ type: 'success', message: `Resource "${formData.title}" updated successfully!` });
      } else {
        console.log('[ResourceAdmin] Creating new resource');
        const { data, error } = await supabase
          .from('resource_library')
          .insert([formData])
          .select();

        console.log('[ResourceAdmin] Insert response:', { data, error });

        if (error) throw error;
        setNotification({ type: 'success', message: `Resource "${formData.title}" created successfully!` });
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchResources();
    } catch (error: any) {
      console.error('Error saving resource:', error);
      setNotification({ type: 'error', message: `Failed to save resource: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData({
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      content: resource.content,
      resource_type: resource.resource_type,
      target_audience: resource.target_audience,
      topics: resource.topics,
      featured_image_url: resource.featured_image_url,
      file_url: resource.file_url || '',
      is_featured: resource.is_featured,
      is_published: resource.is_published,
    });
    setEditingId(resource.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase.from('resource_library').delete().eq('id', id);

      if (error) throw error;
      setNotification({ type: 'success', message: 'Resource deleted successfully!' });
      fetchResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      setNotification({ type: 'error', message: `Failed to delete resource: ${error.message}` });
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('resource_library')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setNotification({ type: 'success', message: currentStatus ? 'Resource unpublished' : 'Resource published' });
      fetchResources();
    } catch (error) {
      console.error('Error toggling published status:', error);
      setNotification({ type: 'error', message: 'Failed to update publish status' });
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('resource_library')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setNotification({ type: 'success', message: currentStatus ? 'Resource unfeatured' : 'Resource featured' });
      fetchResources();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      setNotification({ type: 'error', message: 'Failed to update featured status' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      content: '',
      resource_type: 'Guide',
      target_audience: 'All',
      topics: [],
      featured_image_url: '',
      file_url: '',
      is_featured: false,
      is_published: false,
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <AdminLayout activeView="resources" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Resource Admin | MPB Health</title>
      </Helmet>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Resource Management</h1>
            <p className="text-neutral-600 mt-1">Manage resource library content</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setEditingId(null);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Resource
          </Button>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-12">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4">
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {editingId ? 'Edit Resource' : 'New Resource'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: editingId ? formData.slug : generateSlug(e.target.value),
                        });
                      }}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      URL: /resources/{formData.slug || 'your-resource-slug'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your resource content..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Resource Type"
                    value={formData.resource_type}
                    onChange={(e) =>
                      setFormData({ ...formData, resource_type: e.target.value as ResourceType })
                    }
                  >
                    <option value="Guide">Guide</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Checklist">Checklist</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Form">Form</option>
                    <option value="Document">Document</option>
                  </Select>

                  <Select
                    label="Target Audience"
                    value={formData.target_audience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_audience: e.target.value as TargetAudience,
                      })
                    }
                  >
                    <option value="All">All</option>
                    <option value="Members">Members</option>
                    <option value="Employers">Employers</option>
                    <option value="Advisors">Advisors</option>
                  </Select>
                </div>

                <ImageUploader
                  value={formData.featured_image_url}
                  onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
                  slug={formData.slug}
                  label="Featured Image"
                  showUrlInput={true}
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    File URL (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://example.com/file.pdf"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Link to a downloadable file (PDF, document, etc.)
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-700">Featured Resource</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-700">Published</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-200">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingId ? (
                      'Update Resource'
                    ) : (
                      'Create Resource'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-neutral-600 mt-2">Loading resources...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      No resources yet. Click "New Resource" to create one.
                    </td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {resource.is_featured && (
                            <Star className="h-4 w-4 text-amber-500 fill-current" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {resource.title}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {resource.view_count} views
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {resource.resource_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {resource.target_audience}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            resource.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {resource.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button
                          onClick={() => toggleFeatured(resource.id, resource.is_featured)}
                          className="text-amber-600 hover:text-amber-900"
                          title={resource.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star
                            className={`h-4 w-4 ${resource.is_featured ? 'fill-current' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => togglePublished(resource.id, resource.is_published)}
                          className="text-neutral-600 hover:text-neutral-900"
                          title={resource.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {resource.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(resource)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="text-accent hover:text-accent/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ResourceAdmin;
