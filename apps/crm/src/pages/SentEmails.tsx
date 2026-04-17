import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Search,
  Filter,
  Eye,
  MousePointer,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { DateRangePicker } from '../components/DateRangePicker';
import type {
  EmailLogEntry,
  EmailLogFilters,
  EmailTrackingStats,
  ReportDateRange,
} from '@mpbhealth/crm-core';

export default function SentEmails() {
  const { supabase, orgId } = useCRM();

  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [stats, setStats] = useState<EmailTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState<EmailLogFilters>({});
  const [dateRange, setDateRange] = useState<ReportDateRange | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadEmails = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const appliedFilters: EmailLogFilters = {
        ...filters,
        search: search || undefined,
        date_from: dateRange?.from,
        date_to: dateRange?.to,
      };

      let query = supabase
        .from('crm_email_log')
        .select('id, org_id, to_email, subject, body_preview, status, template_id, open_count, click_count, first_opened_at, sent_at', { count: 'exact' })
        .eq('org_id', orgId)
        .order('sent_at', { ascending: false });

      if (appliedFilters.status) query = query.eq('status', appliedFilters.status);
      if (appliedFilters.template_id) query = query.eq('template_id', appliedFilters.template_id);
      if (appliedFilters.date_from) query = query.gte('sent_at', appliedFilters.date_from);
      if (appliedFilters.date_to) query = query.lte('sent_at', appliedFilters.date_to);
      if (appliedFilters.search) {
        query = query.or(`to_email.ilike.%${appliedFilters.search}%,subject.ilike.%${appliedFilters.search}%`);
      }
      if (appliedFilters.has_opened) query = query.gt('open_count', 0);
      if (appliedFilters.has_clicked) query = query.gt('click_count', 0);

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      setEmails((data || []) as unknown as EmailLogEntry[]);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, orgId, filters, dateRange, search, page]);

  const loadStats = useCallback(async () => {
    if (!orgId) return;

    try {
      const { data: emailData } = await supabase
        .from('crm_email_log')
        .select('open_count, click_count, first_opened_at, sent_at')
        .eq('org_id', orgId)
        .eq('status', 'sent');

      const emails = emailData || [];
      let openedCount = 0;
      let clickedCount = 0;

      for (const e of emails) {
        if (e.open_count > 0) openedCount++;
        if (e.click_count > 0) clickedCount++;
      }

      const openRate = emails.length > 0 ? Math.round((openedCount / emails.length) * 1000) / 10 : 0;
      const clickRate = emails.length > 0 ? Math.round((clickedCount / emails.length) * 1000) / 10 : 0;
      const ctoRate = openedCount > 0 ? Math.round((clickedCount / openedCount) * 1000) / 10 : 0;

      setStats({
        total_sent: emails.length,
        total_opened: openedCount,
        total_clicked: clickedCount,
        open_rate: openRate,
        click_rate: clickRate,
        click_to_open_rate: ctoRate,
        opens_by_device: { desktop: 0, mobile: 0, tablet: 0 },
        opens_by_country: {},
        opens_over_time: [],
        top_clicked_links: [],
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [supabase, orgId]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      bounced: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    return styles[status as keyof typeof styles] || styles.sent;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <GradientHeader title="Sent Emails" subtitle="View and track sent email communications" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Total Sent</span>
            </div>
            <p className="text-2xl font-bold text-th-text-primary">{stats.total_sent}</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Opened</span>
            </div>
            <p className="text-2xl font-bold text-th-text-primary">{stats.total_opened}</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
              <MousePointer className="w-4 h-4" />
              <span className="text-sm">Clicked</span>
            </div>
            <p className="text-2xl font-bold text-th-text-primary">{stats.total_clicked}</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Open Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.open_rate}%</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Click Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.click_rate}%</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <div className="flex items-center gap-2 text-th-text-tertiary mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">CTO Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.click_to_open_rate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
              <input
                type="text"
                placeholder="Search by email or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              />
            </div>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-600 bg-th-accent-50 dark:bg-th-accent-900/20'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as EmailLogFilters['status'] || undefined })}
                className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
              >
                <option value="">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Engagement</label>
              <select
                value={filters.has_opened ? 'opened' : filters.has_clicked ? 'clicked' : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters({
                    ...filters,
                    has_opened: v === 'opened' ? true : undefined,
                    has_clicked: v === 'clicked' ? true : undefined,
                  });
                }}
                className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
              >
                <option value="">All</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Email List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No emails found</p>
            <p className="text-sm text-th-text-tertiary mt-1">Adjust your filters or date range</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-th-border bg-surface-secondary">
                    <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Recipient</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Subject</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Opens</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Clicks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border-subtle">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-th-text-tertiary" />
                          <span className="text-sm text-th-text-primary">{email.to_email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-th-text-primary truncate max-w-[300px]">
                          {email.subject || '(No subject)'}
                        </p>
                        {email.body_preview && (
                          <p className="text-xs text-th-text-tertiary truncate max-w-[300px] mt-0.5">
                            {email.body_preview}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(email.status)}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {email.open_count !== undefined && email.open_count > 0 ? (
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">{email.open_count}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {email.click_count !== undefined && email.click_count > 0 ? (
                          <div className="flex items-center justify-center gap-1 text-blue-600">
                            <MousePointer className="w-4 h-4" />
                            <span className="text-sm font-medium">{email.click_count}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-th-text-tertiary">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(email.sent_at).toLocaleDateString()} {new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-th-border">
                <p className="text-sm text-th-text-tertiary">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-th-text-secondary">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
