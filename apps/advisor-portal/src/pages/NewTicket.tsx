import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Headphones, ArrowLeft, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { ticketService, type TicketPriority } from '@mpbhealth/advisor-core';
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

export default function NewTicket() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAdvisor();
  const [categories, setCategories] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
        }
      />

      <div className="max-w-2xl">
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

          {/* Category & Priority */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={catLoading}
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
    </div>
  );
}
