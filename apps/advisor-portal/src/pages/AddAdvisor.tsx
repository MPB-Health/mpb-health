import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Mail,
  Phone,
  Building2,
  Hash,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  User,
  MapPin,
  Send,
} from 'lucide-react';
import { supabaseUrl } from '@mpbhealth/database';
import { getResolvedAuthHeader } from '@mpbhealth/database';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';

interface CreateUserResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  email_sent?: boolean;
  email_error?: string;
}

interface IntakeForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agent_id: string;
  company_name: string;
  specialization: string;
  city: string;
  state: string;
  notes: string;
  send_invite: boolean;
}

const INITIAL_FORM: IntakeForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  agent_id: '',
  company_name: '',
  specialization: 'Health Share',
  city: '',
  state: '',
  notes: '',
  send_invite: true,
};

const SPECIALIZATIONS = [
  'Health Share',
  'General',
  'Benefits',
  'Enrollment',
  'Senior',
  'Individual',
  'Group',
] as const;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
] as const;

export default function AddAdvisor() {
  useAdvisorPageDebugLog('AddAdvisor');
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const [form, setForm] = useState<IntakeForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; email: string; inviteSent: boolean } | null>(null);
  const [formKey, setFormKey] = useState(0);

  const updateField = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.first_name || !form.last_name) {
      setError('First name, last name, and email are required.');
      return;
    }

    setSaving(true);
    try {
      const authHeaders = await getResolvedAuthHeader();
      if (!authHeaders) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);

      let res: Response;
      try {
        res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            roles: ['advisor'],
            send_invite: form.send_invite,
            phone: form.phone || undefined,
            specialization: form.specialization || undefined,
            agent_id: form.agent_id || undefined,
            company_name: form.company_name || undefined,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const data: CreateUserResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add advisor');
      }

      if (form.send_invite && data.email_sent === false) {
        setError(data.email_error || 'Advisor was created but the invitation email could not be sent.');
      }

      setSuccess({ name: `${form.first_name} ${form.last_name}`, email: form.email, inviteSent: form.send_invite });
      setForm(INITIAL_FORM);
    } catch (err) {
      console.error('Failed to add advisor:', err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. The advisor may have been created — please check the list before retrying.');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Advisor Added Successfully
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium text-gray-900 dark:text-white">{success.name}</span> has been added to the system.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {success.inviteSent
              ? `An invitation email was sent to ${success.email} with login credentials.`
              : `No invitation email was sent. You can send one later from the admin panel.`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setSuccess(null); setError(''); setFormKey(k => k + 1); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Another Advisor
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <UserPlus className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add New Advisor
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              Submit a new advisor to join the MPB Health network
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium">Unable to add advisor</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Personal Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-emerald-600" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                required
                value={form.first_name}
                onChange={e => updateField('first_name', e.target.value)}
                placeholder="John"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                required
                value={form.last_name}
                onChange={e => updateField('last_name', e.target.value)}
                placeholder="Doe"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="advisor@example.com"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Section: Advisor Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Advisor Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="agent_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Agent ID
                </span>
              </label>
              <input
                id="agent_id"
                type="text"
                value={form.agent_id}
                onChange={e => updateField('agent_id', e.target.value)}
                placeholder="e.g. 779564"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Specialization
              </label>
              <select
                id="specialization"
                value={form.specialization}
                onChange={e => updateField('specialization', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              >
                {SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Company / Agency
                </span>
              </label>
              <input
                id="company_name"
                type="text"
                value={form.company_name}
                onChange={e => updateField('company_name', e.target.value)}
                placeholder="Agency Name"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> State
                </span>
              </label>
              <select
                id="state"
                value={form.state}
                onChange={e => updateField('state', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              >
                <option value="">Select state...</option>
                {US_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section: Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Send className="w-4 h-4 text-emerald-600" />
            Invitation
          </h2>

          <label htmlFor="send_invite" className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <input
              id="send_invite"
              type="checkbox"
              checked={form.send_invite}
              onChange={e => updateField('send_invite', e.target.checked)}
              className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Send invitation email immediately
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                The new advisor will receive their login credentials and a link to the Advisor Portal
              </p>
            </div>
          </label>

          {/* What gets created summary */}
          <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-4">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              This will create:
            </p>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Auth account with temporary password
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Advisor Portal access (advisor role)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Advisor profile with details above
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Organization membership
              </li>
            </ul>
          </div>

          {profile && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Submitted by {profile.first_name} {profile.last_name} ({profile.email})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Advisor...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Add Advisor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
