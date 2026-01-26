import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Eye, Save, X, LogOut, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, BlogArticle } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { ImageUploader } from '../components/admin/ImageUploader';
import { AdminLayout } from '../components/admin/AdminLayout';

export const BlogAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category: 'Healthcare',
    author: 'MPB Health',
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
    fetchArticles();
  }, []);

  // Handle edit query parameter from URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && articles.length > 0 && !showForm) {
      const articleToEdit = articles.find(a => a.id === editId);
      if (articleToEdit) {
        handleEdit(articleToEdit);
        // Clear the query param after opening the form
        setSearchParams({});
      }
    }
  }, [searchParams, articles, showForm]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('created_at', { ascending: false });

      // Silently handle missing table - it will be created when migrations run
      if (error?.message?.includes('schema cache') || 
          error?.code === 'PGRST204' ||
          error?.code === 'PGRST205') {
        console.warn('blog_articles table not yet created - run migrations');
        setArticles([]);
        return;
      }
      if (error) throw error;
      if (data) setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
      alert('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'title' && !editingArticle) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[BlogAdmin] handleSubmit called', { editingArticle: editingArticle?.id, formData });

    setSaving(true);
    setNotification(null);

    try {
      if (editingArticle) {
        console.log('[BlogAdmin] Updating article:', editingArticle.id);
        const { data, error } = await supabase
          .from('blog_articles')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingArticle.id)
          .select();

        console.log('[BlogAdmin] Update response:', { data, error });

        if (error) throw error;
        setNotification({ type: 'success', message: `Article "${formData.title}" updated successfully!` });
      } else {
        console.log('[BlogAdmin] Creating new article');
        const { data, error } = await supabase
          .from('blog_articles')
          .insert([formData])
          .select();

        console.log('[BlogAdmin] Insert response:', { data, error });

        if (error) throw error;
        setNotification({ type: 'success', message: `Article "${formData.title}" created successfully!` });
      }

      resetForm();
      fetchArticles();
    } catch (error: any) {
      console.error('[BlogAdmin] Error saving article:', error);
      setNotification({ type: 'error', message: `Failed to save article: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: BlogArticle) => {
    console.log('[BlogAdmin] handleEdit called for article:', article.id, article.title);
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featured_image_url: article.featured_image_url,
      category: article.category,
      author: article.author,
      is_published: article.is_published,
    });
    console.log('[BlogAdmin] Form data set, opening form modal');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase.from('blog_articles').delete().eq('id', id);

      if (error) throw error;
      setNotification({ type: 'success', message: 'Article deleted successfully!' });
      fetchArticles();
    } catch (error: any) {
      console.error('[BlogAdmin] Error deleting article:', error);
      setNotification({ type: 'error', message: `Failed to delete article: ${error.message}` });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      category: 'Healthcare',
      author: 'MPB Health',
      is_published: false,
    });
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AdminLayout activeView="blog" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Blog Admin | MPB Health</title>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Blog Admin</h1>
              <p className="text-neutral-600 mt-2">Manage your blog articles</p>
              {user && (
                <p className="text-sm text-neutral-500 mt-1">
                  Signed in as: {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-5 w-5" />
                New Article
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-12">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4">
                <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {editingArticle ? 'Edit Article' : 'New Article'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
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
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      URL: /blog/{formData.slug || 'your-article-slug'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Excerpt *
                    </label>
                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
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
                      onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                      placeholder="Start writing your article content..."
                    />
                  </div>

                  <ImageUploader
                    value={formData.featured_image_url}
                    onChange={(url) => setFormData((prev) => ({ ...prev, featured_image_url: url }))}
                    slug={formData.slug}
                    label="Featured Image"
                    showUrlInput={true}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Healthcare">Healthcare</option>
                        <option value="Medical Cost Sharing">Medical Cost Sharing</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Nutrition">Nutrition</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Virtual Behavioral Health">Virtual Behavioral Health</option>
                        <option value="Preventive Care">Preventive Care</option>
                        <option value="Family Health">Family Health</option>
                        <option value="Event">Event</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Author
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_published"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="is_published" className="text-sm font-medium text-neutral-700">
                      Publish article (make visible to public)
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-neutral-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {editingArticle ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          {editingArticle ? 'Update Article' : 'Create Article'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-neutral-600">Loading articles...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
              <p className="text-neutral-600">No articles yet. Create your first article!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {article.featured_image_url && (
                            <img
                              src={article.featured_image_url.startsWith('http') ? article.featured_image_url : `/${article.featured_image_url.replace(/^\//, '')}`}
                              alt={article.title}
                              className="w-16 h-16 object-cover rounded mr-4"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-neutral-900 line-clamp-1">
                              {article.title}
                            </div>
                            <div className="text-sm text-neutral-500 line-clamp-1">
                              {article.excerpt}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {article.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            article.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {article.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(article.published_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/blog/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-neutral-600 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="View article"
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('[BlogAdmin] Edit button clicked for:', article.title);
                              handleEdit(article);
                            }}
                            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit article"
                            aria-label={`Edit ${article.title}`}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(article.id)}
                            className="p-2 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete article"
                            aria-label={`Delete ${article.title}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default BlogAdmin;
