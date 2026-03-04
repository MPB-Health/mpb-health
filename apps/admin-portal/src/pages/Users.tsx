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
} from 'lucide-react';
import {
  userService,
  type AdminUser,
  type CrossPortalUser,
  type PortalRole,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';
import AddUserModal from '../components/AddUserModal';
import InviteUserModal from '../components/InviteUserModal';

type PortalTab = 'admin' | 'advisor' | 'member' | 'all';

const PORTAL_TABS: { id: PortalTab; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'member', label: 'Member' },
  { id: 'all', label: 'All Portals' },
];

const PORTAL_ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advisor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  crm_user: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  member: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
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
  // Cross-portal users (via get_all_users_with_roles RPC)
  const [crossUsers, setCrossUsers] = useState<CrossPortalUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bulk selection (admin tab only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

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
    } else if (activeTab === 'member') {
      loadCrossPortalUsers('member');
    } else {
      loadCrossPortalUsers();
    }
  }, [activeTab, searchQuery, roleFilter, statusFilter, loadAdminUsers, loadCrossPortalUsers]);

  // ── Bulk actions ────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === adminUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(adminUsers.map((u) => u.id)));
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

  // ── Render helpers ──────────────────────────────────────────────────────────

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
              {isSuperAdmin && (
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="Select all"
                    className="text-th-text-tertiary hover:text-th-text-primary"
                  >
                    {selectedIds.size === adminUsers.length && adminUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}
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
                {isSuperAdmin && (
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleSelect(user.id)}
                      aria-label={`Select ${user.first_name} ${user.last_name}`}
                      className="text-th-text-tertiary hover:text-th-text-primary"
                    >
                      {selectedIds.has(user.id) ? (
                        <CheckSquare className="w-4 h-4 text-th-accent-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                )}
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
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); }}
                    aria-label="User actions"
                    className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
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

  const renderCrossPortalTable = () => (
    <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      ) : crossUsers.length > 0 ? (
        <table className="w-full">
          <thead className="bg-surface-secondary border-b border-th-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Portal Roles</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Joined</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">Last Login</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border-subtle">
            {crossUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-surface-tertiary cursor-pointer"
                onClick={() => navigate(`/users/${user.id}`)}
              >
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
                <td className="py-3 px-4 text-sm text-th-text-tertiary">
                  {new Date(user.user_created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-th-text-tertiary">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/users/${user.id}`); }}
                    aria-label="View user details"
                    className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
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
          {/* Bulk actions (admin tab only, super_admin only) */}
          {activeTab === 'admin' && isSuperAdmin && selectedIds.size > 0 && (
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
                <div className="absolute right-0 mt-1 w-40 bg-surface-primary border border-th-border rounded-lg shadow-lg z-10">
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
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
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

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadAdminUsers();
        }}
      />
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
