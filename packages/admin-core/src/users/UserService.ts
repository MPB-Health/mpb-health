import { supabase } from '@mpbhealth/database';
import type { AdminUser, Role, Permission } from '../types';

export class UserService {
  // Get all users with optional filters
  async getUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<AdminUser[]> {
    let query = supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single user by ID
  async getUser(userId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Create a new user
  async createUser(
    user: Omit<AdminUser, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>
  ): Promise<AdminUser> {
    const { data, error } = await supabase
      .from('admin_users')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update a user
  async updateUser(
    userId: string,
    updates: Partial<Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AdminUser> {
    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a user (soft delete by setting status to inactive)
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .update({ status: 'inactive' })
      .eq('id', userId);

    if (error) throw error;
  }

  // Suspend a user
  async suspendUser(userId: string): Promise<AdminUser> {
    return this.updateUser(userId, { status: 'suspended' });
  }

  // Activate a user
  async activateUser(userId: string): Promise<AdminUser> {
    return this.updateUser(userId, { status: 'active' });
  }

  // Update user role
  async updateUserRole(userId: string, role: AdminUser['role']): Promise<AdminUser> {
    return this.updateUser(userId, { role });
  }

  // Update user permissions
  async updateUserPermissions(
    userId: string,
    permissions: string[]
  ): Promise<AdminUser> {
    return this.updateUser(userId, { permissions });
  }

  // Get all roles
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get permissions by category
  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    return permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
      },
      {} as Record<string, Permission[]>
    );
  }

  // Check if user has permission
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Super admins have all permissions
    if (user.role === 'super_admin') return true;

    return user.permissions.includes(permission);
  }

  // Get user stats
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: Record<string, number>;
  }> {
    const users = await this.getUsers();

    const stats = {
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      inactive: users.filter((u) => u.status === 'inactive').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      byRole: {} as Record<string, number>,
    };

    users.forEach((user) => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  }

  // Record login
  async recordLogin(userId: string): Promise<void> {
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
  }
}

export const userService = new UserService();
