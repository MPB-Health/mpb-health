import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
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
  const { profile, loading: authLoading } = useAdvisor();
  const { executeWithAuth } = useTicketAuth();
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

  // Unmount guard — prevents setState on unmounted component
  const mountedRef = useRef(true);
  const categoriesRequestedRef = useRef(false);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Track the latest ticket-list fetch so rapid filter changes cancel prior calls
  const ticketFetchId = useRef(0);

  // Silent auto-retry: if loadTickets fails even after TicketService's built-in
  // retries, schedule another attempt after a short delay so the user never
  // sees a broken page — it just keeps trying in the background.
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const retryCountRef = useRef(0);
  const MAX_PAGE_RETRIES = 4;
  const PAGE_RETRY_DELAYS = [2_000, 5_000, 10_000, 20_000];

  // Clean up retry timer on unmount
  useEffect(() => () => { clearTimeout(retryTimerRef.current); }, []);

  const loadTickets = useCallback(async () => {
    const id = ++ticketFetchId.current;
    setLoading(true);
    setError('');
    try {
      const result = await executeWithAuth(() => ticketService.getMyTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchDebounced || undefined,
        page,
        perPage,
      }));
      // Only apply result if this is still the latest request and component is mounted
      if (id !== ticketFetchId.current || !mountedRef.current) return;
      setTickets(result.tickets);
      setTotal(result.total);
      retryCountRef.current = 0; // reset on success
    } catch (err) {
      if (id !== ticketFetchId.current || !mountedRef.current) return;

      // Session completely gone — redirect to login silently
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        window.location.href = '/login';
        return;
      }

      // Auto-retry silently in the background instead of showing error
      if (retryCountRef.current < MAX_PAGE_RETRIES) {
        const delay = PAGE_RETRY_DELAYS[retryCountRef.current] ?? 20_000;
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) loadTickets();
        }, delay);
        // Keep showing spinner — user doesn't know anything is wrong
        return;
      }

      // All retries exhausted — show a gentle, non-technical message
      setError('We\u2019re having trouble loading your tickets right now. Please check your internet connection and try again.');
    } finally {
      if (id === ticketFetchId.current && mountedRef.current) {
        // Only stop loading if we're NOT silently retrying
        if (retryCountRef.current === 0 || retryCountRef.current >= MAX_PAGE_RETRIES) {
          setLoading(false);
        }
      }
    }
  }, [statusFilter, priorityFilter, searchDebounced, page, executeWithAuth]);

  const loadStats = useCallback(async () => {
    try {
      const s = await executeWithAuth(() => ticketService.getTicketStats());
      if (!mountedRef.current) return;
      setStats(s);
    } catch {
      // Stats are non-critical — never surface errors for these
    }
  }, [executeWithAuth]);

  // Debounce search input — reset page and trigger server-side search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Keep category metadata out of the critical path so the initial ticket list renders first.
  useEffect(() => {
    if (authLoading || !profile || loading || categoriesRequestedRef.current) return;

    categoriesRequestedRef.current = true;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      executeWithAuth(() => ticketService.getCategories())
        .then((nextCategories) => {
          if (!cancelled && mountedRef.current) {
            setCategories(nextCategories);
          }
        })
        .catch(() => {
          if (!cancelled) {
            categoriesRequestedRef.current = false;
          }
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authLoading, profile, loading, executeWithAuth]);

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

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const detail = await executeWithAuth(() => ticketService.getTicketDetail(ticketId));
      if (!mountedRef.current) return;
      setSelectedTicket(detail);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Failed to load ticket detail:', err);
    } finally {
      if (mountedRef.current) setDetailLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setReplySending(true);
    setReplyError('');
    try {
      await executeWithAuth(() => ticketService.replyToTicket(selectedTicket.ticket.id, replyContent.trim()));
      if (!mountedRef.current) return;
      const detail = await executeWithAuth(() => ticketService.getTicketDetail(selectedTicket.ticket.id));
      if (!mountedRef.current) return;
      setSelectedTicket(detail);
      setReplyContent('');
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        window.location.href = '/login';
        return;
      }
      setReplyError('Your reply could not be sent. Please try again.');
    } finally {
      if (mountedRef.current) setReplySending(false);
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
          <button
            onClick={() => { setSelectedTicket(null); setReplyContent(''); setReplyError(''); }}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Back to tickets"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to tickets
          </button>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-neutral-500">#{ticket.ticket_number}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                {sc.icon} {sc.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.color}`}>
                {pc.label}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{ticket.subject}</h2>
            {ticket.category && (
              <span className="inline-block mt-2 text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                {ticket.category}
              </span>
            )}
            <p className="mt-2 text-xs text-neutral-400">
              Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          {ticket.description && (
            <div className="p-6 border-b border-neutral-100">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          <div className="p-6 border-b border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">
              Conversation ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-neutral-500">No replies yet. Our team will respond shortly.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-neutral-600">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-neutral-900">{comment.author_name}</span>
                        <span className="text-xs text-neutral-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply box */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-neutral-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              Add a Reply
            </h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              maxLength={10000}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors resize-none"
            />
            {replyError && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{replyError}</span>
              </div>
            )}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSendReply}
                disabled={replySending || !replyContent.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
              </button>
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
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </Link>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Total" value={stats.total} icon={<Headphones className="w-5 h-5" />} />
          <MetricCard label="Open" value={stats.open + stats.new} icon={<AlertCircle className="w-5 h-5 text-yellow-500" />} />
          <MetricCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-orange-500" />} />
          <MetricCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
          <MetricCard label="Closed" value={stats.closed} icon={<XCircle className="w-5 h-5 text-neutral-400" />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(1); }}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
        </div>

        <button
          onClick={() => { setPage(1); loadTickets(); loadStats(); }}
          className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Ticket List */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-10 px-4 bg-white rounded-xl border border-neutral-200">
          <RefreshCw className="w-8 h-8 text-neutral-300" />
          <p className="text-sm text-neutral-600 text-center max-w-sm">{error}</p>
          <button
            type="button"
            onClick={() => { retryCountRef.current = 0; setError(''); loadTickets(); loadStats(); }}
            className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <Headphones className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No tickets found</h3>
          <p className="text-sm text-neutral-500 mb-4">
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
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
          {filteredTickets.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status];
            const pc = PRIORITY_CONFIG[ticket.priority];

            return (
              <button
                key={ticket.id}
                onClick={() => openTicketDetail(ticket.id)}
                disabled={detailLoading}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-neutral-400">#{ticket.ticket_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.color}`}>
                      {pc.label}
                    </span>
                    {ticket.category && (
                      <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-neutral-900 truncate">{ticket.subject}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-neutral-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
