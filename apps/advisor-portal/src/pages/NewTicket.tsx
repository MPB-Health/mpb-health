import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Headphones, ArrowLeft, Loader2, AlertCircle, PlusCircle, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { ticketService, type TicketPriority, type Ticket } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

const FALLBACK_CATEGORIES = [
  'Technical Issue',
  'Account Management',
  'Billing & Payments',
  'Portal Access',
  'General Inquiry',
  'Other',
];

const PRIORITIES: { value: TicketPriority; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Non-urgent, can wait' },
  { value: 'medium', label: 'Medium', desc: 'Normal priority' },
  { value: 'high', label: 'High', desc: 'Needs prompt attention' },
  { value: 'urgent', label: 'Urgent', desc: 'Critical issue' },
];

const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_ATTACHMENT_COUNT = 10;

const STATUS_DOT: Record<string, string> = {
  new: 'bg-blue-500',
  open: 'bg-yellow-500',
  pending: 'bg-orange-500',
  resolved: 'bg-green-500',
  closed: 'bg-neutral-400',
};

const STATUS_LABEL: Record<string, { text: string; chip: string }> = {
  new:      { text: 'New',      chip: 'bg-blue-100 text-blue-700' },
  open:     { text: 'Open',     chip: 'bg-yellow-100 text-yellow-700' },
  pending:  { text: 'Pending',  chip: 'bg-orange-100 text-orange-700' },
  resolved: { text: 'Resolved', chip: 'bg-green-100 text-green-700' },
  closed:   { text: 'Closed',   chip: 'bg-neutral-100 text-neutral-600' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function NewTicket() {
  const navigate = useNavigate();
  const { profile, loading: authCheckLoading, profileLoading } = useAdvisor();
  const authLoading = authCheckLoading || profileLoading;
  const [categories, setCategories] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<{ open: number; pending: number; resolved: number; total: number } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const handleFilesSelected = (list: FileList | null) => {
    if (!list || list.length === 0) return;

    const incoming = Array.from(list);
    const combined = [...attachments, ...incoming];

    if (combined.length > MAX_ATTACHMENT_COUNT) {
      setError(`You can upload up to ${MAX_ATTACHMENT_COUNT} files.`);
      return;
    }

    const tooLarge = incoming.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is too large. Maximum size is 15 MB.`);
      return;
    }

    const deduped = combined.filter(
      (file, idx, arr) => arr.findIndex((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified) === idx,
    );

    setAttachments(deduped);
    setError('');
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, profile, navigate]);

  useEffect(() => {
    if (authLoading || !profile) return;

    ticketService
      .getCategories()
      .then((cats) => setCategories(cats.length ? cats : FALLBACK_CATEGORIES))
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setCatLoading(false));

    Promise.all([
      ticketService.getMyTickets({ perPage: 20, page: 1 }),
      ticketService.getTicketStats(),
    ])
      .then(([list, s]) => {
        setTickets(list.tickets);
        setStats({ open: s.open, pending: s.pending, resolved: s.resolved, total: s.total });
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [authLoading, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your issue.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await ticketService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category: category || undefined,
        priority,
        attachments,
      });
      toast.success(`Ticket #${result.ticket_number} submitted! Our team will be in touch shortly.`);
      navigate('/tickets', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Submit a Support Ticket"
        subtitle="Describe your issue and our IT team will get back to you"
        icon={<PlusCircle className="w-6 h-6" />}
        actions={
          <Link
            to="/tickets"
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-50 dark:bg-th-accent-900/20 hover:bg-th-accent-100 dark:hover:bg-th-accent-900/30 text-th-text-primary rounded-lg text-sm font-medium transition-colors border border-th-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
        }
      />

      <div className="flex gap-6 items-start">
        {/* Left: form */}
        <div className="flex-1 min-w-0">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100"
          >
            {/* Subject */}
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
                maxLength={255}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <p className="text-xs text-neutral-400 mt-1">{subject.length}/255</p>
            </div>

            {/* Advisor ID */}
            {profile?.agent_id && (
              <div className="p-6">
                <label className="block text-sm font-medium text-neutral-900 mb-1.5">Advisor ID</label>
                <input
                  type="text"
                  value={profile.agent_id}
                  readOnly
                  title="Advisor ID"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm text-neutral-500 bg-neutral-50 cursor-default"
                />
              </div>
            )}

            {/* Category & Priority */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={catLoading}
                  title="Category"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-60"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  title="Priority"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} — {p.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's happening, steps to reproduce, any error messages, and the impact on your work..."
                rows={7}
                maxLength={10000}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y"
              />
              <p className="text-xs text-neutral-400 mt-1">{description.length.toLocaleString()}/10,000</p>
            </div>

            {/* Attachments */}
            <div className="p-6 space-y-3">
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">Attachments</label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4" />
                <span>Upload images or files</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    e.currentTarget.value = '';
                  }}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-neutral-400">
                Up to {MAX_ATTACHMENT_COUNT} files, {formatBytes(MAX_ATTACHMENT_SIZE)} max each.
              </p>

              {attachments.length > 0 && (
                <ul className="space-y-2">
                  {attachments.map((file, idx) => (
                    <li
                      key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-neutral-200"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-800 truncate">{file.name}</p>
                        <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1 text-neutral-500 hover:text-neutral-800 rounded transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 flex items-center justify-between gap-3">
              <Link
                to="/tickets"
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !description.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: ticket history panel */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 gap-4 sticky top-6">
          {/* Stats chips */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Your Tickets</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Open', value: (stats?.open ?? 0) + (stats?.pending ?? 0), chip: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { label: 'Resolved', value: stats?.resolved ?? 0, chip: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Total', value: stats?.total ?? 0, chip: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
              ].map(({ label, value, chip }) => (
                <div key={label} className={`rounded-lg border px-2 py-2 ${chip}`}>
                  <p className="text-lg font-bold leading-none">{historyLoading ? '—' : value}</p>
                  <p className="text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">Recent History</p>

            {historyLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">No tickets yet</p>
            ) : (
              <ol className="relative border-l-2 border-neutral-100 ml-2 space-y-0">
                {tickets.map((t, idx) => (
                  <li key={t.id} className={`pl-5 relative${idx < tickets.length - 1 ? ' pb-5' : ''}`}>
                    <span
                      className={`absolute -left-[9px] top-1.5 w-[18px] h-[18px] rounded-full border-2 border-white flex-shrink-0 ${STATUS_DOT[t.status] ?? 'bg-neutral-300'}`}
                    />
                    <Link
                      to="/tickets"
                      className="group block hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-neutral-700">#{t.ticket_number}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_LABEL[t.status]?.chip ?? 'bg-neutral-100 text-neutral-600'}`}>
                          {STATUS_LABEL[t.status]?.text ?? t.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2 group-hover:text-neutral-900 leading-snug">{t.subject}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(t.created_at).toLocaleDateString()}</p>
                    </Link>
                  </li>
                ))}
              </ol>
            )}

            {tickets.length > 0 && (
              <Link to="/tickets" className="mt-4 block text-center text-xs text-blue-600 hover:underline">
                View all tickets →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
