// ============================================================================
// Permission Service — Checks org-scoped permissions for the current user
// ============================================================================

import { supabase } from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Permission {
  id: string;
  key: string;
  module: string;
  description: string | null;
}

export interface UserPermissionSet {
  orgId: string;
  role: string;
  permissions: string[];
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 2 * 60 * 1000;

interface CacheEntry {
  data: UserPermissionSet;
  expiry: number;
}

const permissionCache = new Map<string, CacheEntry>();

function cacheKey(userId: string, orgId: string): string {
  return `${userId}:${orgId}`;
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/** Race a promise against a timeout. Returns the promise result or throws on timeout. */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`[PermissionService] ${label} timed out after ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

const QUERY_TIMEOUT_MS = 8_000;

/** Load the full permission set for the current user in a given org */
export async function loadUserPermissions(orgId: string): Promise<UserPermissionSet | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const key = cacheKey(user.id, orgId);
  const cached = permissionCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;

  // Get the user's role in this org
  const { data: membership, error: memError } = await withTimeout(
    supabase
      .from('org_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single(),
    QUERY_TIMEOUT_MS,
    'membership lookup',
  );

  if (memError || !membership) {
    console.error('[PermissionService] No active membership:', memError);
    return null;
  }

  // Get all permission keys for that role in this org
  const { data: rolePerms, error: rpError } = await withTimeout(
    supabase
      .from('role_permissions')
      .select(`
        permission:permissions!permission_id (key)
      `)
      .eq('org_id', orgId)
      .eq('role', membership.role),
    QUERY_TIMEOUT_MS,
    'role permissions lookup',
  );

  if (rpError) {
    console.error('[PermissionService] Failed to load permissions:', rpError);
    return null;
  }

  const permSet: UserPermissionSet = {
    orgId,
    role: membership.role,
    permissions: (rolePerms || []).map((rp: any) => rp.permission?.key).filter(Boolean),
  };

  permissionCache.set(key, { data: permSet, expiry: Date.now() + CACHE_TTL_MS });
  return permSet;
}

/** Check if current user has a specific permission in an org */
export async function hasPermission(orgId: string, permissionKey: string): Promise<boolean> {
  const permSet = await loadUserPermissions(orgId);
  if (!permSet) return false;
  return permSet.permissions.includes(permissionKey);
}

/** Check if current user has ANY of the given permissions */
export async function hasAnyPermission(orgId: string, permissionKeys: string[]): Promise<boolean> {
  const permSet = await loadUserPermissions(orgId);
  if (!permSet) return false;
  return permissionKeys.some((key) => permSet.permissions.includes(key));
}

/** Check if current user has ALL of the given permissions */
export async function hasAllPermissions(orgId: string, permissionKeys: string[]): Promise<boolean> {
  const permSet = await loadUserPermissions(orgId);
  if (!permSet) return false;
  return permissionKeys.every((key) => permSet.permissions.includes(key));
}

/** Get all available permission definitions */
export async function getAllPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('module', { ascending: true });

  if (error) {
    console.error('[PermissionService] Failed to load permission definitions:', error);
    return [];
  }

  return data || [];
}

/** Invalidate permission cache */
export function invalidatePermissionCache(orgId?: string): void {
  if (orgId) {
    for (const key of permissionCache.keys()) {
      if (key.endsWith(`:${orgId}`)) {
        permissionCache.delete(key);
      }
    }
  } else {
    permissionCache.clear();
  }
}

// Bundled export
export const permissionService = {
  loadUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  invalidatePermissionCache,
};
