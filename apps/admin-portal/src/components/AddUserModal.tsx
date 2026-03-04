import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, User, Mail, Shield, Loader2, Building2, Phone, Briefcase, Hash } from 'lucide-react';
import { userService, type Permission } from '@mpbhealth/admin-core';
import { supabase } from '@mpbhealth/database';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Portal = 'admin' | 'advisor' | 'crm';
type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff';
type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'advisor' | 'crm_user';

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  portal: Portal;
  role: UserRole;
  permissions: string[];
  send_invite: boolean;
  // Advisor-specific fields
  phone: string;
  specialization: string;
  agent_id: string;
  company_name: string;
}

const DEFAULT_FORM: FormData = {
  email: '',
  first_name: '',
  last_name: '',
  portal: 'admin',
  role: 'staff',
  permissions: [],
  send_invite: true,
  phone: '',
  specialization: '',
  agent_id: '',
  company_name: '',
};

const PORTALS = [
  { value: 'admin' as Portal, label: 'Admin Portal', description: 'Internal admin users' },
  { value: 'advisor' as Portal, label: 'Advisor Portal', description: 'Health share advisors' },
  { value: 'crm' as Portal, label: 'CRM', description: 'CRM portal users' },
];

const ADMIN_ROLES = [
  { value: 'staff', label: 'Staff', description: 'Basic access to admin portal' },
  { value: 'manager', label: 'Manager', description: 'Can manage templates and view reports' },
  { value: 'admin', label: 'Admin', description: 'Full admin access except user management' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full access including user management' },
] as const;

function getDefaultRoleForPortal(portal: Portal): UserRole {
  switch (portal) {
    case 'admin': return 'staff';
    case 'advisor': return 'advisor';
    case 'crm': return 'crm_user';
  }
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      setForm(DEFAULT_FORM);
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    try {
      const perms = await userService.getPermissionsByCategory();
      setPermissions(perms);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePortalChange = (portal: Portal) => {
    setForm((prev) => ({
      ...prev,
      portal,
      role: getDefaultRoleForPortal(portal),
      permissions: [],
      phone: '',
      specialization: '',
      agent_id: '',
      company_name: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.first_name || !form.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Use the generic create-user edge function for all portals
      const body: Record<string, unknown> = {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        roles: [form.role],
        send_invite: form.send_invite,
      };

      // Include admin permissions for admin portal users
      if (form.portal === 'admin') {
        body.permissions = form.permissions;
      }

      // Include advisor-specific fields
      if (form.portal === 'advisor') {
        if (form.phone) body.phone = form.phone;
        if (form.specialization) body.specialization = form.specialization;
        if (form.agent_id) body.agent_id = form.agent_id;
        if (form.company_name) body.company_name = form.company_name;
      }

      const { data: createResult, error: createError } = await supabase.functions.invoke(
        'create-user',
        { body },
      );

      if (createError) {
        throw new Error(createError.message || 'Failed to create user');
      }

      if (!createResult?.success) {
        throw new Error(createResult?.error || 'Failed to create user');
      }

      if (form.send_invite && createResult?.email_sent === false) {
        toast.error(
          createResult?.email_error || 'User created but invitation email failed. Check Supabase logs and RESEND_API_KEY.'
        );
      } else {
        const portalLabel = PORTALS.find((p) => p.value === form.portal)?.label || 'portal';
        toast.success(
          form.send_invite
            ? `${portalLabel} user created and invitation sent!`
            : `${portalLabel} user created successfully!`
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

  const portalLabel = PORTALS.find((p) => p.value === form.portal)?.label || 'portal';

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
              <p className="text-sm text-th-text-tertiary">Create a user for {portalLabel}</p>
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
          {/* Portal Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Portal
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {PORTALS.map((portal) => (
                <button
                  key={portal.value}
                  type="button"
                  onClick={() => handlePortalChange(portal.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    form.portal === portal.value
                      ? 'border-th-accent-500 bg-th-accent-50 dark:bg-th-accent-900/20'
                      : 'border-th-border hover:border-th-accent-300'
                  }`}
                >
                  <p className="font-medium text-th-text-primary text-sm">{portal.label}</p>
                  <p className="text-xs text-th-text-tertiary">{portal.description}</p>
                </button>
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

          {/* Role Selection — only for admin portal (advisor/crm have fixed roles) */}
          {form.portal === 'admin' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {ADMIN_ROLES.map((role) => (
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
                        setForm({ ...form, role: e.target.value as AdminRole })
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

          {/* Advisor-specific fields */}
          {form.portal === 'advisor' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Advisor Profile
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    <Hash className="w-3.5 h-3.5 inline mr-1" />
                    Agent ID
                  </label>
                  <input
                    type="text"
                    value={form.agent_id}
                    onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                    placeholder="AG-12345"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Health Share"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    <Building2 className="w-3.5 h-3.5 inline mr-1" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Agency name"
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Permissions (only show for admin portal, not super_admin) */}
          {form.portal === 'admin' && form.role !== 'super_admin' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-th-text-secondary">
                Additional Permissions
              </h3>
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
                              checked={form.permissions.includes(perm.name)}
                              onChange={() => togglePermission(perm.name)}
                              className="mt-0.5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                            />
                            <div>
                              <p className="text-th-text-secondary">{perm.name}</p>
                              {perm.description && (
                                <p className="text-xs text-th-text-tertiary">
                                  {perm.description}
                                </p>
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
                User will receive an email with their login credentials
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
