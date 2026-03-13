import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ShieldCheck,
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
  X,
  ArrowUpDown,
  Archive,
  User,
  Trash2,
  MoreHorizontal,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import {
  ticketService,
  type AdminTicket,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
  type TicketRequester,
} from '@mpbhealth/admin-core';
import toast from 'react-hot-toast';

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

export default function TicketsList() {
  const navigate = useNavigate();

  // Data
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [advisorFilter, setAdvisorFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'ticket_number' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  // Advisors list for dropdown
  const [requesters, setRequesters] = useState<TicketRequester[]>([]);

  // Bulk close
  const [bulkClosing, setBulkClosing] = useState(false);
  const [showBulkCloseConfirm, setShowBulkCloseConfirm] = useState(false);

  // Selection & bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState<{ action: string; label: string } | null>(null);

  // Clear selection when tickets change
  useEffect(() => { setSelectedIds(new Set()); }, [tickets]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map((t) => t.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    setBulkActing(true);
    try {
      const ids = [...selectedIds];
      let count = 0;
      switch (action) {
        case 'close':
          count = await ticketService.bulkUpdateTickets(ids, { status: 'closed' });
          toast.success(`${count} ticket${count !== 1 ? 's' : ''} closed.`);
          break;
        case 'open':
          count = await ticketService.bulkUpdateTickets(ids, { status: 'open' });
          toast.success(`${count} ticket${count !== 1 ? 's' : ''} reopened.`);
          break;
        case 'pending':
          count = await ticketService.bulkUpdateTickets(ids, { status: 'pending' });
          toast.success(`${count} ticket${count !== 1 ? 's' : ''} set to pending.`);
          break;
        case 'resolved':
          count = await ticketService.bulkUpdateTickets(ids, { status: 'resolved' });
          toast.success(`${count} ticket${count !== 1 ? 's' : ''} resolved.`);
          break;
        case 'delete':
          count = await ticketService.bulkDeleteTickets(ids);
          toast.success(`${count} ticket${count !== 1 ? 's' : ''} deleted.`);
          break;
      }
      setShowBulkActionConfirm(null);
      setSelectedIds(new Set());
      loadTickets();
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkActing(false);
    }
  };

  // Create ticket on behalf of advisor
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createSubject, setCreateSubject] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createPriority, setCreatePriority] = useState<TicketPriority>('medium');
  const [createCategories, setCreateCategories] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ticketService.getAllTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchDebounced || undefined,
        requesterId: advisorFilter || undefined,
        sortBy,
        sortOrder,
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
  }, [statusFilter, priorityFilter, advisorFilter, sortBy, sortOrder, searchDebounced, page]);

  const loadStats = useCallback(async () => {
    try {
      const s = await ticketService.getAllTicketStats();
      setStats(s);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    ticketService.getCategories().then(setCreateCategories).catch(() => {});
    ticketService.getRequesters().then(setRequesters).catch(() => {});
  }, []);

  const handleBulkClose = async () => {
    setBulkClosing(true);
    try {
      const count = await ticketService.bulkCloseAll();
      toast.success(`${count} ticket${count !== 1 ? 's' : ''} marked as closed.`);
      setShowBulkCloseConfirm(false);
      loadTickets();
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to bulk close tickets');
    } finally {
      setBulkClosing(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!createEmail.trim() || !createSubject.trim() || !createDescription.trim()) {
      setCreateError('Email, subject, and description are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const result = await ticketService.createTicketForAdvisor(createEmail.trim(), {
        subject: createSubject.trim(),
        description: createDescription.trim(),
        category: createCategory || undefined,
        priority: createPriority,
      });
      toast.success(`Ticket #${result.ticket_number} created!`);
      setShowCreateModal(false);
      setCreateEmail('');
      setCreateSubject('');
      setCreateDescription('');
      setCreateCategory('');
      setCreatePriority('medium');
      loadTickets();
      loadStats();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Support Tickets"
        subtitle="View and manage all advisor support tickets"
        icon={<ShieldCheck className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkCloseConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Archive className="w-4 h-4" />
              Bulk Close All
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create Ticket
            </button>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <MetricCard label="Total" value={stats.total} icon={<ShieldCheck className="w-5 h-5" />} onClick={() => { setStatusFilter(''); setPage(1); }} active={statusFilter === ''} />
          <MetricCard label="New" value={stats.new} icon={<CircleDot className="w-5 h-5 text-blue-500" />} onClick={() => { setStatusFilter(statusFilter === 'new' ? '' : 'new'); setPage(1); }} active={statusFilter === 'new'} />
          <MetricCard label="Open" value={stats.open} icon={<AlertCircle className="w-5 h-5 text-yellow-500" />} onClick={() => { setStatusFilter(statusFilter === 'open' ? '' : 'open'); setPage(1); }} active={statusFilter === 'open'} />
          <MetricCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-orange-500" />} onClick={() => { setStatusFilter(statusFilter === 'pending' ? '' : 'pending'); setPage(1); }} active={statusFilter === 'pending'} />
          <MetricCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} onClick={() => { setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved'); setPage(1); }} active={statusFilter === 'resolved'} />
          <MetricCard label="Closed" value={stats.closed} icon={<XCircle className="w-5 h-5 text-neutral-400" />} onClick={() => { setStatusFilter(statusFilter === 'closed' ? '' : 'closed'); setPage(1); }} active={statusFilter === 'closed'} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
        {/* Row 1: Search + Advisor dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by subject, ticket #, or requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="relative min-w-[200px] max-w-xs flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={advisorFilter}
              onChange={(e) => { setAdvisorFilter(e.target.value); setPage(1); }}
              title="Filter by advisor"
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
            >
              <option value="">All advisors</option>
              {requesters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.agent_id ? ` (${r.agent_id})` : ''} — {r.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Status, Priority, Sort, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(1); }}
            title="Filter by status"
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
            title="Filter by priority"
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              title="Sort by"
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="created_at">Date Created</option>
              <option value="updated_at">Last Updated</option>
              <option value="ticket_number">Ticket #</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>

            <button
              type="button"
              onClick={() => { setSortOrder((o) => o === 'asc' ? 'desc' : 'asc'); setPage(1); }}
              title={sortOrder === 'asc' ? 'Ascending — click to reverse' : 'Descending — click to reverse'}
              className="p-2 text-neutral-400 hover:text-neutral-600 border border-neutral-200 rounded-lg transition-colors"
            >
              <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => { loadTickets(); loadStats(); }}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Active filters summary */}
        {(statusFilter || priorityFilter || advisorFilter || searchDebounced) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
            <span className="text-xs text-neutral-500">Active filters:</span>
            {searchDebounced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                Search: "{searchDebounced}"
                <button type="button" onClick={() => setSearch('')} title="Remove search filter" className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                Status: {STATUS_CONFIG[statusFilter].label}
                <button type="button" onClick={() => setStatusFilter('')} title="Remove status filter" className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {priorityFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                Priority: {PRIORITY_CONFIG[priorityFilter].label}
                <button type="button" onClick={() => setPriorityFilter('')} title="Remove priority filter" className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {advisorFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                Advisor: {requesters.find((r) => r.id === advisorFilter)?.name || 'Unknown'}
                <button type="button" onClick={() => setAdvisorFilter('')} title="Remove advisor filter" className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setAdvisorFilter(''); setPage(1); }}
              className="text-xs text-neutral-500 hover:text-neutral-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} ticket{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowBulkActionConfirm({ action: 'open', label: 'Reopen' })}
              className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
            >
              Reopen
            </button>
            <button
              type="button"
              onClick={() => setShowBulkActionConfirm({ action: 'pending', label: 'Set Pending' })}
              className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors"
            >
              Set Pending
            </button>
            <button
              type="button"
              onClick={() => setShowBulkActionConfirm({ action: 'resolved', label: 'Resolve' })}
              className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
            >
              Resolve
            </button>
            <button
              type="button"
              onClick={() => setShowBulkActionConfirm({ action: 'close', label: 'Close' })}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setShowBulkActionConfirm({ action: 'delete', label: 'Delete' })}
              className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No tickets found</h3>
          <p className="text-sm text-neutral-500">
            {statusFilter || priorityFilter || advisorFilter || searchDebounced
              ? 'Try adjusting your filters.'
              : 'No support tickets have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
          {/* Select All header */}
          <div className="flex items-center gap-3 px-5 py-2 bg-neutral-50 border-b border-neutral-200">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="p-0.5 text-neutral-400 hover:text-neutral-600 transition-colors"
              title={selectedIds.size === tickets.length ? 'Deselect all' : 'Select all'}
            >
              {selectedIds.size === 0 ? (
                <Square className="w-4.5 h-4.5" />
              ) : selectedIds.size === tickets.length ? (
                <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
              ) : (
                <MinusSquare className="w-4.5 h-4.5 text-blue-600" />
              )}
            </button>
            <span className="text-xs text-neutral-500">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </span>
          </div>
          {tickets.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status];
            const pc = PRIORITY_CONFIG[ticket.priority];
            const isSelected = selectedIds.has(ticket.id);

            return (
              <div
                key={ticket.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(ticket.id)}
                  className="p-0.5 text-neutral-400 hover:text-neutral-600 flex-shrink-0 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                  ) : (
                    <Square className="w-4.5 h-4.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                  className="flex-1 min-w-0 text-left"
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
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-neutral-500">{ticket.requester_name}</span>
                    {ticket.requester_email && (
                      <>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">{ticket.requester_email}</span>
                      </>
                    )}
                    {ticket.requester_agent_id && (
                      <>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          ID: {ticket.requester_agent_id}
                        </span>
                      </>
                    )}
                    {ticket.requester_company && (
                      <>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-500">{ticket.requester_company}</span>
                      </>
                    )}
                    <span className="text-xs text-neutral-300">·</span>
                    <span className="text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                </button>
              </div>
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
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-neutral-700">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Close Confirmation Modal */}
      {showBulkCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">Bulk Close All Tickets</h2>
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                This will mark <strong>all non-closed tickets</strong> as <strong>closed</strong>.
              </p>
              <p className="text-sm text-neutral-500">
                This is intended for imported tickets from the Zoho desk migration. This action cannot be easily undone.
              </p>
            </div>
            <div className="p-4 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50">
              <button
                type="button"
                onClick={() => setShowBulkCloseConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkClose}
                disabled={bulkClosing}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {bulkClosing ? 'Closing…' : 'Close All Tickets'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 className="text-lg font-semibold text-neutral-900">Create Ticket for Advisor</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Advisor Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="advisor@example.com"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value.slice(0, 255))}
                  placeholder="Brief summary of the issue"
                  maxLength={255}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    title="Category"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select category</option>
                    {createCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as TicketPriority)}
                    title="Priority"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
            </div>
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTicket}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {creating ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showBulkActionConfirm.action === 'delete' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {showBulkActionConfirm.action === 'delete' ? (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {showBulkActionConfirm.label} {selectedIds.size} Ticket{selectedIds.size !== 1 ? 's' : ''}
                </h2>
              </div>
              <p className="text-sm text-neutral-600">
                {showBulkActionConfirm.action === 'delete'
                  ? `This will permanently delete ${selectedIds.size} ticket${selectedIds.size !== 1 ? 's' : ''} and all associated comments. This cannot be undone.`
                  : `This will ${showBulkActionConfirm.label.toLowerCase()} ${selectedIds.size} selected ticket${selectedIds.size !== 1 ? 's' : ''}.`}
              </p>
            </div>
            <div className="p-4 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50">
              <button
                type="button"
                onClick={() => setShowBulkActionConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction(showBulkActionConfirm.action)}
                disabled={bulkActing}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  showBulkActionConfirm.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {bulkActing ? 'Processing…' : showBulkActionConfirm.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
