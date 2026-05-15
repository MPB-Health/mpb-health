import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Plus,
  MoreVertical,
  CheckSquare,
  Square,
  ChevronDown,
  KeyRound,
  X,
  Loader2,
  AlertTriangle,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  userService,
  type AdminUser,
  type CrossPortalUser,
  type PortalRole,
} from '@mpbhealth/admin-core';
import { invokeWithResolvedAuth } from '@mpbhealth/database';
import { useAdmin } from '../contexts/AdminContext';
import AddUserModal from '../components/AddUserModal';
import InviteUserModal from '../components/InviteUserModal';

type PortalTab = 'admin' | 'advisor' | 'member' | 'concierge' | 'support' | 'all';

const SUPPORT_ACCESS_ROLES = ['super_admin', 'admin', 'advisor', 'concierge'];

interface MassPasswordResetResponse {
  success: boolean;
  error?: string;
  sent?: number;
  errors?: unknown[];
  total?: number;
}

const PORTAL_TABS: { id: PortalTab; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'concierge', label: 'Concierge' },
  { id: 'member', label: 'Member' },
  { id: 'support', label: 'Support' },
  { id: 'all', label: 'All Portals' },
];

const PORTAL_ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advisor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  member: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  crm_user: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  concierge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

function getRoleColor(role: string) {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'admin':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'manager':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    default:
      return 'bg-surface-tertiary text-th-text-secondary';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'suspended':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-surface-tertiary text-th-text-secondary';
  }
}

export default function Users() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();

  // Tab state
  const [activeTab, setActiveTab] = useState<PortalTab>('admin');

  // Admin portal users (from admin_users table)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  // Cross-portal users (from users_with_roles view)
  const [crossUsers, setCrossUsers] = useState<CrossPortalUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mass password reset
  const [showMassResetModal, setShowMassResetModal] = useState(false);
  const [massResetLoading, setMassResetLoading] = useState(false);
  const [massResetResult, setMassResetResult] = useState<{ sent: number; errors: number; total: number } | null>(null);

  // Delete (single)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string; name: string } | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Delete (bulk)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<{ deleted: number; failed: number; total: number } | null>(null);

  const loadAdminUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setAdminUsers(data);
    } catch {
      console.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  const loadCrossPortalUsers = useCallback(async (role?: PortalRole) => {
    setLoading(true);
    try {
      const data = await userService.getCrossPortalUsers({
        role,
        search: searchQuery || undefined,
      });
      setCrossUsers(data);
    } catch {
      console.error('Failed to load cross-portal users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    setSelectedIds(new Set());
    if (activeTab === 'admin') {
      loadAdminUsers();
    } else if (activeTab === 'advisor') {
      loadCrossPortalUsers('advisor');
    } else if (activeTab === 'concierge') {
      loadCrossPortalUsers('concierge');
    } else if (activeTab === 'member') {
      loadCrossPortalUsers('member');
    } else if (activeTab === 'support') {
      loadCrossPortalUsers();
    } else {
      loadCrossPortalUsers();
    }
  }, [activeTab, searchQuery, roleFilter, statusFilter, loadAdminUsers, loadCrossPortalUsers]);

  // ── Bulk actions ────────────────────────────────────────────────────────────

  const filteredCrossUsers = activeTab === 'support'
    ? crossUsers.filter((u) => u.roles.some((r) => SUPPORT_ACCESS_ROLES.includes(r)))
    : crossUsers;
  const currentList = activeTab === 'admin' ? adminUsers : filteredCrossUsers;
  const currentListIds = currentList.map((u) => u.id);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentListIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentListIds));
    }
  };

  const handleBulkAction = async (status: AdminUser['status']) => {
    if (selectedIds.size === 0) return;
    setBulkMenuOpen(false);
    try {
      await userService.bulkUpdateStatus([...selectedIds], status);
      toast.success(`${selectedIds.size} user(s) updated to ${status}`);
      setSelectedIds(new Set());
      await loadAdminUsers();
    } catch {
      toast.error('Bulk update failed');
    }
  };

  // ── Mass password reset ─────────────────────────────────────────────────────

  const handleMassPasswordReset = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.error('No users selected');
      return;
    }
    setMassResetLoading(true);
    setMassResetResult(null);
    try {
      const { data, error } = await invokeWithResolvedAuth<MassPasswordResetResponse>('mass-password-reset', {
        body: { advisor_ids: ids },
      });
      if (error) throw error;
      if (!data) throw new Error('No response received');
      if (!data.success) throw new Error(data.error || 'Reset failed');
      setMassResetResult({
        sent: data.sent ?? 0,
        errors: data.errors?.length ?? 0,
        total: data.total ?? ids.length,
      });
      toast.success(`Password reset emails sent to ${data.sent ?? 0} user(s)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send mass password reset';
      toast.error(msg);
    } finally {
      setMassResetLoading(false);
    }
  };

  const openMassReset = () => {
    setBulkMenuOpen(false);
    setMassResetResult(null);
    setShowMassResetModal(true);
  };

  // ── Delete handlers ─────────────────────────────────────────────────────────

  const refreshCurrentTab = async () => {
    if (activeTab === 'admin') await loadAdminUsers();
    else if (activeTab === 'advisor') await loadCrossPortalUsers('advisor');
    else if (activeTab === 'concierge') await loadCrossPortalUsers('concierge');
    else if (activeTab === 'member') await loadCrossPortalUsers('member');
    else await loadCrossPortalUsers();
  };

  const openDeleteDialog = (id: string, email: string, name: string) => {
    setDeleteConfirmEmail('');
    setDeleteTarget({ id, email, name });
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteConfirmEmail('');
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmEmail.trim().toLowerCase() !== deleteTarget.email.toLowerCase()) {
      toast.error('Confirmation email does not match');
      return;
    }
    setDeleting(true);
    try {
      await userService.permanentlyDeleteUser(deleteTarget.id, {
        confirmEmail: deleteConfirmEmail.trim(),
      });
      toast.success(`Deleted ${deleteTarget.email}`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
      setDeleteConfirmEmail('');
      await refreshCurrentTab();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const openBulkDelete = () => {
    setBulkMenuOpen(false);
    setBulkDeleteConfirm('');
    setBulkDeleteResult(null);
    setShowBulkDeleteDialog(true);
  };

  const closeBulkDelete = () => {
    if (bulkDeleting) return;
    setShowBulkDeleteDialog(false);
    setBulkDeleteConfirm('');
    setBulkDeleteResult(null);
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.error('No users selected');
      return;
    }
    if (bulkDeleteConfirm.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    try {
      for (const id of ids) {
        try {
          await userService.permanentlyDeleteUser(id);
          deleted += 1;
        } catch {
          failed += 1;
        }
      }
      setBulkDeleteResult({ deleted, failed, total: ids.length });
      if (deleted > 0) toast.success(`${deleted} user(s) deleted`);
      if (failed > 0) toast.error(`${failed} user(s) could not be deleted`);
      setSelectedIds(new Set());
      await refreshCurrentTab();
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderSelectCheckbox = (id: string, label: string) => (
    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => toggleSelect(id)}
        aria-label={`Select ${label}`}
        className="text-th-text-tertiary hover:text-th-text-primary"
      >
        {selectedIds.has(id) ? (
          <CheckSquare className="w-4 h-4 text-th-accent-600" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>
    </td>
  );

  const renderSelectAllHeader = () => (
    <th className="py-3 px-4 w-10">
      <button
        type="button"
        onClick={toggleSelectAll}
        aria-label="Select all"
        className="text-th-text-tertiary hover:text-th-text-primary"
      >
        {selectedIds.size === currentListIds.length && currentListIds.length > 0 ? (
          <CheckSquare className="w-4 h-4" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>
    </th>
  );

  const renderAdminTable = () => (
    <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      ) : adminUsers.length > 0 ? (
        <table className="w-full">
          <thead className="bg-surface-secondary border-b border-th-border">
            <tr>
              {isSuperAdmin && renderSelectAllHeader()}
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Last Login</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border-subtle">
            {adminUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-surface-tertiary cursor-pointer"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                {isSuperAdmin && renderSelectCheckbox(user.id, `${user.first_name} ${user.last_name}`)}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        aria-hidden="true"
                        role="presentation"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-surface-tertiary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-th-text-secondary">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-th-text-primary">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-th-text-tertiary">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-th-text-tertiary">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/users/${user.id}`)}
                      title="Edit user"
                      aria-label={`Edit ${user.first_name} ${user.last_name}`}
                      className="p-2 text-th-text-tertiary hover:text-th-accent-600 rounded-lg hover:bg-surface-tertiary"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          openDeleteDialog(
                            user.id,
                            user.email,
                            `${user.first_name} ${user.last_name}`.trim(),
                          )
                        }
                        title="Delete user"
                        aria-label={`Delete ${user.first_name} ${user.last_name}`}
                        className="p-2 text-th-text-tertiary hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/users/${user.id}`)}
                      aria-label="User actions"
                      className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No users found</p>
        </div>
      )}
    </div>
  );

  const renderCrossPortalTable = () => {
    const usersToShow = activeTab === 'support' ? filteredCrossUsers : crossUsers;
    const showSupportColumn = activeTab === 'all' || activeTab === 'support';

    return (
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : usersToShow.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                {isSuperAdmin && renderSelectAllHeader()}
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Portal Roles</th>
                {showSupportColumn && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Support</th>
                )}
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Last Login</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {usersToShow.map((user) => {
                const hasSupportAccess = user.roles.some((r) => SUPPORT_ACCESS_ROLES.includes(r));
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-tertiary cursor-pointer"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    {isSuperAdmin && renderSelectCheckbox(user.id, user.full_name ?? user.email)}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-surface-tertiary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-th-text-secondary">
                            {(user.full_name?.[0] ?? user.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-th-text-primary">
                            {user.full_name ?? '—'}
                          </p>
                          <p className="text-sm text-th-text-tertiary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? user.roles.map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 text-xs rounded-full capitalize ${PORTAL_ROLE_COLORS[role] ?? 'bg-surface-tertiary text-th-text-secondary'}`}
                          >
                            {role.replace('_', ' ')}
                          </span>
                        )) : (
                          <span className="text-xs text-th-text-tertiary">No roles</span>
                        )}
                      </div>
                    </td>
                    {showSupportColumn && (
                      <td className="py-3 px-4">
                        {hasSupportAccess ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-surface-tertiary text-th-text-tertiary">
                            None
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {new Date(user.user_created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${user.id}`)}
                          title="Edit user"
                          aria-label={`Edit ${user.full_name ?? user.email}`}
                          className="p-2 text-th-text-tertiary hover:text-th-accent-600 rounded-lg hover:bg-surface-tertiary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              openDeleteDialog(
                                user.id,
                                user.email,
                                user.full_name ?? user.email,
                              )
                            }
                            title="Delete user"
                            aria-label={`Delete ${user.full_name ?? user.email}`}
                            className="p-2 text-th-text-tertiary hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${user.id}`)}
                          aria-label="View user details"
                          className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No users found</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Users</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage users across all portals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Bulk actions (any tab, super_admin only) */}
          {isSuperAdmin && selectedIds.size > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setBulkMenuOpen((o) => !o)}
                className="flex items-center space-x-1 px-4 py-2 border border-th-border text-th-text-secondary rounded-lg font-medium hover:bg-surface-secondary transition-colors"
              >
                <span>{selectedIds.size} selected</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {bulkMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-surface-primary border border-th-border rounded-lg shadow-lg z-10">
                  {activeTab === 'admin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleBulkAction('active')}
                        className="w-full text-left px-4 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkAction('suspended')}
                        className="w-full text-left px-4 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkAction('inactive')}
                        className="w-full text-left px-4 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
                      >
                        Deactivate
                      </button>
                      <div className="border-t border-th-border my-1" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={openMassReset}
                    className="w-full text-left px-4 py-2 text-sm text-th-text-primary hover:bg-surface-secondary flex items-center space-x-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset</span>
                  </button>
                  <div className="border-t border-th-border my-1" />
                  <button
                    type="button"
                    onClick={openBulkDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-th-border text-th-text-secondary rounded-lg font-medium hover:bg-surface-secondary transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Invite</span>
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Portal tabs */}
      <div className="flex border-b border-th-border">
        {PORTAL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-th-accent-600 text-th-accent-600'
                : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
        {activeTab === 'admin' && (
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-th-text-tertiary" />
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {activeTab === 'admin' ? renderAdminTable() : renderCrossPortalTable()}

      {/* Support tab hint */}
      {activeTab === 'support' && filteredCrossUsers.length > 0 && (
        <p className="text-xs text-th-text-tertiary">
          Showing users with Support Portal access (Super Admin, Admin, Advisor, or Concierge roles).
        </p>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        suggestedUserType={
          activeTab === 'advisor'
            ? 'advisor'
            : activeTab === 'member'
              ? 'member'
              : 'admin_staff'
        }
        suggestedAdminRole={activeTab === 'concierge' ? 'concierge' : undefined}
        onSuccess={() => {
          if (activeTab === 'admin') loadAdminUsers();
          else if (activeTab === 'concierge') loadCrossPortalUsers('concierge');
          else if (activeTab === 'advisor') loadCrossPortalUsers('advisor');
          else if (activeTab === 'member') loadCrossPortalUsers('member');
          else loadCrossPortalUsers();
        }}
      />
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          loadAdminUsers();
        }}
      />

      {/* Delete User Modal (single) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteDialog}
          />
          <div className="relative bg-surface-primary rounded-2xl border border-th-border shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-th-text-primary">Delete User</h2>
                  <p className="text-sm text-th-text-tertiary">This action cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                aria-label="Close dialog"
                className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-surface-secondary rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-th-text-primary">{deleteTarget.name || deleteTarget.email}</p>
              <p className="text-sm text-th-text-tertiary">{deleteTarget.email}</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">
                This will permanently remove the user's login, admin profile, advisor profile,
                and all portal role assignments. Historical records referencing this user may be affected.
              </p>
            </div>

            <div>
              <label htmlFor="delete-confirm-email-list" className="block text-sm font-medium text-th-text-secondary mb-2">
                Type <span className="font-mono text-red-600 dark:text-red-400">{deleteTarget.email}</span> to confirm
              </label>
              <input
                id="delete-confirm-email-list"
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={deleteTarget.email}
                autoComplete="off"
                className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                className="px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={
                  deleting
                  || deleteConfirmEmail.trim().toLowerCase() !== deleteTarget.email.toLowerCase()
                }
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
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeBulkDelete}
          />
          <div className="relative bg-surface-primary rounded-2xl border border-th-border shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-th-text-primary">Delete Selected Users</h2>
                  <p className="text-sm text-th-text-tertiary">
                    {selectedIds.size} user(s) will be permanently removed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeBulkDelete}
                disabled={bulkDeleting}
                aria-label="Close dialog"
                className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!bulkDeleteResult ? (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    This permanently removes logins, admin profiles, advisor profiles, and all portal role
                    assignments for <strong>{selectedIds.size}</strong> user(s). This action cannot be undone.
                  </p>
                </div>

                <div>
                  <label htmlFor="bulk-delete-confirm" className="block text-sm font-medium text-th-text-secondary mb-2">
                    Type <span className="font-mono text-red-600 dark:text-red-400">DELETE</span> to confirm
                  </label>
                  <input
                    id="bulk-delete-confirm"
                    type="text"
                    value={bulkDeleteConfirm}
                    onChange={(e) => setBulkDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-th-text-primary placeholder-th-text-tertiary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeBulkDelete}
                    disabled={bulkDeleting}
                    className="px-4 py-2 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting || bulkDeleteConfirm.trim().toUpperCase() !== 'DELETE'}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bulkDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>{bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size}`}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <p className="text-2xl font-bold text-th-text-primary">{bulkDeleteResult.total}</p>
                    <p className="text-xs text-th-text-tertiary">Total</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{bulkDeleteResult.deleted}</p>
                    <p className="text-xs text-green-600">Deleted</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{bulkDeleteResult.failed}</p>
                    <p className="text-xs text-red-600">Failed</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeBulkDelete}
                    className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mass Password Reset Modal */}
      {showMassResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface-primary rounded-xl border border-th-border shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <div className="flex items-center space-x-3">
                <KeyRound className="w-5 h-5 text-th-accent-600" />
                <h2 className="text-lg font-semibold text-th-text-primary">Mass Password Reset</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMassResetModal(false)}
                aria-label="Close modal"
                className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!massResetResult ? (
                <>
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      This will send a password reset email to <strong>{selectedIds.size}</strong> selected user(s).
                      Each user will receive a branded email with a secure reset link.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMassResetModal(false)}
                      className="px-4 py-2 border border-th-border text-th-text-secondary rounded-lg hover:bg-surface-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleMassPasswordReset}
                      disabled={massResetLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
                    >
                      {massResetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{massResetLoading ? 'Sending...' : 'Send Reset Emails'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-surface-secondary rounded-lg">
                        <p className="text-2xl font-bold text-th-text-primary">{massResetResult.total}</p>
                        <p className="text-xs text-th-text-tertiary">Total</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{massResetResult.sent}</p>
                        <p className="text-xs text-green-600">Sent</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{massResetResult.errors}</p>
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowMassResetModal(false); setSelectedIds(new Set()); }}
                      className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
