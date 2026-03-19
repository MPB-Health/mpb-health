import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadSubmissionService, type LeadSubmission, type LeadSubmissionStats } from '@mpbhealth/admin-core';

export default function LeadSubmissions() {
  const [submissions, setSubmissions] = useState<LeadSubmission[]>([]);
  const [stats, setStats] = useState<LeadSubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sourcePages, setSourcePages] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        leadSubmissionService.getSubmissions({
          search: search || undefined,
          source_page: sourceFilter || undefined,
        }),
        leadSubmissionService.getStats(),
      ]);
      setSubmissions(data);
      setStats(statsData);
      setSourcePages(leadSubmissionService.getSourcePages(data));
    } catch (err) {
      console.error('Failed to load leads:', err);
      toast.error('Failed to load lead submissions');
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter]);

  useEffect(() => { load(); }, [load]);

  function handleExport() {
    const csv = leadSubmissionService.exportCSV(submissions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Lead Submissions</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Inbound leads from the website</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={submissions.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Today', value: stats.today },
            { label: 'This Week', value: stats.this_week },
            { label: 'This Month', value: stats.this_month },
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
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          />
        </div>
        {sourcePages.length > 0 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          >
            <option value="">All Sources</option>
            {sourcePages.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
          </div>
        ) : submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Source Page</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">UTM Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-tertiary transition-colors">
                    <td className="py-3 px-4 font-medium text-th-text-primary text-sm">
                      {[s.first_name, s.last_name].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{s.email || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{s.phone || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{s.source_page || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{s.utm_source || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Inbox className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No submissions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
