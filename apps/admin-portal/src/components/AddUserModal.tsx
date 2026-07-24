import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, User, Mail, Shield, Loader2, Briefcase } from 'lucide-react';
import { userService, type Permission } from '@mpbhealth/admin-core';
import { invokeWithResolvedAuth } from '@mpbhealth/database';
import { handleAuthFailureMessage, isSessionExpiredMessage } from '../utils/authErrors';
import { STAFF_HUB_LOGIN_URL, STAFF_HUB_ORIGIN } from '../lib/portalUrls';

// ---------------------------------------------------------------------------
// User-type-driven creation modal.
// ---------------------------------------------------------------------------
// Two backends, picked by `user_type`:
//   - staff_hub    → create-admin-user  (admin_users role=staff; invite → staff.mpb.health)
//   - admin_staff  → create-admin-user  (admin_users table + admin_role)
//   - advisor      → create-user        (auth.users + user_roles['advisor'] + advisor_profiles)
//   - crm_user     → create-user        (auth.users + user_roles['crm_user'])
//   - member       → create-user        (auth.users + user_roles['member'])
//
// Both edge functions are super_admin-gated, so this modal is super_admin-only.
// ---------------------------------------------------------------------------

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-select the user_type when opening from a portal tab (e.g. Advisor) */
  suggestedUserType?: UserType;
  /** When user_type=admin_staff, pre-select this sub-role (e.g. 'concierge') */
  suggestedAdminRole?: AdminRole;
}

type UserType = 'staff_hub' | 'admin_staff' | 'advisor' | 'crm_user' | 'member';
type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'concierge';

interface CreateUserResponse {
  success: boolean;
  error?: string;
  email_sent?: boolean;
  email_error?: string;
}

interface FormData {
  user_type: UserType;
  email: string;
  first_name: string;
  last_name: string;
  // admin_staff path
  admin_role: AdminRole;
  permissions: string[];
  // advisor path (optional fields, all forwarded to create-user)
  phone: string;
  specialization: string;
  agent_id: string;
  company_name: string;
  send_invite: boolean;
  skip_training_requirement: boolean;
}

const DEFAULT_FORM: FormData = {
  user_type: 'staff_hub',
  email: '',
  first_name: '',
  last_name: '',
  admin_role: 'staff',
  permissions: [],
  phone: '',
  specialization: '',
  agent_id: '',
  company_name: '',
  send_invite: true,
  skip_training_requirement: false,
};

const USER_TYPES: { value: UserType; label: string; description: string }[] = [
  {
    value: 'staff_hub',
    label: 'Staff Hub',
    description: 'Internal staff — login at staff.mpb.health (notes, tasks, time off, tool links)',
  },
  {
    value: 'admin_staff',
    label: 'Admin Portal Staff',
    description: 'Admin or Concierge access; they can also use Staff Hub with the same login',
  },
  {
    value: 'advisor',
    label: 'Advisor',
    description: 'Advisor Portal access + auto-provisioned advisor profile',
  },
  {
    value: 'crm_user',
    label: 'CRM User',
    description: 'CRM Portal access (crm.mpb.health). User still needs to be added to an org.',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Member app access (app.mpb.health)',
  },
];

const ADMIN_ROLES: { value: AdminRole; label: string; description: string }[] = [
  {
    value: 'staff',
    label: 'Staff',
    description: 'Staff Hub + limited Admin Portal access (no elevated portal roles)',
  },
  { value: 'manager', label: 'Manager', description: 'Manage templates and view reports' },
  { value: 'admin', label: 'Admin', description: 'Full admin access except user management' },
  { value: 'concierge', label: 'Concierge', description: 'Concierge Portal only — member support dashboard' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full access including user management' },
];

export default function AddUserModal({ isOpen, onClose, onSuccess, suggestedUserType, suggestedAdminRole }: AddUserModalProps) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      ...DEFAULT_FORM,
      user_type: suggestedUserType ?? DEFAULT_FORM.user_type,
      admin_role: suggestedAdminRole ?? DEFAULT_FORM.admin_role,
    });
    setLoadingPermissions(true);

    let cancelled = false;
    userService.getPermissionsByCategory()
      .then((perms) => { if (!cancelled) setPermissions(perms); })
      .catch((err) => { if (!cancelled) console.error('Failed to load permissions:', err); })
      .finally(() => { if (!cancelled) setLoadingPermissions(false); });

    return () => { cancelled = true; };
  }, [isOpen, suggestedUserType, suggestedAdminRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.first_name || !form.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let result: CreateUserResponse | null = null;

      if (form.user_type === 'admin_staff' || form.user_type === 'staff_hub') {
        const { data, error } = await invokeWithResolvedAuth<CreateUserResponse>(
          'create-admin-user',
          {
            body: {
              email: form.email,
              first_name: form.first_name,
              last_name: form.last_name,
              role: form.user_type === 'staff_hub' ? 'staff' : form.admin_role,
              permissions: form.user_type === 'staff_hub' ? [] : form.permissions,
              send_invite: form.send_invite,
              ...(form.user_type === 'staff_hub' ? { invite_portal: 'staff_hub' as const } : {}),
            },
          },
        );
        if (error) throw new Error(error.message || 'Failed to create user');
        result = data;
      } else {
        // advisor / crm_user / member — all go through create-user with a single role
        const roles = [form.user_type] as const;
        const { data, error } = await invokeWithResolvedAuth<CreateUserResponse>(
          'create-user',
          {
            body: {
              email: form.email,
              first_name: form.first_name,
              last_name: form.last_name,
              roles,
              send_invite: form.send_invite,
              ...(form.user_type === 'advisor'
                ? {
                    phone: form.phone || undefined,
                    specialization: form.specialization || undefined,
                    agent_id: form.agent_id || undefined,
                    company_name: form.company_name || undefined,
                    skip_training_requirement: form.skip_training_requirement,
                  }
                : {}),
            },
          },
        );
        if (error) throw new Error(error.message || 'Failed to create user');
        result = data;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create user');
      }

      if (form.send_invite && result?.email_sent === false) {
        toast.error(
          result?.email_error ||
            'User created but invitation email failed. Check Supabase logs and RESEND_API_KEY.',
        );
      } else {
        toast.success(
          form.send_invite
            ? 'User created and invitation sent!'
            : 'User created successfully!',
        );
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create user:', err);
      const message = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(message);
      if (isSessionExpiredMessage(message)) {
        handleAuthFailureMessage(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  if (!isOpen) return null;

  const isStaffHub = form.user_type === 'staff_hub';
  const isAdminStaff = form.user_type === 'admin_staff';
  const isAdvisor = form.user_type === 'advisor';
  const showPermissionsSection =
    isAdminStaff && form.admin_role !== 'super_admin' && form.admin_role !== 'concierge';

  return (
    <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="admin-modal-shell w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-th-border/70 bg-surface-primary/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-th-accent-50 dark:bg-th-accent-900/30 ring-1 ring-th-accent-200/60 dark:ring-th-accent-800/50">
              <User className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-th-text-primary">Add New User</h2>
              <p className="text-sm text-th-text-tertiary">
                Super admins only. Staff Hub, Admin, CRM, Advisor, and Member.
              </p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              User Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {USER_TYPES.map((ut) => {
                const selected = form.user_type === ut.value;
                return (
                  <label
                    key={ut.value}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] ${
                      selected
                        ? 'border-th-accent-500 bg-th-accent-50/90 dark:bg-th-accent-900/25 shadow-[0_8px_24px_rgb(12_113_195/0.08)]'
                        : 'border-th-border/80 bg-surface-secondary/40 hover:border-th-accent-300 hover:bg-surface-secondary/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="user_type"
                      value={ut.value}
                      checked={selected}
                      onChange={(e) =>
                        setForm({ ...form, user_type: e.target.value as UserType })
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-th-text-primary">{ut.label}</p>
                      <p className="text-xs text-th-text-tertiary leading-relaxed mt-0.5">{ut.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <Mail className="w-4 h-4" />
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
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
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
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john.doe@mympb.com"
                className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                required
              />
            </div>
          </div>

          {isStaffHub && (
            <div className="rounded-2xl border border-th-accent-200/80 dark:border-th-accent-800/60 bg-th-accent-50/70 dark:bg-th-accent-900/20 p-4 space-y-1.5">
              <p className="text-sm font-medium text-th-text-primary">Staff Hub account</p>
              <p className="text-xs text-th-text-tertiary leading-relaxed">
                Creates a login for{' '}
                <a
                  href={STAFF_HUB_LOGIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-th-accent-600 underline underline-offset-2"
                >
                  {STAFF_HUB_ORIGIN.replace('https://', '')}
                </a>
                . They get Notes, Tasks, Time Off, Calendar, and partner links. Add Admin, CRM, or
                Advisor roles later if they need those portal tiles.
              </p>
            </div>
          )}

          {/* Admin Role (only when user_type = admin_staff) */}
          {isAdminStaff && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Role
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {ADMIN_ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.admin_role === role.value
                        ? 'border-th-accent-500 bg-th-accent-50 dark:bg-th-accent-900/20'
                        : 'border-th-border hover:border-th-accent-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="admin_role"
                      value={role.value}
                      checked={form.admin_role === role.value}
                      onChange={(e) =>
                        setForm({ ...form, admin_role: e.target.value as AdminRole })
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
          )}

          {/* Advisor profile fields */}
          {isAdvisor && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Advisor Profile <span className="text-th-text-tertiary text-xs font-normal">(optional — can be filled in later)</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Agent ID</label>
                  <input
                    type="text"
                    value={form.agent_id}
                    onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                    placeholder="A12345"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="555-555-5555"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Company</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="MPB Health"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Specialization</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Health Share"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {isAdvisor && (
            <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
              <input
                type="checkbox"
                id="user_skip_training"
                checked={form.skip_training_requirement}
                onChange={(e) => setForm({ ...form, skip_training_requirement: e.target.checked })}
                className="mt-0.5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
              <label htmlFor="user_skip_training" className="cursor-pointer">
                <p className="text-sm font-medium text-th-text-primary">
                  Existing advisor — skip training requirement
                </p>
                <p className="text-xs text-th-text-tertiary">
                  Grants full Advisor Portal access immediately. Training is only required for new advisors going through contracting.
                </p>
              </label>
            </div>
          )}

          {/* Permissions (admin staff with non-super, non-concierge role) */}
          {showPermissionsSection && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-th-text-secondary">Additional Permissions</h3>
              <p className="text-xs text-th-text-tertiary">
                Super admins have all permissions. For other roles, select additional permissions as needed.
              </p>

              {loadingPermissions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-th-accent-600" />
                </div>
              ) : (
                <div className="space-y-4 max-h-48 overflow-y-auto border border-th-border rounded-lg p-4">
                  {Object.entries(permissions).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="font-medium text-th-text-primary capitalize mb-2">
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start gap-2 text-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="mt-0.5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                            />
                            <div>
                              <p className="text-th-text-secondary">{perm.key}</p>
                              {perm.description && (
                                <p className="text-xs text-th-text-tertiary">{perm.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send Invite Option */}
          <div className="flex items-center gap-3 p-4 bg-surface-secondary rounded-lg">
            <input
              type="checkbox"
              id="send_invite"
              checked={form.send_invite}
              onChange={(e) => setForm({ ...form, send_invite: e.target.checked })}
              className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
            />
            <label htmlFor="send_invite" className="cursor-pointer">
              <p className="text-sm font-medium text-th-text-primary">
                Send invitation email
              </p>
              <p className="text-xs text-th-text-tertiary">
                {isStaffHub
                  ? `Email includes temporary password and a link to ${STAFF_HUB_ORIGIN.replace('https://', '')}`
                  : 'User will receive an email with a link to set their password'}
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
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
