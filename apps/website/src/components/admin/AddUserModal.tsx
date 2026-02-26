import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Crown,
  ShieldCheck,
  Briefcase,
  Building2,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { type UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS, ALL_ROLES } from '../../lib/userRolesService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  password: string;
  use_custom_password: boolean;
  send_invite: boolean;
}

const DEFAULT_FORM: FormData = {
  email: '',
  first_name: '',
  last_name: '',
  roles: [],
  password: '',
  use_custom_password: false,
  send_invite: true,
};

const ROLE_ICONS: Record<UserRole, React.FC<{ className?: string }>> = {
  super_admin: Crown,
  admin: ShieldCheck,
  advisor: Briefcase,
  crm_user: Building2,
  member: User,
};

async function invokeCreateUser(body: unknown): Promise<{ data: any; error: Error | null }> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return { data: null, error: new Error('You must be logged in.') };
    }

    const supabaseUrl = (import.meta as ImportMeta & { env: { VITE_SUPABASE_URL?: string } }).env
      .VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return { data: null, error: new Error('Supabase URL not configured.') };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error || payload?.message || `Request failed (${response.status})`;
      return { data: null, error: new Error(message) };
    }

    return { data: payload, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unexpected error') };
  }
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{ userId: string; tempPassword?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetAndClose = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setCopied(false);
    onClose();
  };

  const toggleRole = (role: UserRole) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.first_name || !form.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.roles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    if (form.use_custom_password && form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        roles: form.roles,
        send_invite: form.send_invite,
      };

      if (form.use_custom_password && form.password) {
        payload.password = form.password;
      }

      const { data, error } = await invokeCreateUser(payload);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create user');

      if (data.temp_password) {
        setResult({ userId: data.user_id, tempPassword: data.temp_password });
      } else if (form.send_invite && data.email_sent === false) {
        toast.error(
          data.email_error || 'User created but invitation email failed. Check RESEND_API_KEY in Supabase.'
        );
        onSuccess();
        resetAndClose();
      } else {
        toast.success(
          form.send_invite
            ? `User created and invitation sent to ${form.email}`
            : 'User created successfully',
        );
        onSuccess();
        resetAndClose();
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!result?.tempPassword) return;
    await navigator.clipboard.writeText(result.tempPassword);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    onSuccess();
    resetAndClose();
  };

  if (!isOpen) return null;

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">User Created</h2>
                <p className="text-sm text-neutral-500">Save the temporary password below</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 mb-3">
                Account created for <strong>{form.email}</strong>
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white rounded border border-green-300 text-sm font-mono">
                  {result.tempPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> This password will not be shown again.
                Make sure to save it or share it with the user securely.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-neutral-200 flex justify-end">
            <Button onClick={handleDone}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Add New User</h2>
                <p className="text-sm text-neutral-500">Create a user account and assign roles</p>
              </div>
            </div>
            <button
              onClick={resetAndClose}
              aria-label="Close add user modal"
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john.doe@example.com"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Roles <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Select one or more roles. Each role grants access to a specific portal.
            </p>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => {
                const Icon = ROLE_ICONS[role];
                const selected = form.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                      selected
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        selected ? 'bg-blue-600 border-blue-600' : 'border-neutral-300',
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Icon className={cn('h-5 w-5 shrink-0', selected ? 'text-blue-600' : 'text-neutral-400')} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 text-sm">{ROLE_LABELS[role]}</div>
                      <div className="text-xs text-neutral-500">{ROLE_DESCRIPTIONS[role]}</div>
                    </div>
                    {selected && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs shrink-0">Selected</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="custom_password"
                checked={form.use_custom_password}
                onChange={(e) =>
                  setForm({ ...form, use_custom_password: e.target.checked, password: '' })
                }
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="custom_password" className="cursor-pointer">
                <span className="text-sm font-medium text-neutral-700">Set a custom password</span>
                <p className="text-xs text-neutral-500">
                  Otherwise a strong random password is generated automatically
                </p>
              </label>
            </div>

            {form.use_custom_password && (
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {form.password && form.password.length < 8 && (
                  <p className="mt-1 text-xs text-amber-600">Password must be at least 8 characters</p>
                )}
              </div>
            )}
          </div>

          {/* Send Invite */}
          <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <input
              type="checkbox"
              id="send_invite"
              checked={form.send_invite}
              onChange={(e) => setForm({ ...form, send_invite: e.target.checked })}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="send_invite" className="cursor-pointer">
              <span className="text-sm font-medium text-neutral-700">Send invitation email</span>
              <p className="text-xs text-neutral-500">
                The user will receive an email with their login credentials
              </p>
            </label>
          </div>

          {!form.send_invite && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Without an invite email, you will need to share the
                temporary password manually after creating the user.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                !form.email ||
                !form.first_name ||
                !form.last_name ||
                form.roles.length === 0 ||
                (form.use_custom_password && form.password.length < 8)
              }
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
