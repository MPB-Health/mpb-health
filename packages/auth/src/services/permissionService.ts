// ============================================================================
// Permission Service — Checks org-scoped permissions for the current user
// ============================================================================

import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@mpbhealth/database';
import { withTimeout } from '@mpbhealth/utils';

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

interface OrgPermissionsSnapshotRpc {
  error?: string | null;
  membership?: { role: string } | null;
  permissions?: string[];
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

const QUERY_TIMEOUT_MS = 8_000;

async function loadUserPermissionsViaPostgrest(orgId: string): Promise<UserPermissionSet | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const membershipPromise = supabase
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single();

  const membershipResult = await withTimeout(
    Promise.resolve(membershipPromise) as Promise<PostgrestSingleResponse<{ role: string }>>,
    QUERY_TIMEOUT_MS,
    'membership lookup'
  );
  const { data: membership, error: memError } = membershipResult;

  if (memError || !membership) {
    console.error('[PermissionService] No active membership:', memError);
    return null;
  }

  const rolePermsPromise = supabase
    .from('role_permissions')
    .select(`
        permission:permissions!permission_id (key)
      `)
    .eq('org_id', orgId)
    .eq('role', membership.role);

  const rolePermsResult = await withTimeout(
    Promise.resolve(rolePermsPromise) as Promise<
      PostgrestResponse<{ permission: { key: string } | null }[]>
    >,
    QUERY_TIMEOUT_MS,
    'role permissions lookup'
  );
  const { data: rolePerms, error: rpError } = rolePermsResult;

  if (rpError) {
    console.error('[PermissionService] Failed to load permissions:', rpError);
    return null;
  }

  // Supabase nested select typing can infer an extra array dimension; normalize at runtime.
  const rows = (rolePerms ?? []) as unknown as { permission: { key: string } | null }[];
  const permissions = rows
    .map((rp) => rp.permission?.key)
    .filter((k): k is string => typeof k === 'string' && k.length > 0);

  return {
    orgId,
    role: membership.role,
    permissions,
  };
}

async function loadUserPermissionsFromSnapshotRpc(orgId: string): Promise<UserPermissionSet | null> {
  const rpcCall = supabase.rpc('get_my_org_permissions_snapshot', { p_org_id: orgId });
  const { data, error } = await withTimeout(
    Promise.resolve(rpcCall) as Promise<PostgrestSingleResponse<OrgPermissionsSnapshotRpc | null>>,
    QUERY_TIMEOUT_MS,
    'rpc_org_permissions_snapshot'
  );

  if (error) {
    console.warn('[PermissionService] RPC get_my_org_permissions_snapshot:', error.message);
    return null;
  }

  const snap = data as unknown as OrgPermissionsSnapshotRpc | null;
  if (!snap) return null;

  if (snap.error === 'not_authenticated' || snap.error === 'no_membership') {
    return null;
  }

  const role = snap.membership?.role;
  if (!role) return null;

  const raw = snap.permissions;
  const permissions = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === 'string' && k.length > 0)
    : [];

  return {
    orgId,
    role,
    permissions,
  };
}

/** Load the full permission set for the current user in a given org */
export async function loadUserPermissions(orgId: string): Promise<UserPermissionSet | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const key = cacheKey(user.id, orgId);
  const cached = permissionCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;

  let permSet: UserPermissionSet | null = null;
  try {
    permSet = await loadUserPermissionsFromSnapshotRpc(orgId);
  } catch (e) {
    console.warn('[PermissionService] Snapshot RPC failed, falling back to PostgREST', e);
  }
  if (!permSet) {
    permSet = await loadUserPermissionsViaPostgrest(orgId);
  }

  if (permSet) {
    permissionCache.set(key, { data: permSet, expiry: Date.now() + CACHE_TTL_MS });
  }
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
    .select('id, key, module, description')
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
