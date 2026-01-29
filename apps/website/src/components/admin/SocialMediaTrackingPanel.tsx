import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Heart,
  Users,
  TrendingUp,
  Filter,
  Search,
  HelpCircle,
  X,
  Check,
  AlertCircle,
  Hash,
  Calendar,
  FileText,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import {
  socialMediaStorage,
  SocialMediaPost,
  SocialMediaSummary,
  Platform,
  PostStatus,
  PostType,
  platformConfig,
  postTypeConfig,
  statusConfig,
} from '../../lib/socialMediaStorage';

const platforms: Platform[] = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
const postStatuses: PostStatus[] = ['draft', 'scheduled', 'published', 'archived'];
const postTypes: PostType[] = ['image', 'video', 'carousel', 'story', 'reel', 'text'];

const defaultPost: Omit<SocialMediaPost, 'id' | 'created_at' | 'updated_at'> = {
  platform: 'facebook',
  post_date: new Date().toISOString().split('T')[0],
  scheduled_time: '',
  status: 'draft',
  budget_spent: 0,
  impressions: 0,
  clicks: 0,
  engagement: 0,
  reach: 0,
  link_clicks: 0,
  post_type: 'image',
  content_description: '',
  utm_campaign: '',
  target_audience: '',
  ab_test_group: '',
};

export const SocialMediaTrackingPanel: React.FC = () => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [summary, setSummary] = useState<SocialMediaSummary | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [formData, setFormData] = useState(defaultPost);
  const [filters, setFilters] = useState({
    platform: '' as Platform | '',
    status: '' as PostStatus | '',
    search: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'post_date' | 'budget_spent' | 'impressions'>('post_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allPosts = socialMediaStorage.getPosts();
    setPosts(allPosts);
    setSummary(socialMediaStorage.getSummary());
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (editingPost) {
        socialMediaStorage.updatePost(editingPost.id, formData);
        setSuccessMessage('Post updated successfully!');
      } else {
        socialMediaStorage.createPost(formData);
        setSuccessMessage('Post added successfully!');
      }

      setFormData(defaultPost);
      setEditingPost(null);
      setShowForm(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save post');
    }
  };

  const handleEdit = (post: SocialMediaPost) => {
    setEditingPost(post);
    setFormData({
      platform: post.platform,
      post_date: post.post_date,
      scheduled_time: post.scheduled_time || '',
      status: post.status,
      budget_spent: post.budget_spent,
      impressions: post.impressions,
      clicks: post.clicks,
      engagement: post.engagement,
      reach: post.reach,
      link_clicks: post.link_clicks,
      post_type: post.post_type,
      content_description: post.content_description,
      utm_campaign: post.utm_campaign || '',
      target_audience: post.target_audience || '',
      ab_test_group: post.ab_test_group || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      socialMediaStorage.deletePost(id);
      setSuccessMessage('Post deleted successfully!');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleExport = () => {
    socialMediaStorage.downloadCSV();
    setSuccessMessage('CSV exported successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = socialMediaStorage.importFromCSV(content);

      if (result.errors.length > 0) {
        setErrorMessage(`Imported ${result.imported} posts with ${result.errors.length} errors`);
      } else {
        setSuccessMessage(`Successfully imported ${result.imported} posts!`);
      }

      loadData();
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setFormData(defaultPost);
  };

  const getFilteredAndSortedPosts = () => {
    let filtered = posts;

    if (filters.platform) {
      filtered = filtered.filter((p) => p.platform === filters.platform);
    }
    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content_description.toLowerCase().includes(searchLower) ||
          p.utm_campaign?.toLowerCase().includes(searchLower) ||
          p.target_audience?.toLowerCase().includes(searchLower)
      );
    }

    return [...filtered].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Social Media Tracker</h2>
          <p className="text-neutral-600">Track posts, budgets, and performance across platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 text-sm font-medium transition-colors">
              <Upload className="h-4 w-4" />
              Import CSV
            </span>
          </label>
          <Button onClick={handleExport} variant="secondary" className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Post
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Instructions Panel */}
      <Card className="border-l-4 border-l-indigo-500">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-neutral-900">How to Use This Tracker</span>
          </div>
          {showInstructions ? (
            <ChevronUp className="h-5 w-5 text-neutral-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          )}
        </button>
        {showInstructions && (
          <div className="px-6 pb-6 space-y-4 text-sm text-neutral-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-indigo-600" /> Adding Posts
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                  <li>Click "Add Post" to open the entry form</li>
                  <li>Select the platform (Facebook, Instagram, etc.)</li>
                  <li>Enter the post date and optional scheduled time</li>
                  <li>Fill in budget, metrics, and content details</li>
                  <li>Use UTM Campaign to link to your marketing campaigns</li>
                  <li>Click "Save Post" when done</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" /> Tracking Metrics
                </h4>
                <ul className="space-y-1 text-neutral-600">
                  <li><strong>Budget Spent:</strong> Ad spend for this post</li>
                  <li><strong>Impressions:</strong> Times the post was shown</li>
                  <li><strong>Reach:</strong> Unique users who saw the post</li>
                  <li><strong>Clicks:</strong> Total clicks on the post</li>
                  <li><strong>Link Clicks:</strong> Clicks specifically on links</li>
                  <li><strong>Engagement:</strong> Likes, comments, shares combined</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-600" /> Exporting Data
                </h4>
                <ul className="space-y-1 text-neutral-600">
                  <li>Click "Export CSV" to download all posts</li>
                  <li>Open in Excel, Google Sheets, or Numbers</li>
                  <li>Use for reporting, analysis, or backup</li>
                  <li>Import edited CSV to update data in bulk</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-indigo-600" /> Filtering & Sorting
                </h4>
                <ul className="space-y-1 text-neutral-600">
                  <li>Use filters to view specific platforms or statuses</li>
                  <li>Search by content, UTM campaign, or audience</li>
                  <li>Click column headers to sort the table</li>
                  <li>Combine filters for detailed analysis</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-indigo-800">
                <strong>Note:</strong> Data is stored locally in your browser. Export regularly to backup your data or share with team members.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid md:grid-cols-5 gap-4">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-900">Total Budget</span>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              ${summary.totalBudget.toLocaleString()}
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Impressions</span>
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {summary.totalImpressions.toLocaleString()}
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Total Clicks</span>
              <MousePointerClick className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {summary.totalClicks.toLocaleString()}
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-pink-900">Engagement</span>
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div className="text-2xl font-bold text-pink-900">
              {summary.totalEngagement.toLocaleString()}
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-violet-900">Total Posts</span>
              <Hash className="h-5 w-5 text-violet-600" />
            </div>
            <div className="text-2xl font-bold text-violet-900">{summary.totalPosts}</div>
          </Card>
        </div>
      )}

      {/* Platform Breakdown */}
      {summary && summary.totalPosts > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Posts by Platform
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {platforms.map((platform) => {
              const count = summary.postsByPlatform[platform];
              const config = platformConfig[platform];
              return (
                <div
                  key={platform}
                  className={`p-3 rounded-lg ${config.bgColor} text-center`}
                >
                  <div className={`text-2xl font-bold ${config.color}`}>{count}</div>
                  <div className="text-xs text-neutral-600">{config.name}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingPost ? 'Edit Post' : 'Add New Post'}
              </h3>
              <button onClick={cancelForm} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Platform *
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {platformConfig[p].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Post Type *
                  </label>
                  <select
                    name="post_type"
                    value={formData.post_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {postTypes.map((pt) => (
                      <option key={pt} value={pt}>
                        {postTypeConfig[pt]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {postStatuses.map((s) => (
                      <option key={s} value={s}>
                        {statusConfig[s].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Budget Spent ($)
                  </label>
                  <input
                    type="number"
                    name="budget_spent"
                    value={formData.budget_spent}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Post Date *
                  </label>
                  <input
                    type="date"
                    name="post_date"
                    value={formData.post_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Impressions
                    </label>
                    <input
                      type="number"
                      name="impressions"
                      value={formData.impressions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Reach</label>
                    <input
                      type="number"
                      name="reach"
                      value={formData.reach}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Clicks</label>
                    <input
                      type="number"
                      name="clicks"
                      value={formData.clicks}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Link Clicks
                    </label>
                    <input
                      type="number"
                      name="link_clicks"
                      value={formData.link_clicks}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Engagement
                    </label>
                    <input
                      type="number"
                      name="engagement"
                      value={formData.engagement}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Content Details */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Content Description
                </label>
                <textarea
                  name="content_description"
                  value={formData.content_description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Brief description of the post content..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Campaign Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    UTM Campaign
                  </label>
                  <input
                    type="text"
                    name="utm_campaign"
                    value={formData.utm_campaign}
                    onChange={handleInputChange}
                    placeholder="e.g., summer_sale_2024"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    placeholder="e.g., 25-45 year olds"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    A/B Test Group
                  </label>
                  <input
                    type="text"
                    name="ab_test_group"
                    value={formData.ab_test_group}
                    onChange={handleInputChange}
                    placeholder="e.g., Variant A"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button type="button" variant="secondary" onClick={cancelForm}>
                  Cancel
                </Button>
                <Button type="submit" className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {editingPost ? 'Update Post' : 'Save Post'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          <select
            value={filters.platform}
            onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value as Platform | '' }))}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {platformConfig[p].name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as PostStatus | '' }))}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Statuses</option>
            {postStatuses.map((s) => (
              <option key={s} value={s}>
                {statusConfig[s].name}
              </option>
            ))}
          </select>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search content, UTM, audience..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          {(filters.platform || filters.status || filters.search) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ platform: '', status: '', search: '' })}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Posts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Platform
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => toggleSort('post_date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortBy === 'post_date' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Type
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => toggleSort('budget_spent')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Budget
                    {sortBy === 'budget_spent' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => toggleSort('impressions')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Impr.
                    {sortBy === 'impressions' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Engage.
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {getFilteredAndSortedPosts().length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-neutral-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <p className="text-lg font-medium">No posts yet</p>
                    <p className="text-sm">Click "Add Post" to start tracking your social media content</p>
                  </td>
                </tr>
              ) : (
                getFilteredAndSortedPosts().map((post) => {
                  const platformCfg = platformConfig[post.platform];
                  const statusCfg = statusConfig[post.status];
                  return (
                    <tr key={post.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${platformCfg.bgColor} ${platformCfg.color}`}>
                          {platformCfg.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {new Date(post.post_date).toLocaleDateString()}
                        {post.scheduled_time && (
                          <span className="text-neutral-500 ml-1">{post.scheduled_time}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bgColor} ${statusCfg.color}`}>
                          {statusCfg.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {postTypeConfig[post.post_type]}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900 text-right font-medium">
                        ${post.budget_spent.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900 text-right">
                        {post.impressions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900 text-right">
                        {post.clicks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900 text-right">
                        {post.engagement.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">
                        {post.content_description || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(post)}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-indigo-600"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {getFilteredAndSortedPosts().length > 0 && (
          <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 text-sm text-neutral-600">
            Showing {getFilteredAndSortedPosts().length} of {posts.length} posts
          </div>
        )}
      </Card>
    </div>
  );
};

