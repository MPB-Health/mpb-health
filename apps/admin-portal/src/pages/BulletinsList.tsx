import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Calendar,
  BarChart3,
  FileText,
  Loader2,
  Newspaper,
  Filter,
} from 'lucide-react';
import {
  bulletinService,
  type AdminBulletin,
  type BulletinCategory,
} from '@mpbhealth/admin-core';

export default function BulletinsList() {
  const navigate = useNavigate();
  const [bulletins, setBulletins] = useState<AdminBulletin[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, totalViews: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bulletinsData, categoriesData, statsData] = await Promise.all([
        bulletinService.getBulletins(),
        bulletinService.getCategories(),
        bulletinService.getStats(),
      ]);
      setBulletins(bulletinsData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading bulletins:', error);
      toast.error('Failed to load bulletins');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bulletin? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await bulletinService.deleteBulletin(id);
      toast.success('Bulletin deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting bulletin:', error);
      toast.error('Failed to delete bulletin');
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (bulletin: AdminBulletin) => {
    try {
      await bulletinService.togglePublish(bulletin.id);
      toast.success(bulletin.is_published ? 'Bulletin unpublished' : 'Bulletin published!');
      loadData();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update bulletin');
    }
  };

  const handleToggleFeatured = async (bulletin: AdminBulletin) => {
    try {
      await bulletinService.toggleFeatured(bulletin.id);
      toast.success(bulletin.is_featured ? 'Removed from featured' : 'Added to featured slider!');
      loadData();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update bulletin');
    }
  };

  // Client-side filtering
  const filteredBulletins = bulletins.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && b.is_published) ||
      (filterStatus === 'draft' && !b.is_published);
    const matchesCategory = !filterCategory || b.category_id === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Bulletins</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage advisor bulletins and announcements
          </p>
        </div>
        <button
          onClick={() => navigate('/content/bulletins/new')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Bulletin</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bulletins', value: stats.total, icon: FileText, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Published', value: stats.published, icon: Eye, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Drafts', value: stats.draft, icon: EyeOff, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
          { label: 'Total Views', value: stats.totalViews, icon: BarChart3, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{stat.value}</p>
              <p className="text-sm text-th-text-tertiary">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sync Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-green-800 dark:text-green-300">
          Published bulletins appear instantly in the Advisor Portal
        </span>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bulletins..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-th-accent-600 text-white'
                  : 'bg-surface-primary border border-th-border text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
            <select
              aria-label="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulletins Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {filteredBulletins.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No bulletins found</h3>
            <p className="text-th-text-tertiary mb-6">
              {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first bulletin to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/content/bulletins/new')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Bulletin</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {filteredBulletins.map((bulletin) => (
              <div
                key={bulletin.id}
                className="flex items-start gap-4 p-5 hover:bg-surface-secondary transition-colors group"
              >
                {/* Featured Image Thumbnail */}
                {bulletin.featured_image_url ? (
                  <img
                    src={bulletin.featured_image_url}
                    alt={`Featured image for ${bulletin.title}`}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-surface-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-8 h-8 text-th-text-tertiary" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3
                      className="font-semibold text-th-text-primary truncate cursor-pointer hover:text-th-accent-600 transition-colors"
                      onClick={() => navigate(`/content/bulletins/${bulletin.id}`)}
                    >
                      {bulletin.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        bulletin.is_published
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {bulletin.is_published ? 'Published' : 'Draft'}
                    </span>
                    {bulletin.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Featured
                      </span>
                    )}
                    {bulletin.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                        {bulletin.category.name}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-th-text-secondary line-clamp-2 mb-2">
                    {bulletin.excerpt || 'No excerpt'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-th-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {bulletin.published_date
                        ? format(new Date(bulletin.published_date), 'MMM d, yyyy')
                        : format(new Date(bulletin.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {bulletin.view_count} views
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleFeatured(bulletin)}
                    title={bulletin.is_featured ? 'Remove from featured' : 'Add to featured slider'}
                    className={`p-2 rounded-lg transition-colors ${
                      bulletin.is_featured
                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary'
                    }`}
                  >
                    {bulletin.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleTogglePublish(bulletin)}
                    title={bulletin.is_published ? 'Unpublish' : 'Publish'}
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    {bulletin.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => navigate(`/content/bulletins/${bulletin.id}`)}
                    title="Edit"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bulletin.id)}
                    title="Delete"
                    disabled={deleting === bulletin.id}
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === bulletin.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
