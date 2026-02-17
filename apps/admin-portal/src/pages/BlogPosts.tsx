import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FileText,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Globe,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contentService, type BlogPost } from '@mpbhealth/admin-core';

export default function BlogPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsData, catsData] = await Promise.all([
          contentService.getBlogPosts({
            status: statusFilter || undefined,
            category: categoryFilter || undefined,
            search: searchQuery || undefined,
          }),
          contentService.getBlogCategories(),
        ]);
        setPosts(postsData);
        setCategories(catsData);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchQuery, statusFilter, categoryFilter]);

  const handlePublish = async (postId: string) => {
    try {
      await contentService.publishPost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: 'published', published_at: new Date().toISOString() }
            : p
        )
      );
      toast.success('Post published!');
    } catch (err) {
      toast.error('Failed to publish post');
    }
    setActiveMenu(null);
  };

  const handleUnpublish = async (postId: string) => {
    try {
      await contentService.unpublishPost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: 'draft', published_at: null } : p
        )
      );
      toast.success('Post unpublished');
    } catch (err) {
      toast.error('Failed to unpublish post');
    }
    setActiveMenu(null);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await contentService.deleteBlogPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      toast.error('Failed to delete post');
    }
    setActiveMenu(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'archived':
        return 'bg-surface-tertiary text-th-text-secondary';
      default:
        return 'bg-surface-tertiary text-th-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Blog Posts</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage your blog content
          </p>
        </div>
        <button
          onClick={() => navigate('/content/blog/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Post</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-th-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
          </div>
        ) : posts.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Views
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Date
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-tertiary">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={`Featured image for ${post.title}`}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-surface-tertiary rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-th-text-tertiary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-th-text-primary line-clamp-1">
                          {post.title}
                        </p>
                        {post.author_name && (
                          <p className="text-sm text-th-text-tertiary">
                            by {post.author_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-th-text-secondary">{post.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(
                        post.status
                      )}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1 text-sm text-th-text-tertiary">
                      <Eye className="w-4 h-4" />
                      <span>{post.view_count}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-th-text-tertiary">
                    {post.published_at
                      ? format(new Date(post.published_at), 'MMM d, yyyy')
                      : format(new Date(post.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(activeMenu === post.id ? null : post.id)
                        }
                        className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {activeMenu === post.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface-primary rounded-lg shadow-lg border border-th-border py-1 z-10">
                          <button
                            onClick={() => navigate(`/content/blog/${post.id}`)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-tertiary"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          {post.status === 'draft' ? (
                            <button
                              onClick={() => handlePublish(post.id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-tertiary"
                            >
                              <Globe className="w-4 h-4" />
                              <span>Publish</span>
                            </button>
                          ) : post.status === 'published' ? (
                            <button
                              onClick={() => handleUnpublish(post.id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-tertiary"
                            >
                              <EyeOff className="w-4 h-4" />
                              <span>Unpublish</span>
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No posts found</p>
            <button
              onClick={() => navigate('/content/blog/new')}
              className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
            >
              Create your first post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
