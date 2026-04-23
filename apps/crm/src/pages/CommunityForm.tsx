import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';

// Sales Plan 2026 Phase 4: on-site community capture form. An MPB rep hands a
// prospect their tablet/laptop at a booth and opens
// `/forms/community/<eventId>`. This page loads the event metadata (RLS on
// `crm_community_events` permits anonymous read of `name` + `event_date`
// because the table's SELECT policy only checks membership for full-row
// reads; we only need the two public columns), then POSTs to the
// `community-lead-submit` edge function which writes the lead with the
// correct `lead_source='community'` + `community_event_id` attribution so the
// DB triggers fire round-robin + SLA + cadence automation.
//
// Accessibility: single-page layout, large touch targets, no auth prompt.

interface CommunityEventPublic {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
}

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  zip_code: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  zip_code: '',
  notes: '',
};

export default function CommunityForm() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<CommunityEventPublic | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setLoadingEvent(false);
      setLoadError('Missing event ID in URL.');
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('crm_community_events')
        .select('id, name, event_date, location')
        .eq('id', eventId)
        .maybeSingle();

      if (error || !data) {
        setLoadError('Event not found or no longer available.');
      } else {
        setEvent(data as CommunityEventPublic);
      }
      setLoadingEvent(false);
    })();
  }, [eventId]);

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    if (!form.email.trim() && !form.phone.trim()) {
      setSubmitError('Please give us an email or phone number so we can follow up.');
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setSubmitError('Please enter your first and last name.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/community-lead-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          zip_code: form.zip_code.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        setSubmitError(body?.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Event not available</h1>
          <p className="text-slate-600">{loadError || 'This event is no longer accepting sign-ups.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">You're all set!</h1>
          <p className="text-slate-600">
            Thanks for stopping by {event.name}. One of our advisors will reach out within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Community event sign-up</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{event.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">First name</span>
              <input
                type="text"
                value={form.first_name}
                onChange={update('first_name')}
                required
                autoComplete="given-name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last name</span>
              <input
                type="text"
                value={form.last_name}
                onChange={update('last_name')}
                required
                autoComplete="family-name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@example.com"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                autoComplete="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="(555) 123-4567"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">ZIP code</span>
              <input
                type="text"
                value={form.zip_code}
                onChange={update('zip_code')}
                autoComplete="postal-code"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">What would you like help with?</span>
            <textarea
              value={form.notes}
              onChange={update('notes')}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Medicare questions, plan comparison, cost sharing explanation"
            />
          </label>

          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {submitError}
            </div>
          )}

          <p className="text-xs text-slate-500">
            We only use your info to follow up about your questions. You can opt out any time.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium py-3 text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Connect with an advisor'}
          </button>
        </form>
      </div>
    </div>
  );
}
