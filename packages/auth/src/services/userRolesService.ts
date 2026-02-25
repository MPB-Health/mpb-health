/**
 * User Roles Service - Manages role-based access control
 */

import { supabase } from '@mpbhealth/database';

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'super_admin' | 'admin' | 'advisor' | 'member' | 'crm_user';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  user_created_at: string;
  last_sign_in_at: string | null;
  roles: UserRole[];
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Role Definitions
// ============================================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  advisor: 'Advisor',
  member: 'Member',
  crm_user: 'CRM User',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full access to all portals (Admin, Advisor, Member, CRM)',
  admin: 'Access to Admin portal',
  advisor: 'Access to Advisor portal',
  member: 'Access to Member portal',
  crm_user: 'Access to CRM portal',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  advisor: 'bg-green-100 text-green-800 border-green-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200',
  crm_user: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'advisor', 'crm_user', 'member'];

// ============================================================================
// Cache
// ============================================================================

const rolesCache: Map<string, UserRole[]> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL;
}

function invalidateCache(userId?: string): void {
  if (userId) {
    rolesCache.delete(userId);
  } else {
    rolesCache.clear();
  }
  cacheTimestamp = 0;
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Check if the user_roles table exists
 */
export async function isRolesTableAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get all roles for a specific user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  // Check cache first
  if (isCacheValid() && rolesCache.has(userId)) {
    return rolesCache.get(userId) || [];
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.warn('Error fetching user roles:', error);
      return [];
    }

    const roles = (data || []).map((r) => r.role as UserRole);
    rolesCache.set(userId, roles);
    cacheTimestamp = Date.now();
    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

/**
 * Check if a user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'super_admin');
}

/**
 * Check if a user is an admin (admin or super_admin)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('admin') || roles.includes('super_admin');
}

/**
 * Check if a user is an advisor (advisor or super_admin)
 */
export async function isAdvisor(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('advisor') || roles.includes('super_admin');
}

/**
 * Get all users with their roles (for admin UI)
 */
export async function getAllUsersWithRoles(): Promise<UserWithRoles[]> {
  try {
    // Use the security definer RPC function
    const { data, error } = await supabase.rpc('get_all_users_with_roles');

    if (error) {
      console.warn('Error fetching users with roles via RPC:', error);

      // Fallback: get from user_roles and join manually (use explicit columns to avoid 400)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return [];
      }

      // Group by user_id
      const userRolesMap = new Map<string, UserRole[]>();
      for (const role of rolesData || []) {
        const existing = userRolesMap.get(role.user_id) || [];
        existing.push(role.role as UserRole);
        userRolesMap.set(role.user_id, existing);
      }

      // Convert to array format
      return Array.from(userRolesMap.entries()).map(([userId, roles]) => ({
        id: userId,
        email: userId, // We don't have email without the RPC
        full_name: null,
        user_created_at: new Date().toISOString(),
        last_sign_in_at: null,
        roles,
      }));
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      user_created_at: u.user_created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: (u.roles || []) as UserRole[],
    }));
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    return [];
  }
}

/**
 * Search users by email
 */
export async function searchUsersByEmail(email: string): Promise<UserWithRoles[]> {
  try {
    // Use the security definer RPC function
    const { data, error } = await supabase.rpc('search_users_with_roles', {
      search_email: email,
    });

    if (error) {
      console.error('Error searching users via RPC:', error);
      return [];
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      user_created_at: u.user_created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: (u.roles || []) as UserRole[],
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Grant a role to a user
 */
export async function grantRole(
  userId: string,
  role: UserRole,
  grantedBy?: string
): Promise<ServiceResult<UserRoleRecord>> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        granted_by: grantedBy || null,
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        return { success: false, error: 'User already has this role' };
      }
      return { success: false, error: error.message };
    }

    invalidateCache(userId);
    return { success: true, data };
  } catch (_error) {
    return { success: false, error: 'Failed to grant role' };
  }
}

/**
 * Revoke a role from a user
 */
export async function revokeRole(userId: string, role: UserRole): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache(userId);
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to revoke role' };
  }
}

/**
 * Set all roles for a user (replaces existing roles)
 */
export async function setUserRoles(
  userId: string,
  roles: UserRole[],
  grantedBy?: string
): Promise<ServiceResult<void>> {
  try {
    // Delete all existing roles
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Insert new roles
    if (roles.length > 0) {
      const { error: insertError } = await supabase.from('user_roles').insert(
        roles.map((role) => ({
          user_id: userId,
          role,
          granted_by: grantedBy || null,
        }))
      );

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    invalidateCache(userId);
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to set roles' };
  }
}

/**
 * Toggle a specific role for a user
 */
export async function toggleRole(
  userId: string,
  role: UserRole,
  grantedBy?: string
): Promise<ServiceResult<boolean>> {
  const currentRoles = await getUserRoles(userId);
  const hasRoleNow = currentRoles.includes(role);

  if (hasRoleNow) {
    const result = await revokeRole(userId, role);
    return { success: result.success, data: false, error: result.error };
  } else {
    const result = await grantRole(userId, role, grantedBy);
    return { success: result.success, data: true, error: result.error };
  }
}

// ============================================================================
// Portal Access Checks
// ============================================================================

/**
 * Check if a user is a CRM user (crm_user or super_admin)
 */
export async function isCrmUser(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('crm_user') || roles.includes('super_admin');
}

/**
 * Check if user can access admin portal
 */
export async function canAccessAdminPortal(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('super_admin') || roles.includes('admin');
}

/**
 * Check if user can access advisor portal
 */
export async function canAccessAdvisorPortal(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('super_admin') || roles.includes('advisor');
}

/**
 * Check if user can access CRM portal
 */
export async function canAccessCrmPortal(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('super_admin') || roles.includes('crm_user');
}

/**
 * Check if user can access member portal
 */
export async function canAccessMemberPortal(_userId: string): Promise<boolean> {
  // All authenticated users can access member portal
  return true;
}

/**
 * Get all portals a user can access
 */
export async function getAccessiblePortals(userId: string): Promise<string[]> {
  const roles = await getUserRoles(userId);
  const portals: string[] = ['member']; // Everyone gets member access

  if (roles.includes('super_admin')) {
    portals.push('admin', 'advisor', 'crm');
  } else {
    if (roles.includes('admin')) portals.push('admin');
    if (roles.includes('advisor')) portals.push('advisor');
    if (roles.includes('crm_user')) portals.push('crm');
  }

  return portals;
}

// ============================================================================
// Export as namespace
// ============================================================================

export const userRolesService = {
  isRolesTableAvailable,
  getUserRoles,
  hasRole,
  isSuperAdmin,
  isAdmin,
  isAdvisor,
  isCrmUser,
  getAllUsersWithRoles,
  searchUsersByEmail,
  grantRole,
  revokeRole,
  setUserRoles,
  toggleRole,
  canAccessAdminPortal,
  canAccessAdvisorPortal,
  canAccessCrmPortal,
  canAccessMemberPortal,
  getAccessiblePortals,
  invalidateCache,
};
