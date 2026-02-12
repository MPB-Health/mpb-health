// ============================================================================
// Organization Service — Manages orgs, memberships, and org context
// ============================================================================

import { supabase } from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrgRole = 'owner' | 'admin' | 'manager' | 'advisor';
export type OrgMembershipStatus = 'active' | 'invited' | 'suspended' | 'left';

export interface Org {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  brand_config: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
  settings: {
    timezone?: string;
    dateFormat?: string;
    features?: Record<string, boolean>;
  };
  subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'suspended';
  max_users: number;
  max_contacts: number;
  max_sequences: number;
  created_at: string;
  updated_at: string;
}

export interface OrgMembership {
  id: string;
  user_id: string;
  org_id: string;
  role: OrgRole;
  status: OrgMembershipStatus;
  permissions_override?: Record<string, boolean> | null;
  joined_at: string;
  suspended_at?: string | null;
  suspended_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgWithMembership extends Org {
  membership: OrgMembership;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Default MPB Health org IDs (two tables exist due to migration history)
// The `orgs` table (phase0 migration) uses one ID, `organizations` table (champion) uses another
export const DEFAULT_ORG_ID = '00000000-0000-4000-a000-000000000001';
export const DEFAULT_ORG_ID_ALT = 'a0000000-0000-0000-0000-000000000001';

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  advisor: 'Advisor',
};

export const ORG_ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  advisor: 1,
};

// Permission helpers based on role
export const ORG_ROLE_PERMISSIONS: Record<OrgRole, string[]> = {
  owner: ['manage_org', 'manage_billing', 'manage_users', 'manage_settings', 'manage_templates', 'manage_sequences', 'view_reports', 'manage_compliance'],
  admin: ['manage_users', 'manage_settings', 'manage_templates', 'manage_sequences', 'view_reports', 'manage_compliance'],
  manager: ['manage_templates', 'manage_sequences', 'view_reports', 'assign_leads'],
  advisor: ['view_own_data', 'send_messages'],
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

  // Step 1: Fetch the user's active memberships
  // Note: Only select columns that exist in the actual table (phase0 schema).
  // The champion migration's extra columns (permissions_override, suspended_at,
  // suspended_reason) were never applied because the table already existed.
  const { data: memberships, error: membershipError } = await supabase
    .from('org_memberships')
    .select('id, user_id, org_id, role, status, joined_at, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (membershipError) {
    console.error('[OrgService] Failed to get user memberships:', membershipError);
    return [];
  }

  if (!memberships || memberships.length === 0) return [];

  // Step 2: Fetch the organizations for those memberships
  // Note: org_memberships may reference either the `organizations` table or the
  // legacy `orgs` table depending on which migration created the FK. We query
  // both tables and merge to handle either case.
  const orgIds = memberships.map((m) => m.org_id);

  const [orgResult, legacyOrgResult] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, logo_url, brand_config, settings, subscription_tier, subscription_status, max_users, max_contacts, max_sequences, created_at, updated_at')
      .in('id', orgIds),
    supabase
      .from('orgs')
      .select('id, name, slug, logo_url, settings, created_at, updated_at')
      .in('id', orgIds),
  ]);

  // Build a unified map — prefer `organizations` data when available
  const orgMap = new Map<string, any>();

  // Add legacy orgs first (with defaults for missing fields)
  for (const o of (legacyOrgResult.data || [])) {
    orgMap.set(o.id, {
      ...o,
      brand_config: { primaryColor: '#0D9488', accentColor: '#14B8A6' },
      subscription_tier: 'enterprise',
      subscription_status: 'active',
      max_users: 1000,
      max_contacts: 100000,
      max_sequences: 1000,
    });
  }

  // Override with organizations data (richer schema)
  for (const o of (orgResult.data || [])) {
    orgMap.set(o.id, o);
  }
  const results: OrgWithMembership[] = [];
  for (const row of memberships) {
    const org = orgMap.get(row.org_id);
    if (!org) continue;
    results.push({
      ...(org as Omit<Org, 'membership'>),
      membership: {
        id: row.id,
        user_id: row.user_id,
        org_id: row.org_id,
        role: row.role as OrgRole,
        status: row.status as OrgMembershipStatus,
        permissions_override: (row as any).permissions_override ?? null,
        joined_at: row.joined_at,
        suspended_at: (row as any).suspended_at ?? null,
        suspended_reason: (row as any).suspended_reason ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });
  }

  setCache(membershipCache, user.id, results);
  return results;
}

/** Get a single org by ID */
export async function getOrg(orgId: string): Promise<Org | null> {
  const cached = getCached(orgCache, orgId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('organizations')
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

/** Invite a user to an org by email */
export async function inviteMember(
  orgId: string,
  email: string,
  role: OrgRole
): Promise<{ success: boolean; error?: string; inviteToken?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Create invite record
  const { data, error } = await supabase
    .from('org_invites')
    .insert({
      org_id: orgId,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
      status: 'pending',
    })
    .select('token')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, inviteToken: data?.token };
}

/** Add a user directly to an org (for existing users) */
export async function addMember(
  orgId: string,
  userId: string,
  role: OrgRole
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('org_memberships')
    .insert({
      user_id: userId,
      org_id: orgId,
      role,
      status: 'active',
      joined_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(userId);
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
    .update({ status: 'left' })
    .eq('org_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(userId);
  return { success: true };
}

/** Suspend a member */
export async function suspendMember(
  orgId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('org_memberships')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspended_reason: reason,
    })
    .eq('org_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(userId);
  return { success: true };
}

/** Accept an org invite */
export async function acceptInvite(token: string): Promise<{ success: boolean; error?: string; orgId?: string }> {
  const { data, error } = await supabase.rpc('accept_org_invite', { invite_token: token });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return { success: false, error: data?.error || 'Failed to accept invite' };
  }

  invalidateCache();
  return { success: true, orgId: data.org_id };
}

/** Create a new organization */
export async function createOrg(
  name: string,
  slug: string
): Promise<{ success: boolean; error?: string; orgId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('create_organization_with_owner', {
    org_name: name,
    org_slug: slug,
    owner_user_id: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateCache(user.id);
  return { success: true, orgId: data };
}

/** Check if user has a specific role or higher */
export function hasRoleOrHigher(userRole: OrgRole | null, requiredRole: OrgRole): boolean {
  if (!userRole) return false;
  return ORG_ROLE_HIERARCHY[userRole] >= ORG_ROLE_HIERARCHY[requiredRole];
}

/** Check if user has a permission based on their role */
export function hasPermission(userRole: OrgRole | null, permission: string): boolean {
  if (!userRole) return false;
  return ORG_ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
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
  addMember,
  updateMemberRole,
  removeMember,
  suspendMember,
  acceptInvite,
  createOrg,
  hasRoleOrHigher,
  hasPermission,
  invalidateCache,
  DEFAULT_ORG_ID,
  ORG_ROLE_LABELS,
  ORG_ROLE_HIERARCHY,
  ORG_ROLE_PERMISSIONS,
};
