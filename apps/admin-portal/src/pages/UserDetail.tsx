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
} from 'lucide-react';
import { userService, type AdminUser, type Permission } from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();
  const [user, setUser] = useState<AdminUser | null>(null);
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

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      try {
        const [userData, permsData] = await Promise.all([
          userService.getUser(userId),
          userService.getPermissionsByCategory(),
        ]);
        setUser(userData);
        setPermissions(permsData);
        if (userData) {
          setFormData({
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            permissions: userData.permissions,
          });
        }
      } catch (err) {
        toast.error('Failed to load user');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, navigate]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const updated = await userService.updateUser(userId, formData);
      setUser(updated);
      setEditMode(false);
      toast.success('User updated!');
    } catch (err) {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!userId || !user) return;

    try {
      const updated = await userService.suspendUser(userId);
      setUser(updated);
      toast.success('User suspended');
    } catch (err) {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivate = async () => {
    if (!userId || !user) return;

    try {
      const updated = await userService.activateUser(userId);
      setUser(updated);
      toast.success('User activated');
    } catch (err) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">User not found</p>
        <button
          onClick={() => navigate('/users')}
          className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/users')}
        className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Users</span>
      </button>

      {/* User header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-neutral-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {user.first_name} {user.last_name}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-500">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user.status === 'active' ? (
              <button
                onClick={handleSuspend}
                disabled={!isSuperAdmin}
                className="flex items-center space-x-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <UserX className="w-4 h-4" />
                <span>Suspend</span>
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={!isSuperAdmin}
                className="flex items-center space-x-2 px-4 py-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Activate</span>
              </button>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center space-x-4 mt-4">
          <span
            className={`px-3 py-1 text-sm rounded-full capitalize ${
              user.status === 'active'
                ? 'bg-green-100 text-green-700'
                : user.status === 'suspended'
                ? 'bg-red-100 text-red-700'
                : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {user.status}
          </span>
          <span className="px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-700 capitalize">
            {user.role.replace('_', ' ')}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex items-center space-x-6 mt-4 text-sm text-neutral-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              Last login:{' '}
              {user.last_login_at
                ? new Date(user.last_login_at).toLocaleDateString()
                : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">User Details</h2>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              disabled={!isSuperAdmin}
              className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              disabled={!editMode}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              disabled={!editMode}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as AdminUser['role'] })
              }
              disabled={!editMode}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
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
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-5 h-5 text-neutral-500" />
          <h2 className="text-lg font-semibold text-neutral-900">Permissions</h2>
        </div>

        {formData.role === 'super_admin' ? (
          <p className="text-neutral-500">
            Super admins have all permissions by default.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(permissions).map(([category, perms]) => (
              <div key={category}>
                <h3 className="font-medium text-neutral-900 capitalize mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.name)}
                        onChange={() => togglePermission(perm.name)}
                        disabled={!editMode}
                        className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          {perm.name}
                        </p>
                        <p className="text-xs text-neutral-500">{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
