// ============================================================================
// Organization Service — Manages orgs, memberships, and org context
// ============================================================================

import { supabase } from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrgRole = 'owner' | 'admin' | 'manager' | 'agent' | 'member';
export type OrgMembershipStatus = 'active' | 'invited' | 'suspended' | 'removed';

export interface Org {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logo_url?: string | null;
  settings: Record<string, unknown>;
  status: 'active' | 'suspended' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface OrgMembership {
  id: string;
  user_id: string;
  org_id: string;
  role: OrgRole;
  status: OrgMembershipStatus;
  invited_by?: string | null;
  invited_at?: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrgWithMembership extends Org {
  membership: OrgMembership;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_ORG_ID = '00000000-0000-4000-a000-000000000001';

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  agent: 'Agent',
  member: 'Member',
};

export const ORG_ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  agent: 2,
  member: 1,
};

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const orgCache = new Map<string, CacheEntry<Org>>();
const membershipCache = new Map<string, CacheEntry<OrgWithMembership[]>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data;
  cache.delete(key);
  return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/** Get all orgs the current user is a member of */
export async function getUserOrgs(): Promise<OrgWithMembership[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const cached = getCached(membershipCache, user.id);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('org_memberships')
    .select(`
      id, user_id, org_id, role, status, invited_by, invited_at, joined_at, created_at, updated_at,
      org:orgs!org_id (id, name, slug, domain, logo_url, settings, status, created_at, updated_at)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) {
    console.error('[OrgService] Failed to get user orgs:', error);
    return [];
  }

  const results: OrgWithMembership[] = (data || []).map((row: any) => ({
    ...row.org,
    membership: {
      id: row.id,
      user_id: row.user_id,
      org_id: row.org_id,
      role: row.role,
      status: row.status,
      invited_by: row.invited_by,
      invited_at: row.invited_at,
      joined_at: row.joined_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  }));

  setCache(membershipCache, user.id, results);
  return results;
}

/** Get a single org by ID */
export async function getOrg(orgId: string): Promise<Org | null> {
  const cached = getCached(orgCache, orgId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) {
    console.error('[OrgService] Failed to get org:', error);
    return null;
  }

  setCache(orgCache, orgId, data);
  return data;
}

/** Get current user's role in a given org */
export async function getUserOrgRole(orgId: string): Promise<OrgRole | null> {
  const orgs = await getUserOrgs();
  const match = orgs.find((o) => o.id === orgId);
  return match?.membership.role ?? null;
}

/** Get members of an org */
export async function getOrgMembers(orgId: string): Promise<OrgMembership[]> {
  const { data, error } = await supabase
    .from('org_memberships')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('role', { ascending: true });

  if (error) {
    console.error('[OrgService] Failed to get org members:', error);
    return [];
  }

  return data || [];
}

/** Invite a user to an org */
export async function inviteMember(
  orgId: string,
  userId: string,
  role: OrgRole
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('org_memberships')
    .insert({
      user_id: userId,
      org_id: orgId,
      role,
      status: 'invited',
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(user.id);
  return { success: true };
}

/** Update a member's role */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: OrgRole
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('org_memberships')
    .update({ role: newRole })
    .eq('org_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(userId);
  return { success: true };
}

/** Remove a member from an org */
export async function removeMember(
  orgId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('org_memberships')
    .update({ status: 'removed' })
    .eq('org_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(userId);
  return { success: true };
}

/** Invalidate cache for a user */
export function invalidateCache(userId?: string): void {
  if (userId) {
    membershipCache.delete(userId);
  } else {
    membershipCache.clear();
  }
  orgCache.clear();
}

// Bundle as a namespace-like object for convenience
export const orgService = {
  getUserOrgs,
  getOrg,
  getUserOrgRole,
  getOrgMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  invalidateCache,
  DEFAULT_ORG_ID,
};
