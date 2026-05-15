import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, User, Mail, Shield, Loader2, Briefcase } from 'lucide-react';
import { userService, type Permission } from '@mpbhealth/admin-core';
import { invokeWithResolvedAuth } from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// User-type-driven creation modal.
// ---------------------------------------------------------------------------
// Two backends, picked by `user_type`:
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

type UserType = 'admin_staff' | 'advisor' | 'crm_user' | 'member';
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
}

const DEFAULT_FORM: FormData = {
  user_type: 'admin_staff',
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
};

const USER_TYPES: { value: UserType; label: string; description: string }[] = [
  {
    value: 'admin_staff',
    label: 'Admin Portal Staff',
    description: 'Internal MPB staff — Admin Portal or Concierge Portal access',
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
  { value: 'staff', label: 'Staff', description: 'Basic access to admin portal' },
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

      if (form.user_type === 'admin_staff') {
        const { data, error } = await invokeWithResolvedAuth<CreateUserResponse>(
          'create-admin-user',
          {
            body: {
              email: form.email,
              first_name: form.first_name,
              last_name: form.last_name,
              role: form.admin_role,
              permissions: form.permissions,
              send_invite: form.send_invite,
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
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
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

  const isAdminStaff = form.user_type === 'admin_staff';
  const isAdvisor = form.user_type === 'advisor';
  const showPermissionsSection =
    isAdminStaff && form.admin_role !== 'super_admin' && form.admin_role !== 'concierge';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg">
              <User className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Add New User</h2>
              <p className="text-sm text-th-text-tertiary">
                Super admins only — create users for any portal in the ecosystem
              </p>
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
          {/* User Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              User Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {USER_TYPES.map((ut) => (
                <label
                  key={ut.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.user_type === ut.value
                      ? 'border-th-accent-500 bg-th-accent-50 dark:bg-th-accent-900/20'
                      : 'border-th-border hover:border-th-accent-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="user_type"
                    value={ut.value}
                    checked={form.user_type === ut.value}
                    onChange={(e) =>
                      setForm({ ...form, user_type: e.target.value as UserType })
                    }
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-th-text-primary">{ut.label}</p>
                    <p className="text-xs text-th-text-tertiary">{ut.description}</p>
                  </div>
                </label>
              ))}
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
                User will receive an email with a link to set their password
              </p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-th-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
