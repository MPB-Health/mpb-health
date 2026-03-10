import { supabase } from '@mpbhealth/database';
import type { AdminUser, Role, Permission } from '../types';

export interface CrossPortalUser {
  id: string;
  email: string;
  full_name: string | null;
  user_created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

export interface AdvisorProfileSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  agent_id: string | null;
  company_name: string | null;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  specialization: string;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
}

export type PortalRole = 'super_admin' | 'admin' | 'advisor' | 'member' | 'crm_user';

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
      .maybeSingle();

    if (error) throw error;
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
      .order('module', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get permissions grouped by module
  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    return permissions.reduce(
      (acc, perm) => {
        const key = perm.module || 'general';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(perm);
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

  // ── Cross-portal user management ────────────────────────────────────────────

  /** All auth users with their roles across portals (uses SECURITY DEFINER RPC) */
  async getCrossPortalUsers(filters?: {
    role?: PortalRole;
    search?: string;
  }): Promise<CrossPortalUser[]> {
    // Use search RPC when a search term is provided, otherwise get all
    const rpcName = filters?.search
      ? 'search_users_with_roles'
      : 'get_all_users_with_roles';
    const rpcArgs = filters?.search
      ? { search_email: filters.search }
      : {};

    const { data, error } = await supabase.rpc(rpcName, rpcArgs);
    if (error) throw error;

    let users = (data || []) as CrossPortalUser[];

    // Filter by role client-side (array contains)
    if (filters?.role) {
      users = users.filter((u) => u.roles.includes(filters.role!));
    }

    return users;
  }

  /** All roles assigned to a user */
  async getUserRoles(userId: string): Promise<{ id: string; role: PortalRole; created_at: string }[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, role, created_at')
      .eq('user_id', userId)
      .order('role', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /** Advisor profile for a given auth user ID */
  async getAdvisorProfile(userId: string): Promise<AdvisorProfileSummary | null> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('id, first_name, last_name, email, agent_id, company_name, status, specialization, onboarding_completed, onboarding_completed_at, created_at')
      .eq('id', userId)
      .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
  }

  /** Assign a portal role to a user (super_admin only, via SECURITY DEFINER RPC) */
  async assignRole(userId: string, role: PortalRole): Promise<void> {
    const { data, error } = await supabase.rpc('assign_user_role', {
      target_user_id: userId,
      target_role: role,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.message || 'Failed to assign role');
  }

  /** Remove a portal role from a user (super_admin only, via SECURITY DEFINER RPC) */
  async removeRole(userId: string, role: PortalRole): Promise<void> {
    const { data, error } = await supabase.rpc('remove_user_role', {
      target_user_id: userId,
      target_role: role,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.message || 'Failed to remove role');
  }

  /** Single cross-portal user by ID (via SECURITY DEFINER RPC) */
  async getCrossPortalUser(userId: string): Promise<CrossPortalUser | null> {
    const { data, error } = await supabase.rpc('get_user_with_roles', {
      target_user_id: userId,
    });
    if (error) throw error;

    const users = (data || []) as CrossPortalUser[];
    return users[0] ?? null;
  }

  /** Send a password reset email via Supabase Auth (redirects to advisor portal) */
  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://advisor.mpb.health/reset-password',
    });
    if (error) throw error;
  }

  /** Directly set a new password for a user (super_admin only — calls admin-update-password edge function) */
  async setUserPassword(userId: string, password: string): Promise<void> {
    const { error } = await supabase.functions.invoke('admin-update-password', {
      body: { userId, password },
    });
    if (error) throw error;
  }

  /** Update advisor profile status */
  async updateAdvisorProfileStatus(userId: string, status: AdvisorProfileSummary['status']): Promise<void> {
    const { error } = await supabase
      .from('advisor_profiles')
      .update({ status })
      .eq('id', userId);
    if (error) throw error;
  }

  /** Update advisor profile fields */
  async updateAdvisorProfile(
    userId: string,
    updates: Partial<Pick<AdvisorProfileSummary, 'first_name' | 'last_name' | 'email' | 'agent_id' | 'company_name' | 'specialization'>>
  ): Promise<AdvisorProfileSummary> {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, first_name, last_name, email, agent_id, company_name, status, specialization, onboarding_completed, onboarding_completed_at, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  /** List advisor profiles with optional search (by name, email, or agent_id) */
  async getAdvisorProfiles(search?: string): Promise<AdvisorProfileSummary[]> {
    let query = supabase
      .from('advisor_profiles')
      .select('id, first_name, last_name, email, agent_id, company_name, status, specialization, onboarding_completed, onboarding_completed_at, created_at')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,agent_id.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /** Resend welcome/invite email to a single advisor via send-advisor-invites edge function */
  async resendAdvisorInvite(advisorId: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.functions.invoke('send-advisor-invites', {
      body: { advisor_ids: [advisorId], password },
    });
    if (error) throw error;
    return data;
  }

  /** Bulk status update on admin_users */
  async bulkUpdateStatus(userIds: string[], status: AdminUser['status']): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .update({ status })
      .in('id', userIds);

    if (error) throw error;
  }
}

export const userService = new UserService();
