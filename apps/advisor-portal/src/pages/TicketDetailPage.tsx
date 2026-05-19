import { useState, useEffect, useRef, useCallback, useMemo, type ChangeEvent } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ChevronRight,
  Ticket,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  X,
  Calendar,
  Tag,
  Clock,
  Copy,
  Check,
  Headphones,
  Lock,
  Paperclip,
  UserCheck,
  UserRound,
  Eye,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, cn } from '@mpbhealth/ui';
import { sanitizeHtml, escapeHtml } from '@mpbhealth/utils';
import {
  ticketService,
  appendTicketAttachmentsHtml,
  type TicketDetail,
  type TicketComment,
} from '@mpbhealth/advisor-core';
import { useTicketAuth } from '../components/TicketAuthWrapper';
import { formatStatusLabel } from '../components/tickets/advisorTicketUi';
import { TicketCommentContent } from '../components/tickets/TicketCommentContent';
import { TicketDescriptionBlock } from '../components/tickets/TicketDescriptionBlock';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { advisorLiveDetailQueryOptions } from '../query/advisorQueryPolicy';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


const MAX_REPLY_ATTACHMENTS = 10;
const MAX_REPLY_FILE_BYTES = 15 * 1024 * 1024;
/** Upload + edge reply can exceed a single `call()` timeout when many/large files are attached. */
const REPLY_SEND_TOTAL_TIMEOUT_MS = 240_000;

function withDeadline<T>(promise: Promise<T>, ms: number, label = 'Operation timed out'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

const panelClass =
  'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm sm:p-6 lg:p-8';

function formatTicketRef(ticketId: string) {
  return ticketId ? `#${ticketId.replace(/-/g, '').slice(0, 8).toUpperCase()}` : '';
}

function formatEnumLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatAttachmentSize(bytes: number | null): string {
  if (bytes == null || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File types that usually open in the browser tab instead of only triggering a save dialog. */
function attachmentUsuallyPreviewableInBrowser(mime: string | null | undefined, filename: string): boolean {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('image/')) return true;
  if (m === 'application/pdf') return true;
  if (m.startsWith('text/') && m !== 'text/javascript') return true;
  if (m.startsWith('video/') || m.startsWith('audio/')) return true;
  const ext = filename.includes('.') ? (filename.split('.').pop() || '').toLowerCase() : '';
  return /^(pdf|png|jpe?g|gif|webp|svg|txt|html?|mp4|webm|ogg|mp3|wav)$/i.test(ext);
}

/** Readable assignee when ticket-proxy returns full_name or email fallback. */
function assigneeDisplayLine(ticket: { assignee_id?: string | null; assignee_name?: string | null }): string | null {
  if (!ticket.assignee_id) return null;
  const n = ticket.assignee_name?.trim();
  return n || null;
}

/** Chip colors aligned with ITSTS EnhancedTicketDetail for visual parity. */
function itstsStatusChipClass(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_progress: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    closed: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-200',
  };
  return colors[status] ?? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
}

function itstsPriorityChipClass(priority: string): string {
  const colors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return colors[priority] ?? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
}

export default function TicketDetailPage() {
  useAdvisorPageDebugLog('TicketDetailPage');
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const ticketsListPath = useMemo(() => {
    const rt = (location.state as { ticketsReturnTo?: string } | null)?.ticketsReturnTo;
    if (rt === '/tickets' || (typeof rt === 'string' && rt.startsWith('/tickets?'))) {
      return rt;
    }
    return '/tickets';
  }, [location.state]);

  const goToTicketList = useCallback(() => {
    navigate(ticketsListPath);
  }, [navigate, ticketsListPath]);
  const { executeWithAuth } = useTicketAuth();
  const queryClient = useQueryClient();
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();

  const validTicketId = Boolean(ticketId && UUID_RE.test(ticketId));
  const ticketLoadErrorToastRef = useRef(false);
  useEffect(() => {
    ticketLoadErrorToastRef.current = false;
  }, [ticketId]);

  const {
    data: detail,
    isPending: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ['advisorTicketDetail', ticketId],
    queryFn: async ({ signal }) => {
      try {
        return await executeWithAuth(() => ticketService.getTicketDetail(ticketId!, { signal }));
      } catch (e) {
        if (e instanceof Error && e.message === 'SESSION_EXPIRED') {
          window.location.href = '/login';
        }
        throw e;
      }
    },
    enabled: advisorReady && validTicketId,
    ...advisorLiveDetailQueryOptions(),
    refetchOnMount: 'always',
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(800 * 2 ** attemptIndex, 4_000),
  });

  const loadError = isError
    ? error instanceof Error
      ? error.message
      : 'Failed to load ticket'
    : null;

  useEffect(() => {
    if (!isError || !error || ticketLoadErrorToastRef.current) return;
    ticketLoadErrorToastRef.current = true;
    const msg = error instanceof Error ? error.message : 'Failed to load ticket';
    console.error('[TicketDetailPage] load failed', error);
    toast.error(
      /not.*synced|not.*configured|not.*found/i.test(msg)
        ? msg
        : "We couldn't load this ticket. Try again or return to the list.",
    );
  }, [isError, error]);

  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyAttachmentsInputRef = useRef<HTMLInputElement>(null);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [copiedField, setCopiedField] = useState<null | 'num' | 'link'>(null);
  /** Local id of the outbound bubble while the network send is in flight. */
  const [outboundPendingId, setOutboundPendingId] = useState<string | null>(null);
  const replyDraftBackupRef = useRef<{ plain: string; files: File[] } | null>(null);
  /** Signed download URLs for opening-message `ticket_files` rows (same pattern as ITSTS). */
  const [openingAttachmentUrls, setOpeningAttachmentUrls] = useState<Record<string, string>>({});

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    const files = detail?.ticket_files;
    if (!files?.length) {
      setOpeningAttachmentUrls({});
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const paths = files.map((f) => f.storage_path.replace(/^\//, '').trim()).filter(Boolean);
        const signed = await executeWithAuth(() => ticketService.signTicketAttachmentUrls(paths));
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const f of files) {
          const path = f.storage_path.replace(/^\//, '').trim();
          const url = signed[path];
          if (url) next[f.id] = url;
        }
        setOpeningAttachmentUrls(next);
      } catch {
        if (!cancelled) setOpeningAttachmentUrls({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detail?.ticket_files, executeWithAuth]);

  useEffect(() => {
    setReplySending(false);
    setReplyError('');
  }, [ticketId]);

  const mergeReplyAttachments = useCallback((files: File[]) => {
    setReplyAttachments((prev) => {
      const next = [...prev];
      for (const f of files) {
        if (next.length >= MAX_REPLY_ATTACHMENTS) {
          toast.error(`You can attach up to ${MAX_REPLY_ATTACHMENTS} files.`);
          break;
        }
        if (f.size > MAX_REPLY_FILE_BYTES) {
          toast.error(`"${f.name}" exceeds the 15 MB limit.`);
          continue;
        }
        const dup = next.some(
          (x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified,
        );
        if (!dup) next.push(f);
      }
      return next;
    });
  }, []);

  const onReplyAttachmentsInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (list?.length) mergeReplyAttachments(Array.from(list));
      e.target.value = '';
    },
    [mergeReplyAttachments],
  );

  const copyTicketNumber = useCallback(async () => {
    if (!detail?.ticket) return;
    try {
      await navigator.clipboard.writeText(String(detail.ticket.ticket_number));
      setCopiedField('num');
      toast.success('Ticket number copied');
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Could not copy');
    }
  }, [detail]);

  const copyTicketLink = useCallback(async () => {
    if (!detail?.ticket) return;
    const url = `${window.location.origin}/tickets/${detail.ticket.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedField('link');
      toast.success('Link copied');
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Could not copy');
    }
  }, [detail]);

  const handleSendReply = async () => {
    if (!detail) return;

    const plainSnapshot = replyContent.trim();
    const filesSnapshot = [...replyAttachments];

    if (!plainSnapshot && filesSnapshot.length === 0) return;

    const commentAuthorId = detail.ticket.requester_id || profile?.user_id || profile?.id || '';
    const authorName = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email || 'You'
      : 'You';

    const now = new Date().toISOString();
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    replyDraftBackupRef.current = { plain: plainSnapshot, files: filesSnapshot };

    setReplyError('');
    setOutboundPendingId(null);

    const rollbackReplyFailure = () => {
      const b = replyDraftBackupRef.current;
      replyDraftBackupRef.current = null;
      queryClient.setQueryData<TicketDetail>(['advisorTicketDetail', ticketId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== localId),
        };
      });
      if (b) {
        setReplyAttachments(b.files);
        setReplyContent(b.plain);
      }
    };

    let payloadContent: string;
    let payloadFormat: 'html' | 'plain';

    try {
      if (filesSnapshot.length > 0) {
        setReplySending(true);
        const uploads = await executeWithAuth(() =>
          ticketService.uploadFilesForTicketReply(detail.ticket.id, filesSnapshot),
        );
        if (!mountedRef.current) return;
        const textHtml =
          plainSnapshot !== '' ? `<p>${escapeHtml(plainSnapshot).replace(/\n/g, '<br/>')}</p>` : '';
        payloadContent = sanitizeHtml(appendTicketAttachmentsHtml(textHtml, uploads));
        payloadFormat = 'html';
      } else {
        payloadContent = plainSnapshot;
        payloadFormat = 'plain';
      }

      const optimistic: TicketComment = {
        id: localId,
        content: payloadContent,
        content_format: payloadFormat,
        is_internal: false,
        created_at: now,
        author_id: commentAuthorId,
        author_name: authorName,
      };

      flushSync(() => {
        queryClient.setQueryData<TicketDetail>(['advisorTicketDetail', ticketId], (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ticket: { ...prev.ticket, updated_at: now },
            comments: [...prev.comments.filter((c) => !c.id.startsWith('local-')), optimistic],
          };
        });
        setReplyContent('');
        setReplyAttachments([]);
        setOutboundPendingId(localId);
      });

      window.requestAnimationFrame(() => {
        document.getElementById(`thread-msg-${localId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });

      setReplySending(true);
      await withDeadline(
        executeWithAuth(async () => {
          await ticketService.replyToTicket(detail.ticket.id, payloadContent, payloadFormat);
        }),
        REPLY_SEND_TOTAL_TIMEOUT_MS,
        'SEND_REPLY_TIMEOUT',
      );

      if (!mountedRef.current) return;

      replyDraftBackupRef.current = null;
      void queryClient.invalidateQueries({ queryKey: ['advisorTickets'] });

      void (async () => {
        try {
          await new Promise<void>((r) => {
            window.setTimeout(r, 400);
          });
          if (!mountedRef.current) return;
          const next = await executeWithAuth(() => ticketService.getTicketDetail(detail.ticket.id));
          if (!mountedRef.current) return;
          queryClient.setQueryData<TicketDetail>(['advisorTicketDetail', ticketId], (prev) => {
            if (!prev) return next;
            const server = next.comments;
            const locals = prev.comments.filter((c) => {
              if (!c.id.startsWith('local-')) return false;
              return !server.some(
                (sc) =>
                  sc.author_id === c.author_id &&
                  sc.content === c.content &&
                  Math.abs(new Date(sc.created_at).getTime() - new Date(c.created_at).getTime()) < 180_000,
              );
            });
            if (locals.length === 0) return next;
            const merged = [...server, ...locals].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
            return { ...next, comments: merged };
          });
        } catch (e) {
          console.warn('[TicketDetailPage] thread refresh after reply failed', e);
          void queryClient.invalidateQueries({ queryKey: ['advisorTicketDetail', ticketId] });
        }
      })();
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        rollbackReplyFailure();
        window.location.href = '/login';
        return;
      }
      rollbackReplyFailure();
      if (err instanceof Error && err.message === 'SEND_REPLY_TIMEOUT') {
        setReplyError(
          'Sending timed out. If you attached large files, try fewer files or a smaller size, then try again.',
        );
        return;
      }
      const msg = err instanceof Error ? err.message : 'Failed to send reply';
      setReplyError(msg.length > 200 ? 'Your reply could not be sent. Please try again.' : msg);
      toast.error('Reply was not delivered. Your draft has been restored.');
    } finally {
      if (mountedRef.current) {
        setReplySending(false);
        setOutboundPendingId(null);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (!mountedRef.current) return;
            replyTextareaRef.current?.focus();
          });
        });
      }
    }
  };

  if (!ticketId || !UUID_RE.test(ticketId)) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <p className="text-th-text-secondary">Invalid ticket link.</p>
        <Button type="button" variant="primary" className="mt-6" onClick={goToTicketList}>
          Back to tickets
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-th-accent-600" />
          <p className="text-sm text-th-text-tertiary">Loading ticket…</p>
        </div>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <p className="text-th-text-primary">{loadError || 'Ticket not found'}</p>
        <Button type="button" variant="primary" className="mt-6" onClick={goToTicketList}>
          Back to tickets
        </Button>
      </div>
    );
  }

  const { ticket, comments, ticket_files: openingAttachments = [] } = detail;

  const requesterId = ticket.requester_id ?? null;
  const profileAuthorIds = [profile?.user_id, profile?.id].filter((x): x is string => Boolean(x));

  const ticketRefLabel = formatTicketRef(ticket.id);
  const requesterDisplay = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email || 'You'
    : 'You';
  const requesterEmail = profile?.email ?? '';

  let lastActivityAt = ticket.updated_at;
  for (const c of comments) {
    if (c.created_at > lastActivityAt) lastActivityAt = c.created_at;
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 px-4 pb-8 sm:px-6 lg:px-8 2xl:max-w-[100rem] 2xl:px-10">
      <nav
        className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={goToTicketList}
          className="transition-colors hover:text-slate-800 dark:hover:text-slate-200"
        >
          Tickets
        </button>
        <ChevronRight size={14} className="shrink-0 opacity-60" aria-hidden />
        <span className="font-mono text-slate-700 dark:text-slate-300" title={ticket.id}>
          {ticketRefLabel}
        </span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 gap-3">
              <button
                type="button"
                onClick={goToTicketList}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                aria-label="Back to tickets"
              >
                <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
              <div className="flex min-w-0 gap-3">
                <div className="hidden shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20 sm:flex sm:h-12 sm:w-12">
                  <Ticket size={24} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Ticket <span className="font-mono normal-case text-slate-600 dark:text-slate-300">#{ticket.ticket_number}</span>
                  </p>
                  <h1 className="break-words text-xl font-bold leading-snug text-slate-900 dark:text-white sm:text-2xl">
                    {ticket.subject}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold',
                        itstsStatusChipClass(ticket.status),
                      )}
                    >
                      {formatStatusLabel(ticket.status)}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold',
                        itstsPriorityChipClass(ticket.priority),
                      )}
                    >
                      {formatEnumLabel(ticket.priority)}
                    </span>
                    {ticket.category ? (
                      <span className="rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {ticket.category}
                      </span>
                    ) : null}
                    {ticket.assignee_id ? (
                      <span
                        className="inline-flex max-w-[min(100%,28rem)] items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
                        title="This is the support team member responsible for your ticket."
                      >
                        <UserCheck size={14} className="shrink-0 opacity-90" aria-hidden />
                        <span className="min-w-0 truncate">
                          {(() => {
                            const who = assigneeDisplayLine(ticket);
                            if (!who) return 'Assigned to a support agent';
                            if (looksLikeEmail(who)) {
                              return (
                                <>
                                  Assigned to{' '}
                                  <a
                                    href={`mailto:${who}`}
                                    className="font-medium underline decoration-emerald-600/50 underline-offset-2 hover:decoration-emerald-800 dark:decoration-emerald-400/50 dark:hover:decoration-emerald-200"
                                  >
                                    {who}
                                  </a>
                                </>
                              );
                            }
                            return <>Assigned to {who}</>;
                          })()}
                        </span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                        title="Your ticket is in the queue until a support agent picks it up."
                      >
                        <UserRound size={14} className="shrink-0 opacity-90" aria-hidden />
                        Unassigned
                      </span>
                    )}
                  </div>
                  {ticket.assignee_id ? (
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-100/90">
                      <span className="font-medium">Who is helping you:</span>{' '}
                      {(() => {
                        const who = assigneeDisplayLine(ticket);
                        if (!who) return 'A member of our support team is assigned and will follow up in this thread.';
                        if (looksLikeEmail(who)) {
                          return (
                            <>
                              <a
                                href={`mailto:${who}`}
                                className="font-semibold text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 hover:decoration-emerald-950 dark:text-emerald-200 dark:decoration-emerald-300/40"
                              >
                                {who}
                              </a>{' '}
                              is your contact for this ticket.
                            </>
                          );
                        }
                        return (
                          <>
                            <span className="font-semibold text-emerald-950 dark:text-emerald-50">{who}</span> is your
                            contact for this ticket.
                          </>
                        );
                      })()}
                    </p>
                  ) : null}
                  {ticket.assignee_id ? null : (
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      This ticket is not assigned to a specific agent yet. Our team will assign it when they start
                      working on your request—you can still reply below anytime.
                    </p>
                  )}
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {ticket.created_at ? (
                      <span
                        className="inline-flex items-center gap-1 tabular-nums"
                        title={format(new Date(ticket.created_at), 'PPpp')}
                      >
                        <Calendar size={12} className="shrink-0 opacity-80" aria-hidden />
                        Opened {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </span>
                    ) : null}
                    <span className="hidden sm:inline" aria-hidden>
                      ·
                    </span>
                    <span
                      className="inline-flex items-center gap-1 tabular-nums"
                      title={format(new Date(lastActivityAt), 'PPpp')}
                    >
                      <Clock size={12} className="shrink-0 opacity-80" aria-hidden />
                      Last activity {formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => void copyTicketNumber()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copiedField === 'num' ? (
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <Copy size={14} aria-hidden />
                )}
                Copy #{ticket.ticket_number}
              </button>
              <button
                type="button"
                onClick={() => void copyTicketLink()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copiedField === 'link' ? (
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <Copy size={14} aria-hidden />
                )}
                Copy page link
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px] xl:gap-8 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_360px]">
        <main className="min-w-0 space-y-6" aria-label="Ticket conversation">
          <div className={panelClass}>
            {ticket.description ? (
              <section className="mb-6">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    <MessageSquare size={22} className="shrink-0 text-slate-500" aria-hidden />
                    Ticket description
                  </h2>
                  {ticket.created_at ? (
                    <span
                      className="text-xs tabular-nums text-slate-500 dark:text-slate-400"
                      title={format(new Date(ticket.created_at), 'PPpp')}
                    >
                      Submitted {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                  ) : null}
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-white/90 px-5 py-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/35 sm:px-8 sm:py-7">
                  <div className="max-w-4xl [overflow-wrap:anywhere]">
                    <TicketDescriptionBlock description={ticket.description} />
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Paperclip size={16} className="shrink-0 text-slate-500" aria-hidden />
                Submitted attachments
              </h2>
              {openingAttachments.length > 0 ? (
                <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900/40">
                  {openingAttachments.map((f) => {
                    const href = openingAttachmentUrls[f.id];
                    const sizeLabel = formatAttachmentSize(f.file_size);
                    const viewHint = attachmentUsuallyPreviewableInBrowser(f.mime_type, f.filename)
                      ? 'Opens in a new tab — your browser may show it inline (e.g. PDF or image).'
                      : 'Opens in a new tab — your browser may still preview some types.';
                    return (
                      <li
                        key={f.id}
                        className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {f.filename}
                        </span>
                        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
                          {sizeLabel ? (
                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{sizeLabel}</span>
                          ) : null}
                          {href ? (
                            <>
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={viewHint}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                aria-label={`View ${f.filename} in browser`}
                              >
                                <Eye size={14} className="shrink-0 opacity-90" aria-hidden />
                                View
                              </a>
                              <a
                                href={href}
                                download={f.filename}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                aria-label={`Download ${f.filename}`}
                              >
                                <Download size={14} className="shrink-0 opacity-90" aria-hidden />
                                Download
                              </a>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">Preparing link…</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-400">
                  No files were attached when this ticket was opened.
                </p>
              )}
            </section>

            <section className="scroll-mt-4 border-t border-slate-200 pt-6 dark:border-slate-700">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <MessageSquare size={18} className="shrink-0 text-slate-500" aria-hidden />
                Thread
              </h2>

              {comments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-14 text-center dark:border-slate-700">
                  <MessageSquare
                    className="mx-auto mb-3 h-11 w-11 text-slate-400/80 dark:text-slate-500"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">No replies yet</p>
                  <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                    The support team will respond here. Add context or attachments below whenever you need to.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4 sm:space-y-5">
                  {comments.map((comment) => {
                    const isRequesterMessage = requesterId
                      ? comment.author_id === requesterId
                      : profileAuthorIds.includes(comment.author_id);
                    const showName = isRequesterMessage ? 'You' : comment.author_name;
                    const avatarInitial = (isRequesterMessage ? requesterDisplay : comment.author_name).charAt(0);

                    return (
                      <li
                        aria-live={comment.id.startsWith('local-') ? 'polite' : undefined}
                        id={`thread-msg-${comment.id}`}
                        key={comment.id}
                        className={cn(
                          'flex w-full scroll-mt-28',
                          isRequesterMessage ? 'justify-end' : 'justify-start',
                          comment.id.startsWith('local-') &&
                            'animate-in fade-in slide-in-from-bottom-2 duration-300',
                        )}
                      >
                        <article
                          className={cn(
                            'flex w-full max-w-full gap-3 sm:gap-4',
                            isRequesterMessage ? 'flex-row-reverse' : 'flex-row',
                          )}
                          aria-label={isRequesterMessage ? 'Your message' : `Message from ${comment.author_name}`}
                        >
                          <div
                            className={cn(
                              'mb-0.5 flex h-9 w-9 shrink-0 self-end items-center justify-center rounded-full text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm',
                              isRequesterMessage
                                ? 'bg-sky-600 ring-2 ring-white dark:bg-sky-500 dark:ring-slate-900'
                                : 'bg-violet-600 ring-2 ring-white dark:bg-violet-500 dark:ring-slate-900',
                            )}
                            aria-hidden
                          >
                            {avatarInitial.toUpperCase()}
                          </div>
                          <div
                            className={cn(
                              'flex min-w-0 flex-1',
                              isRequesterMessage ? 'justify-end' : 'justify-start',
                            )}
                          >
                            <div
                              className={cn(
                                'min-w-0 w-full max-w-[min(100%,44rem)] shadow-sm sm:max-w-[min(100%,48rem)] xl:max-w-[min(100%,52rem)]',
                                'rounded-2xl border px-4 py-3 sm:px-5 sm:py-3.5',
                                isRequesterMessage
                                  ? 'rounded-br-md border-sky-200/90 bg-sky-100/90 text-slate-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-slate-100'
                                  : 'rounded-bl-md border-slate-200/90 bg-slate-100/90 text-slate-900 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-100',
                              )}
                            >
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-black/[0.06] pb-2.5 dark:border-white/10">
                                <span className="text-xs font-semibold sm:text-[13px]">
                                  {showName}
                                </span>
                                {isRequesterMessage ? (
                                  <span className="text-[10px] font-medium uppercase tracking-wide text-sky-800/80 dark:text-sky-200/80">
                                    Requester
                                  </span>
                                ) : null}
                                {isRequesterMessage &&
                                outboundPendingId === comment.id &&
                                replySending ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-200/80 px-2 py-0.5 text-[10px] font-semibold text-sky-950 dark:bg-sky-900/50 dark:text-sky-100">
                                    <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
                                    Sending…
                                  </span>
                                ) : null}
                                {!isRequesterMessage ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                                    <Headphones size={10} className="opacity-90" aria-hidden />
                                    Support
                                  </span>
                                ) : null}
                                {comment.is_internal ? (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-200/90 px-1 py-px text-[9px] font-semibold text-amber-950 dark:bg-amber-950/60 dark:text-amber-100">
                                    <Lock size={9} aria-hidden />
                                    Internal
                                  </span>
                                ) : null}
                                <span
                                  className={cn(
                                    'ml-auto text-[11px] tabular-nums sm:text-xs',
                                    isRequesterMessage
                                      ? 'text-sky-900/55 dark:text-sky-200/55'
                                      : 'text-slate-500 dark:text-slate-400',
                                  )}
                                  title={format(new Date(comment.created_at), 'PPpp')}
                                >
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="pt-3 text-sm leading-relaxed text-slate-900 sm:text-[15px] sm:leading-7 dark:[&_.prose]:text-neutral-200">
                                <TicketCommentContent
                                  content={comment.content}
                                  contentFormat={comment.content_format}
                                />
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div id="ticket-conversation-anchor" className="h-px w-full scroll-mt-32" aria-hidden />

              <section
                className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700"
                aria-label="Add reply"
                aria-busy={replySending}
              >
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <MessageSquare size={16} aria-hidden />
                  Add reply
                </h2>
                <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your message…"
                    rows={5}
                    maxLength={10000}
                    disabled={replySending}
                    className="min-h-[120px] w-full resize-y border-0 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
                  />
                  <div className="flex items-center border-t border-slate-200 px-1 py-0.5 dark:border-slate-600 dark:bg-slate-900/25">
                    <input
                      ref={replyAttachmentsInputRef}
                      type="file"
                      multiple
                      className="sr-only"
                      tabIndex={-1}
                      onChange={onReplyAttachmentsInputChange}
                    />
                    <button
                      type="button"
                      disabled={replySending}
                      className="inline-flex items-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      aria-label="Attach files"
                      title="Attach files"
                      onClick={() => replyAttachmentsInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                {replyAttachments.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {replyAttachments.map((file, idx) => (
                      <li
                        key={`${file.name}-${file.size}-${idx}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <span className="max-w-[min(100%,28rem)] truncate sm:max-w-md lg:max-w-lg">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                          aria-label={`Remove ${file.name}`}
                          onClick={() =>
                            setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {replyError ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{replyError}</span>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={replySending || (!replyContent.trim() && replyAttachments.length === 0)}
                    aria-busy={replySending}
                    onClick={() => void handleSendReply()}
                  >
                    {replySending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send reply
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-right text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  After you send, your message appears in the thread above. Attachments upload first; you can combine
                  text and files or send files alone.
                </p>
              </section>
            </section>
          </div>
        </main>

        <aside
          className="space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-0.5"
          aria-label="Ticket properties"
        >
          <div className={panelClass}>
            <h2 className="mb-4 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
              Properties
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Reference
                </dt>
                <dd className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                  #{ticket.ticket_number}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </dt>
                <dd className="text-right">
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2.5 py-1 text-xs font-semibold',
                      itstsStatusChipClass(ticket.status),
                    )}
                  >
                    {formatStatusLabel(ticket.status)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Priority
                </dt>
                <dd className="text-right">
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2.5 py-1 text-xs font-semibold',
                      itstsPriorityChipClass(ticket.priority),
                    )}
                  >
                    {formatEnumLabel(ticket.priority)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Assigned to
                </dt>
                <dd className="max-w-[12rem] text-right text-xs font-medium leading-snug text-slate-900 dark:text-slate-100 sm:max-w-[16rem]">
                  {ticket.assignee_id ? (
                    (() => {
                      const who = assigneeDisplayLine(ticket);
                      if (!who) {
                        return (
                          <span className="inline-flex items-center justify-end gap-1 text-emerald-700 dark:text-emerald-400">
                            <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Support agent (name on next refresh)
                          </span>
                        );
                      }
                      if (looksLikeEmail(who)) {
                        return (
                          <span className="inline-flex items-center justify-end gap-1 text-emerald-700 dark:text-emerald-400">
                            <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <a
                              href={`mailto:${who}`}
                              className="break-all underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-800 dark:decoration-emerald-400/40"
                            >
                              {who}
                            </a>
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center justify-end gap-1 text-emerald-700 dark:text-emerald-400">
                          <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="break-words">{who}</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="inline-flex items-center justify-end gap-1 text-amber-800 dark:text-amber-200">
                      <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Not yet — in queue
                    </span>
                  )}
                </dd>
              </div>
              {ticket.category ? (
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Category
                  </dt>
                  <dd className="text-right">
                    <span className="rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {ticket.category}
                    </span>
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Status is updated by support as your ticket moves through the queue.
            </p>
          </div>

          <div className={panelClass}>
            <h2 className="mb-3 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
              Requester
            </h2>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{requesterDisplay}</p>
            {requesterEmail ? (
              <a
                href={`mailto:${requesterEmail}`}
                className="mt-1 inline-block break-all text-sm text-sky-600 hover:underline dark:text-sky-400"
              >
                {requesterEmail}
              </a>
            ) : null}
          </div>

          <div className={panelClass}>
            <h2 className="mb-3 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
              Timeline
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="flex shrink-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Tag size={14} aria-hidden />
                  Origin
                </dt>
                <dd className="text-right font-medium text-slate-900 dark:text-slate-100">Advisor Portal</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="flex shrink-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar size={14} aria-hidden />
                  Opened
                </dt>
                <dd className="text-right text-slate-900 dark:text-slate-100">
                  {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="flex shrink-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock size={14} aria-hidden />
                  Last activity
                </dt>
                <dd className="text-right text-slate-900 dark:text-slate-100">
                  {format(new Date(lastActivityAt), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
