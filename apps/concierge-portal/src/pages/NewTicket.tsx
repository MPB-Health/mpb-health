import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Headphones, ArrowLeft, Loader2, AlertCircle, PlusCircle, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService, type TicketPriority } from '@mpbhealth/advisor-core';

const FALLBACK_CATEGORIES = [
  'Member Inquiry',
  'Claims Assistance',
  'Billing & Payments',
  'Plan Information',
  'Provider Search',
  'Prescription / Labs',
  'Appointment Setting',
  'Technical Issue',
  'General Inquiry',
  'Other',
];

const PRIORITIES: { value: TicketPriority; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Non-urgent, can wait' },
  { value: 'medium', label: 'Medium', desc: 'Normal priority' },
  { value: 'high', label: 'High', desc: 'Needs prompt attention' },
  { value: 'urgent', label: 'Urgent', desc: 'Critical issue' },
];

const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function NewTicket() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketService.getCategories()
      .then((cats) => setCategories(cats.length ? cats : FALLBACK_CATEGORIES))
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setCatLoading(false));
  }, []);

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

    setError('');
    setAttachments(combined);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    setSubmitting(true);
    try {
      const result = await ticketService.createTicket({
        subject: subject.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        priority,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      toast.success(`Ticket #${result.ticket_number} created successfully`);
      navigate('/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/tickets"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">New Support Ticket</h1>
            <p className="text-sm text-slate-500">Submit a ticket on behalf of a member</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Brief summary of the issue..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-colors"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            {catLoading ? (
              <div className="flex items-center gap-2 h-10 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    priority === p.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Detailed description of the issue, member information, steps taken..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm resize-y min-h-[120px] transition-colors"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Attachments
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:text-slate-700 hover:border-slate-400 cursor-pointer transition-colors">
            <Paperclip className="w-4 h-4" />
            Attach files (max {MAX_ATTACHMENT_COUNT} files, 15 MB each)
            <input
              type="file"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
          </label>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 text-sm">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate flex-1 text-slate-700">{file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatBytes(file.size)}</span>
                  <button type="button" aria-label="Remove attachment" onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/tickets"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !subject.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Create Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
