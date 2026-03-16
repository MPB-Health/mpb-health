import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useTicketAuth } from '../components/TicketAuthWrapper';
import {
  Headphones,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  CircleDot,
  Loader2,
  XCircle,
  PlusCircle,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Button, GradientHeader, MetricCard, SkeletonTable, SkeletonMetric } from '@mpbhealth/ui';
import {
  ticketService,
  type Ticket,
  type TicketDetail,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
} from '@mpbhealth/advisor-core';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: <CircleDot className="w-3.5 h-3.5" /> },
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3.5 h-3.5" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  closed: { label: 'Closed', color: 'bg-neutral-100 text-neutral-600', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-neutral-100 text-neutral-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export default function Tickets() {
  const { profile, loading: authCheckLoading, profileLoading } = useAdvisor();
  const authLoading = authCheckLoading || profileLoading;
  const { executeWithAuth } = useTicketAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const perPage = 20;

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ticketService.getMyTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchDebounced || undefined,
        page,
        perPage,
      });
      setTickets(result.tickets);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchDebounced, page]);

  const loadStats = useCallback(async () => {
    try {
      const s = await ticketService.getTicketStats();
      setStats(s);
    } catch {
      // Stats are non-critical
    }
  }, []);

  // Debounce search input — reset page and trigger server-side search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load distinct categories from ITSTS for the filter dropdown
  useEffect(() => {
    if (!authLoading && profile) {
      executeWithAuth(() => ticketService.getCategories()).then(setCategories).catch(() => {});
    }
  }, [authLoading, profile, executeWithAuth]);

  // Clear the loading spinner when auth is resolved but there is no profile
  // (user is not logged in). Without this, loading stays true forever because
  // loadTickets() — which calls setLoading(false) — never runs.
  useEffect(() => {
    if (!authLoading && !profile) setLoading(false);
  }, [authLoading, profile]);

  useEffect(() => {
    if (!authLoading && profile) loadTickets();
  }, [authLoading, profile, loadTickets]);

  useEffect(() => {
    if (!authLoading && profile) loadStats();
  }, [authLoading, profile, loadStats]);

  // Deep-link: auto-open ticket detail from ?tid= query param (e.g. from notification)
  // Read tid once on mount; don't include searchParams in deps to avoid re-running
  // when we mutate the URL to remove the param.
  const pendingTidRef = useRef(searchParams.get('tid'));
  useEffect(() => {
    const tid = pendingTidRef.current;
    if (tid && !authLoading && profile && !selectedTicket) {
      pendingTidRef.current = null;
      openTicketDetail(tid);
      // Remove tid from URL so refreshing doesn't re-open
      setSearchParams((prev) => { prev.delete('tid'); return prev; }, { replace: true });
    }
  }, [authLoading, profile]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const detail = await executeWithAuth(() => ticketService.getTicketDetail(ticketId));
      setSelectedTicket(detail);
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setReplySending(true);
    setReplyError('');
    try {
      await executeWithAuth(() => ticketService.replyToTicket(selectedTicket.ticket.id, replyContent.trim()));
      const detail = await executeWithAuth(() => ticketService.getTicketDetail(selectedTicket.ticket.id));
      setSelectedTicket(detail);
      setReplyContent('');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setReplySending(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);
  const filteredTickets = tickets.filter((ticket) => {
    if (!categoryFilter) return true;
    return (ticket.category || '').toLowerCase() === categoryFilter.toLowerCase();
  });

  if (selectedTicket) {
    const { ticket, comments } = selectedTicket;
    const sc = STATUS_CONFIG[ticket.status];
    const pc = PRIORITY_CONFIG[ticket.priority];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedTicket(null); setReplyContent(''); setReplyError(''); }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to tickets
          </Button>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-6 border-b border-th-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-th-text-secondary">#{ticket.ticket_number}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                {sc.icon} {sc.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.color}`}>
                {pc.label}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-th-text-primary">{ticket.subject}</h2>
            {ticket.category && (
              <span className="inline-block mt-2 text-xs text-th-text-secondary bg-surface-tertiary px-2 py-0.5 rounded">
                {ticket.category}
              </span>
            )}
            <p className="mt-2 text-xs text-th-text-tertiary">
              Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          {ticket.description && (
            <div className="p-6 border-b border-th-border-subtle">
              <p className="text-sm text-th-text-primary whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          <div className="p-6 border-b border-th-border-subtle">
            <h3 className="text-sm font-medium text-th-text-primary mb-4">
              Conversation ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-th-text-secondary">No replies yet. Our team will respond shortly.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-th-text-secondary">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-th-text-primary">{comment.author_name}</span>
                        <span className="text-xs text-th-text-tertiary">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-th-text-primary whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply box */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-th-text-primary mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-th-text-tertiary" />
              Add a Reply
            </h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              maxLength={10000}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-4 py-3 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors resize-none"
            />
            {replyError && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{replyError}</span>
              </div>
            )}
            <div className="flex justify-end mt-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleSendReply}
                disabled={replySending || !replyContent.trim()}
              >
                {replySending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Support Tickets"
        subtitle="View and track your IT support requests"
        icon={<Headphones className="w-6 h-6" />}
        actions={
          <Link
            to="/tickets/new"
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-50 dark:bg-th-accent-900/20 hover:bg-th-accent-100 dark:hover:bg-th-accent-900/30 text-th-text-primary rounded-lg text-sm font-medium transition-colors border border-th-border"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </Link>
        }
      />

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Total" value={stats.total} icon={<Headphones className="w-5 h-5" />} />
          <MetricCard label="Open" value={stats.open + stats.new} icon={<AlertCircle className="w-5 h-5 text-yellow-500" />} />
          <MetricCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-orange-500" />} />
          <MetricCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
          <MetricCard label="Closed" value={stats.closed} icon={<XCircle className="w-5 h-5 text-neutral-400" />} />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonMetric key={i} />
          ))}
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-th-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(1); }}
              className="px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value as TicketPriority | ''); setPage(1); }}
              className="px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setPage(1); loadTickets(); loadStats(); }}
          title="Refresh"
          className="min-h-[44px] min-w-[44px]"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Ticket List */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <SkeletonTable rows={8} cols={3} />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-surface-primary rounded-xl border border-th-border">
          <Headphones className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <h3 className="text-lg font-medium text-th-text-primary mb-1">No tickets found</h3>
          <p className="text-sm text-th-text-secondary mb-4">
            {statusFilter || priorityFilter || categoryFilter || searchInput
              ? 'Try adjusting your filters.'
              : 'You haven\'t submitted any support tickets yet.'}
          </p>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create a Ticket
          </Link>
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden divide-y divide-th-border-subtle">
          {filteredTickets.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status];
            const pc = PRIORITY_CONFIG[ticket.priority];

            return (
              <button
                type="button"
                key={ticket.id}
                onClick={() => openTicketDetail(ticket.id)}
                disabled={detailLoading}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-secondary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-th-text-tertiary">#{ticket.ticket_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.color}`}>
                      {pc.label}
                    </span>
                    {ticket.category && (
                      <span className="text-xs text-th-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-th-text-primary truncate">{ticket.subject}</h4>
                  <p className="text-xs text-th-text-tertiary mt-0.5">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-th-text-secondary">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm text-th-text-primary">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
