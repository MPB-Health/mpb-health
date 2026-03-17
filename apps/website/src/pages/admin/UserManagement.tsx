import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  User,
  Loader2,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Crown,
  Briefcase,
  Building2,
  Mail,
  Key,
  Eye,
  EyeOff,
  Edit2,
  UserPlus,
  Send,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AUTH_URLS } from '@mpbhealth/config';
import {
  userRolesService,
  type UserWithRoles,
  type UserRole,
  type AdvisorProfileInfo,
  ROLE_LABELS,
  ROLE_COLORS,
  ALL_ROLES,
} from '../../lib/userRolesService';
import { toast } from 'sonner';
import { createClientLogger } from '@mpbhealth/utils';
import { cn } from '../../lib/utils';
import AddUserModal from '../../components/admin/AddUserModal';

const log = createClientLogger('UserManagement');

// ============================================================================
// Icon Map for Roles
// ============================================================================

const RoleIcons: Record<UserRole, React.FC<{ className?: string }>> = {
  super_admin: Crown,
  admin: ShieldCheck,
  advisor: Briefcase,
  crm_user: Building2,
  member: User,
};

const DEFAULT_ORG_ID = '00000000-0000-4000-a000-000000000001';

async function invokeEdgeFunction<T>(
  functionName: string,
  body: unknown,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return { data: null, error: new Error('You must be logged in to perform this action.') };
    }

    const supabaseUrl = (import.meta as ImportMeta & { env: { VITE_SUPABASE_URL?: string } }).env
      .VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return { data: null, error: new Error('Supabase URL is not configured.') };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
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

    return { data: payload as T, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unexpected request failure') };
  }
}

// ============================================================================
// Main Component
// ============================================================================

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [tableAvailable, setTableAvailable] = useState(true);

  // Role filter state
  type RoleFilter = 'all' | UserRole;
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // Advisor profile enrichment
  const [advisorProfiles, setAdvisorProfiles] = useState<Map<string, AdvisorProfileInfo>>(new Map());

  // Checkbox selection for targeted invites
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Password management state
  const [passwordModal, setPasswordModal] = useState<{ userId: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState<string | null>(null);

  // Name editing state
  const [nameModal, setNameModal] = useState<{ userId: string; email: string; currentName: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Add user modal state
  const [addUserModal, setAddUserModal] = useState(false);

  // Mass invite email state
  const [inviteModal, setInviteModal] = useState(false);
  const [invitePassword, setInvitePassword] = useState('MPBHealth2025!');
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [sendingMassInvites, setSendingMassInvites] = useState(false);
  const [massInviteResult, setMassInviteResult] = useState<{
    total: number;
    sent: number;
    skipped: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    checkTableAndLoadData();
  }, []);

  const checkTableAndLoadData = async () => {
    const available = await userRolesService.isRolesTableAvailable();
    setTableAvailable(available);
    if (available) {
      await loadUsers();
    } else {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [data, profiles] = await Promise.all([
        searchQuery.trim()
          ? userRolesService.searchUsersByEmail(searchQuery)
          : userRolesService.getAllUsersWithRoles(),
        userRolesService.getAdvisorProfiles(),
      ]);
      setUsers(data);
      setAdvisorProfiles(profiles);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await loadUsers();
  };

  // Get the correct auth confirmation URL based on user's primary portal (role).
  // All resets now go through /auth/confirm — a bridge page that handles token
  // exchange client-side. This prevents email security scanners (Defender, Proofpoint,
  // etc.) from consuming single-use tokens before the member clicks.
  const getResetRedirectUrl = (roles: UserRole[]): string => {
    if (roles.includes('super_admin') || roles.includes('admin')) return AUTH_URLS.admin.resetPassword;
    if (roles.includes('advisor')) return AUTH_URLS.advisor.resetPassword;
    if (roles.includes('crm_user')) return AUTH_URLS.crm.resetPassword;
    return AUTH_URLS.member.authConfirm; // member
  };

  // Send password reset email
  const handleSendPasswordReset = async (email: string, userId: string, roles: UserRole[]) => {
    setSendingReset(userId);
    try {
      const redirectTo = getResetRedirectUrl(roles);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      console.error('Error sending reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setSendingReset(null);
    }
  };

  // Open password change modal
  const openPasswordModal = (userId: string, email: string) => {
    setPasswordModal({ userId, email });
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  // Close password modal
  const closePasswordModal = () => {
    setPasswordModal(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  // Change password directly (requires admin API - uses edge function or service role)
  const handleChangePassword = async () => {
    if (!passwordModal) return;

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      log.info('Changing password for userId:', passwordModal.userId, 'email:', passwordModal.email);
      
      // Call edge function to update password (requires service role)
      const { data, error } = await invokeEdgeFunction<{ targetEmail?: string }>(
        'admin-update-password',
        { userId: passwordModal.userId, password: newPassword },
      );

      if (error) throw error;

      // Show confirmed target email from the response
      const targetEmail = data?.targetEmail || passwordModal.email;
      toast.success(`Password updated for ${targetEmail}`);
      log.info('Password change confirmed for:', targetEmail);
      closePasswordModal();
    } catch (error: any) {
      console.error('Error changing password:', error);
      // Fallback message if edge function doesn't exist
      toast.error(
        error.message || 
        'Direct password change requires a backend function. Use "Send Reset Email" instead.'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // Open name edit modal
  const openNameModal = (userId: string, email: string, currentName: string | null) => {
    setNameModal({ userId, email, currentName: currentName || '' });
    setEditName(currentName || '');
  };

  // Close name modal
  const closeNameModal = () => {
    setNameModal(null);
    setEditName('');
  };

  // Update user name (uses edge function or direct metadata update)
  const handleUpdateName = async () => {
    if (!nameModal) return;

    if (!editName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setNameSaving(true);
    try {
      // Try edge function first (for updating other users)
      const { error } = await invokeEdgeFunction(
        'admin-update-user',
        { userId: nameModal.userId, full_name: editName.trim() },
      );

      if (error) throw error;

      toast.success(`Name updated to "${editName.trim()}"`);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === nameModal.userId ? { ...u, full_name: editName.trim() } : u
        )
      );
      
      closeNameModal();
    } catch (error: any) {
      console.error('Error updating name:', error);
      
      // If edge function fails, try updating own profile if it's the current user
      if (nameModal.userId === user?.id) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: editName.trim() }
          });
          
          if (updateError) throw updateError;
          
          toast.success(`Name updated to "${editName.trim()}"`);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === nameModal.userId ? { ...u, full_name: editName.trim() } : u
            )
          );
          closeNameModal();
          return;
        } catch (selfError: any) {
          console.error('Error updating own name:', selfError);
        }
      }
      
      toast.error(
        error.message || 
        'Updating other users requires a backend function. You can update your own profile.'
      );
    } finally {
      setNameSaving(false);
    }
  };

  const handleToggleRole = async (userId: string, role: UserRole) => {
    const saveKey = `${userId}-${role}`;
    if (saving === saveKey) return;

    // Prevent removing your own super_admin role
    if (userId === user?.id && role === 'super_admin') {
      toast.error("You cannot remove your own Super Admin role");
      return;
    }

    setSaving(saveKey);
    try {
      // Use edge function with service role to bypass RLS and ensure role changes persist
      const { data, error } = await invokeEdgeFunction<{ success: boolean; granted: boolean }>(
        'admin-toggle-role',
        { userId, role },
      );

      if (error) {
        toast.error(error.message || 'Failed to update role');
        return;
      }

      if (data?.success) {
        const wasGranted = data.granted ?? false;
        toast.success(wasGranted ? `${ROLE_LABELS[role]} granted` : `${ROLE_LABELS[role]} revoked`);

        // Invalidate roles cache so subsequent reads are fresh
        userRolesService.invalidateCache(userId);

        // ----------------------------------------------------------------
        // Sync app-specific tables when roles are toggled so the user can
        // actually access the corresponding portal after the role grant.
        // ----------------------------------------------------------------

        // Find the user object so we can read email / full_name
        const targetUser = users.find((u) => u.id === userId);

        // Sync admin_users when admin role is toggled
        if (role === 'admin') {
          try {
            if (wasGranted) {
              const nameParts = (targetUser?.full_name || '').split(' ');
              const firstName = nameParts[0] || targetUser?.email?.split('@')[0] || 'Admin';
              const lastName = nameParts.slice(1).join(' ') || '';

              const { error: adminError } = await supabase
                .from('admin_users')
                .upsert(
                  {
                    id: userId,
                    email: targetUser?.email || '',
                    first_name: firstName,
                    last_name: lastName,
                    role: 'staff',
                    status: 'active',
                    permissions: [],
                    org_id: DEFAULT_ORG_ID,
                  },
                  { onConflict: 'id' }
                );
              if (adminError) {
                console.error('Error syncing admin_users:', adminError);
                toast.error('Admin role granted but admin portal profile sync failed');
              }
            } else {
              await supabase
                .from('admin_users')
                .update({ status: 'inactive' })
                .eq('id', userId);
            }
          } catch (adminError) {
            console.error('Error syncing admin_users:', adminError);
            toast.error('Admin role updated but admin portal profile sync failed');
          }
        }

        // Sync advisor_profiles when advisor role is toggled
        if (role === 'advisor') {
          try {
            if (wasGranted) {
              const nameParts = (targetUser?.full_name || '').split(' ');
              const firstName = nameParts[0] || targetUser?.email?.split('@')[0] || 'Advisor';
              const lastName = nameParts.slice(1).join(' ') || '';

              const { error: advisorError } = await supabase
                .from('advisor_profiles')
                .upsert(
                  {
                    id: userId,
                    user_id: userId,
                    email: targetUser?.email || '',
                    first_name: firstName,
                    last_name: lastName,
                    specialization: 'General',
                    status: 'active',
                    must_change_password: false,
                    onboarding_completed: false,
                    org_id: DEFAULT_ORG_ID,
                  },
                  { onConflict: 'id' }
                );
              if (advisorError) {
                console.error('Error syncing advisor_profiles:', advisorError);
                toast.error('Advisor role granted but advisor portal profile sync failed');
              }
            } else {
              await supabase
                .from('advisor_profiles')
                .update({ status: 'inactive' })
                .eq('id', userId);
            }
          } catch (advisorError) {
            console.error('Error syncing advisor_profiles:', advisorError);
            toast.error('Advisor role updated but advisor portal profile sync failed');
          }
        }

        // Sync org_memberships when crm_user role is toggled
        if (role === 'crm_user') {
          try {
            if (wasGranted) {
              const { error: orgError } = await supabase
                .from('org_memberships')
                .upsert(
                  {
                    user_id: userId,
                    org_id: DEFAULT_ORG_ID,
                    role: 'advisor',
                    status: 'active',
                    joined_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id,org_id' }
                );
              if (orgError) {
                console.error('Error syncing org membership:', orgError);
                toast.error('CRM role granted but org membership sync failed');
              }
            } else {
              await supabase
                .from('org_memberships')
                .update({ status: 'left' })
                .eq('user_id', userId)
                .eq('org_id', DEFAULT_ORG_ID);
            }
          } catch (orgError) {
            console.error('Error syncing org membership:', orgError);
            toast.error('CRM role updated but org membership sync failed');
          }
        }

        // Sync ALL app tables when super_admin role is granted (full access)
        if (role === 'super_admin' && wasGranted) {
          const nameParts = (targetUser?.full_name || '').split(' ');
          const firstName = nameParts[0] || targetUser?.email?.split('@')[0] || 'Admin';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Provision admin_users
          try {
            await supabase
              .from('admin_users')
              .upsert(
                {
                  id: userId,
                  email: targetUser?.email || '',
                  first_name: firstName,
                  last_name: lastName,
                  role: 'super_admin',
                  status: 'active',
                  permissions: [],
                  org_id: DEFAULT_ORG_ID,
                },
                { onConflict: 'id' }
              );
          } catch (e) {
            console.error('Error provisioning admin_users for super_admin:', e);
          }

          // Provision advisor_profiles
          try {
            await supabase
              .from('advisor_profiles')
              .upsert(
                {
                  id: userId,
                  user_id: userId,
                  email: targetUser?.email || '',
                  first_name: firstName,
                  last_name: lastName,
                  specialization: 'General',
                  status: 'active',
                  must_change_password: false,
                  onboarding_completed: false,
                  org_id: DEFAULT_ORG_ID,
                },
                { onConflict: 'id' }
              );
          } catch (e) {
            console.error('Error provisioning advisor_profiles for super_admin:', e);
          }

          // Provision org_memberships
          try {
            await supabase
              .from('org_memberships')
              .upsert(
                {
                  user_id: userId,
                  org_id: DEFAULT_ORG_ID,
                  role: 'owner',
                  status: 'active',
                  joined_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,org_id' }
              );
          } catch (e) {
            console.error('Error provisioning org_memberships for super_admin:', e);
          }
        }

        // Update local state
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === userId) {
              const newRoles = wasGranted
                ? [...u.roles, role]
                : u.roles.filter((r) => r !== role);
              return { ...u, roles: newRoles };
            }
            return u;
          })
        );
      } else {
        toast.error('Failed to update role');
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Failed to update role');
    } finally {
      setSaving(null);
    }
  };

  const handleSendInvites = async (mode: 'selected' | 'all_pending') => {
    setSendingMassInvites(true);
    setMassInviteResult(null);
    try {
      const body = mode === 'selected'
        ? { advisor_ids: Array.from(selectedIds), password: invitePassword }
        : { send_all_pending: true, password: invitePassword };

      const { data, error } = await invokeEdgeFunction<{
        summary: { total: number; sent: number; skipped: number; errors: number };
      }>('send-advisor-invites', body);

      if (error) {
        toast.error(`Failed to send invites: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error('No response from invite function');
        return;
      }

      setMassInviteResult(data.summary);

      if (data.summary.total === 0) {
        toast('No advisor accounts found to invite', { icon: 'ℹ️' });
      } else if (data.summary.errors === 0) {
        toast.success(`Successfully sent ${data.summary.sent} invite emails!`);
      } else {
        toast(`Sent ${data.summary.sent}, ${data.summary.errors} failed`, { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invites');
    } finally {
      setSendingMassInvites(false);
    }
  };

  // Filter users by search + role tab
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false;
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search)
    );
  });

  // Checkbox helpers
  const isAdvisorView = roleFilter === 'advisor';
  const advisorUsers = filteredUsers.filter((u) => u.roles.includes('advisor'));
  const allAdvisorsSelected = advisorUsers.length > 0 && advisorUsers.every((u) => selectedIds.has(u.id));
  const someAdvisorsSelected = advisorUsers.some((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (allAdvisorsSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(advisorUsers.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const stats = {
    total: users.length,
    superAdmins: users.filter((u) => u.roles.includes('super_admin')).length,
    admins: users.filter((u) => u.roles.includes('admin')).length,
    advisors: users.filter((u) => u.roles.includes('advisor')).length,
    crmUsers: users.filter((u) => u.roles.includes('crm_user')).length,
  };

  // Access check
  if (!isSuperAdmin && !loading) {
    return (
      <AdminLayout activeView="users" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600">Only Super Admins can manage user roles.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView="users" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>User Management - Admin - MPB Health</title>
        <meta name="description" content="Manage user roles and access levels" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="User Management" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">User Management </h1>
              <p className="mt-2 text-neutral-600">
                Manage user roles and access levels across all portals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setAddUserModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button onClick={() => setInviteModal(true)} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Invites
              </Button>
              <Button onClick={() => navigate('/admin/users/bulk-import')} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={loadUsers} variant="outline" disabled={loading}>
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Database Warning */}
        {!tableAvailable && (
          <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Database Not Configured</h4>
                <p className="text-sm text-amber-700 mt-1">
                  The user_roles table doesn't exist yet. Run the migration in Supabase to enable role management.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          {([
            { key: 'all' as RoleFilter, label: 'Total Users', count: stats.total, Icon: Users, bg: 'bg-slate-50', border: 'border-slate-600', activeBg: 'bg-slate-100 ring-2 ring-slate-400', iconColor: 'text-slate-600' },
            { key: 'super_admin' as RoleFilter, label: 'Super Admins', count: stats.superAdmins, Icon: Crown, bg: 'bg-purple-50', border: 'border-purple-600', activeBg: 'bg-purple-100 ring-2 ring-purple-400', iconColor: 'text-purple-600' },
            { key: 'admin' as RoleFilter, label: 'Admins', count: stats.admins, Icon: ShieldCheck, bg: 'bg-blue-50', border: 'border-blue-600', activeBg: 'bg-blue-100 ring-2 ring-blue-400', iconColor: 'text-blue-600' },
            { key: 'advisor' as RoleFilter, label: 'Advisors', count: stats.advisors, Icon: Briefcase, bg: 'bg-green-50', border: 'border-green-600', activeBg: 'bg-green-100 ring-2 ring-green-400', iconColor: 'text-green-600' },
            { key: 'crm_user' as RoleFilter, label: 'CRM Users', count: stats.crmUsers, Icon: Building2, bg: 'bg-indigo-50', border: 'border-indigo-600', activeBg: 'bg-indigo-100 ring-2 ring-indigo-400', iconColor: 'text-indigo-600' },
          ]).map(({ key, label, count, Icon, bg, border, activeBg, iconColor }) => (
            <button
              key={key}
              onClick={() => { setRoleFilter(key); setSelectedIds(new Set()); }}
              className={cn(
                'p-4 rounded-lg border-l-4 text-left transition-all',
                border,
                roleFilter === key ? activeBg : cn(bg, 'hover:opacity-80'),
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('h-8 w-8', iconColor)} />
                <div>
                  <div className="text-sm font-medium text-neutral-600">{label}</div>
                  <div className="text-2xl font-bold text-neutral-900">{count}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>
        </Card>

        {/* Role Legend */}
        <Card className="p-4 mb-6 bg-neutral-50">
          <h3 className="font-semibold text-neutral-900 mb-3">Role Permissions</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {ALL_ROLES.map((role) => {
              const Icon = RoleIcons[role];
              return (
                <div key={role} className="flex items-start gap-2">
                  <Icon className="h-5 w-5 text-neutral-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-neutral-900">{ROLE_LABELS[role]}</div>
                    <div className="text-xs text-neutral-500">
                      {role === 'super_admin' && 'All portals + User Management'}
                      {role === 'admin' && 'Admin portal access'}
                      {role === 'advisor' && 'Advisor portal access'}
                      {role === 'crm_user' && 'CRM portal access'}
                      {role === 'member' && 'Member portal access'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Floating Action Bar for selected advisors */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-teal-700 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedIds.size} advisor{selectedIds.size > 1 ? 's' : ''} selected</span>
            <button
              onClick={() => setInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-teal-700 rounded-lg text-sm font-semibold hover:bg-teal-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Send Invite
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-teal-200 hover:text-white text-sm"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">
              {roleFilter === 'all' ? 'All Users' : ROLE_LABELS[roleFilter] + 's'} ({filteredUsers.length})
            </h3>
            {isAdvisorView && advisorUsers.length > 0 && (
              <span className="text-xs text-neutral-500">
                Select advisors to send targeted invites
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No users found</h3>
              <p className="text-neutral-600">
                {searchQuery ? 'Try a different search term' : roleFilter !== 'all' ? `No users with the ${ROLE_LABELS[roleFilter]} role` : 'No users have been assigned roles yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    {isAdvisorView && (
                      <th className="px-3 py-3 text-center w-10">
                        <button onClick={toggleSelectAll} className="text-neutral-500 hover:text-neutral-900" aria-label="Select all">
                          {allAdvisorsSelected ? <CheckSquare className="h-4 w-4" /> : someAdvisorsSelected ? <MinusSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">User</th>
                    {isAdvisorView ? (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Agent ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Company</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">Portal Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">Password</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Current Roles</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                          <Crown className="h-4 w-4 inline mr-1" />Super Admin
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                          <ShieldCheck className="h-4 w-4 inline mr-1" />Admin
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                          <Briefcase className="h-4 w-4 inline mr-1" />Advisor
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                          <Building2 className="h-4 w-4 inline mr-1" />CRM User
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                      <Key className="h-4 w-4 inline mr-1" />Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredUsers.map((u) => {
                    const profile = advisorProfiles.get(u.id);
                    const isAdvisor = u.roles.includes('advisor');

                    return (
                      <tr key={u.id} className={cn('hover:bg-neutral-50', selectedIds.has(u.id) && 'bg-teal-50/50')}>
                        {isAdvisorView && (
                          <td className="px-3 py-4 text-center">
                            {isAdvisor && (
                              <button onClick={() => toggleSelect(u.id)} className="text-neutral-500 hover:text-neutral-900" aria-label={selectedIds.has(u.id) ? 'Deselect' : 'Select'}>
                                {selectedIds.has(u.id) ? <CheckSquare className="h-4 w-4 text-teal-600" /> : <Square className="h-4 w-4" />}
                              </button>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', isAdvisor && profile ? 'bg-green-100' : 'bg-blue-100')}>
                              <User className={cn('h-5 w-5', isAdvisor && profile ? 'text-green-600' : 'text-blue-600')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-900 truncate">
                                  {profile ? `${profile.first_name} ${profile.last_name}`.trim() || u.full_name || 'No name' : u.full_name || 'No name'}
                                </span>
                                <button
                                  onClick={() => openNameModal(u.id, u.email, u.full_name)}
                                  className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0"
                                  title="Edit name"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="text-sm text-neutral-500 truncate">{u.email}</div>
                            </div>
                            {u.id === user?.id && (
                              <Badge className="bg-blue-100 text-blue-700 shrink-0">You</Badge>
                            )}
                          </div>
                        </td>

                        {isAdvisorView ? (
                          <>
                            <td className="px-4 py-4 text-sm font-mono text-neutral-700">
                              {profile?.agent_id || <span className="text-neutral-300">--</span>}
                            </td>
                            <td className="px-4 py-4 text-sm text-neutral-700">
                              {profile?.company_name || <span className="text-neutral-300">--</span>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {profile ? (
                                <Badge className={cn('text-xs', {
                                  'bg-green-100 text-green-800': profile.status === 'active',
                                  'bg-yellow-100 text-yellow-800': profile.status === 'pending',
                                  'bg-red-100 text-red-800': profile.status === 'suspended' || profile.status === 'inactive',
                                })}>
                                  {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-red-50 text-red-600 border border-red-200">No Profile</Badge>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {profile ? (
                                profile.must_change_password ? (
                                  <Badge className="text-xs bg-amber-100 text-amber-800">Pending Login</Badge>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                    <Check className="h-3 w-3" /> Changed
                                  </span>
                                )
                              ) : (
                                <span className="text-neutral-300">--</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {u.roles.length === 0 ? (
                                  <span className="text-sm text-neutral-400">No roles</span>
                                ) : (
                                  u.roles.map((role) => (
                                    <Badge key={role} className={cn('text-xs', ROLE_COLORS[role])}>
                                      {ROLE_LABELS[role]}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <RoleToggle hasRole={u.roles.includes('super_admin')} isSaving={saving === `${u.id}-super_admin`} disabled={u.id === user?.id} onToggle={() => handleToggleRole(u.id, 'super_admin')} />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <RoleToggle hasRole={u.roles.includes('admin')} isSaving={saving === `${u.id}-admin`} onToggle={() => handleToggleRole(u.id, 'admin')} />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <RoleToggle hasRole={u.roles.includes('advisor')} isSaving={saving === `${u.id}-advisor`} onToggle={() => handleToggleRole(u.id, 'advisor')} />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <RoleToggle hasRole={u.roles.includes('crm_user')} isSaving={saving === `${u.id}-crm_user`} onToggle={() => handleToggleRole(u.id, 'crm_user')} />
                            </td>
                          </>
                        )}

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleSendPasswordReset(u.email, u.id, u.roles)} disabled={sendingReset === u.id} title="Send password reset email" className="text-xs">
                              {sendingReset === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Mail className="h-3 w-3 mr-1" />Reset</>}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openPasswordModal(u.id, u.email)} title="Set password directly" className="text-xs">
                              <Key className="h-3 w-3 mr-1" />Set
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Tips */}
        <Card className="mt-6 p-6 bg-purple-50 border-purple-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-purple-600" />
            Role Management Tips
          </h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Super Admin</strong> has access to all portals with a single login</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Users can have <strong>multiple roles</strong> assigned simultaneously</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>You <strong>cannot remove your own Super Admin</strong> role for safety</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>CRM User</strong> toggle grants access to the CRM portal with default advisor permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Role changes take effect on the user's <strong>next login or page refresh</strong></span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Password Change Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Set Password</h2>
                    <p className="text-sm text-neutral-500">{passwordModal.email}</p>
                  </div>
                </div>
                <button
                  onClick={closePasswordModal}
                  aria-label="Close set password modal"
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {newPassword && newPassword.length < 8 && (
                <p className="text-sm text-amber-600">Password must be at least 8 characters</p>
              )}

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Direct password changes require a backend edge function. 
                  If this fails, use the <strong>"Send Reset Email"</strong> option instead.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <Button variant="outline" onClick={closePasswordModal} disabled={passwordSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordSaving || newPassword.length < 8 || newPassword !== confirmPassword}
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Set Password
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Name Edit Modal */}
      {nameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Edit Name</h2>
                    <p className="text-sm text-neutral-500">{nameModal.email}</p>
                  </div>
                </div>
                <button
                  onClick={closeNameModal}
                  aria-label="Close edit name modal"
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter full name"
                  autoFocus
                />
              </div>

              {nameModal.userId !== user?.id && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Updating other users' names requires a backend edge function.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <Button variant="outline" onClick={closeNameModal} disabled={nameSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateName}
                disabled={nameSaving || !editName.trim()}
              >
                {nameSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Name
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={addUserModal}
        onClose={() => setAddUserModal(false)}
        onSuccess={loadUsers}
      />

      {/* Send Invites Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Send className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Send Invite Emails</h2>
                  <p className="text-sm text-neutral-600">
                    {selectedIds.size > 0
                      ? `Send invites to ${selectedIds.size} selected advisor${selectedIds.size > 1 ? 's' : ''}`
                      : 'Send invites to all advisors with pending logins'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedIds.size > 0 && (
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-sm text-teal-800 font-medium mb-2">Selected Advisors:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {Array.from(selectedIds).map((id) => {
                      const u = users.find((x) => x.id === id);
                      const p = advisorProfiles.get(id);
                      const name = p ? `${p.first_name} ${p.last_name}`.trim() : u?.full_name;
                      return (
                        <Badge key={id} className="text-xs bg-white text-teal-800 border border-teal-200">
                          {name || u?.email || id.slice(0, 8)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedIds.size === 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    This will send an email to all advisor accounts that still have a pending password change.
                    Each email includes their login credentials and a link to the Advisor Portal.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="invite-password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Temporary Password to Include
                </label>
                <div className="relative">
                  <input
                    id="invite-password"
                    type={showInvitePassword ? 'text' : 'password'}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={showInvitePassword ? 'Hide password' : 'Show password'}
                  >
                    {showInvitePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  This is the temporary password included in the invite email.
                </p>
              </div>

              {massInviteResult && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{massInviteResult.sent}</p>
                    <p className="text-xs text-green-600">Sent</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-yellow-700">{massInviteResult.skipped}</p>
                    <p className="text-xs text-yellow-600">Skipped</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-700">{massInviteResult.errors}</p>
                    <p className="text-xs text-red-600">Failed</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setInviteModal(false);
                  setMassInviteResult(null);
                }}
                disabled={sendingMassInvites}
              >
                {massInviteResult ? 'Close' : 'Cancel'}
              </Button>
              {!massInviteResult && (
                <button
                  onClick={() => handleSendInvites(selectedIds.size > 0 ? 'selected' : 'all_pending')}
                  disabled={sendingMassInvites || !invitePassword}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingMassInvites ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {selectedIds.size > 0 ? `Send to ${selectedIds.size} Selected` : 'Send to All Pending'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// ============================================================================
// Role Toggle Component
// ============================================================================

interface RoleToggleProps {
  hasRole: boolean;
  isSaving: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const RoleToggle: React.FC<RoleToggleProps> = ({ hasRole, isSaving, disabled, onToggle }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={hasRole}
      aria-disabled={isSaving || disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={isSaving || disabled}
      className={cn(
        'w-12 h-6 rounded-full transition-colors relative',
        hasRole ? 'bg-green-500' : 'bg-neutral-300',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:opacity-80 cursor-pointer'
      )}
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 absolute top-1 left-1/2 -translate-x-1/2 animate-spin text-white" />
      ) : (
        <div
          className={cn(
            'w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform flex items-center justify-center',
            hasRole ? 'translate-x-6' : 'translate-x-0.5'
          )}
        >
          {hasRole ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <X className="h-3 w-3 text-neutral-400" />
          )}
        </div>
      )}
    </button>
  );
};

export default UserManagement;
