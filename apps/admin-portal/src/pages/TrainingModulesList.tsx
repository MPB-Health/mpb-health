import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Loader2,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react';
import {
  trainingAdminService,
  type AdminTrainingModule,
  type TrainingAdminStats,
} from '@mpbhealth/admin-core';

export default function TrainingModulesList() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AdminTrainingModule[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [stats, setStats] = useState<TrainingAdminStats>({ total: 0, active: 0, inactive: 0, required: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesData, categoriesData, statsData] = await Promise.all([
        trainingAdminService.getModules(),
        trainingAdminService.getCategories(),
        trainingAdminService.getStats(),
      ]);
      setModules(modulesData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading training modules:', error);
      toast.error('Failed to load training modules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (module: AdminTrainingModule) => {
    try {
      await trainingAdminService.toggleActive(module.id);
      toast.success(module.is_active ? 'Module deactivated' : 'Module activated');
      loadData();
    } catch (error) {
      console.error('Error toggling module:', error);
      toast.error('Failed to update module');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training module? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await trainingAdminService.deleteModule(id);
      toast.success('Module deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = modules.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || m.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && m.is_active) ||
      (filterStatus === 'inactive' && !m.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const contentTypeLabel = (type: AdminTrainingModule['content_type']) => {
    const labels: Record<AdminTrainingModule['content_type'], string> = {
      video: 'Video',
      document: 'Document',
      interactive: 'Interactive',
      quiz: 'Quiz',
      external_link: 'External Link',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Training Modules</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Manage advisor training content</p>
        </div>
        <button
          onClick={() => navigate('/content/training/new')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Module</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Inactive', value: stats.inactive, icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
          { label: 'Required', value: stats.required, icon: Star, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-th-accent-600 text-white'
                  : 'bg-surface-primary border border-th-border text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
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
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No modules found</h3>
            <p className="text-th-text-tertiary mb-6">
              {searchQuery || filterCategory || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first training module'}
            </p>
            {!searchQuery && !filterCategory && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/content/training/new')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Module</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {filtered.map((module) => (
              <div
                key={module.id}
                className="flex items-center gap-4 p-5 hover:bg-surface-secondary transition-colors group"
              >
                {/* Thumbnail */}
                {module.thumbnail_url ? (
                  <img
                    src={module.thumbnail_url}
                    alt={module.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-surface-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-th-text-tertiary" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className="font-semibold text-th-text-primary truncate cursor-pointer hover:text-th-accent-600 transition-colors"
                      onClick={() => navigate(`/content/training/${module.id}`)}
                    >
                      {module.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      module.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {module.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {module.is_required && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Required
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                      {contentTypeLabel(module.content_type)}
                    </span>
                  </div>
                  <p className="text-sm text-th-text-secondary line-clamp-1 mb-1">
                    {module.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.duration_minutes} min
                    </span>
                    <span>{module.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleActive(module)}
                    title={module.is_active ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    {module.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => navigate(`/content/training/${module.id}`)}
                    title="Edit"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(module.id)}
                    disabled={deleting === module.id}
                    title="Delete"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === module.id ? (
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
