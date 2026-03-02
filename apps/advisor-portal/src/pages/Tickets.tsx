import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAdvisor } from '../contexts/AdvisorContext';
import {
  Headphones,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  CircleDot,
  Loader2,
  XCircle,
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
import { useSupportSSO } from '../hooks/useSupportSSO';

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
  const { openSupport, loading: ssoLoading } = useSupportSSO();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const perPage = 20;

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ticketService.getMyTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
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
  }, [statusFilter, priorityFilter, page]);

  const loadStats = useCallback(async () => {
    try {
      const s = await ticketService.getTicketStats();
      setStats(s);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    if (!authLoading && profile) loadTickets();
  }, [authLoading, profile, loadTickets]);

  useEffect(() => {
    if (!authLoading && profile) loadStats();
  }, [authLoading, profile, loadStats]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const detail = await ticketService.getTicketDetail(ticketId);
      setSelectedTicket(detail);
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTickets = search
    ? tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(search.toLowerCase()) ||
          t.ticket_number.toString().includes(search) ||
          (t.category || '').toLowerCase().includes(search.toLowerCase()),
      )
    : tickets;

  const totalPages = Math.ceil(total / perPage);

  if (selectedTicket) {
    const { ticket, comments } = selectedTicket;
    const sc = STATUS_CONFIG[ticket.status];
    const pc = PRIORITY_CONFIG[ticket.priority];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to tickets
          </button>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-start justify-between gap-4">
              <div>
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
              </div>
              <button
                onClick={openSupport}
                disabled={ssoLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Portal
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          {ticket.description && (
            <div className="p-6 border-b border-neutral-100">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          <div className="p-6">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">
              Conversation ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-neutral-500">No replies yet.</p>
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
          <button
            onClick={openSupport}
            disabled={ssoLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Support Portal
          </button>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(1); }}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <button
          onClick={() => { loadTickets(); loadStats(); }}
          className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Ticket List */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <Headphones className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No tickets found</h3>
          <p className="text-sm text-neutral-500 mb-4">
            {statusFilter || priorityFilter || search
              ? 'Try adjusting your filters.'
              : 'You haven\'t submitted any support tickets yet.'}
          </p>
          <button
            onClick={openSupport}
            disabled={ssoLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Create a Ticket
          </button>
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
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
