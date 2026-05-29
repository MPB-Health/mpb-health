import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Globe,
  Calendar,
  Search as SearchIcon,
  ChevronRight,
  Loader2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { contentService, revisionService, type BlogPost } from '@mpbhealth/admin-core';
import { useAuth } from '../../../contexts/AuthContext';
import RichTextEditor from '../../../components/admin/RichTextEditor';
import { ImageUploader } from '../../../components/admin/cms/ImageUploader';
import { RevisionHistory } from '../../../components/admin/cms/RevisionHistory';

export default function CmsBlogEditor() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !postId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'history'>('content');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [] as string[],
    featured_image_url: '',
    is_published: false,
    scheduled_publish_at: '',
    seo_title: '',
    seo_description: '',
    focus_keyphrase: '',
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
            featured_image_url: post.featured_image_url || '',
            is_published: post.is_published,
            scheduled_publish_at: (post as any).scheduled_publish_at || '',
            seo_title: (post as any).seo_title || '',
            seo_description: (post as any).seo_description || '',
            focus_keyphrase: (post as any).focus_keyphrase || '',
          });
        }
      } catch {
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
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const estimatedReadTime = useMemo(() => {
    const words = formData.content.replace(/<[^>]+>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [formData.content]);

  const handleSave = async (publish = false) => {
    if (!formData.title || !formData.content || !formData.category) {
      toast.error('Please fill in title, content, and category');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        author_id: user?.id || null,
        author: user?.user_metadata?.full_name || user?.email || null,
        is_published: publish ? true : formData.is_published,
        published_date: publish ? new Date().toISOString() : null,
      };

      let savedId = postId;
      if (isNew) {
        const result = await contentService.createBlogPost(postData as any);
        savedId = (result as any)?.id || postId;
        toast.success(publish ? 'Post published!' : 'Post saved as draft');
      } else {
        await contentService.updateBlogPost(postId, postData as any);
        if (publish && !formData.is_published) {
          await contentService.publishPost(postId);
        }
        toast.success('Post updated!');
      }

      if (savedId) {
        await revisionService.saveRevision('blog_post', savedId, postData as any, {
          change_summary: publish ? 'Published' : 'Draft saved',
          changed_by: user?.id || null,
        });
      }

      navigate('/content/blog');
    } catch {
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRevision = (snapshot: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      title: (snapshot.title as string) || prev.title,
      content: (snapshot.content as string) || prev.content,
      excerpt: (snapshot.excerpt as string) || prev.excerpt,
      category: (snapshot.category as string) || prev.category,
      tags: (snapshot.tags as string[]) || prev.tags,
      featured_image_url: (snapshot.featured_image_url as string) || prev.featured_image_url,
    }));
  };

  const inputClass =
    'w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/content/blog')}
          className="flex items-center gap-2 text-th-text-secondary hover:text-th-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Posts</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-th-text-tertiary flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {estimatedReadTime} min read
          </span>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title..."
              className="w-full text-3xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary"
            />
            <div className="flex items-center gap-2 mt-3 text-sm text-th-text-tertiary">
              <span>/blog/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="flex-1 px-2 py-1 bg-transparent border-0 border-b border-th-border focus:outline-none focus:border-th-accent-500 text-th-text-primary text-sm"
              />
            </div>
          </div>

          {/* Rich text content */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="block text-sm font-medium text-th-text-secondary mb-3">Content</label>
            <RichTextEditor
              content={formData.content}
              onChange={(html: string) => setFormData((prev) => ({ ...prev, content: html }))}
              placeholder="Write your blog post content..."
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-th-border bg-surface-primary rounded-t-xl overflow-hidden">
            {(['content', 'seo', 'history'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                    : 'text-th-text-tertiary hover:text-th-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'content' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-4 space-y-4">
              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">Featured Image</label>
                <ImageUploader
                  value={formData.featured_image_url}
                  onChange={(url) => setFormData((prev) => ({ ...prev, featured_image_url: url }))}
                  slug={formData.slug || 'blog'}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Health Tips"
                  className={inputClass}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-th-accent-100 dark:bg-th-accent-900/30 text-th-accent-700 dark:text-th-accent-300 rounded-full text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-th-accent-500 hover:text-th-accent-700">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag…"
                    className={`${inputClass} text-sm`}
                  />
                  <button onClick={addTag} className="px-3 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-tertiary">
                    Add
                  </button>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary…"
                  rows={3}
                  className={inputClass}
                />
              </div>

              {/* Scheduling */}
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Schedule publish
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_publish_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_publish_at: e.target.value })}
                  className={`${inputClass} text-sm`}
                />
                <p className="text-xs text-th-text-tertiary mt-1">
                  Leave empty to publish immediately when you click Publish.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-4 space-y-4">
              <h4 className="text-sm font-semibold text-th-text-primary flex items-center gap-2">
                <SearchIcon className="w-4 h-4" />
                SEO Settings
              </h4>

              {/* SEO Preview */}
              <div className="bg-surface-secondary rounded-lg p-3 border border-th-border">
                <p className="text-sm font-medium text-blue-700 truncate">
                  {formData.seo_title || formData.title || 'Page title'}
                </p>
                <p className="text-xs text-green-700 truncate mt-0.5">
                  mpb.health/blog/{formData.slug || 'post-slug'}
                </p>
                <p className="text-xs text-th-text-secondary mt-1 line-clamp-2">
                  {formData.seo_description || formData.excerpt || 'Page description will appear here…'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">SEO Title</label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder={formData.title || 'Override page title for search'}
                  className={inputClass}
                />
                <SeoCharHint value={formData.seo_title || formData.title} limit={60} />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Meta Description</label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="Brief description for search results…"
                  rows={3}
                  className={inputClass}
                />
                <SeoCharHint value={formData.seo_description} limit={160} />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Focus Keyphrase</label>
                <input
                  type="text"
                  value={formData.focus_keyphrase}
                  onChange={(e) => setFormData({ ...formData, focus_keyphrase: e.target.value })}
                  placeholder="e.g., health sharing plans"
                  className={inputClass}
                />
              </div>

              {formData.focus_keyphrase && (
                <SeoScorecard
                  title={formData.seo_title || formData.title}
                  description={formData.seo_description}
                  content={formData.content}
                  keyphrase={formData.focus_keyphrase}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && postId && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-4">
              <RevisionHistory
                entityType="blog_post"
                entityId={postId}
                onRestore={handleRestoreRevision}
              />
            </div>
          )}

          {activeTab === 'history' && !postId && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-4 text-center text-sm text-th-text-tertiary">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Save the post first to start tracking revisions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeoCharHint({ value, limit }: { value: string; limit: number }) {
  const count = value.length;
  const over = count > limit;
  const near = !over && count > limit * 0.9;
  const color = over ? 'text-amber-600' : near ? 'text-amber-500' : 'text-th-text-tertiary';
  return (
    <p className={`text-xs mt-1 ${color}`}>
      {over
        ? `${count} chars — Google may truncate after ${limit} (no input limit)`
        : `${count} / ${limit} chars — SEO recommendation only`}
    </p>
  );
}

function SeoScorecard({
  title,
  description,
  content,
  keyphrase,
}: {
  title: string;
  description: string;
  content: string;
  keyphrase: string;
}) {
  const plainContent = content.replace(/<[^>]+>/g, '').toLowerCase();
  const kp = keyphrase.toLowerCase();

  const checks = [
    {
      label: 'Keyphrase in title',
      pass: title.toLowerCase().includes(kp),
    },
    {
      label: 'Keyphrase in meta description',
      pass: description.toLowerCase().includes(kp),
    },
    {
      label: 'Keyphrase in content',
      pass: plainContent.includes(kp),
    },
    {
      label: 'Meta description length',
      pass: description.length >= 50 && description.length <= 160,
    },
    {
      label: 'Title length',
      pass: title.length >= 30 && title.length <= 60,
    },
    {
      label: 'Content length (300+ words)',
      pass: plainContent.split(/\s+/).length >= 300,
    },
  ];

  const score = checks.filter((c) => c.pass).length;

  return (
    <div className="space-y-2 pt-3 border-t border-th-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-th-text-primary">SEO Score</span>
        <span className={`text-sm font-bold ${score >= 5 ? 'text-emerald-600' : score >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
          {score}/{checks.length}
        </span>
      </div>
      <div className="space-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${check.pass ? 'bg-emerald-500' : 'bg-rose-400'}`} />
            <span className={check.pass ? 'text-th-text-secondary' : 'text-rose-600'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
