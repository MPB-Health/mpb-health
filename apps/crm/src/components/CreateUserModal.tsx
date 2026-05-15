// ============================================================================
// CRM CreateUserModal
// ----------------------------------------------------------------------------
// "Create a new CRM user" — for when an org owner/admin wants to onboard a
// teammate directly (auth user is created server-side with a temporary
// password, given the global `crm_user` role, and added to the active org as
// a member). Contrast with InviteModal, which only sends an email link the
// recipient must accept.
//
// Backend: supabase/functions/crm-create-user. That function enforces the
// auth gate (caller must be owner/admin in the target org_id).
// ============================================================================

import { useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, X, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ORG_ROLE_LABELS, type OrgRole } from '@mpbhealth/auth';

interface CreateUserResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  email_sent?: boolean;
  email_error?: string;
}

// We deliberately exclude 'owner' — a CRM operator cannot create another
// owner from this UI. The edge function enforces this server-side too.
const CREATABLE_ROLES: OrgRole[] = ['admin', 'manager', 'advisor'];

export default function CreateUserModal({
  open,
  orgId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<OrgRole>('advisor');
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('advisor');
    setSendInvite(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke<CreateUserResponse>(
        'crm-create-user',
        {
          body: {
            org_id: orgId,
            email: email.trim().toLowerCase(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            org_role: role,
            send_invite: sendInvite,
          },
        },
      );

      if (error) {
        throw new Error(error.message || 'Failed to create user');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create user');
      }

      if (sendInvite && data?.email_sent === false) {
        toast.error(
          data?.email_error ??
            'User created, but invitation email failed to send. Check Supabase logs.',
        );
      } else {
        toast.success(
          sendInvite
            ? `Created ${email} and sent welcome email`
            : `Created ${email}`,
        );
      }

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface-primary rounded-xl border border-th-border shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-th-accent-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-th-text-primary">Create Team Member</h3>
              <p className="text-sm text-th-text-secondary">
                Create a new CRM user and add them to your organization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                First name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                Last name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-primary mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-primary mb-1.5">Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                aria-label="Role"
                className="w-full appearance-none px-3 py-2.5 rounded-lg border border-th-border bg-surface-secondary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent pr-10"
              >
                {CREATABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ORG_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
            />
            <div>
              <p className="text-sm font-medium text-th-text-primary">Send welcome email</p>
              <p className="text-xs text-th-text-tertiary">
                Emails the user their temporary password and a link to log in. When off, the
                temporary password is returned to you instead.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-secondary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !email.trim() || !firstName.trim() || !lastName.trim()}
              className="px-4 py-2.5 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
