import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  CircleDot,
  Loader2,
  XCircle,
  PlusCircle,
  Send,
  MessageSquare,
  X,
  ShieldCheck,
} from 'lucide-react';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import {
  ticketService,
  appendTicketAttachmentsHtml,
  type Ticket,
  type TicketDetail,
  type TicketStatus,
  type TicketPriority,
} from '@mpbhealth/advisor-core';
import { sanitizeHtml } from '@mpbhealth/utils';
import { TicketCommentContent } from '../components/tickets/TicketCommentContent';
import {
  TicketRichReplyEditor,
  type TicketRichReplyEditorRef,
} from '../components/tickets/TicketRichReplyEditor';

const richTicketEditor = true;

const MAX_REPLY_ATTACHMENTS = 10;
const MAX_REPLY_FILE_BYTES = 15 * 1024 * 1024;

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

export default function Tickets() {
  const { profile, loading: authLoading } = useAdvisor();
  const { executeWithAuth } = useTicketAuth();
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadingTicketId, setLoadingTicketId] = useState<string | null>(null);
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const richReplyRef = useRef<TicketRichReplyEditorRef>(null);
  const [richHasContent, setRichHasContent] = useState(false);
  const [replyEditorKey, setReplyEditorKey] = useState(0);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const perPage = 20;

  // Unmount guard — prevents setState on unmounted component
  const mountedRef = useRef(true);
  const categoriesRequestedRef = useRef(false);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading: loading, error: ticketError, refetch: refetchTickets } = useQuery({
    queryKey: ['advisorTickets', statusFilter, priorityFilter, searchDebounced, page],
    queryFn: () => executeWithAuth(() => ticketService.getMyTickets({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      search: searchDebounced || undefined,
      page,
      perPage,
    })),
    enabled: !authLoading && !!profile,
    staleTime: 30 * 1000,
  });

  const tickets = ticketsData?.tickets ?? [];
  const total = ticketsData?.total ?? 0;

  const { data: stats = null } = useQuery({
    queryKey: ['advisorTicketStats'],
    queryFn: () => executeWithAuth(() => ticketService.getTicketStats()),
    enabled: !authLoading && !!profile,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (ticketError) {
      setError('We\u2019re having trouble loading your tickets right now. Please check your internet connection and try again.');
    }
  }, [ticketError]);

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

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    setLoadingTicketId(ticketId);
    try {
      const detail = await executeWithAuth(() => ticketService.getTicketDetail(ticketId));
      if (!mountedRef.current) return;
      setSelectedTicket(detail);
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[Tickets] Failed to load ticket detail:', {
        ticketId,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      });
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        window.location.href = '/login';
        return;
      }
      const msg = err instanceof Error ? err.message : '';
      if (msg && /not.*synced|not.*configured|not.*found/i.test(msg)) {
        toast.error(msg);
      } else if (msg === 'TIMEOUT') {
        toast.error('The support system is taking too long to respond. Please try again in a moment.');
      } else {
        toast.error("We couldn't open that ticket. Please refresh and try again, or contact support if it keeps happening.");
      }
    } finally {
      if (mountedRef.current) {
        setDetailLoading(false);
        setLoadingTicketId(null);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setReplyContent('');
    setReplyError('');
    setReplyAttachments([]);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Poll for new staff replies every 30s while ticket detail is open.
  // Silent background poll — no loading indicator, no spinner.
  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(() => {
      executeWithAuth(() =>
        ticketService.getTicketDetail(selectedTicket.ticket.id)
      )
        .then((detail) => { if (mountedRef.current) setSelectedTicket(detail); })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [selectedTicket?.ticket.id, executeWithAuth]);

  const mergeReplyAttachments = (files: File[]) => {
    setReplyAttachments((prev) => {
      const next = [...prev];
      for (const f of files) {
        if (next.length >= MAX_REPLY_ATTACHMENTS) {
          toast.error(`You can attach up to ${MAX_REPLY_ATTACHMENTS} files per reply.`);
          break;
        }
        if (f.size > MAX_REPLY_FILE_BYTES) {
          toast.error(`"${f.name}" exceeds the 15 MB limit.`);
          continue;
        }
        const dup = next.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified);
        if (!dup) next.push(f);
      }
      return next;
    });
  };

  const uploadTicketImage = async (file: File) => {
    if (!selectedTicket) throw new Error('No ticket');
    try {
      return await ticketService.uploadImageForTicketReply(selectedTicket.ticket.id, file);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Image upload failed');
      throw e;
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    if (richTicketEditor) {
      const rawHtml = richReplyRef.current?.getHtml() ?? '';
      const hasInlineImage = /<img[\s>]/i.test(rawHtml);
      const text = richReplyRef.current?.getText().trim() ?? '';
      const hasFiles = replyAttachments.length > 0;
      if (!text && !hasInlineImage && !hasFiles) return;
      if (text || hasInlineImage) {
        const html = sanitizeHtml(rawHtml);
        const stripped = html.replace(/<[^>]+>/g, '').trim();
        if (!stripped && !hasInlineImage && !hasFiles) return;
      } else if (!hasFiles) return;
    } else if (!replyContent.trim()) {
      return;
    }
    setReplySending(true);
    setReplyError('');
    try {
      await executeWithAuth(async () => {
        if (richTicketEditor) {
          let html = richReplyRef.current?.getHtml() ?? '';
          if (replyAttachments.length > 0) {
            const uploads = await ticketService.uploadFilesForTicketReply(
              selectedTicket.ticket.id,
              replyAttachments,
            );
            html = appendTicketAttachmentsHtml(html, uploads);
          }
          html = sanitizeHtml(html);
          return ticketService.replyToTicket(selectedTicket.ticket.id, html, 'html');
        }
        return ticketService.replyToTicket(selectedTicket.ticket.id, replyContent.trim(), 'plain');
      });
      if (!mountedRef.current) return;
      const detail = await executeWithAuth(() => ticketService.getTicketDetail(selectedTicket.ticket.id));
      if (!mountedRef.current) return;
      setSelectedTicket(detail);
      setReplyContent('');
      setReplyAttachments([]);
      setReplyEditorKey((k) => k + 1);
      richReplyRef.current?.clear();
      toast.success('Reply sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        window.location.href = '/login';
        return;
      }
      console.error('Ticket reply failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to send reply';
      setReplyError(msg.length > 200 ? 'Your reply could not be sent. Please try again.' : msg);
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
    const sc = STATUS_CONFIG[ticket.status] ?? DEFAULT_STATUS;
    const pc = PRIORITY_CONFIG[ticket.priority] ?? DEFAULT_PRIORITY;

    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-b border-neutral-200 flex items-center justify-between gap-3">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors shadow-sm"
            aria-label="Back to ticket list"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tickets
          </button>
          <span className="text-xs text-neutral-400 hidden sm:inline">
            #{ticket.ticket_number}
          </span>
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
                      <TicketCommentContent content={comment.content} contentFormat={comment.content_format} />
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
            {richTicketEditor ? (
              <>
                <TicketRichReplyEditor
                  key={`${ticket.id}-reply-${replyEditorKey}`}
                  ref={richReplyRef}
                  variant="default"
                  placeholder="Type your message..."
                  disabled={replySending}
                  onDraftChange={setRichHasContent}
                  uploadImage={uploadTicketImage}
                  onAttachFiles={mergeReplyAttachments}
                />
                {replyAttachments.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-600">
                    {replyAttachments.map((file, idx) => (
                      <li
                        key={`${file.name}-${file.size}-${idx}`}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-neutral-100 border border-neutral-200"
                      >
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-neutral-200"
                          aria-label={`Remove ${file.name}`}
                          onClick={() =>
                            setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                maxLength={10000}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors resize-none"
              />
            )}
            {replyError && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{replyError}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
                aria-label="Back to ticket list"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Tickets
              </button>
              <button
                onClick={handleSendReply}
                disabled={
                  replySending ||
                  (richTicketEditor ? !richHasContent && replyAttachments.length === 0 : !replyContent.trim())
                }
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

        <div className="flex justify-center pt-2 pb-6">
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Return to ticket list"
          >
            <ChevronLeft className="w-4 h-4" />
            Return to Ticket List
          </button>
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
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-500 hover:bg-th-accent-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </Link>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total" value={stats.total} icon={<Headphones className="w-5 h-5" />} />
          <MetricCard label="Open" value={stats.open + stats.new} icon={<AlertCircle className="w-5 h-5 text-yellow-500" />} />
          <MetricCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-orange-500" />} />
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
          onClick={() => { setPage(1); refetchTickets(); queryClient.invalidateQueries({ queryKey: ['advisorTicketStats'] }); }}
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
            onClick={() => { setError(''); refetchTickets(); queryClient.invalidateQueries({ queryKey: ['advisorTicketStats'] }); }}
            className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-neutral-100 rounded" />
                  <div className="h-4 w-16 bg-neutral-100 rounded-full" />
                  <div className="h-4 w-14 bg-neutral-100 rounded-full" />
                </div>
                <div className="h-4 w-2/3 bg-neutral-100 rounded" />
                <div className="h-3 w-24 bg-neutral-100 rounded" />
              </div>
              <div className="w-4 h-4 bg-neutral-100 rounded" />
            </div>
          ))}
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
            const sc = STATUS_CONFIG[ticket.status] ?? DEFAULT_STATUS;
            const pc = PRIORITY_CONFIG[ticket.priority] ?? DEFAULT_PRIORITY;

            const isRowLoading = loadingTicketId === ticket.id;
            return (
              <button
                key={ticket.id}
                onClick={() => openTicketDetail(ticket.id)}
                disabled={detailLoading}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                  isRowLoading ? 'bg-blue-50' : 'hover:bg-neutral-50'
                } ${detailLoading && !isRowLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    {isRowLoading
                      ? 'Opening ticket…'
                      : formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                {isRowLoading ? (
                  <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                )}
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
