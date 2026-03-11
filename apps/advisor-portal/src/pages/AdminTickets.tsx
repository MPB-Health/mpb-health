import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
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
  Send,
  User,
  PlusCircle,
  X,
  Lock,
} from 'lucide-react';
import { Button, GradientHeader, MetricCard } from '@mpbhealth/ui';
import {
  ticketService,
  type AdminTicket,
  type AdminTicketDetail,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
} from '@mpbhealth/advisor-core';
import { isAdmin } from '@mpbhealth/auth';
import { useAdvisor } from '../contexts/AdvisorContext';
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

export default function AdminTickets() {
  const { profile } = useAdvisor();
  const [adminCheck, setAdminCheck] = useState<boolean | null>(null);

  // Data
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  // Detail
  const [selectedTicket, setSelectedTicket] = useState<AdminTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reply
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Ticket status / priority update
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

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

  // Role check
  useEffect(() => {
    if (profile?.user_id) {
      isAdmin(profile.user_id).then(setAdminCheck);
    }
  }, [profile?.user_id]);

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
      const s = await ticketService.getAllTicketStats();
      setStats(s);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    if (adminCheck) loadTickets();
  }, [adminCheck, loadTickets]);

  useEffect(() => {
    if (adminCheck) loadStats();
  }, [adminCheck, loadStats]);

  // Pre-load categories for the create modal
  useEffect(() => {
    if (adminCheck) {
      ticketService.getCategories().then(setCreateCategories).catch(() => {});
    }
  }, [adminCheck]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const detail = await ticketService.getTicketDetailAdmin(ticketId);
      setSelectedTicket(detail);
      setReplyContent('');
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
      await ticketService.addComment(selectedTicket.ticket.id, replyContent.trim());
      // Refresh detail
      const detail = await ticketService.getTicketDetailAdmin(selectedTicket.ticket.id);
      setSelectedTicket(detail);
      setReplyContent('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reply';
      setReplyError(msg);
    } finally {
      setReplySending(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    setUpdating(true);
    setUpdateError('');
    try {
      await ticketService.updateTicket(selectedTicket.ticket.id, { status: newStatus });
      const detail = await ticketService.getTicketDetailAdmin(selectedTicket.ticket.id);
      setSelectedTicket(detail);
      loadTickets();
      toast.success('Status updated');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!selectedTicket) return;
    setUpdating(true);
    setUpdateError('');
    try {
      await ticketService.updateTicket(selectedTicket.ticket.id, { priority: newPriority });
      const detail = await ticketService.getTicketDetailAdmin(selectedTicket.ticket.id);
      setSelectedTicket(detail);
      loadTickets();
      toast.success('Priority updated');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update priority');
    } finally {
      setUpdating(false);
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

  // Auth guards
  if (adminCheck === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (adminCheck === false) {
    return <Navigate to="/" replace />;
  }

  // ── Detail view ──
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
            onClick={() => setSelectedTicket(null)}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to tickets
          </Button>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-6 border-b border-th-border-subtle">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-th-text-secondary">#{ticket.ticket_number}</span>
                </div>
                <h2 className="text-xl font-semibold text-th-text-primary">{ticket.subject}</h2>
                {ticket.category && (
                  <span className="inline-block mt-2 text-xs text-th-text-secondary bg-surface-tertiary px-2 py-0.5 rounded">
                    {ticket.category}
                  </span>
                )}
              </div>
              {/* Status & Priority controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updating}
                  className="px-3 py-1.5 border border-th-border rounded-lg text-sm bg-surface-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                >
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  disabled={updating}
                  className="px-3 py-1.5 border border-th-border rounded-lg text-sm bg-surface-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                {updating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              </div>
            </div>
            {updateError && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{updateError}</span>
              </div>
            )}

            {/* Requester info */}
            <div className="mt-3 flex items-center gap-2 flex-wrap text-sm text-th-text-secondary">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-th-text-primary">{ticket.requester_name}</span>
              {ticket.requester_email && (
                <>
                  <span className="text-th-text-tertiary">·</span>
                  <span>{ticket.requester_email}</span>
                </>
              )}
              {ticket.requester_agent_id && (
                <>
                  <span className="text-th-text-tertiary">·</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                    Agent ID: {ticket.requester_agent_id}
                  </span>
                </>
              )}
              {ticket.requester_company && (
                <>
                  <span className="text-th-text-tertiary">·</span>
                  <span className="text-th-text-secondary">{ticket.requester_company}</span>
                </>
              )}
            </div>
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
              <p className="text-sm text-th-text-secondary">No replies yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex gap-3 rounded-lg p-2 -mx-2 ${comment.is_internal ? 'bg-amber-50 border border-amber-200' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${comment.is_internal ? 'bg-amber-200' : 'bg-surface-tertiary'}`}>
                      {comment.is_internal
                        ? <Lock className="w-3.5 h-3.5 text-amber-700" />
                        : <span className="text-xs font-medium text-th-text-secondary">{comment.author_name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-th-text-primary">{comment.author_name}</span>
                        {comment.is_internal && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Internal Note</span>
                        )}
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

          {/* Reply form */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-th-text-primary mb-3">Send Reply</h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              rows={4}
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

  // ── List view ──
  return (
    <div className="space-y-6">
      <GradientHeader
        title="Ticket Management"
        subtitle="View and manage all support tickets across the system"
        icon={<ShieldCheck className="w-6 h-6" />}
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircle className="w-4 h-4" />
            Create Ticket
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Total" value={stats.total} icon={<ShieldCheck className="w-5 h-5" />} />
          <MetricCard label="Open" value={stats.open + stats.new} icon={<AlertCircle className="w-5 h-5 text-yellow-500" />} />
          <MetricCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-orange-500" />} />
          <MetricCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
          <MetricCard label="Closed" value={stats.closed} icon={<XCircle className="w-5 h-5 text-neutral-400" />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search by subject or ticket #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as TicketStatus | ''); setPage(1); }}
            className="px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { loadTickets(); loadStats(); }}
          title="Refresh"
          className="min-h-[44px] min-w-[44px]"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-surface-primary rounded-xl border border-th-border">
          <ShieldCheck className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <h3 className="text-lg font-medium text-th-text-primary mb-1">No tickets found</h3>
          <p className="text-sm text-th-text-secondary">
            {statusFilter || priorityFilter || searchDebounced
              ? 'Try adjusting your filters.'
              : 'No support tickets have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden divide-y divide-th-border-subtle">
          {tickets.map((ticket) => {
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
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-th-text-secondary">
                      {ticket.requester_name}
                    </span>
                    {ticket.requester_email && (
                      <>
                        <span className="text-xs text-th-text-tertiary">·</span>
                        <span className="text-xs text-th-text-tertiary">{ticket.requester_email}</span>
                      </>
                    )}
                    {ticket.requester_agent_id && (
                      <>
                        <span className="text-xs text-th-text-tertiary">·</span>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          ID: {ticket.requester_agent_id}
                        </span>
                      </>
                    )}
                    {ticket.requester_company && (
                      <>
                        <span className="text-xs text-th-text-tertiary">·</span>
                        <span className="text-xs text-th-text-secondary">{ticket.requester_company}</span>
                      </>
                    )}
                    <span className="text-xs text-th-text-tertiary">·</span>
                    <span className="text-xs text-th-text-tertiary">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                  </div>
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-th-border-subtle">
              <h2 className="text-lg font-semibold text-th-text-primary">Create Ticket for Advisor</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="min-h-[44px] min-w-[44px]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1">
                  Advisor Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="advisor@example.com"
                  className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value.slice(0, 255))}
                  placeholder="Brief summary of the issue"
                  maxLength={255}
                  className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-primary mb-1">Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {createCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-primary mb-1">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                    className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
            </div>
            <div className="p-6 border-t border-th-border-subtle flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateTicket}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
