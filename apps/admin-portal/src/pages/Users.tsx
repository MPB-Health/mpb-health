import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { userService, type AdminUser } from '@mpbhealth/admin-core';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await userService.getUsers({
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        });
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  const getRoleColor = (role: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-surface-tertiary text-th-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Users</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage admin users and their permissions
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
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
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-th-text-tertiary" />
          <select
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
      </div>

      {/* Users table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
          </div>
        ) : users.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Last Login
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-tertiary cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-surface-tertiary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-th-text-secondary">
                            {user.first_name[0]}
                            {user.last_name[0]}
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
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-th-text-tertiary">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu
                      }}
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
    </div>
  );
}
