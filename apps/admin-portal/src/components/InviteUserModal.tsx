import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Mail, Shield, Loader2, Send } from 'lucide-react';
import { invokeWithResolvedAuth } from '@mpbhealth/database';
import { handleAuthFailureMessage, isSessionExpiredMessage } from '../utils/authErrors';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId?: string;
  orgName?: string;
}

interface InviteUserResponse {
  success: boolean;
  error?: string;
}

interface FormData {
  email: string;
  role: 'admin' | 'manager' | 'advisor';
}

const DEFAULT_FORM: FormData = {
  email: '',
  role: 'advisor',
};

const ROLES = [
  { value: 'advisor', label: 'Advisor', description: 'Standard advisor access' },
  { value: 'manager', label: 'Manager', description: 'Can manage templates and view reports' },
  { value: 'admin', label: 'Admin', description: 'Full admin access' },
] as const;

export default function InviteUserModal({
  isOpen,
  onClose,
  onSuccess,
  orgId = 'a0000000-0000-0000-0000-000000000001', // Default MPB Health org
  orgName = 'MPB Health',
}: InviteUserModalProps) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);
    try {
      // Call edge function to send invitation
      const { data: result, error } = await invokeWithResolvedAuth<InviteUserResponse>('invite-user', {
        body: {
          org_id: orgId,
          org_name: orgName,
          email: form.email,
          role: form.role,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send invitation');
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${form.email}`);
      setForm(DEFAULT_FORM);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to send invitation:', err);
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(message);
      if (isSessionExpiredMessage(message)) {
        handleAuthFailureMessage(message);
      }
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="admin-modal-shell w-full max-w-md">
        <div className="border-b border-th-border/70 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-th-accent-50 dark:bg-th-accent-900/30 ring-1 ring-th-accent-200/60 dark:ring-th-accent-800/50">
              <Send className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-th-text-primary">Invite User</h2>
              <p className="text-sm text-th-text-tertiary">Send an invitation to join</p>
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
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Role
            </label>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.role === role.value
                      ? 'border-th-accent-500 bg-th-accent-50 dark:bg-th-accent-900/20'
                      : 'border-th-border hover:border-th-accent-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as FormData['role'] })
                    }
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-th-text-primary">{role.label}</p>
                    <p className="text-xs text-th-text-tertiary">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-th-accent-200/80 dark:border-th-accent-800/60 bg-th-accent-50/70 dark:bg-th-accent-900/20 p-4">
            <p className="text-sm text-th-accent-800 dark:text-th-accent-200 leading-relaxed">
              The user will receive an email with a link to accept the invitation and create their account. The invitation expires in 7 days.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-th-border rounded-full text-th-text-secondary hover:bg-surface-secondary active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-600 text-white rounded-full font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_8px_24px_rgb(12_113_195/0.25)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
