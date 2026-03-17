import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, User, Mail, Shield, Loader2 } from 'lucide-react';
import { userService, type Permission } from '@mpbhealth/admin-core';
import { supabase } from '@mpbhealth/database';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  permissions: string[];
  send_invite: boolean;
}

const DEFAULT_FORM: FormData = {
  email: '',
  first_name: '',
  last_name: '',
  role: 'staff',
  permissions: [],
  send_invite: true,
};

const ROLES = [
  { value: 'staff', label: 'Staff', description: 'Basic access to admin portal' },
  { value: 'manager', label: 'Manager', description: 'Can manage templates and view reports' },
  { value: 'admin', label: 'Admin', description: 'Full admin access except user management' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full access including user management' },
] as const;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.first_name || !form.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Call edge function to create auth user
      const { data: createResult, error: createError } = await supabase.functions.invoke(
        'create-admin-user',
        {
          body: {
            email: form.email,
            first_name: form.first_name,
            last_name: form.last_name,
            role: form.role,
            permissions: form.permissions,
            send_invite: form.send_invite,
          },
        }
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
        toast.success(
          form.send_invite
            ? 'User created and invitation sent!'
            : 'User created successfully!'
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
              <p className="text-sm text-th-text-tertiary">Create an admin portal user</p>
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

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-th-text-secondary flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role
            </h3>

            <div className="grid grid-cols-2 gap-3">
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

          {/* Permissions (only show if not super_admin) */}
          {form.role !== 'super_admin' && (
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
                              checked={form.permissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="mt-0.5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                            />
                            <div>
                              <p className="text-th-text-secondary">{perm.key}</p>
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
