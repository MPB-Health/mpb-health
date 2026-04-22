import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Save,
  UserX,
  UserCheck,
  Globe,
  Plus,
  Trash2,
  Briefcase,
  Key,
  RefreshCw,
  HeadsetIcon,
  LogIn,
  ExternalLink,
  KeyRound,
  AlertTriangle,
  X,
  Copy,
  Loader2,
} from 'lucide-react';
import {
  userService,
  type AdminUser,
  type Permission,
  type PortalRole,
  type AdvisorProfileSummary,
  type CrossPortalUser,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const ALL_PORTAL_ROLES: PortalRole[] = ['super_admin', 'admin', 'advisor', 'member', 'crm_user', 'concierge'];

const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  advisor: 'Advisor',
  member: 'Member',
  crm_user: 'CRM User',
  concierge: 'Concierge',
};

const PORTAL_ROLE_COLORS: Record<PortalRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advisor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  member: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  crm_user: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  concierge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

const ADVISOR_STATUS_OPTIONS: AdvisorProfileSummary['status'][] = [
  'pending',
  'active',
  'suspended',
  'inactive',
];

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();

  // Admin user (from admin_users table — may be null for portal-only users)
  const [user, setUser] = useState<AdminUser | null>(null);
  // Cross-portal user (from users_with_roles — present for any auth user)
  const [crossUser, setCrossUser] = useState<CrossPortalUser | null>(null);

  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '' as AdminUser['role'],
    permissions: [] as string[],
  });

  // Portal access
  const [portalRoles, setPortalRoles] = useState<{ id: string; role: PortalRole; created_at: string }[]>([]);
  const [advisorProfile, setAdvisorProfile] = useState<AdvisorProfileSummary | null>(null);
  const [addingRole, setAddingRole] = useState(false);
  const [roleToAdd, setRoleToAdd] = useState<PortalRole>('advisor');

  // Advisor status editing
  const [editAdvisorStatus, setEditAdvisorStatus] = useState<AdvisorProfileSummary['status'] | ''>('');
  const [savingAdvisorStatus, setSavingAdvisorStatus] = useState(false);

  // Email management
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password management
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // ITSTS sync
  const [syncingToItsts, setSyncingToItsts] = useState(false);

  // Impersonation
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);
  const [impersonateMode, setImpersonateMode] = useState<'magiclink' | 'temp_password'>('magiclink');
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateTempPw, setImpersonateTempPw] = useState('');

  // Profile name editing (for cross-portal users without an admin_users row)
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete user
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      try {
        const [adminData, crossData, permsData, rolesData, advisorData] = await Promise.all([
          userService.getUser(userId),
          userService.getCrossPortalUser(userId),
          userService.getPermissionsByCategory(),
          userService.getUserRoles(userId),
          userService.getAdvisorProfile(userId),
        ]);

        setUser(adminData);
        setCrossUser(crossData);
        setPermissions(permsData);
        setPortalRoles(rolesData);
        setAdvisorProfile(advisorData);
        if (advisorData) {
          setEditAdvisorStatus(advisorData.status);
        }
        if (adminData) {
          setFormData({
            first_name: adminData.first_name,
            last_name: adminData.last_name,
            role: adminData.role,
            permissions: adminData.permissions,
          });
        }
        if (!adminData && !crossData) {
          toast.error('User not found');
          navigate('/users');
        }
      } catch {
        toast.error('Failed to load user');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, navigate]);

  // ── Admin user handlers ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const updated = await userService.updateUser(userId, formData);
      // Also propagate the new name to auth.users metadata and advisor_profiles
      // so every portal sees a consistent name (fire-and-forget; a failure here
      // shouldn't discard the admin_users save).
      userService
        .updateUserProfile(userId, {
          first_name: formData.first_name,
          last_name: formData.last_name,
        })
        .catch(() => {
          // Don't surface a second error — admin_users was saved successfully.
        });
      setUser(updated);
      setEditMode(false);
      toast.success('User updated!');
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const startEditingProfile = () => {
    const firstName = user?.first_name
      ?? advisorProfile?.first_name
      ?? crossUser?.full_name?.split(' ')[0]
      ?? '';
    const lastName = user?.last_name
      ?? advisorProfile?.last_name
      ?? crossUser?.full_name?.split(' ').slice(1).join(' ')
      ?? '';
    setProfileFirstName(firstName);
    setProfileLastName(lastName);
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    const firstName = profileFirstName.trim();
    const lastName = profileLastName.trim();
    if (!firstName && !lastName) {
      toast.error('Please enter at least a first or last name');
      return;
    }
    setSavingProfile(true);
    try {
      await userService.updateUserProfile(userId, {
        first_name: firstName,
        last_name: lastName,
      });

      const combined = [firstName, lastName].filter(Boolean).join(' ');
      if (crossUser) {
        setCrossUser({ ...crossUser, full_name: combined || null });
      }
      if (user) {
        setUser({ ...user, first_name: firstName, last_name: lastName });
      }
      if (advisorProfile) {
        setAdvisorProfile({
          ...advisorProfile,
          first_name: firstName,
          last_name: lastName,
        });
      }
      setEditingProfile(false);
      toast.success('Name updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    const targetEmail = user?.email ?? crossUser?.email ?? '';
    if (!targetEmail) {
      toast.error('Missing user email — cannot confirm deletion');
      return;
    }
    if (deleteConfirmEmail.trim().toLowerCase() !== targetEmail.toLowerCase()) {
      toast.error('Confirmation email does not match');
      return;
    }
    setDeleting(true);
    try {
      await userService.permanentlyDeleteUser(userId, {
        confirmEmail: deleteConfirmEmail.trim(),
      });
      toast.success(`Deleted ${targetEmail}`);
      setShowDeleteDialog(false);
      navigate('/users');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleSuspend = async () => {
    if (!userId || !user) return;
    try {
      const updated = await userService.suspendUser(userId);
      setUser(updated);
      toast.success('User suspended');
    } catch {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivate = async () => {
    if (!userId || !user) return;
    try {
      const updated = await userService.activateUser(userId);
      setUser(updated);
      toast.success('User activated');
    } catch {
      toast.error('Failed to activate user');
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  // ── Portal role handlers ─────────────────────────────────────────────────────

  const SUPPORT_GRANTING_ROLES: PortalRole[] = ['super_admin', 'admin', 'advisor'];

  const handleAssignRole = async () => {
    if (!userId) return;
    if (portalRoles.some((r) => r.role === roleToAdd)) {
      toast.error(`User already has the ${roleToAdd} role`);
      return;
    }
    try {
      await userService.assignRole(userId, roleToAdd);
      const updated = await userService.getUserRoles(userId);
      setPortalRoles(updated);
      setAddingRole(false);
      toast.success(`Role "${roleToAdd}" assigned`);

      // Auto-provision in ITSTS when granting a support-eligible role
      if (SUPPORT_GRANTING_ROLES.includes(roleToAdd)) {
        const email = user?.email ?? crossUser?.email;
        const firstName = user?.first_name ?? crossUser?.full_name?.split(' ')[0] ?? '';
        const lastName = user?.last_name ?? crossUser?.full_name?.split(' ').slice(1).join(' ') ?? '';
        const allRoles = updated.map((r) => r.role);
        if (email) {
          userService.syncUserToItsts(userId, email, firstName, lastName, allRoles).then((result) => {
            if (result.success) {
              toast.success('User auto-provisioned in Support Portal');
            }
          }).catch(() => {
            // Fire-and-forget; don't block the role assignment
          });
        }
      }
    } catch {
      toast.error('Failed to assign role');
    }
  };

  const handleRemoveRole = async (role: PortalRole) => {
    if (!userId) return;
    if (!confirm(`Remove the "${role}" role from this user?`)) return;
    try {
      await userService.removeRole(userId, role);
      setPortalRoles((prev) => prev.filter((r) => r.role !== role));
      toast.success(`Role "${role}" removed`);
    } catch {
      toast.error('Failed to remove role');
    }
  };

  // ── ITSTS sync handler ───────────────────────────────────────────────────────

  const hasSupportAccess = portalRoles.some(
    (r) => r.role === 'super_admin' || r.role === 'admin' || r.role === 'advisor'
  );

  const handleSyncToItsts = async () => {
    if (!userId) return;
    const email = user?.email ?? crossUser?.email;
    const firstName = user?.first_name ?? crossUser?.full_name?.split(' ')[0] ?? '';
    const lastName = user?.last_name ?? crossUser?.full_name?.split(' ').slice(1).join(' ') ?? '';
    const roles = portalRoles.map((r) => r.role);

    if (!email) {
      toast.error('User email is required for ITSTS sync');
      return;
    }

    setSyncingToItsts(true);
    try {
      const result = await userService.syncUserToItsts(userId, email, firstName, lastName, roles);
      if (result.success) {
        toast.success('User synced to Support Portal');
      } else {
        toast.error(result.error || 'Failed to sync to Support Portal');
      }
    } catch {
      toast.error('Failed to sync to Support Portal');
    } finally {
      setSyncingToItsts(false);
    }
  };

  // ── Advisor status handler ───────────────────────────────────────────────────

  const handleAdvisorStatusSave = async () => {
    if (!userId || !editAdvisorStatus) return;
    setSavingAdvisorStatus(true);
    try {
      await userService.updateAdvisorProfileStatus(userId, editAdvisorStatus as AdvisorProfileSummary['status']);
      setAdvisorProfile((prev) =>
        prev ? { ...prev, status: editAdvisorStatus as AdvisorProfileSummary['status'] } : prev
      );
      toast.success('Advisor status updated');
    } catch {
      toast.error('Failed to update advisor status');
    } finally {
      setSavingAdvisorStatus(false);
    }
  };

  // ── Password handlers ────────────────────────────────────────────────────────

  const handlePasswordReset = async () => {
    const email = user?.email ?? crossUser?.email;
    if (!email) return;
    setSendingReset(true);
    try {
      await userService.sendPasswordReset(email);
      toast.success('Password reset email sent');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSetPassword = async () => {
    if (!userId) return;
    if (passwordNew.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (passwordNew !== passwordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSettingPassword(true);
    try {
      await userService.setUserPassword(userId, passwordNew);
      setPasswordNew('');
      setPasswordConfirm('');
      toast.success('Password updated successfully');
    } catch {
      toast.error('Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  // ── Email handler ────────────────────────────────────────────────────────────

  const handleUpdateEmail = async () => {
    if (!userId || !newEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    const currentEmail = user?.email ?? crossUser?.email;
    if (newEmail.trim().toLowerCase() === currentEmail?.toLowerCase()) {
      toast.error('New email is the same as the current email');
      return;
    }
    if (!confirm(`Change this user's email from ${currentEmail} to ${newEmail.trim()}? They will need to use the new email to sign in.`)) {
      return;
    }
    setSavingEmail(true);
    try {
      await userService.updateUserEmail(userId, newEmail.trim());
      // Update local state
      if (user) setUser({ ...user, email: newEmail.trim() });
      if (crossUser) setCrossUser({ ...crossUser, email: newEmail.trim() });
      if (advisorProfile) setAdvisorProfile({ ...advisorProfile, email: newEmail.trim() });
      setEditingEmail(false);
      setNewEmail('');
      toast.success('Email updated successfully');
    } catch {
      toast.error('Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  // ── Impersonation handler ────────────────────────────────────────────────────

  const isAdvisor = portalRoles.some((r) => r.role === 'advisor') || !!advisorProfile;

  const handleImpersonate = async () => {
    if (!userId) return;
    setImpersonating(true);
    setImpersonateTempPw('');
    try {
      const result = await userService.impersonateAdvisor(userId, impersonateMode);
      if (impersonateMode === 'magiclink' && result.url) {
        window.open(result.url, '_blank');
        toast.success(`Opening advisor portal as ${result.advisor_name ?? 'advisor'}`);
        setShowImpersonateDialog(false);
      } else if (impersonateMode === 'temp_password' && result.temp_password) {
        setImpersonateTempPw(result.temp_password);
        toast.success('Temporary password set');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impersonation failed');
    } finally {
      setImpersonating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderImpersonateButton = () => {
    if (!isSuperAdmin || !isAdvisor) return null;
    return (
      <button
        type="button"
        onClick={() => {
          setShowImpersonateDialog(true);
          setImpersonateMode('magiclink');
          setImpersonateTempPw('');
        }}
        className="flex items-center space-x-2 px-4 py-2 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span>Login as Advisor</span>
      </button>
    );
  };

  const renderImpersonateDialog = () => {
    if (!showImpersonateDialog) return null;
    const targetName = advisorProfile
      ? `${advisorProfile.first_name} ${advisorProfile.last_name}`
      : crossUser?.full_name ?? user?.first_name ?? 'Advisor';
    const targetEmail = advisorProfile?.email ?? crossUser?.email ?? user?.email ?? '';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => { setShowImpersonateDialog(false); setImpersonateTempPw(''); }}
        />
        <div className="relative bg-surface-primary rounded-2xl border border-th-border shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary">Login as Advisor</h3>
                <p className="text-sm text-th-text-tertiary">Impersonate this advisor account</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setShowImpersonateDialog(false); setImpersonateTempPw(''); }}
              aria-label="Close dialog"
              className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-surface-secondary rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-th-text-primary">{targetName}</p>
            <p className="text-sm text-th-text-tertiary">{targetEmail}</p>
          </div>

          {!impersonateTempPw && (
            <>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImpersonateMode('magiclink')}
                    className={`px-3 py-2.5 text-sm rounded-lg border transition-colors text-left ${
                      impersonateMode === 'magiclink'
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                        : 'border-th-border text-th-text-secondary hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ExternalLink className="w-4 h-4" />
                      <span className="font-medium">Magic Link</span>
                    </div>
                    <p className="text-xs opacity-70">Opens portal in a new tab</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpersonateMode('temp_password')}
                    className={`px-3 py-2.5 text-sm rounded-lg border transition-colors text-left ${
                      impersonateMode === 'temp_password'
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                        : 'border-th-border text-th-text-secondary hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound className="w-4 h-4" />
                      <span className="font-medium">Temp Password</span>
                    </div>
                    <p className="text-xs opacity-70">Sets a temporary password</p>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This action will be logged. {impersonateMode === 'temp_password' ? 'Remember to reset the password after testing.' : 'A session will be created for this advisor.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowImpersonateDialog(false); setImpersonateTempPw(''); }}
                  className="px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImpersonate}
                  disabled={impersonating}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {impersonating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {impersonating ? 'Processing...' : impersonateMode === 'magiclink' ? 'Open Portal' : 'Set Password'}
                </button>
              </div>
            </>
          )}

          {impersonateTempPw && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1.5">
                  Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={impersonateTempPw}
                    aria-label="Temporary password"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(impersonateTempPw)}
                    title="Copy password"
                    className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Use this to sign in at the advisor portal. Remember to reset the advisor's password after testing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowImpersonateDialog(false); setImpersonateTempPw(''); }}
                className="w-full px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeleteDialog = () => {
    if (!showDeleteDialog) return null;
    const targetEmail = user?.email ?? crossUser?.email ?? '';
    const targetName = user
      ? `${user.first_name} ${user.last_name}`.trim()
      : crossUser?.full_name ?? crossUser?.email ?? 'this user';
    const confirmed = deleteConfirmEmail.trim().toLowerCase() === targetEmail.toLowerCase();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => { if (!deleting) { setShowDeleteDialog(false); setDeleteConfirmEmail(''); } }}
        />
        <div className="relative bg-surface-primary rounded-2xl border border-th-border shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary">Delete User</h3>
                <p className="text-sm text-th-text-tertiary">This action cannot be undone</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setShowDeleteDialog(false); setDeleteConfirmEmail(''); }}
              disabled={deleting}
              aria-label="Close dialog"
              className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-surface-secondary rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-th-text-primary">{targetName}</p>
            <p className="text-sm text-th-text-tertiary">{targetEmail}</p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
              <p><strong>Permanently deleting</strong> this user will:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Remove their login (they will no longer be able to sign in to any portal)</li>
                <li>Remove their admin profile, advisor profile, and portal role assignments</li>
                <li>Cannot be reversed — historical records referencing this user may be affected</li>
              </ul>
            </div>
          </div>

          <div>
            <label htmlFor="delete-confirm-email" className="block text-sm font-medium text-th-text-secondary mb-2">
              Type <span className="font-mono text-red-600 dark:text-red-400">{targetEmail}</span> to confirm
            </label>
            <input
              id="delete-confirm-email"
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={targetEmail}
              autoComplete="off"
              className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-th-text-primary placeholder-th-text-tertiary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowDeleteDialog(false); setDeleteConfirmEmail(''); }}
              disabled={deleting}
              className="px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={!confirmed || deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteButton = () => {
    if (!isSuperAdmin) return null;
    return (
      <button
        type="button"
        onClick={() => { setDeleteConfirmEmail(''); setShowDeleteDialog(true); }}
        className="flex items-center space-x-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    );
  };

  const renderProfileNameSection = () => {
    // Only useful when there is NO admin_users row — otherwise the existing
    // "User Details" card on the admin path already edits first/last name.
    if (!isSuperAdmin) return null;
    if (user) return null;
    if (!crossUser) return null;

    const currentFirst = advisorProfile?.first_name
      ?? crossUser.full_name?.split(' ')[0]
      ?? '';
    const currentLast = advisorProfile?.last_name
      ?? crossUser.full_name?.split(' ').slice(1).join(' ')
      ?? '';

    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Profile</h2>
          </div>
          {!editingProfile ? (
            <button
              type="button"
              onClick={startEditingProfile}
              className="px-4 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Edit Name
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                disabled={savingProfile}
                className="px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-first-name" className="block text-sm font-medium text-th-text-secondary mb-2">
              First Name
            </label>
            <input
              id="profile-first-name"
              type="text"
              value={editingProfile ? profileFirstName : currentFirst}
              onChange={(e) => setProfileFirstName(e.target.value)}
              disabled={!editingProfile}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:bg-surface-secondary text-th-text-primary"
            />
          </div>
          <div>
            <label htmlFor="profile-last-name" className="block text-sm font-medium text-th-text-secondary mb-2">
              Last Name
            </label>
            <input
              id="profile-last-name"
              type="text"
              value={editingProfile ? profileLastName : currentLast}
              onChange={(e) => setProfileLastName(e.target.value)}
              disabled={!editingProfile}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:bg-surface-secondary text-th-text-primary"
            />
          </div>
        </div>
        <p className="text-xs text-th-text-tertiary mt-3">
          Updates the display name everywhere this user appears (advisor portal,
          CRM, support portal, etc.).
        </p>
      </div>
    );
  };

  // ── Shared section renderers ─────────────────────────────────────────────────

  const renderEmailSection = () => {
    const currentEmail = user?.email ?? crossUser?.email;
    if (!currentEmail || !isSuperAdmin) return null;
    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Email Address</h2>
        </div>
        {!editingEmail ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-th-text-primary">{currentEmail}</p>
              <p className="text-xs text-th-text-tertiary mt-0.5">
                This is the email used to sign in across all portals
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setEditingEmail(true); setNewEmail(currentEmail); }}
              className="px-4 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Change Email
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="new-email" className="block text-xs text-th-text-tertiary mb-1">
                New Email Address
              </label>
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className="w-full max-w-md px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleUpdateEmail}
                disabled={savingEmail || !newEmail.trim()}
                className="px-4 py-2 bg-th-accent-600 text-white text-sm rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {savingEmail ? 'Updating...' : 'Update Email'}
              </button>
              <button
                type="button"
                onClick={() => { setEditingEmail(false); setNewEmail(''); }}
                className="px-4 py-2 border border-th-border text-th-text-secondary text-sm rounded-lg hover:bg-surface-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Changing the email will update the sign-in email for all portals (admin, advisor, CRM).
              The user will need to use the new email to log in.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderPasswordSection = () => (
    <div className="bg-surface-primary rounded-xl border border-th-border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Key className="w-5 h-5 text-th-text-tertiary" />
        <h2 className="text-lg font-semibold text-th-text-primary">Password Management</h2>
      </div>
      <div className="space-y-4">
        {/* Send reset email */}
        <div className="flex items-center justify-between py-3 border-b border-th-border-subtle">
          <div>
            <p className="text-sm font-medium text-th-text-primary">Send Reset Email</p>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              Send a password reset link to {user?.email ?? crossUser?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={sendingReset}
            className="px-4 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50 transition-colors"
          >
            {sendingReset ? 'Sending...' : 'Send Reset'}
          </button>
        </div>

        {/* Set password directly — super_admin only */}
        {isSuperAdmin && (
          <div>
            <p className="text-sm font-medium text-th-text-primary mb-3">Set New Password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password-new" className="block text-xs text-th-text-tertiary mb-1">
                  New Password
                </label>
                <input
                  id="password-new"
                  type="password"
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
                />
              </div>
              <div>
                <label htmlFor="password-confirm" className="block text-xs text-th-text-tertiary mb-1">
                  Confirm Password
                </label>
                <input
                  id="password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSetPassword}
              disabled={settingPassword || !passwordNew || !passwordConfirm}
              className="mt-3 flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white text-sm rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>{settingPassword ? 'Setting...' : 'Set Password'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPortalAccessSection = () => (
    <div className="bg-surface-primary rounded-xl border border-th-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Portal Access</h2>
        </div>
        {isSuperAdmin && !addingRole && (
          <button
            type="button"
            onClick={() => setAddingRole(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Role</span>
          </button>
        )}
      </div>

      {portalRoles.length === 0 && !addingRole ? (
        <p className="text-th-text-tertiary text-sm">No portal roles assigned.</p>
      ) : (
        <div className="space-y-2">
          {portalRoles.map((pr) => (
            <div
              key={pr.id}
              className="flex items-center justify-between py-2 border-b border-th-border-subtle last:border-0"
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2.5 py-1 text-xs rounded-full capitalize font-medium ${PORTAL_ROLE_COLORS[pr.role]}`}
                >
                  {PORTAL_ROLE_LABELS[pr.role]}
                </span>
                <span className="text-xs text-th-text-tertiary">
                  Since {new Date(pr.created_at).toLocaleDateString()}
                </span>
              </div>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handleRemoveRole(pr.role)}
                  aria-label={`Remove ${pr.role} role`}
                  className="p-1.5 text-th-text-tertiary hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {addingRole && (
        <div className="mt-4 flex items-center space-x-2">
          <label htmlFor="role-to-add" className="sr-only">Role to assign</label>
          <select
            id="role-to-add"
            value={roleToAdd}
            onChange={(e) => setRoleToAdd(e.target.value as PortalRole)}
            className="flex-1 px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            {ALL_PORTAL_ROLES.map((r) => (
              <option key={r} value={r}>{PORTAL_ROLE_LABELS[r]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssignRole}
            className="px-3 py-2 bg-th-accent-600 text-white text-sm rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            Assign
          </button>
          <button
            type="button"
            onClick={() => setAddingRole(false)}
            className="px-3 py-2 border border-th-border text-th-text-secondary text-sm rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Support Portal (ITSTS) sync status */}
      <div className="mt-6 pt-4 border-t border-th-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeadsetIcon className="w-4 h-4 text-th-text-tertiary" />
            <span className="text-sm font-medium text-th-text-primary">Support Portal (ITSTS)</span>
          </div>
          {hasSupportAccess ? (
            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Access Granted
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-surface-tertiary text-th-text-secondary">
              No Access
            </span>
          )}
        </div>
        <p className="text-xs text-th-text-tertiary mt-1.5">
          {hasSupportAccess
            ? 'User has access via Super Admin, Admin, or Advisor role.'
            : 'Assign a Super Admin, Admin, or Advisor role to grant support access.'}
        </p>
        {isSuperAdmin && hasSupportAccess && (
          <button
            type="button"
            onClick={handleSyncToItsts}
            disabled={syncingToItsts}
            className="mt-3 flex items-center space-x-2 px-3 py-1.5 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncingToItsts ? 'animate-spin' : ''}`} />
            <span>{syncingToItsts ? 'Syncing...' : 'Sync to ITSTS'}</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderAdvisorProfileSection = () => {
    if (!advisorProfile) return null;
    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Briefcase className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Advisor Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-th-text-tertiary mb-0.5">Full Name</p>
            <p className="font-medium text-th-text-primary">
              {advisorProfile.first_name} {advisorProfile.last_name}
            </p>
          </div>
          <div>
            <p className="text-th-text-tertiary mb-0.5">Email</p>
            <p className="font-medium text-th-text-primary">{advisorProfile.email}</p>
          </div>
          {advisorProfile.agent_id && (
            <div>
              <p className="text-th-text-tertiary mb-0.5">Agent ID</p>
              <p className="font-medium text-th-text-primary font-mono">{advisorProfile.agent_id}</p>
            </div>
          )}
          {advisorProfile.company_name && (
            <div>
              <p className="text-th-text-tertiary mb-0.5">Company</p>
              <p className="font-medium text-th-text-primary">{advisorProfile.company_name}</p>
            </div>
          )}
          <div>
            <p className="text-th-text-tertiary mb-0.5">Specialization</p>
            <p className="font-medium text-th-text-primary capitalize">{advisorProfile.specialization}</p>
          </div>
          <div>
            <p className="text-th-text-tertiary mb-0.5">Advisor Status</p>
            {isSuperAdmin ? (
              <div className="flex items-center gap-2 mt-1">
                <select
                  aria-label="Advisor status"
                  value={editAdvisorStatus}
                  onChange={(e) => setEditAdvisorStatus(e.target.value as AdvisorProfileSummary['status'])}
                  className="px-2 py-1 text-xs bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary capitalize"
                >
                  {ADVISOR_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAdvisorStatusSave}
                  disabled={savingAdvisorStatus || editAdvisorStatus === advisorProfile.status}
                  className="px-2 py-1 text-xs bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
                >
                  {savingAdvisorStatus ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize ${
                  advisorProfile.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : advisorProfile.status === 'suspended'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-surface-tertiary text-th-text-secondary'
                }`}
              >
                {advisorProfile.status}
              </span>
            )}
          </div>
          <div>
            <p className="text-th-text-tertiary mb-0.5">Onboarding</p>
            <span
              className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                advisorProfile.onboarding_completed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              }`}
            >
              {advisorProfile.onboarding_completed ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <div>
            <p className="text-th-text-tertiary mb-0.5">Joined</p>
            <p className="font-medium text-th-text-primary">
              {new Date(advisorProfile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  // ── Portal-only user (advisor / member — not in admin_users) ─────────────────

  if (!user && crossUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Users</span>
        </button>

        {/* Header */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-surface-tertiary rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-th-text-secondary">
                {(crossUser.full_name?.[0] ?? crossUser.email[0]).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-th-text-primary">
                {crossUser.full_name ?? crossUser.email}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-th-text-tertiary" />
                <span className="text-th-text-tertiary">{crossUser.email}</span>
              </div>
            </div>
          </div>

          {/* Role badges + impersonate + delete */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {crossUser.roles.length > 0 ? (
                crossUser.roles.map((role) => (
                  <span
                    key={role}
                    className={`px-3 py-1 text-sm rounded-full capitalize font-medium ${
                      PORTAL_ROLE_COLORS[role as PortalRole] ?? 'bg-surface-tertiary text-th-text-secondary'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <span className="text-sm text-th-text-tertiary">No portal roles</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {renderImpersonateButton()}
              {renderDeleteButton()}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-th-text-tertiary">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(crossUser.user_created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                Last login:{' '}
                {crossUser.last_sign_in_at
                  ? new Date(crossUser.last_sign_in_at).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {renderProfileNameSection()}
        {renderEmailSection()}
        {renderPasswordSection()}
        {renderPortalAccessSection()}
        {renderAdvisorProfileSection()}
        {renderImpersonateDialog()}
        {renderDeleteDialog()}
      </div>
    );
  }

  // ── Admin user (in admin_users table) ───────────────────────────────────────

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/users')}
        className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Users</span>
      </button>

      {/* User header */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                aria-hidden="true"
                role="presentation"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-surface-tertiary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-th-text-tertiary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-th-text-primary">
                {user.first_name} {user.last_name}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-th-text-tertiary" />
                <span className="text-th-text-tertiary">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {renderImpersonateButton()}
            {user.status === 'active' ? (
              <button
                type="button"
                onClick={handleSuspend}
                disabled={!isSuperAdmin}
                className="flex items-center space-x-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
              >
                <UserX className="w-4 h-4" />
                <span>Suspend</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={!isSuperAdmin}
                className="flex items-center space-x-2 px-4 py-2 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Activate</span>
              </button>
            )}
            {renderDeleteButton()}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center space-x-4 mt-4">
          <span
            className={`px-3 py-1 text-sm rounded-full capitalize ${
              user.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : user.status === 'suspended'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-surface-tertiary text-th-text-secondary'
            }`}
          >
            {user.status}
          </span>
          <span className="px-3 py-1 text-sm rounded-full bg-th-accent-100 dark:bg-th-accent-900/30 text-th-accent-700 dark:text-th-accent-300 capitalize">
            {user.role.replace('_', ' ')}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex items-center space-x-6 mt-4 text-sm text-th-text-tertiary">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              Last login:{' '}
              {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-th-text-primary">User Details</h2>
          {!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              disabled={!isSuperAdmin}
              className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="user-first-name" className="block text-sm font-medium text-th-text-secondary mb-2">
              First Name
            </label>
            <input
              id="user-first-name"
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              disabled={!editMode}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:bg-surface-secondary text-th-text-primary"
            />
          </div>
          <div>
            <label htmlFor="user-last-name" className="block text-sm font-medium text-th-text-secondary mb-2">
              Last Name
            </label>
            <input
              id="user-last-name"
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              disabled={!editMode}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:bg-surface-secondary text-th-text-primary"
            />
          </div>
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-th-text-secondary mb-2">
              Role
            </label>
            <select
              id="user-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
              disabled={!editMode}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:bg-surface-secondary text-th-text-primary"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Permissions</h2>
        </div>

        {formData.role === 'super_admin' ? (
          <p className="text-th-text-tertiary">Super admins have all permissions by default.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(permissions).map(([category, perms]) => (
              <div key={category}>
                <h3 className="font-medium text-th-text-primary capitalize mb-3">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map((perm) => (
                    <label key={perm.id} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        disabled={!editMode}
                        className="mt-1 w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-th-text-secondary">{perm.key}</p>
                        <p className="text-xs text-th-text-tertiary">{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {renderPortalAccessSection()}
      {renderEmailSection()}
      {renderPasswordSection()}
      {renderAdvisorProfileSection()}
      {renderImpersonateDialog()}
      {renderDeleteDialog()}
    </div>
  );
}
