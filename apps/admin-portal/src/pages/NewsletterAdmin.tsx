import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  newsletterAdminService,
  type NewsletterSubscriber,
  type NewsletterStats,
  type NewsletterStatus,
} from '@mpbhealth/admin-core';

const STATUS_COLORS: Record<NewsletterStatus, string> = {
  active: 'bg-green-100 text-green-700',
  unsubscribed: 'bg-neutral-100 text-neutral-600',
  bounced: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<NewsletterStatus | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        newsletterAdminService.getSubscribers({ status: statusFilter, search: search || undefined }),
        newsletterAdminService.getStats(),
      ]);
      setSubscribers(data);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
      toast.error('Failed to load newsletter subscribers');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, status: NewsletterStatus) {
    try {
      await newsletterAdminService.updateStatus(id, status);
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this subscriber? This cannot be undone.')) return;
    try {
      await newsletterAdminService.delete(id);
      toast.success('Subscriber removed');
      load();
    } catch {
      toast.error('Failed to remove subscriber');
    }
  }

  function handleExport() {
    const csv = newsletterAdminService.exportCSV(subscribers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Newsletter</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage subscriber list</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Pending', value: stats.pending },
            { label: 'Unsubscribed', value: stats.unsubscribed },
            { label: 'Bounced', value: stats.bounced },
          ].map((s) => (
            <div key={s.label} className="bg-surface-primary border border-th-border rounded-xl p-4">
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
              <p className="text-2xl font-bold text-th-text-primary mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NewsletterStatus | 'all')}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
          </div>
        ) : subscribers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Subscribed</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-tertiary transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-th-text-primary">{s.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{s.source || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {s.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, 'active')}
                            className="text-xs px-2 py-1 text-green-700 hover:bg-green-50 rounded transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                        {s.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, 'unsubscribed')}
                            className="text-xs px-2 py-1 text-th-text-tertiary hover:bg-surface-secondary rounded transition-colors"
                          >
                            Unsubscribe
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-th-text-tertiary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label="Delete subscriber"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No subscribers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
