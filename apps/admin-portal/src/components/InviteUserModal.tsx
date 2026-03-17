import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Mail, Shield, Loader2, Send } from 'lucide-react';
import { invokeWithResolvedAuth } from '@mpbhealth/database';

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
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-md">
        {/* Header */}
        <div className="border-b border-th-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Invite User</h2>
              <p className="text-sm text-th-text-tertiary">Send an invitation to join</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary"
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

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The user will receive an email with a link to accept the invitation and create their account. The invitation expires in 7 days.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
