import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Globe, Eye } from 'lucide-react';
import { contentService, type BlogPost } from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

export default function BlogEditor() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();
  const isNew = !postId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [] as string[],
    featured_image: '',
    status: 'draft' as BlogPost['status'],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        const post = await contentService.getBlogPost(postId);
        if (post) {
          setFormData({
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt || '',
            category: post.category,
            tags: post.tags || [],
            featured_image: post.featured_image || '',
            status: post.status,
          });
        }
      } catch (err) {
        toast.error('Failed to load post');
        navigate('/content/blog');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, navigate]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSave = async (publish = false) => {
    if (!formData.title || !formData.content || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        author_id: user?.id || null,
        author_name: user ? `${user.first_name} ${user.last_name}` : null,
        status: publish ? 'published' : formData.status,
        published_at: publish ? new Date().toISOString() : null,
      };

      if (isNew) {
        await contentService.createBlogPost(postData as any);
        toast.success(publish ? 'Post published!' : 'Post saved as draft');
      } else {
        await contentService.updateBlogPost(postId, postData as any);
        if (publish && formData.status !== 'published') {
          await contentService.publishPost(postId);
        }
        toast.success('Post updated!');
      }

      navigate('/content/blog');
    } catch (err) {
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/content/blog')}
          className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Posts</span>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title..."
            className="w-full text-3xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            URL Slug
          </label>
          <div className="flex items-center">
            <span className="text-th-text-tertiary text-sm">/blog/</span>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="flex-1 px-2 py-1 text-sm bg-transparent border-0 border-b border-th-border focus:outline-none focus:border-th-accent-500 text-th-text-primary"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Category *
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            placeholder="e.g., Health Tips, News, Guides"
            className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-th-accent-100 dark:bg-th-accent-900/30 text-th-accent-700 dark:text-th-accent-300 rounded-full text-sm flex items-center space-x-1"
              >
                <span>{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="text-th-accent-500 hover:text-th-accent-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="flex-1 px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
            />
            <button
              onClick={addTag}
              className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Featured Image URL
          </label>
          <input
            type="url"
            value={formData.featured_image}
            onChange={(e) =>
              setFormData({ ...formData, featured_image: e.target.value })
            }
            placeholder="https://..."
            className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
          {formData.featured_image && (
            <img
              src={formData.featured_image}
              alt="Preview"
              className="mt-2 w-full max-w-md h-48 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Excerpt
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) =>
              setFormData({ ...formData, excerpt: e.target.value })
            }
            placeholder="Brief summary of the post..."
            rows={2}
            className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="Write your post content here... (Markdown supported)"
            rows={20}
            className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 font-mono text-sm text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
      </div>
    </div>
  );
}
