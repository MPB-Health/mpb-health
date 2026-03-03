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
  FileText,
  Loader2,
  Filter,
  FileCheck,
  FileClock,
  File,
} from 'lucide-react';
import {
  sopAdminService,
  type AdminSOPDocument,
  type SOPAdminStats,
} from '@mpbhealth/admin-core';

export default function SOPsList() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<AdminSOPDocument[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [stats, setStats] = useState<SOPAdminStats>({ total: 0, published: 0, draft: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, catsData, statsData] = await Promise.all([
        sopAdminService.getDocuments(),
        sopAdminService.getCategories(),
        sopAdminService.getStats(),
      ]);
      setDocs(docsData);
      setCategories(catsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading SOPs:', error);
      toast.error('Failed to load SOPs');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (doc: AdminSOPDocument) => {
    try {
      await sopAdminService.togglePublish(doc.id);
      toast.success(doc.is_published ? 'SOP unpublished' : 'SOP published!');
      loadData();
    } catch (error) {
      toast.error('Failed to update SOP');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SOP document? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await sopAdminService.deleteDocument(id);
      toast.success('SOP deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete SOP');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = docs.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || d.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && d.is_published) ||
      (filterStatus === 'draft' && !d.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const contentTypeIcon = (type: AdminSOPDocument['content_type']) => {
    if (type === 'pdf') return 'PDF';
    if (type === 'presentation') return 'PPTX';
    if (type === 'external_link') return 'Link';
    if (type === 'html') return 'HTML';
    return 'MD';
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
          <h1 className="text-2xl font-bold text-th-text-primary">SOPs</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Standard Operating Procedures and policy documents</p>
        </div>
        <button
          onClick={() => navigate('/content/sops/new')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New SOP</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Published', value: stats.published, icon: FileCheck, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Drafts', value: stats.draft, icon: FileClock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
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
            placeholder="Search SOPs..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((s) => (
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
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No SOPs found</h3>
            <p className="text-th-text-tertiary mb-6">
              {searchQuery || filterCategory || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first SOP document'}
            </p>
            {!searchQuery && !filterCategory && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/content/sops/new')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New SOP</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-5 hover:bg-surface-secondary transition-colors group"
              >
                {/* Type badge */}
                <div className="w-12 h-12 bg-surface-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-th-text-tertiary">{contentTypeIcon(doc.content_type)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className="font-semibold text-th-text-primary truncate cursor-pointer hover:text-th-accent-600 transition-colors"
                      onClick={() => navigate(`/content/sops/${doc.id}`)}
                    >
                      {doc.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      doc.is_published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {doc.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                      v{doc.version}
                    </span>
                    {doc.tags?.length > 0 && (
                      <span className="text-xs text-th-text-tertiary">{doc.tags.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                  <p className="text-sm text-th-text-secondary line-clamp-1 mb-1">
                    {doc.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
                    <span>{doc.category}</span>
                    <span className="flex items-center gap-1">
                      <File className="w-3 h-3" />
                      {doc.view_count} views
                    </span>
                    <span>{format(new Date(doc.updated_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTogglePublish(doc)}
                    title={doc.is_published ? 'Unpublish' : 'Publish'}
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    {doc.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => navigate(`/content/sops/${doc.id}`)}
                    title="Edit"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    title="Delete"
                    className="p-2 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
