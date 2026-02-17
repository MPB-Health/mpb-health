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
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  userRolesService,
  type UserWithRoles,
  type UserRole,
  ROLE_LABELS,
  ROLE_COLORS,
  ALL_ROLES,
} from '../../lib/userRolesService';
import { toast } from 'sonner';
import { createClientLogger } from '@mpbhealth/utils';
import { cn } from '../../lib/utils';

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
      let data: UserWithRoles[];
      if (searchQuery.trim()) {
        data = await userRolesService.searchUsersByEmail(searchQuery);
      } else {
        data = await userRolesService.getAllUsersWithRoles();
      }
      setUsers(data);
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

  // Send password reset email
  const handleSendPasswordReset = async (email: string, userId: string) => {
    setSendingReset(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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
      const { data, error } = await supabase.functions.invoke('admin-update-password', {
        body: { userId: passwordModal.userId, password: newPassword },
      });

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
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: { userId: nameModal.userId, full_name: editName.trim() },
      });

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
    if (saving) return;

    // Prevent removing your own super_admin role
    if (userId === user?.id && role === 'super_admin') {
      toast.error("You cannot remove your own Super Admin role");
      return;
    }

    setSaving(`${userId}-${role}`);
    try {
      const result = await userRolesService.toggleRole(userId, role, user?.id);
      if (result.success) {
        const wasGranted = result.data;
        toast.success(wasGranted ? `${ROLE_LABELS[role]} granted` : `${ROLE_LABELS[role]} revoked`);

        // Sync org_memberships when crm_user role is toggled
        if (role === 'crm_user') {
          try {
            if (wasGranted) {
              // Grant: add user to default org with advisor role
              await supabase
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
            } else {
              // Revoke: remove user from default org
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
        toast.error(result.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Failed to update role');
    } finally {
      setSaving(null);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search)
    );
  });

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
              <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
              <p className="mt-2 text-neutral-600">
                Manage user roles and access levels across all portals
              </p>
            </div>
            <Button onClick={loadUsers} variant="outline" disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
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

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-slate-50 border-l-4 border-slate-600">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-slate-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Total Users</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-purple-50 border-l-4 border-purple-600">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Super Admins</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.superAdmins}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Admins</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.admins}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-green-50 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Advisors</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.advisors}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-indigo-50 border-l-4 border-indigo-600">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">CRM Users</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.crmUsers}</div>
              </div>
            </div>
          </Card>
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

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-900">
              Users with Roles ({filteredUsers.length})
            </h3>
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
                {searchQuery ? 'Try a different search term' : 'No users have been assigned roles yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Current Roles</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                      <Crown className="h-4 w-4 inline mr-1" />
                      Super Admin
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                      <ShieldCheck className="h-4 w-4 inline mr-1" />
                      Admin
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Advisor
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      CRM User
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                      <Key className="h-4 w-4 inline mr-1" />
                      Password
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">
                                {u.full_name || 'No name'}
                              </span>
                              <button
                                onClick={() => openNameModal(u.id, u.email, u.full_name)}
                                className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit name"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-sm text-neutral-500">{u.email}</div>
                          </div>
                          {u.id === user?.id && (
                            <Badge className="bg-blue-100 text-blue-700">You</Badge>
                          )}
                        </div>
                      </td>
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
                      {/* Super Admin Toggle */}
                      <td className="px-4 py-4 text-center">
                        <RoleToggle
                          hasRole={u.roles.includes('super_admin')}
                          isSaving={saving === `${u.id}-super_admin`}
                          disabled={u.id === user?.id}
                          onToggle={() => handleToggleRole(u.id, 'super_admin')}
                        />
                      </td>
                      {/* Admin Toggle */}
                      <td className="px-4 py-4 text-center">
                        <RoleToggle
                          hasRole={u.roles.includes('admin')}
                          isSaving={saving === `${u.id}-admin`}
                          onToggle={() => handleToggleRole(u.id, 'admin')}
                        />
                      </td>
                      {/* Advisor Toggle */}
                      <td className="px-4 py-4 text-center">
                        <RoleToggle
                          hasRole={u.roles.includes('advisor')}
                          isSaving={saving === `${u.id}-advisor`}
                          onToggle={() => handleToggleRole(u.id, 'advisor')}
                        />
                      </td>
                      {/* CRM User Toggle */}
                      <td className="px-4 py-4 text-center">
                        <RoleToggle
                          hasRole={u.roles.includes('crm_user')}
                          isSaving={saving === `${u.id}-crm_user`}
                          onToggle={() => handleToggleRole(u.id, 'crm_user')}
                        />
                      </td>
                      {/* Password Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendPasswordReset(u.email, u.id)}
                            disabled={sendingReset === u.id}
                            title="Send password reset email"
                            className="text-xs"
                          >
                            {sendingReset === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Mail className="h-3 w-3 mr-1" />
                                Reset
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPasswordModal(u.id, u.email)}
                            title="Set password directly"
                            className="text-xs"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Set
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
      onClick={onToggle}
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
