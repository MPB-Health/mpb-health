import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, User, Mail, Phone, Building2, Hash, Loader2, GraduationCap } from 'lucide-react';
import { invokeWithResolvedAuth } from '@mpbhealth/database';
import { handleAuthFailureMessage, isSessionExpiredMessage } from '../utils/authErrors';

interface AddAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateUserResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  email_sent?: boolean;
  email_error?: string;
}

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  specialization: string;
  agent_id: string;
  company_name: string;
  send_invite: boolean;
  skip_training_requirement: boolean;
}

const DEFAULT_FORM: FormData = {
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  specialization: 'Health Share',
  agent_id: '',
  company_name: '',
  send_invite: true,
  skip_training_requirement: false,
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

export default function AddAdvisorModal({ isOpen, onClose, onSuccess }: AddAdvisorModalProps) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.first_name || !form.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let timer: ReturnType<typeof setTimeout>;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(
          'Request timed out. The advisor may have been created — please check the list before retrying.'
        )), 45_000);
      });

      const invoke = invokeWithResolvedAuth<CreateUserResponse>('create-user', {
        body: {
          email: form.email.trim().toLowerCase(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          roles: ['advisor'],
          send_invite: form.send_invite,
          phone: form.phone || undefined,
          specialization: form.specialization || undefined,
          agent_id: form.agent_id || undefined,
          company_name: form.company_name || undefined,
          skip_training_requirement: form.skip_training_requirement,
        },
      });

      let data: CreateUserResponse | null;
      let error: { message: string } | null;
      try {
        ({ data, error } = await Promise.race([invoke, timeout]));
      } finally {
        clearTimeout(timer!);
      }

      if (error) {
        throw new Error(error.message || 'Failed to create advisor');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create advisor');
      }

      if (form.send_invite && data?.email_sent === false) {
        toast.error(
          data?.email_error || 'Advisor created but invitation email failed. Check RESEND_API_KEY.'
        );
      } else {
        toast.success(
          form.send_invite
            ? 'Advisor created and invitation sent!'
            : 'Advisor created successfully!'
        );
      }

      setForm(DEFAULT_FORM);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create advisor:', err);
      const message = err instanceof Error ? err.message : 'Failed to create advisor';
      toast.error(message);
      if (isSessionExpiredMessage(message)) {
        handleAuthFailureMessage(message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="admin-modal-shell w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-th-border/70 bg-surface-primary/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-th-accent-50 dark:bg-th-accent-900/30 ring-1 ring-th-accent-200/60 dark:ring-th-accent-800/50">
              <GraduationCap className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-th-text-primary">Create New Advisor</h2>
              <p className="text-sm text-th-text-tertiary">Create an advisor account with portal access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-xl hover:bg-surface-secondary active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="John"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address *</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="advisor@example.com"
                className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                required
              />
            </div>
          </div>

          {/* Advisor Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Advisor Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Agent ID</span>
                </label>
                <input
                  type="text"
                  value={form.agent_id}
                  onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                  placeholder="e.g. 779564"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Specialization
                </label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Company</span>
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="MPB Health"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-th-text-primary"
                />
              </div>
            </div>
          </div>

          {/* What gets created */}
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-4">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">This will create:</p>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
              <li>&#x2022; Auth account with temporary password</li>
              <li>&#x2022; Advisor portal access (advisor role)</li>
              <li>&#x2022; Advisor profile with details above</li>
              <li>&#x2022; Organization membership</li>
              <li>&#x2022; ITSTS support system sync</li>
            </ul>
          </div>

          {/* Send Invite Option */}
          <div className="flex items-center gap-3 p-4 bg-surface-secondary rounded-lg">
            <input
              type="checkbox"
              id="advisor_skip_training"
              checked={form.skip_training_requirement}
              onChange={(e) => setForm({ ...form, skip_training_requirement: e.target.checked })}
              className="rounded border-th-border text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="advisor_skip_training" className="cursor-pointer">
              <p className="text-sm font-medium text-th-text-primary">
                Existing advisor — skip training requirement
              </p>
              <p className="text-xs text-th-text-tertiary">
                Grants full Advisor Portal access immediately. Use for contracted advisors who already completed training elsewhere. New recruits should leave this unchecked.
              </p>
            </label>
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface-secondary rounded-lg">
            <input
              type="checkbox"
              id="advisor_send_invite"
              checked={form.send_invite}
              onChange={(e) => setForm({ ...form, send_invite: e.target.checked })}
              className="rounded border-th-border text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="advisor_send_invite" className="cursor-pointer">
              <p className="text-sm font-medium text-th-text-primary">
                Send invitation email
              </p>
              <p className="text-xs text-th-text-tertiary">
                Advisor will receive credentials and a link to the Advisor Portal
              </p>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-th-border/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-th-border rounded-full text-th-text-secondary hover:bg-surface-secondary active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-600 text-white rounded-full font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_8px_24px_rgb(12_113_195/0.25)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Creating...' : 'Create Advisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
