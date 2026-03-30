import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ShieldCheck,
  ChevronLeft,
  AlertCircle,
  Clock,
  CircleDot,
  Loader2,
  XCircle,
  Send,
  User,
  Lock,
  X,
} from 'lucide-react';
import {
  ticketService,
  appendTicketAttachmentsHtml,
  type AdminTicketDetail,
  type TicketStatus,
  type TicketPriority,
} from '@mpbhealth/admin-core';
import toast from 'react-hot-toast';
import { sanitizeHtml } from '@mpbhealth/utils';
import { TicketCommentContent } from '../components/tickets/TicketCommentContent';
import {
  TicketRichReplyEditor,
  type TicketRichReplyEditorRef,
} from '../components/tickets/TicketRichReplyEditor';

const richTicketEditor = true;

const MAX_REPLY_ATTACHMENTS = 10;
const MAX_REPLY_FILE_BYTES = 15 * 1024 * 1024;

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: <CircleDot className="w-3.5 h-3.5" /> },
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3.5 h-3.5" /> },
  closed: { label: 'Closed', color: 'bg-neutral-100 text-neutral-600', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-neutral-100 text-neutral-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AdminTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reply
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const richReplyRef = useRef<TicketRichReplyEditorRef>(null);
  const [richHasContent, setRichHasContent] = useState(false);
  const [replyEditorKey, setReplyEditorKey] = useState(0);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);

  // Status / priority update
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const loadDetail = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError('');
    try {
      const d = await ticketService.getTicketDetailAdmin(ticketId);
      setDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

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
    if (!detail) throw new Error('No ticket');
    try {
      return await ticketService.uploadImageForTicketReply(detail.ticket.id, file);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Image upload failed');
      throw e;
    }
  };

  const handleSendReply = async () => {
    if (!detail) return;
    const wasInternal = isInternalNote;
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
      if (richTicketEditor) {
        let html = sanitizeHtml(richReplyRef.current?.getHtml() ?? '');
        if (replyAttachments.length > 0) {
          const uploads = await ticketService.uploadFilesForTicketReply(detail.ticket.id, replyAttachments);
          html = appendTicketAttachmentsHtml(html, uploads);
        }
        html = sanitizeHtml(html);
        await ticketService.addComment(detail.ticket.id, html, wasInternal, 'html');
      } else {
        await ticketService.addComment(detail.ticket.id, replyContent.trim(), wasInternal, 'plain');
      }
      const refreshed = await ticketService.getTicketDetailAdmin(detail.ticket.id);
      setDetail(refreshed);
      setReplyContent('');
      setReplyAttachments([]);
      setIsInternalNote(false);
      setReplyEditorKey((k) => k + 1);
      richReplyRef.current?.clear();
      toast.success(wasInternal ? 'Internal note added' : 'Reply sent');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setReplySending(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!detail) return;
    setUpdating(true);
    setUpdateError('');
    try {
      await ticketService.updateTicket(detail.ticket.id, { status: newStatus });
      const refreshed = await ticketService.getTicketDetailAdmin(detail.ticket.id);
      setDetail(refreshed);
      toast.success('Status updated');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!detail) return;
    setUpdating(true);
    setUpdateError('');
    try {
      await ticketService.updateTicket(detail.ticket.id, { priority: newPriority });
      const refreshed = await ticketService.getTicketDetailAdmin(detail.ticket.id);
      setDetail(refreshed);
      toast.success('Priority updated');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/support/tickets')}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to tickets
        </button>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || 'Ticket not found'}</span>
          <button
            type="button"
            onClick={loadDetail}
            className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { ticket, comments } = detail;
  const sc = STATUS_CONFIG[ticket.status];
  const pc = PRIORITY_CONFIG[ticket.priority];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/support/tickets')}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to tickets
      </button>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {/* Ticket header */}
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
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

            {/* Status & Priority controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={updating}
                title="Ticket status"
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              >
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                disabled={updating}
                title="Ticket priority"
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
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
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{updateError}</span>
            </div>
          )}

          {/* Requester info */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-sm text-neutral-500">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-neutral-700">{ticket.requester_name}</span>
            {ticket.requester_email && (
              <>
                <span className="text-neutral-300">·</span>
                <span>{ticket.requester_email}</span>
              </>
            )}
            {ticket.requester_agent_id && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  Agent ID: {ticket.requester_agent_id}
                </span>
              </>
            )}
            {ticket.requester_company && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-600">{ticket.requester_company}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="p-6 border-b border-neutral-100">
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {/* Conversation thread */}
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">
            Conversation ({comments.length})
          </h3>
          {comments.length === 0 ? (
            <p className="text-sm text-neutral-500">No replies yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-3 rounded-lg p-2 -mx-2 ${comment.is_internal ? 'bg-amber-50 border border-amber-200' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${comment.is_internal ? 'bg-amber-200' : 'bg-neutral-200'}`}>
                    {comment.is_internal
                      ? <Lock className="w-3.5 h-3.5 text-amber-700" />
                      : <span className="text-xs font-medium text-neutral-600">{comment.author_name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-neutral-900">{comment.author_name}</span>
                      {comment.is_internal && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Internal Note
                        </span>
                      )}
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <TicketCommentContent
                      content={comment.content}
                      contentFormat={comment.content_format}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply form */}
        <div className="p-6">
          {/* Reply type toggle */}
          <div className="flex items-center gap-1 mb-3 bg-neutral-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => { setIsInternalNote(false); setReplyAttachments([]); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !isInternalNote ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Send Reply
            </button>
            <button
              onClick={() => { setIsInternalNote(true); setReplyAttachments([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isInternalNote ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Internal Note
            </button>
          </div>

          {richTicketEditor ? (
            <>
              <TicketRichReplyEditor
                key={`${detail.ticket.id}-reply-${replyEditorKey}-${isInternalNote}`}
                ref={richReplyRef}
                variant={isInternalNote ? 'internal' : 'default'}
                placeholder={
                  isInternalNote
                    ? 'Add an internal note (not visible to advisor)...'
                    : 'Type your reply...'
                }
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
              placeholder={isInternalNote ? 'Add an internal note (not visible to advisor)...' : 'Type your reply...'}
              rows={4}
              className={`w-full rounded-lg border px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none transition-colors resize-none ${
                isInternalNote
                  ? 'border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-400/20'
                  : 'border-neutral-300 bg-white focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          )}

          {replyError && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{replyError}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            {isInternalNote && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Only visible to admin team — not sent to advisor
              </p>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSendReply}
                disabled={
                  replySending ||
                  (richTicketEditor
                    ? !richHasContent && replyAttachments.length === 0
                    : !replyContent.trim())
                }
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                  isInternalNote
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {replySending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isInternalNote ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {isInternalNote ? 'Save Note' : 'Send Reply'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket metadata footer */}
      <div className="flex items-center gap-4 px-1 text-xs text-neutral-400 flex-wrap">
        <span>
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
          Ticket #{ticket.ticket_number}
        </span>
        <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
        <span>Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
      </div>
    </div>
  );
}
