import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Headphones,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Clock,
  CircleDot,
  Loader2,
  XCircle,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ticketService,
  type Ticket,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
} from '@mpbhealth/advisor-core';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: <CircleDot className="w-3.5 h-3.5" /> },
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-600', icon: <Loader2 className="w-3.5 h-3.5" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  closed: { label: 'Closed', color: 'bg-neutral-100 text-neutral-600', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const DEFAULT_STATUS = { label: 'Unknown', color: 'bg-neutral-100 text-neutral-500', icon: <CircleDot className="w-3.5 h-3.5" /> };

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-neutral-100 text-neutral-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

const DEFAULT_PRIORITY = { label: 'Normal', color: 'bg-neutral-100 text-neutral-500' };
const PER_PAGE = 20;

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTickets = useCallback(async () => {
    try {
      setError('');
      const result = await ticketService.getMyTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchDebounced || undefined,
        page,
        perPage: PER_PAGE,
      });
      setTickets(result.tickets);
      setTotalCount(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, searchDebounced, page]);

  const loadStats = useCallback(async () => {
    try {
      const result = await ticketService.getTicketStats();
      setStats(result);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTickets();
    loadStats();
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-sm text-slate-500">Submit and track tickets on behalf of members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/tickets/new"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open', value: stats.open + stats.new, color: 'text-yellow-600' },
            { label: 'Pending', value: stats.pending, color: 'text-orange-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
            { label: 'Total', value: stats.total, color: 'text-slate-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value as TicketPriority | ''); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={handleRefresh} className="ml-auto text-xs font-medium underline">Retry</button>
        </div>
      )}

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No tickets found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchInput || statusFilter || priorityFilter ? 'Try adjusting your filters' : 'Create your first ticket to get started'}
          </p>
          {!searchInput && !statusFilter && !priorityFilter && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {tickets.map((ticket) => {
            const statusCfg = STATUS_CONFIG[ticket.status] || DEFAULT_STATUS;
            const priorityCfg = PRIORITY_CONFIG[ticket.priority] || DEFAULT_PRIORITY;
            return (
              <div key={ticket.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">#{ticket.ticket_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                    {ticket.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800 truncate">{ticket.subject}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} ({totalCount} ticket{totalCount !== 1 ? 's' : ''})
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              aria-label="Next page"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
