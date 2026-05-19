import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Users,
  Ticket,
  ChevronRight,
  Sparkles,
  Clock,
  Shield,
  Copy,
  Check,
  Keyboard,
  Paperclip,
  LayoutDashboard,
  List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ticketService, type TicketPriority } from '@mpbhealth/advisor-core';
import { sanitizeHtml } from '@mpbhealth/utils';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { useTicketAuth } from '../components/TicketAuthWrapper';
import { TicketRichReplyEditor, type TicketRichReplyEditorRef } from '../components/tickets/TicketRichReplyEditor';
import { TicketNewFileUpload } from '../components/tickets/TicketNewFileUpload';

const FALLBACK_CATEGORIES = [
  'Technical Issue',
  'Account Management',
  'Billing & Payments',
  'Portal Access',
  'General Inquiry',
  'Other',
];

const PRIORITY_OPTIONS: {
  value: TicketPriority;
  label: string;
  description: string;
  className: string;
}[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minor impact',
    className:
      'data-[active=true]:border-slate-400 data-[active=true]:bg-slate-50 dark:data-[active=true]:bg-slate-800/80 data-[active=true]:ring-2 data-[active=true]:ring-slate-400/30',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Standard',
    className:
      'data-[active=true]:border-sky-500 data-[active=true]:bg-sky-50 dark:data-[active=true]:bg-sky-950/40 data-[active=true]:ring-2 data-[active=true]:ring-sky-500/30',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Significant',
    className:
      'data-[active=true]:border-amber-500 data-[active=true]:bg-amber-50 dark:data-[active=true]:bg-amber-950/35 data-[active=true]:ring-2 data-[active=true]:ring-amber-500/30',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Critical',
    className:
      'data-[active=true]:border-red-500 data-[active=true]:bg-red-50 dark:data-[active=true]:bg-red-950/40 data-[active=true]:ring-2 data-[active=true]:ring-red-500/30',
  },
];

const SUBJECT_MAX = 255;
const MAX_ATTACHMENT_COUNT = 10;
const MAX_ATTACHMENT_SIZE_MB = 15;

/** Hard cap so the submit button never stays stuck if network, SW, or edge misbehaves. */
const CREATE_TICKET_UI_DEADLINE_MS = 120_000;

/** Prefix for browser console — copy logs to share when ticket create misbehaves. */
const NEW_TICKET_SUBMIT_LOG = '[AdvisorPortal NewTicket submit]';

function formatTicketRef(ticketId: string) {
  return ticketId ? `#${ticketId.replace(/-/g, '').slice(0, 8).toUpperCase()}` : '';
}

function escapeHtmlSafe(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function SectionTitle({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex gap-3 mb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-th-accent-600/10 text-xs font-bold text-th-accent-700 dark:bg-th-accent-500/15 dark:text-th-accent-300 border border-th-accent-200/60 dark:border-th-accent-800/50">
        {step}
      </span>
      <div>
        <h2 className="text-base font-bold text-th-text-primary tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-th-text-tertiary mt-0.5">{description}</p> : null}
      </div>
    </div>
  );
}

export default function NewTicket() {
  useAdvisorPageDebugLog('NewTicket');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, loading: authInitializing, hasSession } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const { executeWithAuth } = useTicketAuth();
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const descriptionEditorRef = useRef<TicketRichReplyEditorRef>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  /** Shown on success screen when ticket saved but attachment pipeline failed (toast alone is easy to miss). */
  const [submittedAttachmentWarning, setSubmittedAttachmentWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileUploadKey, setFileUploadKey] = useState(0);
  /** Bumps when rich text changes so plain-text length / completion % stay in sync. */
  const [descRevision, setDescRevision] = useState(0);

  const [isForMember, setIsForMember] = useState(false);
  const [memberInfo, setMemberInfo] = useState({ member_id: '', member_name: '', member_email: '' });

  const [formData, setFormData] = useState({
    subject: '',
    priority: 'medium' as TicketPriority,
    category: '',
  });

  const submitGuardRef = useRef(false);

  useEffect(() => {
    if (authInitializing) return;
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [authInitializing, hasSession, navigate]);

  useEffect(() => {
    if (!advisorReady) {
      setCatLoading(true);
      return;
    }
    let cancelled = false;
    const catFallbackTimer = setTimeout(() => {
      if (!cancelled && categories.length === 0) {
        setCategories(FALLBACK_CATEGORIES);
        setCatLoading(false);
      }
    }, 3_000);

    ticketService
      .getCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats.length ? cats : FALLBACK_CATEGORIES);
      })
      .catch(() => {
        if (!cancelled) setCategories(FALLBACK_CATEGORIES);
      })
      .finally(() => {
        if (!cancelled) setCatLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(catFallbackTimer);
    };
  }, [advisorReady]);

  const displayName = useMemo(() => {
    if (!profile) return '';
    const n = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
    return n || profile.email || '';
  }, [profile]);

  const plainDescriptionLength = useMemo(() => {
    const html = descriptionEditorRef.current?.getHtml() ?? '';
    return html.replace(/<[^>]*>/g, '').trim().length;
  }, [descRevision]);

  const completionPct = useMemo(() => {
    let n = 0;
    const total = 4;
    if (formData.subject.trim().length >= 3) n++;
    if (plainDescriptionLength >= 20) n++;
    if (formData.category) n++;
    if (formData.priority) n++;
    return Math.round((n / total) * 100);
  }, [formData.subject, formData.category, formData.priority, plainDescriptionLength]);

  const mergeEditorAttachments = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;
      setFiles((prev) => {
        const combined = [...prev, ...incoming];
        if (combined.length > MAX_ATTACHMENT_COUNT) {
          toast.error(`You can attach up to ${MAX_ATTACHMENT_COUNT} files.`);
          return prev;
        }
        const maxBytes = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
        for (const f of incoming) {
          if (f.size > maxBytes) {
            toast.error(`"${f.name}" exceeds the ${MAX_ATTACHMENT_SIZE_MB} MB limit.`);
            return prev;
          }
        }
        const deduped = combined.filter(
          (file, idx, arr) =>
            arr.findIndex(
              (x) => x.name === file.name && x.size === file.size && x.lastModified === file.lastModified,
            ) === idx,
        );
        return deduped;
      });
    },
    [],
  );

  const onDescriptionDraftChange = useCallback(() => {
    setDescRevision((n) => n + 1);
  }, []);

  const buildDescriptionPayload = useCallback(() => {
    const bodyHtml = descriptionEditorRef.current?.getHtml() ?? '';
    let inner = bodyHtml.trim();
    if (isForMember && (memberInfo.member_id || memberInfo.member_name || memberInfo.member_email)) {
      const lines: string[] = ['<p><strong>On behalf of member</strong></p><ul>'];
      if (memberInfo.member_id.trim()) {
        lines.push(`<li>Member ID: ${escapeHtmlSafe(memberInfo.member_id.trim())}</li>`);
      }
      if (memberInfo.member_name.trim()) {
        lines.push(`<li>Member name: ${escapeHtmlSafe(memberInfo.member_name.trim())}</li>`);
      }
      if (memberInfo.member_email.trim()) {
        lines.push(`<li>Member email: ${escapeHtmlSafe(memberInfo.member_email.trim())}</li>`);
      }
      lines.push('</ul>');
      inner = `${lines.join('')}${inner ? `<hr /><div>${inner}</div>` : ''}`;
    } else {
      inner = inner || '<p></p>';
    }
    return sanitizeHtml(inner);
  }, [isForMember, memberInfo]);

  const submitTicket = useCallback(async () => {
    setError(null);
    if (submitGuardRef.current) return;
    if (!advisorReady) return;

    if (formData.subject.trim().length < 3) {
      setError('Subject must be at least 3 characters.');
      return;
    }
    const descHtml = descriptionEditorRef.current?.getHtml() ?? '';
    const plainLen = descHtml.replace(/<[^>]*>/g, '').trim().length;
    if (plainLen < 20) {
      setError('Please add a bit more detail in the description (at least 20 characters).');
      return;
    }

    const description = buildDescriptionPayload();
    submitGuardRef.current = true;
    setSubmitting(true);
    const submitCorrelationId =
      typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `nt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const descByteLength = new TextEncoder().encode(description).length;
    const attachmentDetails = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || null,
      lastModified: f.lastModified,
    }));
    console.info(NEW_TICKET_SUBMIT_LOG, 'start', {
      correlationId: submitCorrelationId,
      subjectLength: formData.subject.trim().length,
      descriptionChars: description.length,
      descriptionUtf8Bytes: descByteLength,
      category: formData.category || null,
      priority: formData.priority,
      attachmentCount: files.length,
      attachmentTotalBytes: files.reduce((n, f) => n + f.size, 0),
      attachmentDetails,
      isForMember,
    });
    try {
      const result = await Promise.race([
        executeWithAuth(() =>
          ticketService.createTicket({
            subject: formData.subject.trim(),
            description,
            category: formData.category || undefined,
            priority: formData.priority,
            attachments: files,
          }),
        ),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('CREATE_TICKET_TIMEOUT')), CREATE_TICKET_UI_DEADLINE_MS);
        }),
      ]);
      console.info(NEW_TICKET_SUBMIT_LOG, 'success', {
        correlationId: submitCorrelationId,
        ticketId: result.ticket_id,
        ticketNumber: result.ticket_number,
        attachmentsAttempted: files.length,
        attachmentsSavedSuccessfully: files.length > 0 ? !result.attachmentError : null,
        attachmentError: result.attachmentError ?? null,
        attachmentDetails:
          files.length > 0
            ? files.map((f) => ({ name: f.name, size: f.size, type: f.type || null }))
            : [],
      });
      if (result.attachmentError) {
        setSubmittedAttachmentWarning(result.attachmentError);
        toast.error(
          `Ticket #${result.ticket_number} submitted, but attachments failed: ${result.attachmentError}. You can add files by replying to the ticket.`,
          { duration: 8000 },
        );
      } else {
        setSubmittedAttachmentWarning(null);
        toast.success(`Ticket #${result.ticket_number} submitted!`);
      }
      // Clear any stale detail cache (e.g. failed prefetch) and refresh lists so
      // "Open ticket" / tickets list work without a full page refresh.
      queryClient.removeQueries({ queryKey: ['advisorTicketDetail', result.ticket_id] });
      void queryClient.invalidateQueries({ queryKey: ['advisorTickets'] });
      void queryClient.invalidateQueries({ queryKey: ['advisorTicketStats'] });
      setSubmittedTicketId(result.ticket_id);
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CREATE_TICKET_TIMEOUT') {
        console.warn(NEW_TICKET_SUBMIT_LOG, 'timeout', {
          correlationId: submitCorrelationId,
          deadlineMs: CREATE_TICKET_UI_DEADLINE_MS,
          hint: 'Ticket may still have been created server-side; check ticket list.',
          attachmentCountAtSubmit: files.length,
          attachmentDetails:
            files.length > 0
              ? files.map((f) => ({ name: f.name, size: f.size }))
              : [],
        });
        setError(
          'Creating your ticket is taking too long. Check your connection, then check My tickets—your ticket may still have been created.',
        );
        void queryClient.invalidateQueries({ queryKey: ['advisorTickets'] });
        void queryClient.invalidateQueries({ queryKey: ['advisorTicketStats'] });
      } else if (msg.includes('SESSION_EXPIRED') || msg.includes('refresh_token') || msg.includes('Invalid login')) {
        console.warn(NEW_TICKET_SUBMIT_LOG, 'session_redirect_login', {
          correlationId: submitCorrelationId,
          message: msg,
        });
        toast.error('Your session has expired. Redirecting to sign in…');
        navigate('/login', { replace: true });
        return;
      }
      if (/temporarily unavailable|not yet configured/i.test(msg)) {
        console.error(NEW_TICKET_SUBMIT_LOG, 'support_unavailable', {
          correlationId: submitCorrelationId,
          message: msg,
        });
        setError('The support system is temporarily unavailable. Please try again in a few minutes.');
      } else {
        console.error(NEW_TICKET_SUBMIT_LOG, 'error', {
          correlationId: submitCorrelationId,
          message: msg || String(err),
          name: err instanceof Error ? err.name : typeof err,
          stack: err instanceof Error ? err.stack : undefined,
          attachmentCountAtSubmit: files.length,
        });
        setError(msg || 'Failed to submit ticket. Please try again.');
      }
    } finally {
      submitGuardRef.current = false;
      setSubmitting(false);
    }
  }, [
    formData.subject,
    formData.category,
    formData.priority,
    buildDescriptionPayload,
    files,
    navigate,
    queryClient,
    executeWithAuth,
    advisorReady,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTicket();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitted || submitting || !advisorReady) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const form = document.getElementById('ticket-new-form');
        if (form && form.contains(document.activeElement)) {
          e.preventDefault();
          void submitTicket();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, submitting, advisorReady, submitTicket]);

  const copyRef = async (id: string) => {
    const url = `${window.location.origin}/tickets/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmittedTicketId(null);
    setSubmittedAttachmentWarning(null);
    setFormData({ subject: '', priority: 'medium', category: '' });
    setIsForMember(false);
    setMemberInfo({ member_id: '', member_name: '', member_email: '' });
    setFiles([]);
    setFileUploadKey((k) => k + 1);
    setError(null);
    setDescRevision(0);
    descriptionEditorRef.current?.clear();
    requestAnimationFrame(() => subjectInputRef.current?.focus());
  };

  if (authInitializing || (hasSession && !advisorReady)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-th-accent-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted && submittedTicketId) {
    const refLabel = formatTicketRef(submittedTicketId);
    return (
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">
        <div
          className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-b from-surface-primary to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20 shadow-xl shadow-emerald-900/5 dark:shadow-black/40"
          role="status"
          aria-live="polite"
          aria-label={`Ticket created successfully. Reference ${refLabel}.`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
          <div className="p-8 sm:p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 ring-4 ring-emerald-500/10">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={36} strokeWidth={2} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/90 dark:text-emerald-400/90 mb-2">
              Ticket created
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-th-text-primary mb-1 tracking-tight">
              {refLabel}
            </h1>
            <p className="text-sm text-th-text-secondary mb-6 max-w-sm mx-auto">
              Your request is saved. Open it below to add replies or attachments anytime.
            </p>
            {submittedAttachmentWarning ? (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 max-w-md mx-auto"
              >
                <p className="font-semibold mb-1">Attachments were not saved</p>
                <p className="text-amber-900/90 dark:text-amber-100/90">{submittedAttachmentWarning}</p>
                <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-200/80">
                  Open the ticket and attach files in a reply, or submit another ticket after deploying the fix.
                </p>
              </div>
            ) : null}
            <p id="ticket-success-desc" className="sr-only">
              Ticket reference {refLabel}. Use Open ticket to view the conversation, or go to all tickets or home.
            </p>
            <div className="flex flex-col gap-3 mb-4" aria-describedby="ticket-success-desc">
              <button
                type="button"
                onClick={() => navigate(`/tickets/${submittedTicketId}`)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-th-accent-600 hover:bg-th-accent-700 text-white font-semibold shadow-lg transition-colors w-full sm:w-auto sm:mx-auto min-w-[14rem]"
              >
                <Ticket size={18} aria-hidden />
                Open your ticket
                <ChevronRight size={18} aria-hidden />
              </button>
              <div className="flex flex-col sm:flex-row items-stretch sm:justify-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/tickets')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-th-border bg-surface-primary/80 text-th-text-primary font-medium hover:bg-surface-secondary transition-colors"
                >
                  <List size={18} aria-hidden />
                  All my tickets
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-th-border bg-surface-primary/80 text-th-text-primary font-medium hover:bg-surface-secondary transition-colors"
                >
                  <LayoutDashboard size={18} aria-hidden />
                  Home
                </button>
              </div>
              <button
                type="button"
                onClick={() => void copyRef(submittedTicketId)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-th-text-secondary font-medium hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors mx-auto text-sm"
              >
                {copied ? <Check size={18} className="text-emerald-600" aria-hidden /> : <Copy size={18} aria-hidden />}
                {copied ? 'Link copied' : 'Copy link to ticket'}
              </button>
            </div>
            <p className="text-th-text-tertiary text-xs leading-relaxed mb-4 max-w-sm mx-auto">
              You&apos;ll get email updates when the team replies. Need something else?
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-th-accent-600 dark:text-th-accent-400 hover:underline"
            >
              Submit another ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-th-border bg-surface-primary text-th-text-primary placeholder:text-th-text-tertiary shadow-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500/40 focus:border-th-accent-500 transition-all';

  const panelCls = 'rounded-2xl border border-th-border bg-surface-primary shadow-sm';

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24 sm:pb-12">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-th-text-tertiary mb-6 pt-1">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-1.5 font-medium text-th-text-secondary hover:text-th-accent-600 transition-colors"
        >
          <ArrowLeft size={16} aria-hidden />
          Tickets
        </button>
        <ChevronRight size={14} className="opacity-50 shrink-0" aria-hidden />
        <span className="text-th-text-primary font-medium">New request</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div className="flex gap-4">
          <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-th-accent-600 to-th-accent-800 text-white shadow-lg">
            <Ticket size={28} strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-th-text-primary tracking-tight">New support request</h1>
            <p className="text-th-text-tertiary mt-1 max-w-xl text-sm sm:text-base leading-relaxed">
              Add enough detail for fast triage. Attach files and file on behalf of a member when needed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:self-center">
          <div className="flex-1 lg:w-40 min-w-0">
            <div className="flex justify-between text-[11px] font-medium text-th-text-tertiary mb-1">
              <span>Request readiness</span>
              <span className="tabular-nums">{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-th-accent-500 to-sky-500 transition-all duration-500 ease-out"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6 min-w-0">
          {error ? (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex gap-3"
            >
              <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">Couldn&apos;t create ticket</p>
                <p className="text-sm text-red-800/90 dark:text-red-300/90 mt-1">{error}</p>
              </div>
            </div>
          ) : null}

          <form id="ticket-new-form" onSubmit={handleSubmit} className={`${panelCls} p-6 sm:p-8 space-y-10`}>
            <section aria-labelledby="new-ticket-details-heading">
              <div id="new-ticket-details-heading" className="sr-only">
                Request details
              </div>
              <SectionTitle
                step="1"
                title="Request details"
                description="Clear subject and steps help us resolve faster."
              />
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="ticket-subject"
                    className="block text-sm font-semibold text-th-text-primary mb-2"
                  >
                    Subject <span className="text-red-500 font-normal">*</span>
                  </label>
                  <input
                    ref={subjectInputRef}
                    id="ticket-subject"
                    type="text"
                    required
                    minLength={3}
                    maxLength={SUBJECT_MAX}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Portal login loop after password reset"
                    autoComplete="off"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-th-text-tertiary tabular-nums">
                    <span>{formData.subject.trim().length < 3 ? 'At least 3 characters' : ' '}</span>
                    <span>
                      {formData.subject.length}/{SUBJECT_MAX}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="ticket-description"
                    className="block text-sm font-semibold text-th-text-primary mb-2"
                  >
                    Description <span className="text-red-500 font-normal">*</span>
                  </label>
                  <TicketRichReplyEditor
                    ref={descriptionEditorRef}
                    placeholder="Describe your issue — what happened, steps to reproduce, expected vs actual behavior..."
                    onDraftChange={onDescriptionDraftChange}
                    onAttachFiles={mergeEditorAttachments}
                  />
                  <div className="mt-1.5 text-xs text-th-text-tertiary">
                    {plainDescriptionLength < 20 ? 'A few sentences go a long way (min. 20 characters)' : ' '}
                  </div>
                </div>
              </div>
            </section>

            <section
              className="border-t border-th-border pt-10"
              aria-labelledby="new-ticket-class-heading"
            >
              <SectionTitle
                step="2"
                title="Classification"
                description="Priority drives response timing; category helps routing."
              />
              <div className="space-y-6">
                <div>
                  <span
                    id="priority-label"
                    className="block text-sm font-semibold text-th-text-primary mb-3"
                  >
                    Priority
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="priority-label"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        role="radio"
                        aria-checked={formData.priority === p.value}
                        data-active={formData.priority === p.value}
                        onClick={() => setFormData({ ...formData, priority: p.value })}
                        className={`rounded-xl border-2 border-transparent bg-surface-secondary px-3 py-3 text-left transition-all hover:border-th-border ${p.className}`}
                      >
                        <span className="block text-sm font-bold text-th-text-primary">{p.label}</span>
                        <span className="block text-xs text-th-text-tertiary mt-0.5">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="ticket-category"
                    className="block text-sm font-semibold text-th-text-primary mb-2"
                  >
                    Category <span className="text-th-text-tertiary font-normal">(recommended)</span>
                  </label>
                  <select
                    id="ticket-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={catLoading}
                    className={`${inputCls} cursor-pointer disabled:opacity-60`}
                  >
                    <option value="">{catLoading ? 'Loading categories…' : 'Choose the best fit…'}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="border-t border-th-border pt-10">
              <SectionTitle
                step="3"
                title="On behalf of a member"
                description="Optional — proxy requests with member contact info."
              />
              <div className="rounded-xl border border-th-border overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none bg-surface-secondary/50 hover:bg-surface-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={isForMember}
                    onChange={(e) => {
                      setIsForMember(e.target.checked);
                      if (!e.target.checked) setMemberInfo({ member_id: '', member_name: '', member_email: '' });
                    }}
                    className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={18} className="text-th-text-tertiary shrink-0" aria-hidden />
                    <span className="text-sm font-semibold text-th-text-primary">
                      This request is on behalf of a member
                    </span>
                  </div>
                </label>
                {isForMember ? (
                  <div className="px-4 pb-4 pt-2 border-t border-th-border space-y-4 bg-surface-primary">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-th-text-tertiary mb-1.5">
                          Member ID
                        </label>
                        <input
                          type="text"
                          value={memberInfo.member_id}
                          onChange={(e) => setMemberInfo({ ...memberInfo, member_id: e.target.value })}
                          className={inputCls}
                          placeholder="e.g. member UUID or reference"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-th-text-tertiary mb-1.5">
                          Member name
                        </label>
                        <input
                          type="text"
                          value={memberInfo.member_name}
                          onChange={(e) => setMemberInfo({ ...memberInfo, member_name: e.target.value })}
                          className={inputCls}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-th-text-tertiary mb-1.5">
                          Member email
                        </label>
                        <input
                          type="email"
                          value={memberInfo.member_email}
                          onChange={(e) => setMemberInfo({ ...memberInfo, member_email: e.target.value })}
                          className={inputCls}
                          placeholder="member@example.com"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="border-t border-th-border pt-10">
              <SectionTitle
                step="4"
                title="Attachments"
                description="Screenshots, logs, or exports (up to 10 files, 15 MB each)."
              />
              <TicketNewFileUpload
                key={fileUploadKey}
                files={files}
                onFilesChange={setFiles}
                maxFiles={MAX_ATTACHMENT_COUNT}
                maxSizeMB={MAX_ATTACHMENT_SIZE_MB}
              />
              {files.length > 0 ? (
                <p className="mt-3 text-xs text-th-text-tertiary">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected — uploads run after the ticket is
                  created.
                </p>
              ) : null}
            </section>

            <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 mt-2 px-6 sm:px-8 py-4 bg-surface-primary/90 backdrop-blur-md border-t border-th-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                className="sm:order-first px-5 py-3 rounded-xl border border-th-border text-th-text-secondary font-medium hover:bg-surface-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !advisorReady}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-th-accent-600 hover:bg-th-accent-700 disabled:opacity-55 disabled:cursor-not-allowed text-white font-semibold shadow-lg transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating ticket…
                  </>
                ) : (
                  <>
                    <Send size={18} aria-hidden />
                    Submit request
                  </>
                )}
              </button>
            </div>
            <p className="flex items-center justify-center sm:justify-end gap-2 text-[11px] text-th-text-tertiary sm:pr-1 pt-2">
              <Keyboard size={12} className="opacity-70" aria-hidden />
              <span>
                <kbd className="px-1.5 py-0.5 rounded border border-th-border bg-surface-secondary font-mono text-[10px]">
                  Ctrl / ⌘
                </kbd>{' '}
                +{' '}
                <kbd className="px-1.5 py-0.5 rounded border border-th-border bg-surface-secondary font-mono text-[10px]">
                  Enter
                </kbd>{' '}
                to submit from any field
              </span>
            </p>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className={`${panelCls} p-5`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-th-text-tertiary mb-3 flex items-center gap-2">
              <Shield size={14} aria-hidden />
              Submitted as
            </h3>
            <p className="font-semibold text-th-text-primary truncate">{displayName || 'Your account'}</p>
            {profile?.email ? (
              <p className="text-sm text-th-text-tertiary truncate mt-0.5">{profile.email}</p>
            ) : null}
            {profile?.agent_id ? (
              <p className="text-xs text-th-text-tertiary mt-2">
                Advisor ID: <span className="font-mono">{profile.agent_id}</span>
              </p>
            ) : null}
          </div>

          <div className={`${panelCls} p-5`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-th-text-tertiary mb-3 flex items-center gap-2">
              <Sparkles size={14} aria-hidden />
              Strong requests
            </h3>
            <ul className="space-y-3 text-sm text-th-text-secondary leading-snug">
              <li className="flex gap-2">
                <Clock className="shrink-0 text-th-accent-600 mt-0.5" size={16} />
                <span>When it started and whether it blocks your work.</span>
              </li>
              <li className="flex gap-2">
                <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={16} />
                <span>Exact error text or codes, if any.</span>
              </li>
              <li className="flex gap-2">
                <Paperclip className="shrink-0 text-sky-600 mt-0.5" size={16} />
                <span>Attach screenshots or logs instead of pasting secrets.</span>
              </li>
            </ul>
          </div>

          <Link
            to="/tickets"
            className="block text-center text-sm text-th-accent-600 hover:underline py-2"
          >
            View all your tickets →
          </Link>
        </aside>
      </div>
    </div>
  );
}
